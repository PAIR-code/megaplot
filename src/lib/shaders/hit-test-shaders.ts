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
 * @fileoverview Provide shaders for performing a hit test which determines all
 * of the sprites under a particular screen pixel of interest. Hit testing would
 * be done in response to a mouse click for example.
 */

import {AttributeMapper} from '../attribute-mapper';

import {glsl} from './glsl-template-tag';
import * as ShaderFunctions from './shader-functions';

/**
 * Generate the fragment (pixel) shader for the hit test command. For each
 * sprite, this shader writes a packed float value in the range 0-1 into the
 * output Uint8 RGBA channels. To unpack, multiply by capacity+1, then subtract
 * 1. This will yield a number in the range (-1,capacity - 1), which is either
 * -1 for a miss, or the index of the SpriteImpl.
 *
 * @see http://marcodiiga.github.io/encoding-normalized-floats-to-rgba8-vectors
 */
export function fragmentShader() {
  return glsl`
precision lowp float;

// Need to know the maximum possible value for the index of the Sprite to
// normalize the value for RGBA packing.
uniform float capacity;

varying float varyingHitTestResult;

vec4 packFloatToVec4i(const float value) {
  const vec4 bitSh = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);
  const vec4 bitMsk = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);
  vec4 res = fract(value * bitSh);
  res -= res.xxyz * bitMsk;
  return res;
}

float fitToRange(const float result) {
  // Adding 1 to account for missing values (-1 becomes 0, etc.)
  return (result + 1.) / (capacity + 1.);
}

void main () {
  // Packing requires a number in the range 0-1.
  float n = fitToRange(varyingHitTestResult);
  gl_FragColor = packFloatToVec4i(n);
}
`;
}

/**
 * Generate the vertex shader for the hit test shader program. This positions
 * the coordinates of the rect to exactly cover the single output texel pointed
 * to by outputUv.
 *
 * @param hitTestAttributeMapper Mapper for hit test output texels.
 * @param attributeMapper Mapper for sprite state attributes.
 */
export function vertexShader(
    hitTestAttributeMapper: AttributeMapper,
    attributeMapper: AttributeMapper,
) {
  return glsl`
precision lowp float;

uniform float ts;

/**
 * Screen pixel coordinates for performing the hit test. The XY channels contain
 * the screen x and y coordinates respectively. The ZW channels hold the width
 * and height of the bounding box of interest. Currently those are ignored.
 */
uniform vec4 hitTestCoordinates;
uniform float inclusive;

uniform mat3 viewMatrix;

/**
 * Scale includes the X and Y dimensions of the viewMatrix, and their inverses
 * in the WZ components.
 */
uniform vec4 viewMatrixScale;

uniform sampler2D previousValuesTexture;
uniform sampler2D targetValuesTexture;

attribute vec2 vertexCoordinates;

attribute vec2 inputUv;
attribute vec2 indexActive;
attribute vec2 outputUv;

#define TEXELS_PER_SWATCH ${hitTestAttributeMapper.texelsPerSwatch}.
#define TEXTURE_WIDTH ${hitTestAttributeMapper.textureWidth}.
#define TEXTURE_HEIGHT ${hitTestAttributeMapper.textureHeight}.

// The result of the hit test, written to the data texel by the fragment shader.
varying float varyingHitTestResult;

vec4 previousTexelValues[${attributeMapper.texelsPerSwatch}];
vec4 targetTexelValues[${attributeMapper.texelsPerSwatch}];

${
      attributeMapper.generateAttributeDefinesGLSL(
          'previous',
          'previousTexelValues',
          )}
${
      attributeMapper.generateAttributeDefinesGLSL(
          'target',
          'targetTexelValues',
          )}

float rangeT;
float easeT;

// Import utility shader functions.
${ShaderFunctions.range()}
${ShaderFunctions.cubicEaseInOut()}
${ShaderFunctions.computeCurrentValue('rangeT', 'easeT')}
${ShaderFunctions.computeCurrentMaxAndMinSizePixel()}
${ShaderFunctions.computeCurrentSizePixelAndWorld()}
${ShaderFunctions.computeSize()}
${ShaderFunctions.computeViewVertexPosition()}

void readInputTexels() {
${
      attributeMapper.generateTexelReaderGLSL(
          'previousTexelValues',
          'previousValuesTexture',
          'inputUv',
          )}
${
      attributeMapper.generateTexelReaderGLSL(
          'targetTexelValues',
          'targetValuesTexture',
          'inputUv',
          )}
}

const vec2 swatchSize =
  vec2(TEXELS_PER_SWATCH / TEXTURE_WIDTH, 1. / TEXTURE_HEIGHT);

bool spriteOverlapsTest(const vec4 spriteBox, const vec4 testBox) {
  return (
    spriteBox.x <= testBox.x + testBox.z &&
    spriteBox.x + spriteBox.z >= testBox.x &&
    spriteBox.y >= testBox.y - testBox.w &&
    spriteBox.y + spriteBox.w <= testBox.y
  );
}

bool spriteInsideTest(const vec4 spriteBox, const vec4 testBox) {
  return (
    spriteBox.x >= testBox.x &&
    spriteBox.x + spriteBox.z <= testBox.x + testBox.z &&
    spriteBox.y <= testBox.y &&
    spriteBox.y + spriteBox.w >= testBox.y - testBox.w
  );
}

void main () {
  readInputTexels();

  // Compute time variables.
  rangeT = clamp(
      range(previousTransitionTimeMs(), targetTransitionTimeMs(), ts),
      0., 1.);
  easeT = cubicEaseInOut(rangeT);

  // Compute current size component values by interpolation (parallelized).
  vec4 currentSizePixelAndWorld = computeCurrentSizePixelAndWorld();
  vec2 currentSizePixel = currentSizePixelAndWorld.xy;
  vec2 currentSizeWorld = currentSizePixelAndWorld.zw;

  vec2 currentGeometricZoom = computeCurrentValue(
      previousGeometricZoom(),
      previousGeometricZoomDelta(),
      targetGeometricZoom()
  );

  vec4 currentMaxAndMinSizePixel = computeCurrentMaxAndMinSizePixel();
  vec2 currentMaxSizePixel = currentMaxAndMinSizePixel.xy;
  vec2 currentMinSizePixel = currentMaxAndMinSizePixel.zw;

  // Compute the current size of the sprite in world units, including the effect
  // of geometric zoom and applying min and max pixel sizes.
  vec2 computedSize = computeSize(
    currentSizeWorld,
    currentSizePixel,
    currentGeometricZoom,
    viewMatrixScale,
    currentMaxSizePixel,
    currentMinSizePixel
  );

  // Compute the current position component attributes.
  vec2 currentPositionPixel = computeCurrentValue(
      previousPositionPixel(),
      previousPositionPixelDelta(),
      targetPositionPixel());

  vec2 currentPositionWorld = computeCurrentValue(
      previousPositionWorld(),
      previousPositionWorldDelta(),
      targetPositionWorld());

  vec2 currentPositionRelative = computeCurrentValue(
      previousPositionRelative(),
      previousPositionRelativeDelta(),
      targetPositionRelative());

  // Project the world position into pixel space for the bottom left and top
  // right corners of the sprite's quad.
  vec2 bottomLeft = computeViewVertexPosition(
      currentPositionWorld,
      computedSize,
      currentPositionRelative,
      currentPositionPixel,
      vec2(-.5, -.5),
      viewMatrix
  ) * .25;
  vec2 topRight = computeViewVertexPosition(
      currentPositionWorld,
      computedSize,
      currentPositionRelative,
      currentPositionPixel,
      vec2(.5, .5),
      viewMatrix
  ) * .25;
  vec4 spriteBox = vec4(bottomLeft.xy, topRight.xy - bottomLeft.xy);

  // Hit test coordinates are presented based on the top-left corner, so to
  // orient it from the bottom left we need to subtract the height.
  vec4 testBox = hitTestCoordinates + vec4(0., hitTestCoordinates.w, 0., 0.);

  // Test whether the coordinates of interest are within the sprite quad's
  // bounding box.
  bool hit = inclusive > 0. ?
    spriteOverlapsTest(spriteBox, testBox) :
    spriteInsideTest(spriteBox, testBox);

  // The hit test result will either be -1 if it's a miss (or the Sprite was
  // inactive), or it will be the index of the Sprite.
  varyingHitTestResult =
    indexActive.y <= 0. ? -1. :
    !hit ? -1. :
    indexActive.x;

  vec2 swatchUv =
    outputUv + (vertexCoordinates.xy + .5) * swatchSize;

  // Position the verts to write into the appropriate data texel.
  gl_Position = vec4(2. * swatchUv - 1., 0., 1.);
}
`;
}
