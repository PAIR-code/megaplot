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
 * Using the dat.GUI controls, the user can dramatically increase or decrease
 * the number of sprites being rendered. This serves to test the capacity of the
 * system to execute the API user's callbacks and shuttle the resulting swatch
 * data over to the GPU for rendering.
 */
import * as d3 from 'd3';
import dat from 'dat.gui';
import Stats from 'stats.js';

import {Scene, SpriteView} from '../index';
import {InternalError} from '../lib/internal-error';
import {SceneInternalSymbol} from '../lib/symbols';

import {TransformEvent} from './transform-event';

require('./styles.css');

const MAX_COUNT = 1000;
const MAX_CAPACITY = MAX_COUNT * MAX_COUNT;

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
      <path fill="none" stroke="#058" stroke-opacity="1" stroke-width="1"
        d="M 0,0.5 h 100 M 0.5,0 v 100" /></svg>`)}'),
  url('data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" height="10" width="10">
      <path fill="none" stroke="#058" stroke-opacity=".5" stroke-width=".5"
        d="M 0,0.5 h 10 M 0.5,0 v 10" /></svg>`)}')`;

function main() {
  // Configuration option for dat.GUI settings.
  const settings = {
    total: 0,
    count: 5,
    transitionTimeMs: 2000,
    paddingPx: 0,
    maxBatchTimeMs: 20,
    borderRadiusRelative: 0.5,
    borderRadiusPx: 0,
    borderPlacement: 1,
    positionRelative: 0,
    positionMultiplier: 1.5,
    sizeMultiplier: 1,
    sizeAddPx: 0,
    geometricZoom: 0,
    maxSizePxWidth: 0,
    maxSizePxHeight: 0,
    minSizePxWidth: 0,
    minSizePxHeight: 0,
    exitOpacity: 0,
    staggerAnimation: true,
    flipZ: false,
    randomize: false,
    showText: false,
    hitTestOnMove: false,
    inclusive: true,
    brush: false,
    clearBeforeUpdate: false,
    devicePixelRatio: window.devicePixelRatio || 1,
    zoomX: true,
    zoomY: true,
    textBorder: '#ffffff',
    textFill: '#ff0000',
    textOpacity: 0.7,
  };

  // Locate the container element.
  const container = d3.select('body').node() as HTMLElement;

  // Create a Scene to be rendered in a fresh canvas fitted to container.
  const scene = new Scene({
    container,
    defaultTransitionTimeMs: 0,
    desiredSpriteCapacity: MAX_CAPACITY,
    devicePixelRatio: () => settings.devicePixelRatio,
  });

  const {workScheduler} = scene[SceneInternalSymbol];

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

    // Setup text border and fill colors.
    const textBorderColor = d3.color(settings.textBorder) as d3.RGBColor;
    const textFillColor = d3.color(settings.textFill) as d3.RGBColor;

    const placeSprite = (s: SpriteView, index: number) => {
      s.TransitionTimeMs = settings.transitionTimeMs;

      if (settings.staggerAnimation && index < settings.total) {
        s.TransitionTimeMs *= (1 + index) / settings.total;
      }

      const i = index % count;
      const j = Math.floor(index / count);
      const color = d3.color('' + colorScale(j * count + i)) as d3.RGBColor;

      s.BorderRadiusPixel = settings.borderRadiusPx;
      s.BorderRadiusRelative = settings.borderRadiusRelative;

      s.BorderColor = hoveredIndices.has(index) ? hoverColor : borderColor;

      s.BorderPlacement = settings.borderPlacement;

      s.PositionWorldX =
          settings.positionMultiplier * (1 / count * i + 1 / count / 2 - 0.5);
      s.PositionWorldY =
          settings.positionMultiplier * (1 / count * j + 1 / count / 2 - 0.5);
      s.PositionPixelX = Math.floor(3 * i / count) * settings.paddingPx;
      s.PositionPixelY = -Math.floor(3 * j / count) * settings.paddingPx;
      s.PositionRelativeX = settings.positionRelative;

      s.OrderZ = 0;
      if (settings.flipZ && index < settings.total) {
        s.OrderZ = (settings.total - index) / settings.total;
      }

      s.GeometricZoom = settings.geometricZoom;

      s.SizeWorld = 1 / count * settings.sizeMultiplier;
      s.SizePixel = settings.sizeAddPx;

      s.MaxSizePixelWidth = settings.maxSizePxWidth;
      s.MaxSizePixelHeight = settings.maxSizePxHeight;
      s.MinSizePixelWidth = settings.minSizePxWidth;
      s.MinSizePixelHeight = settings.minSizePxHeight;

      s.Sides = settings.randomize ? Math.floor(Math.random() * 6) + 1 :
                                     (i * count + j) % 6 + 1;

      s.FillColor = color;

      if (settings.showText) {
        const glyphIndex = settings.randomize ?
            Math.floor(Math.random() * glyphs.length) :
            (index + 64) % glyphs.length;
        const glyph = glyphs[glyphIndex];
        const coords = glyphMapper.getGlyph(glyph);

        if (!coords) {
          throw new InternalError('Could not find coordinates for glyph');
        }

        s.Sides = 0;
        s.ShapeTexture = coords;

        s.BorderColor = textBorderColor;
        s.BorderColorOpacity = settings.textOpacity;
        s.FillColor = textFillColor;
        s.FillColorOpacity = settings.textOpacity;
      }
    };

    selection
        .onInit((s, index) => {
          placeSprite(s, index);

          // Fade in.
          s.BorderColorOpacity = 0;
          s.FillColorOpacity = 0;
        })
        .onEnter(placeSprite)
        .onUpdate(placeSprite)
        .onExit((s) => {
          s.TransitionTimeMs = settings.transitionTimeMs;

          // Fade out.
          s.BorderColorOpacity = settings.exitOpacity;
          s.FillColorOpacity = settings.exitOpacity;
        })

    selection;

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

  const animationFolder = gui.addFolder('animation');
  animationFolder.add(settings, 'transitionTimeMs', 0, 5000, 1);
  animationFolder.add(settings, 'maxBatchTimeMs', 1, 1000, 1).onChange(() => {
    workScheduler.maxWorkTimeMs = settings.maxBatchTimeMs;
  });
  animationFolder.add(settings, 'staggerAnimation');
  animationFolder.add(settings, 'exitOpacity', 0, 1, .25).onChange(update);
  animationFolder.add(settings, 'clearBeforeUpdate');

  const systemFolder = gui.addFolder('system');
  systemFolder.add(settings, 'devicePixelRatio', 0.1, 2, .1).onChange(() => {
    scene.resize();
  });
  systemFolder.add(settings, 'zoomX');
  systemFolder.add(settings, 'zoomY');

  const positionFolder = gui.addFolder('positioning');
  positionFolder.add(settings, 'paddingPx', -100, 100, 10).onChange(update);
  positionFolder.add(settings, 'positionRelative', -3, 3, .1).onChange(update);
  positionFolder.add(settings, 'positionMultiplier', -3, 3, .1)
      .onChange(update);
  positionFolder.add(settings, 'flipZ').onChange(update);

  const borderFolder = gui.addFolder('borders');
  borderFolder.add(settings, 'borderRadiusRelative', 0, 1, .05)
      .onChange(update);
  borderFolder.add(settings, 'borderRadiusPx', 0, 100, 1).onChange(update);
  borderFolder.add(settings, 'borderPlacement', 0, 1, .1).onChange(update);

  const sizeFolder = gui.addFolder('size');
  sizeFolder.add(settings, 'sizeMultiplier', 0.1, 3, .1).onChange(update);
  sizeFolder.add(settings, 'sizeAddPx', 0, 100, 5).onChange(update);
  sizeFolder.add(settings, 'geometricZoom', 0, 1, .01).onChange(update);
  sizeFolder.add(settings, 'maxSizePxWidth', 0, 400, 10).onChange(update);
  sizeFolder.add(settings, 'maxSizePxHeight', 0, 400, 10).onChange(update);
  sizeFolder.add(settings, 'minSizePxWidth', 0, 400, 10).onChange(update);
  sizeFolder.add(settings, 'minSizePxHeight', 0, 400, 10).onChange(update);

  const textFolder = gui.addFolder('text');
  textFolder.addColor(settings, 'textBorder').onChange(update);
  textFolder.addColor(settings, 'textFill').onChange(update);
  textFolder.add(settings, 'textOpacity', 0.1, 1, 0.1).onChange(update);

  const hitTestFolder = gui.addFolder('hit test');
  hitTestFolder.add(settings, 'hitTestOnMove');
  hitTestFolder.add(settings, 'inclusive');
  hitTestFolder.add(settings, 'brush');

  gui.add(settings, 'showText').onChange(update);
  gui.add(settings, 'randomize').onChange(update);

  update();
  container.appendChild(gui.domElement);

  // Setup zoom behavior.
  const zoom = d3.zoom<HTMLCanvasElement, unknown>()
                   .scaleExtent([1, 200000])
                   .on('zoom', (event: TransformEvent) => {
                     const {x, y, k} = event.transform;
                     if (settings.zoomX) {
                       scene.scale.x = k;
                       scene.offset.x = x;
                     }
                     if (settings.zoomY) {
                       scene.scale.y = k;
                       scene.offset.y = y;
                     }
                   });
  d3.select(scene.canvas)
      .call(zoom)
      .call(
          zoom.transform.bind(zoom),
          d3.zoomIdentity.translate(scene.offset.x, scene.offset.y)
              .scale(scene.scale.x));

  // Setup hover behavior.
  d3.select(scene.canvas).on('mousemove', (event: MouseEvent) => {
    if (!settings.hitTestOnMove) {
      if (hoveredIndices.size) {
        hoveredIndices = new Set();
        update();
      }
      return;
    }

    const results = selection.hitTest({
      x: event.offsetX,
      y: event.offsetY,
      width: settings.brush ? 100 : 0,
      height: settings.brush ? 100 : 0,
      inclusive: settings.inclusive,
    });

    hoveredIndices = new Set(results);
    update();
  });

  // Setup resize observer.
  const observer = new ResizeObserver(() => {
    scene.resize();
  });
  observer.observe(scene.canvas);
}

main();
