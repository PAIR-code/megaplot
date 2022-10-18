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
 * @fileoverview This app exercises and demonstrates the use of the
 * TextSelection class for creating labels. To create text strings for testing,
 * this demo enumerates the properties of the Window object.
 */
import * as d3 from 'd3';
import dat from 'dat.gui';
import Stats from 'stats.js';

import {Scene, SpriteView} from '../index';
import {SceneInternalSymbol} from '../lib/symbols';
import {AlignmentOption, VerticalAlignmentOption} from '../lib/text-selection-types';

import {TransformEvent} from './transform-event';

require('./styles.css');

import {fragmentShader} from '../lib/shaders/scene-fragment-shader';

const FRAGMENT_SHADER = fragmentShader();

const TEXT = `
For testing, here we render a bunch of text where each word represents a datum.
The text is taken from the Megaplot scene fragment shader, repeated 70 times.
This produces a corpus of over 125 thousands words (sequences of non-spaces).

By dragging the corpusOffset and/or corpusPercentage sliders, you can adjust
how much of this corpus is rendered. Each change triggers a re-bind of the
TextSelection, and so this represents a repeatable way to thrash the memory used
by Megaplot in rendering labels. This can be used to test performance at scale
and also to look for bugs in the binding logic.

////////////////////////////////////////////////////////////////////////////////

${Array(71).fill('').join(FRAGMENT_SHADER)}
`;

// Hard coded enter/exit colors to make changes highly visible.
const INIT_COLOR = [0, 255, 0, 1];
const EXIT_COLOR = [255, 0, 0, 1];

/**
 * Creates a repeating background that looks like graph paper by stacking two
 * SVG images. Together they form a 100x100 pixel grid with light blue lines
 * every 10px and thick blue lines every 100px. Useful for estimating aspects of
 * rendered sprites like size and border width.
 */
document.body.style.backgroundColor = '#012';
document.body.style.backgroundImage = `
  url('data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" height="100" width="100">
      <path fill="none" stroke="#035" stroke-opacity="1" stroke-width="1"
        d="M 0,0.5 h 100 M 0.5,0 v 100" /></svg>`)}'),
  url('data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" height="10" width="10">
      <path fill="none" stroke="#035" stroke-opacity=".2" stroke-width=".5"
        d="M 0,0.5 h 10 M 0.5,0 v 10" /></svg>`)}')`;

function main() {
  // Locate the container element.
  const container = d3.select('body').node() as HTMLElement;

  // Create a Scene to be rendered in a fresh canvas fitted to container.
  const scene = new Scene({
    container,
    defaultTransitionTimeMs: 0,
  });
  scene.scale.x /= 4;
  scene.scale.y /= 4;
  scene.offset.x = 0;
  scene.offset.y = 0;

  // Add frame rate stats panel.
  const stats = new Stats();
  stats.showPanel(0);
  Object.assign(stats.dom.style, {
    bottom: 0,
    left: null,
    position: 'absolute',
    right: 0,
    top: null,
  });
  container.appendChild(stats.dom);
  function loop() {
    stats.update();
    requestAnimationFrame(loop);
  }
  loop();

  // Configuration option for dat.GUI settings.
  const settings = {
    transitionTimeMs: 250,
    corpusOffset: 0,
    corpusPercentage: 10,
    borderPlacement: 1,
    borderRadiusRelative: .1,
    maxBatchTimeMs: 20,
    align: 'left' as AlignmentOption,
    verticalAlign: 'middle' as VerticalAlignmentOption,
    borderColor: '#000000',
    fillColor: '#ffffff',
    clearBeforeUpdate: false,
  };

  interface Word {
    row: number;
    col: number;
    start: number;
    end: number;
  }

  let col = 0;
  let row = 0;
  let word: Word|undefined = undefined;
  const corpus: Word[] = [];

  for (let index = 0; index < TEXT.length; index++) {
    const ch = TEXT.charAt(index);

    if (/\n/.test(ch)) {
      row++;
      col = 0;
    }

    if (!word) {
      if (/\S/.test(ch)) {
        word = {col, row, start: index, end: NaN};
        corpus.push(word);
      }
    } else if (/\s/.test(ch)) {
      word.end = index;
      word = undefined;
    }

    col++;
  }

  if (word) {
    word.end = TEXT.length;
  }

  const textSelection = scene.createTextSelection<Word>();

  // Function to call when GUI options are changed.
  function update() {
    if (settings.clearBeforeUpdate) {
      textSelection.clear();
    }

    const start = Math.ceil(corpus.length * settings.corpusOffset / 100);
    const end =
        start + Math.ceil(corpus.length * settings.corpusPercentage / 100);
    const words = corpus.slice(start, end);

    const top = words[0].row;

    // Create these color objects OUTSIDE of the placeSprite() callback. Calling
    // d3.color() inside a callback would thrash memory as short-lived objects
    // are created and then garbage collected.
    const borderColor = d3.color(settings.borderColor) as d3.RGBColor;
    const fillColor = d3.color(settings.fillColor) as d3.RGBColor;
    // Specify how text is determined based on data. Map alignment to settings.
    textSelection.text(({start, end}) => TEXT.substring(start, end));
    textSelection.align(() => settings.align);
    textSelection.verticalAlign(() => settings.verticalAlign);

    const placeSprite = (s: SpriteView, word: Word) => {
      s.TransitionTimeMs = settings.transitionTimeMs;

      s.PositionWorldX = word.col * .05;
      s.PositionWorldY = (word.row - top) * -.075;

      s.BorderPlacement = settings.borderPlacement;
      s.BorderRadiusRelative = settings.borderRadiusRelative;

      s.BorderColor = borderColor;
      s.FillColor = fillColor;
    };

    textSelection
        .onInit((s, word) => {
          // Initialize static properties.
          s.SizeWorldWidth = .1;
          s.SizeWorldHeight = .1;

          // Start in the right place.
          placeSprite(s, word);

          // Override color. Must be AFTER placeSprite() which also sets the
          // fill color.
          s.FillColor = INIT_COLOR;
        })
        .onEnter(placeSprite)
        .onUpdate(placeSprite)
        .onExit(s => {
          s.TransitionTimeMs = settings.transitionTimeMs;
          s.FillColor = EXIT_COLOR;
        });

    textSelection.bind(words);
  }

  const {workScheduler} = scene[SceneInternalSymbol];

  // Setup dat.GUI for controlling params.
  const gui = new dat.GUI({autoPlace: false});
  Object.assign(gui.domElement.style, {
    position: 'absolute',
    right: 0,
    top: 0,
  });
  gui.add(settings, 'transitionTimeMs', 0, 5000, 1);
  gui.add(settings, 'corpusOffset', 0, 99, 1).onChange(update);
  gui.add(settings, 'corpusPercentage', 1, 100, 1).onChange(update);
  gui.add(settings, 'maxBatchTimeMs', 1, 1000, 1).onChange(() => {
    workScheduler.maxWorkTimeMs = settings.maxBatchTimeMs;
  });
  gui.add(settings, 'borderPlacement', 0, 1, .1);
  gui.add(settings, 'borderRadiusRelative', 0, 1, .1).onChange(update);
  gui.add(settings, 'align', ['left', 'center', 'right']).onChange(update);
  gui.add(settings, 'verticalAlign', ['top', 'middle', 'bottom'])
      .onChange(update);
  gui.addColor(settings, 'borderColor').onChange(update);
  gui.addColor(settings, 'fillColor').onChange(update);
  gui.add(settings, 'clearBeforeUpdate');
  update();
  container.appendChild(gui.domElement);

  // Setup zoom behavior.
  const zoom = d3.zoom<HTMLCanvasElement, unknown>()
                   .scaleExtent([1, 200000])
                   .on('zoom', (event: TransformEvent) => {
                     const {x, y, k} = event.transform;
                     scene.scale.x = k;
                     scene.scale.y = k;
                     scene.offset.x = x;
                     scene.offset.y = y;
                   });
  d3.select(scene.canvas)
      .call(zoom)
      .call(
          zoom.transform.bind(zoom),
          d3.zoomIdentity.translate(scene.offset.x, scene.offset.y)
              .scale(scene.scale.x));

  // Setup resize observer.
  const observer = new ResizeObserver(() => {
    scene.resize();
  });
  observer.observe(scene.canvas);
}

main();
