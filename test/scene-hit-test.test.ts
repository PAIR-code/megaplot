/**
 * @license
 * Copyright 2022 Google LLC
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

import {SpriteView} from '../src/lib/generated/sprite-view';
import {Scene} from '../src/lib/scene';
import {SceneInternalSymbol} from '../src/lib/symbols';
import {TimingFunctionsShim} from '../src/lib/timing-functions-shim';

import {createArticle, createSection} from './utils';

/**
 * Tests produce visible artifacts for debugging.
 */
const article = createArticle();
document.body.appendChild(article);

describe('Scene', () => {
  describe('hitTest() inclusive', () => {
    const {section, content: sectionContent} =
        createSection('Scene::hitTest() inclusive');
    article.appendChild(section);

    for (let devicePixelRatio = 1; devicePixelRatio <= 3;
         devicePixelRatio += 0.5) {
      it(`should hit when devicePixelRatio=${devicePixelRatio}`, () => {
        const container = document.createElement('div');
        container.style.width = '200px';
        container.style.height = '200px';
        sectionContent.appendChild(container);

        const timingFunctionsShim = new TimingFunctionsShim();

        const scene = new Scene({
          container,
          defaultTransitionTimeMs: 0,
          desiredSpriteCapacity: 10,
          devicePixelRatio,
          timingFunctions: timingFunctionsShim,
        });

        // Create four overlapping sprites.
        const sprites = [
          [-.2, .2],   // Index 0 = Top left.
          [.2, .2],    // Index 1 = Top right.
          [-.2, -.2],  // Index 2 = Bottom left.
          [.2, -.2],   // Index 3 = Bottom right.
        ].map((position) => {
          const sprite = scene.createSprite();
          sprite.enter((s: SpriteView) => {
            s.BorderColorOpacity = .4;

            // Place the border entirely outside the shape. It is only because
            // of this that the bounding boxes of the sprites are large enough
            // for the ensuing hitTest() invocations to hit them.
            s.BorderPlacement = 1

            s.BorderRadiusPixel = 10;
            s.FillColor = [255, 255, 255, .4];
            s.PositionWorld = position;
            s.Sides = 1;
            s.SizeWorld = .5;
          })
          return sprite;
        });
        timingFunctionsShim.runAnimationFrameCallbacks(3);

        // Grid of nine tests, like a tic-tac-toe board.
        const tests = [
          // Top row.
          {
            params: {x: 10, y: 10, width: 0, height: 0, inclusive: true},
            expected: [0, -1, -1, -1],
          },
          {
            params: {x: 100, y: 10, width: 0, height: 0, inclusive: true},
            expected: [0, 1, -1, -1],
          },
          {
            params: {x: 190, y: 10, width: 0, height: 0, inclusive: true},
            expected: [-1, 1, -1, -1],
          },

          // Middle row.
          {
            params: {x: 10, y: 100, width: 0, height: 0, inclusive: true},
            expected: [0, -1, 2, -1],
          },
          {
            params: {x: 100, y: 100, width: 0, height: 0, inclusive: true},
            expected: [0, 1, 2, 3],
          },
          {
            params: {x: 190, y: 100, width: 0, height: 0, inclusive: true},
            expected: [-1, 1, -1, 3],
          },

          // Bottom row.
          {
            params: {x: 10, y: 190, width: 0, height: 0, inclusive: true},
            expected: [-1, -1, 2, -1],
          },
          {
            params: {x: 100, y: 190, width: 0, height: 0, inclusive: true},
            expected: [-1, -1, 2, 3],
          },
          {
            params: {x: 190, y: 190, width: 0, height: 0, inclusive: true},
            expected: [-1, -1, -1, 3],
          },
        ];

        for (const {params, expected} of tests) {
          const res = scene.hitTest({...params, sprites});
          expect(res[0]).toBeCloseTo(expected[0], 0);
          expect(res[1]).toBeCloseTo(expected[1], 0);
          expect(res[2]).toBeCloseTo(expected[2], 0);
          expect(res[3]).toBeCloseTo(expected[3], 0);
        }

        // Cleanup REGL resources.
        scene[SceneInternalSymbol].regl.destroy();
      });
    }
  });

  describe('hitTest() exclusive', () => {
    const {section, content: sectionContent} =
        createSection('Scene::hitTest() exclusive');
    article.appendChild(section);

    for (let devicePixelRatio = 1; devicePixelRatio <= 3;
         devicePixelRatio += 0.5) {
      it(`should hit when devicePixelRatio=${devicePixelRatio}`, () => {
        const container = document.createElement('div');
        container.style.width = '200px';
        container.style.height = '200px';
        sectionContent.appendChild(container);

        const timingFunctionsShim = new TimingFunctionsShim();

        const scene = new Scene({
          container,
          defaultTransitionTimeMs: 0,
          desiredSpriteCapacity: 10,
          devicePixelRatio,
          timingFunctions: timingFunctionsShim,
        });

        // Create four overlapping sprites.
        const sprites = [
          [-.25, .25],   // Index 0 = Top left.
          [.25, .25],    // Index 1 = Top right.
          [-.25, -.25],  // Index 2 = Bottom left.
          [.25, -.25],   // Index 3 = Bottom right.
        ].map((position) => {
          const sprite = scene.createSprite();
          sprite.enter((s: SpriteView) => {
            s.BorderColorOpacity = .4;
            s.BorderRadiusPixel = 10;
            s.FillColor = [255, 255, 255, .4];
            s.PositionWorld = position;
            s.Sides = 1;
            s.SizeWorld = .4;
          })
          return sprite;
        });
        timingFunctionsShim.runAnimationFrameCallbacks(3);

        // Grid of nine tests, like a tic-tac-toe board.
        const tests = [
          // Top row.
          {
            params: {x: 5, y: 5, width: 190, height: 90, inclusive: false},
            expected: [0, 1, -1, -1],
          },
          // Middle row.
          {
            params: {x: 5, y: 55, width: 190, height: 90, inclusive: false},
            expected: [-1, -1, -1, -1],
          },
          // Bottom row.
          {
            params: {x: 5, y: 105, width: 190, height: 90, inclusive: false},
            expected: [-1, -1, 2, 3],
          },
          // Left column.
          {
            params: {x: 5, y: 5, width: 90, height: 190, inclusive: false},
            expected: [0, -1, 2, -1],
          },
          // Center column.
          {
            params: {x: 55, y: 5, width: 90, height: 190, inclusive: false},
            expected: [-1, -1, -1, -1],
          },
          // Right column.
          {
            params: {x: 105, y: 5, width: 90, height: 190, inclusive: false},
            expected: [-1, 1, -1, 3],
          },
          // All.
          {
            params: {x: 5, y: 5, width: 190, height: 190, inclusive: false},
            expected: [0, 1, 2, 3],
          },
        ];

        for (const {params, expected} of tests) {
          const res = scene.hitTest({...params, sprites});
          expect(res[0]).toBeCloseTo(expected[0], 0);
          expect(res[1]).toBeCloseTo(expected[1], 0);
          expect(res[2]).toBeCloseTo(expected[2], 0);
          expect(res[3]).toBeCloseTo(expected[3], 0);
        }

        // Cleanup REGL resources.
        scene[SceneInternalSymbol].regl.destroy();
      });
    }
  });
});
