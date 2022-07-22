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
 * @fileoverview Tests for the Scene.
 */

import {Scene} from '../src/lib/scene';
import {SceneInternalSymbol} from '../src/lib/symbols';
import {TimingFunctionsShim} from '../src/lib/timing-functions-shim';

/**
 * Tests produce visible artifacts for debugging.
 */
const article = document.createElement('article');
article.className = 'cw';
article.innerHTML = `
<style>
.cw {
  font-family: monospace;
}
.cw .content {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.cw canvas {
  background-image: linear-gradient(135deg, #aaa 50%, #ccc 50%);
  background-size: 10px 10px;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.25);
}
</style>
`;
document.body.appendChild(article);

/**
 * Create a <section> element inside the <article>.
 */
function createSection(title: string): HTMLElement {
  const section = document.createElement('section');
  section.innerHTML = '<h2 class="title"></h2><div class="content"></div>';
  section.querySelector('h2')!.textContent = title;
  article.appendChild(section);
  return section;
}

/**
 * Create a canvas element with the same characteristics as the provided canvas.
 * The copy will have the same size and styled size. Return the copy and its 2d
 * context.
 */
function copyCanvasAndContainer(canvas: HTMLCanvasElement):
    [HTMLCanvasElement, CanvasRenderingContext2D, HTMLElement] {
  const parent = canvas.parentElement!;
  const div = document.createElement('div');
  div.style.width = parent.style.width;
  div.style.height = parent.style.height;
  const copy = document.createElement('canvas');
  copy.width = canvas.width;
  copy.height = canvas.height;
  copy.style.width = canvas.style.width;
  copy.style.height = canvas.style.height;
  const ctx = copy.getContext('2d')!;
  div.appendChild(copy);
  return [copy, ctx, div];
}

/**
 * Render a blob to a canvas.
 */
async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
  img.src = url;
  return promise;
}

/**
 * Given a target length, and the Uint 8 RGBA channels for a pixel, create a
 * block of pixel values for testing sampled swatches of canvas data.
 */
function filledColorArray(
    pixelCount: number,
    fillColor: [number, number, number, number]): Uint8ClampedArray {
  const array = new Uint8ClampedArray(pixelCount * 4);
  for (let i = 0; i < array.length; i++) {
    array[i] = fillColor[i % fillColor.length];
  }
  return array;
}

/**
 * Compare two color arrays and return the proportion of matching pixels.
 */
function compareColorArrays(
    actual: Uint8ClampedArray, expected: Uint8ClampedArray): number {
  let matches = 0;
  for (let i = 0; i < expected.length; i += 4) {
    if (expected[i] === actual[i] && expected[i + 1] === actual[i + 1] &&
        expected[i + 2] === actual[i + 2] &&
        expected[i + 3] === actual[i + 3]) {
      matches++;
    }
  }
  return matches / (expected.length / 4);
}

describe('Scene', () => {
  describe('initialization', () => {
    const section = createSection('Scene initialization');
    const sectionContent = section.querySelector('.content')!;

    it('should render when canvas attached post-construction', async () => {
      const container = document.createElement('div');
      container.style.width = '100px';
      container.style.height = '100px';

      // NOTE: container is NOT attached yet to the DOM.

      const timingFunctionsShim = new TimingFunctionsShim();

      const scene = new Scene({
        container,
        defaultTransitionTimeMs: 0,
        desiredSpriteCapacity: 100,
        timingFunctions: timingFunctionsShim,
      });

      // After Scene construction, attach container to DOM, which transitively
      // attaches the canvas.
      sectionContent.appendChild(container);

      // Create a Sprite and render it.
      const sprite = scene.createSprite();

      // Give the Sprite an enter() callback to invoke.
      sprite.enter((s) => {
        // Position of the sprite should be centered at world origin.
        s.PositionWorldX = 0;
        s.PositionWorldY = 0;

        // Sprite size should fill the canvas.
        s.SizeWorldWidth = 1;
        s.SizeWorldHeight = 1;

        // Shape should be a square.
        s.Sides = 2;

        // Border should be 1/4 of a world unit, half the radius of the
        // of the shape.
        s.BorderPlacement = 0;
        s.BorderRadiusWorld = .25;
        s.BorderRadiusPixel = 0;

        // Border is opaque green.
        s.BorderColorR = 0;
        s.BorderColorG = 255;
        s.BorderColorB = 0;
        s.BorderColorOpacity = 1;

        // Interior fill is opaque magenta.
        s.FillColorR = 255;
        s.FillColorG = 0;
        s.FillColorB = 255;
        s.FillColorOpacity = 1;
      });

      // Three frames to run callbacks, flash data texture and draw.
      timingFunctionsShim.runAnimationFrameCallbacks(3);

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
      // 10% the width and height of the canvas size. This patch is a
      // middle-ground between testing the whole image for pixel-perfect
      // rendering and testing a single pixel.
      const sampleWidth = Math.ceil(copy.width * .1);
      const sampleHeight = Math.ceil(copy.width * .1);
      const pixelCount = sampleWidth * sampleHeight;

      // Generate patches of solid green and magenta to compare to the
      // rendered pixels for correctness.
      const greenPatch = filledColorArray(pixelCount, [0, 255, 0, 255]);
      const magentaPatch = filledColorArray(pixelCount, [255, 0, 255, 255]);

      // Take a sample of the top left corner and compare it to the expected
      // solid green patch.
      const topLeftSample = ctx.getImageData(
          0,
          0,
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(topLeftSample.data, greenPatch)).toEqual(1);

      // Take a sample of the bottom right corner and compare it to the
      // expected solid green patch.
      const bottomRightSample = ctx.getImageData(
          Math.floor(copy.width - sampleWidth),
          Math.floor(copy.height - sampleHeight),
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(bottomRightSample.data, greenPatch)).toEqual(1);

      // Lastly, sample a chunk of the middle of the image and compare it to
      // the solid magenta patch.
      const centerSample = ctx.getImageData(
          Math.floor(copy.width * .5 - sampleWidth * .5),
          Math.floor(copy.height * .5 - sampleHeight * .5),
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(centerSample.data, magentaPatch)).toEqual(1);
    });
  });
});

describe('Scene', () => {
  describe('resize()', () => {
    const section = createSection('Scene::resize()');
    const sectionContent = section.querySelector('.content')!;

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

      // Give the Sprite an enter() callback to invoke.
      sprite.enter((s) => {
        // Position of the sprite should be centered at world origin.
        s.PositionWorldX = 0;
        s.PositionWorldY = 0;

        // Sprite size should fill the canvas.
        s.SizeWorldWidth = 1;
        s.SizeWorldHeight = 1;

        // Shape should be a square.
        s.Sides = 2;

        // Border should be 1/4 of a world unit, half the radius of the
        // of the shape.
        s.BorderPlacement = 0;
        s.BorderRadiusWorld = .25;
        s.BorderRadiusPixel = 0;

        // Border is opaque green.
        s.BorderColorR = 0;
        s.BorderColorG = 255;
        s.BorderColorB = 0;
        s.BorderColorOpacity = 1;

        // Interior fill is opaque magenta.
        s.FillColorR = 255;
        s.FillColorG = 0;
        s.FillColorB = 255;
        s.FillColorOpacity = 1;
      });

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
    });
  });
});
