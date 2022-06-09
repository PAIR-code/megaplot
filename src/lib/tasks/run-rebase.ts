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
 * @fileoverview Defines the runRebase() task of SceneInternal.
 */
import REGL from 'regl';

import {InternalError} from '../internal-error';
import {LifecyclePhase} from '../lifecycle-phase';
import {NumericRange} from '../numeric-range';
import {SpriteImpl} from '../sprite-impl';
import {InternalPropertiesSymbol} from '../symbols';

/**
 * To avoid circular imports, this file cannot depend on scene-internal.ts so
 * here we define the minimum necessary API surface that the task implementation
 * needs to operate.
 */
interface CoordinatorAPI {
  instanceRebaseUvBuffer: REGL.Buffer;
  instanceRebaseUvValues: Float32Array;
  instanceSwatchUvValues: Float32Array;
  needsRebaseIndexRange: NumericRange;
  needsTextureSyncIndexRange: NumericRange;
  previousValuesFramebuffer: REGL.Framebuffer2D;
  previousValuesTexture: REGL.Texture2D;
  queueTextureSync: () => void;
  rebaseCommand: () => void;
  rebaseCount: number;
  sprites: SpriteImpl[];
}

/**
 * Perform a rebase operation for all sprites in this state. This should be
 * invoked by the WorkScheduler.
 *
 * @param coordinator Upstream object upon which this task operates.
 */
export function runRebase(
    coordinator: CoordinatorAPI,
) {
  // Sanity check: nothing to do if there's nothing in the rebase queue.
  if (!coordinator.needsRebaseIndexRange.isDefined) {
    throw new InternalError('No sprites are queued for rebase');
  }

  // For each queued sprite to rebase, copy its UV values into the
  // instanceRebaseUvValues array.
  coordinator.rebaseCount = 0;
  const {lowBound, highBound} = coordinator.needsRebaseIndexRange;
  for (let index = lowBound; index <= highBound; index++) {
    const sprite = coordinator.sprites[index];
    const properties = sprite[InternalPropertiesSymbol];

    // Skip sprites that are not waiting for a rebase.
    if (properties.lifecyclePhase !== LifecyclePhase.NeedsRebase) {
      continue;
    }

    // Update properties to match new state.
    coordinator.needsTextureSyncIndexRange.expandToInclude(index);
    properties.lifecyclePhase = LifecyclePhase.NeedsTextureSync;

    // Put instance swatch UV values to the rebase UV values array.
    coordinator.instanceRebaseUvValues[coordinator.rebaseCount * 2] =
        coordinator.instanceSwatchUvValues[index * 2];
    coordinator.instanceRebaseUvValues[coordinator.rebaseCount * 2 + 1] =
        coordinator.instanceSwatchUvValues[index * 2 + 1];
    coordinator.rebaseCount++;
  }

  if (!coordinator.rebaseCount) {
    // This signals that while the rebase index range was defined, none of the
    // sprites in that range were actually due for rebase.
    throw new InternalError('No sprites were found to need rebase');
  }

  // Queue a texture sync, since that's always the next lifecycle phase for
  // any sprites that have been rebased.
  coordinator.queueTextureSync();

  // Bind the rebase UV values to the buffer.
  coordinator.instanceRebaseUvBuffer(
      coordinator.instanceRebaseUvValues.subarray(
          0, coordinator.rebaseCount * 2));

  // Render using the rebase shader. This should leave intact any swatches
  // for sprites that are not being rebased.
  coordinator.rebaseCommand();

  // Flash values back to 'input' previous texture.
  coordinator.previousValuesFramebuffer.use(
      () => coordinator.previousValuesTexture({copy: true}));

  // Reset the rebase queue length since the queue has been cleared.
  coordinator.needsRebaseIndexRange.clear();
}
