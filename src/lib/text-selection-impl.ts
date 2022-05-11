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
 * @fileoverview Implements the TextSelection API for SceneImpl.
 */

import {GlyphCoordinates, GlyphMapper} from './glyph-mapper';
import {Renderer} from './renderer-types';
import {Selection, SelectionCallback} from './selection-types';
import {TextSelection} from './text-selection-types';
import {RemainingTimeFn, WorkScheduler} from './work-scheduler';

/**
 * Text can be horizontally aligned left, right or center. Default is center.
 */
type AlignValue = 'left'|'center'|'right';
const DEFAULT_ALIGN_VALUE = 'center';

/**
 * Text can be vertically aligned top, bottom or middle. Default is middle.
 */
type VerticalAlignValue = 'top'|'middle'|'bottom';
const DEFAULT_VERTICAL_ALIGN_VALUE = 'middle';

/**
 * Characteristics of a glyph as part of a TextSelection.
 */
interface TextGlyph<T> {
  // The dataum behind this glyph's text.
  datum: T;

  // SDF texture coordinates for this glyph.
  coords: GlyphCoordinates;

  // Relative position for this glyph, accounting for alignment.
  position: {x: number; y: number;};
}

export class TextSelectionImpl<T> implements TextSelection<T> {
  private selections: Selection<TextGlyph<T>>[] = [];

  private boundData: T[] = [];

  private textCallback?: ((datum: T) => string) = ((datum: T) => `${datum}`);

  private bindCallback?: SelectionCallback<T>;
  private initCallback?: SelectionCallback<T>;
  private enterCallback?: SelectionCallback<T>;
  private updateCallback?: SelectionCallback<T>;
  private exitCallback?: SelectionCallback<T>;

  private alignCallback?:
      ((datum: T) => AlignValue) = (() => DEFAULT_ALIGN_VALUE);
  private verticalAlignCallback?:
      ((datum: T) => VerticalAlignValue) = (() => DEFAULT_VERTICAL_ALIGN_VALUE);

  /**
   * Create a new selection in the associated Scene.
   */
  constructor(
      private stepsBetweenChecks: number,
      private renderer: Renderer,
      private workScheduler: WorkScheduler,
      private glyphMapper: GlyphMapper,
  ) {}

  text(textCallback: (datum: T) => string) {
    this.textCallback = textCallback;
    return this;
  }

  align(alignCallback: (datum: T) => AlignValue) {
    this.alignCallback = alignCallback;
    return this;
  }

  verticalAlign(verticalAlignCallback: (datum: T) => VerticalAlignValue) {
    this.verticalAlignCallback = verticalAlignCallback;
    return this;
  }

  onBind(bindCallback: SelectionCallback<T>) {
    this.bindCallback = bindCallback;
    return this;
  }

  onInit(initCallback: SelectionCallback<T>) {
    this.initCallback = initCallback;
    return this;
  }

  onEnter(enterCallback: SelectionCallback<T>) {
    this.enterCallback = enterCallback;
    return this;
  }

  onUpdate(updateCallback: SelectionCallback<T>) {
    this.updateCallback = updateCallback;
    return this;
  }

  onExit(exitCallback: SelectionCallback<T>) {
    this.exitCallback = exitCallback;
    return this;
  }

  private datumToGlyphs(datum: T): Array<TextGlyph<T>> {
    const text =
        (this.textCallback ? this.textCallback.call(datum, datum) : `${datum}`)
            .trim();

    const align = (this.alignCallback && this.alignCallback(datum)) ||
        DEFAULT_ALIGN_VALUE;
    const verticalAlign =
        (this.verticalAlignCallback && this.verticalAlignCallback(datum)) ||
        DEFAULT_VERTICAL_ALIGN_VALUE;

    const glyphs: Array<TextGlyph<T>> = [];

    for (let i = 0; i < text.length; i++) {
      let x: number;
      if (align === 'left') {
        x = (i + 1) * .5;
      } else if (align === 'right') {
        x = (i + 1 - text.length) * 0.5;
      } else {
        x = (i + .75 - text.length * 0.5) * 0.5;
      }

      let y: number;
      if (verticalAlign === 'top') {
        y = -0.5;
      } else if (verticalAlign === 'bottom') {
        y = 0.5;
      } else {
        y = 0;
      }

      const coords = this.glyphMapper.getGlyph(text.charAt(i));
      if (coords) {
        glyphs.push({datum, coords, position: {x, y}});
      }
    }
    return glyphs;
  }

  bind(data: T[]) {
    // Keep track of number of steps taken during this task to break up the
    // number of times we check how much time is remaining.
    let step = 0;

    const dataLength = data.length;

    let lastEnterIndex = this.boundData.length;

    // Performs enter data binding while there's time remaning, then returns
    // whether there's more work to do.
    const enterTask = (remaining: RemainingTimeFn) => {
      while (lastEnterIndex < dataLength) {
        step++;
        const index = lastEnterIndex++;
        const datum = data[index];
        const selection = this.renderer.createSelection<TextGlyph<T>>();

        this.boundData.push(datum);
        this.selections.push(selection);

        selection.onInit((spriteView, glyph) => {
          if (this.initCallback) {
            this.initCallback(spriteView, glyph.datum);
          }
        });

        selection.onEnter((spriteView, glyph) => {
          if (this.enterCallback) {
            this.enterCallback(spriteView, glyph.datum);
          }
        });

        selection.onUpdate((spriteView, glyph) => {
          if (this.updateCallback) {
            this.updateCallback(spriteView, glyph.datum);
          }
        });

        selection.onExit((spriteView, glyph) => {
          if (this.exitCallback) {
            this.exitCallback(spriteView, glyph.datum);
          }
        });

        selection.onBind((spriteView, glyph) => {
          spriteView.Sides = 0;
          spriteView.ShapeTexture = glyph.coords;

          spriteView.PositionRelative = glyph.position;

          if (this.bindCallback) {
            this.bindCallback(spriteView, glyph.datum);
          }
        });

        selection.bind(this.datumToGlyphs(datum));

        if (step % this.stepsBetweenChecks === 0 && remaining() <= 0) {
          return false;
        }
      }

      return lastEnterIndex >= dataLength;
    };

    let lastUpdateIndex = 0;
    const updateLength = Math.min(dataLength, this.boundData.length);

    // Performs update data binding while there's time remaining, then returns
    // whether there's more work to do.
    const updateTask = (remaining: RemainingTimeFn) => {
      while (lastUpdateIndex < updateLength) {
        step++;
        const index = lastUpdateIndex++;
        const datum = data[index];
        const selection = this.selections[index];

        this.boundData[index] = datum;

        selection.bind(this.datumToGlyphs(datum));

        if (step % this.stepsBetweenChecks === 0 && remaining() <= 0) {
          return false;
        }
      }

      return lastUpdateIndex >= updateLength;
    };

    // Performs exit data binding while there's time remaining, then returns
    // whether there's more work to do.
    const exitTask = (remaining: RemainingTimeFn) => {
      // TODO(jimbo): Instead, iterate forward through the list.
      while (dataLength < this.boundData.length) {
        step++;

        this.boundData.pop();
        const selection = this.selections.pop()!;

        selection.bind([]);

        if (step % this.stepsBetweenChecks === 0 && remaining() <= 0) {
          return false;
        }
      }

      return dataLength >= this.boundData.length;
    };

    // Perform one unit of work, starting with any exit tasks, then updates,
    // then enter tasks. This way, previously used texture memory can be
    // recycled more quickly, keeping the area of used texture memory more
    // compact.
    const bindingTask = {
      id: this,
      callback: (remaining: RemainingTimeFn) => {
        step = 0;
        return exitTask(remaining) && updateTask(remaining) &&
            enterTask(remaining);
      },
      runUntilDone: true,
    };

    this.workScheduler.scheduleUniqueTask(bindingTask);

    return this;
  }

  clear() {
    throw new Error('clear() not yet implemented');
    return this;
  }
}
