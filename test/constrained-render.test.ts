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
import {WorkScheduler} from '../src/lib/work-scheduler';

import {Sampler} from './sampler';
import {createArticle, createSection} from './utils';

// Dimensions of sample of pixels for color value testing.
const SAMPLE_SIZE = {
  width: 8,
  height: 8
};

// Set constant fill and border colors.
// NOTE: Opacity value is a floating point number in the range 0-1.
const BORDER_COLOR = [0, 255, 0, 1];
const FILL_COLOR = [255, 0, 255, 1];

// For some tests, exiting sprites will change color.
const EXIT_COLOR = [0, 0, 0, 1];

// At the transition midpoint, exiting sprites will be half way between the fill
// and exit colors.
const MIDPOINT_COLOR = [
  Math.round((FILL_COLOR[0] + EXIT_COLOR[0]) / 2),
  Math.round((FILL_COLOR[1] + EXIT_COLOR[1]) / 2),
  Math.round((FILL_COLOR[2] + EXIT_COLOR[2]) / 2),
  Math.round((FILL_COLOR[3] + EXIT_COLOR[3]) / 2),
];

// When nothing is displayed, it's this empty color.
const EMPTY_COLOR = [0, 0, 0, 0];

/**
 * Tests produce visible artifacts for debugging.
 */
const article = createArticle();
document.body.appendChild(article);

describe('constrained render', () => {
  // Create a <section> for storing visible artifacts.
  const {section, content} = createSection('constrained render');
  article.appendChild(section);

  let container: HTMLDivElement;
  let heading: HTMLHeadingElement;
  let timingFunctionsShim: TimingFunctionsShim;
  let scene: Scene;
  let workScheduler: WorkScheduler;
  let sampler: Sampler;

  beforeEach(() => {
    const subsection = document.createElement('div');
    heading = document.createElement('h3');
    subsection.appendChild(heading);
    const subsectionContent = document.createElement('div');
    subsectionContent.style.display = 'flex';
    subsectionContent.style.flexDirection = 'row';
    subsectionContent.style.flexWrap = 'wrap';
    subsection.appendChild(subsectionContent);
    content.appendChild(subsection);

    // Create a container <div> of fixed size for the Scene to render into.
    container = document.createElement('div');
    container.style.width = '100px';
    container.style.height = '100px';
    subsectionContent.appendChild(container);

    timingFunctionsShim = new TimingFunctionsShim();
    timingFunctionsShim.totalElapsedTimeMs = 1000;

    scene = new Scene({
      container,
      defaultTransitionTimeMs: 0,
      desiredSpriteCapacity: 100,
      timingFunctions: timingFunctionsShim,
    });

    workScheduler = scene[SceneInternalSymbol].workScheduler;

    // Setting maxWorkTimeMs to 0 ensures that only one work task will be
    // invoked each animation frame. When a task finishes, the WorkScheduler
    // checks to see if there's any time remaining for more tasks to run, and
    // always finds that there is none.
    workScheduler.maxWorkTimeMs = 0;

    // Some long-running tasks do not check remaining time on each iteration of
    // their internal loops. This cuts down on the frequency and number of calls
    // to Date.now(). For this test however, we want to constrain the amount of
    // work that can occur each frame, and so we explicitly set the
    // stepsBetweenRemainingTimeChecks to 1 so that the amount of remaining time
    // is checked after each iteration of every loop.
    scene[SceneInternalSymbol].stepsBetweenRemainingTimeChecks = 1;

    sampler = new Sampler(scene, subsectionContent);
  });

  afterEach(() => {
    scene[SceneInternalSymbol].regl.destroy();
  });

  // This is an integration test. It draws a single sprite, then reads
  // back the rendered pixels to test that they're the correct colors.
  it('should render a sprite', async () => {
    const sprite = scene.createSprite();

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
      ...SAMPLE_SIZE,
      color: BORDER_COLOR,
    })).toBe(1, 'Top left sample should match border color');

    expect(sampler.compareSample({
      x: Math.floor(scene.canvas.width - SAMPLE_SIZE.width - 1),
      y: Math.floor(scene.canvas.height - SAMPLE_SIZE.height - 1),
      ...SAMPLE_SIZE,
      color: BORDER_COLOR,
    })).toBe(1, 'Bottom right sample should match border color');

    expect(sampler.compareSample({
      x: Math.floor(scene.canvas.width * .5 - SAMPLE_SIZE.width * .5),
      y: Math.floor(scene.canvas.height * .5 - SAMPLE_SIZE.height * .5),
      ...SAMPLE_SIZE,
      color: FILL_COLOR,
    })).toBe(1, 'Center sample should match fill color');
  });

  // This is an integration test. It draws a grid of sprites, then removes them
  // and confirms that the canvas is empty.
  it('should remove a sprite', async () => {
    const sprite = scene.createSprite();

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

    // Draw. Texture sync. Draw. Run removal. Draw. Texture sync. Draw.
    timingFunctionsShim.runAnimationFrameCallbacks(7);

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
      color: EMPTY_COLOR,
    })).toBe(1, 'Canvas should be empty');
  });

  // This is an integration test. It draws a single sprite, then removes it and
  // confirms that the canvas is empty.
  it('should draw and remove a grid of sprites', async () => {
    // Disable antialiasing for pixel-perfect testing.
    scene[SceneInternalSymbol].antialiasingFactor = 0;

    // Parameters for sprites to be rendered and removed.
    const params = [
      {label: 'Top left', x: -.25, y: .25},
      {label: 'Top right', x: .25, y: .25},
      {label: 'Bottom left', x: -.25, y: -.25},
      {label: 'Bottom right', x: .25, y: -.25},
    ];

    expect(workScheduler.queueLength).toBe(1, 'Queued: Draw (initial)');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();

    expect(workScheduler.queueLength).toBe(0, 'Queue empty');

    // Create and set enter callbacks for all sprites.
    const sprites: Sprite[] = new Array<Sprite>(params.length);
    const enterRunCounts = new Array<number>(params.length).fill(0);
    for (let i = 0; i < params.length; i++) {
      const sprite = sprites[i] = scene.createSprite();
      sprite.enter((s) => {
        if (enterRunCounts[i] > 0) {
          throw new Error(`${params[i].label} enter callback has already run`);
        }
        s.Sides = 2;
        s.SizeWorld = .5;
        s.FillColor = FILL_COLOR;
        s.PositionWorld = params[i];
        enterRunCounts[i]++;
      });
    }

    expect(workScheduler.queueLength).toBe(1, 'Queued: Run callbacks');
    expect(enterRunCounts)
        .toEqual([0, 0, 0, 0], 'No enter callbacks should have been run yet');

    // Run callbacks.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Draw, Texture sync, Run callbacks');
    expect(enterRunCounts)
        .toEqual([1, 0, 0, 0], 'First enter callback should have been run');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Texture sync, Run callbacks, Draw');

    // Texture sync.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Run callbacks, Draw');

    // Run callbacks.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Draw, Texture sync, Run callbacks');
    expect(enterRunCounts)
        .toEqual([1, 1, 0, 0], 'Second enter callback should have been run');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Texture sync, Run callbacks, Draw');

    // Texture sync.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Run callbacks, Draw');

    // Run callbacks.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Draw, Texture sync, Run callbacks');
    expect(enterRunCounts)
        .toEqual([1, 1, 1, 0], 'Third enter callback should have been run');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Texture sync, Run callbacks, Draw');

    // Texture sync.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Run callbacks, Draw');

    // Run callbacks. All callbacks have been run, so another task to run
    // callbacks will NOT be queued.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Draw, Texture sync');
    expect(enterRunCounts)
        .toEqual([1, 1, 1, 1], 'Fourth enter callback should have been run');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Texture sync, Draw');

    // Texture sync.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(1, 'Queued: Draw');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();

    // At this point, the Scene would keep scheduling draw calls until time
    // advances. This is because the high bound of the timestamp range was
    // exactly equal to the current time.
    expect(workScheduler.queueLength).toBe(1, 'Queued: Draw');

    // The whole canvas should be filled with the fill color.
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: 0,
      y: 0,
      width: scene.canvas.width,
      height: scene.canvas.height,
      color: FILL_COLOR,
    })).toBe(1, 'Canvas should be entirely filled');

    // Set exit callbacks for all sprites.
    const exitRunCounts = new Array<number>(params.length).fill(0);
    for (let i = 0; i < params.length; i++) {
      const sprite = sprites[i];
      sprite.exit((s) => {
        if (exitRunCounts[i] > 0) {
          throw new Error(`${params[i].label} exit callback has already run`);
        }
        s.TransitionTimeMs = 10;
        s.FillColor = EXIT_COLOR;
        exitRunCounts[i]++;
      });
    }

    expect(workScheduler.queueLength).toBe(2, 'Queued: Draw, Run callbacks');
    expect(exitRunCounts)
        .toEqual([0, 0, 0, 0], 'No exit callbacks should have been run yet');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Run callbacks, Draw');

    // Run callbacks.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Draw, Rebase, Run callbacks');
    expect(exitRunCounts)
        .toEqual([1, 0, 0, 0], 'First exit callback should have been run');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Rebase, Run callbacks, Draw');

    // Rebase.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Run callbacks, Draw, Texture sync');

    // Run callbacks.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(4, 'Queued: Draw, Texture sync, Rebase, Run callbacks');
    expect(exitRunCounts)
        .toEqual([1, 1, 0, 0], 'Second exit callback should have been run');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(4, 'Queued: Texture sync, Rebase, Run callbacks, Draw');

    // Texture sync.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(4, 'Queued: Rebase, Run callbacks, Draw, Texture sync');

    // Rebase.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Run callbacks, Draw, Texture sync');

    // Run callbacks.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(4, 'Queued: Draw, Texture sync, Rebase, Run callbacks');
    expect(exitRunCounts)
        .toEqual([1, 1, 1, 0], 'Third exit callback should have been run');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(4, 'Queued: Texture sync, Rebase, Run callbacks, Draw');

    // Texture sync.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(4, 'Queued: Rebase, Run callbacks, Draw, Texture sync');

    // Rebase.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Run callbacks, Draw, Texture sync');

    // Run callbacks.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Draw, Texture sync, Rebase');
    expect(exitRunCounts)
        .toEqual([1, 1, 1, 1], 'Fourth exit callback should have been run');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Texture sync, Rebase, Draw');

    // Texture sync.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Rebase, Draw, Run removal');

    // Rebase.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Draw, Run removal, Texture sync');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Run removal, Texture sync, Draw');

    // Run removal. Attempts to remove the first sprite, but since time has not
    // advanced, it cannot and simply reschedules another run removal task. The
    // removal task will continue to queue itself until after the last sprite
    // has finished its transition.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Texture sync, Draw, Run removal');

    // Texture sync.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Draw, Run removal');

    // Draw. All four sprites have had their exit callbacks invoked, and those
    // values flashed to the data texture.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Run removal, Draw');

    // However, since time has not advanced, the canvas still looks the same as
    // last time, filled with the fill color.
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: 0,
      y: 0,
      width: scene.canvas.width,
      height: scene.canvas.height,
      color: FILL_COLOR,
    })).toBe(1, 'Canvas should be entirely filled');

    // Advance time half way to transition finish time.
    timingFunctionsShim.totalElapsedTimeMs += 5;

    // Run removal. Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Draw, Run removal');
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Run removal, Draw');

    // Now that time has advanced, all four sprites, and thus the whole canvas,
    // should be halfway transitioned to the exit color.
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: 0,
      y: 0,
      width: scene.canvas.width,
      height: scene.canvas.height,
      color: MIDPOINT_COLOR,
    })).toBe(1, 'Canvas should be halfway between fill and exit colors');

    // Run removal. (Nothing is removed, but task is requeued).
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Draw, Run removal');

    // Advance time the rest of the way to finish transitions.
    timingFunctionsShim.totalElapsedTimeMs += 5;

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Run removal, Draw');

    // All four sprites, and thus the whole canvas, should be entirely the exit
    // color.
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: 0,
      y: 0,
      width: scene.canvas.width,
      height: scene.canvas.height,
      color: EXIT_COLOR,
    })).toBe(1, 'Canvas should be filled with exit color');

    // Run removal. This will flash zeros to the first sprite's swatch and mark
    // it for texture sync.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Draw, Texture sync, Run removal');

    // Draw. (Nothing different until the Sprite's values are sync'd).
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Texture sync, Run removal, Draw');

    // Texture sync. (First Sprite's post-exit zeros flashed to GPU).
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Run removal, Draw');

    // Run removal. (Second Sprite has zeros flashed to swatch).
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Draw, Texture sync, Run removal');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Texture sync, Run removal, Draw');

    // Where the first sprite was, there should now be a blank space.
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: 0,
      y: 0,
      width: scene.canvas.width / 2,
      height: scene.canvas.height / 2,
      color: EMPTY_COLOR,
    })).toBe(1, 'Top left should be filled with exit color');

    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Texture sync, Run removal, Draw');

    // Texture sync. (Second Sprite's post-exit zeros flashed to GPU).
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Run removal, Draw');

    // Run removal. (Third Sprite has zeros flashed to swatch).
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Draw, Texture sync, Run removal');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Texture sync, Run removal, Draw');

    // Second sprite's space should now be blank.
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: scene.canvas.width / 2,
      y: 0,
      width: scene.canvas.width / 2,
      height: scene.canvas.height / 2,
      color: EMPTY_COLOR,
    })).toBe(1, 'Top right should be filled with exit color');

    // Queued: Texture sync, run removal and draw.
    expect(workScheduler.queueLength)
        .toBe(3, 'Queued: Texture sync, Run removal, Draw');

    // Texture sync. (Third Sprite's post-exit zeros flashed to GPU).
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Run removal, Draw');

    // Run removal. Fourth and final Sprite has zeros flashed to swatch. Because
    // this is the last Sprite that was queued for removal, no more removal
    // tasks will be run.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Draw, Texture sync');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Texture sync, Draw');

    // Third sprite's space should now be blank.
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: 0,
      y: scene.canvas.height / 2,
      width: scene.canvas.width / 2,
      height: scene.canvas.height / 2,
      color: EMPTY_COLOR,
    })).toBe(1, 'Bottom left should be filled with exit color');

    // Texture sync. (Fourth and final Sprite's post-exit zeros flashed).
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(1, 'Queued: Draw');

    // In addition to flashing values to the data texture, the Texture sync
    // operation calls the Scene's removeSprite() method to put removed sprite's
    // swatches up for later use. One side effect of this is that the
    // instanceCount should be shortened such that it matches the highest index
    // of any sprite swatch still in use.
    expect(scene[SceneInternalSymbol].instanceCount)
        .toBe(0, 'Internal instanceCount should reflect removals');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(1, 'Queued: Draw');

    // With the fourth sprite gone, the whole canvas should be blank.
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: 0,
      y: 0,
      width: scene.canvas.width,
      height: scene.canvas.height,
      color: EMPTY_COLOR,
    })).toBe(1, 'Whole canvas should be filled with exit color');

    // At this point, the Scene would keep scheduling draw calls until time
    // advances. This is because the high bound of the timestamp range was
    // exactly equal to the current time. So here we advance time to ensure that
    // draw calls cease.
    timingFunctionsShim.totalElapsedTimeMs += 1;

    // Draw. This will schedule one final draw call since the timestamp range
    // was defined when the draw call was executed. But since time has advanced,
    // the timestamp range will be cleared.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(1, 'Queued: Draw');

    // Draw. But do not schedule any more draw calls.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(0, 'Queue should be empty');
  });
});
