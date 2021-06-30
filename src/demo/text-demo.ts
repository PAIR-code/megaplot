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

import {Scene} from '../index';
import {SceneInternalSymbol} from '../lib/symbols';
import {AlignmentOption, VerticalAlignmentOption} from '../lib/text-selection-types';

require('./styles.css');

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

async function main() {
  // Locate the container element.
  const container = d3.select('body').node() as HTMLElement;

  // Create a Scene to be rendered in a fresh canvas fitted to container.
  const scene = new Scene({
    container,
    defaultTransitionTimeMs: 0,
  });

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
    transitionTimeMs: 250,
    borderPlacement: 1,
    maxBatchTimeMs: 20,
    align: 'left' as AlignmentOption,
    verticalAlign: 'middle' as VerticalAlignmentOption,
    sort: 'ascending',
    facet: 'type',
    borderColor: '#000000',
    fillColor: '#ffffff',
  };

  // As a synthetic data set, use the properties on the Window object.
  const win = window as {} as {[key: string]: unknown};

  interface Property {
    name: string;
    type: string;
  }

  const properties: Property[] = Object.keys(win).map((key) => {
    return {
      name: key,
      type: typeof win[key],
    };
  });

  interface Label {
    x: number;
    y: number;
    text: string;
    property: Property;
  }

  const labels = properties.map((property) => {
    return {
      x: 0,
      y: 0,
      text: `${property.name}: ${property.type}`,
      property,
    };
  });

  const textSelection = scene.createTextSelection<Label>();

  // Function to call when GUI options are changed.
  function update() {
    const facets = new Map<string, Label[]>();

    for (const label of labels) {
      // Determine whether to face by type or first letter alphabetically.
      let facetKey = '';
      if (settings.facet === 'type') {
        facetKey = label.property.type;
      } else if (settings.facet === 'alpha') {
        facetKey = label.property.name.charAt(0).toLowerCase();
      }

      // Add this label to the appropriate group.
      if (!facets.has(facetKey)) {
        facets.set(facetKey, []);
      }
      facets.get(facetKey)!.push(label);
    }

    // Place labels into columns for display.
    let column = 0;
    const facetKeys = [...facets.keys()].sort((a, b) => a.localeCompare(b));
    for (const facetKey of facetKeys) {
      // For each facetKey, collect the labels and sort them.
      const facetLabels = facets.get(facetKey)!;
      facetLabels.sort(
          (a, b) => a.text.localeCompare(b.text) *
              (settings.sort === 'ascending' ? 1 : -1));

      // Place each labels in the current cloumn, vertically by sorted index.
      facetLabels.forEach((label, index) => {
        label.x = column * .1;
        label.y = -index * .1;
      });

      // Increment column counter for next column.
      const maxLength = d3.max(facetLabels.map(l => l.text.length));
      column += (maxLength || 0) * .5 + 1;
    }

    const borderColor = d3.color(settings.borderColor) as d3.RGBColor;
    const fillColor = d3.color(settings.fillColor) as d3.RGBColor;

    // Specify how text is determined based on data. Map alignment to settings.
    textSelection.text((label) => label.text);
    textSelection.align(() => settings.align);
    textSelection.verticalAlign(() => settings.verticalAlign);

    // Initialize static properties.
    textSelection.onInit(s => {
      s.SizeWorldWidth = .1;
      s.SizeWorldHeight = .1;

      s.BorderRadiusWorld = .2;

      s.BorderColorOpacity = 0;
      s.FillColorOpacity = 0;
    });

    // Fade out on exit.
    textSelection.onExit(s => {
      s.BorderColorOpacity = 0;
      s.FillColorOpacity = 0;
    });

    // On bind, update position and border properties based on settintgs.
    textSelection.onBind((s, d) => {
      s.TransitionTimeMs = settings.transitionTimeMs;

      s.PositionWorld = d;

      s.BorderPlacement = settings.borderPlacement;

      s.BorderColor = borderColor;
      s.FillColor = fillColor;
    });

    textSelection.bind(labels.slice(0));
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
  gui.add(settings, 'maxBatchTimeMs', 1, 1000, 1).onChange(() => {
    workScheduler.maxWorkTimeMs = settings.maxBatchTimeMs;
  });
  gui.add(settings, 'borderPlacement', 0, 1, .1).onChange(update);
  gui.add(settings, 'align', ['left', 'center', 'right']).onChange(update);
  gui.add(settings, 'verticalAlign', ['top', 'middle', 'bottom'])
      .onChange(update);
  gui.add(settings, 'sort', ['ascending', 'descending']).onChange(update);
  gui.add(settings, 'facet', ['type', 'alpha']).onChange(update);
  gui.addColor(settings, 'borderColor').onChange(update);
  gui.addColor(settings, 'fillColor').onChange(update);
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
}

main().catch(err => {
  throw err;
});
