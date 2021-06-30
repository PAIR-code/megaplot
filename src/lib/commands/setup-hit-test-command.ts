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
 * @fileoverview Sets up the hit test Regl command.
 */
import REGL from 'regl';

import {AttributeMapper} from '../attribute-mapper';
import {HitTestParameters} from '../hit-test-types';
import {fragmentShader, vertexShader} from '../shaders/hit-test-shaders';

/**
 * To avoid circular imports, this file cannot depend on scene-internal.ts so
 * here we define the minimum necessary API surface that the command needs to
 * operate.
 */
interface CoordinatorAPI {
  attributeMapper: AttributeMapper;
  elapsedTimeMs: () => number;
  getViewMatrix: () => number[];
  getViewMatrixScale: () => number[];
  hitTestAttributeMapper: AttributeMapper;
  hitTestParameters: HitTestParameters;
  hitTestValuesFramebuffer: REGL.Framebuffer2D;
  instanceCount: number;
  instanceSwatchUvBuffer: REGL.Buffer;
  instanceHitTestUvBuffer: REGL.Buffer;
  previousValuesTexture: REGL.Texture2D;
  regl: REGL.Regl;
  targetValuesTexture: REGL.Texture2D;
}

/**
 * Set up a REGL draw command to update the hit test framebuffer.
 *
 * @param coordinator Upstream renderer implementation.
 */
export function setupHitTestCommand(
    coordinator: CoordinatorAPI,
    ): REGL.DrawCommand {
  const {regl, attributeMapper, hitTestAttributeMapper} = coordinator;

  return regl({
    frag: fragmentShader(),

    vert: vertexShader(hitTestAttributeMapper, attributeMapper),

    attributes: {
      // Corners and UV coords of the rectangle, same for each sprite.
      vertexCoordinates: [
        [-0.5, -0.5],
        [0.5, -0.5],
        [-0.5, 0.5],
        [0.5, 0.5],
      ],

      // Swatch UV coordinates for retrieving previous and target texture
      // values.
      instanceSwatchUv: {
        buffer: coordinator.instanceSwatchUvBuffer,
        divisor: 1,
      },

      // Instance swatch UV coordinates.
      instanceHitTestUv: {
        buffer: coordinator.instanceHitTestUvBuffer,
        divisor: 1,
      },
    },

    uniforms: {
      ts: () => coordinator.elapsedTimeMs(),
      hitTestCoordinates: () => ([
        coordinator.hitTestParameters.x,
        coordinator.hitTestParameters.y,
        coordinator.hitTestParameters.width,
        coordinator.hitTestParameters.height,
      ]),
      inclusive: () => coordinator.hitTestParameters.inclusive ? 1 : 0,
      viewMatrix: () => coordinator.getViewMatrix(),
      viewMatrixScale: () => coordinator.getViewMatrixScale(),
      targetValuesTexture: coordinator.targetValuesTexture,
      previousValuesTexture: coordinator.previousValuesTexture,
    },

    primitive: 'triangle strip',
    count: 4,                                    // Only four vertices in total.
    instances: () => coordinator.instanceCount,  // But many sprite instances.

    framebuffer: () => coordinator.hitTestValuesFramebuffer,
  });
}
