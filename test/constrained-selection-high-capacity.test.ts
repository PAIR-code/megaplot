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
 *
 * Additionally, this test uses a high capacity Scene. This ensures that range
 * operations like Texture sync hit cases where some sprites in the range are
 * not ready for the operation and short-circuit the task.
 */

import { Scene } from '../src/lib/scene';
import { SceneInternalSymbol } from '../src/lib/symbols';
import { TimingFunctionsShim } from '../src/lib/timing-functions-shim';
import { WorkScheduler } from '../src/lib/work-scheduler';

import { Sampler } from './sampler';
import { createArticle, createSection } from './utils';

// Set constant fill color.
// NOTE: Opacity value is a floating point number in the range 0-1.
const FILL_COLOR = [0, 128, 128, 1];

// For some tests, exiting sprites will change color.
const EXIT_COLOR = [0, 0, 0, 1];

// When nothing is displayed, it's this empty color.
const EMPTY_COLOR = [0, 0, 0, 0];

// String versions of IDs used in task scheduling, for comparisons.
const BINDING_TASK_ID = 'bindingTask';
const DRAW_TASK_ID = 'drawTask';
const REBASE_TASK_ID = 'rebaseTask';
const RUN_CALLBACKS_TASK_ID = 'runCallbacksTask';
const RUN_REMOVAL_ID = 'runRemovalTaskId';
const TEXTURE_SYNC_ID = 'textureSyncTask';

/**
 * Tests produce visible artifacts for debugging.
 */
const article = createArticle();
document.body.appendChild(article);

describe('constrained selection - high capacity', () => {
  // Create a <section> for storing visible artifacts.
  const { section, content } = createSection(
    'constrained selection - high capacity'
  );
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
      antialiasingFactor: 0, // Disable antialiasing for pixel-perfect tests.
      container,
      defaultTransitionTimeMs: 0,
      desiredSpriteCapacity: 100000, // High capacity tests range operations.
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

  it('should draw and remove a grid of sprites', async () => {
    heading.textContent = 'grid of sprites';

    // Draw (initial).
    expect(workScheduler.taskIds).toEqual([DRAW_TASK_ID]);
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([]);

    // Parameters for sprites to be rendered and removed.
    const data = [
      { index: 0, label: 'Top left', x: -0.25, y: 0.25 },
      { index: 1, label: 'Top right', x: 0.25, y: 0.25 },
      { index: 2, label: 'Bottom left', x: -0.25, y: -0.25 },
      { index: 3, label: 'Bottom right', x: 0.25, y: -0.25 },
    ];

    let initRunCounts = new Array<number>(data.length).fill(0);
    let exitRunCounts = new Array<number>(data.length).fill(0);

    // Setup selection with onInit()/onExit() callbacks and bind to data.
    const selection = scene
      .createSelection<(typeof data)[number]>()
      .onInit((s, datum) => {
        if (initRunCounts[datum.index] > 0) {
          throw new Error('Init should not run more than once per datum');
        }

        s.Sides = 2;
        s.SizeWorld = 0.5;
        s.PositionWorld = datum;
        s.FillColor = FILL_COLOR;

        // Mark that the init callback has run.
        initRunCounts[datum.index]++;
      })
      .onExit((s, datum) => {
        if (exitRunCounts[datum.index] > 0) {
          throw new Error('Exit should not run more than once per datum');
        }

        s.TransitionTimeMs = 1; // Shorter transition than frame time.
        s.FillColor = EXIT_COLOR;

        // Mark that the exit callback has run.
        exitRunCounts[datum.index]++;
      })
      .bind(data);

    // Utility function to advance one frame. Returns the task ran or undefined.
    function advance() {
      const { taskIds } = workScheduler;
      if (!taskIds.length) {
        return undefined;
      }
      timingFunctionsShim.totalElapsedTimeMs += 20;
      timingFunctionsShim.runAnimationFrameCallbacks();
      return taskIds[0];
    }

    expect(advance()).toEqual(BINDING_TASK_ID, '1/4');
    expect(advance()).toEqual(RUN_CALLBACKS_TASK_ID, '1/4');
    expect(advance()).toEqual(BINDING_TASK_ID, '2/4');
    expect(advance()).toEqual(DRAW_TASK_ID);
    await sampler.copySnapshot();
    expect(
      sampler.compareSample({
        x: 0,
        y: 0,
        width: scene.canvas.width,
        height: scene.canvas.height,
        color: EMPTY_COLOR,
      })
    ).toBe(1, 'Canvas should still be empty');

    expect(advance()).toEqual(TEXTURE_SYNC_ID, '1/4');
    expect(advance()).toEqual(RUN_CALLBACKS_TASK_ID, '2/4');
    expect(advance()).toEqual(BINDING_TASK_ID, '3/4');
    expect(advance()).toEqual(DRAW_TASK_ID);
    await sampler.copySnapshot();
    expect(
      sampler.compareSample({
        x: 0,
        y: 0,
        width: scene.canvas.width / 2,
        height: scene.canvas.height / 2,
        color: FILL_COLOR,
      })
    ).toBe(1, 'Top left should be fill color');

    expect(advance()).toEqual(TEXTURE_SYNC_ID, '2/4');
    expect(advance()).toEqual(RUN_CALLBACKS_TASK_ID, '3/4');
    expect(advance()).toEqual(BINDING_TASK_ID, '4/4');
    expect(advance()).toEqual(DRAW_TASK_ID);
    await sampler.copySnapshot();
    expect(
      sampler.compareSample({
        x: scene.canvas.width / 2,
        y: 0,
        width: scene.canvas.width / 2,
        height: scene.canvas.height / 2,
        color: FILL_COLOR,
      })
    ).toBe(1, 'Top right should be fill color');

    expect(advance()).toEqual(TEXTURE_SYNC_ID, '3/4');
    expect(advance()).toEqual(RUN_CALLBACKS_TASK_ID, '4/4');
    expect(advance()).toEqual(DRAW_TASK_ID);
    await sampler.copySnapshot();
    expect(
      sampler.compareSample({
        x: 0,
        y: scene.canvas.height / 2,
        width: scene.canvas.width / 2,
        height: scene.canvas.height / 2,
        color: FILL_COLOR,
      })
    ).toBe(1, 'Bottom left should be fill color');

    expect(advance()).toEqual(TEXTURE_SYNC_ID, '4/4');
    expect(advance()).toEqual(DRAW_TASK_ID);
    await sampler.copySnapshot();
    expect(
      sampler.compareSample({
        x: scene.canvas.width / 2,
        y: scene.canvas.height / 2,
        width: scene.canvas.width / 2,
        height: scene.canvas.height / 2,
        color: FILL_COLOR,
      })
    ).toBe(1, 'Bottom right should be fill color');

    expect(workScheduler.taskIds).toEqual([]);

    // Bind empty array to cause sprites to exit.
    selection.bind([]);

    expect(advance()).toEqual(BINDING_TASK_ID, '1/4');
    expect(advance()).toEqual(RUN_CALLBACKS_TASK_ID, '1/4');
    expect(advance()).toEqual(BINDING_TASK_ID, '2/4');
    expect(advance()).toEqual(DRAW_TASK_ID); // No change (no Texture sync).

    expect(advance()).toEqual(REBASE_TASK_ID, '1/4');
    expect(advance()).toEqual(RUN_CALLBACKS_TASK_ID, '2/4');
    expect(advance()).toEqual(BINDING_TASK_ID, '3/4');
    expect(advance()).toEqual(DRAW_TASK_ID); // No change (no Texture sync).

    expect(advance()).toEqual(TEXTURE_SYNC_ID); // No-op (rebase overlap).
    expect(advance()).toEqual(REBASE_TASK_ID, '2/4');
    expect(advance()).toEqual(RUN_CALLBACKS_TASK_ID, '3/4');
    expect(advance()).toEqual(BINDING_TASK_ID, '4/4');
    expect(advance()).toEqual(DRAW_TASK_ID); // No change (Texture sync no-op).

    expect(advance()).toEqual(TEXTURE_SYNC_ID); // No-op (rebase overlap).
    expect(advance()).toEqual(REBASE_TASK_ID, '3/4');
    expect(advance()).toEqual(RUN_CALLBACKS_TASK_ID, '4/4');
    expect(advance()).toEqual(DRAW_TASK_ID); // No change (Texture sync no-op).

    expect(advance()).toEqual(TEXTURE_SYNC_ID); // No-op (rebase overlap).
    expect(advance()).toEqual(REBASE_TASK_ID, '4/4'); // Overlaps resolved!
    expect(advance()).toEqual(DRAW_TASK_ID); // No change (Texture sync no-op).

    expect(advance()).toEqual(TEXTURE_SYNC_ID); // Sync exit values.
    expect(advance()).toEqual(DRAW_TASK_ID);
    await sampler.copySnapshot();
    expect(
      sampler.compareSample({
        x: 0,
        y: 0,
        width: scene.canvas.width,
        height: scene.canvas.height,
        color: EXIT_COLOR,
      })
    ).toBe(1, 'Canvas should be filled with the exit color');

    expect(advance()).toEqual(RUN_REMOVAL_ID, '1/4');
    expect(advance()).toEqual(TEXTURE_SYNC_ID, '1/4');
    expect(advance()).toEqual(RUN_REMOVAL_ID, '2/4');
    expect(advance()).toEqual(DRAW_TASK_ID);
    await sampler.copySnapshot();
    expect(
      sampler.compareSample({
        x: 0,
        y: 0,
        width: scene.canvas.width / 2,
        height: scene.canvas.height / 2,
        color: EMPTY_COLOR,
      })
    ).toBe(1, 'Top left should be empty');

    expect(advance()).toEqual(TEXTURE_SYNC_ID, '2/4');
    expect(advance()).toEqual(RUN_REMOVAL_ID, '3/4');
    expect(advance()).toEqual(DRAW_TASK_ID);
    await sampler.copySnapshot();
    expect(
      sampler.compareSample({
        x: scene.canvas.width / 2,
        y: 0,
        width: scene.canvas.width / 2,
        height: scene.canvas.height / 2,
        color: EMPTY_COLOR,
      })
    ).toBe(1, 'Top right should be empty');

    expect(advance()).toEqual(TEXTURE_SYNC_ID, '3/4');
    expect(advance()).toEqual(RUN_REMOVAL_ID, '4/4');
    expect(advance()).toEqual(DRAW_TASK_ID);
    await sampler.copySnapshot();
    expect(
      sampler.compareSample({
        x: 0,
        y: scene.canvas.height / 2,
        width: scene.canvas.width / 2,
        height: scene.canvas.height / 2,
        color: EMPTY_COLOR,
      })
    ).toBe(1, 'Bottom left should be empty');

    expect(advance()).toEqual(TEXTURE_SYNC_ID, '4/4');
    expect(advance()).toEqual(DRAW_TASK_ID);
    await sampler.copySnapshot();
    expect(
      sampler.compareSample({
        x: scene.canvas.width / 2,
        y: scene.canvas.height / 2,
        width: scene.canvas.width / 2,
        height: scene.canvas.height / 2,
        color: EMPTY_COLOR,
      })
    ).toBe(1, 'Bottom right should be empty');

    expect(advance()).toEqual(undefined);
  });
});
