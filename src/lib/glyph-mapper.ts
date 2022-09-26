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
 * @fileoverview The GlyphMapper class is responsible for rendering glyphs to a
 * texture by using TinySDF.
 */
import {canvasToSDFData, TinySDF} from '../third_party/tiny-sdf/index';

/**
 * Where in the SDF texture to find a particular glyph. The u and v values
 * specify the lower-left hand corner in UV space. The width and height specify
 * how wide and tall the glyph is, also in UV space.
 */
export interface GlyphCoordinates {
  u: number;
  v: number;
  width: number;
  height: number;
}

/** Settings that define the behavior of a GlyphMapper instance. */
export interface GlyphMapperSettings {
  /** See https://webglstats.com/webgl/parameter/MAX_TEXTURE_SIZE */
  maxTextureSize: number;
  /** Font size in texels. Note this is relative to texture size. */
  fontSize: number;
  /** Padding around the glyph in texels. */
  buffer: number;
  /** Radius around the glyph in texels. */
  radius: number;
  /**
   * Location of the alpha scale from 0 (totally outside) to 1 (totally inside).
   */
  cutoff: number;
  /** Name of the font family to use for glyphs. */
  fontFamily: string;
  /** The font weight to use for the glyphs. */
  fontWeight: string;
}

const DEFAULT_GLYPH_FONT_SIZE_PX = 32;

/**
 * Default settings for a GlyphMapper instance.
 */
export const DEFAULT_GLYPH_MAPPER_SETTINGS: GlyphMapperSettings =
    Object.freeze({
      maxTextureSize: 2048,
      fontSize: DEFAULT_GLYPH_FONT_SIZE_PX,
      buffer: DEFAULT_GLYPH_FONT_SIZE_PX,
      radius: DEFAULT_GLYPH_FONT_SIZE_PX,
      // This default value ensures that a distance of zero coincides with the
      // edge of the glyph.
      cutoff: 1,
      fontFamily: 'monospace',
      fontWeight: 'normal',
    });

/**
 * The GlyphMapper creates and manages a signed distance field (SDF) for
 * rendering characters of text. While the GlyphMapper doesn't directly manage a
 * WebGL texture, it provides the RGB values for one via a Float32 array.
 */
export class GlyphMapper {
  /**
   * Maximum size of a texture in texels (width or height) to use for the glyph
   * SDF texture.
   */
  public readonly maxTextureSize: number;

  /**
   * Size of a glyph in texels (based on desired font size plus padding).
   */
  public readonly glyphSize: number;

  /**
   * Number of glyphs per row of glyphs in the texture.
   */
  public readonly glyphsPerRow: number;

  /**
   * Total number of glyphs that this mapper is capable of handling based on
   * available space in the texture and the size of the glyphs.
   */
  public readonly glyphCapacity: number;

  /**
   * Actual size of a mapped texture in texels. The product of glyphSize and
   * glyphsPerRow.
   */
  public readonly textureSize: number;

  /**
   * JavaScript heapspace data for the SDF texture.
   */
  public readonly textureData: Float32Array;

  /**
   * Instance of TinySDF used for generating SDF values to be copied to the
   * texture.
   */
  private readonly tinySDF: TinySDF;

  /**
   * Internal mapping to show where each glyph is in the texture.
   */
  private readonly glyphToCoordinates = new Map<string, GlyphCoordinates>();

  constructor(
      options: Partial<typeof DEFAULT_GLYPH_MAPPER_SETTINGS> =
          DEFAULT_GLYPH_MAPPER_SETTINGS,

  ) {
    // Copy default settings plus any provided settings.
    const settings =
        Object.assign({}, DEFAULT_GLYPH_MAPPER_SETTINGS, options || {});
    this.maxTextureSize = settings.maxTextureSize;
    this.tinySDF = new TinySDF(
        settings.fontSize,
        settings.buffer,
        settings.radius,
        settings.cutoff,
        settings.fontFamily,
        settings.fontWeight,
    );
    this.glyphSize = this.tinySDF.size;
    this.glyphsPerRow = Math.floor(this.maxTextureSize / this.glyphSize);
    this.glyphCapacity = this.glyphsPerRow * this.glyphsPerRow;
    this.textureSize = this.glyphsPerRow * this.glyphSize;
    this.textureData = new Float32Array(this.textureSize * this.textureSize);
  }

  /**
   * Determine of a character has already been added to the glyph map.
   */
  hasGlyph(glyph: string): boolean {
    return this.glyphToCoordinates.has(glyph);
  }

  /**
   * Return a glyph if it's already been added to the glyph map.
   */
  getGlyph(glyph: string): GlyphCoordinates|undefined {
    return this.glyphToCoordinates.get(glyph);
  }

  /**
   * Add a character to the glyph map if it's not there already then return the
   * glyph's coordinates.
   */
  addGlyph(glyph: string): GlyphCoordinates {
    const existingCoordinates = this.getGlyph(glyph);
    if (existingCoordinates) {
      return existingCoordinates;
    }

    const index = this.glyphToCoordinates.size;

    if (index >= this.glyphCapacity) {
      throw new Error('Cannot add glyph, already at capacity');
    }

    const row = Math.floor(index / this.glyphsPerRow);
    const col = index % this.glyphsPerRow;

    // The index of the first texel of this glyph.
    const textureDataOffsetIndex =
        row * this.glyphSize * this.textureSize + col * this.glyphSize;

    const {
      canvas,
      ctx,
      size,
      buffer,
      middle,
      radius,
      cutoff,
    } = this.tinySDF;

    ctx.clearRect(0, 0, size, size);
    ctx.fillText(glyph, buffer, middle);

    const sdfData = canvasToSDFData(canvas, radius, cutoff);

    // TODO(jimbo): Scan for any pixel values in the -1 to 1 range.
    // Entirely empty canvases (space character) may be filled with infinities.

    for (let i = 0; i < this.glyphSize; i++) {
      for (let j = 0; j < this.glyphSize; j++) {
        // Offset index into the sdfData array is computed by the current row
        // (i), the current column (j) and accounting for the fact that there
        // are three values per SDF data texel (horizontal, vertical and 2D
        // distance).
        const sdfDataIndex = (i * this.glyphSize + j) * 3 + 2;

        // The index of the same value in the textureData array starts at the
        // textureDataOffsetIndex, and then skips one full width per row, plus
        // the offset for the current column.
        const textureDataIndex =
            textureDataOffsetIndex + i * this.textureSize + j;

        this.textureData[textureDataIndex] = sdfData[sdfDataIndex];
      }
    }

    const coordinates = Object.freeze({
      u: col / this.glyphsPerRow,
      v: row / this.glyphsPerRow,
      width: this.glyphSize / this.textureSize,
      height: this.glyphSize / this.textureSize,
    });
    this.glyphToCoordinates.set(glyph, coordinates);

    return coordinates;
  }

  /**
   * Retrieve a list of all glyphs currently added.
   */
  get glyphs(): string[] {
    return [...this.glyphToCoordinates.keys()];
  }
}
