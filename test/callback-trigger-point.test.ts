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
 * @fileoverview Tests for the CallbackTriggerPoint.
 */

import { CallbackTriggerPoint } from '../src/lib/callback-trigger-point';

describe('CallbackTriggerPoint', () => {
  it('should exist', () => {
    expect(CallbackTriggerPoint).toBeInstanceOf(Function);
  });

  describe('x', () => {
    it('should should trigger a draw when setting x coordinate', () => {
      let triggerCount = 0;
      const callbackFn = () => triggerCount++;

      const point = new CallbackTriggerPoint(callbackFn);

      point.x = 5;

      expect(triggerCount).toBe(1);
      expect(point.x).toBe(5);
    });

    it('should throw when attempting to set x coordinate to NaN', () => {
      let triggerCount = 0;
      const callbackFn = () => triggerCount++;

      const point = new CallbackTriggerPoint(callbackFn);

      expect(() => (point.x = +'banana')).toThrowError(RangeError);

      expect(triggerCount).toBe(0);
      expect(point.x).toBe(0);
    });
  });

  describe('y', () => {
    it('should should trigger a draw when setting y coordinate', () => {
      let triggerCount = 0;
      const callbackFn = () => triggerCount++;

      const point = new CallbackTriggerPoint(callbackFn);

      point.y = 9;

      expect(triggerCount).toBe(1);
      expect(point.y).toBe(9);
    });

    it('should throw when attempting to set y coordinate to NaN', () => {
      let triggerCount = 0;
      const callbackFn = () => triggerCount++;

      const point = new CallbackTriggerPoint(callbackFn);

      expect(() => (point.y = +'clover')).toThrowError(RangeError);

      expect(triggerCount).toBe(0);
      expect(point.x).toBe(0);
    });
  });
});
