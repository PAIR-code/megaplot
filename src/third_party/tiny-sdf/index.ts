/**
 * @license
 * Copyright © 2016-2017 Mapbox, Inc.
 * This code available under the terms of the BSD 2-Clause license.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS”
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * @fileoverview This TypeScript code is based on TinySDF JavaScript library.
 *
 * In addition to providing typings, and some rearrangement of utility
 * functions, this library exposes a new function: canvasToSDFData(). This
 * function produces a Float32 array of SDF values for use with an RGB floating
 * point texture. Unlike the original TinySDF library, which only produced a
 * single channel of Uint8 precision, the canavasToSDFData() function includes
 * the vertical and horizontal components in the red and green color channels,
 * with the true 2D distance in the blue channel.
 *
 * @see https://github.com/mapbox/tiny-sdf/blob/master/index.js
 */

const INF = 1e20;

/**
 * This implementation mirrors the upstream index.js except using TypeScript
 * class nomenclature, and the extraction of the imgDataToAlphaChannel()
 * function.
 */
export class TinySDF {
  public size: number;
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public gridOuter: Float64Array;
  public gridInner: Float64Array;
  public f: Float64Array;
  public z: Float64Array;
  public v: Uint16Array;
  public middle: number;

  /**
   * @param fontSize number Size of font to render in pixels.
   * @param buffer number Padding in pixels to leave around each glyph.
   * @param radius number Thickness of SDF field around edge.
   * @param cutoff number How far from totally outside (0) to totally inside (1)
   *  of the edge to situate the alpha scale. A cutoff of 0.5 means the edge of
   *  the shape will be assigned an alpha value of 128.
   * @param fontFamily string Name of the typeface to draw.
   * @param fontWeight string Weight of the font to draw.
   */
  constructor(
    public fontSize = 24,
    public buffer = 3,
    public radius = 8,
    public cutoff = 0.25,
    public fontFamily = 'sans-serif',
    public fontWeight = 'normal'
  ) {
    const size = (this.size = this.fontSize + this.buffer * 2);

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = size;

    const ctx = this.canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas 2d context');
    }

    this.ctx = ctx;
    this.ctx.font = `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = 'black';

    // temporary arrays for the distance transform
    this.gridOuter = new Float64Array(size * size);
    this.gridInner = new Float64Array(size * size);
    this.f = new Float64Array(size);
    this.z = new Float64Array(size + 1);
    this.v = new Uint16Array(size);

    // hack around https://bugzilla.mozilla.org/show_bug.cgi?id=737852
    this.middle = Math.round(
      (size / 2) * (navigator.userAgent.indexOf('Gecko/') >= 0 ? 1.2 : 1)
    );
  }

  draw(chr: string) {
    this.ctx.clearRect(0, 0, this.size, this.size);
    this.ctx.fillText(chr, this.buffer, this.middle);

    const imgData = this.ctx.getImageData(0, 0, this.size, this.size);

    return imgDataToAlphaChannel({ ...this, imgData });
  }
}

/**
 * Given an ImageData object retrieved from a canvas context, compute and
 * return the alpha channel as a Uint8ClampedArray.
 */
function imgDataToAlphaChannel({
  imgData,
  size,
  radius,
  cutoff,
  gridOuter,
  gridInner,
  f,
  v,
  z,
}: {
  imgData: ImageData;
  size: number;
  radius: number;
  cutoff: number;
  gridOuter: Float64Array;
  gridInner: Float64Array;
  f: Float64Array;
  v: Uint16Array;
  z: Float64Array;
}) {
  const alphaChannel = new Uint8ClampedArray(size * size);

  for (let i = 0; i < size * size; i++) {
    const a = imgData.data[i * 4 + 3] / 255; // alpha value
    gridOuter[i] =
      a === 1 ? 0 : a === 0 ? INF : Math.pow(Math.max(0, 0.5 - a), 2);
    gridInner[i] =
      a === 1 ? INF : a === 0 ? 0 : Math.pow(Math.max(0, a - 0.5), 2);
  }

  edt(gridOuter, size, size, f, v, z);
  edt(gridInner, size, size, f, v, z);

  for (let i = 0; i < size * size; i++) {
    const d = Math.sqrt(gridOuter[i]) - Math.sqrt(gridInner[i]);
    alphaChannel[i] = Math.round(255 - 255 * (d / radius + cutoff));
  }

  return alphaChannel;
}

/**
 * 2D Euclidean squared distance transform by Felzenszwalb & Huttenlocher.
 * @see https://cs.brown.edu/~pff/papers/dt-final.pdf
 */
function edt(
  data: Float64Array,
  width: number,
  height: number,
  f: Float64Array,
  v: Uint16Array,
  z: Float64Array
) {
  edtY(data, width, height, f, v, z);
  edtX(data, width, height, f, v, z);
}

function edtX(
  data: Float64Array,
  width: number,
  height: number,
  f: Float64Array,
  v: Uint16Array,
  z: Float64Array
) {
  for (let y = 0; y < height; y++) {
    edt1d(data, y * width, 1, width, f, v, z);
  }
}

function edtY(
  data: Float64Array,
  width: number,
  height: number,
  f: Float64Array,
  v: Uint16Array,
  z: Float64Array
) {
  for (let x = 0; x < width; x++) {
    edt1d(data, x, width, height, f, v, z);
  }
}

/**
 * 1D squared distance transform.
 */
function edt1d(
  grid: Float64Array,
  offset: number,
  stride: number,
  length: number,
  f: Float64Array,
  v: Uint16Array,
  z: Float64Array
) {
  let q, k, s, r;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;

  for (q = 0; q < length; q++) {
    f[q] = grid[offset + q * stride];
  }

  for (q = 1, k = 0, s = 0; q < length; q++) {
    do {
      r = v[k];
      s = (f[q] - f[r] + q * q - r * r) / (q - r) / 2;
    } while (s <= z[k] && --k > -1);

    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }

  for (q = 0, k = 0; q < length; q++) {
    while (z[k + 1] < q) {
      k++;
    }
    r = v[k];
    grid[offset + q * stride] = f[r] + (q - r) * (q - r);
  }
}

/**
 * Given a canvas, compute the horizontal, vertical and 2D signed distance
 * fields with floating point precision (range from -1 to 1). These values map
 * to the red, green and blue color channels of an RGB texture respectively.
 *
 * Keeping the component 1D distances (horizontal and vertical) in addition to
 * the Euclidian 2D distance allows for estimation when the field is stretched.
 */
export function canvasToSDFData(
  canvas: HTMLCanvasElement,
  radius: number,
  cutoff = 0.5
) {
  const { width, height } = canvas;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas 2d context');
  }

  const imgData = ctx.getImageData(0, 0, width, height);

  const gridOuterX = new Float64Array(width * height);
  const gridInnerX = new Float64Array(width * height);
  const gridOuterY = new Float64Array(width * height);
  const gridInnerY = new Float64Array(width * height);
  const gridOuter = new Float64Array(width * height);
  const gridInner = new Float64Array(width * height);
  const f = new Float64Array(width);
  const z = new Float64Array(width + 1);
  const v = new Uint16Array(width);

  for (let i = 0; i < width * height; i++) {
    const a = imgData.data[i * 4 + 3] / 255; // alpha value
    gridOuter[i] =
      gridOuterY[i] =
      gridOuterX[i] =
        a === 1 ? 0 : a === 0 ? INF : Math.pow(Math.max(0, 0.5 - a), 2);
    gridInner[i] =
      gridInnerY[i] =
      gridInnerX[i] =
        a === 1 ? INF : a === 0 ? 0 : Math.pow(Math.max(0, a - 0.5), 2);
  }

  edt(gridOuter, width, height, f, v, z);
  edt(gridInner, width, height, f, v, z);
  edtX(gridOuterX, width, height, f, v, z);
  edtX(gridInnerX, width, height, f, v, z);
  edtY(gridOuterY, width, height, f, v, z);
  edtY(gridInnerY, width, height, f, v, z);

  const finalData = new Float32Array(width * height * 3.0);

  for (let i = 0; i < width * height; i++) {
    finalData[i * 3] = Math.max(
      0,
      1 -
        ((Math.sqrt(gridOuterX[i]) - Math.sqrt(gridInnerX[i])) / radius +
          cutoff)
    );
    finalData[i * 3 + 1] = Math.max(
      0,
      1 -
        ((Math.sqrt(gridOuterY[i]) - Math.sqrt(gridInnerY[i])) / radius +
          cutoff)
    );
    finalData[i * 3 + 2] =
      1 -
      ((Math.sqrt(gridOuter[i]) - Math.sqrt(gridInner[i])) / radius + cutoff);
  }

  return finalData;
}
