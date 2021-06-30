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
 * Casting setTimeout() here to satisfy obscure TypeScript compiler complaint
 * about missing '__promisify__' property.
 */
export type SetTimeoutType =
    (this: {}|void, callback: Function, delay: number, ...args: Array<{}>) =>
        number;

/**
 * Casting setTimeout() here to satisfy obscure TypeScript compiler complaint
 * about missing '__promisify__' property.
 */
export type ClearTimeoutType = (this: {}|void, id: number) => void;

/**
 * To enhance testability, the timing functions are constructor parameters to
 * the WorkScheduler. This is exported for testing purposes, but generally
 * should not be of interest to API consumers.
 */
export const DEFAULT_TIMING_FUNCTIONS = Object.freeze({
  requestAnimationFrame: window.requestAnimationFrame.bind(window),
  cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
  setTimeout: window.setTimeout.bind(window) as SetTimeoutType,
  clearTimeout: window.clearTimeout.bind(window) as ClearTimeoutType,
  now: Date.now.bind(Date),
});

export type TimingFunctionsType = typeof DEFAULT_TIMING_FUNCTIONS;
