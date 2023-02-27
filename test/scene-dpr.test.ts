/**
 * @license
 * Copyright 2023 Google LLC
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
 * @fileoverview Integration tests for the Scene rendering when GeometricZoom is
 * specified for sprites and varying the device pixel ratio.
 */

import {SpriteView} from '../src/lib/generated/sprite-view';
import {Scene} from '../src/lib/scene';
import {SceneInternalSymbol} from '../src/lib/symbols';
import {TimingFunctionsShim} from '../src/lib/timing-functions-shim';

import {blobToImage, compareColorArrays, copyCanvasAndContainer, createArticle, createSection, filledColorArray, makeGreenMagentaSquare} from './utils';

/**
 * Tests produce visible artifacts for debugging.
 */
const article = createArticle();
document.body.appendChild(article);

describe('Scene', () => {
  describe('GeometricZoom', () => {
    const devicePixelRatioParameters = [0.5, 1, 1.5, 2, 2.5, 3];

    // These parameters assume a square Scene of 100x100 pixels. Under these
    // conditions, the default ratio of world units to logical pixels is 1:100.
    // That is, a square with SizeWorld=1 will fill the scene.
    const varyingParameters = [
      // When GeometricZoom is 0, the default square fills the scene at size=1.
      {sizeWorld: 1, geometricZoom: 0},

      // When GeometricZoom is 0.5, then we're half way between the default
      // 1:100 scale and the full 1:1 scale. In log terms, that's 1:10.
      {sizeWorld: 10, geometricZoom: 0.5},

      // When GeometricZoom is all the way to 1.0, then world units to logical
      // pixels is 1:1. It takes 100 world units to span the width of the scene.
      {sizeWorld: 100, geometricZoom: 1},
    ];

    for (const {sizeWorld, geometricZoom} of varyingParameters) {
      const {section, content: sectionContent} =
          createSection(`GeometricZoom=${geometricZoom}`);
      article.appendChild(section);

      for (const dpr of devicePixelRatioParameters) {
        it(`should render at devicePixelRatio=${dpr}`, async () => {
          const container = document.createElement('div');
          container.setAttribute('data-dpr', `${dpr}`);
          container.setAttribute('data-size-world', `${sizeWorld}`);
          container.setAttribute('data-geometric-zoom', `${geometricZoom}`);
          container.style.width = '100px';
          container.style.height = '100px';
          sectionContent.appendChild(container);

          const timingFunctionsShim = new TimingFunctionsShim();
          timingFunctionsShim.totalElapsedTimeMs = 1234500000;

          const scene = new Scene({
            container,
            defaultTransitionTimeMs: 0,
            desiredSpriteCapacity: 100,
            devicePixelRatio: dpr,
            timingFunctions: timingFunctionsShim,
          });

          // Create a Sprite and render it.
          const sprite = scene.createSprite();
          sprite.enter((s: SpriteView) => {
            makeGreenMagentaSquare(s);
            s.SizeWorld = sizeWorld;
            s.GeometricZoom = geometricZoom;
          });
          timingFunctionsShim.runAnimationFrameCallbacks(4);

          // Now, if we inspect the canvas, its pixels should show that the
          // sprite has been rendered. Start my making a copy of the canvas and
          // for inspection.
          const {canvas} = scene;
          const [copy, ctx, copyContainer] = copyCanvasAndContainer(canvas);
          sectionContent.appendChild(copyContainer);

          // Grab a snapshot of the Scene's rendered pixels and draw them to
          // the canvas copy.
          const blob = await scene[SceneInternalSymbol].snapshot();
          const img = await blobToImage(blob);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // For integration testing, we'll sample areas of the output that are
          // 5% the width and height of the canvas size. This patch is a
          // middle-ground between testing the whole image for pixel-perfect
          // rendering and testing a single pixel.
          const sampleWidth = Math.ceil(copy.width * .05);
          const sampleHeight = Math.ceil(copy.width * .05);
          const pixelCount = sampleWidth * sampleHeight;

          const greenPatch = filledColorArray(pixelCount, [0, 255, 0, 255]);

          // Take a sample of the top left corner and compare it to the expected
          // solid green patch.
          const topLeftSample = ctx.getImageData(
              1,
              1,
              sampleWidth,
              sampleHeight,
          );
          expect(compareColorArrays(topLeftSample.data, greenPatch)).toEqual(1);

          // Take a sample of the bottom right corner and compare it to the
          // expected solid green patch.
          const bottomRightSample = ctx.getImageData(
              Math.floor(copy.width - sampleWidth - 1),
              Math.floor(copy.height - sampleHeight - 1),
              sampleWidth,
              sampleHeight,
          );
          expect(compareColorArrays(bottomRightSample.data, greenPatch))
              .toEqual(1);

          const magentaPatch = filledColorArray(pixelCount, [255, 0, 255, 255]);

          // Lastly, sample a chunk of the middle of the image and compare it to
          // the solid magenta patch.
          const centerSample = ctx.getImageData(
              Math.floor(copy.width * .5 - sampleWidth * .5),
              Math.floor(copy.height * .5 - sampleHeight * .5),
              sampleWidth,
              sampleHeight,
          );
          expect(compareColorArrays(centerSample.data, magentaPatch))
              .toEqual(1);

          // Release REGL resources.
          scene[SceneInternalSymbol].regl.destroy();
        });
      }
    }
  });
});
