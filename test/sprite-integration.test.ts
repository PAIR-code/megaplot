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
 * @fileoverview Integration tests for the Sprite API as implemented by the
 * Scene. These tests exercise the actual rendering of sprites to canvases
 * and include verifying that output pixel colors match expected values.
 */

import {Scene} from '../src/lib/scene';
import {Sprite} from '../src/lib/sprite';
import {SceneInternalSymbol} from '../src/lib/symbols';
import {TimingFunctionsShim} from '../src/lib/timing-functions-shim';

import {blobToImage, compareColorArrays, copyCanvasAndContainer, createArticle, createSection, filledColorArray} from './utils';

/**
 * Tests produce visible artifacts for debugging.
 */
const article = createArticle();
document.body.appendChild(article);

describe('Sprite', () => {
  describe('enter()', () => {
    // Create a <section> for storing visible artifacts.
    const {section, content} = createSection('Sprite::enter()');
    article.appendChild(section);

    // Create a container <div> of fixed size for the Scene to render into.
    const container = document.createElement('div');
    container.style.width = '100px';
    container.style.height = '100px';
    content.appendChild(container);

    let timingFunctionsShim: TimingFunctionsShim;
    let scene: Scene;
    let sprite: Sprite;

    beforeEach(() => {
      timingFunctionsShim = new TimingFunctionsShim();
      timingFunctionsShim.totalElapsedTimeMs = 1000;
      scene = new Scene({
        container,
        defaultTransitionTimeMs: 0,
        desiredSpriteCapacity: 100,
        timingFunctions: timingFunctionsShim,
      });
      sprite = scene.createSprite();
    });

    afterEach(() => {
      scene[SceneInternalSymbol].regl.destroy();
    });

    // This is an integration test. It draws a single sprite, then reads
    // back the rendered pixels to test that they're the correct colors.
    it('should take and invoke a callback', async () => {
      let enterRunCount = 0;

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
        s.BorderRadiusPixel = 0;
        s.BorderRadiusRelative = .25;

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

        // Mark that the enter callback has run.
        enterRunCount++;
      });

      // The callback should not have been invoked immediately.
      expect(enterRunCount).toBe(0);

      // This should start running the enter callbacks. While the enter callback
      // will have been executed, the values it produced (s.PositionWorld, etc.)
      // reside only in a Float32 array in JavaScript heap memory. Those values
      // have not yet been transferred to the GPU.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(enterRunCount).toBe(1);

      // After the next frame, the Float32 array values should have been flashed
      // over to the WebGL texture. But the draw call that causes those values
      // to affect rendered screen pixels may not yet have been run.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(enterRunCount).toBe(1);

      // After one more frame, the Scene's draw command should have
      // run (with the target values resident on in the WebGL texture). This
      // will have caused the sprite to be rendered to the canvas.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(enterRunCount).toBe(1);

      // Now, if we inspect the canvas, its pixels should show that the sprite
      // has been rendered. Start my making a copy of the canvas and for
      // inspection.
      const {canvas} = scene;
      const [copy, ctx, copyContainer] = copyCanvasAndContainer(canvas);
      content.appendChild(copyContainer);

      // Grab a snapshot of the Scene's rendered pixels and draw them to
      // the canvas copy.
      const blob = await scene[SceneInternalSymbol].snapshot();
      const img = await blobToImage(blob);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // For integration testing, we'll sample an area of the output that's 5%
      // the width and height of the canvas size. This patch is a middle-ground
      // between testing the whole image for pixel-perfect rendering and testing
      // a single pixel.
      const sampleWidth = Math.ceil(copy.width * .05);
      const sampleHeight = Math.ceil(copy.width * .05);
      const pixelCount = sampleWidth * sampleHeight;

      // Generate patches of solid green and magenta to compare to the rendered
      // pixels for correctness.
      const solidGreen = filledColorArray(pixelCount, [0, 255, 0, 255]);
      const solidMagenta = filledColorArray(pixelCount, [255, 0, 255, 255]);

      // Take a sample of the top left corner and compare it to the expected
      // solid green patch.
      const topLeftSample = ctx.getImageData(
          5,
          5,
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(topLeftSample.data, solidGreen)).toEqual(1);

      // Take a sample of the bottom right corner and compare it to the expected
      // solid green patch.
      const bottomRightSample = ctx.getImageData(
          Math.floor(copy.width - sampleWidth - 5),
          Math.floor(copy.height - sampleHeight - 5),
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(bottomRightSample.data, solidGreen)).toEqual(1);

      // Lastly, sample a chunk of the middle of the image and compare it to the
      // solid magenta patch.
      const centerSample = ctx.getImageData(
          Math.floor(copy.width * .5 - sampleWidth * .5),
          Math.floor(copy.height * .5 - sampleHeight * .5),
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(centerSample.data, solidMagenta)).toEqual(1);
    });
  });

  describe('update()', () => {
    // Create a visible document section for inspection.
    const {section, content} = createSection('Sprite::update()');
    article.appendChild(section);

    // Create a container div in which the Scene will place its canvas.
    const container = document.createElement('div');
    container.style.width = '100px';
    container.style.height = '100px';
    content.appendChild(container);

    let timingFunctionsShim: TimingFunctionsShim;
    let scene: Scene;
    let sprite: Sprite;

    beforeEach(() => {
      timingFunctionsShim = new TimingFunctionsShim();
      timingFunctionsShim.totalElapsedTimeMs = 1000;

      scene = new Scene({
        container,
        defaultTransitionTimeMs: 0,
        desiredSpriteCapacity: 100,
        timingFunctions: timingFunctionsShim,
      });

      sprite = scene.createSprite();

      // This enter callback puts the sprite in the correct state to test the
      // effects of the later update call.
      sprite.enter((s) => {
        // Position of the sprite should be centered at world origin.
        s.PositionWorldX = 0;
        s.PositionWorldY = 0;

        // Sprite size should fill the canvas.
        s.SizeWorldWidth = 1;
        s.SizeWorldHeight = 1;

        // Shape should be a square to start.
        s.Sides = 2;

        // Border should be 1/4 of a world unit, half the radius of the
        // of the shape.
        s.BorderPlacement = 0;
        s.BorderRadiusPixel = 0;
        s.BorderRadiusRelative = .25;

        // Border is opaque, green.
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

      // Behind the scenes, this should run the enter callback above.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // Next frame, values should be flashed to the WebGL texture.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // Next frame, the Scene's draw command should have run.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // Advance time slightly.
      timingFunctionsShim.totalElapsedTimeMs += 100;
    });

    afterEach(() => {
      scene[SceneInternalSymbol].regl.destroy();
    });

    // At this point we're ready to test the update transition.
    it('should take and invoke a callback', async () => {
      let updateRunCount = 0;

      const TRANSITION_DURATION_MS = 1000;
      const FRAME_COUNT = 5;

      sprite.update((s) => {
        // The transition should take 1 second (1000ms).
        s.TransitionTimeMs = TRANSITION_DURATION_MS;

        // Shape should morph to circle.
        s.Sides = 1;

        // Border is opaque, blue.
        s.BorderColorR = 0;
        s.BorderColorG = 0;
        s.BorderColorB = 255;
        s.BorderColorOpacity = 1;

        // Interior fill is opaque yellow.
        s.FillColorR = 255;
        s.FillColorG = 255;
        s.FillColorB = 0;
        s.FillColorOpacity = 1;

        // Mark that the update callback has been run.
        updateRunCount++;
      });

      // Update callbacks should not be run immediately.
      expect(updateRunCount).toBe(0);

      // This should begin running any queued update tasks.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(updateRunCount).toBe(1);

      // Next frame, float values are flashed to the WebGL texture.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(updateRunCount).toBe(1);

      // Next frame, the draw function should have been called.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(updateRunCount).toBe(1);

      // Now we're going to capture the output of the Scene frame-by-frame.
      const {canvas} = scene;

      // Keep track of the last created canvas.
      let copy: HTMLCanvasElement = undefined!;
      let ctx: CanvasRenderingContext2D = undefined!;

      for (let frame = 0; frame < FRAME_COUNT; frame++) {
        // Advance the timing shim clock.
        timingFunctionsShim.totalElapsedTimeMs +=
            TRANSITION_DURATION_MS / FRAME_COUNT;

        // Draw.
        timingFunctionsShim.runAnimationFrameCallbacks();

        // Create duplicate canvas.

        const result = copyCanvasAndContainer(canvas);
        copy = result[0];
        ctx = result[1];
        const copyContainer = result[2];
        content.appendChild(copyContainer);

        // Grab a snapshot and draw it to the duplicate canvas.
        const blob = await scene[SceneInternalSymbol].snapshot();
        const img = await blobToImage(blob);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      // Now that we've captured all the intermediate states, let's interrogate
      // the pixels of the final state to see if they match our expected
      // rendered pixels values.

      // For integration testing, we'll sample an area of the output that's 5%
      // the width and height of the canvas size. This patch is a middle-ground
      // between testing the whole image for pixel-perfect rendering and testing
      // a single pixel.
      const sampleWidth = Math.ceil(copy.width * .05);
      const sampleHeight = Math.ceil(copy.width * .05);
      const pixelCount = sampleWidth * sampleHeight;

      // Define solid blue and yellow samples for comparison.
      const solidBlue = filledColorArray(pixelCount, [0, 0, 255, 255]);
      const solidYellow = filledColorArray(pixelCount, [255, 255, 0, 255]);

      // Take a sample from the middle top of the circle (blue border).
      const topCenterSample = ctx.getImageData(
          Math.floor(copy.width * .5 - sampleWidth * .5),
          1,
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(topCenterSample.data, solidBlue)).toEqual(1);

      const bottomCenterSample = ctx.getImageData(
          Math.floor(copy.width * .5 - sampleWidth * .5),
          Math.floor(copy.height - sampleHeight - 1),
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(bottomCenterSample.data, solidBlue)).toEqual(1);

      const centerSample = ctx.getImageData(
          Math.floor(copy.width * .5 - sampleWidth * .5),
          Math.floor(copy.height * .5 - sampleHeight * .5),
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(centerSample.data, solidYellow)).toEqual(1);
    });
  });

  describe('enter(), update()', () => {
    // Create a section for visually inspecting output.
    const {section, content} = createSection('Sprite::enter(), update()');
    article.appendChild(section);

    // Create a fixed-size container div for the Scene's canvas.
    const container = document.createElement('div');
    container.style.width = '100px';
    container.style.height = '100px';
    content.appendChild(container);

    let timingFunctionsShim: TimingFunctionsShim;
    let scene: Scene;
    let sprite: Sprite;

    beforeEach(() => {
      timingFunctionsShim = new TimingFunctionsShim();
      timingFunctionsShim.totalElapsedTimeMs = 1000;
      scene = new Scene({
        container,
        defaultTransitionTimeMs: 0,
        desiredSpriteCapacity: 100,
        timingFunctions: timingFunctionsShim,
      });
      sprite = scene.createSprite();
    });

    afterEach(() => {
      scene[SceneInternalSymbol].regl.destroy();
    });

    // In this test, we'll give the Sprite an enter() and update() callback
    // both at the start.
    it('should take and invoke enter and update callbacks', async () => {
      const TRANSITION_DURATION_MS = 1000;
      const FRAME_COUNT = 50;

      let enterRunCount = 0;
      let updateRunCount = 0;

      sprite
          .enter((s) => {
            // Position of the sprite should be centered at world origin.
            s.PositionWorldX = 0;
            s.PositionWorldY = 0;

            // Sprite size should fill the canvas.
            s.SizeWorldWidth = .8;
            s.SizeWorldHeight = .8;

            // Shape should be a square to start.
            s.Sides = 2;

            // Border should be 1/4 of a world unit, half the radius of the
            // of the shape.
            s.BorderPlacement = 1;
            s.BorderRadiusPixel = 0;
            s.BorderRadiusRelative = .25;

            // Border is solid green.
            s.BorderColorR = 0;
            s.BorderColorG = 255;
            s.BorderColorB = 0;
            s.BorderColorOpacity = 1;

            // Interior fill is solid magenta.
            s.FillColorR = 255;
            s.FillColorG = 0;
            s.FillColorB = 255;
            s.FillColorOpacity = 1;

            // Mark that the enter callback has been run.
            enterRunCount++;
          })
          .update((s) => {
            // The transition should take 1 second (1000ms).
            s.TransitionTimeMs = TRANSITION_DURATION_MS;

            // Shape should morph to circle.
            s.Sides = 1;

            // Border is opaque blue.
            s.BorderColorR = 0;
            s.BorderColorG = 0;
            s.BorderColorB = 255;
            s.BorderColorOpacity = 1;

            // Interior fill is opaque yellow.
            s.FillColorR = 255;
            s.FillColorG = 255;
            s.FillColorB = 0;
            s.FillColorOpacity = 1;

            // Mark that the update callback has been run.
            updateRunCount++;
          });

      const {canvas} = scene;

      // Convenience method for recording a snapshot.
      async function recordSnapshot() {
        // Duplicate the canvas and add it to the content area.
        const [_, ctx, copyContainer] = copyCanvasAndContainer(canvas);
        content.appendChild(copyContainer);

        // Grab a snapshot and draw it to the duplicate.
        const blob = await scene[SceneInternalSymbol].snapshot();
        const img = await blobToImage(blob);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      // Neither enter nor update allbacks should be run immediately.
      expect(enterRunCount).toBe(0);
      expect(updateRunCount).toBe(0);
      await recordSnapshot();  // Empty canvas.

      // Run the enter callback.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(enterRunCount).toBe(1);
      expect(updateRunCount).toBe(0);
      await recordSnapshot();  // Empty canvas.

      // Flash enter values to WebGL texture.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(enterRunCount).toBe(1);
      expect(updateRunCount).toBe(0);
      await recordSnapshot();  // Green/Magenta square.

      // Run the update callback.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(enterRunCount).toBe(1);
      expect(updateRunCount).toBe(1);
      await recordSnapshot();  // Green/Magenta square.

      // Flash update values to WebGL texture.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(enterRunCount).toBe(1);
      expect(updateRunCount).toBe(1);
      await recordSnapshot();  // Green/Magenta square.

      // Now that the enter() and update() callbacks have both been called, and
      // the resulting values have been flashed to the WebGL texture, advance
      // time and record a snapshot each frame.
      for (let frame = 0; frame < FRAME_COUNT; frame++) {
        // Advance the timing shim clock.
        timingFunctionsShim.totalElapsedTimeMs +=
            TRANSITION_DURATION_MS / FRAME_COUNT;
        timingFunctionsShim.runAnimationFrameCallbacks();
        await recordSnapshot();
      }
    });
  });

  describe('stacking', () => {
    // Create a <section> for storing visible artifacts.
    const {section, content} = createSection('Sprite stacking');
    article.appendChild(section);

    it('should render later sprites over earlier sprites', async () => {
      // Create a container <div> of fixed size for the Scene to render into.
      const container = document.createElement('div');
      container.style.width = '100px';
      container.style.height = '100px';
      content.appendChild(container);

      // Control time meticulously to evaluate animation states.
      const timingFunctionsShim = new TimingFunctionsShim();
      timingFunctionsShim.totalElapsedTimeMs = 1000;

      const scene = new Scene({
        container,
        defaultTransitionTimeMs: 0,
        desiredSpriteCapacity: 100,
        timingFunctions: timingFunctionsShim,
      });

      const bottomSprite = scene.createSprite();
      // Give the Sprite an enter() callback to invoke.
      bottomSprite.enter((s) => {
        // Position of the sprite should be centered at world origin.
        s.PositionWorldX = 0.2;
        s.PositionWorldY = -0.2;

        // Sprite size should fill the canvas.
        s.SizeWorldWidth = 0.7;
        s.SizeWorldHeight = 0.7;

        // Shape should be a square.
        s.Sides = 2;

        // Interior fill is opaque purple.
        s.FillColorR = 128;
        s.FillColorG = 0;
        s.FillColorB = 128;
        s.FillColorOpacity = 1;
      });

      const topSprite = scene.createSprite();
      // Give the Sprite an enter() callback to invoke.
      topSprite.enter((s) => {
        // Position of the sprite should be centered at world origin.
        s.PositionWorldX = -0.2;
        s.PositionWorldY = 0.2;

        // Sprite size should fill the canvas.
        s.SizeWorldWidth = 0.7;
        s.SizeWorldHeight = 0.7;

        // Shape should be a square.
        s.Sides = 2;

        // Interior fill is opaque orange.
        s.FillColorR = 255;
        s.FillColorG = 128;
        s.FillColorB = 0;
        s.FillColorOpacity = 1;
      });

      // After advancing three frames, the sprites should both be drawn to the
      // canvas.
      timingFunctionsShim.runAnimationFrameCallbacks(3);

      // Now, if we inspect the canvas, its pixels should show that the sprite
      // has been rendered. Start my making a copy of the canvas and for
      // inspection.
      const {canvas} = scene;
      const [copy, ctx, copyContainer] = copyCanvasAndContainer(canvas);
      content.appendChild(copyContainer);

      // Grab a snapshot of the Scene's rendered pixels and draw them to
      // the canvas copy.
      const blob = await scene[SceneInternalSymbol].snapshot();
      const img = await blobToImage(blob);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // For integration testing, we'll sample an area of the output that's 5%
      // the width and height of the canvas size. This patch is a middle-ground
      // between testing the whole image for pixel-perfect rendering and testing
      // a single pixel.
      const sampleWidth = Math.ceil(copy.width * .05);
      const sampleHeight = Math.ceil(copy.width * .05);
      const pixelCount = sampleWidth * sampleHeight;

      // Generate patches of solid green and magenta to compare to the rendered
      // pixels for correctness.
      const solidOrange = filledColorArray(pixelCount, [255, 128, 0, 255]);
      const solidPurple = filledColorArray(pixelCount, [128, 0, 128, 255]);

      // Take a sample of the top left corner and compare it to the expected
      // solid green patch.
      const topLeftSample = ctx.getImageData(
          5,
          5,
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(topLeftSample.data, solidOrange)).toEqual(1);

      // Take a sample of the bottom right corner and compare it to the expected
      // solid green patch.
      const bottomRightSample = ctx.getImageData(
          Math.floor(copy.width - sampleWidth - 5),
          Math.floor(copy.height - sampleHeight - 5),
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(bottomRightSample.data, solidPurple))
          .toEqual(1);

      // Lastly, sample a chunk of the middle of the image and compare it to the
      // solid magenta patch.
      const centerSample = ctx.getImageData(
          Math.floor(copy.width * .5 - sampleWidth * .5),
          Math.floor(copy.height * .5 - sampleHeight * .5),
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(centerSample.data, solidOrange)).toEqual(1);

      // Cleanup REGL resources.
      scene[SceneInternalSymbol].regl.destroy();
    });

    it('should render higher sprites over lower sprites', async () => {
      // Create a container <div> of fixed size for the Scene to render into.
      const container = document.createElement('div');
      container.style.width = '100px';
      container.style.height = '100px';
      content.appendChild(container);

      // Control time meticulously to evaluate animation states.
      const timingFunctionsShim = new TimingFunctionsShim();
      timingFunctionsShim.totalElapsedTimeMs = 1000;

      const scene = new Scene({
        container,
        defaultTransitionTimeMs: 0,
        desiredSpriteCapacity: 100,
        timingFunctions: timingFunctionsShim,
      });

      const topSprite = scene.createSprite();
      // Give the Sprite an enter() callback to invoke.
      topSprite.enter((s) => {
        // Position of the sprite should be centered at world origin.
        s.PositionWorldX = 0.2;
        s.PositionWorldY = 0.2;

        // PLACE SPRITE ON TOP.
        s.OrderZ = 1;

        // Sprite size should fill the canvas.
        s.SizeWorldWidth = 0.7;
        s.SizeWorldHeight = 0.7;

        // Shape should be a square.
        s.Sides = 2;

        // Interior fill is opaque purple.
        s.FillColorR = 128;
        s.FillColorG = 0;
        s.FillColorB = 128;
        s.FillColorOpacity = 1;
      });

      const bottomSprite = scene.createSprite();
      // Give the Sprite an enter() callback to invoke.
      bottomSprite.enter((s) => {
        // Position of the sprite should be centered at world origin.
        s.PositionWorldX = -0.2;
        s.PositionWorldY = -0.2;

        // PLACE SPRITE ON BOTTOM.
        s.OrderZ = 0;

        // Sprite size should fill the canvas.
        s.SizeWorldWidth = 0.7;
        s.SizeWorldHeight = 0.7;

        // Shape should be a square.
        s.Sides = 2;

        // Interior fill is opaque orange.
        s.FillColorR = 255;
        s.FillColorG = 128;
        s.FillColorB = 0;
        s.FillColorOpacity = 1;
      });

      // After advancing three frames, the sprites should both be drawn to the
      // canvas.
      timingFunctionsShim.runAnimationFrameCallbacks(3);

      // Now, if we inspect the canvas, its pixels should show that the sprite
      // has been rendered. Start my making a copy of the canvas and for
      // inspection.
      const {canvas} = scene;
      const [copy, ctx, copyContainer] = copyCanvasAndContainer(canvas);
      content.appendChild(copyContainer);

      // Grab a snapshot of the Scene's rendered pixels and draw them to
      // the canvas copy.
      const blob = await scene[SceneInternalSymbol].snapshot();
      const img = await blobToImage(blob);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // For integration testing, we'll sample an area of the output that's 10%
      // the width and height of the canvas size. This patch is a middle-ground
      // between testing the whole image for pixel-perfect rendering and testing
      // a single pixel.
      const sampleWidth = Math.ceil(copy.width * .1);
      const sampleHeight = Math.ceil(copy.width * .1);
      const pixelCount = sampleWidth * sampleHeight;

      // Generate patches of solid green and magenta to compare to the rendered
      // pixels for correctness.
      const solidOrange = filledColorArray(pixelCount, [255, 128, 0, 255]);
      const solidPurple = filledColorArray(pixelCount, [128, 0, 128, 255]);

      // Take a sample of the top right corner and compare it to the expected
      // solid green patch.
      const topRightSample = ctx.getImageData(
          Math.floor(copy.width - sampleWidth),
          0,
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(topRightSample.data, solidPurple)).toEqual(1);

      // Take a sample of the bottom right corner and compare it to the expected
      // solid green patch.
      const bottomLeftSample = ctx.getImageData(
          0,
          Math.floor(copy.height - sampleHeight),
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(bottomLeftSample.data, solidOrange)).toEqual(1);

      // Lastly, sample a chunk of the middle of the image and compare it to the
      // solid magenta patch.
      const centerSample = ctx.getImageData(
          Math.floor(copy.width * .5 - sampleWidth * .5),
          Math.floor(copy.height * .5 - sampleHeight * .5),
          sampleWidth,
          sampleHeight,
      );
      expect(compareColorArrays(centerSample.data, solidPurple)).toEqual(1);

      // Cleanup REGL resources.
      scene[SceneInternalSymbol].regl.destroy();
    });
  });
});
