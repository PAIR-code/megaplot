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
 * @fileoverview Types relating to text selections.
 */

import {Selection} from './selection-types';

export type AlignmentOption = 'left'|'center'|'right';

export type VerticalAlignmentOption = 'top'|'middle'|'bottom';

/**
 * A TextSelection maps data points to sequences of sprites displaying glyphs of
 * text. Used for showing labels.
 */
export interface TextSelection<T> extends Selection<T> {
  /**
   * Set the callback for determining the string for the given datum.
   */
  text: (textCallback: (datum: T) => string) => TextSelection<T>;

  /**
   * Set the callback for determining the alignment for the given datum.
   */
  align: (alignCallback: (datum: T) => AlignmentOption) => TextSelection<T>;

  /**
   * Set the callback for determining the vertical alignment for the given
   * datum.
   */
  verticalAlign:
      (verticalAlignCallback:
           (datum: T) => VerticalAlignmentOption) => TextSelection<T>;
}
