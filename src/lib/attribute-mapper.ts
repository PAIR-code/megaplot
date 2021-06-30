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
 * @fileoverview Defines an AttributeMapper class for mapping SpriteAttributes
 * to a data texture.
 */

import {SPRITE_ATTRIBUTES} from './sprite-attributes';

const RGBA = Object.freeze(['r', 'g', 'b', 'a']);

/**
 * How many data channels to use per texel. 1=monochrome, 3=RGB, 4=RGBA.
 */
export type DataChannelCount = 1|3|4;

/**
 * Default values for settings to the AttributeMapper constructor.
 */
const DEFAULT_ATTRIBUTE_MAPPER_SETTINGS = Object.freeze({
  /**
   * Number of data channels to use when mapping values to texels.
   */
  dataChannelCount: 4 as DataChannelCount,

  /**
   * Desired number of swatches to support. Will not exceed device limits.
   */
  desiredSwatchCapacity: Infinity,

  /**
   * List of attributes to map.
   */
  attributes: SPRITE_ATTRIBUTES,
});

/**
 * Additional settings for the AttributeMapper constructor.
 */
interface AttributeMapperSettings extends
    Partial<typeof DEFAULT_ATTRIBUTE_MAPPER_SETTINGS> {
  /**
   * Maximum width/height that AttributeMapper will try to use for mapping
   * sprite attributes. The caller should ensure that this value does not exceed
   * the device's limits.
   */
  maxTextureSize: number,
}

// 4 bytes in a 32 bit Float.
const BYTES_PER_FLOAT = 4;

export class AttributeMapper {
  /**
   * Number of data channels to use in the data texture. Should be 1, 3 or 4.
   */
  public readonly dataChannelCount: DataChannelCount;

  /**
   * Maximum size of a texture in texels (width or height).
   * See WebGL MAX_TEXTURE_SIZE.
   */
  public readonly maxTextureSize: number;

  /**
   * The desired capacity in terms of number of swatches stored. If smaller than
   * the natural size bounded by maxTextureSize, the dimensions of the mapped
   * texture will be somewhat smaller than their theoretical maximum. The caller
   * can set this to save on memory use.
   */
  public readonly desiredSwatchCapacity: number;

  /**
   * Array, frozen on construction, that lists attribute names. There are no
   * duplicates and all string values are legal GLSL variable names.
   */
  public readonly attributeComponentNames: string[];

  /**
   * Object, frozen on construction, that maps attribute names to their indices.
   */
  public readonly attributeComponentIndices:
      {[attributeComponentName: string]: number};

  /**
   * Number of texels in one swatch of the data texture. A swatch has enough
   * texels to accommodate all of the attributes.
   */
  public readonly texelsPerSwatch: number;

  /**
   * Number of swatches in one row of the data texture.
   */
  public readonly swatchesPerRow: number;

  /**
   * Number of values storable in a swatch. This will be greater than or equal
   * to the number of attributes stored, rounded to the nearest texel based on
   * the dataChannelCount.
   */
  public readonly valuesPerSwatch: number;

  /**
   * Number of bytes per swatch. Used when calculating offsets in an underlying
   * byte buffer.
   */
  public readonly bytesPerSwatch: number;

  /**
   * Number of values per row of swatches.
   */
  public readonly valuesPerRow: number;

  /**
   * Number of bytes per row of swatches.
   */
  public readonly bytesPerRow: number;

  /**
   * Width of a mapped texture in texels. The product of texelsPerSwatch and
   * swatchesPerRow.
   */
  public readonly textureWidth: number;

  /**
   * Height of a mapped texture in texels.
   */
  public readonly textureHeight: number;

  /**
   * Total number of swatches storable in the mapped texture.
   */
  public readonly totalSwatches: number;

  /**
   * Total number of texels in the mapped texture.
   */
  public readonly totalTexels: number;

  /**
   * Total number of values in the mapped texture.
   */
  public readonly totalValues: number;

  /**
   * Total number of bytes in the mapped texture.
   */
  public readonly totalBytes: number;

  /**
   * Reference to the set of SpriteAttributes.
   */
  public readonly attributes: typeof SPRITE_ATTRIBUTES;

  /**
   * Keep track by index which attributes are timestamps.
   */
  public readonly isAttributeTimestamp: boolean[];

  constructor(options: AttributeMapperSettings) {
    const settings =
        Object.assign({}, DEFAULT_ATTRIBUTE_MAPPER_SETTINGS, options || {});

    if (!isFinite(settings.maxTextureSize) &&
        !isFinite(settings.desiredSwatchCapacity)) {
      throw new Error('Cannot map attributes to texture of infinite size.');
    }

    this.dataChannelCount = settings.dataChannelCount;
    this.maxTextureSize = settings.maxTextureSize;
    this.desiredSwatchCapacity = settings.desiredSwatchCapacity;
    this.attributes = settings.attributes;

    this.attributeComponentIndices = {} as
        {[attributeComponentName: string]: number};
    this.attributeComponentNames = [];
    this.isAttributeTimestamp = [];

    // Copy attribute component names into local array and create lookup index.
    for (const attribute of this.attributes) {
      const {attributeName, components} = attribute;
      for (const component of (components || [''])) {
        const attributeComponentName = `${attributeName}${component}`;
        if (attributeComponentName in this.attributeComponentIndices) {
          throw new Error(`Duplicate attribute component name detected: ${
              attributeComponentName}`);
        }
        const index = this.attributeComponentNames.length;
        this.attributeComponentNames[index] = attributeComponentName;
        this.attributeComponentIndices[attributeComponentName] = index;
        this.isAttributeTimestamp[index] = !!attribute.isTimestamp;
      }
    }
    for (const attribute of this.attributes) {
      if (!attribute.isInterpolable) {
        continue;
      }
      const {attributeName, components} = attribute;
      for (const component of (components || [''])) {
        const attributeComponentName = `${attributeName}${component}Delta`;
        if (attributeComponentName in this.attributeComponentIndices) {
          throw new Error(`Duplicate attribute component name detected: ${
              attributeComponentName}`);
        }
        const index = this.attributeComponentNames.length;
        this.attributeComponentNames[index] = attributeComponentName;
        this.attributeComponentIndices[attributeComponentName] = index;
        this.isAttributeTimestamp[index] = !!attribute.isTimestamp;
      }
    }

    Object.freeze(this.attributeComponentIndices);
    Object.freeze(this.attributeComponentNames);
    Object.freeze(this.isAttributeTimestamp);

    // Calculate constants.
    this.texelsPerSwatch =
        Math.ceil(this.attributeComponentNames.length / this.dataChannelCount);
    this.valuesPerSwatch = this.texelsPerSwatch * this.dataChannelCount;
    this.bytesPerSwatch = this.valuesPerSwatch * BYTES_PER_FLOAT;

    this.swatchesPerRow =
        Math.floor(this.maxTextureSize / this.texelsPerSwatch);
    this.textureWidth = this.texelsPerSwatch * this.swatchesPerRow;
    this.textureHeight = this.maxTextureSize;
    this.totalSwatches = this.swatchesPerRow * this.textureHeight;

    // Apply desired capacity constraint.
    if (this.totalSwatches > this.desiredSwatchCapacity) {
      this.swatchesPerRow = Math.min(
          this.swatchesPerRow,
          Math.ceil(
              Math.sqrt(this.desiredSwatchCapacity / this.texelsPerSwatch)));
      this.textureWidth = this.texelsPerSwatch * this.swatchesPerRow;
      this.textureHeight = Math.min(
          this.textureHeight,
          Math.ceil(this.desiredSwatchCapacity / this.swatchesPerRow));
      this.totalSwatches = this.swatchesPerRow * this.textureHeight;
    }

    this.valuesPerRow = this.swatchesPerRow * this.valuesPerSwatch;
    this.bytesPerRow = this.valuesPerRow * BYTES_PER_FLOAT;

    this.totalTexels = this.textureWidth * this.textureHeight;
    this.totalValues = this.totalTexels * this.dataChannelCount;
    this.totalBytes = this.totalValues * BYTES_PER_FLOAT;

    Object.freeze(this);
  }

  /**
   * Generate GLSL code for reading texel values. Produces long lines that look
   * like these examples:
   *
   *  texelValues[0] = texture2D(dataTexture, swatchUv + vec2(0.05, 0.05));
   *  texelValues[1] = texture2D(dataTexture, swatchUv + vec2(0.15, 0.05));
   */
  generateTexelReaderGLSL(
      texelValuesVarName = 'texelValues', dataTextureVarName = 'dataTexture',
      swatchUvVarName = 'instanceSwatchUv') {
    const setters: string[] = [];
    const texelCount = this.texelsPerSwatch;
    for (let texelIndex = 0; texelIndex < texelCount; texelIndex++) {
      const x = ((texelIndex % this.texelsPerSwatch) + 0.5) /
          this.texelsPerSwatch / this.swatchesPerRow;
      const y = (Math.floor(texelIndex / this.texelsPerSwatch) + 0.5) /
          this.textureHeight;
      setters.push(
          `${texelValuesVarName}[${texelIndex}] = ` +
          `texture2D(${dataTextureVarName}, ${swatchUvVarName} + vec2(${x}, ${
              y}));`);
    }
    return setters.join('\n');
  }

  /**
   * Generate GLSL code for a replacement macro for each attribute variable.
   * Produces long lines that look like these examples (newlines added for
   * readability in this comment):
   *
   *  #define previousTransitionTimeMs() previousTexelValues[0].r
   *  #define previousPositionWorld() vec2(previousTexelValues[0].g,
   *    previousTexelValues[0].b)
   *  #define previousSizeWorld() vec2(previousTexelValues[0].a,
   *    previousTexelValues[1].r)
   *  #define previousGeometricZoom() vec2(previousTexelValues[1].g,
   *    previousTexelValues[1].b)
   *  #define previousPositionPixel() vec2(previousTexelValues[1].a,
   *    previousTexelValues[2].r)
   *
   * To work, these #define macros assume that there will be a populated array
   * of texel values sampled from the associated texture. The GLSL that
   * accomplishes that is produced by the `generateTexelReaderGLSL()` method.
   */
  generateAttributeDefinesGLSL(
      attributePrefix: string, texelValuesVarName = 'texelValues') {
    // Create a #define macro for each attribute.
    const attributeValueDefines = this.attributes.map(attribute => {
      const {attributeName} = attribute;
      const components =
          (attribute.components || [''])
              .map(component => {
                const index = this.attributeComponentIndices[`${attributeName}${
                    component}`];
                const texel = Math.floor(index / this.dataChannelCount);
                const channel = RGBA[index % this.dataChannelCount];
                return `${texelValuesVarName}[${texel}].${channel}`;
              })
              .join(', ');
      const value = attribute.components ?
          `vec${attribute.components.length}(${components})` :
          components;
      return `#define ${attributePrefix}${attributeName}() ${value}`;
    });

    // Create #define macros for the *Delta attributes of interpolable
    // attributes.
    const attributeDeltaDefines =
        this.attributes.filter(attribute => attribute.isInterpolable)
            .map(attribute => {
              const {attributeName} = attribute;
              const components =
                  (attribute.components || [''])
                      .map(component => {
                        const index = this.attributeComponentIndices[`${
                            attributeName}${component}Delta`];
                        const texel = Math.floor(index / this.dataChannelCount);
                        const channel =
                            ['r', 'g', 'b', 'a'][index % this.dataChannelCount];
                        return `${texelValuesVarName}[${texel}].${channel}`;
                      })
                      .join(', ');
              const value = attribute.components ?
                  `vec${attribute.components.length}(${components})` :
                  components;
              return `#define ${attributePrefix}${attributeName}Delta() ${
                  value}`;
            });

    const glsl =
        [...attributeValueDefines, ...attributeDeltaDefines].join('\n');

    return glsl;
  }

  /**
   * Generate GLSL for a fragment shader which will update the texel values
   * during a rebase operation.
   */
  generateRebaseFragmentGLSL(
      previousTexelValuesVarName = 'previousTexelValues',
      targetTexelValuesVarName = 'targetTexelValues',
      texelIndexVarName = 'texelIndex',
      rebaseTsVarName = 'rebaseTs',
  ) {
    const codes: {[texelIndex: number]: {[channel: string]: string}} = {};

    for (const attribute of this.attributes) {
      const {attributeName} = attribute;
      for (const component of (attribute.components || [''])) {
        const attributeComponentName = `${attributeName}${component}`;
        const index = this.attributeComponentIndices[attributeComponentName];
        const texelIndex = Math.floor(index / this.dataChannelCount);
        const channel = RGBA[index % this.dataChannelCount];

        const previousValueCode =
            `${previousTexelValuesVarName}[${texelIndex}].${channel}`;
        const targetValueCode =
            `${targetTexelValuesVarName}[${texelIndex}].${channel}`;

        if (!(texelIndex in codes)) {
          codes[texelIndex] = {};
        }

        if (attribute.isTimestamp) {
          // If this attribute is a timestamp, then all we do is copy the rebase
          // timestamp variable's value.
          const computeCode = `${rebaseTsVarName};`;
          codes[texelIndex][channel] = computeCode;
        } else if (attribute.isInterpolable) {
          // If this attribute is interpolable, then we need to lookup its
          // previous delta (velocity) value in order to compute the current
          // value and current delta.
          const attributeComponentDeltaName = `${attributeComponentName}Delta`;
          const deltaIndex =
              this.attributeComponentIndices[attributeComponentDeltaName];
          const deltaTexelIndex =
              Math.floor(deltaIndex / this.dataChannelCount);
          const deltaChannel = RGBA[deltaIndex % this.dataChannelCount];

          if (!(deltaTexelIndex in codes)) {
            codes[deltaTexelIndex] = {};
          }

          const previousDeltaCode = `${previousTexelValuesVarName}[${
              deltaTexelIndex}].${deltaChannel}`;

          codes[texelIndex][channel] =
              `computeValueAtTime(${previousValueCode}, ${previousDeltaCode}, ${
                  targetValueCode}, ${rebaseTsVarName});`;
          codes[deltaTexelIndex][deltaChannel] =
              `computeDeltaAtTime(${previousValueCode}, ${previousDeltaCode}, ${
                  targetValueCode}, ${rebaseTsVarName});`;
        } else {
          // If the attribute is neither a timestamp, nor interpolable, then the
          // code to compute its value is a simple threshold operation.
          codes[texelIndex][channel] = `computeThresholdValue(${
              previousValueCode}, ${targetValueCode}, ${rebaseTsVarName});`;
        }
      }
    }

    // Iterate through codes and build lines of GLSL.
    const lines: string[] = [];
    for (let i = 0; i < this.texelsPerSwatch; i++) {
      const channelCodes = codes[i];
      lines.push(`if (${texelIndexVarName} < ${i}.5) {`);
      for (let j = 0; j < this.dataChannelCount; j++) {
        const channel = RGBA[j];
        if (channel in channelCodes) {
          lines.push(`  gl_FragColor.${channel} = ${channelCodes[channel]}`);
        }
      }
      lines.push('  return;');
      lines.push('}');
    }

    const glsl = lines.join('\n');

    return glsl;
  }

  /**
   * Given the capacity and other computed values, produce an array of UV
   * coordinate values for the swatches.
   */
  generateInstanceSwatchUvValues() {
    const instanceSwatchUvValues = new Float32Array(this.totalSwatches * 2);
    for (let row = 0; row < this.textureHeight; row++) {
      for (let col = 0; col < this.swatchesPerRow; col++) {
        const i = (row * this.swatchesPerRow + col) * 2;
        instanceSwatchUvValues[i] = col / this.swatchesPerRow;
        instanceSwatchUvValues[i + 1] = row / this.textureHeight;
      }
    }
    return instanceSwatchUvValues;
  }
}
