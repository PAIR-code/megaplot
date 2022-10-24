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
 * @fileoverview Integration tests for the Scene's resize() method and its
 * impact on rendering before and after resize.
 */

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
  describe('resize()', () => {
    const {section, content: sectionContent} = createSection('Scene::resize()');
    article.appendChild(section);

    it('should render normally after resize', async () => {
      // Container starts out 50x50.
      const container = document.createElement('div');
      container.style.width = '50px';
      container.style.height = '50px';
      sectionContent.appendChild(container);

      const timingFunctionsShim = new TimingFunctionsShim();
      timingFunctionsShim.totalElapsedTimeMs = 1234500000;

      const scene = new Scene({
        container,
        defaultTransitionTimeMs: 0,
        desiredSpriteCapacity: 100,
        timingFunctions: timingFunctionsShim,
      });

      // After Scene construction, stretch to 100x100 and resize. This will NOT
      // affect the scale, which should remain 50:1 pixels to world units.
      container.style.width = '100px';
      container.style.height = '100px';
      scene.resize();

      // Create a Sprite and render it.
      const sprite = scene.createSprite();
      sprite.enter(makeGreenMagentaSquare);
      timingFunctionsShim.runAnimationFrameCallbacks(4);

      // Now, if we inspect the canvas, its pixels should show that the sprite
      // has been rendered. Start my making a copy of the canvas and for
      // inspection.
      const {canvas} = scene;
      const [copy, ctx, copyContainer] = copyCanvasAndContainer(canvas);
      sectionContent.appendChild(copyContainer);

      // Grab a snapshot of the Scene's rendered pixels and draw them to
      // the canvas copy.
      const blob = await scene[SceneInternalSymbol].snapshot();
      const img = await blobToImage(blob);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // For integration testing, we'll sample areas of the output that are 10%
      // the width and height of the canvas size. This patch is a middle-ground
      // between testing the whole image for pixel-perfect rendering and testing
      // a single pixel.
      const sampleWidth = Math.ceil(copy.width * .1);
      const sampleHeight = Math.ceil(copy.width * .1);
      const pixelCount = sampleWidth * sampleHeight;

      // Generate a blank patch and a solid magenta patch to compare to the
      // rendered pixels for correctness.
      const blankPatch = filledColorArray(pixelCount, [0, 0, 0, 0]);
      const magentaPatch = filledColorArray(pixelCount, [255, 0, 255, 255]);

      // Take a sample of the top left corner and compare it to the expected
      // solid green patch.
      const topLeftSample = ctx.getImageData(
          0,
          0,
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(topLeftSample.data, blankPatch)).toEqual(1);

      // Take a sample of the bottom right corner and compare it to the expected
      // solid green patch.
      const bottomRightSample = ctx.getImageData(
          Math.floor(copy.width - sampleWidth),
          Math.floor(copy.height - sampleHeight),
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(bottomRightSample.data, blankPatch)).toEqual(1);

      // Lastly, sample a chunk of the middle of the image and compare it to the
      // solid magenta patch.
      const centerSample = ctx.getImageData(
          Math.floor(copy.width * .5 - sampleWidth * .5),
          Math.floor(copy.height * .5 - sampleHeight * .5),
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(centerSample.data, magentaPatch)).toEqual(1);

      // Release REGL resources.
      scene[SceneInternalSymbol].regl.destroy();
    });

    it('should render normally after devicePixelRatio change', async () => {
      const container = document.createElement('div');
      container.style.width = '100px';
      container.style.height = '100px';
      sectionContent.appendChild(container);

      // Initial devicePixelRatio of 2 simulates a retina display.
      let devicePixelRatio = 2;

      const timingFunctionsShim = new TimingFunctionsShim();
      timingFunctionsShim.totalElapsedTimeMs = 1234500000;

      const scene = new Scene({
        container,
        defaultTransitionTimeMs: 0,
        desiredSpriteCapacity: 100,
        devicePixelRatio: () => devicePixelRatio,
        timingFunctions: timingFunctionsShim,
      });

      // Create a Sprite and render it.
      const sprite = scene.createSprite();
      sprite.enter(makeGreenMagentaSquare);
      timingFunctionsShim.runAnimationFrameCallbacks(4);

      // Now change the devicePixelRatio and resize(). This simulates moving the
      // browser to a different monitor with a different devicePixelRatio.
      devicePixelRatio = 1;
      scene.resize();

      timingFunctionsShim.runAnimationFrameCallbacks(4);

      // Now, if we inspect the canvas, its pixels should show that the sprite
      // has been rendered. Start my making a copy of the canvas and for
      // inspection.
      const {canvas} = scene;
      const [copy, ctx, copyContainer] = copyCanvasAndContainer(canvas);
      sectionContent.appendChild(copyContainer);

      // Grab a snapshot of the Scene's rendered pixels and draw them to
      // the canvas copy.
      const blob = await scene[SceneInternalSymbol].snapshot();
      const img = await blobToImage(blob);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // For integration testing, we'll sample areas of the output that are 10%
      // the width and height of the canvas size. This patch is a middle-ground
      // between testing the whole image for pixel-perfect rendering and testing
      // a single pixel.
      const sampleWidth = Math.ceil(copy.width * .1);
      const sampleHeight = Math.ceil(copy.width * .1);
      const pixelCount = sampleWidth * sampleHeight;

      // Generate patches of solid green and magenta to compare to the rendered
      // pixels for correctness.
      const greenPatch = filledColorArray(pixelCount, [0, 255, 0, 255]);

      // Take a sample of the top left corner and compare it to the expected
      // solid green patch. Since antialiased pixels will have slightly
      // different color values, we clip those from sampling.
      const topLeftSample = ctx.getImageData(
          1,
          1,
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(topLeftSample.data, greenPatch)).toEqual(1);

      const magentaPatch = filledColorArray(pixelCount, [255, 0, 255, 255]);
      // Take a sample of the bottom right corner and compare it to the expected
      // solid green patch.
      const bottomRightSample = ctx.getImageData(
          Math.floor(copy.width - sampleWidth - 1),
          Math.floor(copy.height - sampleHeight - 1),
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(bottomRightSample.data, greenPatch)).toEqual(1);

      // Lastly, sample a chunk of the middle of the image and compare it to the
      // solid magenta patch.
      const centerSample = ctx.getImageData(
          Math.floor(copy.width * .5 - sampleWidth * .5),
          Math.floor(copy.height * .5 - sampleHeight * .5),
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(centerSample.data, magentaPatch)).toEqual(1);

      // Release REGL resources.
      scene[SceneInternalSymbol].regl.destroy();
    });
  });
});
