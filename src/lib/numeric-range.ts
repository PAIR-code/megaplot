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
 * @fileoverview Defines a range object for keeping track of bounds within an
 * array for batch processing purposes.
 */

export class NumericRange {
  /**
   * NumericRange may be in a defined state, where bounds have numeric values.
   * Users of the range should check this property to see if the bounds are
   * defined.
   */
  public isDefined = false;

  public lowBound = NaN;
  public highBound = NaN;

  /**
   * Reset the range.
   */
  clear() {
    this.isDefined = false;
    this.lowBound = NaN;
    this.highBound = NaN;
  }

  /**
   * Expand either the lowBound, the highBound, or both so that the range
   * includes the provided value. This will define the range if it is not yet
   * defined.
   */
  expandToInclude(value: number) {
    if (!this.isDefined) {
      this.lowBound = value;
      this.highBound = value;
      this.isDefined = true;
      return;
    }

    if (value < this.lowBound) {
      this.lowBound = value;
    }

    if (value > this.highBound) {
      this.highBound = value;
    }
  }

  /**
   * Truncate the range such that its low and high bounds are both within the
   * provided values. If the current low and high bounds lie entirely outside
   * the provided values, then clear the range.
   *
   * Both the lowValue and highValue arguments are tested for validity. They
   * must be numbers, and highValue must be greater than or equal to lowValue.
   * If these conditions are not met, an error is thrown.
   *
   * If the range is not defined (isDefined == false), then calling this method
   * will have no impact on the object's internal state.
   */
  truncateToWithin(lowValue: number, highValue: number) {
    if (isNaN(+lowValue) || isNaN(+highValue)) {
      throw new RangeError('Both values must be numbers');
    }

    if (highValue < lowValue) {
      throw new RangeError(
        'High bound must be greater than or equal to low bound'
      );
    }

    if (!this.isDefined) {
      return;
    }

    if (lowValue > this.highBound || highValue < this.lowBound) {
      this.clear();
      return;
    }

    if (this.lowBound < lowValue) {
      this.lowBound = lowValue;
    }

    if (this.highBound > highValue) {
      this.highBound = highValue;
    }
  }

  /**
   * Determine whether this range overlaps another given range. If either range
   * is not defined, then they do not overlap (returns false). Otherwise, this
   * method returns true if there exist any numbers which appear in both ranges.
   */
  overlaps(otherRange: NumericRange) {
    return (
      this.isDefined &&
      otherRange.isDefined &&
      this.lowBound <= otherRange.highBound &&
      this.highBound >= otherRange.lowBound
    );
  }
}
