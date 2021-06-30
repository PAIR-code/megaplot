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
 * @fileoverview Defines the default settings for the Scene constructor.
 */

import {DEFAULT_TIMING_FUNCTIONS} from './default-timing-functions';
import {DEFAULT_GLYPH_MAPPER_SETTINGS} from './glyph-mapper';

/**
 * Default glyph set is the printible ASCII characters from 33 to 126 (dec).
 */
export const DEFAULT_GLYPHS =
    '!"#$%&\'()*+,-./0123456789:;<=>?' +   // ASCII 33 - 63.
    '@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_' +  // ASCII 63 - 95.
    '`abcdefghijklmnopqrstuvwxyz{|}';      // ASCII 96 - 126.

/**
 * Parameters to configure the Scene.
 */
export const DEFAULT_SCENE_SETTINGS = Object.freeze({
  /**
   * HTML element into which regl will place a drawable canvas.
   */
  container: document.body,

  /**
   * Default duration of transitions if not otherwise specified.
   */
  defaultTransitionTimeMs: 250,

  /**
   * String of characters to support in glyph mapper.
   */
  glyphs: DEFAULT_GLYPHS,

  /**
   * Desired number of sprites to be able to render. As this number could be
   * arbitrarily large, it may not be possible to satisfy given other system
   * constraints.
   */
  desiredSpriteCapacity: 1e6,

  /**
   * Timing functions for WorkScheduler.
   */
  timingFunctions: DEFAULT_TIMING_FUNCTIONS,

  /**
   * Settings for the glyph mapper.
   */
  glyphMapper: DEFAULT_GLYPH_MAPPER_SETTINGS,
});
