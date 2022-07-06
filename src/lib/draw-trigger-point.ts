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
 * @fileoverview A DrawTriggerPoint object maintains an x and y coordinate pair
 * and invokes the coordinator object's queueDraw() whenever either are set.
 * Used for the offset and scale properties.
 */

export class DrawTriggerPoint {
  private xValue = 0;
  private yValue = 0;

  constructor(private readonly coordinator: {queueDraw: () => void;}) {}

  get x(): number {
    return this.xValue;
  }

  /**
   * Sets the x coordinate of this point.
   * @param x The x value to set (cannot be NaN).
   * @throws RangeError If the x value passed is NaN.
   */
  set x(x: number) {
    if (isNaN(+x)) {
      throw new RangeError('x cannot be NaN');
    }
    this.xValue = x;
    this.coordinator.queueDraw();
  }

  get y(): number {
    return this.yValue;
  }

  /**
   * Sets the y coordinate of this point.
   * @param y The y value to set (cannot be NaN).
   * @throws RangeError If the y value passed is NaN.
   */
  set y(y: number) {
    if (isNaN(+y)) {
      throw new RangeError('y cannot be NaN');
    }
    this.yValue = y;
    this.coordinator.queueDraw();
  }
}
