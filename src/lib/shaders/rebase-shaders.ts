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
 * @fileoverview Provide shaders for rebasing sprites. During this procedure,
 * the instantaneous velocities (Deltas) for interpolable attributes are
 * computed in parallel.
 */

import {AttributeMapper} from '../attribute-mapper';

import {glsl} from './glsl-template-tag';
import * as ShaderFunctions from './shader-functions';

/**
 * Generate the fragment (pixel) shader for the rebase command. The supplied
 * AttributeMapper is used to translate between texel channels and sprite
 * attribute values.
 */
export function fragmentShader(attributeMapper: AttributeMapper) {
  return glsl`
precision lowp float;

uniform float ts;

uniform sampler2D previousValuesTexture;
uniform sampler2D targetValuesTexture;

varying float varyingTexelIndex;
varying vec2 varyingRebaseUv;

vec4 previousTexelValues[${attributeMapper.texelsPerSwatch}];
vec4 targetTexelValues[${attributeMapper.texelsPerSwatch}];

${
      attributeMapper.generateAttributeDefinesGLSL(
          'previous', 'previousTexelValues')}
${attributeMapper.generateAttributeDefinesGLSL('target', 'targetTexelValues')}

// Import utility shader functions.
${ShaderFunctions.range()}
${ShaderFunctions.cubicEaseInOut()}

float computeValueAtTime(
    float startingValue,
    float startingDelta,
    float targetValue,
    float ts) {
  float rangeT =
    ts >= targetTransitionTimeMs() ? 1. :
    ts <= previousTransitionTimeMs() ? 0. :
    clamp(
        range(previousTransitionTimeMs(), targetTransitionTimeMs(), ts),
        0., 1.);
  float easeT = cubicEaseInOut(rangeT);

  float currentValue = mix(startingValue, targetValue, easeT);
  float projectedValue = startingDelta *
    (targetTransitionTimeMs() - previousTransitionTimeMs());

  return currentValue + projectedValue * rangeT * pow(1. - rangeT, 3.);
}

// DELTA_MS is the duration in milliseconds to use when estimating the
// 'instantaneous' change in a value. INV_DELTA_MS is its inverse.
#define DELTA_MS 1.
#define INV_DELTA_MS 1.

float computeDeltaAtTime(
    float startingValue,
    float startingDelta,
    float targetValue,
    float ts
) {
  if (ts >= targetTransitionTimeMs()) {
    return 0.;
  }
  if (ts <= previousTransitionTimeMs()) {
    return startingDelta;
  }
  return (
      computeValueAtTime(
          startingValue, startingDelta, targetValue, ts + DELTA_MS) -
      computeValueAtTime(
          startingValue, startingDelta, targetValue, ts)
      ) * INV_DELTA_MS;
}

float computeThresholdValue(
    float previousValue,
    float targetValue,
    float rebaseTs
) {
  float mid = mix(previousTransitionTimeMs(), targetTransitionTimeMs(), .5);
  return rebaseTs < mid ? previousValue : targetValue;
}

void readInputTexels() {
${
      attributeMapper.generateTexelReaderGLSL(
          'previousTexelValues', 'previousValuesTexture', 'varyingRebaseUv')}
${
      attributeMapper.generateTexelReaderGLSL(
          'targetTexelValues', 'targetValuesTexture', 'varyingRebaseUv')}
}

void setOutputTexel() {
  float rebaseTs = ts;
  ${
      attributeMapper.generateRebaseFragmentGLSL(
          'previousTexelValues', 'targetTexelValues', 'varyingTexelIndex',
          'rebaseTs')}
}

void main () {
  readInputTexels();
  setOutputTexel();
}
`;
}

/**
 * Generate the vertex shader for the rebase program.
 */
export function vertexShader(attributeMapper: AttributeMapper) {
  return glsl`
precision lowp float;

attribute vec2 vertexCoordinates;

attribute vec2 instanceRebaseUv;

#define TEXELS_PER_SWATCH ${attributeMapper.texelsPerSwatch}.
#define TEXTURE_WIDTH ${attributeMapper.textureWidth}.
#define TEXTURE_HEIGHT ${attributeMapper.textureHeight}.

varying vec2 varyingRebaseUv;
varying float varyingTexelIndex;

const vec2 swatchSize =
  vec2(TEXELS_PER_SWATCH / TEXTURE_WIDTH, 1. / TEXTURE_HEIGHT);

void main () {
  varyingRebaseUv = instanceRebaseUv;
  varyingTexelIndex = (vertexCoordinates.x + .5) * TEXELS_PER_SWATCH - .5;
  vec2 swatchUv = instanceRebaseUv + (vertexCoordinates.xy + .5) * swatchSize;
  gl_Position = vec4(2. * swatchUv - 1., 0., 1.);
}
`;
}
