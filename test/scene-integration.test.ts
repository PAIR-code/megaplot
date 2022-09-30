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

import {SpriteView} from '../src/lib/generated/sprite-view';
import {Scene} from '../src/lib/scene';
import {SceneInternalSymbol} from '../src/lib/symbols';
import {TimingFunctionsShim} from '../src/lib/timing-functions-shim';

import {blobToImage, compareColorArrays, copyCanvasAndContainer, createArticle, createSection, filledColorArray} from './utils';

/**
 * Tests produce visible artifacts for debugging.
 */
const article = createArticle();
document.body.appendChild(article);

const GREEN = [0, 255, 0, 1];
const MAGENTA = [255, 0, 255, 1];

/**
 * Set a SpriteView's attributes to make the sprite a magenta filled square with
 * green border.
 */
function makeGreenMagentaSquare(s: SpriteView) {
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
  s.BorderRadiusPixel = 0;
  s.BorderRadiusRelative = .25;

  s.BorderColor = GREEN;
  s.FillColor = MAGENTA;
}

describe('Scene', () => {
  describe('initialization', () => {
    const {section, content: sectionContent} =
        createSection('Scene initialization');
    article.appendChild(section);

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
      sprite.enter(makeGreenMagentaSquare);
      timingFunctionsShim.runAnimationFrameCallbacks(3);

      // Now, if we inspect the canvas, its pixels should show that the
      // sprite has been rendered. Start by making a copy of the canvas and
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

      // Release REGL resources.
      scene[SceneInternalSymbol].regl.destroy();
    });
  });
});

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

      // Take a sample of the bottom right corner and compare it to the expected
      // solid green patch.
      const bottomRightSample = ctx.getImageData(
          Math.floor(copy.width - sampleWidth),
          Math.floor(copy.height - sampleHeight),
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
        expect(compareColorArrays(bottomRightSample.data, greenPatch))
            .toEqual(1);

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

  describe('hitTest() inclusive', () => {
    const {section, content: sectionContent} =
        createSection('Scene::hitTest() inclusive');
    article.appendChild(section);

    for (let devicePixelRatio = 1; devicePixelRatio <= 3;
         devicePixelRatio += 0.5) {
      it(`should hit when devicePixelRatio=${devicePixelRatio}`, () => {
        const container = document.createElement('div');
        container.style.width = '200px';
        container.style.height = '200px';
        sectionContent.appendChild(container);

        const timingFunctionsShim = new TimingFunctionsShim();

        const scene = new Scene({
          container,
          defaultTransitionTimeMs: 0,
          desiredSpriteCapacity: 10,
          devicePixelRatio,
          timingFunctions: timingFunctionsShim,
        });

        // Create four overlapping sprites.
        const sprites = [
          [-.2, .2],   // Index 0 = Top left.
          [.2, .2],    // Index 1 = Top right.
          [-.2, -.2],  // Index 2 = Bottom left.
          [.2, -.2],   // Index 3 = Bottom right.
        ].map((position) => {
          const sprite = scene.createSprite();
          sprite.enter((s: SpriteView) => {
            s.BorderColorOpacity = .4;

            // Place the border entirely outside the shape. It is only because
            // of this that the bounding boxes of the sprites are large enough
            // for the ensuing hitTest() invocations to hit them.
            s.BorderPlacement = 1

            s.BorderRadiusPixel = 10;
            s.FillColor = [255, 255, 255, .4];
            s.PositionWorld = position;
            s.Sides = 1;
            s.SizeWorld = .5;
          })
          return sprite;
        });
        timingFunctionsShim.runAnimationFrameCallbacks(3);

        // Grid of nine tests, like a tic-tac-toe board.
        const tests = [
          // Top row.
          {
            params: {x: 10, y: 10, width: 0, height: 0, inclusive: true},
            expected: [0, -1, -1, -1],
          },
          {
            params: {x: 100, y: 10, width: 0, height: 0, inclusive: true},
            expected: [0, 1, -1, -1],
          },
          {
            params: {x: 190, y: 10, width: 0, height: 0, inclusive: true},
            expected: [-1, 1, -1, -1],
          },

          // Middle row.
          {
            params: {x: 10, y: 100, width: 0, height: 0, inclusive: true},
            expected: [0, -1, 2, -1],
          },
          {
            params: {x: 100, y: 100, width: 0, height: 0, inclusive: true},
            expected: [0, 1, 2, 3],
          },
          {
            params: {x: 190, y: 100, width: 0, height: 0, inclusive: true},
            expected: [-1, 1, -1, 3],
          },

          // Bottom row.
          {
            params: {x: 10, y: 190, width: 0, height: 0, inclusive: true},
            expected: [-1, -1, 2, -1],
          },
          {
            params: {x: 100, y: 190, width: 0, height: 0, inclusive: true},
            expected: [-1, -1, 2, 3],
          },
          {
            params: {x: 190, y: 190, width: 0, height: 0, inclusive: true},
            expected: [-1, -1, -1, 3],
          },
        ];

        for (const {params, expected} of tests) {
          const res = scene.hitTest({...params, sprites});
          expect(res[0]).toBeCloseTo(expected[0], 0);
          expect(res[1]).toBeCloseTo(expected[1], 0);
          expect(res[2]).toBeCloseTo(expected[2], 0);
          expect(res[3]).toBeCloseTo(expected[3], 0);
        }

        // Cleanup REGL resources.
        scene[SceneInternalSymbol].regl.destroy();
      });
    }
  });

  describe('hitTest() exclusive', () => {
    const {section, content: sectionContent} =
        createSection('Scene::hitTest() exclusive');
    article.appendChild(section);

    for (let devicePixelRatio = 1; devicePixelRatio <= 3;
         devicePixelRatio += 0.5) {
      it(`should hit when devicePixelRatio=${devicePixelRatio}`, () => {
        const container = document.createElement('div');
        container.style.width = '200px';
        container.style.height = '200px';
        sectionContent.appendChild(container);

        const timingFunctionsShim = new TimingFunctionsShim();

        const scene = new Scene({
          container,
          defaultTransitionTimeMs: 0,
          desiredSpriteCapacity: 10,
          devicePixelRatio,
          timingFunctions: timingFunctionsShim,
        });

        // Create four overlapping sprites.
        const sprites = [
          [-.25, .25],   // Index 0 = Top left.
          [.25, .25],    // Index 1 = Top right.
          [-.25, -.25],  // Index 2 = Bottom left.
          [.25, -.25],   // Index 3 = Bottom right.
        ].map((position) => {
          const sprite = scene.createSprite();
          sprite.enter((s: SpriteView) => {
            s.BorderColorOpacity = .4;
            s.BorderRadiusPixel = 10;
            s.FillColor = [255, 255, 255, .4];
            s.PositionWorld = position;
            s.Sides = 1;
            s.SizeWorld = .4;
          })
          return sprite;
        });
        timingFunctionsShim.runAnimationFrameCallbacks(3);

        // Grid of nine tests, like a tic-tac-toe board.
        const tests = [
          // Top row.
          {
            params: {x: 5, y: 5, width: 190, height: 90, inclusive: false},
            expected: [0, 1, -1, -1],
          },
          // Middle row.
          {
            params: {x: 5, y: 55, width: 190, height: 90, inclusive: false},
            expected: [-1, -1, -1, -1],
          },
          // Bottom row.
          {
            params: {x: 5, y: 105, width: 190, height: 90, inclusive: false},
            expected: [-1, -1, 2, 3],
          },
          // Left column.
          {
            params: {x: 5, y: 5, width: 90, height: 190, inclusive: false},
            expected: [0, -1, 2, -1],
          },
          // Center column.
          {
            params: {x: 55, y: 5, width: 90, height: 190, inclusive: false},
            expected: [-1, -1, -1, -1],
          },
          // Right column.
          {
            params: {x: 105, y: 5, width: 90, height: 190, inclusive: false},
            expected: [-1, 1, -1, 3],
          },
          // All.
          {
            params: {x: 5, y: 5, width: 190, height: 190, inclusive: false},
            expected: [0, 1, 2, 3],
          },
        ];

        for (const {params, expected} of tests) {
          const res = scene.hitTest({...params, sprites});
          expect(res[0]).toBeCloseTo(expected[0], 0);
          expect(res[1]).toBeCloseTo(expected[1], 0);
          expect(res[2]).toBeCloseTo(expected[2], 0);
          expect(res[3]).toBeCloseTo(expected[3], 0);
        }

        // Cleanup REGL resources.
        scene[SceneInternalSymbol].regl.destroy();
      });
    }
  });
});
