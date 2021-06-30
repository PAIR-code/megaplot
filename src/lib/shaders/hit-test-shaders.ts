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
 * sprite, this shader writes whether the screen pixel of interest intersects it
 * to the RGB color channels of the output texel.
 */
export function fragmentShader() {
  return glsl`
precision lowp float;

varying float varyingHitTestResult;

void main () {
  gl_FragColor = vec4(vec3(varyingHitTestResult), 1.);
}
`;
}

/**
 * Generate the vertex shader for the hit test shader program. This positions
 * the coordinates of the rect to exactly cover the single output texel pointed
 * to by instanceHitTestUv.
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

uniform mat3 viewMatrix;

/**
 * Scale includes the X and Y dimensions of the viewMatrix, and their inverses
 * in the WZ components.
 */
uniform vec4 viewMatrixScale;

uniform sampler2D previousValuesTexture;
uniform sampler2D targetValuesTexture;

attribute vec2 vertexCoordinates;

attribute vec2 instanceSwatchUv;
attribute vec2 instanceHitTestUv;

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
          'instanceSwatchUv',
          )}
${
      attributeMapper.generateTexelReaderGLSL(
          'targetTexelValues',
          'targetValuesTexture',
          'instanceSwatchUv',
          )}
}

const vec2 swatchSize =
  vec2(TEXELS_PER_SWATCH / TEXTURE_WIDTH, 1. / TEXTURE_HEIGHT);

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

  // Test whether the coordinates of interest are within the sprite quad's
  // bounding box.
  // TODO (jimbo): Use ZW components to test for area of interest.
  varyingHitTestResult =
    bottomLeft.x < hitTestCoordinates.x &&
    bottomLeft.y > hitTestCoordinates.y &&
    topRight.x > hitTestCoordinates.x &&
    topRight.y < hitTestCoordinates.y ? 1. : 0.;

  vec2 swatchUv =
    instanceHitTestUv + (vertexCoordinates.xy + .5) * swatchSize;

  // Position the verts to write into the appropriate data texel.
  gl_Position = vec4(2. * swatchUv - 1., 0., 1.);
}
`;
}
