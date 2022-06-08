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
 * @fileoverview The WorkQueue class is used internally by the WorkScheduler to
 * manage ordered lists of work tasks.
 */

import {ensureOrCreateWorkTask, getWorkTaskId, WorkTask, WorkTaskCallbackFn, WorkTaskId, WorkTaskWithId} from './work-task';

/**
 * A WorkQueue consists of an array of work tasks with Ids, and a set for
 * looking up tasks by their Id to check for existence. Any given task,
 * identified by its id, can only be in the WorkQueue once at a time. After a
 * task has been removed, it can be readded.
 */
export class WorkQueue {
  /**
   * Set of WorkTask ids which are present in the task list. Maintained for
   * rapid lookup.
   */
  readonly idSet: Set<WorkTaskId> = new Set();

  /**
   * List of tasks to be performed.
   */
  readonly taskList: WorkTaskWithId[] = [];

  /**
   * Return the length of the underlying task list.
   */
  get length(): number {
    return this.taskList.length;
  }

  /**
   * Return whether a WorkTask with the specified id has already been enqueued.
   */
  hasTaskId(id: WorkTaskId): boolean {
    return this.idSet.has(id);
  }

  /**
   * Return whether a WorkTask has already been enqueued that matches the
   * provided input.
   */
  hasTask(workTaskOrFunction: WorkTask|WorkTaskCallbackFn): boolean {
    return this.hasTaskId(getWorkTaskId(workTaskOrFunction));
  }

  /**
   * Get the task that has the provided id.
   */
  getTaskById(id: WorkTaskId): WorkTaskWithId|undefined {
    if (!this.hasTaskId(id)) {
      return undefined;
    }

    const index = this.findTaskIndexById(id);

    // Sanity check.
    if (index === -1) {
      throw new Error('Could not find matching task in task list.');
    }

    return this.taskList[index];
  }

  /**
   * Given a WorkTask or a simple callback function, push it onto the end of the
   * internal taskList unless it's already present.
   */
  enqueueTask(workTaskOrFunction: WorkTask|WorkTaskCallbackFn) {
    // Short-circuit if this task is already queued.
    if (this.hasTask(workTaskOrFunction)) {
      return;
    }

    const workTask = ensureOrCreateWorkTask(workTaskOrFunction);
    this.idSet.add(workTask.id);
    this.taskList.push(workTask);
  }

  /**
   * Dequeue a task from the front of the task list. If no tasks remain, throw.
   */
  dequeueTask(): WorkTaskWithId {
    if (!this.length) {
      throw new Error('No tasks remain to dequeue.');
    }
    const task = this.taskList.shift()!;
    this.idSet.delete(task.id);
    return task;
  }

  /**
   * Given the id if of a WorkTask, if a matching WorkTask has been enqueued,
   * remove it and return it. Otherwise return undefined.
   */
  removeTaskById(id: WorkTaskId): WorkTaskWithId|undefined {
    // Short-circuit if the task is not present in the WorkQueue's idSet.
    if (!this.hasTaskId(id)) {
      return undefined;
    }

    const index = this.findTaskIndexById(id);

    // Sanity check.
    if (index === -1) {
      throw new Error('Could not find matching task in task list.');
    }

    const [task] = this.taskList.splice(index, 1);
    this.idSet.delete(task.id);
    return task;
  }

  /**
   * Given a WorkTask or function, if a matching WorkTask has been enqueued,
   * remove it and return it. Otherwise return undefined.
   */
  removeTask(workTaskOrFunction: WorkTask|WorkTaskCallbackFn): WorkTaskWithId
      |undefined {
    return this.removeTaskById(getWorkTaskId(workTaskOrFunction));
  }

  /**
   * Given an id, find the index of the task in the task list with that id. If
   * no task with that id is found, return -1.
   */
  findTaskIndexById(id: WorkTaskId): number {
    let index = -1;
    for (let i = 0; i < this.taskList.length; i++) {
      if (this.taskList[i].id === id) {
        // Sanity check.
        if (index !== -1) {
          throw new Error('Duplicate task found in task list.');
        }
        index = i;
      }
    }
    return index;
  }
}
