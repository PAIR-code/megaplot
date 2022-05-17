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
 * @fileoverview Scene is the leading interface for API consumers.
 */

import {SceneSettings} from './default-scene-settings';
import {HitTestPromise} from './hit-test-types';
import {Renderer} from './renderer-types';
import {SceneInternal} from './scene-internal';
import {Selection} from './selection-types';
import {SceneInternalSymbol} from './symbols';
import {TextSelection} from './text-selection-types';

export class Scene implements Renderer {
  private[SceneInternalSymbol]: SceneInternal;

  constructor(params: Partial<SceneSettings> = {}) {
    this[SceneInternalSymbol] = new SceneInternal(params);
  }

  /**
   * The scale object offers an interface to set the X and Y scale of the
   * rendered world. These numbers define how many pixel units there are to a
   * world unit in the X and Y directions to implement zooming.
   */
  get scale(): {x: number; y: number;} {
    return this[SceneInternalSymbol].scale;
  }

  /**
   * The offset object offers an interface to set the X and Y offsets of the
   * rendered scene. These numbers define how many pixel units to shift in the X
   * and Y directions to implement panning.
   */
  get offset() {
    return this[SceneInternalSymbol].offset;
  }

  /**
   * Canvas element that the renderer uses to draw.
   */
  get canvas() {
    return this[SceneInternalSymbol].canvas;
  }

  /**
   * This method returns the total elapsed time in milliseconds since the
   * renderer was constructed. Using regular JavaScript timestamps (milliseconds
   * since the Unix epoch) is not feasible because the values need to preserve
   * millisecond precision when cast as Float32 to be used in WebGL.
   */
  elapsedTimeMs() {
    return this[SceneInternalSymbol].elapsedTimeMs();
  }

  /**
   * Create and return a new Sprite. If the Renderer is already above capacity,
   * the Sprite may not be renderable.
   */
  createSprite() {
    return this[SceneInternalSymbol].createSprite();
  }

  /**
   * Given a pair of mouse coordinates relative to the drawable container,
   * determine which Sprites' bounding boxes intersect that point and return
   * them. If multiple hit tests are in flight simultaneously, the same promise
   * may be returned and only the final specified set of coordinates will be
   * used.
   */
  hitTest(x: number, y: number, width = 0, height = 0, inclusive = true):
      HitTestPromise {
    return this[SceneInternalSymbol].hitTest(
        x,
        y,
        width,
        height,
        inclusive,
    );
  }

  /**
   * Provide a Selection object for mapping data points to sprites.
   */
  createSelection<T>(): Selection<T> {
    return this[SceneInternalSymbol].createSelection<T>();
  }

  /**
   * Provide a TextSelection object for mapping data points to text strings as
   * represented by a sequence of glyphs.
   */
  createTextSelection<T>(): TextSelection<T> {
    return this[SceneInternalSymbol].createTextSelection<T>();
  }
}
