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
 * @fileoverview Tests for the WorkScheduler. Most tests use the
 * TimingFunctionsShim to emulate time passing synchronously. As a sanity check,
 * a few simple tests use native animation frames and timeouts. These later
 * tests require a live, visible, focused browser window or they'll time out
 * since animation frames do not run in a backgrounded browser.
 */

import {DEFAULT_TIMING_FUNCTIONS} from '../src/lib/default-timing-functions';
import {TimingFunctionsShim} from '../src/lib/timing-functions-shim';
import {RemainingTimeFn, WorkScheduler} from '../src/lib/work-scheduler';

describe('WorkScheduler', () => {
  it('should exist', () => {
    expect(typeof WorkScheduler).toBe('function');
  });

  it('should allow setting a custom timing functions object', () => {
    const timingFunctionsShim = new TimingFunctionsShim();
    const workScheduler = new WorkScheduler({
      timingFunctions: timingFunctionsShim as {} as
          typeof DEFAULT_TIMING_FUNCTIONS
    });

    expect(typeof workScheduler).toBe('object');
  });

  describe('scheduleTask', () => {
    describe('callback function', () => {
      it('should allow scheduling a regular callback function', () => {
        const timingFunctionsShim = new TimingFunctionsShim();

        timingFunctionsShim.totalElapsedTimeMs = 1000;

        const workScheduler = new WorkScheduler({
          timingFunctions: timingFunctionsShim as {} as
              typeof DEFAULT_TIMING_FUNCTIONS,
          maxWorkTimeMs: 10,
        });

        // Define a callback that counts its invocations.
        let counter = 0;
        const incrementCounter = () => ++counter;

        // By scheduling the raw function, this is presumed to run on animation
        // frames only.
        const workTask = workScheduler.scheduleTask(incrementCounter);
        expect(workTask.callback).toBe(incrementCounter);
        expect(workTask.id).toBe(incrementCounter);

        // Nothing has been run yet, so we expect the counter to be zero.
        expect(workScheduler.isScheduledTask(incrementCounter)).toBe(true);
        expect(counter).toBe(0);

        // Advance by one frame. Callback should have been invoked.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(workScheduler.isScheduledTask(incrementCounter)).toBe(false);
        expect(counter).toBe(1);

        // Since the incrementer has finished, running animation frame callbacks
        // should have no effect on the counter.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(counter).toBe(1);
      });

      it('should invoke callback with remaining time function', () => {
        const timingFunctionsShim = new TimingFunctionsShim();

        timingFunctionsShim.totalElapsedTimeMs = 1000;

        const workScheduler = new WorkScheduler({
          timingFunctions: timingFunctionsShim as {} as
              typeof DEFAULT_TIMING_FUNCTIONS,
          maxWorkTimeMs: 10,
        });

        // Define a counter function which also performs tests on the remaining
        // time function argument.
        let counter = 0;
        const incrementCounter = (remaining: RemainingTimeFn) => {
          expect(remaining).toBeInstanceOf(Function);

          // Since no time has elapsed, all time should be remaining.
          expect(remaining()).toBe(10);  // maxWorkTimeMs.

          // Synthesize time passing.
          timingFunctionsShim.totalElapsedTimeMs += 20;

          // Now time remaining should be negative since we've used it all.
          expect(remaining()).toBe(-10);

          ++counter
        };

        // By scheduling the raw function, this is presumed to run on animation
        // frames only.
        workScheduler.scheduleTask(incrementCounter);
        expect(counter).toBe(0);

        // Advance by one frame. Callback should have been invoked.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(counter).toBe(1);
      });

      it('should continue running until done if requested (fast)', () => {
        const timingFunctionsShim = new TimingFunctionsShim();

        timingFunctionsShim.totalElapsedTimeMs = 1000;

        const workScheduler = new WorkScheduler({
          timingFunctions: timingFunctionsShim as {} as
              typeof DEFAULT_TIMING_FUNCTIONS,
          maxWorkTimeMs: 10,
        });

        // Define a function which takes three iterations to finish.
        let counter = 0;
        const incrementCounter = () => {
          if (counter >= 7) {
            throw new Error('incrementCounter called too many times');
          }
          ++counter;
          return counter >= 7;
        };

        // By scheduling the raw function, this is presumed to run on animation
        // frames only.
        const workTask = workScheduler.scheduleTask({
          callback: incrementCounter,
          runUntilDone: true,
        });
        expect(workTask.callback).toBe(incrementCounter);
        expect(workTask.id).toBe(incrementCounter);
        expect(workTask.runUntilDone).toBe(true);

        // Nothing has been run yet, so we expect the counter to be zero.
        expect(workScheduler.isScheduledTask(incrementCounter)).toBe(true);
        expect(counter).toBe(0);

        // Advance by one frame. Callback should have been run all 7 times.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(workScheduler.isScheduledTask(incrementCounter)).toBe(false);
        expect(counter).toBe(7);

        // Since the incrementer has finished, running animation frame callbacks
        // should have no effect on the counter.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(counter).toBe(7);
      });

      it('should continue running until done if requested (slow)', () => {
        const timingFunctionsShim = new TimingFunctionsShim();

        timingFunctionsShim.totalElapsedTimeMs = 1000;

        const workScheduler = new WorkScheduler({
          timingFunctions: timingFunctionsShim as {} as
              typeof DEFAULT_TIMING_FUNCTIONS,
          maxWorkTimeMs: 10,
        });

        // Define a function which takes three iterations to finish.
        let counter = 0;
        const incrementCounter = () => {
          if (counter >= 3) {
            throw new Error('incrementCounter called too many times');
          }
          // Simulate taking full allotment of time to complete.
          timingFunctionsShim.totalElapsedTimeMs += workScheduler.maxWorkTimeMs;
          ++counter;
          return counter >= 3;
        };

        // By scheduling the raw function, this is presumed to run on animation
        // frames only.
        const workTask = workScheduler.scheduleTask({
          callback: incrementCounter,
          runUntilDone: true,
        });
        expect(workTask.callback).toBe(incrementCounter);
        expect(workTask.id).toBe(incrementCounter);
        expect(workTask.runUntilDone).toBe(true);

        // Nothing has been run yet, so we expect the counter to be zero.
        expect(workScheduler.isScheduledTask(incrementCounter)).toBe(true);
        expect(counter).toBe(0);

        // Advance by one frame. Callback should have been invoked once.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(workScheduler.isScheduledTask(incrementCounter)).toBe(true);
        expect(counter).toBe(1);

        // Advance by one frame. Callback should have been invoked twice.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(workScheduler.isScheduledTask(incrementCounter)).toBe(true);
        expect(counter).toBe(2);

        // Advance by one frame. Callback should have been invoked three times.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(workScheduler.isScheduledTask(incrementCounter)).toBe(false);
        expect(counter).toBe(3);

        // Since the incrementer has finished, running animation frame callbacks
        // should have no effect on the counter.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(counter).toBe(3);
      });

      it('should run callbacks using native animation frames', async () => {
        // NOTE: Native animation frames only run when the browser window is
        // visible. As a result, this test may be flaky if the captured browser
        // thinks that it is not visible.
        const workScheduler = new WorkScheduler({maxWorkTimeMs: 10});

        // Define a generator which takes 100 iterations to complete, and yields
        // a value after one ms each pass.
        let counter = 0;
        const incrementCounter = () => ++counter;

        // By scheduling the raw function, this is presumed to run on animation
        // frames only.
        const workTask = workScheduler.scheduleTask(incrementCounter);
        expect(workTask.callback).toBe(incrementCounter);
        expect(workTask.id).toBe(incrementCounter);

        // Nothing has been run yet, so we expect the counter to be zero.
        expect(counter).toBe(0);

        // Advance by one frame. Callback should have been invoked.
        await new Promise(resolve => window.requestAnimationFrame(resolve));
        expect(counter).toBe(1);

        // Since the incrementer has finished, additional passing animation
        // frames should not cause the incrementer to run.
        await new Promise(resolve => window.requestAnimationFrame(resolve));
        expect(counter).toBe(1);
      });

      it('should allow scheduling multiple callback functions', () => {
        const timingFunctionsShim = new TimingFunctionsShim();

        timingFunctionsShim.totalElapsedTimeMs = 1000;

        const workScheduler = new WorkScheduler({
          timingFunctions: timingFunctionsShim as {} as
              typeof DEFAULT_TIMING_FUNCTIONS,
          maxWorkTimeMs: 10,
        });

        // Define simple counting callback functons.
        let counterA = 0;
        const incrementCounterA = () => ++counterA;
        let counterB = 0;
        const incrementCounterB = () => ++counterB;

        // By scheduling the raw function, this is presumed to run on animation
        // frames only.
        workScheduler.scheduleTask(incrementCounterA);
        workScheduler.scheduleTask(incrementCounterB);

        // Nothing has been run yet, so we expect the counters to be zero.
        expect(counterA).toBe(0);
        expect(counterB).toBe(0);

        // Advance by one frame. Callbacks should have been invoked.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(counterA).toBe(1);
        expect(counterB).toBe(1);

        // Since the incrementer has finished, running animation frame callbacks
        // should have no effect on the counter.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(counterA).toBe(1);
        expect(counterB).toBe(1);
      });

      it('should run animationOnly=false tasks on timeout', () => {
        const timingFunctionsShim = new TimingFunctionsShim();

        timingFunctionsShim.totalElapsedTimeMs = 1000;

        const workScheduler = new WorkScheduler({
          timingFunctions: timingFunctionsShim as {} as
              typeof DEFAULT_TIMING_FUNCTIONS,
          maxWorkTimeMs: 10,
        });

        // Define simple counting callback functons.
        let counter = 0;
        const incrementCounter = () => ++counter;

        // By specifying a WorkTask object with animationOnly set to false, we
        // expect this to run when timeouts execute, not just on animation
        // frames..
        workScheduler.scheduleTask({
          callback: incrementCounter,
          animationOnly: false,
        });

        // Nothing has been run yet, so we expect the counter to be zero.
        expect(counter).toBe(0);

        // Run the timeouts. Callback should be invoked.
        timingFunctionsShim.runTimerCallbacks();
        expect(counter).toBe(1);

        // Since the incrementer has finished, running timer callbacks again
        // should have no effect on the counter.
        timingFunctionsShim.runTimerCallbacks();
        expect(counter).toBe(1);
      });

      it('should run callbacks using native timeouts', async () => {
        const workScheduler = new WorkScheduler({maxWorkTimeMs: 10});

        // Define a generator which takes 100 iterations to complete, and yields
        // a value after one ms each pass.
        let counter = 0;
        const incrementCounter = () => ++counter;

        // By scheduling a WorkTask with animationOnly set to false, we expect
        // this to run on timeouts, not just animation frames.
        workScheduler.scheduleTask({
          callback: incrementCounter,
          animationOnly: false,
        });

        // Nothing has been run yet, so we expect the counter to be zero.
        expect(counter).toBe(0);

        // Advance by 10ms. Callback should have been invoked.
        await new Promise(resolve => window.setTimeout(resolve, 10));
        expect(counter).toBe(1);

        // Since the incrementer has finished, additional passing time should
        // not cause the incrementer to run.
        await new Promise(resolve => window.setTimeout(resolve, 10));
        expect(counter).toBe(1);
      });

      it('should preserve other callbacks even if one throws', () => {
        const timingFunctionsShim = new TimingFunctionsShim();

        timingFunctionsShim.totalElapsedTimeMs = 1000;

        const workScheduler = new WorkScheduler({
          timingFunctions: timingFunctionsShim as {} as
              typeof DEFAULT_TIMING_FUNCTIONS,
          maxWorkTimeMs: 10,
        });

        // Define simple counting callback functons.
        let counterA = 0;
        const incrementCounterA = () => ++counterA;
        let counterB = 0;
        const incrementCounterB = () => ++counterB;

        const ALWAYS_ERROR = new Error('Always throws');
        const alwaysThrows = () => {
          throw ALWAYS_ERROR;
        };

        // By scheduling the raw functions, these is presumed to run on
        // animation frames only.
        workScheduler.scheduleTask(incrementCounterA);
        workScheduler.scheduleTask(alwaysThrows);
        workScheduler.scheduleTask(incrementCounterB);

        // Nothing has been run yet, so we expect the counters to be zero.
        expect(counterA).toBe(0);
        expect(counterB).toBe(0);

        // Advance by one frame. Callback A should have been invoked, but not
        // callback B.
        expect(() => {
          timingFunctionsShim.runAnimationFrameCallbacks();
        }).toThrow(ALWAYS_ERROR);
        expect(counterA).toBe(1);
        expect(counterB).toBe(0);

        // Advance by one frame. Callback B should now have been invoked.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(counterA).toBe(1);
        expect(counterB).toBe(1);

        // Since the incrementer has finished, running animation frame callbacks
        // should have no effect on the counter.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(counterA).toBe(1);
        expect(counterB).toBe(1);
      });
    });

    describe('async function', () => {
      it('should allow scheduling an async callback function', () => {
        const timingFunctionsShim = new TimingFunctionsShim();

        timingFunctionsShim.totalElapsedTimeMs = 1000;

        const workScheduler = new WorkScheduler({
          timingFunctions: timingFunctionsShim as {} as
              typeof DEFAULT_TIMING_FUNCTIONS,
          maxWorkTimeMs: 10,
        });

        // Define a generator which takes 100 iterations to complete, and yields
        // a value after one ms each pass.
        let counter = 0;
        const incrementCounter = async () => ++counter;

        // By scheduling the raw async function, this is presumed to run on
        // animation frames only.
        workScheduler.scheduleTask(incrementCounter);

        // Nothing has been run yet, so we expect the counter to be zero.
        expect(counter).toBe(0);

        // Advance by one frame. Callback should have been invoked.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(counter).toBe(1);

        // Since the incrementer has finished, running animation frame callbacks
        // should have no effect on the counter.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(counter).toBe(1);
      });
    });

    describe('generator', () => {
      it('should allow scheduling a generator', () => {
        const timingFunctionsShim = new TimingFunctionsShim();

        timingFunctionsShim.totalElapsedTimeMs = 1000;

        const workScheduler = new WorkScheduler({
          timingFunctions: timingFunctionsShim as {} as
              typeof DEFAULT_TIMING_FUNCTIONS,
          maxWorkTimeMs: 10,
        });

        // Define a generator which takes 100 iterations to complete, and yields
        // a value after one ms each pass.
        let counter = 0;
        function* generate() {
          // Explicitly reset the counter.
          counter = 0;

          while (counter < 100) {
            timingFunctionsShim.totalElapsedTimeMs += 1;
            counter++;
            yield(counter / 100);  // Yields 0.01, 0.02, ... 1.0.
          }

          return 1;
        }

        // By scheduling the raw function, this is presumed to run on animation
        // frames only.
        const workTask = workScheduler.scheduleTask(generate);
        expect(workTask.callback).toBe(generate);
        expect(workTask.id).toBe(generate);
        expect(workTask.iterator).not.toBeDefined();

        // Nothing has been run yet, so we expect the counter to be zero.
        expect(counter).toBe(0);

        // Advance by one frame. Should work on generator up to 10 ms.
        // 10 ms should have elapsed.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(timingFunctionsShim.totalElapsedTimeMs).toBe(1010);
        expect(counter).toBe(10);

        // Find the matching work task. It should now be a different object,
        // with an iterator.
        const iteratorWorkTask = workScheduler.getTask(generate)!;
        expect(iteratorWorkTask).not.toBe(workTask);
        expect(iteratorWorkTask.iterator).toBeDefined();

        // Run timeout callbacks. Since the generator was scheduled without
        // explicitly setting animationOnly to be false, it should not run.
        timingFunctionsShim.runTimerCallbacks();
        expect(timingFunctionsShim.totalElapsedTimeMs).toBe(1010);
        expect(counter).toBe(10);

        // Advance by one frame. Should work on generator for another 10 ms.
        // 20 ms should have elapsed.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(timingFunctionsShim.totalElapsedTimeMs).toBe(1020);
        expect(counter).toBe(20);

        // Advance by enough frames to finish the task (eight more frames).
        for (let i = 0; i < 8; i++) {
          timingFunctionsShim.runAnimationFrameCallbacks();
        }

        // 100 ms should have elapsed.
        expect(timingFunctionsShim.totalElapsedTimeMs).toBe(1100);
        expect(counter).toBe(100);

        // Since the generator finished, running frames any more should have no
        // effect on the counter or the elapsed time.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(timingFunctionsShim.totalElapsedTimeMs).toBe(1100);
        expect(counter).toBe(100);
      });

      it('should allow scheduling multiple generators', () => {
        const timingFunctionsShim = new TimingFunctionsShim();

        timingFunctionsShim.totalElapsedTimeMs = 1000;

        const workScheduler = new WorkScheduler({
          timingFunctions: timingFunctionsShim as {} as
              typeof DEFAULT_TIMING_FUNCTIONS,
          maxWorkTimeMs: 10,
        });

        // Define generators which takes 100 iterations to complete, and yield
        // a value after one ms each pass.
        let counterA = 0;
        function* generateA() {
          counterA = 0;
          while (counterA < 100) {
            timingFunctionsShim.totalElapsedTimeMs += 1;
            counterA++;
            yield(counterA / 100);
          }
          return 1;
        }

        let counterB = 0;
        function* generateB() {
          counterB = 0;
          while (counterB < 100) {
            timingFunctionsShim.totalElapsedTimeMs += 1;
            counterB++;
            yield(counterB / 100);
          }
          return 1;
        }

        // By scheduling the raw functions, these are presumed to run on
        // animation frames only.
        workScheduler.scheduleTask(generateA);
        workScheduler.scheduleTask(generateB);

        // Nothing has been run yet, so we expect the counters to be zero.
        expect(counterA).toBe(0);
        expect(counterB).toBe(0);

        // Advance by one frame. Should work on generator A up to 10 ms.
        // 10 ms should have elapsed. Counter B should still be at zero.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(timingFunctionsShim.totalElapsedTimeMs).toBe(1010);
        expect(counterA).toBe(10);
        expect(counterB).toBe(0);

        // Run timeout callbacks. Since the generators were scheduled without
        // explicitly setting animationOnly to be false, they should not run.
        timingFunctionsShim.runTimerCallbacks();
        expect(timingFunctionsShim.totalElapsedTimeMs).toBe(1010);
        expect(counterA).toBe(10);
        expect(counterB).toBe(0);

        // Advance by one frame. Should work on generator B for 10 ms.
        // 20 ms should have elapsed. Counter A should be unchanged.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(timingFunctionsShim.totalElapsedTimeMs).toBe(1020);
        expect(counterA).toBe(10);
        expect(counterB).toBe(10);

        // Advance by enough frames to finish both tasks (18 more frames).
        for (let i = 0; i < 18; i++) {
          timingFunctionsShim.runAnimationFrameCallbacks();
        }

        // 200 ms should have elapsed. Both counters should have accumulated
        // 100 ticks each.
        expect(timingFunctionsShim.totalElapsedTimeMs).toBe(1200);
        expect(counterA).toBe(100);
        expect(counterB).toBe(100);

        // Since both generator finished, running frames any more should have no
        // effect on the counter or the elapsed time.
        timingFunctionsShim.runAnimationFrameCallbacks();
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(timingFunctionsShim.totalElapsedTimeMs).toBe(1200);
        expect(counterA).toBe(100);
        expect(counterB).toBe(100);
      });
    });
  });

  describe('enable/disable', () => {
    describe('generator', () => {
      it('disabling should suspend scheduled generators', () => {
        const timingFunctionsShim = new TimingFunctionsShim();

        timingFunctionsShim.totalElapsedTimeMs = 1000;

        const workScheduler = new WorkScheduler({
          timingFunctions: timingFunctionsShim as {} as
              typeof DEFAULT_TIMING_FUNCTIONS,
          maxWorkTimeMs: 10,
        });

        // Define a generator which takes 100 iterations to complete, and yields
        // a value after one ms each pass.
        let counter = 0;
        function* generate() {
          // Explicitly reset the counter.
          counter = 0;

          while (counter < 100) {
            timingFunctionsShim.totalElapsedTimeMs += 1;
            counter++;
            yield(counter / 100);  // Yields 0.01, 0.02, ... 1.0.
          }

          return 1;
        }

        // By scheduling the raw function, this is presumed to run on animation
        // frames only.
        workScheduler.scheduleTask(generate);

        // Nothing has been run yet, so we expect the counter to be zero.
        expect(counter).toBe(0);

        // Preemptively disable the WorkScheduler.
        workScheduler.disable();

        // Advance by one frame. Since the WorkScheduler is disabled, no work
        // should have been done on the generator.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(timingFunctionsShim.totalElapsedTimeMs).toBe(1000);
        expect(counter).toBe(0);

        // Re-enable the WorkScheduler.
        workScheduler.enable();

        // Advance by one frame. Now should work on generator up to 10 ms.
        // 10 ms should have elapsed.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(timingFunctionsShim.totalElapsedTimeMs).toBe(1010);
        expect(counter).toBe(10);

        // Disable the WorkScheduler again.
        workScheduler.disable();

        // Advance by one frame. Since the WorkScheduler is disabled, no work
        // should have been done on the generator.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(timingFunctionsShim.totalElapsedTimeMs).toBe(1010);
        expect(counter).toBe(10);

        // Re-enable the WorkScheduler.
        workScheduler.enable();

        // Advance by one frame. Now should work on generator should resume and
        // progress 10 ms. 20 ms total should have elapsed.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(timingFunctionsShim.totalElapsedTimeMs).toBe(1020);
        expect(counter).toBe(20);
      });
    });
  });

  describe('unscheduleTask', () => {
    describe('callback function', () => {
      it('should allow unscheduling a regular callback function', () => {
        const timingFunctionsShim = new TimingFunctionsShim();

        timingFunctionsShim.totalElapsedTimeMs = 1000;

        const workScheduler = new WorkScheduler({
          timingFunctions: timingFunctionsShim as {} as
              typeof DEFAULT_TIMING_FUNCTIONS,
          maxWorkTimeMs: 10,
        });

        // Define a generator which takes 100 iterations to complete, and yields
        // a value after one ms each pass.
        let counter = 0;
        const incrementCounter = () => ++counter;

        // By scheduling the raw function, this is presumed to run on animation
        // frames only.
        const workTask = workScheduler.scheduleTask(incrementCounter);

        // Nothing has been run yet, so we expect the counter to be zero.
        expect(workScheduler.isScheduledTask(incrementCounter)).toBe(true);
        expect(workScheduler.isScheduledTask(workTask)).toBe(true);
        expect(counter).toBe(0);

        // Unschedule the scheduled task.
        workScheduler.unscheduleTask(incrementCounter);

        // Assert that the task has been unscheduled and not run.
        expect(workScheduler.isScheduledTask(incrementCounter)).toBe(false);
        expect(workScheduler.isScheduledTask(workTask)).toBe(false);
        expect(counter).toBe(0);

        // Advance by one frame. Callback should have not been invoked.
        timingFunctionsShim.runAnimationFrameCallbacks();
        expect(counter).toBe(0);
      });
    });
  });

  // TODO(jimbo): Add test for unscheduling a doubly-scheduled task run once.
  // By unsetting the id in the queue's idSet on dequeue during performWork, it
  // may be possible to enter a condition where a task is in the queue but its
  // id is no longer in the idSet.
});
