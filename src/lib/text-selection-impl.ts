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
import {WorkTaskWithId} from './work-task';

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

  // Unique objects to identify this instance's bind() and clear() tasks.
  private bindingTaskId = Symbol('bindingTask');
  private clearingTaskId = Symbol('clearingTask');

  // Binding or clearing task, if scheduled.
  private bindingTask?: WorkTaskWithId;
  private clearingTask?: WorkTaskWithId;

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

  bind(data: T[], keyFn?: (datum: T) => string) {
    // TODO(jimbo): Implement keyFn for non-index binding.
    if (keyFn) {
      throw new Error('keyFn mapping is not yet supported');
    }

    // If there's a clearingTask already in flight, then short-circuit here and
    // schedule a future attempt using the bindingTaskId.
    if (this.clearingTask) {
      this.workScheduler.scheduleUniqueTask({
        id: this.bindingTaskId,
        callback: () => this.bind(data, keyFn),
      });
      return this;
    }

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
          break;
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
      let index = dataLength;

      while (index < this.boundData.length) {
        step++;

        const selection = this.selections[index];

        index++;

        selection.bind([]);

        if (step % this.stepsBetweenChecks === 0 && remaining() <= 0) {
          break;
        }
      }

      this.boundData.splice(dataLength, index - dataLength);
      this.selections.splice(dataLength, index - dataLength);

      return dataLength >= this.boundData.length;
    };

    // Perform one unit of work, starting with any exit tasks, then updates,
    // then enter tasks. This way, previously used texture memory can be
    // recycled more quickly, keeping the area of used texture memory more
    // compact.
    this.bindingTask = {
      id: this,
      callback: (remaining: RemainingTimeFn) => {
        step = 0;
        return exitTask(remaining) && updateTask(remaining) &&
            enterTask(remaining);
      },
      runUntilDone: true,
    };

    this.workScheduler.scheduleUniqueTask(this.bindingTask);

    return this;
  }

  /**
   * Clear any previously bound data and Sprites. Previously bound Sprites will
   * still have their callbacks invoked. This is equivalent to calling bind()
   * with an empty array, except that it is guaranteed to drop expsting data and
   * Sprites, whereas calling bind([]) may be interrupted by a later call to
   * bind().
   */
  clear() {
    let step = 0;

    // Performs exit data binding while there's time remaining, then returns
    // whether there's more work to do.
    const exitTask = (remaining: RemainingTimeFn) => {
      let index = 0;

      while (index < this.boundData.length) {
        step++;

        const selection = this.selections[index];

        index++;

        selection.clear();

        if (step % this.stepsBetweenChecks === 0 && remaining() <= 0) {
          break;
        }
      }

      this.boundData.splice(0, index);
      this.selections.splice(0, index);

      return !this.boundData.length;
    };


    // Define a clearing task which will be invoked by the WorkScheduler to
    // incrementally clear all data.
    this.clearingTask = {
      // Setting id to this ensures that there will be only one bindingTask
      // associated with this object at a time. If the API user calls bind()
      // again before the previous task finishes, whatever work it had been
      // doing will be dropped for the new parameters.
      id: this.clearingTaskId,

      // Perform as much of the clearing work as time allows. When finished,
      // remove the clearingTask member. This will unblock the bindingTask, if
      // there is one.
      callback: (remaining: RemainingTimeFn) => {
        step = 0;
        const result = exitTask(remaining);
        if (result) {
          delete this.clearingTask;
        }
        return result;
      },

      // The return value of the callback indicates whether there's more to do.
      // Setting runUntilDone to true here signals that if the task cannot run
      // to completion due to time, the WorkScheduler should push it back onto
      // the end of the queue.
      runUntilDone: true,
    };

    // If a binding task was previously scheduled, unschedule it since clear
    // must take precedence.
    if (this.bindingTask) {
      this.workScheduler.unscheduleTask(this.bindingTask);
      delete this.bindingTask;
    }

    // Use the provided WorkScheduler to schedule the task.
    this.workScheduler.scheduleUniqueTask(this.clearingTask);

    // Allow method call chaining.
    return this;
  }
}
