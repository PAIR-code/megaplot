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
 * @fileoverview Types that contribute to running a hit test.
 */

import {Sprite} from './sprite';

/**
 *
 * Parameters used in specifying a hit test.
 */
export interface HitTestParameters {
  /**
   * X coordinate in pixels relative to the renderable area (canvas). 0=left.
   */
  x: number;

  /**
   * Y coordinate in pixels relative to the renderable area (canvas). 0=top.
   */
  y: number;

  /**
   * Width in pixels of the tested area. Default is 0.
   */
  width: number;

  /**
   * Height in pixels of the hit tested area. Default is 0.
   */
  height: number;

  /**
   * Whether the test should include sprites that merely intersect the rectangle
   * defined by x, y, width and height. If true, then sprites that intersect the
   * bounding box will be included. If false, then only those sprites which
   * are entirely inside the bounding box will be included. Default is true.
   */
  inclusive: boolean;
}

/**
 * Results of performing a hit test.
 */
export interface HitTestResult {
  /**
   * Parameters used to request this hit test.
   */
  parameters: HitTestParameters;

  /**
   * Array of Sprites that intersected the chosen coordinates.
   */
  hits: Sprite[];
}

/**
 * A hit test should return a HitTestPromise, which is a Promise that is
 * cancellable.
 */
export interface HitTestPromise extends Promise<HitTestResult> {
  /**
   * Cancel method allows cancelling the underlying task. This results in the
   * promise being rejected.
   */
  cancel: () => void;
}
