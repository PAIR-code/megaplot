/**
 * @license
 * Copyright 2022 Google LLC
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
 * @fileoverview Tests for the Scene.
 */

import {DrawTriggerPoint} from '../src/lib/draw-trigger-point';

describe('DrawTriggerPoint', () => {
  it('should exist', () => {
    expect(DrawTriggerPoint).toBeInstanceOf(Function);
  });

  describe('x', () => {
    it('should should trigger a draw when setting x coordinate', () => {
      const coordinator = {
        triggerCount: 0,
        queueDraw: function() {
          this.triggerCount++;
        },
      };

      const point = new DrawTriggerPoint(coordinator);

      point.x = 5;

      expect(coordinator.triggerCount).toBe(1);
      expect(point.x).toBe(5);
    });

    it('should throw when attempting to set x coordinate to NaN', () => {
      const coordinator = {
        triggerCount: 0,
        queueDraw: function() {
          this.triggerCount++;
        },
      };

      const point = new DrawTriggerPoint(coordinator);

      expect(() => point.x = +'banana').toThrowError(RangeError);

      expect(coordinator.triggerCount).toBe(0);
      expect(point.x).toBe(0);
    });
  });

  describe('y', () => {
    it('should should trigger a draw when setting y coordinate', () => {
      const coordinator = {
        triggerCount: 0,
        queueDraw: function() {
          this.triggerCount++;
        },
      };

      const point = new DrawTriggerPoint(coordinator);

      point.y = 9;

      expect(coordinator.triggerCount).toBe(1);
      expect(point.y).toBe(9);
    });

    it('should throw when attempting to set y coordinate to NaN', () => {
      const coordinator = {
        triggerCount: 0,
        queueDraw: function() {
          this.triggerCount++;
        },
      };

      const point = new DrawTriggerPoint(coordinator);

      expect(() => point.y = +'clover').toThrowError(RangeError);

      expect(coordinator.triggerCount).toBe(0);
      expect(point.x).toBe(0);
    });
  });
});
