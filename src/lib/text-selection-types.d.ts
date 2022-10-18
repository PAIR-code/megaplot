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

import {Selection, SelectionCallback} from './selection-types';

export type AlignmentOption = 'left'|'center'|'right';

export type VerticalAlignmentOption = 'top'|'middle'|'bottom';

/**
 * A TextSelection maps data points to sequences of sprites displaying glyphs of
 * text. Used for showing labels.
 */
export interface TextSelection<T> extends Selection<T> {
  /**
   * Sets the callback to be invoked before a sprite first appears. Transition
   * time, if set will be ignored.
   */
  onInit: (initCallback: SelectionCallback<T>) => TextSelection<T>;

  /**
   * Set the callback to be invoked after the sprite first appears. Changes to
   * the arrival time will be honored. This allows for transitioning properties
   * as the sprite pops into existence.
   */
  onEnter: (enterCallback: SelectionCallback<T>) => TextSelection<T>;

  /**
   * Set the callback to be invoked after a previously bound sprite is bound
   * again. This will not run when a sprite first comes into existence, only
   * when its bound a subsequent time.
   */
  onUpdate: (updateCallback: SelectionCallback<T>) => TextSelection<T>;

  /**
   * Set the callback to be invoked for sprites that are being unbound.
   */
  onExit: (exitCallback: SelectionCallback<T>) => TextSelection<T>;

  /**
   * Bind the provided data points to the selection. This will cause the enter,
   * update and exit callbacks to be invoked asynchronously. If a key function
   * is specified, then data points will be bound to Sprites according to the
   * key string produced.
   */
  bind: (data: T[], keyFn?: (datum: T) => string) => TextSelection<T>;

  /**
   * Clear any previously bound data and Sprites. Previously bound Sprites will
   * still have their callbacks invoked. This is equivalent to calling bind()
   * with an empty array, except that it is guaranteed to drop expsting data and
   * Sprites, whereas calling bind([]) may be interrupted by a later call to
   * bind().
   */
  clear: () => TextSelection<T>;

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
