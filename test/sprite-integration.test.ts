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
 * @fileoverview Integration tests for the Sprite API as implemented by the
 * Scene. These tests exercise the actual rendering of sprites to canvases
 * and include verifying that output pixel colors match expected values.
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
function copyCanvas(canvas: HTMLCanvasElement):
    [HTMLCanvasElement, CanvasRenderingContext2D] {
  const copy = document.createElement('canvas');
  copy.width = canvas.width;
  copy.height = canvas.height;
  copy.style.width = canvas.style.width;
  copy.style.height = canvas.style.height;
  const ctx = copy.getContext('2d')!;
  return [copy, ctx];
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

describe('Sprite', () => {
  describe('enter()', () => {
    // Create a <section> for storing visible artifacts.
    const section = createSection('Sprite::enter()');
    const content = section.querySelector('.content')!;

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

    const sprite = scene.createSprite();

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
      const [copy, ctx] = copyCanvas(canvas);
      content.appendChild(copy);

      // Grap a snapshot of the Scene's rendered pixels and draw them to
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
      const solidGreen = filledColorArray(pixelCount, [0, 255, 0, 255]);
      const solidMagenta = filledColorArray(pixelCount, [255, 0, 255, 255]);

      // Take a sample of the top left corner and compare it to the expected
      // solid green patch.
      const topLeftSample = ctx.getImageData(
          0,
          0,
          sampleWidth,
          sampleHeight,
      );
      expect(topLeftSample.data).toEqual(solidGreen);

      // Take a sample of the bottom right corner and compare it to the expected
      // solid green patch.
      const bottomRightSample = ctx.getImageData(
          Math.floor(copy.width - sampleWidth),
          Math.floor(copy.height - sampleHeight),
          sampleWidth,
          sampleHeight,
      );
      expect(bottomRightSample.data).toEqual(solidGreen);

      // Lastly, sample a chunk of the middle of the image and compare it to the
      // solid magenta patch.
      const centerSample = ctx.getImageData(
          Math.floor(copy.width * .5 - sampleWidth * .5),
          Math.floor(copy.height * .5 - sampleHeight * .5),
          sampleWidth,
          sampleHeight,
      );
      expect(centerSample.data).toEqual(solidMagenta);
    });
  });

  describe('update()', () => {
    // Create a visible document section for inspection.
    const section = createSection('Sprite::update()');
    const content = section.querySelector('.content')!;

    // Create a container div in which the Scene will place its canvas.
    const container = document.createElement('div');
    container.style.width = '100px';
    container.style.height = '100px';
    content.appendChild(container);

    // Explicitly control time.
    const timingFunctionsShim = new TimingFunctionsShim();
    timingFunctionsShim.totalElapsedTimeMs = 1000;

    const scene = new Scene({
      container,
      defaultTransitionTimeMs: 0,
      desiredSpriteCapacity: 100,
      timingFunctions: timingFunctionsShim,
    });

    const sprite = scene.createSprite();

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
      s.BorderRadiusWorld = .25;
      s.BorderRadiusPixel = 0;

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

        const result = copyCanvas(canvas);
        copy = result[0];
        ctx = result[1];
        content.appendChild(copy);

        // Grab a snapshot and draw it to the duplicate canvas.
        const blob = await scene[SceneInternalSymbol].snapshot();
        const img = await blobToImage(blob);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      // Now that we've captured all the intermediate states, let's interrogate
      // the pixels of the final state to see if they match our expected
      // rendered pixels values.

      // For integration testing, we'll sample an area of the output that's 10%
      // the width and height of the canvas size. This patch is a middle-ground
      // between testing the whole image for pixel-perfect rendering and testing
      // a single pixel.
      const sampleWidth = Math.ceil(copy.width * .1);
      const sampleHeight = Math.ceil(copy.width * .1);
      const pixelCount = sampleWidth * sampleHeight;

      // Define solid blue and yellow samples for comparison.
      const solidBlue = filledColorArray(pixelCount, [0, 0, 255, 255]);
      const solidYellow = filledColorArray(pixelCount, [255, 255, 0, 255]);

      // Take a sample from the middle top of the circle (blue border).
      const topCenterSample = ctx.getImageData(
          Math.floor(copy.width * .5 - sampleWidth * .5),
          0,
          sampleWidth,
          sampleHeight,
      );
      expect(topCenterSample.data.length).toEqual(pixelCount * 4);
      expect(topCenterSample.data).toEqual(solidBlue);

      const bottomCenterSample = ctx.getImageData(
          Math.floor(copy.width * .5 - sampleWidth * .5),
          Math.floor(copy.height - sampleHeight),
          sampleWidth,
          sampleHeight,
      );
      expect(bottomCenterSample.data.length).toEqual(pixelCount * 4);
      expect(bottomCenterSample.data).toEqual(solidBlue);

      const centerSample = ctx.getImageData(
          Math.floor(copy.width * .5 - sampleWidth * .5),
          Math.floor(copy.height * .5 - sampleHeight * .5),
          sampleWidth,
          sampleHeight,
      );
      expect(centerSample.data.length).toEqual(pixelCount * 4);
      expect(centerSample.data).toEqual(solidYellow);
    });
  });

  describe('enter(), update()', () => {
    // Create a section for visually inspecting output.
    const section = createSection('Sprite::enter(), update()');
    const content = section.querySelector('.content')!;

    // Create a fixed-size container div for the Scene's canvas.
    const container = document.createElement('div');
    container.style.width = '100px';
    container.style.height = '100px';
    content.appendChild(container);

    // Manually advance time.
    const timingFunctionsShim = new TimingFunctionsShim();
    timingFunctionsShim.totalElapsedTimeMs = 1000;

    const scene = new Scene({
      container,
      defaultTransitionTimeMs: 0,
      desiredSpriteCapacity: 100,
      timingFunctions: timingFunctionsShim,
    });

    const sprite = scene.createSprite();

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
            s.SizeWorldWidth = 1;
            s.SizeWorldHeight = 1;

            // Shape should be a square to start.
            s.Sides = 2;

            // Border should be 1/4 of a world unit, half the radius of the
            // of the shape.
            s.BorderPlacement = 0;
            s.BorderRadiusWorld = .25;
            s.BorderRadiusPixel = 0;

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
        const [copy, ctx] = copyCanvas(canvas);
        content.appendChild(copy);

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
});
