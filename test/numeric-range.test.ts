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
 * @fileoverview Tests for NumericRange class.
 */

import { NumericRange } from '../src/lib/numeric-range';

describe('NumericRange', () => {
  it('should exist', () => {
    expect(typeof NumericRange).toBe('function');
  });

  it('should start cleared', () => {
    const range = new NumericRange();
    expect(range).toBeDefined();
    expect(range.isDefined).toBe(false);
    expect(range.lowBound).toBeNaN();
    expect(range.highBound).toBeNaN();
  });

  describe('clear', () => {
    it('should reset all values', () => {
      const range = new NumericRange();

      range.isDefined = true;
      range.lowBound = 100;
      range.highBound = 100;

      range.clear();
      expect(range.isDefined).toBe(false);
      expect(range.lowBound).toBeNaN();
      expect(range.highBound).toBeNaN();
    });
  });

  describe('expandToInclude', () => {
    it('should include values when expanded', () => {
      const range = new NumericRange();

      range.expandToInclude(5);
      expect(range.isDefined).toBe(true);
      expect(range.lowBound).toBe(5);
      expect(range.highBound).toBe(5);

      range.expandToInclude(-5);
      expect(range.isDefined).toBe(true);
      expect(range.lowBound).toBe(-5);
      expect(range.highBound).toBe(5);
    });

    it('should not change if expand values are already included', () => {
      const range = new NumericRange();

      range.isDefined = true;
      range.lowBound = -5;
      range.highBound = 5;

      range.expandToInclude(2);
      expect(range.lowBound).toBe(-5);
      expect(range.highBound).toBe(5);

      range.expandToInclude(-4);
      expect(range.lowBound).toBe(-5);
      expect(range.highBound).toBe(5);

      range.expandToInclude(5);
      expect(range.isDefined).toBe(true);
      expect(range.lowBound).toBe(-5);
      expect(range.highBound).toBe(5);
    });
  });

  describe('truncateToWithin', () => {
    it('should clear range if entirely outside', () => {
      const range = new NumericRange();

      range.isDefined = true;
      range.lowBound = 0;
      range.highBound = 100;

      range.truncateToWithin(200, Infinity);
      expect(range.isDefined).toBe(false);
      expect(range.lowBound).toBeNaN();
      expect(range.highBound).toBeNaN();
    });

    it('should leave range unchanged if not defined', () => {
      const range = new NumericRange();

      range.truncateToWithin(-200, 200);
      expect(range.isDefined).toBe(false);
      expect(isNaN(range.lowBound)).toBe(true);
      expect(isNaN(range.highBound)).toBe(true);
    });

    it('should reduce range to single value if lowValue = highValue', () => {
      const range = new NumericRange();

      range.isDefined = true;
      range.lowBound = -Infinity;
      range.highBound = Infinity;

      range.truncateToWithin(200, 200);
      expect(range.isDefined).toBe(true);
      expect(range.lowBound).toBe(200);
      expect(range.highBound).toBe(200);
    });

    it('should leave range unchanged if values lie outside', () => {
      const range = new NumericRange();

      range.isDefined = true;
      range.lowBound = -50;
      range.highBound = 50;

      range.truncateToWithin(-200, 200);
      expect(range.isDefined).toBe(true);
      expect(range.lowBound).toBe(-50);
      expect(range.highBound).toBe(50);
    });

    it('should clip lowBound if needed', () => {
      const range = new NumericRange();

      range.isDefined = true;
      range.lowBound = -50;
      range.highBound = 50;

      range.truncateToWithin(-20, 200);
      expect(range.isDefined).toBe(true);
      expect(range.lowBound).toBe(-20);
      expect(range.highBound).toBe(50);
    });

    it('should clip highBound if needed', () => {
      const range = new NumericRange();

      range.isDefined = true;
      range.lowBound = -50;
      range.highBound = 50;

      range.truncateToWithin(-200, 20);
      expect(range.isDefined).toBe(true);
      expect(range.lowBound).toBe(-50);
      expect(range.highBound).toBe(20);
    });
  });

  describe('overlaps', () => {
    it('should return false if either range is not defined.', () => {
      const a = new NumericRange();
      const b = new NumericRange();

      expect(a.overlaps(b)).toBe(false);
      expect(b.overlaps(a)).toBe(false);

      a.expandToInclude(1);

      expect(a.overlaps(b)).toBe(false);
      expect(b.overlaps(a)).toBe(false);
    });

    it('should return false for defined non-overlapping ranges.', () => {
      const a = new NumericRange();
      const b = new NumericRange();

      a.expandToInclude(1);
      a.expandToInclude(5);

      b.expandToInclude(6);
      b.expandToInclude(10);

      expect(a.overlaps(b)).toBe(false);
      expect(b.overlaps(a)).toBe(false);
    });

    it('should return true for covered/covering ranges.', () => {
      const a = new NumericRange();
      const b = new NumericRange();

      a.expandToInclude(1);
      a.expandToInclude(10);

      b.expandToInclude(3);
      b.expandToInclude(7);

      expect(a.overlaps(b)).toBe(true);
      expect(b.overlaps(a)).toBe(true);
    });

    it('should return true for partially overlapping ranges.', () => {
      const a = new NumericRange();
      const b = new NumericRange();

      a.expandToInclude(1);
      a.expandToInclude(8);

      b.expandToInclude(3);
      b.expandToInclude(10);

      expect(a.overlaps(b)).toBe(true);
      expect(b.overlaps(a)).toBe(true);
    });
  });
});
