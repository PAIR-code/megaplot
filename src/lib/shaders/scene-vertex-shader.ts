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
 * @fileoverview Vertex shader used by Scene, passed to regl. This shader is run
 * roughly every animation frame to position Sprites, unless none have moved
 * from the previous frame.
 *
 * To render each Sprite, this shader reads data values from the 'previous'
 * texture and the 'target' texture. The instantaneous value of any Sprite
 * attribute is computed by interpolating between these two states according to
 * the time uniform `ts`.
 *
 * The Scene's vertex shader is somewhat like what you might find in a typical
 * GL pipeline with a few differences. A typical GL pipeline has these
 * steps:
 *  - Local coordinates -> Model matrix ->
 *  - World coordinates -> View matrix ->
 *  - View space -> Projection matrix ->
 *  - Clip space -> Viewport transform ->
 *  - Screen space.
 *
 * However, a couple of things make Scene unique:
 *  - We need to interpolate to find the instantaneous positions.
 *  - Many properties are specified in both world and pixel coordinates.
 *  - The only 'local' coordinates are the vertexCoordinates.xy, and these are
 *    already also world coordinates.
 *  - Producing world coordinates is an algebraic operation combining the
 *    vertex coordinates with instance offsets and dimensions.
 *
 * Thus the Scene vertex pipeline has these steps:
 *  - Vertex coordinates + Instance world coordinates/dimensions ->
 *  - World coordinates -> View matrix ->
 *  - Pixel coordinates + Instance pixel coordinates/dimensions ->
 *    Projection maxtrix -> Clip space
 */

import {AttributeMapper} from '../attribute-mapper';

import {glsl} from './glsl-template-tag';
import * as ShaderFunctions from './shader-functions';

/**
 * Returns the code for the Scene's main rendering vertex shader program.
 * Uses generated GLSL code fragments produced by the supplied AttributeMapper.
 */
export function vertexShader(attributeMapper: AttributeMapper) {
  return glsl`
precision lowp float;

/**
 * WebGL vertex shaders output coordinates in clip space, which is a 3D volume
 * where each component is clipped to the range (-1,1). The distance from
 * edge-to-edge is therefore 2.
 */
const float CLIP_SPACE_RANGE = 2.;

/**
 * Each sprite receives the same vertex coordinates, which describe a unit
 * square centered at the origin. However, the distance calculations performed
 * by the fragment shader use a distance of 1 to mean the dead center of a
 * circle, which implies a diameter of 2. So to convert from sprite vertex
 * coordinate space to edge distance space requires a dilation of 2.
 */
const float EDGE_DISTANCE_DILATION = 2.;

/**
 * Current uniform timestamp for interpolating.
 */
uniform float ts;

/**
 * Effective devicePixelRatio.
 */
uniform float devicePixelRatio;

/**
 * Total number of sprite instances being rendered this pass. Used to compute
 * clip-space Z for stacking sprites based on their instanceIndex.
 * This ensures that partial-opacity pixels of stacked sprites will be
 * alpha-blended. Without this, occluded sprites' pixels may not blend.
 */
uniform float instanceCount;

/**
 * Granularity expected in the value of OrderZ values. The higher the
 * granularity, the more control the user has over the Z position of sprites.
 * However, this leaves less precision for correctly positioning sprites which
 * have exactly the same OrderZ value.
 */
uniform float orderZGranularity;

/**
 * View and projection matrices for converting from world space to clip space.
 */
uniform mat3 viewMatrix;
uniform mat3 projectionMatrix;

/**
 * Scale includes the X and Y dimensions of the viewMatrix, and their inverses
 * in the WZ components.
 */
uniform vec4 viewMatrixScale;

/**
 * Data textures holding the previous and target Sprite instance
 * attributes. The instantaneous value for each attribute is determined by
 * interpolating between the previous and target according to the ts uniform.
 */
uniform sampler2D previousValuesTexture;
uniform sampler2D targetValuesTexture;

/**
 * Per-vertex coordinates for the quad into which the sprite will be rendered.
 * XY contain the local cartesian coordinates for a unit square centered at the
 * origin. The ZW coordinates contain the y-flipped UV coordinates for orienting
 * the square against texture atlases.
 *
 *   vertexCoordinates: [
 *     [-0.5, -0.5, 0, 1],
 *     [0.5, -0.5, 1, 1],
 *     [-0.5, 0.5, 0, 0],
 *     [0.5, 0.5, 1, 0],
 *   ],
 *
 */
attribute vec4 vertexCoordinates;

/**
 * Instanced, per-sprite index and UV coordinates of the sprite's data swatch.
 */
attribute float instanceIndex;
attribute vec2 instanceSwatchUv;

/**
 * Varying time value, eased using cubic-in-out between the previous and target
 * timestamps for this Sprite.
 */
varying float varyingT;

/**
 * Interpolated vertexCoordinates for fragment shader.
 */
varying vec4 varyingVertexCoordinates;

/**
 * Threshold distance values to consider the pixel outside the shape (X) or
 * inside the shape (Y). Values between constitute the border.
 */
varying vec2 varyingBorderThresholds;

/**
 * Aspect ratio of the sprite's renderable area (XY) and their inverses (ZW).
 * One component of each pair will be 1. For the XY pair, the other component
 * be be greater than 1. and for the inverse pair it will be smaller.
 *
 * For example, a rectangle that's twice as wide as it is tall would have
 * varyingAspectRatio equal to vec4(2., 1., .5, 1.).
 */
varying vec4 varyingAspectRatio;

/**
 * Color attributes used by fragment shader.
 */
varying vec4 varyingBorderColor;
varying vec4 varyingFillColor;

/**
 * Shape attributes used by fragment shader.
 */
varying float varyingPreviousSides;
varying float varyingTargetSides;
varying vec4 varyingPreviousShapeTexture;
varying vec4 varyingTargetShapeTexture;

// Import utility shader functions.
${ShaderFunctions.range()}
${ShaderFunctions.cubicEaseInOut()}

// These arrays are filled in by code generated by the AttributeMapper.
vec4 previousTexelValues[${attributeMapper.texelsPerSwatch}];
vec4 targetTexelValues[${attributeMapper.texelsPerSwatch}];

/**
 * Read data texel values into the previous and target arrays.
 */
void readTexels() {
    ${
      attributeMapper.generateTexelReaderGLSL(
          'previousTexelValues', 'previousValuesTexture', 'instanceSwatchUv')}
    ${
      attributeMapper.generateTexelReaderGLSL(
          'targetTexelValues', 'targetValuesTexture', 'instanceSwatchUv')}
}

// Dynamically generate #DEFINE statements to access texel attributes by name.
// These look like method invocations elsewhere in the code. For example, the
// define "targetTransitionTimeMs()" extracts the float value
// targetTexelValues[0].r.
${
      attributeMapper.generateAttributeDefinesGLSL(
          'previous', 'previousTexelValues')}
${attributeMapper.generateAttributeDefinesGLSL('target', 'targetTexelValues')}

/**
 * Local, non-eased, normalized time value between 0 and 1, computed between the
 * previous and target timestamp according to the uniform ts.
 */
float t;

${ShaderFunctions.computeCurrentValue()}

/**
 * Precomputed constant value for converting colors in the 0-255 RGB range to
 * the GL standard 0-1 range. (1 / 255 = 0.00392156862745098)
 */
const vec4 GL_COLOR = vec4(vec3(0.00392156862745098), 1.);

/**
 * Function to compute all the varying values needed by the fragment shader.
 */
void setupVaryings() {
  // Clamp and range t value within previous and target timestamps.
  t =
    ts >= targetTransitionTimeMs() ? 1. :
    ts <= previousTransitionTimeMs() ? 0. :
    clamp(range(previousTransitionTimeMs(), targetTransitionTimeMs(), ts),
        0., 1.);

  // Compute eased varyingT.
  varyingT = cubicEaseInOut(t);

  // Copy and interpolate vertex coordinate values.
  varyingVertexCoordinates = vertexCoordinates;

  // Copy previous and target shape attributes.
  varyingPreviousSides = previousSides();
  varyingPreviousShapeTexture = previousShapeTexture();
  varyingTargetSides = targetSides();
  varyingTargetShapeTexture = targetShapeTexture();

  // Compute color attributes.
  varyingBorderColor = computeCurrentValue(
    previousBorderColor(),
    previousBorderColorDelta(),
    targetBorderColor()) * GL_COLOR;
  varyingFillColor = computeCurrentValue(
    previousFillColor(),
    previousFillColorDelta(),
    targetFillColor()) * GL_COLOR;
}

${ShaderFunctions.computeAspectRatio()}
${ShaderFunctions.computeCurrentMaxAndMinSizePixel()}
${ShaderFunctions.computeCurrentSizePixelAndWorld()}
${ShaderFunctions.computeSize()}
${ShaderFunctions.computeViewVertexPosition()}

void main () {

  // Read data values from previous and target data textures.
  readTexels();

  // Setup varying values used both here and by the fragment shader.
  setupVaryings();

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

  // Compute border attributes in parallel.
  vec3 borderProperties = computeCurrentValue(
      vec3(
        previousBorderRadiusPixel(),
        previousBorderRadiusRelative(),
        previousBorderPlacement()),
      vec3(
        previousBorderRadiusPixelDelta(),
        previousBorderRadiusRelativeDelta(),
        previousBorderPlacementDelta()),
      vec3(
        targetBorderRadiusPixel(),
        targetBorderRadiusRelative(),
        targetBorderPlacement())
  );
  float currentBorderRadiusPixel = borderProperties.x;
  float currentBorderRadiusRelative = borderProperties.y;
  float currentBorderPlacement = borderProperties.z;

  // Project the computed size into pixels by using the viewMatrixScale. Note
  // that this already includes the effect of the devicePixelRatio, and a 2x
  // multiplier for clip-space, which goes from -1 to 1 in all dimensions.
  vec2 projectedSizePixel = computedSize.xy * viewMatrixScale.xy;

  // The fragment shader needs to know the threshold signed distances that
  // indicate whether each pixel is inside the shape, in the boreder, or outside
  // of the shape. A point right on the edge of the shape will have a distance
  // of 0. In edge-distance space, a distance of 1 would be the dead center of a
  // circle.
  float edgeDistance = currentBorderRadiusRelative + (
      currentBorderRadiusPixel *
      CLIP_SPACE_RANGE *
      EDGE_DISTANCE_DILATION *
      devicePixelRatio /
      min(projectedSizePixel.x, projectedSizePixel.y)
    );
  varyingBorderThresholds =
    vec2(0., edgeDistance) + mix(0., -edgeDistance, currentBorderPlacement);

  // Compute the sprite's aspect ratio and the inverse.
  varyingAspectRatio = computeAspectRatio(computedSize);

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

  // Project the world position into pixel space, then add the pixel component.
  vec2 viewVertexPosition = computeViewVertexPosition(
      currentPositionWorld,
      computedSize,
      currentPositionRelative,
      currentPositionPixel,
      vertexCoordinates.xy,
      viewMatrix
  );

  // Project the pixel space coordinate into clip space.
  vec2 clipVertexPosition =
    (projectionMatrix * vec3(viewVertexPosition, 1.)).xy;

  // Compute the current user-specified OrderZ value.
  float currentOrderZ = computeCurrentValue(
      previousOrderZ(),
      previousOrderZDelta(),
      targetOrderZ());

  // Compute the stacking Z value for index-order blending.
  float stackZ = (1. + instanceIndex) / (1. + instanceCount);

  // Use provided granularity to combine current and stack Z values.
  float gInv = 1. / orderZGranularity;

  float combinedZ =
    mix(0., 1. - gInv, currentOrderZ) +
    mix(0., gInv, stackZ);

  // Project combined Z into clip space.
  float clipZ = mix(1., -1., combinedZ);

  gl_Position = vec4(clipVertexPosition, clipZ, 1.);
}
`;
}
