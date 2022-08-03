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
 * @fileoverview Provides default timing functions for work scheduler and the
 * timing functions shim, which uses it for TypeScript typing.
 */

/**
 * Generic Function which can be invoked as a callback.
 */
// export type CallbackFunctionType = (...args: unknown[]) => unknown;

/**
 * Timing functions for WorkScheduler.
 */
export interface TimingFunctions {
  /**
   * Function that updates an animation before the browser's next repaint.
   */
  readonly requestAnimationFrame: (callback: FrameRequestCallback) => number;

  /**
   * Function to cancel a scehduled animation frame.
   */
  readonly cancelAnimationFrame: (handle: number) => void;

  /**
   * Function to get number of milliseconds elapsed since 1 Jan 1970.
   */
  readonly now: typeof Date.now;
}

/**
 * For compatibility during migration, allow callers to supply setTimout()
 * and/or clearTimeout() implementations even though neither are used by
 * Megaplot. In the future, specifying these properties will trigger TypeScript
 * compilation errors.
 */
export interface LegacyTimingFunctions extends TimingFunctions {
  setTimeout?: (callback: ((...args: unknown[]) => unknown)) => void;
  clearTimeout?: (id: number) => void;
}

/**
 * To enhance testability, the timing functions are constructor parameters to
 * the WorkScheduler. This is exported only for testing purposes, and generally
 * should not be of interest to API consumers.
 */
export const DEFAULT_TIMING_FUNCTIONS: LegacyTimingFunctions = Object.freeze({
  requestAnimationFrame: (callbackFn: FrameRequestCallback) =>
      window.requestAnimationFrame(callbackFn),

  cancelAnimationFrame: (handle: number) => {
    window.cancelAnimationFrame(handle);
  },

  now: () => Date.now(),
});
