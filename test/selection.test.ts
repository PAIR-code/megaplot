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
interface TestDatum {}

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

  describe('join', () => {
    it('should invoke callback asynchronously after bind', async () => {
      const selection = scene.createSelection<TestDatum>();

      // Keep track of how many times the join callback is invoked.
      let joinRunCount = 0;

      // Keep track of the objects with which the join callback is invoked.
      const joinDataSet = new Set<TestDatum>();

      selection.onBind((_, datum) => {
        joinRunCount++;
        joinDataSet.add(datum);
      });

      // The callback should be invoked until after bind().
      expect(joinRunCount).toBe(0);
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(joinRunCount).toBe(0);

      // Initialize data set with two objects.
      const data: TestDatum[] = [{}, {}];
      const expectedDataSet = new Set(data);

      // Bind the data to the selection.
      selection.bind(data);

      // The callback should not be invoked immediately.
      expect(joinRunCount).toBe(0);

      // This should schedule the sprites' enter callbacks (which run join).
      // TODO(jimbo): Using beginImmediately on runEnterCallbacks to shorten.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // This should run the join callbacks to completion since time does not
      // advance during invocations.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(joinRunCount).toBe(2);
      expect(joinDataSet).toEqual(expectedDataSet);
    });

    it('should invoke join before init', async () => {
      const selection = scene.createSelection<TestDatum>();

      // Log invocations of callbacks to test for order later.
      const invocationLog: Array<{action: string, datum: TestDatum}> = [];

      selection.onInit((_, datum) => {
        invocationLog.push({action: 'init', datum});
      });

      selection.onBind((_, datum) => {
        invocationLog.push({action: 'join', datum});
      });

      // Initialize data set with two objects.
      const data: TestDatum[] = [{}, {}];
      const expectedLog: (typeof invocationLog) = [
        {action: 'join', datum: data[0]},
        {action: 'init', datum: data[0]},
        {action: 'join', datum: data[1]},
        {action: 'init', datum: data[1]},
      ];

      // Bind the data to the selection.
      selection.bind(data);

      // The callback should not be invoked immediately.
      expect(invocationLog.length).toBe(0);

      // This should schedule the sprites' enter callbacks (run join,init).
      // TODO(jimbo): Using beginImmediately on runEnterCallbacks to shorten.
      timingFunctionsShim.runAnimationFrameCallbacks();

      // This should run the sprites' update callbacks to completion (in turn
      // running the selection's join, init) since time does not advance during
      // invocations.
      timingFunctionsShim.runAnimationFrameCallbacks();
      expect(invocationLog.length).toBe(4);
      expect(invocationLog).toEqual(expectedLog);
    });
  });
});
