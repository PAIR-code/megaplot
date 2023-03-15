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
 * @fileoverview Defines the runCallbacks() task of SceneInternal. This
 * operation iterates through sprites which have callbacks to be invoked and
 * invokes them.
 */

import { InternalError } from '../internal-error';
import { LifecyclePhase } from '../lifecycle-phase';
import { NumericRange } from '../numeric-range';
import { SpriteViewCallback } from '../sprite';
import { SpriteImpl } from '../sprite-impl';
import { SpriteImplProperties } from '../sprite-impl-properties';
import { DataViewSymbol, InternalPropertiesSymbol } from '../symbols';
import { RemainingTimeFn, WorkScheduler } from '../work-scheduler';

/**
 * To avoid circular imports, this file cannot depend on scene-internal.ts so
 * here we define the minimum necessary API surface that the task implementation
 * needs to operate.
 */
interface CoordinatorAPI {
  callbacksIndexRange: NumericRange;
  defaultTransitionTimeMs: number;
  elapsedTimeMs: () => number;
  needsRebaseIndexRange: NumericRange;
  needsTextureSyncIndexRange: NumericRange;
  queueDraw: () => void;
  queueRebase: () => void;
  queueRunCallbacks: () => void;
  queueTextureSync: () => void;
  sprites: SpriteImpl[];
  toDrawTsRange: NumericRange;
  workScheduler: WorkScheduler;
}

/**
 * Run callbacks for sprites that have them. May not finish due to time
 * constraints. Since this invokes callback functions provided by upstream API
 * users, great care must be taken to ensure that any errors which upstream
 * callbacks throw are made visible to the developer, but do not corrupt
 * internal state.
 *
 * @param coordinator Upstream object upon which this task operates.
 * @param remaining Function to test how much longer we can continue performing
 * operations before ceding control back to the UI thread.
 * @param stepsBetweenChecks Number of steps to perform between invocations of
 * the remaining time function.
 */
export function runCallbacks(
  coordinator: CoordinatorAPI,
  remaining: RemainingTimeFn,
  stepsBetweenChecks: number
): void {
  if (!coordinator.callbacksIndexRange.isDefined) {
    // This indicates a timing error in the code.
    throw new InternalError('Running callbacks requires a range of indices');
  }

  // Make note of the exit index range for looping purposes.
  const { lowBound, highBound } = coordinator.callbacksIndexRange;

  // Clear the range. It will be expanded as needed.
  coordinator.callbacksIndexRange.clear();

  // Keep track of the last Sprite visited and its properties. This way we can
  // recover from a user's callback error.
  let sprite: SpriteImpl | undefined;
  let properties: SpriteImplProperties | undefined;

  // Keep track of whether we've encountered any sprites that will need a
  // rebase before texture sync.
  let anyNeedsRebase = false;

  // Keep track of whether we've encountered any sprites that are ready for a
  // texture sync without need for rebase.
  let anyNeedsTextureSync = false;

  // To reduce the cost of invoking this constantly, reuse the time value.
  const currentTimeMs = coordinator.elapsedTimeMs();

  // Procedure for advancing the sprite state after its callback has been
  // invoked. Defined here so that its available in both try and catch.
  const afterCallback = () => {
    if (!properties) {
      throw new InternalError('Attempted to re-run afterCallback steps');
    }

    const { spriteView, index } = properties;
    if (!spriteView || index === undefined) {
      throw new InternalError('Sprite missing required properties');
    }

    // Append the current time to the arrival time value.
    spriteView.TransitionTimeMs += currentTimeMs;

    // Make sure that the draw Ts range includes the current transition time.
    coordinator.toDrawTsRange.expandToInclude(spriteView.TransitionTimeMs);

    if (spriteView.TransitionTimeMs > currentTimeMs) {
      // If the callback set a future arrival time (Ts), then this sprite
      // needs a rebase.
      anyNeedsRebase = true;
      properties.lifecyclePhase = LifecyclePhase.NeedsRebase;
      coordinator.needsRebaseIndexRange.expandToInclude(index);
    } else {
      // Otherwise it's ready for texture sync immediately.
      anyNeedsTextureSync = true;
      properties.lifecyclePhase = LifecyclePhase.NeedsTextureSync;
      coordinator.needsTextureSyncIndexRange.expandToInclude(index);

      if (properties.toBeRemoved && !properties.hasCallback) {
        // If this sprite is slated for removal, and it has no further
        // callbacks to invoke, then we need to flash zeros to the float array
        // underlying the data view since this sprite's swatches will be
        // returned for future reuse after the next texture sync.
        spriteView[DataViewSymbol].fill(0);
      }
    }

    // Clear loop variables to make accidental re-running of afterCallback()
    // detectable (see error above).
    sprite = undefined;
    properties = undefined;
  };

  // Keep track of the last visited index so that we can know outside the loop
  // whether we made it all the way through.
  let index = lowBound;

  try {
    // Use a step counter to determine when to check the time remaining.
    // Starting at 1 ensures we don't perform a check right away upon entering
    // the loop. We'll iterate through the loop at least once. We always want
    // to make at least some progress before breaking.
    let step = 1;

    while (index <= highBound) {
      // Check to make sure we haven't run for too long without ceding the
      // execution thread. Always make sure we've gone at least one time
      // around the loop. This check is at the top of the loop so that it's
      // invoked every time without fail to prevent runaway execution.
      if (
        index > lowBound &&
        step++ % stepsBetweenChecks === 0 &&
        remaining() <= 0
      ) {
        break;
      }

      sprite = coordinator.sprites[index];
      properties = sprite[InternalPropertiesSymbol];

      // Increment the index here so that it's always one more than the
      // currently visited sprite. If we've managed to visit all of the
      // sprites with callbacks, then index will end up strictly greater than
      // the value of highBound.
      index++;

      if (properties.lifecyclePhase !== LifecyclePhase.HasCallback) {
        continue;
      }

      if (!properties.spriteView) {
        throw new InternalError(
          'Sprite in HasCallback lifecycle phase missing SpriteView'
        );
      }

      // Pick earliest callback to run (enter, then update, then exit).
      let callback: SpriteViewCallback;
      if (properties.enterCallback) {
        callback = properties.enterCallback;
        properties.enterCallback = undefined;
      } else if (properties.updateCallback) {
        callback = properties.updateCallback;
        properties.updateCallback = undefined;
      } else if (properties.exitCallback) {
        callback = properties.exitCallback;
        properties.exitCallback = undefined;
      } else {
        // If this error occurs, it means that the sprite was in the
        // HasCallback lifecycle phase but did not, in fact, have any
        // callbacks. This should not be possible under normal operations
        // and indicates a bug in the phase transition logic.
        throw new InternalError(
          'Sprite in HasCallback state missing callbacks'
        );
      }

      // Poke the defaultTransitionTimeMs into the spriteView arrival time.
      // This value may be updated by the callback to specify a different
      // transition duration. Whether the value is changed or not as part of
      // the callback, the value will have the elapsed time added to it so
      // that the transition completion time is in the future.
      properties.spriteView.TransitionTimeMs =
        coordinator.defaultTransitionTimeMs;

      // Reset the step counter to force a time check at the top of the next
      // iteration through the loop.
      step = 0;

      // Invoke the callback, may error out.
      callback.call(sprite, properties.spriteView);

      // Perform after callback steps. This is duplicated in the catch
      // clause, just in case.
      afterCallback();
    }
  } catch (err) {
    // The most likely place for an error to have occurred is the user's
    // callback function. So here we should ensure that the after callback
    // steps are invoked.
    if (
      properties &&
      properties.lifecyclePhase === LifecyclePhase.HasCallback
    ) {
      afterCallback();
    }

    // Rethrowing here will not prevent the finally block below from running.
    throw err;
  } finally {
    if (anyNeedsRebase) {
      coordinator.queueRebase();
    }

    if (anyNeedsTextureSync) {
      coordinator.queueTextureSync();
    }

    if (index <= highBound) {
      // We didn't finish visiting all of the sprites between the low and high
      // bounds, so we need to make sure the range includes the portion that
      // we didn't get to.
      coordinator.callbacksIndexRange.expandToInclude(index);
      coordinator.callbacksIndexRange.expandToInclude(highBound);
    }

    if (coordinator.callbacksIndexRange.isDefined) {
      // There are still more sprites with callbacks. Schedule a future task to
      // continue the work.
      coordinator.queueRunCallbacks();
    }

    if (coordinator.toDrawTsRange.isDefined) {
      coordinator.queueDraw();
    }
  }
}
