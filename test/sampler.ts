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
 * @fileoverview Utility class for sampling rendered scenes.
 */

import {Scene} from '../src/lib/scene';
import {SceneInternalSymbol} from '../src/lib/symbols';

import {blobToImage, compareColorArrays, copyCanvasAndContainer, filledColorArray} from './utils';

export class Sampler {
  /**
   * Last created 2D canvas rendering context.
   */
  lastContext?: CanvasRenderingContext2D;

  constructor(readonly scene: Scene, readonly contentDiv: HTMLDivElement) {}

  /**
   * Snapshot the scene and draw it to a copy for sampling.
   */
  async copySnapshot() {
    // Copy the scene's canvas and its container. Append to content div.
    const {canvas} = this.scene;
    const [_, context, copyContainer] = copyCanvasAndContainer(canvas);
    this.contentDiv.appendChild(copyContainer);
    this.lastContext = context;

    // Grab a snapshot of the Scene's rendered pixels and draw them to
    // the canvas copy.
    const blob = await this.scene[SceneInternalSymbol].snapshot();
    const img = await blobToImage(blob);
    this.lastContext.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  /**
   * Sample the copied scene and compare it to a solid patch of the
   * specified expected color. Returned value is 0 if none of the pixels
   * match and 1 if all of them match.
   */
  compareSample(params: {
    x: number,
    y: number,
    width?: number,
    height?: number, color: number[],
  }) {
    if (!this.lastContext) {
      throw new Error('Must copy snapshot before comparing samples');
    }
    const {x, y, color} = params;
    const width = params.width || 1;
    const height = params.height || 1;
    const sample = this.lastContext.getImageData(x, y, width, height);
    const patch = filledColorArray(width * height, color, true);
    return compareColorArrays(sample.data, patch);
  }
}
