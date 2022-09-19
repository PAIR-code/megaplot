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
  canvas: HTMLCanvasElement;
  elapsedTimeMs: () => number;
  getDevicePixelRatio: () => number;
  getProjectionMatrix: (context: ReglContext) => number[];
  getViewMatrix: () => number[];
  getViewMatrixScale: () => number[];
  instanceCount: number;
  instanceIndexBuffer: REGL.Buffer;
  instanceSwatchUvBuffer: REGL.Buffer;
  orderZGranularity: number;
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
    ): () => void {
  // Calling regl() requires a DrawConfig and returns a DrawCommand. The
  // property names are used in dynamically compiled code using the native
  // Function constructor, and therefore need to remain unchanged by JavaScript
  // minifiers/uglifiers.
  const drawConfig: REGL.DrawConfig = {
    // TODO(jimbo): Expose a mechanism to allow the API user to override these.
    'blend': {
      'enable': true,
      'func': {
        'srcRGB': 'src alpha',
        'srcAlpha': 1,
        'dstRGB': 'one minus src alpha',
        'dstAlpha': 1
      },
      'equation': {
        'rgb': 'add',
        'alpha': 'add',
      },
      'color': [0, 0, 0, 0]
    },

    'viewport': () => ({
      'x': 0,
      'y': 0,
      'width': coordinator.canvas.width,
      'height': coordinator.canvas.height,
    }),

    'frag': fragmentShader(),

    'vert': vertexShader(coordinator.attributeMapper),

    'attributes': {
      // Corners and uv coords of the rectangle, same for each sprite.
      'vertexCoordinates': [
        [-0.5, -0.5, 0, 1],
        [0.5, -0.5, 1, 1],
        [-0.5, 0.5, 0, 0],
        [0.5, 0.5, 1, 0],
      ],

      // Swatch uv coordinates for retrieving data texture values.
      'instanceSwatchUv': {
        'buffer': coordinator.instanceSwatchUvBuffer,
        'divisor': 1,
      },

      // Instance indices for computing default z-ordering.
      'instanceIndex': {
        'buffer': coordinator.instanceIndexBuffer,
        'divisor': 1,
      },
    },

    'uniforms': {
      'ts': () => coordinator.elapsedTimeMs(),
      'devicePixelRatio': () => coordinator.getDevicePixelRatio(),
      'instanceCount': () => coordinator.instanceCount,
      'orderZGranularity': () => coordinator.orderZGranularity,
      'viewMatrix': () => coordinator.getViewMatrix(),
      'viewMatrixScale': () => coordinator.getViewMatrixScale(),
      'projectionMatrix': (context: REGL.DefaultContext) => {
        return coordinator.getProjectionMatrix(context);
      },
      'sdfTexture': coordinator.sdfTexture,
      'previousValuesTexture': coordinator.previousValuesFramebuffer,
      'targetValuesTexture': coordinator.targetValuesTexture,
    },

    'primitive': 'triangle strip',
    'count': 4,                                    // Only four vertices.
    'instances': () => coordinator.instanceCount,  // Many sprite instances.
  };

  const drawCommand = coordinator.regl(drawConfig);

  return () => {
    // Explicitly clear the drawing buffer before rendering.
    coordinator.regl.clear({
      'color': [0, 0, 0, 0],
      'depth': 1,
      'framebuffer': null,
      'stencil': 0,
    });
    drawCommand.apply(null);
  };
}
