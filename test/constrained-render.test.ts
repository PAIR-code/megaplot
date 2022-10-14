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
 * @fileoverview Integration test for the constrained rendering situation where
 * the renderer has to check the remaining time on every iteration, and the
 * maximum working time is reduced to zero. Effectively, this means that each
 * turn of the WorkScheduler, only one unit of work can occur. This forces what
 * otherwise might be rare race conditions to happen reliably.
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

// TODO(jimbo): Remove 'x' when ready.
xdescribe('constrained render', () => {
  // Create a <section> for storing visible artifacts.
  const {section, content} = createSection('constrained render');
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

    // TODO(jimbo): Set WorkScheduler's maxBatchTimeMs to 0, and steps between
    // checks to 1.

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
  it('should render a sprite', async () => {
    let enterRunCount = 0;

    // Give the Sprite an enter() callback to invoke.
    sprite.enter((s) => {
      s.Sides = 2;  // TODO(jimbo): Change to 1 for circle and update expects.
      s.SizeWorld = 1;
      s.BorderRadiusRelative = .25;
      s.BorderColor = [0, 255, 0, 1];
      s.FillColor = [255, 0, 255, 1];

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
    expect(compareColorArrays(topLeftSample.data, solidGreen)).toEqual(1);

    // Take a sample of the bottom right corner and compare it to the expected
    // solid green patch.
    const bottomRightSample = ctx.getImageData(
        Math.floor(copy.width - sampleWidth),
        Math.floor(copy.height - sampleHeight),
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
