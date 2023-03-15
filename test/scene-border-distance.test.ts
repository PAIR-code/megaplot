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
 * @fileoverview Integration tests for rendering borders of sprites under
 * various Scene conditions.
 */

import { Scene } from '../src/lib/scene';
import { SceneInternalSymbol } from '../src/lib/symbols';
import { TimingFunctionsShim } from '../src/lib/timing-functions-shim';

import {
  blobToImage,
  compareColorArrays,
  copyCanvasAndContainer,
  createArticle,
  createSection,
  filledColorArray,
} from './utils';

/**
 * Tests produce visible artifacts for debugging.
 */
const article = createArticle();
document.body.appendChild(article);

const SAMPLE_WIDTH = 8;
const SAMPLE_HEIGHT = 8;
const SAMPLE_SIZE = SAMPLE_WIDTH * SAMPLE_HEIGHT;

// Generate a blank patch and a solid cyan patch to compare to the rendered
// pixels for correctness.
const BLANK_PATCH = filledColorArray(SAMPLE_SIZE, [0, 0, 0, 0]);
const CYAN_PATCH = filledColorArray(SAMPLE_SIZE, [0, 255, 255, 255]);

// Grid of nine samples to test.
const SAMPLES = [
  // Top row.
  { position: [1, 1], expected: CYAN_PATCH },
  { position: [26, 1], expected: CYAN_PATCH },
  { position: [51, 1], expected: CYAN_PATCH },

  // Middle row.
  { position: [1, 26], expected: CYAN_PATCH },
  { position: [26, 26], expected: BLANK_PATCH },
  { position: [51, 26], expected: CYAN_PATCH },

  // Bottom row.
  { position: [1, 51], expected: CYAN_PATCH },
  { position: [26, 51], expected: CYAN_PATCH },
  { position: [51, 51], expected: CYAN_PATCH },
];

// Different scale values to apply, which should have no effect on rendering
// since all values and comparisons are tested in pixels.
const SCALES = [
  // Normal 1:1 square, larger or smaller.
  [60, 60],
  [200, 200],
  [10, 10],

  // Stretched horizontally.
  [200, 60],
  [100, 10],
  [1000, 1],

  // Stretched vertically.
  [60, 200],
  [10, 100],
  [1, 1000],
];

describe('borders', () => {
  const { section, content: sectionContent } = createSection('borders');
  article.appendChild(section);

  it('should render normally at each scale and devicePixelRatio', async () => {
    const container = document.createElement('div');
    container.style.width = '60px';
    container.style.height = '60px';
    sectionContent.appendChild(container);

    const timingFunctionsShim = new TimingFunctionsShim();

    // This will be modified by the loop below, but must be in scope for Scene
    // constructor.
    let devicePixelRatio = 1;

    const scene = new Scene({
      container,
      defaultTransitionTimeMs: 0,
      desiredSpriteCapacity: 1,
      devicePixelRatio: () => devicePixelRatio,
      timingFunctions: timingFunctionsShim,
    });

    // Create a Sprite and render it.
    const sprite = scene.createSprite();
    sprite.enter((s) => {
      s.Sides = 2; // Square.
      s.SizePixel = 60;
      s.BorderRadiusPixel = 10;
      s.BorderColor = [0, 255, 255, 1];
    });
    timingFunctionsShim.runAnimationFrameCallbacks(3);

    for (let dpr = 1; dpr <= 3; dpr++) {
      devicePixelRatio = dpr;
      scene.resize();

      for (const [scaleX, scaleY] of SCALES) {
        scene.scale.x = scaleX;
        scene.scale.y = scaleY;

        // Trigger draw at specified scale.
        timingFunctionsShim.runAnimationFrameCallbacks(4);

        // Now, if we inspect the canvas, its pixels should show that the
        // sprite has been rendered. Start my making a copy of the canvas and
        // for inspection.
        const { canvas } = scene;
        const [_, ctx, copyContainer] = copyCanvasAndContainer(canvas);
        sectionContent.appendChild(copyContainer);

        // Grab a snapshot of the Scene's rendered pixels and draw them to
        // the canvas copy.
        const blob = await scene[SceneInternalSymbol].snapshot();
        const img = await blobToImage(blob);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        for (const {
          position: [x, y],
          expected,
        } of SAMPLES) {
          const sample = ctx.getImageData(
            x * dpr,
            y * dpr,
            SAMPLE_WIDTH,
            SAMPLE_HEIGHT
          );
          expect(compareColorArrays(sample.data, expected)).toEqual(1);
        }
      }
    }

    // Release REGL resources.
    scene[SceneInternalSymbol].regl.destroy();
  });
});
