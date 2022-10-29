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
 * @fileoverview Integration test for behavior of Selection when the renderer is
 * severely constrained. It checks the remaining time on every iteration, and
 * the maximum working time is reduced to zero. Effectively, this means that
 * each turn of the WorkScheduler, only one unit of work can occur.
 */

import {Scene} from '../src/lib/scene';
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

describe('constrained selection', () => {
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
  let workScheduler: WorkScheduler;
  let sampler: Sampler;

  beforeEach(() => {
    timingFunctionsShim = new TimingFunctionsShim();
    timingFunctionsShim.totalElapsedTimeMs = 1000;

    scene = new Scene({
      antialiasingFactor: 0,  // Disable antialiasing.
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

    sampler = new Sampler(scene, content);
  });

  afterEach(() => {
    scene[SceneInternalSymbol].regl.destroy();
  });

  // This is an integration test. It draws a selection binding a single sprite,
  // then reads back the rendered pixels to test that they're the correct
  // colors. Finally, it binds an empty array and confirms that the sprites are
  // removed.
  it('should render and remove a single sprite in a selection', async () => {
    // Run initial Draw task.
    expect(workScheduler.queueLength).toBe(1, 'Queued: Draw (initial)');
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(0, 'Queue empty');

    const selection = scene.createSelection<{}>();

    let initRunCount = 0;

    // Give the selection an onInit() callback.
    selection.onInit((s) => {
      if (initRunCount > 0) {
        throw new Error('Init should not run more than once');
      }

      s.Sides = 2;
      s.SizeWorld = 1;
      s.BorderRadiusRelative = 0.25;
      s.BorderColor = BORDER_COLOR;
      s.FillColor = FILL_COLOR;

      // Mark that the init callback has run.
      initRunCount++;
    });

    expect(initRunCount)
        .toBe(0, 'Init callback should not run immediately when specified');

    selection.bind([{}]);
    expect(workScheduler.queueLength).toBe(1, 'Queued: Binding task');

    expect(initRunCount)
        .toBe(0, 'Init callback should not run immediately on bind');

    // Binding task.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(1, 'Queued: Run callbacks');
    expect(initRunCount)
        .toBe(0, 'Init callback should not run during binding task');

    // Run callbacks.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Draw, Texture sync');
    expect(initRunCount).toBe(1, 'Init callback should have been run');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Texture sync, Draw');

    // Texture sync.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(1, 'Queued: Draw');

    // Draw. Will keep queuing more draw calls until time advances.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(1, 'Queued: Draw');

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

    // Advance time.
    timingFunctionsShim.totalElapsedTimeMs += 1;

    // Draw. Will queue one more draw call.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(1, 'Queued: Draw');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(0, 'Queue empty');

    let exitRunCount = 0;

    // Give the selection an onExit() callback.
    selection.onExit((s) => {
      if (exitRunCount > 0) {
        throw new Error('Exit should not run more than once');
      }

      s.TransitionTimeMs = 1;
      s.FillColor = EXIT_COLOR;  // Changing fill only, not border.

      // Mark that the exit callback has run.
      exitRunCount++;
    });

    expect(exitRunCount)
        .toBe(0, 'Exit callback should not run immediately when specified');

    selection.bind([/* Empty. */]);
    expect(workScheduler.queueLength).toBe(1, 'Queued: Binding task');

    expect(exitRunCount)
        .toBe(0, 'Exit callback should not run immediately on bind');

    // Binding task.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(1, 'Queued: Run callbacks');
    expect(exitRunCount)
        .toBe(0, 'Exit callback should not run during binding task');

    // Run callbacks.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Draw, Rebase');
    expect(exitRunCount).toBe(1, 'Exit callback should run as a callback');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Rebase, Draw');

    // Rebase.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Draw, Texture sync');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Texture sync, Draw');

    // Texture sync.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Draw, Run removal');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Run removal, Draw');

    // Run removal. Attempts to remove the sprite, but can't because time hasn't
    // advanced past the exit transition time. So queues another Run removal
    // task to try again.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Draw, Run removal');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Run removal, Draw');

    // Advance time.
    timingFunctionsShim.totalElapsedTimeMs += 1;

    // Run removal. Succeeds in flashing sprite values to zero.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Draw, Texture sync');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(2, 'Queued: Texture sync, Draw');

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
      color: EXIT_COLOR,
    })).toBe(1, 'Center sample should match exit color');

    // Texture sync.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(1, 'Queued: Draw');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(1, 'Queued: Draw');

    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: 1,
      y: 1,
      width: scene.canvas.width,
      height: scene.canvas.height,
      color: EMPTY_COLOR,
    })).toBe(1, 'Canvas should be empty');

    // Advance time. Otherwise Draw will keep queueing itself.
    timingFunctionsShim.totalElapsedTimeMs += 1;

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(1, 'Queued: Draw');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.queueLength).toBe(0, 'Queued: Draw');
  });

  // This integration test draws a grid of four sprites using a Selection, then
  // confirms that they've all been removed after exit.
  fit('should render and remove a grid of sprites in a selection', async () => {
    // Draw (initial).
    timingFunctionsShim.runAnimationFrameCallbacks();

    // Parameters for sprites to be rendered and removed.
    const data = [
      {index: 0, label: 'Top left', x: -.25, y: .25},
      {index: 1, label: 'Top right', x: .25, y: .25},
      {index: 2, label: 'Bottom left', x: -.25, y: -.25},
      {index: 3, label: 'Bottom right', x: .25, y: -.25},
    ];

    const selection = scene.createSelection<typeof data[number]>();

    let initRunCounts = new Array<number>(data.length).fill(0);

    // Give the selection an onInit() callback.
    selection.onInit((s, datum) => {
      if (initRunCounts[datum.index] > 0) {
        throw new Error('Init should not run more than once per datum');
      }

      s.Sides = 2;
      s.SizeWorld = .5;
      s.PositionWorld = datum;
      s.FillColor = FILL_COLOR;

      // Mark that the init callback has run.
      initRunCounts[datum.index]++;
    });

    expect(initRunCounts)
        .toEqual([0, 0, 0, 0], 'Init callbacks should not run immediately');

    selection.bind(data);

    // Binding task (1/4). Run callbacks (1/4).
    timingFunctionsShim.runAnimationFrameCallbacks(2);
    expect(initRunCounts)
        .toEqual([1, 0, 0, 0], 'First init callback should have run');

    // Binding task (2/4). Draw. Texture sync (1/4). Run callbacks (2/4).
    timingFunctionsShim.runAnimationFrameCallbacks(4);
    expect(initRunCounts)
        .toEqual([1, 1, 0, 0], 'Second init callback should have run');

    // Binding task (3/4). Draw.
    timingFunctionsShim.runAnimationFrameCallbacks(2);
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: 0,
      y: 0,
      width: scene.canvas.width / 2,
      height: scene.canvas.height / 2,
      color: FILL_COLOR,
    })).toBe(1, 'Top left sample should match fill color');

    // Texture sync (2/4). Run callbacks (3/4).
    timingFunctionsShim.runAnimationFrameCallbacks(2);
    expect(initRunCounts)
        .toEqual([1, 1, 1, 0], 'Third init callback should have run');

    // Binding task (4/4). Draw.
    timingFunctionsShim.runAnimationFrameCallbacks(2);
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: scene.canvas.width / 2,
      y: 0,
      width: scene.canvas.width / 2,
      height: scene.canvas.height / 2,
      color: FILL_COLOR,
    })).toBe(1, 'Top right sample should match fill color');

    // Texture sync (3/4). Run callbacks (4/4).
    timingFunctionsShim.runAnimationFrameCallbacks(2);
    expect(initRunCounts)
        .toEqual([1, 1, 1, 1], 'Fourth init callback should have run');

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: 0,
      y: scene.canvas.height / 2,
      width: scene.canvas.width / 2,
      height: scene.canvas.height / 2,
      color: FILL_COLOR,
    })).toBe(1, 'Bottom left sample should match fill color');

    // Texture sync (4/4). Draw.
    timingFunctionsShim.runAnimationFrameCallbacks(2);
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: scene.canvas.width / 2,
      y: scene.canvas.height / 2,
      width: scene.canvas.width / 2,
      height: scene.canvas.height / 2,
      color: FILL_COLOR,
    })).toBe(1, 'Bottom right sample should match fill color');

    // Advance time to clear out draw queue.
    timingFunctionsShim.totalElapsedTimeMs += 1;
    timingFunctionsShim.runAnimationFrameCallbacks(2);
    expect(workScheduler.queueLength).toBe(0, 'Queue empty');

    let exitRunCounts = new Array<number>(data.length).fill(0);

    // Give the selection an onExit() callback.
    selection.onExit((s, datum) => {
      if (exitRunCounts[datum.index] > 0) {
        throw new Error('Exit should not run more than once per datum');
      }

      s.TransitionTimeMs = 2;
      s.FillColor = EXIT_COLOR;

      // Mark that the exit callback has run.
      exitRunCounts[datum.index]++;
    });

    expect(exitRunCounts)
        .toEqual([0, 0, 0, 0], 'Exit callbacks should not run immediately');

    selection.bind([]);

    // Binding task (1/4). Run callbacks (1/4).
    timingFunctionsShim.runAnimationFrameCallbacks(2);
    expect(exitRunCounts)
        .toEqual([1, 0, 0, 0], 'First exit callback should have run');

    // Binding task (2/4). Draw. Rebase (1/4). Run callbacks (2/4).
    timingFunctionsShim.runAnimationFrameCallbacks(4);
    expect(exitRunCounts)
        .toEqual([1, 1, 0, 0], 'Second exit callback should have run');

    // Binding task (3/4). Draw. Texture sync (1/4). Rebase (2/4).
    // Run callbacks (3/4).
    timingFunctionsShim.runAnimationFrameCallbacks(5);
    expect(exitRunCounts)
        .toEqual([1, 1, 1, 0], 'Third exit callback should have run');

    // Binding task (4/4). Draw. Texture sync (2/4). Rebase (3/4).
    // Run callbacks (4/4).
    timingFunctionsShim.runAnimationFrameCallbacks(5);
    expect(exitRunCounts)
        .toEqual([1, 1, 1, 1], 'Fourth exit callback should have run');

    // Draw. Texture sync (3/4). Rebase (4/4). Draw. Run removal (no-op).
    // Texture sync (4/4).
    timingFunctionsShim.runAnimationFrameCallbacks(6);

    // Advance time to test exit transition.
    timingFunctionsShim.totalElapsedTimeMs += 1;

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: 0,
      y: 0,
      width: scene.canvas.width,
      height: scene.canvas.height,
      color: MIDPOINT_COLOR,
    })).toBe(1, 'Whole canvas should be filled with the midpoint color');

    // At this point, Run removal and draw would keep queuing themselves until
    // time advances. So advance time.
    timingFunctionsShim.totalElapsedTimeMs += 1;

    // Run removal (1/4). Draw.
    timingFunctionsShim.runAnimationFrameCallbacks(2);
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: 0,
      y: 0,
      width: scene.canvas.width,
      height: scene.canvas.height,
      color: EXIT_COLOR,
    })).toBe(1, 'Whole canvas should be filled with the exit color');

    // Texture sync (1/4). Run removal (2/4). Draw.
    timingFunctionsShim.runAnimationFrameCallbacks(3);
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: 0,
      y: 0,
      width: scene.canvas.width / 2,
      height: scene.canvas.height / 2,
      color: EMPTY_COLOR,
    })).toBe(1, 'Top left corner should be empty');

    // Texture sync (2/4). Run removal (3/4). Draw.
    timingFunctionsShim.runAnimationFrameCallbacks(3);
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: scene.canvas.width / 2,
      y: 0,
      width: scene.canvas.width / 2,
      height: scene.canvas.height / 2,
      color: EMPTY_COLOR,
    })).toBe(1, 'Top right corner should be empty');

    // Texture sync (3/4). Run removal (4/4). Draw.
    timingFunctionsShim.runAnimationFrameCallbacks(3);
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: 0,
      y: scene.canvas.height / 2,
      width: scene.canvas.width / 2,
      height: scene.canvas.height / 2,
      color: EMPTY_COLOR,
    })).toBe(1, 'Bottom left corner should be empty');

    // Texture sync (4/4). Draw.
    timingFunctionsShim.runAnimationFrameCallbacks(2);
    await sampler.copySnapshot();
    expect(sampler.compareSample({
      x: scene.canvas.width / 2,
      y: scene.canvas.height / 2,
      width: scene.canvas.width / 2,
      height: scene.canvas.height / 2,
      color: EMPTY_COLOR,
    })).toBe(1, 'Bottom right corner should be empty');

    // Advance time to clear Draw queue.
    timingFunctionsShim.totalElapsedTimeMs += 1;
    timingFunctionsShim.runAnimationFrameCallbacks(2);
    expect(workScheduler.queueLength).toBe(0, 'Queue empty');
  });
})
