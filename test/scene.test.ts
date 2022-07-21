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
 * @fileoverview Tests for the Scene.
 */

import {Scene} from '../src/lib/scene';
import {SceneInternalSymbol} from '../src/lib/symbols';
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

describe('Scene', () => {
  it('should exist', () => {
    expect(Scene).toBeInstanceOf(Function);
  });

  const section = createSection('Scene::constructor()');

  const container = document.createElement('div');
  container.style.width = '100px';
  container.style.height = '100px';
  section.querySelector('.content')!.appendChild(container);

  const timingFunctionsShim = new TimingFunctionsShim();

  // Set the timingFunctionsShim starting time to something high. Without the
  // shim, this would be the value returned by Date.now(), which has at least 13
  // digits of precision.
  timingFunctionsShim.totalElapsedTimeMs = 1234500000;

  const scene = new Scene({
    container,
    defaultTransitionTimeMs: 0,
    desiredSpriteCapacity: 100,
    timingFunctions: timingFunctionsShim,
  });

  describe('constructor', () => {
    it('should create a canvas', () => {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const canvas = container.querySelector('canvas')!;
      expect(canvas).toBeInstanceOf(HTMLCanvasElement)
      expect(canvas.width).toBe(100 * devicePixelRatio);
      expect(canvas.height).toBe(100 * devicePixelRatio);
    });

    it('should set world origin in center of canvas', () => {
      expect(scene.offset.x).toEqual(50);
      expect(scene.offset.y).toEqual(50);
    });

    it('should set scale to match canvas size', () => {
      expect(scene.scale.x).toEqual(100);
      expect(scene.scale.y).toEqual(100);
    });

    it('should initialize glyph mapper', () => {
      expect(scene[SceneInternalSymbol].glyphMapper).toBeTruthy();
    });

    it('should initialize work scheduler', () => {
      expect(scene[SceneInternalSymbol].workScheduler).toBeTruthy();
    });
  });

  describe('elapsedTimeMs', () => {
    it('should begin at zero and advance with timing function', () => {
      expect(scene.elapsedTimeMs()).toBe(0);

      timingFunctionsShim.totalElapsedTimeMs = 1234500020;
      expect(scene.elapsedTimeMs()).toBe(20);

      timingFunctionsShim.totalElapsedTimeMs = 1234500400;
      expect(scene.elapsedTimeMs()).toBe(400);

      timingFunctionsShim.totalElapsedTimeMs = 1234501000;
      expect(scene.elapsedTimeMs()).toBe(1000);
    });
  });

  describe('createSprite', () => {
    const sprite = scene.createSprite();

    it('should create a Sprite', () => {
      expect(sprite).toBeDefined();
      expect(sprite.enter).toBeInstanceOf(Function);
      expect(sprite.update).toBeInstanceOf(Function);
      expect(sprite.exit).toBeInstanceOf(Function);
    });
  });

  describe('createSelection', () => {
    it('should create a Selection', () => {
      interface Datum {}

      const selection = scene.createSelection<Datum>();

      expect(selection).toBeDefined();
      expect(selection.onBind).toBeInstanceOf(Function);
      expect(selection.onInit).toBeInstanceOf(Function);
      expect(selection.onEnter).toBeInstanceOf(Function);
      expect(selection.onUpdate).toBeInstanceOf(Function);
      expect(selection.onExit).toBeInstanceOf(Function);
    });
  });
});

describe('Scene', () => {
  describe('resize()', () => {
    const section = createSection('Scene::resize()');

    describe('horizontal', () => {
      const container = document.createElement('div');
      container.style.width = '100px';
      container.style.height = '100px';
      section.querySelector('.content')!.appendChild(container);

      const timingFunctionsShim = new TimingFunctionsShim();

      // Set the timingFunctionsShim starting time to something high. Without
      // the shim, this would be the value returned by Date.now(), which has at
      // least 13 digits of precision.
      timingFunctionsShim.totalElapsedTimeMs = 1234500000;

      const scene = new Scene({
        container,
        defaultTransitionTimeMs: 0,
        desiredSpriteCapacity: 100,
        timingFunctions: timingFunctionsShim,
      });

      const canvas = container.querySelector('canvas')!;

      it('should update values when stretched', () => {
        // Stretch container, which should cause the canvas to change size.
        container.style.width = '200px';

        // Trigger Scene to recalculate its offset and scale.
        scene.resize();

        // Canvas should fill container.
        expect(canvas.width).toEqual(200 * devicePixelRatio);
        expect(canvas.height).toEqual(100 * devicePixelRatio);

        // After resize, offset should be re-centered, scale still square.
        expect(scene.offset.x).toEqual(100);
        expect(scene.offset.y).toEqual(50);
        expect(scene.scale.x).toEqual(100);
        expect(scene.scale.y).toEqual(100);
      });

      it('should update values squished', () => {
        // Stretch container, which should cause the canvas to change size.
        container.style.width = '50px';

        // Trigger Scene to recalculate its offset and scale.
        scene.resize();

        // Canvas should fill container.
        expect(canvas.width).toEqual(50 * devicePixelRatio);
        expect(canvas.height).toEqual(100 * devicePixelRatio);

        // After resize, offset should be re-centered, scale still square.
        expect(scene.offset.x).toEqual(25);
        expect(scene.offset.y).toEqual(50);
        expect(scene.scale.x).toEqual(100);
        expect(scene.scale.y).toEqual(100);
      });
    });

    describe('vertical', () => {
      const container = document.createElement('div');
      container.style.width = '100px';
      container.style.height = '100px';
      section.querySelector('.content')!.appendChild(container);

      const timingFunctionsShim = new TimingFunctionsShim();

      // Set the timingFunctionsShim starting time to something high. Without
      // the shim, this would be the value returned by Date.now(), which has at
      // least 13 digits of precision.
      timingFunctionsShim.totalElapsedTimeMs = 1234500000;

      const scene = new Scene({
        container,
        defaultTransitionTimeMs: 0,
        desiredSpriteCapacity: 100,
        timingFunctions: timingFunctionsShim,
      });

      const canvas = container.querySelector('canvas')!;

      it('should update values when stretched', () => {
        // Stretch container, which should cause the canvas to change size.
        container.style.height = '200px';

        // Trigger Scene to recalculate its offset and scale.
        scene.resize();

        // Canvas should fill container.
        expect(canvas.width).toEqual(100 * devicePixelRatio);
        expect(canvas.height).toEqual(200 * devicePixelRatio);

        // After resize, offset should be re-centered, scale still square.
        expect(scene.offset.x).toEqual(50);
        expect(scene.offset.y).toEqual(100);
        expect(scene.scale.x).toEqual(100);
        expect(scene.scale.y).toEqual(100);
      });

      it('should update values squished', () => {
        // Stretch container, which should cause the canvas to change size.
        container.style.height = '50px';

        // Trigger Scene to recalculate its offset and scale.
        scene.resize();

        // Canvas should fill container.
        expect(canvas.width).toEqual(100 * devicePixelRatio);
        expect(canvas.height).toEqual(50 * devicePixelRatio);

        // After resize, offset should be re-centered, scale still square.
        expect(scene.offset.x).toEqual(50);
        expect(scene.offset.y).toEqual(25);
        expect(scene.scale.x).toEqual(100);
        expect(scene.scale.y).toEqual(100);
      });
    });

    it('should resize around a non-origin fixed point when provided', () => {
      const container = document.createElement('div');
      container.style.width = '100px';
      container.style.height = '100px';
      section.querySelector('.content')!.appendChild(container);

      const timingFunctionsShim = new TimingFunctionsShim();

      // Set the timingFunctionsShim starting time to something high. Without
      // the shim, this would be the value returned by Date.now(), which has at
      // least 13 digits of precision.
      timingFunctionsShim.totalElapsedTimeMs = 1234500000;

      const scene = new Scene({
        container,
        defaultTransitionTimeMs: 0,
        desiredSpriteCapacity: 100,
        timingFunctions: timingFunctionsShim,
      });

      const canvas = container.querySelector('canvas')!;

      // Set non-standard offset. Match world origin to canvas top-left.
      scene.offset.x = 0;
      scene.offset.y = 0;

      // Stretch container horizontally, which should cause the canvas to change
      // both size and shape.
      container.style.width = '200px';

      // Resize preserving old canvas point (100,100), which was previously the
      // bottom-right corner when the canvas was 100x100 square. This equates to
      // world coordinates (1,-1).
      scene.resize({x: 100, y: 100});

      // Canvas should fill container.
      expect(canvas.width).toEqual(200 * devicePixelRatio);
      expect(canvas.height).toEqual(100 * devicePixelRatio);

      // After resize, offset should be advanced to (100,0) to preserve
      // bottom-right corner.
      expect(scene.offset.x).toEqual(100);
      expect(scene.offset.y).toEqual(0);
      expect(scene.scale.x).toEqual(100);
      expect(scene.scale.y).toEqual(100);

      // Now stretch container vertically.
      container.style.width = '100px';
      container.style.height = '200px';

      // Resize preserving old canvas point (200,100), which was previously the
      // bottom-right corner when the canvas was 200x100 stretched. As with the
      // previous resize, this equates to world coordinates (1,-1).
      scene.resize({x: 200, y: 100});

      // Canvas should fill container.
      expect(canvas.width).toEqual(100 * devicePixelRatio);
      expect(canvas.height).toEqual(200 * devicePixelRatio);

      // After resize, offset should be advanced to (0,100) to preserve
      // bottom-right corner.
      expect(scene.offset.x).toEqual(0);
      expect(scene.offset.y).toEqual(100);
      expect(scene.scale.x).toEqual(100);
      expect(scene.scale.y).toEqual(100);
    });
  });
});
