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
 * @fileoverview The WorkScheduler operates on WorkTasks, which are callback
 * functions plus additional identifing and state information.
 */

/**
 * When running a task, the WorkScheduler will provide a function with the
 * following signature that the task function can call to estimate how much work
 * time remains. This allows the called task function to hold the execution
 * thread without bouncing back to the WorkScheduler.
 */
export type RemainingTimeFn = () => number;

export type WorkTaskId = unknown;

/**
 * A work task callback function takes a remaining time function as a parameter.
 * Simple work tasks may ignore this parameter, but it's always provided.
 */
export type WorkTaskCallbackFn = (remainingFn: RemainingTimeFn) => unknown;

/**
 * Characteristics of work tasks:
 *  - May be long running. If so, then it should make use of the RemaitingTimeFn
 *    to yield control when its time is up.
 *  - May be frame or time iterable. Some tasks only make sense if the screen is
 *    visible to the user. These tasks are runnable on an animation frame only.
 *    Other tasks may be runnable when the screen is not visible. These tasks
 *    may run on an animation frame or on a timeout.
 *  - Cancellable. It should be possible to cancel a task.
 *  - Identifiable. It should be easy to identify a previously scheduled task by
 *    a supplied id (string or Symbol).
 *  - Replaceable. It should be possible to replace a task with another task.
 *    When replacing a task, the replaced task should be revoked.
 *  - Some tasks may be able to be started right away. Others may need to wait
 *    begin.
 */
export interface WorkTask {
  /**
   * The callback to invoke to make progress on this task. (Required)
   */
  callback: WorkTaskCallbackFn;

  /**
   * Unique identifier for this task. When a new task is added, if there is
   * already a task with the same id, then that matching task will be cancelled.
   * This object is checked for strict equality to find a match. If omitted,
   * then the task's callback will be used instead.
   */
  id?: WorkTaskId;

  /**
   * Whether this task is only relevant in an animation context. By default,
   * work tasks will only run on animation frames. To run even when the page is
   * not focused, set this to false.
   */
  animationOnly?: boolean;

  /**
   * Whether this task may begin immediately, in the same execution thread when
   * given to the WorkScheduler. By default, work tasks are assumed to be
   * delayed, running on the next animation frame or timeout.
   *
   * For example, say a running task seeks to add a task to the WorkScheduler.
   * Unless beginImmediately is set to true, the subsequent task will not begin
   * execution until the next time that performWork() is invoked.
   */
  beginImmediately?: boolean;

  /**
   * Whether the callback function should be re-run until it returns something
   * truthy, much like an iterator value's done property will be true when it
   * has finished.
   */
  runUntilDone?: boolean;
}

/**
 * Just like a WorkTask, but id is required. Object's properties are set to
 * readonly as a sanity check internally. Within this code, we should not be
 * modifying the properties of a WorkTask. However, an upstream user of the API
 * may change properties, and we should be able to handle that.
 */
export interface WorkTaskWithId extends Readonly<WorkTask> {
  readonly id: WorkTaskId;
}

/**
 * Given a WorkTask or Function, determine if it meets the minimum necessary
 * criteria for being used as a WorkTask.
 */
export function isWorkTaskOrFunction(workTaskOrFunction: WorkTask|
                                     WorkTaskCallbackFn): boolean {
  return !!(
      workTaskOrFunction &&
      (workTaskOrFunction instanceof Function ||
       workTaskOrFunction.callback instanceof Function));
}

/**
 * Given a WorkTask or Function, determine what its id would be as a
 * WorkTaskWithId.
 */
export function getWorkTaskId(workTaskOrFunction: WorkTask|
                              WorkTaskCallbackFn): WorkTaskId {
  if (!isWorkTaskOrFunction(workTaskOrFunction)) {
    throw new Error('Provided object was not a work task or function');
  }

  // The id of a naked Function is just the function itself.
  if (workTaskOrFunction instanceof Function) {
    return workTaskOrFunction;
  }

  // If the object has an id property, then return that.
  if (workTaskOrFunction.id !== undefined) {
    return workTaskOrFunction.id;
  }

  // The id of a WorkTask object that does not have an explicit id is its
  // callback funciton.
  return workTaskOrFunction.callback;
}

/**
 * Given a WorkTask or Function, create and return a WorkTask object. This
 * method will return the input parameter directly if it is a WorkTask object
 * with both 'callback' and 'id' properties. Otherwise, a new object will be
 * created and returned.
 *
 * If the input parameter is neither a WorkTask object, nor a Function, then an
 * error will be thrown.
 */
export function ensureOrCreateWorkTask(workTaskOrFunction: WorkTask|
                                       WorkTaskCallbackFn): WorkTaskWithId {
  if (!isWorkTaskOrFunction(workTaskOrFunction)) {
    throw new Error('Provided object was not a work task or function');
  }

  // Wrap naked function in an object with the minimum required properties.
  if (workTaskOrFunction instanceof Function) {
    return {
      callback: workTaskOrFunction,
      id: workTaskOrFunction,
    };
  }

  // At this point, we know the object is a WorkTask with at least a callback.
  // If the object also has an id, then return it directly.
  if (workTaskOrFunction.id !== undefined) {
    return workTaskOrFunction as WorkTaskWithId;
  }

  // The incoming object had a callback property (per initial check) but no id.
  return {
    ...workTaskOrFunction,
    id: workTaskOrFunction.callback,
  };
}
