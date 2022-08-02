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
 * @fileoverview The Renderer type is the public interface implemented by the
 * Scene.
 */

import {HitTestParameters} from './hit-test-types';
import {Selection} from './selection-types';
import {Sprite} from './sprite';
import {TextSelection} from './text-selection-types';

/**
 * Renderer is the public interface for the Scene.
 */
export interface Renderer {
  /**
   * The scale object offers an interface to set the X and Y scale of the
   * rendered scene. These numbers define how many pixel units there are to a
   * world unit in the X and Y directions to implement zooming.
   */
  scale: {x: number; y: number;};

  /**
   * The offset object offers an interface to set the X and Y offsets of the
   * rendered scene. These numbers define how many pixel units to shift in the X
   * and Y directions to implement panning.
   */
  offset: {x: number; y: number;};

  /**
   * Canvas element that the renderer uses to draw.
   */
  canvas: HTMLCanvasElement;

  /**
   * After the canvas changes shape, this method instructs the Scene to adjust
   * the offset and canvas properties (width, height) to accommodate.
   *
   * @param fixedWorldPoint Optional world point to preserve relative to the
   * canvas frame. Defaults to the world origin (0,0).
   */
  resize: (fixedWorldPoint?: {x: number, y: number}) => void;

  /**
   * This method returns the total elapsed time in milliseconds since the
   * renderer was constructed. Using regular JavaScript timestamps (milliseconds
   * since the Unix epoch) is not feasible because the values need to preserve
   * millisecond precision when cast as Float32 to be used in WebGL.
   */
  elapsedTimeMs: () => number;

  /**
   * Create and return a new Sprite. If the Renderer is already above capacity,
   * the Sprite may not be renderable.
   */
  createSprite: () => Sprite;

  /**
   * A hit test determines which Sprites from a candidate list intersect a
   * provided box in pixel coordinates relative to the canvas. Each tested
   * Sprite could either hit or not. When a Sprite hits, its corresponding value
   * in the output array will be positive or zero (non-negative). Sprites that
   * do NOT hit will yield negative numbers.
   *
   * You can interpret the numbers like a floating point z-index. Lower numbers
   * are further away from the observer, higher numbers are closer.
   *
   * @param hitTestParameters Candidate sprites and box in pixels to test.
   * @return Float32Array Array of hit test results.
   */
  hitTest: (hitTestParameters: HitTestParameters) => Float32Array;

  /**
   * Provide a Selection object for mapping data points to sprites.
   */
  createSelection: <T>() => Selection<T>;

  /**
   * Provide a TextSelection object for mapping data points to text strings as
   * represented by a sequence of glyphs.
   */
  createTextSelection: <T>() => TextSelection<T>;
}
