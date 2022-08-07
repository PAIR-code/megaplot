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

import {DEFAULT_TIMING_FUNCTIONS, TimingFunctions} from './default-timing-functions';
import {DEFAULT_GLYPH_MAPPER_SETTINGS, GlyphMapperSettings} from './glyph-mapper';

/**
 * Default glyph set is the printable ASCII characters from 33 to 126 (decimal).
 */
export const DEFAULT_GLYPHS =
    '!"#$%&\'()*+,-./0123456789:;<=>?' +   // ASCII 33 - 63.
    '@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_' +  // ASCII 63 - 95.
    '`abcdefghijklmnopqrstuvwxyz{|}';      // ASCII 96 - 126.

/**
 * Parameters to configure the Scene.
 */
export const DEFAULT_SCENE_SETTINGS: SceneSettings = Object.freeze({
  container: document.body,
  defaultTransitionTimeMs: 250,
  desiredSpriteCapacity: 1e6,
  glyphs: DEFAULT_GLYPHS,
  glyphMapper: DEFAULT_GLYPH_MAPPER_SETTINGS,
  orderZGranularity: 10,
  timingFunctions: DEFAULT_TIMING_FUNCTIONS,
});

/**
 * Settings to configure a Scene.
 *
 * @param {HTMLElement} container Element into which regl will insert a canvas.
 * @param {number} defaultTransitionTimeMs Default duration of transitions in
 *     milliseconds. Defaults to 250ms, but can be made longer or shorter to
 *     suit your needs. Any value below the duration of an animation frame
 *     (~17ms) will effectively be instantaneous.
 * @param {number} desiredSpriteCapacity Desired number of sprites to be able to
 *     render. As this number could be arbitrarily large, it may not be possible
 *     to satisfy given other system constraints. It is best to provide some
 *     headroom when setting this value; failure to do so can cause your sprites
 *     to not render in the Scene even though the .bind(), etc. callbacks may
 *     fire for the datum and its associated SpriteView.
 * @param {string} glyphs Characters to support in glyph mapper.
 * @param {GlyphMapperSettings} glyphMapper Settings for the glyph mapper.
 * @param {number} orderZGranularity Granularity of OrderZ values. Higher means
 *     more granular control over user-specified OrderZ, but reduces precision
 *     remaining for differentiating stacked sprites with the same OrderZ.
 * @param {TimingFunctions} timingFunctions Timing functions for WorkScheduler.
 */
export interface SceneSettings {
  container: HTMLElement;
  defaultTransitionTimeMs: number;
  desiredSpriteCapacity: number;
  glyphs: string;
  glyphMapper: GlyphMapperSettings;
  orderZGranularity: number;
  timingFunctions: TimingFunctions;
}
