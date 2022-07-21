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
 * @fileoverview Tests for the TimingFunctionsShim.
 */

import {DEFAULT_TIMING_FUNCTIONS} from '../src/lib/default-timing-functions';
import {TimingFunctionsShim} from '../src/lib/timing-functions-shim';

describe('TimingFunctionsShim', () => {
  it('should exist', () => {
    expect(typeof TimingFunctionsShim).toBe('function');
  });

  it('should have methods for all timing functions', () => {
    const timingFunctionsShim =
        new TimingFunctionsShim() as {} as {[fnName: string]: Function};

    Object.keys(DEFAULT_TIMING_FUNCTIONS).forEach(fnName => {
      expect(timingFunctionsShim[fnName] instanceof Function).toBe(true);
    });
  });

  describe('requestAnimationFrame', () => {
    it('should queue and execute a single animation frame callback', () => {
      const timingFunctionsShim = new TimingFunctionsShim();
      const {requestAnimationFrame} = timingFunctionsShim;

      let counter = 0;
      const incrementCounter = () => ++counter;

      // Schedule incrementer to run on the next frame.
      requestAnimationFrame(incrementCounter);

      // Incrementer should not have been run yet.
      expect(counter).toBe(0);

      // Run animation frame callbacks.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // Incrementer should have been run once.
      expect(counter).toBe(1);

      // Run animation frame callbacks again.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // Incrementer should still have been run only once.
      expect(counter).toBe(1);
    });

    it('should invoke animation frame callback with a timestamp', () => {
      const timingFunctionsShim = new TimingFunctionsShim();
      const {requestAnimationFrame} = timingFunctionsShim;

      let savedTimestamp: number|undefined;
      function saveTimestamp(providedTimestamp: number) {
        savedTimestamp = providedTimestamp;
      }

      // Schedule incrementer to run on the next frame.
      requestAnimationFrame(saveTimestamp);

      // Timestamp saver should not have been run yet.
      expect(savedTimestamp).toBe(undefined);

      // Run animation frame callbacks.
      timingFunctionsShim.totalElapsedTimeMs = 2000;
      timingFunctionsShim.runAnimationFrameCallbacks();

      // Timestamp saver should have been run.
      expect(savedTimestamp).toBe(2000);

      // Run animation frame callbacks again.
      timingFunctionsShim.totalElapsedTimeMs = 2020;
      timingFunctionsShim.runAnimationFrameCallbacks();

      // Timestamp saver should still have been run only once.
      expect(savedTimestamp).toBe(2000);
    });

    it('should queue and execute multiple animation frame callbacks', () => {
      const timingFunctionsShim = new TimingFunctionsShim();
      const {requestAnimationFrame} = timingFunctionsShim;

      let counterA = 0;
      const incrementCounterA = () => ++counterA;

      let counterB = 0;
      const incrementCounterB = () => ++counterB;

      // Schedule incrementers to run on the next frame.
      requestAnimationFrame(incrementCounterA);
      requestAnimationFrame(incrementCounterB);

      // Incrementers should not have been run yet.
      expect(counterA).toBe(0);
      expect(counterB).toBe(0);

      // Run animation frame callbacks.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // Incrementer should have been run once.
      expect(counterA).toBe(1);
      expect(counterB).toBe(1);

      // Run animation frame callbacks again.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // Incrementers should still have been run only once.
      expect(counterA).toBe(1);
      expect(counterB).toBe(1);
    });

    it('should not cause an infinite loop when queuing on run', () => {
      const timingFunctionsShim = new TimingFunctionsShim();
      const {requestAnimationFrame} = timingFunctionsShim;

      let counter = 0;
      const incrementAndQueue = () => {
        counter++;
        requestAnimationFrame(incrementAndQueue);
      };

      requestAnimationFrame(incrementAndQueue);
      expect(counter).toBe(0);

      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toBe(1);

      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toBe(2);

      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toBe(3);
    });

    it('should fail to queue a non-function', () => {
      const {requestAnimationFrame} = new TimingFunctionsShim();

      expect(() => {
        // Call with no arguments.
        requestAnimationFrame.call(null, undefined!);
      }).toThrow();

      expect(() => {
        // Call with a null argument.
        requestAnimationFrame(null!);
      }).toThrow();

      expect(() => {
        // Call with a string argument.
        requestAnimationFrame.call(
            null, '() => {}' as unknown as FrameRequestCallback);
      }).toThrow();
    });
  });

  describe('runAnimationFrameCallbacks', () => {
    it('should advance multiple frames when frameCount is provided', () => {
      const timingFunctionsShim = new TimingFunctionsShim();
      const {requestAnimationFrame} = timingFunctionsShim;

      let counter = 0;
      const incrementAndQueue = () => {
        counter++;
        requestAnimationFrame(incrementAndQueue);
      };

      requestAnimationFrame(incrementAndQueue);
      expect(counter).toBe(0);

      timingFunctionsShim.runAnimationFrameCallbacks(100);
      expect(counter).toBe(100);
    });

    it('should throw when frameCount is invalid', () => {
      const timingFunctionsShim = new TimingFunctionsShim();
      const {requestAnimationFrame} = timingFunctionsShim;

      let counter = 0;
      const incrementAndQueue = () => {
        counter++;
        requestAnimationFrame(incrementAndQueue);
      };

      requestAnimationFrame(incrementAndQueue);
      expect(counter).toBe(0);

      expect(() => {
        timingFunctionsShim.runAnimationFrameCallbacks(0);
      }).toThrow();
      expect(() => {
        timingFunctionsShim.runAnimationFrameCallbacks(-1);
      }).toThrow();
      expect(() => {
        timingFunctionsShim.runAnimationFrameCallbacks(NaN);
      }).toThrow();
      expect(() => {
        timingFunctionsShim.runAnimationFrameCallbacks(Infinity);
      }).toThrow();

      expect(counter).toBe(0);
    });

    it('should not allow an error to prevent other callbacks', () => {
      const timingFunctionsShim = new TimingFunctionsShim();
      const {requestAnimationFrame} = timingFunctionsShim;

      const EXPECTED_ERROR = new Error('Always fails');
      const errorCallback = () => {
        throw EXPECTED_ERROR;
      };

      let counter = 0;
      const incrementCounter = () => ++counter;

      // Schedule incrementers to run on the next frame.
      requestAnimationFrame(errorCallback);
      requestAnimationFrame(incrementCounter);

      // Incrementer should not have been run yet.
      expect(counter).toBe(0);

      // Run animation frame callbacks.
      expect(() => {
        timingFunctionsShim.runAnimationFrameCallbacks();
      }).toThrow(EXPECTED_ERROR);

      // Incrementer should not have been run (blocked by error).
      expect(counter).toBe(0);

      // Run animation frame callbacks again.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // Incrementer should still have been run only once.
      expect(counter).toBe(1);
    });
  });

  describe('cancelAnimationFrame', () => {
    it('should remove an animation frame callback from the queue', () => {
      const timingFunctionsShim = new TimingFunctionsShim();
      const {requestAnimationFrame, cancelAnimationFrame} = timingFunctionsShim;

      let counterA = 0;
      const incrementCounterA = () => ++counterA;

      let counterB = 0;
      const incrementCounterB = () => ++counterB;

      const idA = requestAnimationFrame(incrementCounterA);
      requestAnimationFrame(incrementCounterB);

      // Nothing has been run yet, so counters should still be zero.
      expect(counterA).toBe(0);
      expect(counterB).toBe(0);

      // Unschedule A's incrementer.
      cancelAnimationFrame(idA);

      timingFunctionsShim.runAnimationFrameCallbacks();

      // Now B should have run, but not A since it was canceled.
      expect(counterA).toBe(0);
      expect(counterB).toBe(1);
    });
  });

  describe('setTimeout', () => {
    it('should queue and execute a single timeout callback', () => {
      const timingFunctionsShim = new TimingFunctionsShim();
      const {setTimeout} = timingFunctionsShim;

      let counter = 0;
      const incrementCounter = () => ++counter;

      // Force elapsed time to start at a known value.
      timingFunctionsShim.totalElapsedTimeMs = 1000;

      // Schedule incrementer to run in 10 milliseconds.
      setTimeout(incrementCounter, 10);

      // Incrementer should not have been run yet.
      expect(counter).toBe(0);

      // Run callbacks (note that we have not advaced the clock yet).
      timingFunctionsShim.runTimerCallbacks();

      // Incrementer should still not have been run yet.
      expect(counter).toBe(0);

      // Advance the clock 20 milliseconds.
      timingFunctionsShim.totalElapsedTimeMs += 20;

      // Even though we've advanced the clock, the counter still has not run.
      expect(counter).toBe(0);

      // Run timer callbacks.
      timingFunctionsShim.runTimerCallbacks();

      // Incrementer should now have been run once.
      expect(counter).toBe(1);

      // Run timer callbacks without having incremented the timer.
      timingFunctionsShim.runTimerCallbacks();

      // Incrementer should still have been run only once.
      expect(counter).toBe(1);

      // Advance the clock 20 milliseconds and run callbacks again.
      timingFunctionsShim.totalElapsedTimeMs += 20;
      timingFunctionsShim.runTimerCallbacks();

      // Incrementer should still have been run only once.
      expect(counter).toBe(1);
    });

    it('should preserve arguments and supply to the callback', () => {
      const timingFunctionsShim = new TimingFunctionsShim();
      const {setTimeout} = timingFunctionsShim;

      const savedArgs: Array<Array<unknown>> = [];
      function saveArgs(...args: unknown[]) {
        savedArgs.push(args);
      }

      // Force elapsed time to start at a known value.
      timingFunctionsShim.totalElapsedTimeMs = 1000;

      // Schedule arg saver to run in 10 milliseconds and provide args.
      setTimeout(saveArgs, 10, 'EXAMPLE', 'ARGS');

      // Saver should not have been run yet.
      expect(savedArgs.length).toBe(0);

      // Advance the clock 20 milliseconds and run callbacks.
      timingFunctionsShim.totalElapsedTimeMs += 20;
      timingFunctionsShim.runTimerCallbacks();

      // Saver should now have been run once.
      expect(savedArgs.length).toBe(1);
      expect(savedArgs[0].length).toBe(2);
      expect(savedArgs[0][0]).toBe('EXAMPLE');
      expect(savedArgs[0][1]).toBe('ARGS');
    });

    it('should queue and execute multiple timeout callbacks', () => {
      const timingFunctionsShim = new TimingFunctionsShim();
      const {setTimeout} = timingFunctionsShim;

      let counterA = 0;
      const incrementCounterA = () => ++counterA;

      let counterB = 0;
      const incrementCounterB = () => ++counterB;

      // Force elapsed time to start at a known value.
      timingFunctionsShim.totalElapsedTimeMs = 1000;

      // Schedule incrementers to run in 10 milliseconds.
      setTimeout(incrementCounterA, 10);
      setTimeout(incrementCounterB, 20);

      // Incrementers should not have been run yet.
      expect(counterA).toBe(0);
      expect(counterB).toBe(0);

      // Run callbacks (note that we have not advaced the clock yet).
      timingFunctionsShim.runTimerCallbacks();

      // Incrementers should still not have been run yet.
      expect(counterA).toBe(0);
      expect(counterB).toBe(0);

      // Advance the clock to match the first timeout.
      timingFunctionsShim.totalElapsedTimeMs = 1010;

      // Even though we've advanced the clock, the counters still have not run.
      expect(counterA).toBe(0);
      expect(counterB).toBe(0);

      // Run timer callbacks.
      timingFunctionsShim.runTimerCallbacks();

      // Incrementer A should now have been run once, B not yet.
      expect(counterA).toBe(1);
      expect(counterB).toBe(0);

      // Run timer callbacks without having incremented the timer.
      timingFunctionsShim.runTimerCallbacks();

      // Incrementer A should still have been run only once, B not yet.
      expect(counterA).toBe(1);
      expect(counterB).toBe(0);

      // Advance the clock and run callbacks again.
      timingFunctionsShim.totalElapsedTimeMs = 1030;
      timingFunctionsShim.runTimerCallbacks();

      // Incrementer A should still have been run only once, B now once.
      expect(counterA).toBe(1);
      expect(counterB).toBe(1);
    });

    it('should not cause an infinite loop when queuing on run', () => {
      const timingFunctionsShim = new TimingFunctionsShim();
      const {setTimeout} = timingFunctionsShim;

      let counter = 0;
      const incrementAndQueue = () => {
        counter++;
        setTimeout(incrementAndQueue, 10);
      };

      timingFunctionsShim.totalElapsedTimeMs = 1000;

      setTimeout(incrementAndQueue, 10);
      expect(counter).toBe(0);

      timingFunctionsShim.totalElapsedTimeMs = 1005;
      timingFunctionsShim.runTimerCallbacks();
      expect(counter).toBe(0);

      timingFunctionsShim.totalElapsedTimeMs = 1010;
      timingFunctionsShim.runTimerCallbacks();
      expect(counter).toBe(1);

      timingFunctionsShim.totalElapsedTimeMs = 1015;
      timingFunctionsShim.runTimerCallbacks();
      expect(counter).toBe(1);

      timingFunctionsShim.totalElapsedTimeMs = 1020;
      timingFunctionsShim.runTimerCallbacks();
      expect(counter).toBe(2);

      timingFunctionsShim.totalElapsedTimeMs = 1025;
      timingFunctionsShim.runTimerCallbacks();
      expect(counter).toBe(2);

      timingFunctionsShim.totalElapsedTimeMs = 1030;
      timingFunctionsShim.runTimerCallbacks();
      expect(counter).toBe(3);

      timingFunctionsShim.totalElapsedTimeMs = 1035;
      timingFunctionsShim.runTimerCallbacks();
      expect(counter).toBe(3);
    });
  });

  describe('runTimerCallbacks', () => {
    it('should not allow an error to prevent other callbacks', () => {
      const timingFunctionsShim = new TimingFunctionsShim();
      const {setTimeout} = timingFunctionsShim;

      const EXPECTED_ERROR = new Error('Always fails');
      const errorCallback = () => {
        throw EXPECTED_ERROR;
      };

      let counter = 0;
      const incrementCounter = () => ++counter;

      timingFunctionsShim.totalElapsedTimeMs = 1000;

      // Schedule incrementers to run on the next frame.
      setTimeout(errorCallback, 10);
      setTimeout(incrementCounter, 10);

      // Incrementer should not have been run yet.
      expect(counter).toBe(0);

      // Run timer callbacks and ensure that none have been run yet.
      timingFunctionsShim.runTimerCallbacks();
      expect(counter).toBe(0);

      // Increment clock and run again, expect failure.
      timingFunctionsShim.totalElapsedTimeMs = 1010;

      // Run timer callbacks.
      try {
        timingFunctionsShim.runTimerCallbacks();
      } catch (err) {
        expect(err).toBe(EXPECTED_ERROR);
      }

      // Incrementer should not have been run (blocked by error).
      expect(counter).toBe(0);

      // Run timer callbacks again.
      timingFunctionsShim.runTimerCallbacks();

      // Incrementer should still have been run only once.
      expect(counter).toBe(1);
    });
  });

  describe('clearTimeout', () => {
    it('should remove a timer callback from the queue', () => {
      const timingFunctionsShim = new TimingFunctionsShim();
      const {setTimeout, clearTimeout} = timingFunctionsShim;

      let counterA = 0;
      const incrementCounterA = () => ++counterA;

      let counterB = 0;
      const incrementCounterB = () => ++counterB;

      timingFunctionsShim.totalElapsedTimeMs = 1000;

      const idA = setTimeout(incrementCounterA, 10);
      setTimeout(incrementCounterB, 10);

      timingFunctionsShim.totalElapsedTimeMs = 1010;

      // Nothing has been run yet, so counters should still be zero.
      expect(counterA).toBe(0);
      expect(counterB).toBe(0);

      timingFunctionsShim.totalElapsedTimeMs = 1020;

      // Unschedule A's incrementer.
      clearTimeout(idA);

      // Nothing has been run yet, so counters should still be zero.
      expect(counterA).toBe(0);
      expect(counterB).toBe(0);

      timingFunctionsShim.runTimerCallbacks();

      // Now B should have run, but not A since it was canceled.
      expect(counterA).toBe(0);
      expect(counterB).toBe(1);
    });
  });
});
