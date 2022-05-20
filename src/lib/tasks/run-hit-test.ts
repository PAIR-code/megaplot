/**
 * @license
 * Copyright 2022 Google LLC
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
 * @fileoverview Defines the runHitTest() task of SceneInternal.
 */
import REGL from 'regl';

import {AttributeMapper} from '../attribute-mapper';
import {HitTestParameters} from '../hit-test-types';
import {SpriteImpl} from '../sprite-impl';
import {InternalPropertiesSymbol} from '../symbols';

/**
 * To avoid circular imports, this file cannot depend on scene-internal.ts so
 * here we define the minimum necessary API surface that the task implementation
 * needs to operate.
 */
interface CoordinatorAPI {
  instanceHitTestInputUvBuffer: REGL.Buffer;
  instanceHitTestInputUvValues: Float32Array;
  instanceHitTestInputIndexActiveBuffer: REGL.Buffer;
  instanceHitTestInputIndexActiveValues: Float32Array;
  instanceHitTestOutputUvBuffer: REGL.Buffer;
  instanceSwatchUvValues: Float32Array;
  hitTestAttributeMapper: AttributeMapper;
  hitTestCommand?: () => void;
  hitTestCount: number;
  hitTestParameters: HitTestParameters;
  hitTestOutputResults: Float32Array;
  hitTestOutputValues: Uint8Array;
  hitTestOutputValuesFramebuffer: REGL.Framebuffer2D;
  regl: REGL.Regl;
}

/**
 * Perform a hit test and read back the results.
 *
 * @param coordinator Upstream object upon which this task operates.
 */
export function runHitTest(
    coordinator: CoordinatorAPI,
) {
  // Shorthand variables to make code more readable.
  const inputUv = coordinator.instanceHitTestInputUvValues;
  const indexActive = coordinator.instanceHitTestInputIndexActiveValues;
  const swatchUv = coordinator.instanceSwatchUvValues;

  // These values are API-user provided, but are already be checked for
  // correctness upstream in SceneInternal.
  const {sprites} = coordinator.hitTestParameters;

  // Copy swatch UVs into the input UV values array. This way, when the command
  // runs, it will reference the correct swatches for the candidate sprites.
  for (let i = 0; i < sprites.length; i++) {
    const sprite = sprites[i] as SpriteImpl;
    const swatchIndex = sprite[InternalPropertiesSymbol].index || 0;

    inputUv[i * 2] = swatchUv[swatchIndex * 2];
    inputUv[i * 2 + 1] = swatchUv[swatchIndex * 2 + 1];

    indexActive[i * 2] = swatchIndex;
    indexActive[i * 2 + 1] = sprite.isActive ? 1 : 0;
  }

  coordinator.hitTestCount = sprites.length;

  // Re-bind the UV and Index/Active values to their buffers.
  coordinator.instanceHitTestInputUvBuffer(
      inputUv.subarray(0, coordinator.hitTestCount * 2));
  coordinator.instanceHitTestInputIndexActiveBuffer(
      indexActive.subarray(0, coordinator.hitTestCount * 2));

  // Invoke the hit test command.
  coordinator.hitTestCommand!();

  const readHeight = Math.ceil(
      coordinator.hitTestCount /
      coordinator.hitTestAttributeMapper.swatchesPerRow);

  // Read values back from framebuffer. This is SLOW! Upwards of 50ms-200ms
  // depending on the amount of data being read back. It's a blocking and
  // stalling procedure. Reading from the framebuffer requires that all the
  // queued GPU actions are finished and flushed.
  coordinator.regl.read({
    x: 0,
    y: 0,
    width: coordinator.hitTestAttributeMapper.textureWidth,
    height: readHeight,
    data: coordinator.hitTestOutputValues,
    framebuffer: coordinator.hitTestOutputValuesFramebuffer,
  });

  // Unpack results.
  const {totalSwatches} = coordinator.hitTestAttributeMapper;
  const outputValues = coordinator.hitTestOutputValues;
  for (let i = 0; i < coordinator.hitTestCount; i++) {
    // Read RGBA Uint8 color channels.
    const r = outputValues[i * 4];
    const g = outputValues[i * 4 + 1];
    const b = outputValues[i * 4 + 2];
    const a = outputValues[i * 4 + 3];

    // Unpack to recover floating point representation in the range 0-1.
    const n = (r / (256 * 256 * 256) + g / (256 * 256) + b / 256 + a) / 255;

    // Recover swatch index value, or -1 for a miss. These values will not be
    // 100% accurate due to loss of precision when normalizing and
    // packing/unpacking. However, misses will be defintely equal to -1, and
    // the values will be ordinally correct, meaning that greater numbers
    // equate to higher up the z-order.
    coordinator.hitTestOutputResults[i] = n * (totalSwatches + 1) - 1;
  }
}
