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
 *
 * Additionally, this test uses a high capacity Scene. This ensures that range
 * operations like Texture sync hit cases where some sprites in the range are
 * not ready for the operation and short-circuit the task.
 */

import { Scene } from '../src/lib/scene';
import { Sprite } from '../src/lib/sprite';
import { SceneInternalSymbol } from '../src/lib/symbols';
import { TimingFunctionsShim } from '../src/lib/timing-functions-shim';
import { WorkScheduler } from '../src/lib/work-scheduler';

import { Sampler } from './sampler';
import { createArticle, createSection } from './utils';

// Set constant fill color.
// NOTE: Opacity value is a floating point number in the range 0-1.
const FILL_COLOR = [255, 128, 0, 1];

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

// String versions of IDs used in task scheduling, for comparisons.
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

describe('constrained render - high capacity', () => {
  // Create a <section> for storing visible artifacts.
  const { section, content } = createSection(
    'constrained render - high capacity'
  );
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

    sampler = new Sampler(scene, content);
  });

  afterEach(() => {
    scene[SceneInternalSymbol].regl.destroy();
  });

  it('should draw and remove a grid of sprites', async () => {
    // Disable antialiasing for pixel-perfect testing.
    scene[SceneInternalSymbol].antialiasingFactor = 0;

    // Parameters for sprites to be rendered and removed.
    const params = [
      { label: 'Top left', x: -0.25, y: 0.25 },
      { label: 'Top right', x: 0.25, y: 0.25 },
      { label: 'Bottom left', x: -0.25, y: -0.25 },
      { label: 'Bottom right', x: 0.25, y: -0.25 },
    ];

    expect(workScheduler.taskIds).toEqual([DRAW_TASK_ID]);

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();

    expect(workScheduler.taskIds).toEqual([]);

    // Create and set enter callbacks for all sprites.
    const sprites: Sprite[] = new Array<Sprite>(params.length);
    const enterRunCounts = new Array<number>(params.length).fill(0);
    for (let i = 0; i < params.length; i++) {
      const sprite = (sprites[i] = scene.createSprite());
      sprite.enter((s) => {
        if (enterRunCounts[i] > 0) {
          throw new Error(`${params[i].label} enter callback has already run`);
        }
        s.Sides = 2;
        s.SizeWorld = 0.5;
        s.FillColor = FILL_COLOR;
        s.PositionWorld = params[i];
        enterRunCounts[i]++;
      });
    }

    expect(workScheduler.taskIds).toEqual([RUN_CALLBACKS_TASK_ID]);
    expect(enterRunCounts).toEqual(
      [0, 0, 0, 0],
      'No enter callbacks should have been run yet'
    );

    // Run callbacks.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      DRAW_TASK_ID,
      TEXTURE_SYNC_ID,
      RUN_CALLBACKS_TASK_ID,
    ]);
    expect(enterRunCounts).toEqual(
      [1, 0, 0, 0],
      'First enter callback should have been run'
    );

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      TEXTURE_SYNC_ID,
      RUN_CALLBACKS_TASK_ID,
      DRAW_TASK_ID,
    ]);

    // Texture sync.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      RUN_CALLBACKS_TASK_ID,
      DRAW_TASK_ID,
    ]);

    // Run callbacks.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      DRAW_TASK_ID,
      TEXTURE_SYNC_ID,
      RUN_CALLBACKS_TASK_ID,
    ]);
    expect(enterRunCounts).toEqual(
      [1, 1, 0, 0],
      'Second enter callback should have been run'
    );

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      TEXTURE_SYNC_ID,
      RUN_CALLBACKS_TASK_ID,
      DRAW_TASK_ID,
    ]);

    // Texture sync.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      RUN_CALLBACKS_TASK_ID,
      DRAW_TASK_ID,
    ]);

    // Run callbacks.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      DRAW_TASK_ID,
      TEXTURE_SYNC_ID,
      RUN_CALLBACKS_TASK_ID,
    ]);
    expect(enterRunCounts).toEqual(
      [1, 1, 1, 0],
      'Third enter callback should have been run'
    );

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      TEXTURE_SYNC_ID,
      RUN_CALLBACKS_TASK_ID,
      DRAW_TASK_ID,
    ]);

    // Texture sync.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      RUN_CALLBACKS_TASK_ID,
      DRAW_TASK_ID,
    ]);

    // Run callbacks. All callbacks have been run, so another task to run
    // callbacks will NOT be queued.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([DRAW_TASK_ID, TEXTURE_SYNC_ID]);
    expect(enterRunCounts).toEqual(
      [1, 1, 1, 1],
      'Fourth enter callback should have been run'
    );

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([TEXTURE_SYNC_ID, DRAW_TASK_ID]);

    // Texture sync.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([DRAW_TASK_ID]);

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();

    // At this point, the Scene would keep scheduling draw calls until time
    // advances. This is because the high bound of the timestamp range was
    // exactly equal to the current time.
    expect(workScheduler.taskIds).toEqual([DRAW_TASK_ID]);

    // The whole canvas should be filled with the fill color.
    await sampler.copySnapshot();
    expect(
      sampler.compareSample({
        x: 0,
        y: 0,
        width: scene.canvas.width,
        height: scene.canvas.height,
        color: FILL_COLOR,
      })
    ).toBe(1, 'Canvas should be entirely filled');

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

    expect(workScheduler.taskIds).toEqual([
      DRAW_TASK_ID,
      RUN_CALLBACKS_TASK_ID,
    ]);
    expect(exitRunCounts).toEqual(
      [0, 0, 0, 0],
      'No exit callbacks should have been run yet'
    );

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      RUN_CALLBACKS_TASK_ID,
      DRAW_TASK_ID,
    ]);

    // Run callbacks (1/4).
    timingFunctionsShim.runAnimationFrameCallbacks();
    // This queues a Rebase operation because of the positive TransitionTimeMs.
    // This queues another Run callbacks operation because there are more
    // callbacks to run.
    expect(workScheduler.taskIds).toEqual([
      DRAW_TASK_ID,
      REBASE_TASK_ID,
      RUN_CALLBACKS_TASK_ID,
    ]);
    expect(exitRunCounts).toEqual(
      [1, 0, 0, 0],
      'First exit callback should have been run'
    );

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      REBASE_TASK_ID,
      RUN_CALLBACKS_TASK_ID,
      DRAW_TASK_ID,
    ]);

    // Rebase (1/4).
    // Always queues a Texture sync.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      RUN_CALLBACKS_TASK_ID,
      DRAW_TASK_ID,
      TEXTURE_SYNC_ID,
    ]);

    // Run callbacks (2/4).
    // As with the earlier Run callbacks, this will queue a Rebase and a
    // followup Run callbacks task to pick up where it left off.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      DRAW_TASK_ID,
      TEXTURE_SYNC_ID,
      REBASE_TASK_ID,
      RUN_CALLBACKS_TASK_ID,
    ]);
    expect(exitRunCounts).toEqual(
      [1, 1, 0, 0],
      'Second exit callback should have been run'
    );

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      TEXTURE_SYNC_ID,
      REBASE_TASK_ID,
      RUN_CALLBACKS_TASK_ID,
      DRAW_TASK_ID,
    ]);

    // Texture sync.
    //
    // State of sprites by index:
    //  0 - Needs Texture sync
    //  1 - Needs Rebase
    //  2 - Has callback, waiting to run
    //  3 - Has callback, waiting to run
    //
    // Because of the high capacity, all of the sprites' swatches are in the
    // same single, 1px high row of the texture. So a Texture sync can only
    // succeed if there are no sprites in its texel sync range in need of
    // rebase. (Performing an actual texture sync when there are sprites waiting
    // on Rebase would cause necessary information to be destroyed).
    //
    timingFunctionsShim.runAnimationFrameCallbacks();
    // So for the purpose of this texst, any sprite needing rebase (index 1)
    // will cause the Texture sync task to short-circuit, queuing a Rebase and a
    // follow up Texture sync to try again. A Rebase operation was already in
    // the queue, so all that happens is another call to Texture sync is tacked
    // onto the end.
    expect(workScheduler.taskIds).toEqual([
      REBASE_TASK_ID,
      RUN_CALLBACKS_TASK_ID,
      DRAW_TASK_ID,
      TEXTURE_SYNC_ID,
    ]);

    // Rebase (2/4).
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      RUN_CALLBACKS_TASK_ID,
      DRAW_TASK_ID,
      TEXTURE_SYNC_ID,
    ]);

    // Run callbacks (3/4).
    timingFunctionsShim.runAnimationFrameCallbacks();
    // Queue a Rebase followed by another Run callbacks.
    expect(workScheduler.taskIds).toEqual([
      DRAW_TASK_ID,
      TEXTURE_SYNC_ID,
      REBASE_TASK_ID,
      RUN_CALLBACKS_TASK_ID,
    ]);
    expect(exitRunCounts).toEqual(
      [1, 1, 1, 0],
      'Third exit callback should have been run'
    );

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      TEXTURE_SYNC_ID,
      REBASE_TASK_ID,
      RUN_CALLBACKS_TASK_ID,
      DRAW_TASK_ID,
    ]);

    // Texture sync.
    //
    // State of sprites by index:
    //  0 - Needs Texture sync
    //  1 - Needs Texture sync
    //  2 - Needs Rebase
    //  3 - Has callback, waiting to run
    timingFunctionsShim.runAnimationFrameCallbacks();
    // As with the previous attempt to Texture sync, the presence of a sprite
    // needing rebase causes this to queue a Rebase operation and a follow-up
    // Texture sync to try again.
    expect(workScheduler.taskIds).toEqual([
      REBASE_TASK_ID,
      RUN_CALLBACKS_TASK_ID,
      DRAW_TASK_ID,
      TEXTURE_SYNC_ID,
    ]);

    // Rebase (3/4).
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      RUN_CALLBACKS_TASK_ID,
      DRAW_TASK_ID,
      TEXTURE_SYNC_ID,
    ]);

    // Run callbacks (4/4).
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      DRAW_TASK_ID,
      TEXTURE_SYNC_ID,
      REBASE_TASK_ID,
    ]);
    expect(exitRunCounts).toEqual(
      [1, 1, 1, 1],
      'Fourth exit callback should have been run'
    );

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      TEXTURE_SYNC_ID,
      REBASE_TASK_ID,
      DRAW_TASK_ID,
    ]);

    // Texture sync.
    //
    // State of sprites by index:
    //  0 - Needs Texture sync
    //  1 - Needs Texture sync
    //  2 - Needs Texture sync
    //  3 - Needs Rebase
    timingFunctionsShim.runAnimationFrameCallbacks();
    // Short circuit, queuing Rebase and a follow-up Texture sync.
    expect(workScheduler.taskIds).toEqual([
      REBASE_TASK_ID,
      DRAW_TASK_ID,
      TEXTURE_SYNC_ID,
    ]);

    // Rebase.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([DRAW_TASK_ID, TEXTURE_SYNC_ID]);

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([TEXTURE_SYNC_ID, DRAW_TASK_ID]);

    // Texture sync.
    //
    // State of sprites by index:
    //  0 - Needs Texture sync
    //  1 - Needs Texture sync
    //  2 - Needs Texture sync
    //  3 - Needs Texture sync
    //
    // Finally, all sprites are ready for Texture sync. There's nothing to stop
    // the operation from proceeding.
    timingFunctionsShim.runAnimationFrameCallbacks();
    // Since the sprites were marked for removal, the Texture sync tasks queues
    // a Run removal task. The Texture sync also queued a draw call, but one is
    // already in the queue.
    expect(workScheduler.taskIds).toEqual([DRAW_TASK_ID, RUN_REMOVAL_ID]);

    // Draw.
    // All four sprites have had their exit callbacks invoked, and those
    // values have been flashed to the data texture.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([RUN_REMOVAL_ID, DRAW_TASK_ID]);

    // However, since time has not advanced, the canvas still looks the same as
    // last time, filled with the fill color.
    await sampler.copySnapshot();
    expect(
      sampler.compareSample({
        x: 0,
        y: 0,
        width: scene.canvas.width,
        height: scene.canvas.height,
        color: FILL_COLOR,
      })
    ).toBe(1, 'Canvas should be entirely filled');

    // Run removal.
    // Visits each sprite, but does not flash zeros because none of their
    // transition times have arrived.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([DRAW_TASK_ID, RUN_REMOVAL_ID]);

    // Advance time half way to transition finish time.
    timingFunctionsShim.totalElapsedTimeMs += 5;

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([RUN_REMOVAL_ID, DRAW_TASK_ID]);

    // Now that time has advanced, all four sprites, and thus the whole canvas,
    // should be halfway transitioned to the exit color.
    await sampler.copySnapshot();
    expect(
      sampler.compareSample({
        x: 0,
        y: 0,
        width: scene.canvas.width,
        height: scene.canvas.height,
        color: MIDPOINT_COLOR,
      })
    ).toBe(1, 'Canvas should be halfway between fill and exit colors');

    // Advance time to transition finish time.
    timingFunctionsShim.totalElapsedTimeMs += 5;

    // Run removal (1/4).
    timingFunctionsShim.runAnimationFrameCallbacks();
    // Succeeds in flashing zeros to first sprite's attributes, so queues
    // Texture sync. Also queues a follow-up Run removal task to pick up where
    // it left off.
    expect(workScheduler.taskIds).toEqual([
      DRAW_TASK_ID,
      TEXTURE_SYNC_ID,
      RUN_REMOVAL_ID,
    ]);

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      TEXTURE_SYNC_ID,
      RUN_REMOVAL_ID,
      DRAW_TASK_ID,
    ]);

    // Now that time has advanced to the finish time, all four sprites, and thus
    // the whole canvas, should be halfway transitioned to the exit color.
    await sampler.copySnapshot();
    expect(
      sampler.compareSample({
        x: 0,
        y: 0,
        width: scene.canvas.width,
        height: scene.canvas.height,
        color: EXIT_COLOR,
      })
    ).toBe(1, 'Canvas should be filled with exit color');

    // Texture sync (1/4).
    timingFunctionsShim.runAnimationFrameCallbacks();
    // Zeros have been flashed to the first sprite's texture swatch, making it a
    // degenerate point for the next draw call.
    expect(workScheduler.taskIds).toEqual([RUN_REMOVAL_ID, DRAW_TASK_ID]);

    // Run removal (2/4).
    timingFunctionsShim.runAnimationFrameCallbacks();
    // Succeeds in flashing zeros to second sprite's attributes, queues Texture
    // sync. Queues a follow-up Run removal.
    expect(workScheduler.taskIds).toEqual([
      DRAW_TASK_ID,
      TEXTURE_SYNC_ID,
      RUN_REMOVAL_ID,
    ]);

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      TEXTURE_SYNC_ID,
      RUN_REMOVAL_ID,
      DRAW_TASK_ID,
    ]);

    await sampler.copySnapshot();
    expect(
      sampler.compareSample({
        x: 0,
        y: 0,
        width: scene.canvas.width / 2,
        height: scene.canvas.height / 2,
        color: EMPTY_COLOR,
      })
    ).toBe(1, 'Top left patch of canvas should be empty');

    // Texture sync (2/4).
    timingFunctionsShim.runAnimationFrameCallbacks();
    // Zeros flashed to the second sprite's texture swatch.
    expect(workScheduler.taskIds).toEqual([RUN_REMOVAL_ID, DRAW_TASK_ID]);

    // Run removal (3/4).
    timingFunctionsShim.runAnimationFrameCallbacks();
    // Third sprite's attributes set to zero. Queues Texture sync and Run
    // removal.
    expect(workScheduler.taskIds).toEqual([
      DRAW_TASK_ID,
      TEXTURE_SYNC_ID,
      RUN_REMOVAL_ID,
    ]);

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([
      TEXTURE_SYNC_ID,
      RUN_REMOVAL_ID,
      DRAW_TASK_ID,
    ]);

    await sampler.copySnapshot();
    expect(
      sampler.compareSample({
        x: scene.canvas.width / 2,
        y: 0,
        width: scene.canvas.width / 2,
        height: scene.canvas.height / 2,
        color: EMPTY_COLOR,
      })
    ).toBe(1, 'Top right patch of canvas should be empty');

    // Texture sync (3/4).
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([RUN_REMOVAL_ID, DRAW_TASK_ID]);

    // Run removal (4/4).
    timingFunctionsShim.runAnimationFrameCallbacks();
    // Queues Texture sync, but no Run removal since all four sprites have been
    // accounted for.
    expect(workScheduler.taskIds).toEqual([DRAW_TASK_ID, TEXTURE_SYNC_ID]);

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([TEXTURE_SYNC_ID, DRAW_TASK_ID]);

    await sampler.copySnapshot();
    expect(
      sampler.compareSample({
        x: 0,
        y: scene.canvas.height / 2,
        width: scene.canvas.width / 2,
        height: scene.canvas.height / 2,
        color: EMPTY_COLOR,
      })
    ).toBe(1, 'Bottom left patch of canvas should be empty');

    // Texture sync (4/4).
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([DRAW_TASK_ID]);

    // Draw.
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([DRAW_TASK_ID]);

    await sampler.copySnapshot();
    expect(
      sampler.compareSample({
        x: scene.canvas.width / 2,
        y: scene.canvas.height / 2,
        width: scene.canvas.width / 2,
        height: scene.canvas.height / 2,
        color: EMPTY_COLOR,
      })
    ).toBe(1, 'Bottom right patch of canvas should be empty');

    // Advance time to clear Draw queue.
    timingFunctionsShim.totalElapsedTimeMs += 1;
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([DRAW_TASK_ID]);
    timingFunctionsShim.runAnimationFrameCallbacks();
    expect(workScheduler.taskIds).toEqual([]);
  });
});
