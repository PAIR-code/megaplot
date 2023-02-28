/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @fileoverview Defines the runTextureSync() method of SceneInternal. Texture
 * sync is the operation in which values from CPU memory are flashed to the GPU
 * for future rendering.
 */

import REGL from 'regl';

import {AttributeMapper} from '../attribute-mapper';
import {InternalError} from '../internal-error';
import {LifecyclePhase} from '../lifecycle-phase';
import {NumericRange} from '../numeric-range';
import {SpriteImpl} from '../sprite-impl';
import {InternalPropertiesSymbol} from '../symbols';

/**
 * To avoid circular imports, this file cannot depend on scene-internal.ts so
 * here we define the minimum necessary API surface that the runTextureSync
 * implementation needs to operate.
 */
interface CoordinatorAPI {
  attributeMapper: AttributeMapper;
  callbacksIndexRange: NumericRange;
  elapsedTimeMs: () => number;
  needsRebaseIndexRange: NumericRange;
  needsTextureSyncIndexRange: NumericRange;
  queueAssignWaiting: () => void;
  queueDraw: () => void;
  queueRebase: () => void;
  queueRemovalTask: () => void;
  queueRunCallbacks: () => void;
  queueTextureSync: () => void;
  removedIndexRange: NumericRange;
  removeSprite: (sprite: SpriteImpl) => void;
  sprites: SpriteImpl[];
  targetValuesArray: Float32Array;
  targetValuesTexture: REGL.Texture2D;
  toBeRemovedIndexRange: NumericRange;
  toBeRemovedTsRange: NumericRange;
  waitingSprites: SpriteImpl[];
}

/**
 * Given a range, return a new range that expands to the edges of the nearest
 * swatch row on both sides.
 */
function getSwatchRowExpandedRange(
    inputRange: NumericRange,
    swatchesPerRow: number,
    ): NumericRange {
  const expandedRange = new NumericRange();
  if (!inputRange.isDefined) {
    return expandedRange;
  }
  const {lowBound, highBound} = inputRange;
  const lowRow = Math.floor(lowBound / swatchesPerRow);
  const highRow = Math.floor(highBound / swatchesPerRow) + 1;
  expandedRange.expandToInclude(lowRow * swatchesPerRow);
  expandedRange.expandToInclude(highRow * swatchesPerRow - 1);
  return expandedRange;
}

/**
 * Iterate through the Sprites and push data into the data texture.
 */
export function runTextureSync(coordinator: CoordinatorAPI): void {
  // Short-circuit of there are no dirty indices to update.
  if (!coordinator.needsTextureSyncIndexRange.isDefined) {
    throw new InternalError('No sprites are in need of texture sync');
  }

  const {swatchesPerRow, textureWidth, valuesPerRow} =
      coordinator.attributeMapper;

  // Check to see if there's a collision between the block of sprites whose
  // texture data would be sync'd and sprites that are waiting for a rebase
  // operation.
  if (coordinator.needsRebaseIndexRange.isDefined) {
    const rebaseRowRange = getSwatchRowExpandedRange(
        coordinator.needsRebaseIndexRange,
        swatchesPerRow,
    );
    const syncRowRange = getSwatchRowExpandedRange(
        coordinator.needsTextureSyncIndexRange,
        swatchesPerRow,
    );

    if (syncRowRange.overlaps(rebaseRowRange)) {
      // Since there was a collision, the safe thing to do is schedule a
      // rebase operation, and then make another attempt at texture sync.
      coordinator.queueRebase();
      coordinator.queueTextureSync();
      return;
    }
  }

  const {lowBound, highBound} = coordinator.needsTextureSyncIndexRange;

  const lowRow = Math.floor(lowBound / swatchesPerRow);
  const highRow = Math.floor(highBound / swatchesPerRow) + 1;
  const rowHeight = highRow - lowRow;

  const dataView = coordinator.targetValuesArray.subarray(
      lowRow * valuesPerRow, highRow * valuesPerRow);

  // Keep track of whether any sprites have a callback to invoke.
  let anyHasCallback = false;

  // Keep track of whether any sprites are ready to be removed.
  let anyToBeRemoved = false;

  // Use an unchanging current time reference to reduce function calls.
  const currentTimeMs = coordinator.elapsedTimeMs();

  // Since we're performing on whole rows, the bounds of this loop have to
  // cover them.
  const lowIndex = lowRow * swatchesPerRow;
  const highIndex =
      Math.min(highRow * swatchesPerRow - 1, coordinator.sprites.length - 1);

  for (let index = lowIndex; index <= highIndex; index++) {
    const sprite = coordinator.sprites[index];
    const properties = sprite[InternalPropertiesSymbol];

    if (properties.lifecyclePhase === LifecyclePhase.NeedsRebase) {
      // Somehow a sprite in the NeedsRebase lifecycle phase made it into this
      // loop. It would be an error to sync its values to the texture because
      // doing so would destroy the information that the rebase command needs
      // to determine the intermediate attribute values and deltas.
      throw new InternalError(
          'Sprite is in the wrong lifecycle phase for sync');
    }

    if (properties.lifecyclePhase !== LifecyclePhase.NeedsTextureSync) {
      // This sprite was a passive participant in the texture sync operation.
      // Its blob/array swatch and texture swatch were already sync'd.
      continue;
    }

    if (!properties.spriteView) {
      // Indicates a bug in Megaplot. Any Sprite in the NeedsTextureSync
      // lifecycle phase ought to have been allocated a swatch and thus a
      // SpriteView to update it.
      throw new InternalError(
          'Sprite queued for texture sync lacks a SpriteView');
    }

    if (properties.hasCallback) {
      // If the sprite has any pending callbacks, then the correct next
      // phase is HasCallback, and we'll need to queue a run.
      anyHasCallback = true;
      properties.lifecyclePhase = LifecyclePhase.HasCallback;
      coordinator.callbacksIndexRange.expandToInclude(index);
      continue;
    }

    if (!properties.toBeRemoved) {
      // Sprite has no callbacks, but was not slated for removal, so return to
      // Rest phase and continue.
      properties.lifecyclePhase = LifecyclePhase.Rest;
      continue;
    }

    // The sprite was slated for removal. How to proceed depends on
    // whether it has more time left before its target arrival time.

    if (properties.zeroed &&
        properties.spriteView.TransitionTimeMs <= currentTimeMs) {
      // The sprite was slated for removal, has had its values reset to zero,
      // and its time has expired. Return its swatch for future reuse.
      coordinator.removeSprite(sprite);
      continue;
    }

    // At this point, the sprite was slated for removal, but its time is not
    // up yet. So we return it to the Rest phase, but add it to the removal
    // ranges so that it can be revisited later.
    anyToBeRemoved = true;
    properties.lifecyclePhase = LifecyclePhase.Rest;
    coordinator.toBeRemovedIndexRange.expandToInclude(index);
    coordinator.toBeRemovedTsRange.expandToInclude(
        properties.spriteView.TransitionTimeMs);
  }

  if (coordinator.waitingSprites.length &&
      coordinator.removedIndexRange.isDefined) {
    coordinator.queueAssignWaiting();
  }

  if (anyHasCallback) {
    coordinator.queueRunCallbacks();
  }

  if (anyToBeRemoved) {
    coordinator.queueRemovalTask();
  }

  coordinator.needsTextureSyncIndexRange.clear();

  const subimageData = {
    data: dataView,
    width: textureWidth,
    height: rowHeight,
  };
  coordinator.targetValuesTexture.subimage(subimageData, 0, lowRow);

  // After texture sync, we should always guarantee a draw call.
  coordinator.queueDraw();
}
