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
 * @fileoverview Provides WorkScheduler for managing the ordering and execution
 * of expensive tasks.
 *
 * In a data visualization context, a task could be expensive for any of several
 * reasons. For one, it could be that a particular task has to iterate over
 * many data points. Simply iterating over many points may take longer than it
 * would be reasonable to complete in one pass since JavaScript is single-
 * threaded.
 *
 * Another reason is synchronizing with the GPU. Many WebGL APIs are
 * non-blocking on the UI thread, which is good for responsiveness. But if data
 * is requested from the GPU (for example by copying the data from a rendered
 * texture back into a CPU-land buffer), then that call may block on the GPU's
 * completion of some prior draw call.
 *
 * The job of the WorkScheduler is to keep track of outstanding tasks and run
 * them as opportunity warrants.
 */

import {DEFAULT_TIMING_FUNCTIONS} from './default-timing-functions';
import {InternalError} from './internal-error';
import {WorkQueue} from './work-queue';
import {ensureOrCreateWorkTask, getWorkTaskId, RemainingTimeFn, WorkTask, WorkTaskCallbackFn, WorkTaskId, WorkTaskWithId} from './work-task';

export {RemainingTimeFn} from './work-task';

/**
 * Default settings to control the WorkScheduler's behavior. These can be
 * overridden in the WorkScheduler constructor.
 */
const DEFAULT_WORK_SCHEDULER_SETTINGS = Object.freeze({
  /**
   * Timing functions.
   */
  timingFunctions: DEFAULT_TIMING_FUNCTIONS,

  /**
   * Maximum amount of time in milliseconds to perform work before ceding
   * control back to the caller.
   */
  maxWorkTimeMs: 20,
});

/**
 * The WorkScheduler class handles scheduling and working on tasks.
 *
 * Because the WorkScheduler is meant to ameliorate race conditions and other
 * timing problems, it is intolerant of calling its methods out of order, or in
 * a nested fashion. For example, calling performWork() from inside a call stack
 * that already includes a call to performWork() produces an error.
 */
export class WorkScheduler {
  /**
   * Maximum amount of time in milliseconds to perform work before ceding
   * control back to the UI thread.
   */
  maxWorkTimeMs: number;

  /**
   * Timing functions provided at construction time. Generally these will be the
   * browser default timing functions but they're optionally supplied in the
   * constructor to facilitate fine-grained unit testing.
   */
  private readonly timingFunctions: typeof DEFAULT_TIMING_FUNCTIONS;

  /**
   * Timer for the animation frame (number returned by requestAnimationFrame).
   */
  private animationFrameTimer: number|undefined;

  /**
   * Flag indicating whether the WorkScheduler is currently enabled. When it is
   * enabled, then it will be scheduling callbacks and running them. While this
   * value is initialized to false here, the WorkScheduler's enable() method is
   * called during construciton, which flips this value to true.
   */
  private isEnabled = false;

  /**
   * Flag indicating whether work is currently being performed. This is to
   * detect and prevent nested calls.
   */
  private isPerformingWork = false;

  /**
   * Queue of work tasks to complete.
   */
  private readonly presentWorkQueue = new WorkQueue();

  /**
   * Future queue of work tasks to add to the presentWorkQueue when work is not
   * actively being performed. Tasks should be added to this list ONLY when
   * isPerformingWork is true. If isPerformingWork is false, then this array
   * should be empty, and new tasks should be pushed onto the presentWorkQueue.
   */
  private readonly futureWorkQueue = new WorkQueue();

  constructor(
      options: Partial<typeof DEFAULT_WORK_SCHEDULER_SETTINGS> =
          DEFAULT_WORK_SCHEDULER_SETTINGS,
  ) {
    // Merge provided settings (if any) with defaults.
    const settings =
        Object.assign({}, DEFAULT_WORK_SCHEDULER_SETTINGS, options || {});

    // Copy timing functions.
    this.timingFunctions = Object.freeze(Object.assign(
        {}, DEFAULT_TIMING_FUNCTIONS,
        (settings && settings.timingFunctions) || {}));

    // Copy other settings.
    this.maxWorkTimeMs = settings.maxWorkTimeMs;

    // Enable the work scheduler.
    this.enable();
  }

  /**
   * Push a work task onto the work queue. The incoming object may be either a
   * full WorkTask object, or just a function. In either case, a full WorkTask
   * object with an id is returned.
   */
  scheduleTask(workTaskOrFunction: WorkTask|
               WorkTaskCallbackFn): WorkTaskWithId {
    // Construct a WorkTask out of the input.
    const workTask = ensureOrCreateWorkTask(workTaskOrFunction);

    // Check to make sure this task has not already been scheduled.
    if (!this.presentWorkQueue.hasTask(workTask) &&
        !this.futureWorkQueue.hasTask(workTask)) {
      if (this.isPerformingWork && !workTask.beginImmediately) {
        // At this point we're performing work but the task is not flagged as
        // being safe to begin immediately. So instead of modifying the
        // presentWorkQueue directly, we need to set the task aside for later
        // insertion.
        this.futureWorkQueue.enqueueTask(workTask);
      } else {
        // Since we're not performing work, push this task onto the present
        // queue.
        this.presentWorkQueue.enqueueTask(workTask);
      }
    }

    // Make sure timers are set.
    this.updateTimers();

    return workTask;
  }

  /**
   * Get the scheduled task that matches the provided workTaskOrFunction input.
   */
  getTask(workTaskOrFunction: WorkTask|WorkTaskCallbackFn): WorkTaskWithId
      |undefined {
    const id = getWorkTaskId(workTaskOrFunction);

    const presentTask = this.presentWorkQueue.getTaskById(id);
    const futureTask = this.futureWorkQueue.getTaskById(id);

    // Sanity check. It should not be possible for the same task to be in both
    // the present and future work queues.
    if (presentTask && futureTask) {
      throw new InternalError(
          'Found two matching tasks when at most one is allowed');
    }

    return presentTask || futureTask || undefined;
  }

  /**
   * Cancel any previously scheduled work task. Returns the task, or undefined
   * if no matching task was found.
   */
  unscheduleTask(workTaskOrFunction: WorkTask|
                 WorkTaskCallbackFn): WorkTaskWithId|undefined {
    const id = getWorkTaskId(workTaskOrFunction);

    const presentRemovedTask = this.presentWorkQueue.removeTaskById(id);
    const futureRemovedTask = this.futureWorkQueue.removeTaskById(id);

    // Sanity check. It should not be possible for the same task to be in both
    // the present and future work queues.
    if (presentRemovedTask && futureRemovedTask) {
      throw new InternalError(
          'Found two matching tasks when at most one is allowed');
    }

    // Make sure timers are set.
    this.updateTimers();

    return presentRemovedTask || futureRemovedTask || undefined;
  }

  /**
   * Determine whether there's at least one task already queued that matches the
   * provided work task or function.
   */
  isScheduledTask(workTaskOrFunction: WorkTask|WorkTaskCallbackFn): boolean {
    return this.isScheduledId(getWorkTaskId(workTaskOrFunction));
  }

  /**
   * Determine whether there's a task already queued with the provided Id.
   */
  isScheduledId(id: WorkTaskId): boolean {
    return this.presentWorkQueue.hasTaskId(id) ||
        this.futureWorkQueue.hasTaskId(id);
  }

  /**
   * Convenience method for unscheduling all matching tasks and then scheduling
   * the specified task.
   */
  scheduleUniqueTask(workTaskOrFunction: WorkTask|
                     WorkTaskCallbackFn): WorkTaskWithId {
    const workTask = ensureOrCreateWorkTask(workTaskOrFunction);
    this.unscheduleTask(workTask);
    this.scheduleTask(workTask);
    return workTask;
  }

  /**
   * Enable the WorkScheduler to work. Returns this object for further
   * invocations.
   */
  enable(): WorkScheduler {
    this.isEnabled = true;
    this.updateTimers();
    return this;
  }

  /**
   * Disable the WorkScheduler. Returns this object for more invocations.
   */
  disable(): WorkScheduler {
    this.isEnabled = false;
    this.updateTimers();
    return this;
  }

  /**
   * Make sure timers are set if the WorkScheduler is enabled and there is work
   * to do. If the WorkScheduler is disabled, or if there is no work, then clear
   * the timers.
   */
  private updateTimers() {
    const {
      requestAnimationFrame,
      cancelAnimationFrame,
    } = this.timingFunctions;

    // If the WorkScheduler is disabled, or there's no work left to do, then
    // remove the outstanding timers.
    if (!this.isEnabled ||
        (!this.presentWorkQueue.length && !this.futureWorkQueue.length)) {
      if (this.animationFrameTimer !== undefined) {
        cancelAnimationFrame(this.animationFrameTimer);
        this.animationFrameTimer = undefined;
      }
      return;
    }

    // Since the WorkScheduler is enabled and there's work left to do, make sure
    // the timers are set up.
    if (this.animationFrameTimer === undefined) {
      const animationFrameCallback = () => {
        if (!this.isEnabled) {
          this.animationFrameTimer = undefined;
          return;
        }
        this.animationFrameTimer =
            requestAnimationFrame(animationFrameCallback);
        this.performWork();
      };
      this.animationFrameTimer = requestAnimationFrame(animationFrameCallback);
    }
  }

  /**
   * Perform some scheduled work immediately.
   */
  private performWork() {
    if (this.isPerformingWork) {
      throw new Error(
          'Only one invocation of performWork is allowed at a time');
    }

    this.isPerformingWork = true;

    const {now} = this.timingFunctions;

    // Keep track of how many tasks have been performed.
    let tasksRan = 0;

    // For performance, the try/catch block encloses the loop that runs through
    // tasks to perform.
    try {
      const startTime = now();

      const remaining: RemainingTimeFn = () =>
          this.maxWorkTimeMs + startTime - now();

      while (this.presentWorkQueue.length) {
        // If at least one task has been dequeued, and if we've run out of
        // execution time, then break out of the loop.
        if (tasksRan > 0 && remaining() <= 0) {
          break;
        }

        const task = this.presentWorkQueue.dequeueTask();

        tasksRan++;

        const result = task.callback.call(null, remaining);

        if (!task.runUntilDone || result) {
          // Task was a simple callback function, nothing left to do.
          continue;
        }

        // Task is not finished, so keep running it until either it finishes
        // or we run out of time.
        let done = result;
        while (!done && remaining() > 0) {
          done = task.callback.call(null, remaining);
        }

        if (!done) {
          // The task did not finish! Schedule the task to continue later.
          this.futureWorkQueue.enqueueTask(task);

          // Since the task didn't finish, we must have run out of time.
          break;
        }
      }

    } finally {
      this.isPerformingWork = false;
    }

    // Take any work tasks which were set aside during work and place them
    // into the queue at their correct place.
    while (this.futureWorkQueue.length) {
      const futureTask = this.futureWorkQueue.dequeueTask();
      this.scheduleTask(futureTask);
    }
  }
}
