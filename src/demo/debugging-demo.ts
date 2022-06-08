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
 * @fileoverview This app exercises various aspects of Megaplot under load.
 * Using the dat.gui controls, the user can dramatically increase or decrease
 * the number of sprites being rendered. This serves to test the capacity of the
 * system to execute the API user's callbacks and shuttle the resulting swatch
 * data over to the GPU for rendering.
 */
import * as d3 from 'd3';
import dat from 'dat.gui';
import Stats from 'stats.js';

import {Scene} from '../index';
import {SceneInternalSymbol} from '../lib/symbols';

require('./styles.css');

const MAX_COUNT = 1000;
const MAX_CAPACITY = MAX_COUNT * MAX_COUNT;

/**
 * Creates a repeating background that looks like graph paper by stacking two
 * SVG images. Together they form a 100x100 pixel grid with light blue lines
 * every 10px and thick blue lines every 100px. Useful fo estimating aspects of
 * rendered sprites like size and border width.
 */
document.body.style.background = `
  url('data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" height="100" width="100">
      <path fill="none" stroke="blue" stroke-opacity="1" stroke-width="1"
        d="M 0,0.5 h 100 M 0.5,0 v 100" /></svg>`)}'),
  url('data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" height="10" width="10">
      <path fill="none" stroke="blue" stroke-opacity="0.2" stroke-width="0.5"
        d="M 0,0.5 h 10 M 0.5,0 v 10" /></svg>`)}')`;

/**
 * Border and fill color for text glyphs. Using D3 color objects to exercise
 * compatibility with D3.
 */
const TEXT_BORDER = d3.color('black') as d3.RGBColor;
const TEXT_FILL = d3.color('white') as d3.RGBColor;

async function main() {
  // Locate the container element.
  const container = d3.select('body').node() as HTMLElement;

  // Create a Scene to be rendered in a fresh canvas fitted to container.
  const scene = new Scene({
    container,
    defaultTransitionTimeMs: 0,
    desiredSpriteCapacity: MAX_CAPACITY,
  });

  const {workScheduler} = scene[SceneInternalSymbol];

  // Add framerate stats panel.
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
    total: 0,
    count: 1,
    transitionTimeMs: 2000,
    paddingPx: 0,
    maxBatchTimeMs: 20,
    borderRadiusWorld: 0.25,
    borderRadiusPx: 0.25,
    borderPlacement: 0,
    positionRelative: 0,
    positionMultiplier: 1,
    sizeMultiplier: 1,
    geometricZoom: 0,
    maxSizePxWidth: 0,
    maxSizePxHeight: 0,
    minSizePxWidth: 0,
    minSizePxHeight: 0,
    randomize: false,
    showText: false,
    hitTestOnMove: false,
    inclusive: true,
    brush: false,
    clearBeforeUpdate: false,
  };

  const colors = d3.schemeCategory10;
  const borderColor = d3.color('rgba(255,0,0,0.5)') as d3.RGBColor;
  const hoverColor = d3.color('rgba(0,0,0,1.0)') as d3.RGBColor;

  const glyphMapper = scene[SceneInternalSymbol].glyphMapper;
  const glyphs = glyphMapper.glyphs;

  const selection = scene.createSelection<number>();

  const indices: number[] =
      (new Array(MAX_COUNT * MAX_COUNT)).fill(0).map((_, i) => i);

  let hoveredIndices = new Set<number>();

  // Function to call when GUI options are changed.
  function update() {
    if (settings.clearBeforeUpdate) {
      selection.clear();
    }

    const count = settings.count;
    settings.total = count * count;

    // Setup a rainbow color scale.
    const colorScale = d3.scaleLinear(colors).domain(
        d3.range(0, count * count, count * count / colors.length));

    selection.onInit(s => {
      s.BorderColorOpacity = 0;
      s.FillColorOpacity = 0;
    });

    selection.onExit(s => {
      s.BorderColorOpacity = 0;
      s.FillColorOpacity = 0;
    });

    selection.onBind((s, index) => {
      s.TransitionTimeMs = settings.transitionTimeMs;

      const i = index % count;
      const j = Math.floor(index / count);
      const color = d3.color('' + colorScale(j * count + i)) as d3.RGBColor;

      s.BorderRadiusWorld = settings.borderRadiusWorld;
      s.BorderRadiusPixel = settings.borderRadiusPx;

      s.BorderColor = hoveredIndices.has(index) ? hoverColor : borderColor;

      s.BorderPlacement = settings.borderPlacement;

      s.PositionWorldX =
          settings.positionMultiplier * (1 / count * i + 1 / count / 2 - 0.5);
      s.PositionWorldY =
          settings.positionMultiplier * (1 / count * j + 1 / count / 2 - 0.5);
      s.PositionPixelX = Math.floor(3 * i / count) * settings.paddingPx;
      s.PositionPixelY = -Math.floor(3 * j / count) * settings.paddingPx;
      s.PositionRelativeX = settings.positionRelative;

      s.GeometricZoom = settings.geometricZoom;

      s.SizeWorld = 1 / count * settings.sizeMultiplier;

      s.MaxSizePixelWidth = settings.maxSizePxWidth;
      s.MaxSizePixelHeight = settings.maxSizePxHeight;
      s.MinSizePixelWidth = settings.minSizePxWidth;
      s.MinSizePixelHeight = settings.minSizePxHeight;

      s.Sides = settings.randomize ? Math.floor(Math.random() * 6) + 1 : 1;

      s.FillColor = color;

      if (settings.showText) {
        const glyphIndex = settings.randomize ?
            Math.floor(Math.random() * glyphs.length) :
            index % glyphs.length;
        const glyph = glyphs[glyphIndex];
        const coords = glyphMapper.getGlyph(glyph)!;

        s.Sides = 0;
        s.ShapeTexture = coords;

        s.BorderColor = TEXT_BORDER;
        s.FillColor = TEXT_FILL;
      }
    });

    selection.bind(indices.slice(0, count * count));
  }

  // Setup dat.GUI for controlling params.
  const gui = new dat.GUI({autoPlace: false});
  Object.assign(gui.domElement.style, {
    position: 'absolute',
    right: 0,
    top: 0,
  });
  gui.add(settings, 'total', 0, MAX_COUNT * MAX_COUNT).listen();
  gui.add(settings, 'count', 1, MAX_COUNT, 1).onChange(update);
  gui.add(settings, 'transitionTimeMs', 0, 5000, 1);
  gui.add(settings, 'paddingPx', -100, 100, 10).onChange(update);
  gui.add(settings, 'maxBatchTimeMs', 1, 1000, 1).onChange(() => {
    workScheduler.maxWorkTimeMs = settings.maxBatchTimeMs;
  });
  gui.add(settings, 'borderRadiusWorld', 0, 1, .05).onChange(update);
  gui.add(settings, 'borderRadiusPx', 0, 100, 1).onChange(update);
  gui.add(settings, 'borderPlacement', 0, 1, .1).onChange(update);
  gui.add(settings, 'positionRelative', -3, 3, .1).onChange(update);
  gui.add(settings, 'positionMultiplier', -3, 3, .1).onChange(update);
  gui.add(settings, 'sizeMultiplier', 0.1, 3, .1).onChange(update);
  gui.add(settings, 'geometricZoom', 0, 1, .01).onChange(update);
  gui.add(settings, 'maxSizePxWidth', 0, 400, 10).onChange(update);
  gui.add(settings, 'maxSizePxHeight', 0, 400, 10).onChange(update);
  gui.add(settings, 'minSizePxWidth', 0, 400, 10).onChange(update);
  gui.add(settings, 'minSizePxHeight', 0, 400, 10).onChange(update);
  gui.add(settings, 'randomize').onChange(update);
  gui.add(settings, 'showText').onChange(update);
  gui.add(settings, 'hitTestOnMove');
  gui.add(settings, 'inclusive');
  gui.add(settings, 'brush');
  gui.add(settings, 'clearBeforeUpdate');
  update();
  container.appendChild(gui.domElement);

  // Setup zoom behavior.
  const zoom = d3.zoom<HTMLCanvasElement, unknown>()
                   .scaleExtent([1, 200000])
                   .on('zoom', (event) => {
                     const {x, y, k} = event.transform;
                     scene.scale.x = k;
                     scene.scale.y = k;
                     scene.offset.x = x;
                     scene.offset.y = y;
                   });
  d3.select(scene.canvas)
      .call(zoom)
      .call(
          zoom.transform,
          d3.zoomIdentity.translate(scene.offset.x, scene.offset.y)
              .scale(scene.scale.x));

  container.addEventListener('mousemove', (event) => {
    if (!settings.hitTestOnMove) {
      if (hoveredIndices.size) {
        hoveredIndices = new Set();
        update();
      }
      return;
    }

    const results = selection.hitTest({
      x: event.x,
      y: event.y,
      width: settings.brush ? 100 : 0,
      height: settings.brush ? 100 : 0,
      inclusive: settings.inclusive,
    });

    hoveredIndices = new Set(results);
    update();
  });
}

main().catch(err => {
  throw err;
});
