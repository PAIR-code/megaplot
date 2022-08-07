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
 * @fileoverview The TimingFunctionsShim class is used for testing the
 * WorkScheduler. A TimingFunctionsShim implements and emulates the upstream
 * timing functions that the WorkScheduler depends on, like
 * requestAnimationFrame().
 */

import {TimingFunctions} from './default-timing-functions';
import {InternalError} from './internal-error';

/**
 * Object for storing information about an animation frame callback.
 */
interface AnimationFrameCallback {
  /**
   * Should always be an odd, positive integer (1, 3, 5, ...).
   */
  id: number;

  /**
   * Function to be invoked.
   */
  callback: FrameRequestCallback;
}

/**
 * The timing functions we're emulating care about the value of 'this', and so
 * we need to not only bind them, but also test 'this' for compliance by
 * checking against the global 'this' object (usually the window, or null in
 * strict mode).
 */
function getThis(this: unknown) {
  return this;
}

const GLOBAL_THIS = getThis.call(null);

function checkThis(obj: unknown) {
  if (obj !== null && obj !== undefined && obj !== GLOBAL_THIS) {
    throw new TypeError('Illegal invocation');
  }
}

/**
 * The WorkScheduler typically uses off-the-shelf timing functions like
 * requestAnimationFrame() and Date.now(). Instead, we'll replace those with
 * methods provided by this class.
 */
export class TimingFunctionsShim implements TimingFunctions {
  /**
   * Internal counter for elapsed time in milliseconds. Should be monotonically
   * increasing.
   */
  totalElapsedTimeMs = 0;

  /**
   * Internal counter to produce numeric ids in response to requests to
   * requestAnimationFrame();
   */
  nextAnimationFrameId = 1;

  /**
   * Internal queue of callbacks to run on the next animation frame. It should
   * only be modified by calls to requestAnimationFrame() and
   * triggerAnimationFrame(), but is public here so that it can be evaluated by
   * test code.
   */
  readonly animationFrameCallbackQueue: AnimationFrameCallback[] = [];

  /**
   * Bind all methods since the caller will have only the function handle. Check
   * invocations to ensure that the 'this' object matches the global 'this'
   * (usually window, or null/undefined in strict mode).
   */
  constructor() {
    const boundRequestAnimationFrame = this.requestAnimationFrame.bind(this);
    this.requestAnimationFrame = function requestAnimationFrame(
        this: unknown, callback: FrameRequestCallback): number {
      checkThis(this);
      return boundRequestAnimationFrame(callback);
    };

    const boundCancelAnimationFrame = this.cancelAnimationFrame.bind(this);
    this.cancelAnimationFrame = function cancelAnimationFrame(
        this: unknown, id: number): void {
      checkThis(this);
      boundCancelAnimationFrame(id);
    };

    /**
     * Date.now() does not seem to care whether the 'this' object provided is in
     * fact the Date global.
     */
    this.now = this.now.bind(this);
  }

  /**
   * Emulate window.requestAnimationFrame() by adding the callback to the queue.
   */
  requestAnimationFrame(callback: FrameRequestCallback): number {
    if (!(callback instanceof Function)) {
      // Emulate the error produced by upstream requestAnimationFrame().
      throw new TypeError(
          'Failed to execute \'requestAnimationFrame\' on \'Window\': ' +
          'The callback provided as parameter 1 is not a function');
    }

    const id = this.nextAnimationFrameId;

    // Sanity check.
    if (isNaN(+id) || !Number.isInteger(id) || id < 1) {
      throw new TypeError('Animation frame ids must be positive integers');
    }

    this.nextAnimationFrameId += 2;
    const callbackObject = {id, callback};
    this.animationFrameCallbackQueue.push(callbackObject);
    return id;
  }

  /**
   * Emulate window.cancelAnimationFrame() by removing the referenced callback
   * from the queue.
   */
  cancelAnimationFrame(id: number): void {
    // Sanity check.
    if (isNaN(+id) || !Number.isInteger(id) || id < 1) {
      throw new TypeError('Animation frame ids must be positive integers');
    }

    for (let i = this.animationFrameCallbackQueue.length - 1; i >= 0; i--) {
      if (this.animationFrameCallbackQueue[i].id === id) {
        this.animationFrameCallbackQueue.splice(i, 1);
      }
    }
  }

  /**
   * Emulate Date.now().
   */
  now(): number {
    return this.totalElapsedTimeMs;
  }

  /**
   * Provide a mechanism for running down queued animation frame callbacks.
   * Since callbacks may schedule more animation frame callbacks, this method
   * takes an optional frameCount parameter in indicate how many frames to
   * advance.
   *
   * @param frameCount Number of frames to advance.
   */
  runAnimationFrameCallbacks(frameCount = 1) {
    if (!Number.isInteger(frameCount) || frameCount <= 0) {
      throw new RangeError('frameCount must be a positive integer');
    }

    for (let i = 0; i < frameCount; i++) {
      // Remove all callbacks from the canonical animation frame callback queue.
      // This local version will be the one we run down so that we can track any
      // that were blocked by earlier exceptions. This also ensures that we
      // don't accidentally start executing future queued callbacks (those put
      // onto the canonical queue as a side effect of this run).
      const presentCallbackQueue = this.animationFrameCallbackQueue.splice(
          0, this.animationFrameCallbackQueue.length);

      // Each callback run in the same frame will be provided the same timestamp
      // even though time may have elapsed during execution.
      const currentTimestamp = this.now();

      try {
        // Dequeue present callbacks and run them in order.
        while (presentCallbackQueue.length) {
          const item = presentCallbackQueue.shift();

          if (!item) {
            throw new InternalError('Falsey value found in callback queue');
          }

          item.callback.call(null, currentTimestamp);
        }

      } finally {
        // Collect any callbacks that were added to the canonical queue during
        // the running of present callbacks.
        const futureCallbackQueue = this.animationFrameCallbackQueue.splice(
            0, this.animationFrameCallbackQueue.length);

        // Update the canonical queue to include, in order, any remaining
        // present callbacks, then any newly added callbacks.
        this.animationFrameCallbackQueue.push(
            ...presentCallbackQueue,
            ...futureCallbackQueue,
        );
      }
    }
  }
}
