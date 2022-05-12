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
 * @fileoverview Tests for the Selections created by Scene.
 */

import {Scene} from '../src/lib/scene';
import {TimingFunctionsShim} from '../src/lib/timing-functions-shim';

/**
 * Tests produce visible artifacts for debugging.
 */
const article = document.createElement('article');
article.className = 'cw';
article.innerHTML = `
<style>
.cw {
  font-family: monospace;
}
.cw .content {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.cw canvas {
  background-image: linear-gradient(135deg, #aaa 50%, #ccc 50%);
  background-size: 10px 10px;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.25);
}
</style>
`;
document.body.appendChild(article);

/**
 * Create a <section> element inside the <article>.
 */
function createSection(title: string): HTMLElement {
  const section = document.createElement('section');
  section.innerHTML = '<h2 class="title"></h2><div class="content"></div>';
  section.querySelector('h2')!.textContent = title;
  article.appendChild(section);
  return section;
}

/**
 * Dummy data interface for testing.
 */
interface TestDatum {
  id?: string;  // Optional id to make tests easier to follow.
}

describe('Selection', () => {
  const section = createSection('Selection');
  const content = section.querySelector('.content')!;

  const container = document.createElement('div');
  container.style.width = '100px';
  container.style.height = '100px';
  content.appendChild(container);

  const timingFunctionsShim = new TimingFunctionsShim();

  timingFunctionsShim.totalElapsedTimeMs = 1000;

  const scene = new Scene({
    container,
    defaultTransitionTimeMs: 0,
    desiredSpriteCapacity: 100,
    timingFunctions: timingFunctionsShim,
  });

  describe('init', () => {
    it('should invoke callback asynchronously after bind', async () => {
      const selection = scene.createSelection<TestDatum>();

      // Keep track of how many times the init callback is invoked.
      let initRunCount = 0;

      // Keep track of the objects with which the init callback is invoked.
      const initDataSet = new Set<TestDatum>();

      selection.onInit((_, datum) => {
        initRunCount++;
        initDataSet.add(datum);
      });

      // The callback should be invoked until after bind().
      expect(initRunCount).toBe(0);
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(initRunCount).toBe(0);

      // Initialize data set with two objects.
      const data: TestDatum[] = [{}, {}];
      const expectedDataSet = new Set(data);

      // Bind the data to the selection.
      selection.bind(data);

      // The callback should not be invoked immediately.
      expect(initRunCount).toBe(0);

      // This should schedule the sprites enter callbacks (which run init).
      // TODO(jimbo): Using beginImmediately on runEnterCallbacks to shorten.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // This should run the init callbacks to completion since time does not
      // advance during invocations.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(initRunCount).toBe(2);
      expect(initDataSet).toEqual(expectedDataSet);
    });

    it('should invoke init before enter', async () => {
      const selection = scene.createSelection<TestDatum>();

      // Log invocations of callbacks to test for order later.
      const invocationLog: Array<{action: string, datum: TestDatum}> = [];

      selection.onInit((_, datum) => {
        invocationLog.push({action: 'init', datum});
      });

      selection.onEnter((_, datum) => {
        invocationLog.push({action: 'enter', datum});
      });

      // Initialize data set with two objects.
      const data: TestDatum[] = [{}, {}];
      const expectedLog: (typeof invocationLog) = [
        {action: 'init', datum: data[0]},
        {action: 'init', datum: data[1]},
        {action: 'enter', datum: data[0]},
        {action: 'enter', datum: data[1]},
      ];

      // Bind the data to the selection.
      selection.bind(data);

      // The callback should not be invoked immediately.
      expect(invocationLog.length).toBe(0);

      // This should schedule the sprites enter callbacks (which run init).
      // TODO(jimbo): Using beginImmediately on runEnterCallbacks to shorten.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // This should run the init callbacks to completion since time does not
      // advance during invocations.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(invocationLog.length).toBe(2);
      expect(invocationLog).toEqual(expectedLog.slice(0, 2));

      // After running the init callbacks, the next frame will sync the target
      // values array over to the target values texture. It will also queue the
      // next run of callbacks, including the 'enter' selection callbacks.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // This should run the enter callbacks to completion since time does not
      // advance during invocations.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(invocationLog.length).toBe(4);
      expect(invocationLog).toEqual(expectedLog);
    });
  });

  describe('enter', () => {
    it('should invoke callback asynchronously after bind', async () => {
      const selection = scene.createSelection<TestDatum>();

      // Keep track of how many times the enter callback is invoked.
      let enterRunCount = 0;

      // Keep track of the objects with which the enter callback is invoked.
      const enterDataSet = new Set<TestDatum>();

      selection.onEnter((_, datum) => {
        enterRunCount++;
        enterDataSet.add(datum);
      });

      // The callback should be invoked until after bind().
      expect(enterRunCount).toBe(0);
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(enterRunCount).toBe(0);

      // Initialize data set with two objects.
      const data: TestDatum[] = [{}, {}];
      const expectedDataSet = new Set(data);

      // Bind the data to the selection.
      selection.bind(data);

      // The callback should not be invoked immediately.
      expect(enterRunCount).toBe(0);

      // This should schedule the sprites' enter callbacks.
      // TODO(jimbo): Using beginImmediately on runEnterCallbacks to shorten.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // This should run the enter callbacks to completion since time does not
      // advance during invocations.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(enterRunCount).toBe(2);
      expect(enterDataSet).toEqual(expectedDataSet);
    });

    it('should invoke enter before update', async () => {
      const selection = scene.createSelection<TestDatum>();

      // Log invocations of callbacks to test for order later.
      const invocationLog: Array<{action: string, datum: TestDatum}> = [];

      selection.onEnter((_, datum) => {
        invocationLog.push({action: 'enter', datum});
      });

      selection.onUpdate((_, datum) => {
        invocationLog.push({action: 'update', datum});
      });

      // Initialize data set with two objects.
      const data: TestDatum[] = [{}, {}];
      const expectedLog: (typeof invocationLog) = [
        {action: 'enter', datum: data[0]},
        {action: 'enter', datum: data[1]},
        {action: 'update', datum: data[0]},
        {action: 'update', datum: data[1]},
      ];

      // Bind the data to the selection.
      selection.bind(data);

      // The callback should not be invoked immediately.
      expect(invocationLog.length).toBe(0);

      // This should schedule the sprites' enter callbacks.
      // TODO(jimbo): Using beginImmediately on runEnterCallbacks to shorten.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // This should run the enter callbacks to completion since time does not
      // advance during invocations.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(invocationLog.length).toBe(2);
      expect(invocationLog).toEqual(expectedLog.slice(0, 2));

      // To test update, we have to bind the data again.
      selection.bind(data);

      // This should schedule the sprites' update callbacks.
      // TODO(jimbo): Using beginImmediately on runEnterCallbacks to shorten.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // This should run the update callbacks to completion since time does not
      // advance during invocations.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(invocationLog.length).toBe(4);
      expect(invocationLog).toEqual(expectedLog);
    });
  });

  describe('update', () => {
    it('should invoke callback asynchronously after re-bind', async () => {
      const selection = scene.createSelection<TestDatum>();

      // Keep track of how many times the enter callback is invoked.
      let updateRunCount = 0;

      // Keep track of the objects with which the update callback is invoked.
      const updateDataSet = new Set<TestDatum>();

      selection.onUpdate((_, datum) => {
        updateRunCount++;
        updateDataSet.add(datum);
      });

      // The callback should be invoked until after bind().
      expect(updateRunCount).toBe(0);
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(updateRunCount).toBe(0);

      // Initialize data set with two objects.
      const data: TestDatum[] = [{}, {}];
      const expectedDataSet = new Set(data);

      // Bind the data to the selection.
      selection.bind(data);

      // The callback should not be invoked immediately.
      expect(updateRunCount).toBe(0);

      // This should schedule the sprites' enter callbacks.
      // TODO(jimbo): Using beginImmediately on runEnterCallbacks to shorten.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // This should not yet run the update callbacks, because a second bind has
      // not yet occurred. But after this, sprites should be ready for second
      // bind.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(updateRunCount).toBe(0);

      // Bind the data to the selection again.
      selection.bind(data);

      // This should schedule the sprites' update callbacks.
      // TODO(jimbo): Using beginImmediately on runEnterCallbacks to shorten.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // This should run the update callbacks.
      timingFunctionsShim.runAnimationFrameCallbacks();

      expect(updateRunCount).toBe(2);
      expect(updateDataSet).toEqual(expectedDataSet);
    });

    it('should invoke update before exit', async () => {
      const selection = scene.createSelection<TestDatum>();

      // Log invocations of callbacks to test for order later.
      const invocationLog: Array<{action: string, datum: TestDatum}> = [];

      selection.onUpdate((_, datum) => {
        invocationLog.push({action: 'update', datum});
      });

      selection.onExit((_, datum) => {
        invocationLog.push({action: 'exit', datum});
      });

      // Initialize data set with two objects.
      const data: TestDatum[] = [{}, {}];
      const expectedLog: (typeof invocationLog) = [
        {action: 'update', datum: data[0]},
        {action: 'update', datum: data[1]},
        {action: 'exit', datum: data[0]},
        {action: 'exit', datum: data[1]},
      ];

      // Bind the data to the selection.
      selection.bind(data);

      // The callback should not be invoked immediately.
      expect(invocationLog.length).toBe(0);

      // This should schedule the sprites' enter callbacks.
      // TODO(jimbo): Using beginImmediately on runEnterCallbacks to shorten.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // This should not yet run the update callbacks, because a second bind has
      // not yet occurred. But after this, sprites should be ready for second
      // bind.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(invocationLog.length).toBe(0);

      // Bind the data to the selection again.
      selection.bind(data);

      // This should schedule the sprites' update callbacks.
      // TODO(jimbo): Using beginImmediately on runEnterCallbacks to shorten.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // This should run the update callbacks.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(invocationLog.length).toBe(2);
      expect(invocationLog).toEqual(expectedLog.slice(0, 2));

      // Bind an empty array to the selection to trigger exit callbacks.
      selection.bind([]);

      // This should schedule the sprites' exit callbacks.
      // TODO(jimbo): Using beginImmediately on runEnterCallbacks to shorten.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // This should run the exit callbacks to completion since time does not
      // advance during invocations.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(invocationLog.length).toBe(4);
      expect(invocationLog).toEqual(expectedLog);
    });
  });

  describe('bind', () => {
    it('should invoke callback asynchronously after bind', async () => {
      const selection = scene.createSelection<TestDatum>();

      // Keep track of how many times the bind callback is invoked.
      let bindRunCount = 0;

      // Keep track of the objects with which the bind callback is invoked.
      const bindDataSet = new Set<TestDatum>();

      selection.onBind((_, datum) => {
        bindRunCount++;
        bindDataSet.add(datum);
      });

      // The callback should be invoked until after bind().
      expect(bindRunCount).toBe(0);
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(bindRunCount).toBe(0);

      // Initialize data set with two objects.
      const data: TestDatum[] = [{}, {}];
      const expectedDataSet = new Set(data);

      // Bind the data to the selection.
      selection.bind(data);

      // The callback should not be invoked immediately.
      expect(bindRunCount).toBe(0);

      // This should schedule the sprites' enter callbacks (which run bind).
      // TODO(jimbo): Using beginImmediately on runEnterCallbacks to shorten.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // This should run the bind callbacks to completion since time does not
      // advance during invocations.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(bindRunCount).toBe(2);
      expect(bindDataSet).toEqual(expectedDataSet);
    });

    it('should invoke bind before init', async () => {
      const selection = scene.createSelection<TestDatum>();

      // Log invocations of callbacks to test for order later.
      const invocationLog: Array<{action: string, datum: TestDatum}> = [];

      selection.onInit((_, datum) => {
        invocationLog.push({action: 'init', datum});
      });

      selection.onBind((_, datum) => {
        invocationLog.push({action: 'bind', datum});
      });

      // Initialize data set with two objects.
      const data: TestDatum[] = [{}, {}];
      const expectedLog: (typeof invocationLog) = [
        {action: 'bind', datum: data[0]},
        {action: 'init', datum: data[0]},
        {action: 'bind', datum: data[1]},
        {action: 'init', datum: data[1]},
      ];

      // Bind the data to the selection.
      selection.bind(data);

      // The callback should not be invoked immediately.
      expect(invocationLog.length).toBe(0);

      // This should schedule the sprites' enter callbacks (run bind,init).
      // TODO(jimbo): Using beginImmediately on runEnterCallbacks to shorten.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // This should run the sprites' update callbacks to completion (in turn
      // running the selection's bind, init) since time does not advance during
      // invocations.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(invocationLog.length).toBe(4);
      expect(invocationLog).toEqual(expectedLog);
    });
  });

  describe('clear', () => {
    it('should remove data and sprites', async () => {
      const selection = scene.createSelection<TestDatum>();

      // Keep track of how many times the various callbacks are invoked.
      const counter = {bind: 0, init: 0, enter: 0, exit: 0};
      selection.onBind(() => counter.bind++);
      selection.onInit(() => counter.init++);
      selection.onEnter(() => counter.enter++);
      selection.onExit(() => counter.exit++);

      // Bind the selection to an array of one datum.
      selection.bind([{}]);

      // Nothing should happen immediately.
      expect(counter).toEqual({bind: 0, init: 0, enter: 0, exit: 0});

      // After one frame, the binding code has run, setting up the Sprite's
      // enter() and update() callbacks, but neither will have been invoked.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 0, init: 0, enter: 0, exit: 0});

      // After the next frame, the Sprite's enter() callback has run, which
      // includes running the Selection's onBind() and onInit() callbacks.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 1, init: 1, enter: 0, exit: 0});

      // After the next frame, the Sprite's values have been flashed over to
      // texture memory, and the Sprite's update() callback is scheduled, but
      // has not yet been invoked.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 1, init: 1, enter: 0, exit: 0});

      // After the next frame, the Sprite's update() callback has been invoked,
      // which in turn invokes the Selection's onBind() callback for the second
      // time and the onEnter() callback.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 2, init: 1, enter: 1, exit: 0});

      // After another frame, the Sprite's values are again flashed over to
      // texture memory, but nothing else should have occurred, so the
      // invocation counts should still be the same.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 2, init: 1, enter: 1, exit: 0});

      // Sanity check! Here we're asserting that after another frame, there was
      // nothing scheduled. If something had been scheduled then one or more of
      // the following assertions would fail.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 2, init: 1, enter: 1, exit: 0});

      // Now we invoke clear().
      selection.clear();

      // As before, nothing should happen immediately. Run counts should all
      // remain unchanged.
      expect(counter).toEqual({bind: 2, init: 1, enter: 1, exit: 0});

      // After one frame, the clearing task code has run, setting up the
      // Sprite's exit() callback, but not having called it yet.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 2, init: 1, enter: 1, exit: 0});

      // After the next frame, the Sprite's exit() callback has been invoked,
      // which in turn invokes the Selection's onBind() for the third time, and
      // onExit() for the first time.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 3, init: 1, enter: 1, exit: 1});

      // Sanity check! Still no additional changes after yet more frames.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 3, init: 1, enter: 1, exit: 1});
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 3, init: 1, enter: 1, exit: 1});
    });

    it('should finish before a subsequent bind', async () => {
      const selection = scene.createSelection<TestDatum>();

      // Keep track of how many times the various callbacks are invoked.
      const counter = {bind: 0, init: 0, enter: 0, update: 0, exit: 0};
      selection.onBind(() => counter.bind++);
      selection.onInit(() => counter.init++);
      selection.onEnter(() => counter.enter++);
      selection.onUpdate(() => counter.update++);
      selection.onExit(() => counter.exit++);

      // Bind the selection to an array of one datum.
      selection.bind([{id: 'apple'}]);

      // After six frames, the bind should have entirely finished, calling both
      // the onInit() and onEnter() callbacks (and onBind() once for each).
      timingFunctionsShim.runAnimationFrameCallbacks();
      timingFunctionsShim.runAnimationFrameCallbacks();
      timingFunctionsShim.runAnimationFrameCallbacks();
      timingFunctionsShim.runAnimationFrameCallbacks();
      timingFunctionsShim.runAnimationFrameCallbacks();
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 2, init: 1, enter: 1, update: 0, exit: 0});

      // Now we invoke clear().
      selection.clear();

      // Nothing should happen immediately. Run counts should remain unchanged.
      expect(counter).toEqual({bind: 2, init: 1, enter: 1, update: 0, exit: 0});

      // Now we invoke bind() before advancing any frames. If the clear() fails
      // to finish before this bind, then we'll see increments to
      // counter.update. If everything goes according to plan, we'll never see
      // any increments to update because the data will all have been cleared
      // before this bind occurs.
      selection.bind([{id: 'blueberry'}]);

      // Nothing should happen immediately. Run counts should remain unchanged.
      expect(counter).toEqual({bind: 2, init: 1, enter: 1, update: 0, exit: 0});

      // After one frame, the clearing task code has run, setting up the
      // Sprite's exit() callback, but not having called it yet.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 2, init: 1, enter: 1, update: 0, exit: 0});

      // After the next frame, the Sprite's exit() callback has been invoked,
      // which in turn invokes the Selection's onBind() for the third time, and
      // onExit() for the first time.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 3, init: 1, enter: 1, update: 0, exit: 1});

      // Next up in the WorkScheduler queue is the Sprite::enter() call which
      // will invoke the onBind() and onInit() callbacks for the second bind()
      // invocation (the blueberry).
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 4, init: 2, enter: 1, update: 0, exit: 1});

      // After a frame, values are flashed to textures, and the Sprite::update()
      // is scheduled.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 4, init: 2, enter: 1, update: 0, exit: 1});

      // After a frame, Sprite::update() runs, which in turn calls the Selection
      // onBind() and onEnter() callbacks.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 5, init: 2, enter: 2, update: 0, exit: 1});

      // Sanity check! After more frames, no more callbacks have been invoked.
      timingFunctionsShim.runAnimationFrameCallbacks();
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 5, init: 2, enter: 2, update: 0, exit: 1});
    });

    it('should circumvent a scheduled bind', async () => {
      const selection = scene.createSelection<TestDatum>();

      // Keep track of how many times the various callbacks are invoked.
      const counter = {bind: 0, init: 0, enter: 0, update: 0, exit: 0};
      selection.onBind(() => counter.bind++);
      selection.onInit(() => counter.init++);
      selection.onEnter(() => counter.enter++);
      selection.onUpdate(() => counter.update++);
      selection.onExit(() => counter.exit++);

      // Bind the selection to an array of one datum.
      selection.bind([{id: 'apple'}]);

      // After six frames, the bind should have entirely finished, calling both
      // the onInit() and onEnter() callbacks (and onBind() once for each).
      timingFunctionsShim.runAnimationFrameCallbacks();
      timingFunctionsShim.runAnimationFrameCallbacks();
      timingFunctionsShim.runAnimationFrameCallbacks();
      timingFunctionsShim.runAnimationFrameCallbacks();
      timingFunctionsShim.runAnimationFrameCallbacks();
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 2, init: 1, enter: 1, update: 0, exit: 0});

      // Bind the selection again
      selection.bind([{id: 'blueberry'}]);

      // Nothing should happen immediately. Run counts should remain unchanged.
      expect(counter).toEqual({bind: 2, init: 1, enter: 1, update: 0, exit: 0});

      // Now we invoke clear(). If this fails to perform as advertized, then the
      // second bind (blueberry) will end up causing updates. As it is, the
      // second bind should be unscheduled and never run.
      selection.clear();

      // Nothing should happen immediately. Run counts should remain unchanged.
      expect(counter).toEqual({bind: 2, init: 1, enter: 1, update: 0, exit: 0});

      // After one frame, the clearing task code has run, setting up the
      // Sprite's exit() callback, but not having called it yet.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 2, init: 1, enter: 1, update: 0, exit: 0});

      // After the next frame, the Sprite's exit() callback has been invoked,
      // which in turn invokes the Selection's onBind() for the third time, and
      // onExit() for the first time.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 3, init: 1, enter: 1, update: 0, exit: 1});

      // Since the clear() should have completely removed the second bind()'s
      // scheduled task, even after many more frames, no more callbacks should
      // be invoked.
      timingFunctionsShim.runAnimationFrameCallbacks();
      timingFunctionsShim.runAnimationFrameCallbacks();
      timingFunctionsShim.runAnimationFrameCallbacks();
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(counter).toEqual({bind: 3, init: 1, enter: 1, update: 0, exit: 1});
    });
  });
});
