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

import { DEFAULT_TIMING_FUNCTIONS } from '../src/lib/default-timing-functions';
import { TimingFunctionsShim } from '../src/lib/timing-functions-shim';

describe('TimingFunctionsShim', () => {
  it('should exist', () => {
    expect(typeof TimingFunctionsShim).toBe('function');
  });

  it('should have methods for all timing functions', () => {
    const timingFunctionsShim = new TimingFunctionsShim() as {} as {
      [fnName: string]: Function;
    };

    Object.keys(DEFAULT_TIMING_FUNCTIONS).forEach((fnName) => {
      expect(timingFunctionsShim[fnName] instanceof Function).toBe(true);
    });
  });

  describe('requestAnimationFrame', () => {
    it('should queue and execute a single animation frame callback', () => {
      const timingFunctionsShim = new TimingFunctionsShim();
      const { requestAnimationFrame } = timingFunctionsShim;

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
      const { requestAnimationFrame } = timingFunctionsShim;

      let savedTimestamp: number | undefined;
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
      const { requestAnimationFrame } = timingFunctionsShim;

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
      const { requestAnimationFrame } = timingFunctionsShim;

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
      const { requestAnimationFrame } = new TimingFunctionsShim();

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
          null,
          '() => {}' as unknown as FrameRequestCallback
        );
      }).toThrow();
    });
  });

  describe('runAnimationFrameCallbacks', () => {
    it('should advance multiple frames when frameCount is provided', () => {
      const timingFunctionsShim = new TimingFunctionsShim();
      const { requestAnimationFrame } = timingFunctionsShim;

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
      const { requestAnimationFrame } = timingFunctionsShim;

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
      const { requestAnimationFrame } = timingFunctionsShim;

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
      const { requestAnimationFrame, cancelAnimationFrame } =
        timingFunctionsShim;

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
});
