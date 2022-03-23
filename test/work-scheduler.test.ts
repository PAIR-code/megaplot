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
});
