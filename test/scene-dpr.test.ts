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
 * @fileoverview Integration tests for the Scene rendering for different
 * devicePixelRatio values.
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
  describe('devicePixelRatio', () => {
    const {section, content: sectionContent} =
        createSection('Scene::devicePixelRatio');
    article.appendChild(section);

    const devicePixelRatioParameters = [0.5, 1, 1.5, 2, 2.5, 3];

    for (const dpr of devicePixelRatioParameters) {
      it(`should render at devicePixelRatio=${dpr}`, async () => {
        const container = document.createElement('div');
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

        // For integration testing, we'll sample areas of the output that are 5%
        // the width and height of the canvas size. This patch is a
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
        expect(compareColorArrays(centerSample.data, magentaPatch)).toEqual(1);

        // Release REGL resources.
        scene[SceneInternalSymbol].regl.destroy();
      });
    }
  });
});
