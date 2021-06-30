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

  constructor(private coordinator: {queueDraw: () => void;}) {}

  get x(): number {
    return this.xValue;
  }

  set x(x: number) {
    this.xValue = x;
    this.coordinator.queueDraw();
  }

  get y(): number {
    return this.yValue;
  }

  set y(y: number) {
    this.yValue = y;
    this.coordinator.queueDraw();
  }
}
