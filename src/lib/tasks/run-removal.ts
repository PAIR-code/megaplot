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
 * @fileoverview Defines the runRemoval() method of SceneInternal. This
 * operation takes sprites that have been marked for removal, flashes their
 * values to zero in CPU memory, and marks them for texture sync.
 */

import {InternalError} from '../internal-error';
import {LifecyclePhase} from '../lifecycle-phase';
import {NumericRange} from '../numeric-range';
import {SpriteImpl} from '../sprite-impl';
import {DataViewSymbol, InternalPropertiesSymbol} from '../symbols';
import {RemainingTimeFn} from '../work-scheduler';

/**
 * To avoid circular imports, this file cannot depend on scene-internal.ts so
 * here we define the minimum necessary API surface that the runRemoval()
 * implementation needs to operate.
 */
interface CoordinatorAPI {
  elapsedTimeMs: () => number;
  needsTextureSyncIndexRange: NumericRange;
  queueRemovalTask: () => void;
  queueTextureSync: () => void;
  sprites: SpriteImpl[];
  toBeRemovedIndexRange: NumericRange;
  toBeRemovedTsRange: NumericRange;
}

/**
 * This batch task looks for sprites that have been marked for removal and
 * whose arrival times have passed. Those sprites need to have their values
 * flashed to zero and to be marked for texture sync. That way, the swatch
 * that the sprite used to command can be reused for another sprite later.
 *
 * @param coordinator Upstream object upon which this task operates.
 * @param remaining Function to test how much longer we can continue performing
 * operations before ceding control back to the UI thread.
 * @param stepsBetweenChecks Number of steps to perform between invocations of
 * the remaining time function.
 */
export function runRemoval(
    coordinator: CoordinatorAPI,
    remaining: RemainingTimeFn,
    stepsBetweenChecks: number,
    ): void {
  if (!coordinator.toBeRemovedIndexRange.isDefined ||
      !coordinator.toBeRemovedTsRange.isDefined) {
    // This signals an error in lifecycle phase change logic of the coordinator.
    // This method should not be invoke until there are sprites slated for
    // removal.
    throw new InternalError('No sprites are queued for removal');
  }

  const currentTimeMs = coordinator.elapsedTimeMs();

  const lowTs = coordinator.toBeRemovedTsRange.lowBound;

  // Check whether any of the sprites that are marked for removal have reached
  // their target times. If not, then we queue a future removal task.
  if (currentTimeMs < lowTs) {
    coordinator.queueRemovalTask();
    return;
  }

  const {lowBound: lowIndex, highBound: highIndex} =
      coordinator.toBeRemovedIndexRange;

  // Clear the removal index and ts ranges. They will be added to as needed.
  coordinator.toBeRemovedIndexRange.clear();
  coordinator.toBeRemovedTsRange.clear();

  // Keep track of the last index visited. This is outside of the try block so
  // that we have access to it in the finally block afterwards.
  let index = lowIndex;

  try {
    // Track number of steps to reduce calls to the remaining() callback.
    let step = 1;

    for (; index <= highIndex; index++) {
      // Check to make sure we have made at least one step of progress and that
      // we haven't run for too long without ceding the thread.
      if (index > lowIndex && step++ % stepsBetweenChecks === 0 &&
          remaining() <= 0) {
        break;
      }

      const sprite = coordinator.sprites[index];
      const properties = sprite[InternalPropertiesSymbol];

      // Skip any sprites that are not both in the Rest phase and have had
      // their 'toBeRemoved' property set (had an exit callback).
      if (!properties.toBeRemoved ||
          properties.lifecyclePhase !== LifecyclePhase.Rest) {
        continue;
      }

      if (!properties.spriteView || properties.index === undefined) {
        throw new InternalError('Sprite missing required properties')
      }

      // If the sprite's time has not yet finished, then add it back to the
      // index range. We'll reschedule another run after the loop.
      if (properties.spriteView.TransitionTimeMs > currentTimeMs) {
        coordinator.toBeRemovedIndexRange.expandToInclude(index);
        coordinator.toBeRemovedTsRange.expandToInclude(
            properties.spriteView.TransitionTimeMs);
        continue;
      }

      // The sprite has been marked for removal, its in the right
      // LifeciclePhase, and its time has expired. Flash zeros to the sprite's
      // data view and schedule it for a texture sync.
      properties.spriteView[DataViewSymbol].fill(0);
      properties.lifecyclePhase = LifecyclePhase.NeedsTextureSync;
      coordinator.needsTextureSyncIndexRange.expandToInclude(properties.index);
    }
  } finally {
    if (coordinator.needsTextureSyncIndexRange.isDefined) {
      coordinator.queueTextureSync();
    }

    if (index < highIndex) {
      // Since we didn't finish the whole loop due to time, expand the index
      // range to include all the indices which were previously marked, but
      // which we didn't visit.
      coordinator.toBeRemovedIndexRange.expandToInclude(index + 1);
      coordinator.toBeRemovedIndexRange.expandToInclude(highIndex);

      // Expand the Ts range to include the timestamps of the remaining sprites.
      for (let i = index + 1; i <= highIndex; i++) {
        const sprite = coordinator.sprites[i];
        const properties = sprite[InternalPropertiesSymbol];
        if (properties.toBeRemoved === true &&
            properties.lifecyclePhase === LifecyclePhase.Rest) {
          if (!properties.spriteView) {
            // Indicates a bug in Megaplot. A Sprite in the Rest lifecycle phase
            // ought to have been allocated a swatch and thus a SpriteView for
            // interacting with it.
            // eslint-disable-next-line no-unsafe-finally
            throw new InternalError('Sprite lacks a SpriteView');
          }
          coordinator.toBeRemovedTsRange.expandToInclude(
              properties.spriteView.TransitionTimeMs);
        }
      }
    }

    if (coordinator.toBeRemovedIndexRange.isDefined) {
      // At least one sprite wasn't ready to be removed, so requeue this task
      // to run again.
      coordinator.queueRemovalTask();
    }
  }
}
