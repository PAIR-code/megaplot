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
 * @fileoverview Tests for the WorkQueue.
 */

import { WorkQueue } from '../src/lib/work-queue';
import { WorkTask } from '../src/lib/work-task';

describe('WorkQueue', () => {
  it('should exist', () => {
    expect(typeof WorkQueue).toBe('function');
  });

  describe('enqueueTask', () => {
    it('should enqueue a task.', () => {
      const workQueue = new WorkQueue();

      const task = () => {};
      workQueue.enqueueTask(task);

      expect(workQueue.idSet.has(task)).toBe(true);
      expect(workQueue.length).toBe(1);
      expect(workQueue.taskList[0].id).toBe(task);
    });

    it('should throw when attempting to enqueue a non-task.', () => {
      const workQueue = new WorkQueue();

      const badTask = {} as WorkTask;

      expect(() => {
        workQueue.enqueueTask(badTask);
      }).toThrow();

      expect(workQueue.idSet.has(badTask)).toBe(false);
      expect(workQueue.length).toBe(0);
    });
  });

  describe('dequeueTask', () => {
    it('should dequeue existing tasks.', () => {
      const workQueue = new WorkQueue();

      const taskA = () => {};
      const taskB = () => {};
      const taskC = () => {};
      workQueue.enqueueTask(taskA);
      workQueue.enqueueTask(taskB);
      workQueue.enqueueTask(taskC);

      expect(workQueue.length).toBe(3);

      expect(workQueue.dequeueTask().callback).toBe(taskA);
      expect(workQueue.dequeueTask().callback).toBe(taskB);
      expect(workQueue.dequeueTask().callback).toBe(taskC);

      expect(workQueue.length).toBe(0);
    });

    it('should throw when attempting to dequeue when empty.', () => {
      const workQueue = new WorkQueue();

      expect(() => {
        workQueue.dequeueTask();
      }).toThrow();
      expect(workQueue.length).toBe(0);

      const task = () => {};
      workQueue.enqueueTask(task);
      expect(workQueue.length).toBe(1);

      expect(workQueue.dequeueTask().callback).toBe(task);
      expect(workQueue.length).toBe(0);

      expect(() => {
        workQueue.dequeueTask();
      }).toThrow();
      expect(workQueue.length).toBe(0);
    });
  });

  describe('hasTaskId', () => {
    it('should find a task once it is enqueued.', () => {
      const workQueue = new WorkQueue();

      expect(workQueue.hasTaskId('TASK_ID')).toBe(false);

      workQueue.enqueueTask({ callback: () => {}, id: 'TASK_ID' });

      expect(workQueue.hasTaskId('TASK_ID')).toBe(true);
    });
  });

  describe('hasTask', () => {
    it('should find a task once it is enqueued.', () => {
      const workQueue = new WorkQueue();

      const task = () => {};

      expect(workQueue.hasTask(task)).toBe(false);

      workQueue.enqueueTask(task);

      expect(workQueue.hasTask(task)).toBe(true);
    });
  });

  describe('removeTask', () => {
    it('should remove a task once it is enqueued.', () => {
      const workQueue = new WorkQueue();

      const task = () => {};

      workQueue.enqueueTask(task);

      expect(workQueue.hasTask(task)).toBe(true);
      expect(workQueue.length).toBe(1);

      workQueue.removeTask(task);

      expect(workQueue.hasTask(task)).toBe(false);
      expect(workQueue.length).toBe(0);
    });

    it('should remove a task from the middle of the list.', () => {
      const workQueue = new WorkQueue();

      const taskA = () => {};
      const taskB = () => {};
      const taskC = () => {};

      workQueue.enqueueTask(taskA);
      workQueue.enqueueTask(taskB);
      workQueue.enqueueTask(taskC);

      expect(workQueue.hasTask(taskA)).toBe(true);
      expect(workQueue.hasTask(taskB)).toBe(true);
      expect(workQueue.hasTask(taskC)).toBe(true);
      expect(workQueue.length).toBe(3);

      workQueue.removeTask(taskB);

      expect(workQueue.hasTask(taskA)).toBe(true);
      expect(workQueue.hasTask(taskB)).toBe(false);
      expect(workQueue.hasTask(taskC)).toBe(true);
      expect(workQueue.length).toBe(2);
      expect(workQueue.taskList[0].id).toBe(taskA);
      expect(workQueue.taskList[1].id).toBe(taskC);
    });
  });
});
