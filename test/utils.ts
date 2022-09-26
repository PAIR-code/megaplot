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

/**
 * Create a <section> element inside the <article>.
 */
export function createSection(title: string): HTMLElement {
  const section = document.createElement('section');
  section.innerHTML = '<h2 class="title"></h2><div class="content"></div>';
  section.querySelector('h2')!.textContent = title;
  return section;
}

/**
 * Create a canvas element with the same characteristics as the provided canvas.
 * The copy will have the same size and styled size. Return the copy and its 2d
 * context.
 */
export function copyCanvasAndContainer(canvas: HTMLCanvasElement):
    [HTMLCanvasElement, CanvasRenderingContext2D, HTMLElement] {
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
 */
export function filledColorArray(
    pixelCount: number,
    fillColor: [number, number, number, number]): Uint8ClampedArray {
  const array = new Uint8ClampedArray(pixelCount * 4);
  for (let i = 0; i < array.length; i++) {
    array[i] = fillColor[i % fillColor.length];
  }
  return array;
}

/**
 * Compare two color arrays and return the proportion of matching pixels.
 */
export function compareColorArrays(
    actual: Uint8ClampedArray, expected: Uint8ClampedArray): number {
  let matches = 0;
  for (let i = 0; i < expected.length; i += 4) {
    if (expected[i] === actual[i] && expected[i + 1] === actual[i + 1] &&
        expected[i + 2] === actual[i + 2] &&
        expected[i + 3] === actual[i + 3]) {
      matches++;
    }
  }
  return matches / (expected.length / 4);
}
