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
 * @fileoverview Tests for functions that operate on WorkTasks and related
 * objects.
 */

import {ensureOrCreateWorkTask, getWorkTaskId, isWorkTaskOrFunction, WorkTask} from '../src/lib/work-task';

describe('isWorkTaskOrFunction', () => {
  it('should exist', () => {
    expect(typeof isWorkTaskOrFunction).toBe('function');
  });

  it('should return true for Functions.', () => {
    expect(isWorkTaskOrFunction(function() {})).toBe(true);
    expect(isWorkTaskOrFunction(() => {})).toBe(true);
    expect(isWorkTaskOrFunction(async () => {})).toBe(true);

    function* generatorFn() {}
    expect(isWorkTaskOrFunction(generatorFn)).toBe(true);
  });

  it('should return true for objects with callback functions.', () => {
    expect(isWorkTaskOrFunction({callback: function() {}})).toBe(true);
    expect(isWorkTaskOrFunction({callback: () => {}})).toBe(true);
    expect(isWorkTaskOrFunction({callback: async () => {}})).toBe(true);

    function* generatorFn() {}
    expect(isWorkTaskOrFunction({callback: generatorFn})).toBe(true);
  });

  it('should return false for falsey arguments.', () => {
    expect(isWorkTaskOrFunction(undefined!)).toBe(false);
  });

  it('should return false for objects without a callback.', () => {
    expect(isWorkTaskOrFunction({} as WorkTask)).toBe(false);

    const objectWithId = {id: () => {}} as unknown as WorkTask;
    expect(isWorkTaskOrFunction(objectWithId)).toBe(false);
  });

  it('should return false for objects with a non-function callback.', () => {
    const callbackObject = {callback: {}} as unknown as WorkTask;
    expect(isWorkTaskOrFunction(callbackObject)).toBe(false);

    const callbackNull = {callback: null} as unknown as WorkTask
    expect(isWorkTaskOrFunction(callbackNull)).toBe(false);

    const callbackPlusId = {callback: {}, id: () => {}} as unknown as WorkTask;
    expect(isWorkTaskOrFunction(callbackPlusId)).toBe(false);
  });
});

describe('getWorkTaskId', () => {
  it('should exist', () => {
    expect(typeof getWorkTaskId).toBe('function');
  });

  it('should throw for non-task arguments.', () => {
    expect(() => {
      getWorkTaskId(undefined!);
    }).toThrow();

    expect(() => {
      getWorkTaskId({} as unknown as WorkTask);
    }).toThrow();

    expect(() => {
      getWorkTaskId({callback: {}} as unknown as WorkTask);
    }).toThrow();
  });

  it('should return argument for Functions.', () => {
    function regularFn() {}
    expect(getWorkTaskId(regularFn)).toBe(regularFn);

    const arrowFn = () => {};
    expect(getWorkTaskId(arrowFn)).toBe(arrowFn);

    const asyncFn = async () => {};
    expect(getWorkTaskId(asyncFn)).toBe(asyncFn);

    function* generatorFn() {}
    expect(getWorkTaskId(generatorFn)).toBe(generatorFn);
  });

  it('should return callback for objects with callback functions.', () => {
    function regularFn() {}
    expect(getWorkTaskId({callback: regularFn})).toBe(regularFn);

    const arrowFn = () => {};
    expect(getWorkTaskId({callback: arrowFn})).toBe(arrowFn);

    const asyncFn = async () => {};
    expect(getWorkTaskId({callback: asyncFn})).toBe(asyncFn);

    function* generatorFn() {}
    expect(getWorkTaskId({callback: generatorFn})).toBe(generatorFn);
  });

  it('should return id object for tasks with ids.', () => {
    const EXAMPLE_TASK_ID = Symbol('REGULAR FUNCTION TASK');
    const regularFnTask = {
      callback: function regularFn() {},
      id: EXAMPLE_TASK_ID,
    };
    expect(getWorkTaskId(regularFnTask)).toBe(EXAMPLE_TASK_ID);

    const arrowFnTask = {
      callback: () => {},
      id: 'arrowFn',
    };
    expect(getWorkTaskId(arrowFnTask)).toBe('arrowFn');
  });
});

describe('ensureOrCreateWorkTask', () => {
  it('should exist', () => {
    expect(typeof ensureOrCreateWorkTask).toBe('function');
  });

  it('should throw for non-task-like arguments.', () => {
    expect(() => {
      ensureOrCreateWorkTask(undefined!);
    }).toThrow();

    expect(() => {
      ensureOrCreateWorkTask({} as unknown as WorkTask);
    }).toThrow();

    expect(() => {
      ensureOrCreateWorkTask({callback: {}} as unknown as WorkTask);
    }).toThrow();
  });

  it('should create a task for a Function argument.', () => {
    function regularFn() {}
    const regularFnTask = ensureOrCreateWorkTask(regularFn);
    expect(typeof regularFnTask).toBe('object');
    expect(regularFnTask.callback).toBe(regularFn);
    expect(regularFnTask.id).toBe(regularFn);

    const arrowFn = () => {};
    const arrowFnTask = ensureOrCreateWorkTask(arrowFn);
    expect(typeof arrowFnTask).toBe('object');
    expect(arrowFnTask.callback).toBe(arrowFn);
    expect(arrowFnTask.id).toBe(arrowFn);

    const asyncFn = async () => {};
    const asyncFnTask = ensureOrCreateWorkTask(asyncFn);
    expect(typeof asyncFnTask).toBe('object');
    expect(asyncFnTask.callback).toBe(asyncFn);
    expect(asyncFnTask.id).toBe(asyncFn);

    function* generatorFn() {}
    const generatorFnTask = ensureOrCreateWorkTask(generatorFn);
    expect(typeof generatorFnTask).toBe('object');
    expect(generatorFnTask.callback).toBe(generatorFn);
    expect(generatorFnTask.id).toBe(generatorFn);
  });

  it('should copy properties of an object with a callback property.', () => {
    function regularFn() {}
    const regularFnInput = {
      callback: regularFn,
      extraProperty: 'extraValue',
    };
    const regularFnTask = ensureOrCreateWorkTask(regularFnInput);
    expect(typeof regularFnTask).toBe('object');
    expect(regularFnTask as WorkTask).not.toBe(regularFnInput);
    expect(regularFnTask.callback).toBe(regularFn);
    expect(regularFnTask.id).toBe(regularFn);
    // Even non-task properties should be copied.
    expect((regularFnTask as unknown as typeof regularFnInput).extraProperty)
        .toBe('extraValue');

    const arrowFn = () => {};
    const arrowFnInput = {callback: arrowFn};
    const arrowFnTask = ensureOrCreateWorkTask(arrowFnInput);
    expect(typeof arrowFnTask).toBe('object');
    expect(arrowFnTask as WorkTask).not.toBe(arrowFnInput);
    expect(arrowFnTask.callback).toBe(arrowFn);
    expect(arrowFnTask.id).toBe(arrowFn);
  });

  it('should return argument if already a work task with id.', () => {
    function regularFn() {}
    const regularId = 'regularId';
    const regularFnInput = {
      callback: regularFn,
      id: regularId,
    };
    const regularFnTask = ensureOrCreateWorkTask(regularFnInput);
    expect(typeof regularFnTask).toBe('object');
    expect(regularFnTask as WorkTask).toBe(regularFnInput);

    const arrowFn = () => {};
    const arrowId = Symbol('ARROW FUNCTION TASK');
    const arrowFnInput = {
      callback: arrowFn,
      id: arrowId,
    };
    const arrowFnTask = ensureOrCreateWorkTask(arrowFnInput);
    expect(typeof arrowFnTask).toBe('object');
    expect(arrowFnTask as WorkTask).toBe(arrowFnInput);
  });
});
