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
import {fragmentShader, vertexShader} from '../shaders/rebase-shaders';

/**
 * To avoid circular imports, this file cannot depend on scene-internal.ts so
 * here we define the minimum necessary API surface that the command needs to
 * operate.
 */
interface CoordinatorAPI {
  attributeMapper: AttributeMapper;
  elapsedTimeMs: () => number;
  instanceRebaseUvBuffer: REGL.Buffer;
  previousValuesFramebuffer: REGL.Framebuffer2D;
  previousValuesTexture: REGL.Texture2D;
  rebaseCount: number;
  regl: REGL.Regl;
  targetValuesTexture: REGL.Texture2D;
}

/**
 * Set up a REGL draw command to update the memory of current and velocity
 * values for sprite attributes.
 *
 * @param coordinator Upstream renderer implementation.
 */
export function setupRebaseCommand(
    coordinator: CoordinatorAPI,
    ): () => void {
  // Calling regl() requires a DrawConfig and returns a DrawCommand. The
  // property names are used in dynamically compiled code using the native
  // Function constructor, and therefore need to remain unchanged by JavaScript
  // minifiers/uglifiers.
  const drawConfig: REGL.DrawConfig = {
    'frag': fragmentShader(coordinator.attributeMapper),

    'vert': vertexShader(coordinator.attributeMapper),

    'attributes': {
      // Corners and uv coords of the rectangle, same for each sprite.
      'vertexCoordinates': [
        [-0.5, -0.5],
        [0.5, -0.5],
        [-0.5, 0.5],
        [0.5, 0.5],
      ],

      // Instance swatch UV coordinates.
      'instanceRebaseUv': {
        'buffer': () => coordinator.instanceRebaseUvBuffer,
        'divisor': 1,
      },
    },

    'uniforms': {
      'ts': () => coordinator.elapsedTimeMs(),
      'targetValuesTexture': coordinator.targetValuesTexture,
      'previousValuesTexture': coordinator.previousValuesTexture,
    },

    'primitive': 'triangle strip',
    'count': 4,                                  // Only four vertices in total.
    'instances': () => coordinator.rebaseCount,  // But many sprite instances.

    'framebuffer': () => coordinator.previousValuesFramebuffer,
  };

  const drawCommand = coordinator.regl(drawConfig);

  // Wrapping ensures that the caller will not pass in `this`.
  return () => {
    drawCommand();
  };
}
