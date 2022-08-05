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
 * @fileoverview Fragment shader used by the Scene's main draw pass. For each
 * rendered pixel, the basic idea is to:
 *
 * 1. Determine this pixel's signed distance to the nearest edge of the shape.
 *    Negative values are outside, positive values are inside.
 * 2. Use the distance and the sprite's attributes to determine whether the
 *    pixel is inside, outside, or on the border of the shape.
 * 3. Based on the pixel's inside/outside/border designation, set the
 *    gl_FragColor or discard the pixel.
 *
 * Deterimining the pixel's signed distance requires interpolating between the
 * previous and target distance, each of which is computed and then mixed using
 * the supplied varyingT. This allows the sprite to 'morph' from one shape to
 * another smoothly over time.
 */

import {glsl} from './glsl-template-tag';
import * as ShaderFunctions from './shader-functions';

/**
 * Returns the code for the Scene's main rendering fragment shader program.
 */
export function fragmentShader() {
  return glsl`
precision lowp float;

/**
 * View matrix for converting from world space to clip space.
 */
uniform mat3 viewMatrix;

/**
 * Signed-distance field (SDF) texture. Sampled for implementing glyphs of text.
 */
uniform sampler2D sdfTexture;

/**
 * Varying time value, eased using cubic-in-out between the previous and target
 * timestamps for this Sprite.
 */
varying float varyingT;

/**
 * Interpolated, per-vertex coordinate attributes for the quad into which the
 * sprite will be rendered.
 */
varying vec4 varyingVertexCoordinates;

/**
 * Threshold distance values to consider the pixel outside the shape (X) or
 * inside the shape (Y). Values between constitue the borde.
 */
varying vec2 varyingBorderThresholds;

/**
 * Aspect ratio of the sprite's renderable area (XY) and their inverses (ZW).
 * One component of each pair will be 1. For the XY pair, the other component
 * be be greater than 1. and for the inverse pair it will be smaller.
 *
 * For example, a rectangle that's twice as wide as it is tall wolud have
 * varyingAspectRatio equal to vec4(2., 1., .5, 1.).
 */
varying vec4 varyingAspectRatio;

/**
 * Color attributes.
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

// Import utility shader functions).
${ShaderFunctions.range()}

const float PI = 3.1415926535897932384626433832795;

/**
 * Given a line segment described by two points (a,b), find the point along that
 * line segment nearest to a point of interest (p).
 */
vec2 closestPoint(vec2 a, vec2 b, vec2 p) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  vec2 baNorm = normalize(ba);
  float baLen = length(ba);
  float projectedLen = dot(baNorm, pa);
  vec2 closest =
    projectedLen < 0. ? a :
    projectedLen > baLen ? b :
    a + baNorm * projectedLen;
  return closest;
}

/**
 * Matrix to flip XY coordinates for theta computation. To orient polygons and
 * stars pointing upwards, we compute angles counter-clockwise from vertical.
 */
const mat2 FLIP_MATRIX = mat2(vec2(0., 1.), vec2(-1., 0.));

/**
 * Given a point in the range (-1,-1) to (1,1), compute the angle to that point,
 * going counter-clockwise from vertical.
 */
float computeTheta(vec2 point) {
  vec2 f = FLIP_MATRIX * point;
  return atan(f.y, f.x) + PI;
}

/**
 * Given the varying coordinates of interest, the dimensions of the shape's
 * bounding box, the number of sides, and a list of repeating offset radii,
 * determine the signed distance from the coordinates to the nearest edge of the
 * shape.
 *
 * @param sides Number of sides of the polygon or star.
 * @param radii List of four repeating offset radii to render stars. If all
 * values are 0., then the rendered distance will be a regular polygon.
 */
float getDistStar(int sides, vec4 radii) {
  float fSides = float(sides);

  // Flip radii (0. means align with unit circle, 1. means center of shape).
  radii = 1. - radii;

  // Angle to cut through the midpoint of a regular polygon's side.
  float piSides = PI / fSides;

  // With the polygon pointed up, this is the angle (counter-clockwise from top)
  // to the point just before crossing the X-axis. For a triangle, this will
  // just be the same as piSides.
  float wideAngle = floor(fSides * .5) * piSides;

  // Compute radius for dilation to fill bounding box.
  float dilation = 1. / max(sin(wideAngle), sin(piSides));

  // Compute the height of the shape, for centering.
  float height = dilation * (1. + max(cos(PI - 2. * wideAngle), cos(piSides)));

  // The point of interest starts with the varyingVertexCoordinates, but shifted
  // to center the shape vertically.
  vec2 poi = 2. * varyingVertexCoordinates.xy + vec2(0., 2. - height);

  // Compute theta for point of interest, counter-clockwise from vertical.
  float theta = computeTheta(poi);

  // Incorporate aspect ratio calculation. This ensures that distances to
  // borders do not stretch with the shape.
  vec2 aspect = varyingAspectRatio.xy;
  poi *= aspect;

  // Compute which side of the star we're on, and use this to compute adjustment
  // to a and b points. This creates the star effect.
  float side = floor(theta / PI * .5 * fSides);

  float minDistance = 1.e20;
  float distanceSign;

  // Look at sides to the left/right (clockwise) to find the closest.
  for (int i = -1; i < 2; i++) {
    float thisSide = side + float(i);
    float m = mod(thisSide + 4., 4.);

    vec2 adjust =
      m < 1. ? radii.xy :
      m < 2. ? radii.yz :
      m < 3. ? radii.zw :
      radii.wx;

    // Find the ab line segment endpoints.
    float thetaA = 2. * thisSide * piSides;
    float thetaB = thetaA + 2. * piSides;
    vec2 a = aspect * dilation * adjust.x * vec2(-sin(thetaA), cos(thetaA));
    vec2 b = aspect * dilation * adjust.y * vec2(-sin(thetaB), cos(thetaB));

    // Find the closest point on the segment and update minDistance.
    vec2 c = closestPoint(a, b, poi).xy;
    minDistance = min(minDistance, distance(poi, c));

    // If we're in our own segment, capture the distance sign.
    if (i == 0) {
      // Use cross product to determine if we're inside or outside the line.
      distanceSign = sign(cross(vec3(b - a, 0.), vec3(poi - c, 0.)).z);
    }
  }

  return minDistance * distanceSign;
}

/**
 * Convenience method for calling getDistStar() with a fixed size array of 0.
 * values to create a regular polygon.
 */
float getDistPolygon(int sides) {
  return getDistStar(sides, vec4(0.));
}

/**
 * Estimate the distance from the varying vertex coordinate to the nearest point
 * on an ellipse of the specified aspect ratio. Mathematically, a closed-form
 * solution for this problem has not yet been discovered.
 *
 * Higher accuracy estimates of ellipse distance are possible with more
 * computation steps, but the procedure used here yields sufficient accurancy
 * for data visualization purposes.
 */
float getDistEllipse() {
  // All quadrants can be treated the same, so use the absolute value of the
  // vertex coordinates, and flip if needed so that the X dimension is always
  // the greater.
  bool flipped = varyingAspectRatio.x < varyingAspectRatio.y;
  vec4 aspectRatio = flipped ? varyingAspectRatio.yxwz : varyingAspectRatio;

  // Point of interest in the expanded circle (before aspect ratio stretching).
  vec2 circlePoint = 2. * abs(
      flipped ? varyingVertexCoordinates.yx : varyingVertexCoordinates.xy);

  // Capture length for inside/outside checking.
  float len = length(circlePoint);

  // Point of interest in the ellipse (after aspect ratio stretching).
  vec2 ellipsePoint = circlePoint * aspectRatio.xy;

  // Compute the angle from the x-axis up to the point of interest.
  float theta = PI - atan(circlePoint.y, -circlePoint.x);

  // Find the point where a ray from the origin through c hits the ellipse.
  vec2 p1 = aspectRatio.xy * vec2(cos(theta), sin(theta));

  // Find a second point by casting up from the x-axis. If the point of interest
  // is outside the ellipse and past the tip, use the tip coordinate.
  float invAr2 = aspectRatio.z * aspectRatio.z;
  vec2 p2 = ellipsePoint.x > aspectRatio.x ? vec2(aspectRatio.x, 0.) :
    vec2(ellipsePoint.x, sqrt(1. - ellipsePoint.x * ellipsePoint.x * invAr2));

  // Take the minimum distance between ray intersection point and vertical.
  float dist = min(distance(ellipsePoint, p1), distance(ellipsePoint, p2));

  // If the point of interest is outside of the ellipse, smooth by checking the
  // distance to one more point: the point on the ellipse between p1 and p2 such
  // that its X coordinate is half way between.
  if (len > 1.) {
    vec2 pm = mix(p1, p2, .5);
    pm.y = sqrt(1. - pm.x * pm.x * invAr2);
    dist = min(dist, distance(ellipsePoint, pm));
  }

  // Return signed distance.
  return dist * sign(1. - len);
}

/**
 * Compute the signed distance from the point of interest to the nearest edge of
 * the sprite bonding box.
 */
float getDistRect() {
  // All quadrants can be treated the same, so we limit our computation to the
  // top right.
  vec2 ar = varyingAspectRatio.xy;
  vec2 p = ar * 2. * abs(varyingVertexCoordinates.xy);

  // If the point of intrest is beyond the top corner, return the negative
  // distance to that corner.
  if (all(greaterThan(p, ar))) {
    return -distance(p, ar);
  }

  // Determine distance to nearest edge.
  vec2 d = ar - p;
  vec2 dabs = abs(d);
  return dabs.x < dabs.y ? d.x : d.y;
}

/**
 * Sample the distance from the sdfTexture. The texture is assumed to have
 * one-dimensional distances in the X and Y componets and two-dimensional
 * distance in the Z component.
 *
 * @param shapeTexture UV coordinates and width/height of the region of the SDF
 * texture within which to sample (corresponds to the glyph being rendered).
 */
float getDistSDF(vec4 shapeTexture) {
  vec2 textureUv =
      shapeTexture.xy +
      shapeTexture.zw * varyingVertexCoordinates.zw;
  return 2. * texture2D(sdfTexture, textureUv).z - 1.;
}

/**
 * Generic distance function that calls through to one of the more specific
 * distance functions.
 *
 * @param sides Number of sides of the polygon/star, or special value:
 *  s < 0      : Reserved / Undefined.
 *  s == 0     : Use SDF texture coordinates.
 *  s == 1     : Circle.
 *  s == 2     : Filled rectangle.
 *  s > 2      : Polygon / Star.
 * @param textureUv Offset into SDF texture.
 */
float getDist(int sides, vec4 shapeTexture) {
  return
    sides == 0 ? getDistSDF(shapeTexture) :
    sides == 1 ? getDistEllipse() :
    sides == 2 ? getDistRect() :
    sides > 2 ? getDistPolygon(sides) :
    1.; // Reserved / undefined.
}

void main () {
  int previousSides = int(varyingPreviousSides);
  int targetSides = int(varyingTargetSides);

  float previousDistance = getDist(previousSides, varyingPreviousShapeTexture);
  float targetDistance = getDist(targetSides, varyingTargetShapeTexture);
  float signedDistance = mix(previousDistance, targetDistance, varyingT);

  vec4 color =
    signedDistance < varyingBorderThresholds.x ? vec4(0.) :
    signedDistance < varyingBorderThresholds.y ? varyingBorderColor :
    varyingFillColor;

  if (color.a < .01) {
    discard;
    return;
  }

  gl_FragColor = color;
}
`;
}
