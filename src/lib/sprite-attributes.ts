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
 * @fileoverview Attributes of a Sprite.
 */

/**
 * A Sprite has a number of attributes that can be set by the user of the API.
 * Each attribute has these properties.
 */
export interface SpriteAttribute {
  /**
   * The name of this attribute. Should be camel cased with leading capital.
   * Prefixes for 'previous' and 'target' will be prepended in generated code.
   */
  readonly attributeName: string;

  /**
   * Whether this attribute is the timestamp attribute for the sprite's state.
   * Generally, this should be true for the first attribute and no others.
   */
  readonly isTimestamp?: boolean;

  /**
   * Whether this attribute is interpolable (can be interpolated). If this
   * property is missing, it's assumed to false. When interpolable is true, the
   * instantaneous velocity can be computed, and space should be reserved for
   * it.
   */
  readonly isInterpolable?: boolean;

  /**
   * Whether this attribute's components support broadcasting as a means of
   * destructuring assignment. For example, it's often the case--though not
   * always--that an API user will want to set both the X and Y components of
   * Max- or MinSizePixel to the same value. Since isBroadcastable is set to
   * true for these attributes, the destructuring setter will permit a single
   * numeric argument to apply to all components.
   */
  readonly isBroadcastable?: boolean;

  /**
   * Components of this attribute. If present, must be an array of length 2, 3
   * or 4 and will be mapped to a vec2, vec3 or vec4 in GLSL, respectively. If
   * this property is absent, then the attribute is presumed to be a float.
   */
  readonly components?: readonly string[];

  /**
   * Minimum allowable value of this attribute. Enforced by runtime checks.
   */
  readonly minValue?: number;

  /**
   * Maximum allowable value of this attribute. Enforced by runtime checks.
   */
  readonly maxValue?: number;
}

/**
 * This is the complete list of attributes that each Sprite has. These are used
 * to generate GLSL code to unpack values from the input data textures. These
 * are also used when computing instantaneous values to flash to data textures
 * during the rebase operation.
 *
 * Notes:
 *  - X coordinates are always oriented positive=right.
 *  - Y coordinates are positive=up for World coordinates.
 *  - Y coordinates are positive=down for Pixel coordinates.
 *  - Opacity is named as it is for compatibility with D3 color objects.
 */
export const SPRITE_ATTRIBUTES: readonly SpriteAttribute[] = [
  /**
   * Time in milliseconds that the sprite's other attributes should take to
   * animate to their target states. Should not be negative. A value of zero
   * means that the sprite should achieve its target state immediately.
   */
  {
    attributeName: 'TransitionTimeMs',
    isTimestamp: true,
  },

  /**
   * Sprite position and size in world coordinates.
   */
  {
    attributeName: 'PositionWorld',
    isInterpolable: true,
    components: ['X', 'Y'],
  },
  {
    attributeName: 'SizeWorld',
    isInterpolable: true,
    isBroadcastable: true,
    components: ['Width', 'Height'],
  },

  /**
   * By default, when rendering, sprites are stacked such that later allocated
   * sprites appear on top of earlier sprites. This guarantees that when sprites
   * overlap and have partially transparent pixels, the pixel values blend
   * appropriately.
   *
   * However, sometimes it's beneficial to override the Z ordering, even if that
   * could cause blending issues. For example, when a user hovers over a point,
   * it could make sense to raise that sprite to the top.
   *
   * The OrderZ attribute allows the API user to override the default stacking.
   * If specified, this value should be in the range 0-1. Any sprite with a
   * specified non-zero OrderZ will be rendered on top of any sprites with
   * unspecified OrderZ. When two sprites both have OrderZs set, the one with
   * the higher value will be on top.
   */
  {
    attributeName: 'OrderZ',
    isInterpolable: true,
    minValue: 0,
    maxValue: 1,
  },

  /**
   * Amount to zoom sprite sizes based on current scale. In the shaders, this
   * formula is used:
   *
   *   currentSizeWorld * exp(log(scale) * (1. - currentGeometricZoom))
   *
   * The default value of 0 means to linearly scale the world size with the
   * current scale value. A value of 1 means to not scale at all. This would
   * effectively interpret the world coordinate as a pixel value (1=1).
   *
   * Values in between 0 and 1 signal a partial scaling of sizes based on
   * zoom level. This produces an intermediate effect such that a dense
   * scatter plot's points grow somewhat, but not so much that they occlude
   * when zoomed far in.
   *
   * Geometric zoom is applied before adding SizePixel values, and before
   * capping to MaxSizePixel or MinSizePixel.
   *
   * This behavior is based on Benjamin Schmidt's approach (linked below),
   * except that it uses a default value of zero. This design choice
   * preserves the sprite initialization and memory restoration procedures
   * of flashing zeros to the underlyng buffers' swatches.
   *
   * https://observablehq.com/@bmschmidt/zoom-strategies-for-huge-scatterplots-with-three-js
   */
  {
    attributeName: 'GeometricZoom',
    isInterpolable: true,
    isBroadcastable: true,
    components: ['X', 'Y'],
  },

  /**
   * Sprite offset position in pixels.
   */
  {
    attributeName: 'PositionPixel',
    isInterpolable: true,
    components: ['X', 'Y'],
  },

  /**
   * Additional width and height in pixels.
   */
  {
    attributeName: 'SizePixel',
    isInterpolable: true,
    isBroadcastable: true,
    components: ['Width', 'Height'],
  },

  /**
   * Maximum size when rendered in pixels. Any non-positive value is treated
   * as unbounded.
   */
  {
    attributeName: 'MaxSizePixel',
    isInterpolable: true,
    isBroadcastable: true,
    components: ['Width', 'Height'],
  },

  /**
   * Minimum size when rendered in pixels. Any non-positive value is treated
   * as unbounded.
   */
  {
    attributeName: 'MinSizePixel',
    isInterpolable: true,
    isBroadcastable: true,
    components: ['Width', 'Height'],
  },

  /**
   * Sprite offset position in multiples of the rendered size. Importantly, this
   * additional position is computed after Max and Min pixel sizes are applied.
   * This is principally used when positioning text label glyphs so that they
   * remain in place during scaling.
   */
  {
    attributeName: 'PositionRelative',
    isInterpolable: true,
    components: ['X', 'Y'],
  },

  /**
   * When rendered, each sprite is presented to the fragment shader a
   * rectangle (an instanced quad of two triangles joined at the diagonal).
   * You can think of this like a bounding box. Within those bounds
   * different fragment-shader rendered shapes are possible.
   *
   * The Sides attribute specifies how the fragment shader should compute the
   * signed 'distance' of each pixel.
   *
   * The following table describes the range of behaviors:
   *   s == 0     : Use SDF texture coordinates.
   *   0 > s > 1  : Reserved / Undefined.
   *   s == 1     : Circle / Ellipse.
   *   1 > s > 2  : Reserved / Undefined.
   *   s == 2     : Filled Square / Rectangle.
   *   s > 2      : Regular Polygon.
   *
   * Regular Polygons are rendered with the first point pointing upwards. For
   * example, the value 3 creates a unilateral triangle pointed up. The
   * value 4 creates a square pointed up--that is, with sides at 45 degrees
   * to the Cartesian plane (like a diamond).
   */
  {
    attributeName: 'Sides',
  },

  /**
   * When Sides == 0, these coordinates describe where within the SDF texture to
   * sample for this sprite's shape. (Used for glyphs of text).
   */
  {
    attributeName: 'ShapeTexture',
    components: ['U', 'V', 'Width', 'Height'],
  },

  /**
   * The border can have width in both pixel coordinates, and relative to the
   * size of the sprite (width or height, whichever is smaller). These are
   * additive. Note that the size of the border does not affect the size of the
   * sprite, so there is no conflict here.
   */
  {
    attributeName: 'BorderRadiusPixel',
    isInterpolable: true,
  },
  {
    attributeName: 'BorderRadiusRelative',
    isInterpolable: true,
  },

  /**
   * Placement of the border from totally inside the shape (0) to totally
   * outside the shape (1). A value of 0.5 places the center of the border
   * exactly on the line between inside and outside the shape.
   */
  {
    attributeName: 'BorderPlacement',
    isInterpolable: true,
  },

  {
    attributeName: 'BorderColor',
    isInterpolable: true,
    components: ['R', 'G', 'B', 'Opacity'],
  },

  /**
   * Fill blend determines whether the fill should be entirely defined by
   * the fill color (0), or entirely by the sampled atlas texture (1).
   */
  {
    attributeName: 'FillBlend',
    isInterpolable: true,
  },
  {
    attributeName: 'FillColor',
    isInterpolable: true,
    components: ['R', 'G', 'B', 'Opacity'],
  },
  {
    attributeName: 'FillTexture',
    components: ['U', 'V', 'Width', 'Height'],
  },
];
