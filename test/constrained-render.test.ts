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

import {Sampler} from './sampler';
import {createArticle, createSection} from './utils';

// Dimensions of sample of pixels for color value testing.
const SAMPLE_WIDTH_PX = 8;
const SAMPLE_HEIGHT_PX = 8;

// Set constant fill and border colors.
// NOTE: Opacity value is a floating point number in the range 0-1.
const BORDER_COLOR = [0, 255, 0, 1];
const FILL_COLOR = [255, 0, 255, 1];

/**
 * Tests produce visible artifacts for debugging.
 */
const article = createArticle();
document.body.appendChild(article);

describe('constrained render', () => {
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
  let sampler: Sampler;

  beforeEach(() => {
    timingFunctionsShim = new TimingFunctionsShim();
    timingFunctionsShim.totalElapsedTimeMs = 1000;

    scene = new Scene({
      container,
      defaultTransitionTimeMs: 0,
      desiredSpriteCapacity: 100,
      timingFunctions: timingFunctionsShim,
    });

    sampler = new Sampler(scene, content);

    // Setting maxWorkTimeMs to 0 ensures that only one work task will be
    // invoked each animation frame. When a task finishes, the WorkScheduler
    // checks to see if there's any time remaining for more tasks to run, and
    // always finds that there is none.
    scene[SceneInternalSymbol].workScheduler.maxWorkTimeMs = 0;

    // Some long-running tasks do not check remaining time on each iteration of
    // their internal loops. This cuts down on the frequency and number of calls
    // to Date.now(). For this test however, we want to constrain the amount of
    // work that can occur each frame, and so we explicitly set the
    // stepsBetweenRemainingTimeChecks to 1 so that the amount of remaining time
    // is checked after each iteration of every loop.
    scene[SceneInternalSymbol].stepsBetweenRemainingTimeChecks = 1;

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
      s.Sides = 2;
      s.SizeWorld = 1;
      s.BorderRadiusRelative = .25;
      s.BorderColor = BORDER_COLOR;
      s.FillColor = FILL_COLOR;

      // Mark that the enter callback has run.
      enterRunCount++;
    });

    // The callback should NOT have been invoked immediately.
    expect(enterRunCount).toBe(0);

    // After one frame, the Scene's draw command will have been run, but no
    // other work since the maxWorkTimeMs has been set to 0.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(enterRunCount).toBe(0);

    // After the next frame, the sprite's enter callback should have been run.
    // This will update the Float32 array for the sprite.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(enterRunCount).toBe(1);

    // Next frame: draw again.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(enterRunCount).toBe(1);

    // Next frame, the Float32 array values should have been flashed
    // over to the WebGL texture. But the draw call that causes those values
    // to affect rendered screen pixels may not yet have been run.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(enterRunCount).toBe(1);

    // After one more frame, the Scene's draw command should have
    // run (with the target values resident on in the WebGL texture). This
    // will have caused the sprite to be rendered to the canvas.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(enterRunCount).toBe(1);

    // Snapshot scene and copy the canvas for sampling.
    await sampler.copySnapshot();

    expect(sampler.compareSample({
      x: 1,
      y: 1,
      width: SAMPLE_WIDTH_PX,
      height: SAMPLE_HEIGHT_PX,
      color: BORDER_COLOR,
    })).toBe(1, 'Top left sample should match border color');

    expect(sampler.compareSample({
      x: Math.floor(scene.canvas.width - SAMPLE_WIDTH_PX - 1),
      y: Math.floor(scene.canvas.height - SAMPLE_HEIGHT_PX - 1),
      width: SAMPLE_WIDTH_PX,
      height: SAMPLE_HEIGHT_PX,
      color: BORDER_COLOR,
    })).toBe(1, 'Bottom right sample should match border color');

    expect(sampler.compareSample({
      x: Math.floor(scene.canvas.width * .5 - SAMPLE_WIDTH_PX * .5),
      y: Math.floor(scene.canvas.height * .5 - SAMPLE_HEIGHT_PX * .5),
      width: SAMPLE_WIDTH_PX,
      height: SAMPLE_HEIGHT_PX,
      color: FILL_COLOR,
    })).toBe(1, 'Center sample should match fill color');
  });

  // This is an integration test. It draws a single sprite, then removes it and
  // confirms that the canvas is empty.
  it('should remove a sprite', async () => {
    // Give the Sprite an enter() callback to invoke.
    sprite.enter((s) => {
      s.Sides = 2;
      s.SizeWorld = 1;
      s.FillColor = FILL_COLOR;
    });

    // Because this is a constrained test, it takes five frames to render the
    // sprite: draw, run callbacks, draw, run texture sync, draw.
    timingFunctionsShim.runAnimationFrameCallbacks(5);

    expect(scene[SceneInternalSymbol].sprites.length).toBe(1);

    // Give the Sprite an exit() callback to invoke.
    let exitRunCount = 0;
    sprite.exit(() => {
      exitRunCount++;
    });

    expect(exitRunCount).toBe(0);

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(exitRunCount).toBe(0);

    // Run callbacks.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(exitRunCount).toBe(1);

    // Draw. Texture sync. Draw.
    timingFunctionsShim.runAnimationFrameCallbacks(3);

    // Confirm that the previously allocated sprite has been removed.
    const {removedIndexRange} = scene[SceneInternalSymbol];
    expect(removedIndexRange.lowBound).toBe(0);
    expect(removedIndexRange.isDefined).toBe(true);
    expect(removedIndexRange.highBound).toBe(0);

    // Now, if we inspect the canvas, its pixels should be all empty.
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: 0,
      y: 0,
      width: scene.canvas.width,
      height: scene.canvas.height,
      color: [0, 0, 0, 0],
    })).toBe(1, 'Canvas should be empty');
  });
});
