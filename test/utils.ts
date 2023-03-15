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
 * @fileoverview Utility functions used by tests.
 */

import { SpriteView } from '../src/lib/generated/sprite-view';

const GREEN = [0, 255, 0, 1];
const MAGENTA = [255, 0, 255, 1];

/**
 * Create an <article> element to contain sections.
 */
export function createArticle() {
  const article = document.createElement('article');
  article.className = 'cw';

  const css = `
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
  `;

  const style = document.createElement('style');
  style.appendChild(document.createTextNode(css));
  article.appendChild(style);

  return article;
}

/**
 * Create a <section> element inside the <article>.
 */
export function createSection(title: string) {
  const section = document.createElement('section');

  const header = document.createElement('h2');
  header.className = 'title';
  header.textContent = title;
  section.appendChild(header);

  const content = document.createElement('div');
  content.className = 'content';
  section.appendChild(content);

  return { section, content };
}

/**
 * Create a canvas element with the same characteristics as the provided canvas.
 * The copy will have the same size and styled size. Return the copy and its 2d
 * context.
 */
export function copyCanvasAndContainer(
  canvas: HTMLCanvasElement
): [HTMLCanvasElement, CanvasRenderingContext2D, HTMLElement] {
  const parent = canvas.parentElement!;
  const div = document.createElement('div');
  div.style.width = parent.style.width;
  div.style.height = parent.style.height;
  const copy = document.createElement('canvas');
  copy.width = canvas.width;
  copy.height = canvas.height;
  copy.style.width = canvas.style.width;
  copy.style.height = canvas.style.height;
  const ctx = copy.getContext('2d')!;
  div.appendChild(copy);
  return [copy, ctx, div];
}

/**
 * Render a blob to a canvas.
 */
export async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
  img.src = url;
  return promise;
}

/**
 * Given a target length, and the Uint 8 RGBA channels for a pixel, create a
 * block of pixel values for testing sampled swatches of canvas data.
 *
 * @param pixelCount The number of pixels to produce.
 * @param fillColor Array of four color channel values.
 * @param convertOpacity Whether the fourth channel needs opacity-to-alpha
 * conversion (multiply by 256).
 */
export function filledColorArray(
  pixelCount: number,
  fillColor: number[],
  convertOpacity = false
): Uint8ClampedArray {
  if (fillColor.length !== 4) {
    throw RangeError('fillColor must be an array with RGB and Opacity values.');
  }
  const array = new Uint8ClampedArray(pixelCount * 4);
  const conversionFactor = convertOpacity ? 256 : 1;
  for (let i = 0; i < array.length; i += 4) {
    array[i] = fillColor[0];
    array[i + 1] = fillColor[1];
    array[i + 2] = fillColor[2];
    array[i + 3] = fillColor[3] * conversionFactor;
  }
  return array;
}

/**
 * Compare two color arrays and return the proportion of matching pixels.
 */
export function compareColorArrays(
  actual: Uint8ClampedArray,
  expected: Uint8ClampedArray
): number {
  let matches = 0;
  for (let i = 0; i < expected.length; i += 4) {
    if (
      expected[i] === actual[i] &&
      expected[i + 1] === actual[i + 1] &&
      expected[i + 2] === actual[i + 2] &&
      expected[i + 3] === actual[i + 3]
    ) {
      matches++;
    }
  }
  return matches / (expected.length / 4);
}

/**
 * Set a SpriteView's attributes to make the sprite a magenta filled square with
 * green border.
 */
export function makeGreenMagentaSquare(s: SpriteView) {
  s.PositionWorld = [0, 0];
  s.SizeWorld = 1;

  // Shape should be a square.
  s.Sides = 2;

  // Border should be 1/4 of a world unit, half the radius of the
  // of the shape.
  s.BorderPlacement = 0;
  s.BorderRadiusPixel = 0;
  s.BorderRadiusRelative = 0.25;

  s.BorderColor = GREEN;
  s.FillColor = MAGENTA;
}
