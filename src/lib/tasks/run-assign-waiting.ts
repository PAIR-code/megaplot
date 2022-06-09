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
 * @fileoverview Defines the runAssignWaiting() task of SceneInternal.
 */

import {InternalError} from '../internal-error';
import {LifecyclePhase} from '../lifecycle-phase';
import {NumericRange} from '../numeric-range';
import {SpriteImpl} from '../sprite-impl';
import {InternalPropertiesSymbol} from '../symbols';
import {RemainingTimeFn} from '../work-scheduler';

/**
 * To avoid circular imports, this file cannot depend on scene-internal.ts so
 * here we define the minimum necessary API surface that the task implementation
 * needs to operate.
 */
interface CoordinatorAPI {
  assignSpriteToIndex: (sprite: SpriteImpl, index: number) => void;
  callbacksIndexRange: NumericRange;
  queueAssignWaiting: () => void;
  queueRunCallbacks: () => void;
  removedIndexRange: NumericRange;
  sprites: SpriteImpl[];
  waitingSprites: SpriteImpl[];
}

/**
 * Graphics cards have limited memory, and so it's possible for the API user to
 * create more sprites than are representable in the data textures. Additional
 * sprites beyond those that fit in GPU memory wait until other sprites have
 * been removed, freeing up memory. The runAssignWaiting() task assigns waiting
 * sprites to swatches that have been freed by other Removed sprites.
 *
 * @param coordinator Upstream object upon which this task operates.
 * @param remaining Function to test how much longer we can continue performing
 * operations before ceding control back to the UI thread.
 * @param stepsBetweenChecks Number of steps to perform between invocations of
 * the remaining time function. Must be a non-negative integer. Should be in the
 * 100-1000 range. Higher numbers reduce the frequency of time checks, but run
 * the risk of running too long before returning control to the UI thread
 * (laggy user experince).
 */
export function runAssignWaiting(
    coordinator: CoordinatorAPI,
    remaining: RemainingTimeFn,
    stepsBetweenChecks: number,
    ): void {
  const {
    removedIndexRange,
    sprites,
    waitingSprites,
  } = coordinator;

  if (!removedIndexRange.isDefined) {
    // This indicates an error condition in which there was an assign task
    // queued but before it could run the removed index ranges were somehow
    // used up.
    throw new InternalError('No removed indices available to assign');
  }

  if (!waitingSprites.length) {
    // This indicates an error condition in which there is additional capacity
    // to dequeue waiting sprites, but somehow there are no waiting sprites to
    // dequeue.
    throw new InternalError('No waiting sprites to assign');
  }

  // Inside the while loop, we'll be iterating through both the removed index
  // range and the waiting sprites queue. Both of these lists contain items
  // which may not be applicable to our current task. A waiting sprite may be
  // abandoned, and the removed index range very likely contains non-removed
  // sprites. However, in no case will it ever make sense that we made no
  // progress through the waiting sprites list.
  let waitingIndex = 0;
  let removedIndex = removedIndexRange.lowBound;

  // Track number of steps to reduce calls to remaining() for time checks.
  // Starts at 1 to ensure we make at least some progress through the loop
  // before quitting to time.
  let step = 1;

  // Keep track whether we've assigned any sprites that already have a callback
  // set. If so then we'll need to queue a run callbacks task.
  let anyHasCallback = false;

  while (waitingIndex < waitingSprites.length &&
         removedIndex <= removedIndexRange.highBound) {
    // If we've made any progress and we're out of time, break.
    if (waitingIndex > 0 && step++ % stepsBetweenChecks === 0 &&
        remaining() <= 0) {
      break;
    }

    // The list of waiting sprites may contain some which have been abandoned,
    // so here we iterate until we find one that has NOT been abandoned, or we
    // run out of sprites to check. It's possible that all of the previously
    // waiting sprites have since been abandoned, and so we should allow for
    // that possibility.
    while (waitingIndex < waitingSprites.length &&
           waitingSprites[waitingIndex][InternalPropertiesSymbol].isAbandoned) {
      waitingIndex++;
    }
    if (waitingIndex >= waitingSprites.length) {
      // Ran out of potentially waiting sprites to check. This is not an error.
      // It may be that the waiting sprites at the end of the list have been
      // abandoned.
      break;
    }

    // The removedIndexRange contains all of the sprites slated for removal, but
    // very probably also includes sprites which are not removed, so here we
    // iterate until we find one that has been removed.
    while (removedIndex <= removedIndexRange.highBound &&
           !sprites[removedIndex].isRemoved) {
      removedIndex++;
    }
    if (removedIndex > removedIndexRange.highBound) {
      // This signals a bug in the removal logic. Even though the
      // removedIndexRange will often include non-removed Sprites, it should
      // never be the case that the Sprites sitting at the extents of that range
      // are not in the Removed lifecycle phase. Therefore as we iterate through
      // the range, when we get to the end, it should definitely be a removed
      // sprite whose index and swatch we can reuse.
      throw new InternalError(
          'Removed index range ended on a non-removed sprite');
    }

    // Now that we've found both a non-abandoned waiting sprite, and a removed
    // sprite, we can give the removed sprite's index (and swatch) to the
    // waiting sprite.
    const waitingSprite = waitingSprites[waitingIndex];
    const removedSprite = sprites[removedIndex];
    const removedProperties = removedSprite[InternalPropertiesSymbol];
    const waitingProperties = waitingSprite[InternalPropertiesSymbol];

    if (removedProperties.index === undefined) {
      throw new InternalError('Removed Sprite lacks index');
    }

    coordinator.assignSpriteToIndex(waitingSprite, removedProperties.index);

    if (waitingProperties.index === undefined) {
      throw new InternalError('Sprite index was not assigned');
    }

    // Upgrade the waiting Sprite's phase from Rest to HasCallback if needed.
    if (waitingProperties.hasCallback) {
      anyHasCallback = true;
      waitingProperties.lifecyclePhase = LifecyclePhase.HasCallback;
      coordinator.callbacksIndexRange.expandToInclude(waitingProperties.index);
    }

    // Increment both the waitingIndex and the removedIndex so that the next
    // iteration of the loop starts looking beyond the current indices. If
    // either is beyond their designated ranges, the next loop will kick out.
    waitingIndex++;
    removedIndex++;
  }

  // Splice out the waiting sprites that have been assigned or skipped because
  // they were abandoned.
  waitingSprites.splice(0, waitingIndex);

  // Clear out the portion of the removed range having sprites which have had
  // their indices and swatches reassigned.
  if (removedIndex > removedIndexRange.highBound) {
    removedIndexRange.clear();
  } else {
    removedIndexRange.truncateToWithin(
        removedIndex, removedIndexRange.highBound);
  }

  if (anyHasCallback) {
    coordinator.queueRunCallbacks();
  }

  if (waitingSprites.length && removedIndexRange.isDefined) {
    coordinator.queueAssignWaiting();
  }
}
