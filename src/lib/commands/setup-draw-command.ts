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
 * @fileoverview Sets up the Regl command for performing a rebase operation.
 * This captures the instantaneous values and deltas of Sprite attributes.
 */
import REGL from 'regl';

import {AttributeMapper} from '../attribute-mapper';
import {ReglContext} from '../regl-types';
import {fragmentShader} from '../shaders/scene-fragment-shader';
import {vertexShader} from '../shaders/scene-vertex-shader';

/**
 * To avoid circular imports, this file cannot depend on scene-internal.ts so
 * here we define the minimum necessary API surface that the command needs to
 * operate.
 */
interface CoordinatorAPI {
  attributeMapper: AttributeMapper;
  elapsedTimeMs: () => number;
  getProjectionMatrix: (context: ReglContext) => number[];
  getViewMatrix: () => number[];
  getViewMatrixScale: () => number[];
  instanceCount: number;
  instanceIndexBuffer: REGL.Buffer;
  instanceSwatchUvBuffer: REGL.Buffer;
  previousValuesFramebuffer: REGL.Framebuffer2D;
  regl: REGL.Regl;
  sdfTexture: REGL.Texture;
  targetValuesTexture: REGL.Texture2D;
}

/**
 * Setup the draw command which reads from both the previous Sprite state
 * texture and the target state texture.
 */
export function setupDrawCommand(
    coordinator: CoordinatorAPI,
    ): REGL.DrawCommand {
  const regl = coordinator.regl;

  return regl({
    // TODO(jimbo): Expose a mechansim to allow the API user to override these.
    blend: {
      enable: true,
      func: {
        srcRGB: 'src alpha',
        srcAlpha: 1,
        dstRGB: 'one minus src alpha',
        dstAlpha: 1
      },
      equation: {
        rgb: 'add',
        alpha: 'max',
      },
    },

    frag: fragmentShader(),

    vert: vertexShader(coordinator.attributeMapper),

    attributes: {
      // Corners and uv coords of the rectangle, same for each sprite.
      vertexCoordinates: [
        [-0.5, -0.5, 0, 1],
        [0.5, -0.5, 1, 1],
        [-0.5, 0.5, 0, 0],
        [0.5, 0.5, 1, 0],
      ],

      // Swatch uv coordinates for retrieving data texture values.
      instanceSwatchUv: {
        buffer: coordinator.instanceSwatchUvBuffer,
        divisor: 1,
      },

      // Instance indices for computing default z-ordering.
      instanceIndex: {
        buffer: coordinator.instanceIndexBuffer,
        divisor: 1,
      },
    },

    uniforms: {
      ts: () => coordinator.elapsedTimeMs(),
      instanceZ: () => 1 / (1 + coordinator.instanceCount),
      viewMatrix: () => coordinator.getViewMatrix(),
      viewMatrixScale: () => coordinator.getViewMatrixScale(),
      projectionMatrix: context => coordinator.getProjectionMatrix(context),
      sdfTexture: coordinator.sdfTexture,
      previousValuesTexture: coordinator.previousValuesFramebuffer,
      targetValuesTexture: coordinator.targetValuesTexture,
    },

    primitive: 'triangle strip',
    count: 4,                                    // Only four vertices in total.
    instances: () => coordinator.instanceCount,  // But many sprite instances.
  });
}
