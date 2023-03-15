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
 * @fileoverview Generic shader functions used in other shaders. Functions here
 * return GLSL code fragments when called.
 */

import { glsl } from './glsl-template-tag';

/**
 * List of types for creating vectorized versions of functions.
 */
const GEN_TYPES = ['float', 'vec2', 'vec3', 'vec4'];

/**
 * Range function. Inverse of GLSL built in mix() function.
 */
export function range() {
  return glsl`
float range(float x, float y, float a) {
  return (a - x) / (y - x);
}
`;
}

/**
 * Ease an input value t between 0 and 1 smoothly.
 */
export function cubicEaseInOut() {
  return glsl`
float cubicEaseInOut(float t) {
  return t < 0.5 ? 4.0 * t * t * t :
    4.0 * (t - 1.0) * (t - 1.0) * (t - 1.0) + 1.0;
}
`;
}

/**
 * Given a starting value, velocity and an ending value, compute the
 * instantaneous current value.
 *
 * These functions make use of the following macro variables which are presumed
 * to already be defined and in scope:
 *
 * - targetTransitionTimeMs() - #define macro for animation arrival time.
 * - previousTransitionTimeMs() - #define macro for animation start time.
 *
 * @param rangeT Name of GLSL variable containing the range'd time value. This
 * should be a value between 0 and 1 to signal progress between the previous and
 * target transition times.
 * @param easeT Name of the GLSL vairable containing the result of cubic easing
 * having been applied to the rangeT variable.
 */
export function computeCurrentValue(rangeT = 't', easeT = 'varyingT') {
  return GEN_TYPES.map(
    (genType) => glsl`
${genType} computeCurrentValue(
    ${genType} startingValue,
    ${genType} startingVelocity,
    ${genType} targetValue) {
  ${genType} currentValue = mix(startingValue, targetValue, ${easeT});
  ${genType} projectedValue = startingVelocity *
    (targetTransitionTimeMs() - previousTransitionTimeMs());
  return currentValue + projectedValue *
    ${rangeT} * (1. - ${rangeT}) * (1. - ${rangeT}) * (1. - ${rangeT});
}
  `
  ).join('\n');
}

/**
 * Utility function to generate a checkerboard pattern based on gl_FragCoord.
 * Useful for debugging. To use: call checkerFill() in the fragment shader, then
 * output this value. Creates a light/dark gray checkerboard pattern similar to
 * the background of a drawing program.
 */
export function checkerFill() {
  return glsl`
vec4 checkerFill() {
  float checker = .4 + .2 * float(
      bool(mod(floor(gl_FragCoord.x / 100.), 2.)) ^^
      bool(mod(floor(gl_FragCoord.y / 100.), 2.)));
  return vec4(vec3(checker), 1.);
}
`;
}

/**
 * For a given vertex coordinate, and other calculated values, compute the
 * viewVertexPosition, the location in view space (screen pixels) where the
 * sprite's vertex would appear.
 */
export function computeViewVertexPosition() {
  return glsl`
/**
 * @param positionWorld The position of the sprite in world coords.
 * @param size Size of the sprite in world coordinates.
 * @param positionRelative Offset position relative to vert coords.
 * @param positionPixel Offset position in screen pixels.
 * @param vertCoords Local coordinates for this vertex.
 * @param viewMatrix Matrix to project world coords into view space (pixels).
 */
vec2 computeViewVertexPosition(
    vec2 positionWorld,
    vec2 size,
    vec2 positionRelative,
    vec2 positionPixel,
    vec2 vertCoords,
    mat3 viewMatrix
) {
  vec2 vertexPositionWorld =
    positionWorld + size * (positionRelative + vertCoords);
  vec2 viewVertexPosition =
    (viewMatrix * vec3(vertexPositionWorld, 1.)).xy + positionPixel * 4.;
  return viewVertexPosition;
}
`;
}

/**
 * Compute the size of the sprite in world units, incorporating the effect of
 * geometric zoom and capping to max and min pixel sizes if specified.
 */
export function computeSize() {
  return glsl`
/**
 *
 * @param sizeWorld Size of the sprite in world coordinates.
 * @param sizePixel Offset size of the sprite in pixels.
 * @param geometricZoom The geometric zoom size modifier.
 * @param viewMatrixScale XY scale (world coords to pixels), and ZW inverse.
 * @param maxSizePixel Maximum allowed size in pixels.
 * @param minSizePixel Minimum allowed size in pixels.
 */
vec2 computeSize(
  vec2 sizeWorld,
  vec2 sizePixel,
  vec2 geometricZoom,
  vec4 viewMatrixScale,
  vec2 maxSizePixel,
  vec2 minSizePixel
) {
  // Combine scale with geometric zoom effect.
  vec2 zoomScale = exp(log(viewMatrixScale.xy) * (1. - geometricZoom))
    * pow(vec2(CLIP_SPACE_RANGE * devicePixelRatio), geometricZoom);

  // Project the size in world coordinates to pixels to apply min/max.
  vec2 projectedSizePixel = sizeWorld * zoomScale +
    sizePixel * CLIP_SPACE_RANGE * devicePixelRatio;

  // Inital computed size in world coordinates is based on projected pixel size.
  vec2 computedSize = projectedSizePixel * viewMatrixScale.zw;

  // Compute whether max and min size components are positive, in parallel.
  // XY contains results for max, ZW contains results for min.
  bvec4 isPositive = greaterThan(vec4(maxSizePixel, minSizePixel), vec4(0.));

  // Apply maximums if set.
  bvec2 gtMax = greaterThan(projectedSizePixel, maxSizePixel);
  if (isPositive.x && gtMax.x) {
    computedSize.x = maxSizePixel.x * viewMatrixScale.z;
  }
  if (isPositive.y && gtMax.y) {
    computedSize.y = maxSizePixel.y * viewMatrixScale.w;
  }

  // Apply minimums if set.
  bvec2 ltMin = lessThan(projectedSizePixel, minSizePixel);
  if (isPositive.z && ltMin.x) {
    computedSize.x = minSizePixel.x * viewMatrixScale.z;
  }
  if (isPositive.w && ltMin.y) {
    computedSize.y = minSizePixel.y * viewMatrixScale.w;
  }

  return computedSize;
}
`;
}

/**
 * In parallel, compute the current world and pixel component sizes.
 */
export function computeCurrentSizePixelAndWorld() {
  return glsl`
vec4 computeCurrentSizePixelAndWorld() {
  return computeCurrentValue(
    vec4(
      previousSizePixel(),
      previousSizeWorld()),
    vec4(
      previousSizePixelDelta(),
      previousSizeWorldDelta()),
    vec4(
      targetSizePixel(),
      targetSizeWorld())
  );
}
`;
}

/**
 * In parallel, compute the current max and min pixel component sizes.
 */
export function computeCurrentMaxAndMinSizePixel() {
  return glsl`
vec4 computeCurrentMaxAndMinSizePixel() {
  return computeCurrentValue(
    vec4(
      previousMaxSizePixel(),
      previousMinSizePixel()
    ),
    vec4(
      previousMaxSizePixelDelta(),
      previousMinSizePixelDelta()
    ),
    vec4(
      targetMaxSizePixel(),
      targetMinSizePixel()
    )
  ) * CLIP_SPACE_RANGE * devicePixelRatio;
}
`;
}

/**
 * Given the size of the sprite, compute its aspect ratio and the inverse. One
 * of the components will be 1., while the other component will be the multiple.
 * For example, a sprite which is twice as wide as it is tall will yield the
 * vector: vec4(2., 1., .5, 1.);
 */
export function computeAspectRatio() {
  return glsl`
/**
 * @param size The size of the sprite.
 * @return The aspect ratio (XY) and the inverse of the aspect ratio (ZW).
 */
vec4 computeAspectRatio(vec2 size) {
  vec2 ar = size / min(size.x, size.y);
  return vec4(ar, 1. / ar);
}
`;
}
