/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('regl')) :
    typeof define === 'function' && define.amd ? define(['exports', 'regl'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.megaplot = global.megaplot || {}, global.REGL));
}(this, (function (exports, REGL) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var REGL__default = /*#__PURE__*/_interopDefaultLegacy(REGL);

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

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
     * @fileoverview Attributes of a Sprite.
     */
    /**
     * This is the complete list of attributes that each Sprite has. These are used
     * to generate GLSL code to unpack values from the input data textures. These
     * are also used when computing instantaneous values to flash to data textures
     * during the rebase operation.
     *
     * Notes:
     *  - X coordinates are always oriented positive=right.
     *  - Y coordinates are positive=up for World coordinates.
     *  - Y coordinates are positive=down for Pixel coordinates.
     *  - Opacity is named as it is for compatibility with D3 color objects.
     */
    const SPRITE_ATTRIBUTES = [
        /**
         * Time in milliseconds that the sprite's other attributes should take to
         * animate to their target states. Should not be negative. A value of zero
         * means that the sprite should achieve its target state immediately.
         */
        {
            attributeName: 'TransitionTimeMs',
            isTimestamp: true,
        },
        /**
         * Sprite position and size in world coordinates.
         */
        {
            attributeName: 'PositionWorld',
            isInterpolable: true,
            components: ['X', 'Y'],
        },
        {
            attributeName: 'SizeWorld',
            isInterpolable: true,
            isBroadcastable: true,
            components: ['Width', 'Height'],
        },
        /**
         * By default, when rendering, sprites are stacked such that later allocated
         * sprites appear on top of earlier sprites. This guarantees that when sprites
         * overlap and have partially transparent pixels, the pixel values blend
         * appropriately.
         *
         * However, sometimes it's beneficial to override the Z ordering, even if that
         * could cause blending issues. For example, when a user hovers over a point,
         * it could make sense to raise that sprite to the top.
         *
         * The OrderZ attribute allows the API user to override the default stacking.
         * If specified, this value should be in the range 0-1. Any sprite with a
         * specified non-zero OrderZ will be rendered on top of any sprites with
         * unspecified OrderZ. When two sprites both have OrderZs set, the one with
         * the higher value will be on top.
         */
        {
            attributeName: 'OrderZ',
            isInterpolable: true,
            minValue: 0,
            maxValue: 1,
        },
        /**
         * Amount to zoom sprite sizes based on current scale. In the shaders, this
         * formula is used:
         *
         *   currentSizeWorld * exp(log(scale) * (1. - currentGeometricZoom))
         *
         * The default value of 0 means to linearly scale the world size with the
         * current scale value. A value of 1 means to not scale at all. This would
         * effectively interpret the world coordinate as a pixel value (1=1).
         *
         * Values in between 0 and 1 signal a partial scaling of sizes based on
         * zoom level. This produces an intermediate effect such that a dense
         * scatter plot's points grow somewhat, but not so much that they occlude
         * when zoomed far in.
         *
         * Geometric zoom is applied before adding SizePixel values, and before
         * capping to MaxSizePixel or MinSizePixel.
         *
         * This behavior is based on Benjamin Schmidt's approach (linked below),
         * except that it uses a default value of zero. This design choice
         * preserves the sprite initialization and memory restoration procedures
         * of flashing zeros to the underlyng buffers' swatches.
         *
         * https://observablehq.com/@bmschmidt/zoom-strategies-for-huge-scatterplots-with-three-js
         */
        {
            attributeName: 'GeometricZoom',
            isInterpolable: true,
            isBroadcastable: true,
            components: ['X', 'Y'],
        },
        /**
         * Sprite offset position in pixels.
         */
        {
            attributeName: 'PositionPixel',
            isInterpolable: true,
            components: ['X', 'Y'],
        },
        /**
         * Additional width and height in pixels.
         */
        {
            attributeName: 'SizePixel',
            isInterpolable: true,
            isBroadcastable: true,
            components: ['Width', 'Height'],
        },
        /**
         * Maximum size when rendered in pixels. Any non-positive value is treated
         * as unbounded.
         */
        {
            attributeName: 'MaxSizePixel',
            isInterpolable: true,
            isBroadcastable: true,
            components: ['Width', 'Height'],
        },
        /**
         * Minimum size when rendered in pixels. Any non-positive value is treated
         * as unbounded.
         */
        {
            attributeName: 'MinSizePixel',
            isInterpolable: true,
            isBroadcastable: true,
            components: ['Width', 'Height'],
        },
        /**
         * Sprite offset position in multiples of the rendered size. Importantly, this
         * additional position is computed after Max and Min pixel sizes are applied.
         * This is principally used when positioning text label glyphs so that they
         * remain in place during scaling.
         */
        {
            attributeName: 'PositionRelative',
            isInterpolable: true,
            components: ['X', 'Y'],
        },
        /**
         * When rendered, each sprite is presented to the fragment shader a
         * rectangle (an instanced quad of two triangles joined at the diagonal).
         * You can think of this like a bounding box. Within those bounds
         * different fragment-shader rendered shapes are possible.
         *
         * The Sides attribute specifies how the fragment shader should compute the
         * signed 'distance' of each pixel.
         *
         * The following table describes the range of behaviors:
         *   s == 0     : Use SDF texture coordinates.
         *   0 > s > 1  : Reserved / Undefined.
         *   s == 1     : Circle / Ellipse.
         *   1 > s > 2  : Reserved / Undefined.
         *   s == 2     : Filled Square / Rectangle.
         *   s > 2      : Regular Polygon.
         *
         * Regular Polygons are rendered with the first point pointing upwards. For
         * example, the value 3 creates a unilateral triangle pointed up. The
         * value 4 creates a square pointed up--that is, with sides at 45 degrees
         * to the Cartesian plane (like a diamond).
         */
        {
            attributeName: 'Sides',
        },
        /**
         * When Sides == 0, these coordinates describe where within the SDF texture to
         * sample for this sprite's shape. (Used for glyphs of text).
         */
        {
            attributeName: 'ShapeTexture',
            components: ['U', 'V', 'Width', 'Height'],
        },
        /**
         * The border can have width in both pixel coordinates, and relative to the
         * size of the sprite (width or height, whichever is smaller). These are
         * additive. Note that the size of the border does not affect the size of the
         * sprite, so there is no conflict here.
         */
        {
            attributeName: 'BorderRadiusPixel',
            isInterpolable: true,
        },
        {
            attributeName: 'BorderRadiusRelative',
            isInterpolable: true,
        },
        /**
         * Placement of the border from totally inside the shape (0) to totally
         * outside the shape (1). A value of 0.5 places the center of the border
         * exactly on the line between inside and outside the shape.
         */
        {
            attributeName: 'BorderPlacement',
            isInterpolable: true,
        },
        {
            attributeName: 'BorderColor',
            isInterpolable: true,
            components: ['R', 'G', 'B', 'Opacity'],
        },
        /**
         * Fill blend determines whether the fill should be entirely defined by
         * the fill color (0), or entirely by the sampled atlas texture (1).
         */
        {
            attributeName: 'FillBlend',
            isInterpolable: true,
        },
        {
            attributeName: 'FillColor',
            isInterpolable: true,
            components: ['R', 'G', 'B', 'Opacity'],
        },
        {
            attributeName: 'FillTexture',
            components: ['U', 'V', 'Width', 'Height'],
        },
    ];

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
    const RGBA = Object.freeze(['r', 'g', 'b', 'a']);
    /**
     * Default values for settings to the AttributeMapper constructor.
     */
    const DEFAULT_ATTRIBUTE_MAPPER_SETTINGS = Object.freeze({
        /**
         * Number of data channels to use when mapping values to texels.
         */
        dataChannelCount: 4,
        /**
         * Desired number of swatches to support. Will not exceed device limits.
         */
        desiredSwatchCapacity: Infinity,
        /**
         * List of attributes to map.
         */
        attributes: SPRITE_ATTRIBUTES,
    });
    // 4 bytes in a 32 bit Float.
    const BYTES_PER_FLOAT = 4;
    class AttributeMapper {
        constructor(options) {
            const settings = Object.assign({}, DEFAULT_ATTRIBUTE_MAPPER_SETTINGS, options || {});
            if (!isFinite(settings.maxTextureSize) &&
                !isFinite(settings.desiredSwatchCapacity)) {
                throw new RangeError('Cannot map attributes to texture of infinite size');
            }
            this.dataChannelCount = settings.dataChannelCount;
            this.maxTextureSize = settings.maxTextureSize;
            this.desiredSwatchCapacity = settings.desiredSwatchCapacity;
            this.attributes = settings.attributes;
            this.attributeComponentIndices = {};
            this.attributeComponentNames = [];
            this.componentToAttributeMap = {};
            this.isAttributeTimestamp = [];
            // Copy attribute component names into local array and create lookup index.
            for (const attribute of this.attributes) {
                const { attributeName, components } = attribute;
                for (const component of (components || [''])) {
                    const attributeComponentName = `${attributeName}${component}`;
                    if (attributeComponentName in this.attributeComponentIndices) {
                        throw new Error(`Duplicate attribute component name detected: ${attributeComponentName}`);
                    }
                    const index = this.attributeComponentNames.length;
                    this.attributeComponentNames[index] = attributeComponentName;
                    this.attributeComponentIndices[attributeComponentName] = index;
                    this.componentToAttributeMap[attributeComponentName] = attribute;
                    this.isAttributeTimestamp[index] = !!attribute.isTimestamp;
                }
            }
            for (const attribute of this.attributes) {
                if (!attribute.isInterpolable) {
                    continue;
                }
                const { attributeName, components } = attribute;
                for (const component of (components || [''])) {
                    const attributeComponentName = `${attributeName}${component}Delta`;
                    if (attributeComponentName in this.attributeComponentIndices) {
                        throw new Error(`Duplicate attribute component name detected: ${attributeComponentName}`);
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
                this.swatchesPerRow = Math.min(this.swatchesPerRow, Math.ceil(Math.sqrt(this.desiredSwatchCapacity / this.texelsPerSwatch)));
                this.textureWidth = this.texelsPerSwatch * this.swatchesPerRow;
                this.textureHeight = Math.min(this.textureHeight, Math.ceil(this.desiredSwatchCapacity / this.swatchesPerRow));
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
        generateTexelReaderGLSL(texelValuesVarName = 'texelValues', dataTextureVarName = 'dataTexture', swatchUvVarName = 'instanceSwatchUv') {
            const setters = [];
            const texelCount = this.texelsPerSwatch;
            for (let texelIndex = 0; texelIndex < texelCount; texelIndex++) {
                const x = ((texelIndex % this.texelsPerSwatch) + 0.5) /
                    this.texelsPerSwatch / this.swatchesPerRow;
                const y = (Math.floor(texelIndex / this.texelsPerSwatch) + 0.5) /
                    this.textureHeight;
                setters.push(`${texelValuesVarName}[${texelIndex}] = ` +
                    `texture2D(${dataTextureVarName}, ${swatchUvVarName} + vec2(${x}, ${y}));`);
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
        generateAttributeDefinesGLSL(attributePrefix, texelValuesVarName = 'texelValues') {
            // Create a #define macro for each attribute.
            const attributeValueDefines = this.attributes.map(attribute => {
                const { attributeName } = attribute;
                const components = (attribute.components || [''])
                    .map(component => {
                    const index = this.attributeComponentIndices[`${attributeName}${component}`];
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
            const attributeDeltaDefines = this.attributes.filter(attribute => attribute.isInterpolable)
                .map(attribute => {
                const { attributeName } = attribute;
                const components = (attribute.components || [''])
                    .map(component => {
                    const index = this.attributeComponentIndices[`${attributeName}${component}Delta`];
                    const texel = Math.floor(index / this.dataChannelCount);
                    const channel = ['r', 'g', 'b', 'a'][index % this.dataChannelCount];
                    return `${texelValuesVarName}[${texel}].${channel}`;
                })
                    .join(', ');
                const value = attribute.components ?
                    `vec${attribute.components.length}(${components})` :
                    components;
                return `#define ${attributePrefix}${attributeName}Delta() ${value}`;
            });
            const glsl = [...attributeValueDefines, ...attributeDeltaDefines].join('\n');
            return glsl;
        }
        /**
         * Generate GLSL for a fragment shader which will update the texel values
         * during a rebase operation.
         */
        generateRebaseFragmentGLSL(previousTexelValuesVarName = 'previousTexelValues', targetTexelValuesVarName = 'targetTexelValues', texelIndexVarName = 'texelIndex', rebaseTsVarName = 'rebaseTs') {
            const codes = {};
            for (const attribute of this.attributes) {
                const { attributeName } = attribute;
                for (const component of (attribute.components || [''])) {
                    const attributeComponentName = `${attributeName}${component}`;
                    const index = this.attributeComponentIndices[attributeComponentName];
                    const texelIndex = Math.floor(index / this.dataChannelCount);
                    const channel = RGBA[index % this.dataChannelCount];
                    const previousValueCode = `${previousTexelValuesVarName}[${texelIndex}].${channel}`;
                    const targetValueCode = `${targetTexelValuesVarName}[${texelIndex}].${channel}`;
                    if (!(texelIndex in codes)) {
                        codes[texelIndex] = {};
                    }
                    if (attribute.isTimestamp) {
                        // If this attribute is a timestamp, then all we do is copy the rebase
                        // timestamp variable's value.
                        const computeCode = `${rebaseTsVarName};`;
                        codes[texelIndex][channel] = computeCode;
                    }
                    else if (attribute.isInterpolable) {
                        // If this attribute is interpolable, then we need to lookup its
                        // previous delta (velocity) value in order to compute the current
                        // value and current delta.
                        const attributeComponentDeltaName = `${attributeComponentName}Delta`;
                        const deltaIndex = this.attributeComponentIndices[attributeComponentDeltaName];
                        const deltaTexelIndex = Math.floor(deltaIndex / this.dataChannelCount);
                        const deltaChannel = RGBA[deltaIndex % this.dataChannelCount];
                        if (!(deltaTexelIndex in codes)) {
                            codes[deltaTexelIndex] = {};
                        }
                        const previousDeltaCode = `${previousTexelValuesVarName}[${deltaTexelIndex}].${deltaChannel}`;
                        codes[texelIndex][channel] =
                            `computeValueAtTime(${previousValueCode}, ${previousDeltaCode}, ${targetValueCode}, ${rebaseTsVarName});`;
                        codes[deltaTexelIndex][deltaChannel] =
                            `computeDeltaAtTime(${previousValueCode}, ${previousDeltaCode}, ${targetValueCode}, ${rebaseTsVarName});`;
                    }
                    else {
                        // If the attribute is neither a timestamp, nor interpolable, then the
                        // code to compute its value is a simple threshold operation.
                        codes[texelIndex][channel] = `computeThresholdValue(${previousValueCode}, ${targetValueCode}, ${rebaseTsVarName});`;
                    }
                }
            }
            // Iterate through codes and build lines of GLSL.
            const lines = [];
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
     * @fileoverview A CallbackTriggerPoint object maintains an x and y coordinate
     * pair and invokes a provided callback whenever either are set. Used for the
     * offset and scale properties.
     */
    class CallbackTriggerPoint {
        constructor(callbackFn) {
            this.callbackFn = callbackFn;
            this.xValue = 0;
            this.yValue = 0;
        }
        get x() {
            return this.xValue;
        }
        /**
         * Sets the x coordinate of this point.
         * @param x The x value to set (cannot be NaN).
         * @throws RangeError If the x value passed is NaN.
         */
        set x(x) {
            if (isNaN(+x)) {
                throw new RangeError('x cannot be NaN');
            }
            this.xValue = x;
            this.callbackFn();
        }
        get y() {
            return this.yValue;
        }
        /**
         * Sets the y coordinate of this point.
         * @param y The y value to set (cannot be NaN).
         * @throws RangeError If the y value passed is NaN.
         */
        set y(y) {
            if (isNaN(+y)) {
                throw new RangeError('y cannot be NaN');
            }
            this.yValue = y;
            this.callbackFn();
        }
    }

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
     * @fileoverview Provides a template tag for marking strings of GLSL code.
     */
    /**
     * Template tag to mark GLSL code fragments, for syntax highlighting in editors
     * which that it.
     */
    function glsl(strings, ...args) {
        const interleaved = [];
        for (let i = 0; i < args.length; i++) {
            interleaved.push(strings[i], `${args[i]}`);
        }
        interleaved.push(strings[strings.length - 1]);
        return interleaved.join('');
    }

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
     * List of types for creating vectorized versions of functions.
     */
    const GEN_TYPES = ['float', 'vec2', 'vec3', 'vec4'];
    /**
     * Range function. Inverse of GLSL built in mix() function.
     */
    function range() {
        return glsl `
float range(float x, float y, float a) {
  return (a - x) / (y - x);
}
`;
    }
    /**
     * Ease an input value t between 0 and 1 smoothly.
     */
    function cubicEaseInOut() {
        return glsl `
float cubicEaseInOut(float t) {
  return t < 0.5 ? 4.0 * t * t * t :
    4.0 * (t - 1.0) * (t - 1.0) * (t - 1.0) + 1.0;
}
`;
    }
    /**
     * Given a starting value, velocity and an ending value, compute the
     * instantaneous current value.
     *
     * These functions make use of the following macro variables which are presumed
     * to already be defined and in scope:
     *
     * - targetTransitionTimeMs() - #define macro for animation arrival time.
     * - previousTransitionTimeMs() - #define macro for animation start time.
     *
     * @param rangeT Name of GLSL variable containing the range'd time value. This
     * should be a value between 0 and 1 to signal progress between the previous and
     * target transition times.
     * @param easeT Name of the GLSL vairable containing the result of cubic easing
     * having been applied to the rangeT variable.
     */
    function computeCurrentValue(rangeT = 't', easeT = 'varyingT') {
        return GEN_TYPES
            .map(genType => glsl `
${genType} computeCurrentValue(
    ${genType} startingValue,
    ${genType} startingVelocity,
    ${genType} targetValue) {
  ${genType} currentValue = mix(startingValue, targetValue, ${easeT});
  ${genType} projectedValue = startingVelocity *
    (targetTransitionTimeMs() - previousTransitionTimeMs());
  return currentValue + projectedValue *
    ${rangeT} * (1. - ${rangeT}) * (1. - ${rangeT}) * (1. - ${rangeT});
}
  `).join('\n');
    }
    /**
     * For a given vertex coordinate, and other calculated values, compute the
     * viewVertexPosition, the location in view space (screen pixels) where the
     * sprite's vertex would appear.
     */
    function computeViewVertexPosition() {
        return glsl `
/**
 * @param positionWorld The position of the sprite in world coords.
 * @param size Size of the sprite in world coordinates.
 * @param positionRelative Offset position relative to vert coords.
 * @param positionPixel Offset position in screen pixels.
 * @param vertCoords Local coordinates for this vertex.
 * @param viewMatrix Matrix to project world coords into view space (pixels).
 */
vec2 computeViewVertexPosition(
    vec2 positionWorld,
    vec2 size,
    vec2 positionRelative,
    vec2 positionPixel,
    vec2 vertCoords,
    mat3 viewMatrix
) {
  vec2 vertexPositionWorld =
    positionWorld + size * (positionRelative + vertCoords);
  vec2 viewVertexPosition =
    (viewMatrix * vec3(vertexPositionWorld, 1.)).xy + positionPixel * 4.;
  return viewVertexPosition;
}
`;
    }
    /**
     * Compute the size of the sprite in world units, incorporating the effect of
     * geometric zoom and capping to max and min pixel sizes if specified.
     */
    function computeSize() {
        return glsl `
/**
 *
 * @param sizeWorld Size of the sprite in world coordinates.
 * @param sizePixel Offset size of the sprite in pixels.
 * @param geometricZoom The geometric zoom size modifier.
 * @param viewMatrixScale XY scale (world coords to pixels), and ZW inverse.
 * @param maxSizePixel Maximum allowed size in pixels.
 * @param minSizePixel Minimum allowed size in pixels.
 */
vec2 computeSize(
  vec2 sizeWorld,
  vec2 sizePixel,
  vec2 geometricZoom,
  vec4 viewMatrixScale,
  vec2 maxSizePixel,
  vec2 minSizePixel
) {
  // Combine scale with geometric zoom effect.
  vec2 zoomScale = exp(log(viewMatrixScale.xy) * (1. - geometricZoom));

  // Project the size in world coordinates to pixels to apply min/max.
  vec2 projectedSizePixel = (sizeWorld * zoomScale + sizePixel * 4.);

  // Inital computed size in world coordinates is based on projected pixel size.
  vec2 computedSize = projectedSizePixel * viewMatrixScale.zw;

  // TODO(jimbo): Add border width to size if positioned externally.

  // Compute whether max and min size components are positive, in parallel.
  // XY contains results for max, ZW contains results for min.
  bvec4 isPositive = greaterThan(vec4(maxSizePixel, minSizePixel), vec4(0.));

  // Apply maximums if set.
  bvec2 gtMax = greaterThan(projectedSizePixel, maxSizePixel);
  if (isPositive.x && gtMax.x) {
    computedSize.x = maxSizePixel.x * viewMatrixScale.z;
  }
  if (isPositive.y && gtMax.y) {
    computedSize.y = maxSizePixel.y * viewMatrixScale.w;
  }

  // Apply minimums if set.
  bvec2 ltMin = lessThan(projectedSizePixel, minSizePixel);
  if (isPositive.z && ltMin.x) {
    computedSize.x = minSizePixel.x * viewMatrixScale.z;
  }
  if (isPositive.w && ltMin.y) {
    computedSize.y = minSizePixel.y * viewMatrixScale.w;
  }

  return computedSize;
}
`;
    }
    /**
     * In parallel, compute the current world and pixel component sizes.
     */
    function computeCurrentSizePixelAndWorld() {
        return glsl `
vec4 computeCurrentSizePixelAndWorld() {
  return computeCurrentValue(
    vec4(
      previousSizePixel(),
      previousSizeWorld()),
    vec4(
      previousSizePixelDelta(),
      previousSizeWorldDelta()),
    vec4(
      targetSizePixel(),
      targetSizeWorld())
  );
}
`;
    }
    /**
     * In parallel, compute the current max and min pixel component sizes.
     */
    function computeCurrentMaxAndMinSizePixel() {
        return glsl `
vec4 computeCurrentMaxAndMinSizePixel() {
  return computeCurrentValue(
    vec4(
      previousMaxSizePixel(),
      previousMinSizePixel()
    ),
    vec4(
      previousMaxSizePixelDelta(),
      previousMinSizePixelDelta()
    ),
    vec4(
      targetMaxSizePixel(),
      targetMinSizePixel()
    )
  ) * 4.;
}
`;
    }
    /**
     * Given the size of the sprite, compute its aspect ratio and the inverse. One
     * of the components will be 1., while the other component will be the multiple.
     * For example, a sprite which is twice as wide as it is tall will yield the
     * vector: vec4(2., 1., .5, 1.);
     */
    function computeAspectRatio() {
        return glsl `
/**
 * @param size The size of the sprite.
 * @return The aspect ratio (XY) and the inverse of the aspect ratio (ZW).
 */
vec4 computeAspectRatio(vec2 size) {
  vec2 ar = size / min(size.x, size.y);
  return vec4(ar, 1. / ar);
}
`;
    }

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
     * Returns the code for the Scene's main rendering fragment shader program.
     */
    function fragmentShader$2() {
        return glsl `
precision lowp float;

/**
 * Each sprite receives the same vertex coordinates, which describe a unit
 * square centered at the origin. However, the distance calculations performed
 * by the fragment shader use a distance of 1 to mean the dead center of a
 * circle, which implies a diameter of 2. So to convert from sprite vertex
 * coordinate space to edge distance space requires a dilation of 2.
 */
const float EDGE_DISTANCE_DILATION = 2.;

/**
 * View matrix for converting from world space to clip space.
 */
uniform mat3 viewMatrix;

/**
 * Signed-distance field (SDF) texture. Sampled for implementing glyphs of text.
 */
uniform sampler2D sdfTexture;

/**
 * Varying time value, eased using cubic-in-out between the previous and target
 * timestamps for this Sprite.
 */
varying float varyingT;

/**
 * Interpolated, per-vertex coordinate attributes for the quad into which the
 * sprite will be rendered.
 */
varying vec2 varyingVertexCoordinates;

/**
 * Threshold distance values to consider the pixel outside the shape (X) or
 * inside the shape (Y). Values between constitute the border.
 */
varying vec2 varyingBorderThresholds;

/**
 * Aspect ratio of the sprite's renderable area (XY) and their inverses (ZW).
 * One component of each pair will be 1. For the XY pair, the other component
 * be be greater than 1. and for the inverse pair it will be smaller.
 *
 * For example, a rectangle that's twice as wide as it is tall wolud have
 * varyingAspectRatio equal to vec4(2., 1., .5, 1.).
 */
varying vec4 varyingAspectRatio;

/**
 * Color attributes.
 */
varying vec4 varyingBorderColor;
varying vec4 varyingFillColor;

/**
 * Shape attributes used by fragment shader.
 */
varying float varyingPreviousSides;
varying float varyingTargetSides;
varying vec4 varyingPreviousShapeTexture;
varying vec4 varyingTargetShapeTexture;

// Import utility shader functions).
${range()}

const float PI = 3.1415926535897932384626433832795;

/**
 * Given a line segment described by two points (a,b), find the point along that
 * line segment nearest to a point of interest (p).
 */
vec2 closestPoint(vec2 a, vec2 b, vec2 p) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  vec2 baNorm = normalize(ba);
  float baLen = length(ba);
  float projectedLen = dot(baNorm, pa);
  vec2 closest =
    projectedLen < 0. ? a :
    projectedLen > baLen ? b :
    a + baNorm * projectedLen;
  return closest;
}

/**
 * Matrix to flip XY coordinates for theta computation. To orient polygons and
 * stars pointing upwards, we compute angles counter-clockwise from vertical.
 */
const mat2 FLIP_MATRIX = mat2(vec2(0., 1.), vec2(-1., 0.));

/**
 * Given a point in the range (-1,-1) to (1,1), compute the angle to that point,
 * going counter-clockwise from vertical.
 */
float computeTheta(vec2 point) {
  vec2 f = FLIP_MATRIX * point;
  return atan(f.y, f.x) + PI;
}

/**
 * Given the varying coordinates of interest, the dimensions of the shape's
 * bounding box, the number of sides, and a list of repeating offset radii,
 * determine the signed distance from the coordinates to the nearest edge of the
 * shape.
 *
 * @param sides Number of sides of the polygon or star.
 * @param radii List of four repeating offset radii to render stars. If all
 * values are 0., then the rendered distance will be a regular polygon.
 */
float getDistStar(int sides, vec4 radii) {
  float fSides = float(sides);

  // Flip radii (0. means align with unit circle, 1. means center of shape).
  radii = 1. - radii;

  // Angle to cut through the midpoint of a regular polygon's side.
  float piSides = PI / fSides;

  // With the polygon pointed up, this is the angle (counter-clockwise from top)
  // to the point just before crossing the X-axis. For a triangle, this will
  // just be the same as piSides.
  float wideAngle = floor(fSides * .5) * piSides;

  // Compute radius for dilation to fill bounding box.
  float dilation = 1. / max(sin(wideAngle), sin(piSides));

  // Compute the height of the shape, for centering.
  float height = dilation * (1. + max(cos(PI - 2. * wideAngle), cos(piSides)));

  // The point of interest starts with the varyingVertexCoordinates, but shifted
  // to center the shape vertically.
  vec2 poi = EDGE_DISTANCE_DILATION * varyingVertexCoordinates +
    vec2(0., EDGE_DISTANCE_DILATION - height);

  // Compute theta for point of interest, counter-clockwise from vertical.
  float theta = computeTheta(poi);

  // Incorporate aspect ratio calculation. This ensures that distances to
  // borders do not stretch with the shape.
  vec2 aspect = varyingAspectRatio.xy;
  poi *= aspect;

  // Compute which side of the star we're on, and use this to compute adjustment
  // to a and b points. This creates the star effect.
  float side = floor(theta / PI * .5 * fSides);

  float minDistance = 1.e20;
  float distanceSign;

  // Look at sides to the left/right (clockwise) to find the closest.
  for (int i = -1; i < 2; i++) {
    float thisSide = side + float(i);
    float m = mod(thisSide + 4., 4.);

    vec2 adjust =
      m < 1. ? radii.xy :
      m < 2. ? radii.yz :
      m < 3. ? radii.zw :
      radii.wx;

    // Find the ab line segment endpoints.
    float thetaA = 2. * thisSide * piSides;
    float thetaB = thetaA + 2. * piSides;
    vec2 a = aspect * dilation * adjust.x * vec2(-sin(thetaA), cos(thetaA));
    vec2 b = aspect * dilation * adjust.y * vec2(-sin(thetaB), cos(thetaB));

    // Find the closest point on the segment and update minDistance.
    vec2 c = closestPoint(a, b, poi).xy;
    minDistance = min(minDistance, distance(poi, c));

    // If we're in our own segment, capture the distance sign.
    if (i == 0) {
      // Use cross product to determine if we're inside or outside the line.
      distanceSign = sign(cross(vec3(b - a, 0.), vec3(poi - c, 0.)).z);
    }
  }

  return minDistance * distanceSign;
}

/**
 * Convenience method for calling getDistStar() with a fixed size array of 0.
 * values to create a regular polygon.
 */
float getDistPolygon(int sides) {
  return getDistStar(sides, vec4(0.));
}

/**
 * Estimate the distance from the varying vertex coordinate to the nearest point
 * on an ellipse of the specified aspect ratio. Mathematically, a closed-form
 * solution for this problem has not yet been discovered.
 *
 * Higher accuracy estimates of ellipse distance are possible with more
 * computation steps, but the procedure used here yields sufficient accurancy
 * for data visualization purposes.
 */
float getDistEllipse() {
  // All quadrants can be treated the same, so use the absolute value of the
  // vertex coordinates, and flip if needed so that the X dimension is always
  // the greater.
  bool flipped = varyingAspectRatio.x < varyingAspectRatio.y;
  vec4 aspectRatio = flipped ? varyingAspectRatio.yxwz : varyingAspectRatio;

  // Point of interest in the expanded circle (before aspect ratio stretching).
  vec2 circlePoint = EDGE_DISTANCE_DILATION * abs(
      flipped ? varyingVertexCoordinates.yx : varyingVertexCoordinates);

  // Capture length for inside/outside checking.
  float len = length(circlePoint);

  // Point of interest in the ellipse (after aspect ratio stretching).
  vec2 ellipsePoint = circlePoint * aspectRatio.xy;

  // Compute the angle from the x-axis up to the point of interest.
  float theta = PI - atan(circlePoint.y, -circlePoint.x);

  // Find the point where a ray from the origin through c hits the ellipse.
  vec2 p1 = aspectRatio.xy * vec2(cos(theta), sin(theta));

  // Find a second point by casting up from the x-axis. If the point of interest
  // is outside the ellipse and past the tip, use the tip coordinate.
  float invAr2 = aspectRatio.z * aspectRatio.z;
  vec2 p2 = ellipsePoint.x > aspectRatio.x ? vec2(aspectRatio.x, 0.) :
    vec2(ellipsePoint.x, sqrt(1. - ellipsePoint.x * ellipsePoint.x * invAr2));

  // Take the minimum distance between ray intersection point and vertical.
  float dist = min(distance(ellipsePoint, p1), distance(ellipsePoint, p2));

  // If the point of interest is outside of the ellipse, smooth by checking the
  // distance to one more point: the point on the ellipse between p1 and p2 such
  // that its X coordinate is half way between.
  if (len > 1.) {
    vec2 pm = mix(p1, p2, .5);
    pm.y = sqrt(1. - pm.x * pm.x * invAr2);
    dist = min(dist, distance(ellipsePoint, pm));
  }

  // Return signed distance.
  return dist * sign(1. - len);
}

/**
 * Compute the signed distance from the point of interest to the nearest edge of
 * the sprite bonding box.
 */
float getDistRect() {
  // All quadrants can be treated the same, so we limit our computation to the
  // top right.
  vec2 ar = varyingAspectRatio.xy;
  vec2 p = ar * EDGE_DISTANCE_DILATION * abs(varyingVertexCoordinates);

  // If the point of intrest is beyond the top corner, return the negative
  // distance to that corner.
  bvec2 gt = greaterThan(p, ar);
  if (all(gt)) {
    return -distance(p, ar);
  }
  if (gt.x) {
    return ar.x - p.x;
  }
  if (gt.y) {
    return ar.y - p.y;
  }

  // Determine distance to nearest edge.
  vec2 d = ar - p;
  vec2 dabs = abs(d);
  return dabs.x < dabs.y ? d.x : d.y;
}

/**
 * Sample the distance from the sdfTexture. The texture is assumed to have
 * one-dimensional distances in the X and Y componets and two-dimensional
 * distance in the Z component.
 *
 * @param shapeTexture UV coordinates and width/height of the region of the SDF
 * texture within which to sample (corresponds to the glyph being rendered).
 */
float getDistSDF(vec4 shapeTexture) {
  // Clamp vertex coordinates to the -1 to 1 range.
  vec2 clamped = clamp(varyingVertexCoordinates, -1., 1.);

  // For sampling, UV coordinates are Y-flipped and shifted.
  vec2 coordUv = clamped * vec2(1., -1.) + .5;

  // Focus on the middle 50% of the UV space. Assumes glyphs were rendered with
  // buffer roughly equal to the font size.
  //
  //   +------+       .      .
  //   |      |         +--+
  //   |  k   |  =>     |k |
  //   |      |         +--+
  //   +------+       .      .
  //
  coordUv *= .5;
  coordUv += .25;

  // Offset into the texture according to the shapeTexture's location and size.
  vec2 textureUv =
      shapeTexture.xy +
      shapeTexture.zw * coordUv;

  return texture2D(sdfTexture, textureUv).z;
}

/**
 * Generic distance function that calls through to one of the more specific
 * distance functions.
 *
 * @param sides Number of sides of the polygon/star, or special value:
 *  s < 0      : Reserved / Undefined.
 *  s == 0     : Use SDF texture coordinates.
 *  s == 1     : Circle.
 *  s == 2     : Filled rectangle.
 *  s > 2      : Polygon / Star.
 * @param textureUv Offset into SDF texture.
 */
float getDist(int sides, vec4 shapeTexture) {
  return
    sides == 0 ? getDistSDF(shapeTexture) :
    sides == 1 ? getDistEllipse() :
    sides == 2 ? getDistRect() :
    sides > 2 ? getDistPolygon(sides) :
    1.; // Reserved / undefined.
}

void main () {
  int previousSides = int(varyingPreviousSides);
  int targetSides = int(varyingTargetSides);

  float previousDistance = getDist(previousSides, varyingPreviousShapeTexture);
  float targetDistance = getDist(targetSides, varyingTargetShapeTexture);
  float signedDistance = mix(previousDistance, targetDistance, varyingT);

  vec4 color =
    signedDistance < varyingBorderThresholds.x ? vec4(0.) :
    signedDistance < varyingBorderThresholds.y ? varyingBorderColor :
    varyingFillColor;

  if (color.a < .01) {
    discard;
    return;
  }

  gl_FragColor = color;
}
`;
    }

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
     * Returns the code for the Scene's main rendering vertex shader program.
     * Uses generated GLSL code fragments produced by the supplied AttributeMapper.
     */
    function vertexShader$2(attributeMapper) {
        return glsl `
precision lowp float;

/**
 * WebGL vertex shaders output coordinates in clip space, which is a 3D volume
 * where each component is clipped to the range (-1,1). The distance from
 * edge-to-edge is therefore 2.
 */
const float CLIP_SPACE_RANGE = 2.;

/**
 * Each sprite receives the same vertex coordinates, which describe a unit
 * square centered at the origin. However, the distance calculations performed
 * by the fragment shader use a distance of 1 to mean the dead center of a
 * circle, which implies a diameter of 2. So to convert from sprite vertex
 * coordinate space to edge distance space requires a dilation of 2.
 */
const float EDGE_DISTANCE_DILATION = 2.;

/**
 * Current uniform timestamp for interpolating.
 */
uniform float ts;

/**
 * Effective devicePixelRatio.
 */
uniform float devicePixelRatio;

/**
 * Total number of sprite instances being rendered this pass. Used to compute
 * clip-space Z for stacking sprites based on their instanceIndex.
 * This ensures that partial-opacity pixels of stacked sprites will be
 * alpha-blended. Without this, occluded sprites' pixels may not blend.
 */
uniform float instanceCount;

/**
 * Granularity expected in the value of OrderZ values. The higher the
 * granularity, the more control the user has over the Z position of sprites.
 * However, this leaves less precision for correctly positioning sprites which
 * have exactly the same OrderZ value.
 */
uniform float orderZGranularity;

/**
 * View and projection matrices for converting from world space to clip space.
 */
uniform mat3 viewMatrix;
uniform mat3 projectionMatrix;

/**
 * Scale includes the X and Y dimensions of the viewMatrix, and their inverses
 * in the WZ components.
 */
uniform vec4 viewMatrixScale;

/**
 * Data textures holding the previous and target Sprite instance
 * attributes. The instantaneous value for each attribute is determined by
 * interpolating between the previous and target according to the ts uniform.
 */
uniform sampler2D previousValuesTexture;
uniform sampler2D targetValuesTexture;

/**
 * Per-vertex coordinates for the quad into which the sprite will be rendered.
 * XY contain the local cartesian coordinates for a unit square centered at the
 * origin.
 *
 *   vertexCoordinates: [
 *     [-0.5, -0.5],
 *     [0.5, -0.5],
 *     [-0.5, 0.5],
 *     [0.5, 0.5],
 *   ],
 *
 */
attribute vec2 vertexCoordinates;

/**
 * Instanced, per-sprite index and UV coordinates of the sprite's data swatch.
 */
attribute float instanceIndex;
attribute vec2 instanceSwatchUv;

/**
 * Varying time value, eased using cubic-in-out between the previous and target
 * timestamps for this Sprite.
 */
varying float varyingT;

/**
 * Interpolated vertexCoordinates for fragment shader.
 */
varying vec2 varyingVertexCoordinates;

/**
 * Threshold distance values to consider the pixel outside the shape (X) or
 * inside the shape (Y). Values between constitute the border.
 */
varying vec2 varyingBorderThresholds;

/**
 * Aspect ratio of the sprite's renderable area (XY) and their inverses (ZW).
 * One component of each pair will be 1. For the XY pair, the other component
 * be be greater than 1. and for the inverse pair it will be smaller.
 *
 * For example, a rectangle that's twice as wide as it is tall would have
 * varyingAspectRatio equal to vec4(2., 1., .5, 1.).
 */
varying vec4 varyingAspectRatio;

/**
 * Color attributes used by fragment shader.
 */
varying vec4 varyingBorderColor;
varying vec4 varyingFillColor;

/**
 * Shape attributes used by fragment shader.
 */
varying float varyingPreviousSides;
varying float varyingTargetSides;
varying vec4 varyingPreviousShapeTexture;
varying vec4 varyingTargetShapeTexture;

// Import utility shader functions.
${range()}
${cubicEaseInOut()}

// These arrays are filled in by code generated by the AttributeMapper.
vec4 previousTexelValues[${attributeMapper.texelsPerSwatch}];
vec4 targetTexelValues[${attributeMapper.texelsPerSwatch}];

/**
 * Read data texel values into the previous and target arrays.
 */
void readTexels() {
    ${attributeMapper.generateTexelReaderGLSL('previousTexelValues', 'previousValuesTexture', 'instanceSwatchUv')}
    ${attributeMapper.generateTexelReaderGLSL('targetTexelValues', 'targetValuesTexture', 'instanceSwatchUv')}
}

// Dynamically generate #DEFINE statements to access texel attributes by name.
// These look like method invocations elsewhere in the code. For example, the
// define "targetTransitionTimeMs()" extracts the float value
// targetTexelValues[0].r.
${attributeMapper.generateAttributeDefinesGLSL('previous', 'previousTexelValues')}
${attributeMapper.generateAttributeDefinesGLSL('target', 'targetTexelValues')}

/**
 * Local, non-eased, normalized time value between 0 and 1, computed between the
 * previous and target timestamp according to the uniform ts.
 */
float t;

${computeCurrentValue()}

/**
 * Precomputed constant value for converting colors in the 0-255 RGB range to
 * the GL standard 0-1 range. (1 / 255 = 0.00392156862745098)
 */
const vec4 GL_COLOR = vec4(vec3(0.00392156862745098), 1.);

/**
 * Function to compute all the varying values needed by the fragment shader.
 */
void setupVaryings() {
  // Clamp and range t value within previous and target timestamps.
  t =
    ts >= targetTransitionTimeMs() ? 1. :
    ts <= previousTransitionTimeMs() ? 0. :
    clamp(range(previousTransitionTimeMs(), targetTransitionTimeMs(), ts),
        0., 1.);

  // Compute eased varyingT.
  varyingT = cubicEaseInOut(t);

  // Copy and interpolate vertex coordinate values.
  varyingVertexCoordinates = vertexCoordinates;

  // Copy previous and target shape attributes.
  varyingPreviousSides = previousSides();
  varyingPreviousShapeTexture = previousShapeTexture();
  varyingTargetSides = targetSides();
  varyingTargetShapeTexture = targetShapeTexture();

  // Compute color attributes.
  varyingBorderColor = computeCurrentValue(
    previousBorderColor(),
    previousBorderColorDelta(),
    targetBorderColor()) * GL_COLOR;
  varyingFillColor = computeCurrentValue(
    previousFillColor(),
    previousFillColorDelta(),
    targetFillColor()) * GL_COLOR;
}

${computeAspectRatio()}
${computeCurrentMaxAndMinSizePixel()}
${computeCurrentSizePixelAndWorld()}
${computeSize()}
${computeViewVertexPosition()}

void main () {

  // Read data values from previous and target data textures.
  readTexels();

  // Setup varying values used both here and by the fragment shader.
  setupVaryings();

  // Compute current size component values by interpolation (parallelized).
  vec4 currentSizePixelAndWorld = computeCurrentSizePixelAndWorld();
  vec2 currentSizePixel = currentSizePixelAndWorld.xy;
  vec2 currentSizeWorld = currentSizePixelAndWorld.zw;

  vec2 currentGeometricZoom = computeCurrentValue(
      previousGeometricZoom(),
      previousGeometricZoomDelta(),
      targetGeometricZoom()
  );

  vec4 currentMaxAndMinSizePixel = computeCurrentMaxAndMinSizePixel();
  vec2 currentMaxSizePixel = currentMaxAndMinSizePixel.xy;
  vec2 currentMinSizePixel = currentMaxAndMinSizePixel.zw;

  // Compute the current size of the sprite in world units, including the effect
  // of geometric zoom and applying min and max pixel sizes.
  vec2 computedSize = computeSize(
    currentSizeWorld,
    currentSizePixel,
    currentGeometricZoom,
    viewMatrixScale,
    currentMaxSizePixel,
    currentMinSizePixel
  );

  // Compute border attributes in parallel.
  vec3 borderProperties = computeCurrentValue(
      vec3(
        previousBorderRadiusPixel(),
        previousBorderRadiusRelative(),
        previousBorderPlacement()),
      vec3(
        previousBorderRadiusPixelDelta(),
        previousBorderRadiusRelativeDelta(),
        previousBorderPlacementDelta()),
      vec3(
        targetBorderRadiusPixel(),
        targetBorderRadiusRelative(),
        targetBorderPlacement())
  );
  float currentBorderRadiusPixel = borderProperties.x;
  float currentBorderRadiusRelative = borderProperties.y;
  float currentBorderPlacement = borderProperties.z;

  // Project the computed size into pixels by using the viewMatrixScale. Note
  // that this already includes the effect of the devicePixelRatio, and a 2x
  // multiplier for clip-space, which goes from -1 to 1 in all dimensions.
  vec2 projectedSizePixel = computedSize.xy * viewMatrixScale.xy;

  // The fragment shader needs to know the threshold signed distances that
  // indicate whether each pixel is inside the shape, in the boreder, or outside
  // of the shape. A point right on the edge of the shape will have a distance
  // of 0. In edge-distance space, a distance of 1 would be the dead center of a
  // circle.
  float edgeDistance = currentBorderRadiusRelative + (
      currentBorderRadiusPixel *
      CLIP_SPACE_RANGE *
      EDGE_DISTANCE_DILATION *
      devicePixelRatio /
      min(projectedSizePixel.x, projectedSizePixel.y)
    );
  varyingBorderThresholds =
    vec2(0., edgeDistance) + mix(0., -edgeDistance, currentBorderPlacement);

  // Shift the quad vertices outward to account for borders, which may expand
  // the bounding box of the sprite.
  varyingVertexCoordinates *= (1. - varyingBorderThresholds.x);

  // Compute the sprite's aspect ratio and the inverse.
  varyingAspectRatio = computeAspectRatio(computedSize);

  // Compute the current position component attributes.
  vec2 currentPositionPixel = computeCurrentValue(
      previousPositionPixel(),
      previousPositionPixelDelta(),
      targetPositionPixel());

  vec2 currentPositionWorld = computeCurrentValue(
      previousPositionWorld(),
      previousPositionWorldDelta(),
      targetPositionWorld());

  vec2 currentPositionRelative = computeCurrentValue(
      previousPositionRelative(),
      previousPositionRelativeDelta(),
      targetPositionRelative());

  // Project the world position into pixel space, then add the pixel component.
  vec2 viewVertexPosition = computeViewVertexPosition(
      currentPositionWorld,
      computedSize,
      currentPositionRelative,
      currentPositionPixel,
      varyingVertexCoordinates,
      viewMatrix
  );

  // Project the pixel space coordinate into clip space.
  vec2 clipVertexPosition =
    (projectionMatrix * vec3(viewVertexPosition, 1.)).xy;

  // Compute the current user-specified OrderZ value.
  float currentOrderZ = computeCurrentValue(
      previousOrderZ(),
      previousOrderZDelta(),
      targetOrderZ());

  // Compute the stacking Z value for index-order blending.
  float stackZ = (1. + instanceIndex) / (1. + instanceCount);

  // Use provided granularity to combine current and stack Z values.
  float gInv = 1. / orderZGranularity;

  float combinedZ =
    mix(0., 1. - gInv, currentOrderZ) +
    mix(0., gInv, stackZ);

  // Project combined Z into clip space.
  float clipZ = mix(1., -1., combinedZ);

  gl_Position = vec4(clipVertexPosition, clipZ, 1.);
}
`;
    }

    /**
     * Setup the draw command which reads from both the previous Sprite state
     * texture and the target state texture.
     */
    function setupDrawCommand(coordinator) {
        // Calling regl() requires a DrawConfig and returns a DrawCommand. The
        // property names are used in dynamically compiled code using the native
        // Function constructor, and therefore need to remain unchanged by JavaScript
        // minifiers/uglifiers.
        const drawConfig = {
            // TODO(jimbo): Expose a mechanism to allow the API user to override these.
            'blend': {
                'enable': true,
                'func': {
                    'srcRGB': 'src alpha',
                    'srcAlpha': 1,
                    'dstRGB': 'one minus src alpha',
                    'dstAlpha': 1
                },
                'equation': {
                    'rgb': 'add',
                    'alpha': 'add',
                },
                'color': [0, 0, 0, 0]
            },
            'viewport': () => ({
                'x': 0,
                'y': 0,
                'width': coordinator.canvas.width,
                'height': coordinator.canvas.height,
            }),
            'frag': fragmentShader$2(),
            'vert': vertexShader$2(coordinator.attributeMapper),
            'attributes': {
                // Corners of the rectangle, same for each sprite.
                'vertexCoordinates': [
                    [-0.5, -0.5],
                    [0.5, -0.5],
                    [-0.5, 0.5],
                    [0.5, 0.5], // UV: [1, 0].
                ],
                // Swatch uv coordinates for retrieving data texture values.
                'instanceSwatchUv': {
                    'buffer': coordinator.instanceSwatchUvBuffer,
                    'divisor': 1,
                },
                // Instance indices for computing default z-ordering.
                'instanceIndex': {
                    'buffer': coordinator.instanceIndexBuffer,
                    'divisor': 1,
                },
            },
            'uniforms': {
                'ts': () => coordinator.elapsedTimeMs(),
                'devicePixelRatio': () => coordinator.getDevicePixelRatio(),
                'instanceCount': () => coordinator.instanceCount,
                'orderZGranularity': () => coordinator.orderZGranularity,
                'viewMatrix': () => coordinator.getViewMatrix(),
                'viewMatrixScale': () => coordinator.getViewMatrixScale(),
                'projectionMatrix': (context) => {
                    return coordinator.getProjectionMatrix(context);
                },
                'sdfTexture': coordinator.sdfTexture,
                'previousValuesTexture': coordinator.previousValuesFramebuffer,
                'targetValuesTexture': coordinator.targetValuesTexture,
            },
            'primitive': 'triangle strip',
            'count': 4,
            'instances': () => coordinator.instanceCount, // Many sprite instances.
        };
        const drawCommand = coordinator.regl(drawConfig);
        return () => {
            // Explicitly clear the drawing buffer before rendering.
            coordinator.regl.clear({
                'color': [0, 0, 0, 0],
                'depth': 1,
                'framebuffer': null,
                'stencil': 0,
            });
            drawCommand.apply(null);
        };
    }

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
     * Generate the fragment (pixel) shader for the hit test command. For each
     * sprite, this shader writes a packed float value in the range 0-1 into the
     * output Uint8 RGBA channels. To unpack, multiply by capacity+1, then subtract
     * 1. This will yield a number in the range (-1,capacity - 1), which is either
     * -1 for a miss, or the index of the SpriteImpl.
     *
     * @see http://marcodiiga.github.io/encoding-normalized-floats-to-rgba8-vectors
     */
    function fragmentShader$1() {
        return glsl `
precision lowp float;

// Need to know the maximum possible value for the index of the Sprite to
// normalize the value for RGBA packing.
uniform float capacity;

varying float varyingHitTestResult;

vec4 packFloatToVec4i(const float value) {
  const vec4 bitSh = vec4(256. * 256. * 256., 256. * 256., 256., 1.);
  const vec4 bitMsk = vec4(0., 1./256., 1./256., 1./256.);
  vec4 res = fract(value * bitSh);
  res -= res.xxyz * bitMsk;
  return res;
}

float fitToRange(const float result) {
  // Adding 1 to account for missing values (-1 becomes 0, etc.)
  return (result + 1.) / (capacity + 1.);
}

void main () {
  // Packing requires a number in the range 0-1.
  float n = fitToRange(varyingHitTestResult);
  gl_FragColor = packFloatToVec4i(n);
}
`;
    }
    /**
     * Generate the vertex shader for the hit test shader program. This positions
     * the coordinates of the rect to exactly cover the single output texel pointed
     * to by outputUv.
     *
     * @param hitTestAttributeMapper Mapper for hit test output texels.
     * @param attributeMapper Mapper for sprite state attributes.
     */
    function vertexShader$1(hitTestAttributeMapper, attributeMapper) {
        return glsl `
precision lowp float;

/**
 * WebGL vertex shaders output coordinates in clip space, which is a 3D volume
 * where each component is clipped to the range (-1,1). The distance from
 * edge-to-edge is therefore 2.
 */
const float CLIP_SPACE_RANGE = 2.;

/**
 * Each sprite receives the same vertex coordinates, which describe a unit
 * square centered at the origin. However, the distance calculations performed
 * by the fragment shader use a distance of 1 to mean the dead center of a
 * circle, which implies a diameter of 2. So to convert from sprite vertex
 * coordinate space to edge distance space requires a dilation of 2.
 */
const float EDGE_DISTANCE_DILATION = 2.;

uniform float ts;

uniform float devicePixelRatio;

/**
 * Screen pixel coordinates for performing the hit test. The XY channels contain
 * the screen x and y coordinates respectively. The ZW channels hold the width
 * and height of the bounding box of interest. Currently those are ignored.
 */
uniform vec4 hitTestCoordinates;
uniform bool inclusive;

uniform mat3 viewMatrix;

/**
 * Scale includes the X and Y dimensions of the viewMatrix, and their inverses
 * in the WZ components.
 */
uniform vec4 viewMatrixScale;

uniform sampler2D previousValuesTexture;
uniform sampler2D targetValuesTexture;

attribute vec2 vertexCoordinates;

attribute vec2 inputUv;
attribute vec2 indexActive;
attribute vec2 outputUv;

#define TEXELS_PER_SWATCH ${hitTestAttributeMapper.texelsPerSwatch}.
#define TEXTURE_WIDTH ${hitTestAttributeMapper.textureWidth}.
#define TEXTURE_HEIGHT ${hitTestAttributeMapper.textureHeight}.

// The result of the hit test, written to the data texel by the fragment shader.
varying float varyingHitTestResult;

vec4 previousTexelValues[${attributeMapper.texelsPerSwatch}];
vec4 targetTexelValues[${attributeMapper.texelsPerSwatch}];

${attributeMapper.generateAttributeDefinesGLSL('previous', 'previousTexelValues')}
${attributeMapper.generateAttributeDefinesGLSL('target', 'targetTexelValues')}

float rangeT;
float easeT;

// Import utility shader functions.
${range()}
${cubicEaseInOut()}
${computeCurrentValue('rangeT', 'easeT')}
${computeCurrentMaxAndMinSizePixel()}
${computeCurrentSizePixelAndWorld()}
${computeSize()}
${computeViewVertexPosition()}

void readInputTexels() {
${attributeMapper.generateTexelReaderGLSL('previousTexelValues', 'previousValuesTexture', 'inputUv')}
${attributeMapper.generateTexelReaderGLSL('targetTexelValues', 'targetValuesTexture', 'inputUv')}
}

const vec2 swatchSize =
  vec2(TEXELS_PER_SWATCH / TEXTURE_WIDTH, 1. / TEXTURE_HEIGHT);

bool spriteOverlapsTest(const vec4 spriteBox, const vec4 testBox) {
  return (
    spriteBox.x <= testBox.x + testBox.z &&
    spriteBox.x + spriteBox.z >= testBox.x &&
    spriteBox.y >= testBox.y - testBox.w &&
    spriteBox.y + spriteBox.w <= testBox.y
  );
}

bool spriteInsideTest(const vec4 spriteBox, const vec4 testBox) {
  return (
    spriteBox.x >= testBox.x &&
    spriteBox.x + spriteBox.z <= testBox.x + testBox.z &&
    spriteBox.y <= testBox.y &&
    spriteBox.y + spriteBox.w >= testBox.y - testBox.w
  );
}

void main () {
  readInputTexels();

  // Compute time variables.
  rangeT =
    ts >= targetTransitionTimeMs() ? 1. :
    ts <= previousTransitionTimeMs() ? 0. :
    clamp(range(previousTransitionTimeMs(), targetTransitionTimeMs(), ts),
        0., 1.);
  easeT = cubicEaseInOut(rangeT);

  // Compute current size component values by interpolation (parallelized).
  vec4 currentSizePixelAndWorld = computeCurrentSizePixelAndWorld();
  vec2 currentSizePixel = currentSizePixelAndWorld.xy;
  vec2 currentSizeWorld = currentSizePixelAndWorld.zw;

  vec2 currentGeometricZoom = computeCurrentValue(
      previousGeometricZoom(),
      previousGeometricZoomDelta(),
      targetGeometricZoom()
  );

  vec4 currentMaxAndMinSizePixel = computeCurrentMaxAndMinSizePixel();
  vec2 currentMaxSizePixel = currentMaxAndMinSizePixel.xy;
  vec2 currentMinSizePixel = currentMaxAndMinSizePixel.zw;

  // Compute the current size of the sprite in world units, including the effect
  // of geometric zoom and applying min and max pixel sizes.
  vec2 computedSize = computeSize(
    currentSizeWorld,
    currentSizePixel,
    currentGeometricZoom,
    viewMatrixScale,
    currentMaxSizePixel,
    currentMinSizePixel
  );

  // Compute border attributes in parallel.
  vec3 borderProperties = computeCurrentValue(
      vec3(
        previousBorderRadiusPixel(),
        previousBorderRadiusRelative(),
        previousBorderPlacement()),
      vec3(
        previousBorderRadiusPixelDelta(),
        previousBorderRadiusRelativeDelta(),
        previousBorderPlacementDelta()),
      vec3(
        targetBorderRadiusPixel(),
        targetBorderRadiusRelative(),
        targetBorderPlacement())
  );
  float currentBorderRadiusPixel = borderProperties.x;
  float currentBorderRadiusRelative = borderProperties.y;
  float currentBorderPlacement = borderProperties.z;

  // Project the computed size into pixels by using the viewMatrixScale. Note
  // that this already includes the effect of the devicePixelRatio, and a 2x
  // multiplier for clip-space, which goes from -1 to 1 in all dimensions.
  vec2 projectedSizePixel = computedSize.xy * viewMatrixScale.xy;

  // Compute the distance from the sprite edge to the extent of the border. Used
  // to shift the corners before hit testing to make sure the bounding box
  // includes borders outside of the shape.
  float edgeDistance = currentBorderRadiusRelative + (
      currentBorderRadiusPixel *
      CLIP_SPACE_RANGE *
      EDGE_DISTANCE_DILATION *
      devicePixelRatio /
      min(projectedSizePixel.x, projectedSizePixel.y)
    );

  // Shift coorner vertices outward to account for borders, which may expand
  // the bounding box of the sprite. XY are the bottom left corner, ZW are for
  // the top right.
  vec4 cornerCoordinates = vec4(-.5, -.5, .5, .5) *
    (1. + edgeDistance * currentBorderPlacement);

  // Compute the current position component attributes.
  vec2 currentPositionPixel = computeCurrentValue(
      previousPositionPixel(),
      previousPositionPixelDelta(),
      targetPositionPixel());

  vec2 currentPositionWorld = computeCurrentValue(
      previousPositionWorld(),
      previousPositionWorldDelta(),
      targetPositionWorld());

  vec2 currentPositionRelative = computeCurrentValue(
      previousPositionRelative(),
      previousPositionRelativeDelta(),
      targetPositionRelative());

  // Project the world position into pixel space for the bottom left and top
  // right corners of the sprite's quad.
  vec2 bottomLeft = computeViewVertexPosition(
      currentPositionWorld,
      computedSize,
      currentPositionRelative,
      currentPositionPixel,
      cornerCoordinates.xy,
      viewMatrix
  ) * .5 / devicePixelRatio;
  vec2 topRight = computeViewVertexPosition(
      currentPositionWorld,
      computedSize,
      currentPositionRelative,
      currentPositionPixel,
      cornerCoordinates.zw,
      viewMatrix
  ) * .5 / devicePixelRatio;
  vec4 spriteBox = vec4(bottomLeft.xy, topRight.xy - bottomLeft.xy);

  // Hit test coordinates are presented based on the top-left corner, so to
  // orient it from the bottom left we need to subtract the height.
  vec4 testBox = hitTestCoordinates + vec4(0., hitTestCoordinates.w, 0., 0.);

  // Test whether the coordinates of interest are within the sprite quad's
  // bounding box.
  bool hit = inclusive ?
    spriteOverlapsTest(spriteBox, testBox) :
    spriteInsideTest(spriteBox, testBox);

  // The hit test result will either be -1 if it's a miss (or the Sprite was
  // inactive), or it will be the index of the Sprite.
  varyingHitTestResult =
    indexActive.y <= 0. ? -1. :
    !hit ? -1. :
    indexActive.x;

  vec2 swatchUv =
    outputUv + (vertexCoordinates.xy + .5) * swatchSize;

  // Position the verts to write into the appropriate data texel.
  gl_Position = vec4(2. * swatchUv - 1., 0., 1.);
}
`;
    }

    /**
     * Set up a REGL draw command to update the hit test framebuffer.
     *
     * @param coordinator Upstream renderer implementation.
     */
    function setupHitTestCommand(coordinator) {
        // Calling regl() requires a DrawConfig and returns a DrawCommand. The
        // property names are used in dynamically compiled code using the native
        // Function constructor, and therefore need to remain unchanged by JavaScript
        // minifiers/uglifiers.
        const drawConfig = {
            'frag': fragmentShader$1(),
            'vert': vertexShader$1(coordinator.hitTestAttributeMapper, coordinator.attributeMapper),
            'attributes': {
                // Corners and UV coords of the rectangle, same for each sprite.
                'vertexCoordinates': [
                    [-0.5, -0.5],
                    [0.5, -0.5],
                    [-0.5, 0.5],
                    [0.5, 0.5],
                ],
                // Swatch UV coordinates for retrieving previous and target texture
                // values.
                'inputUv': {
                    'buffer': () => coordinator.instanceHitTestInputUvBuffer,
                    'divisor': 1,
                },
                // Index and active flag for each Sprite.
                'indexActive': {
                    'buffer': () => coordinator.instanceHitTestInputIndexActiveBuffer,
                    'divisor': 1,
                },
                // Output UVs for where to write the result.
                'outputUv': {
                    'buffer': coordinator.instanceHitTestOutputUvBuffer,
                    'divisor': 1,
                },
            },
            'uniforms': {
                'ts': () => coordinator.elapsedTimeMs(),
                'capacity': () => coordinator.hitTestAttributeMapper.totalSwatches,
                'devicePixelRatio': () => coordinator.getDevicePixelRatio(),
                'hitTestCoordinates': () => ([
                    coordinator.hitTestParameters.x,
                    coordinator.hitTestParameters.y,
                    coordinator.hitTestParameters.width || 0,
                    coordinator.hitTestParameters.height || 0,
                ]),
                'inclusive': () => coordinator.hitTestParameters === undefined ||
                    !!coordinator.hitTestParameters.inclusive,
                'viewMatrix': () => coordinator.getViewMatrix(),
                'viewMatrixScale': () => coordinator.getViewMatrixScale(),
                'targetValuesTexture': coordinator.targetValuesTexture,
                'previousValuesTexture': coordinator.previousValuesTexture,
            },
            'primitive': 'triangle strip',
            'count': 4,
            'instances': () => coordinator.hitTestCount,
            'framebuffer': () => coordinator.hitTestOutputValuesFramebuffer,
        };
        const drawCommand = coordinator.regl(drawConfig);
        // Wrapping ensures that the caller will not pass in `this`.
        return () => {
            drawCommand();
        };
    }

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
     * Generate the fragment (pixel) shader for the rebase command. The supplied
     * AttributeMapper is used to translate between texel channels and sprite
     * attribute values.
     */
    function fragmentShader(attributeMapper) {
        return glsl `
precision lowp float;

uniform float ts;

uniform sampler2D previousValuesTexture;
uniform sampler2D targetValuesTexture;

varying float varyingTexelIndex;
varying vec2 varyingRebaseUv;

vec4 previousTexelValues[${attributeMapper.texelsPerSwatch}];
vec4 targetTexelValues[${attributeMapper.texelsPerSwatch}];

${attributeMapper.generateAttributeDefinesGLSL('previous', 'previousTexelValues')}
${attributeMapper.generateAttributeDefinesGLSL('target', 'targetTexelValues')}

// Import utility shader functions.
${range()}
${cubicEaseInOut()}

float computeValueAtTime(
    float startingValue,
    float startingDelta,
    float targetValue,
    float ts) {
  float rangeT =
    ts >= targetTransitionTimeMs() ? 1. :
    ts <= previousTransitionTimeMs() ? 0. :
    clamp(
        range(previousTransitionTimeMs(), targetTransitionTimeMs(), ts),
        0., 1.);
  float easeT = cubicEaseInOut(rangeT);

  float currentValue = mix(startingValue, targetValue, easeT);
  float projectedValue = startingDelta *
    (targetTransitionTimeMs() - previousTransitionTimeMs());

  return currentValue + projectedValue * rangeT * pow(1. - rangeT, 3.);
}

// DELTA_MS is the duration in milliseconds to use when estimating the
// 'instantaneous' change in a value. INV_DELTA_MS is its inverse.
#define DELTA_MS 1.
#define INV_DELTA_MS 1.

float computeDeltaAtTime(
    float startingValue,
    float startingDelta,
    float targetValue,
    float ts
) {
  if (ts >= targetTransitionTimeMs()) {
    return 0.;
  }
  if (ts <= previousTransitionTimeMs()) {
    return startingDelta;
  }
  return (
      computeValueAtTime(
          startingValue, startingDelta, targetValue, ts + DELTA_MS) -
      computeValueAtTime(
          startingValue, startingDelta, targetValue, ts)
      ) * INV_DELTA_MS;
}

float computeThresholdValue(
    float previousValue,
    float targetValue,
    float rebaseTs
) {
  float mid = mix(previousTransitionTimeMs(), targetTransitionTimeMs(), .5);
  return rebaseTs < mid ? previousValue : targetValue;
}

void readInputTexels() {
${attributeMapper.generateTexelReaderGLSL('previousTexelValues', 'previousValuesTexture', 'varyingRebaseUv')}
${attributeMapper.generateTexelReaderGLSL('targetTexelValues', 'targetValuesTexture', 'varyingRebaseUv')}
}

void setOutputTexel() {
  float rebaseTs = ts;
  ${attributeMapper.generateRebaseFragmentGLSL('previousTexelValues', 'targetTexelValues', 'varyingTexelIndex', 'rebaseTs')}
}

void main () {
  readInputTexels();
  setOutputTexel();
}
`;
    }
    /**
     * Generate the vertex shader for the rebase program.
     */
    function vertexShader(attributeMapper) {
        return glsl `
precision lowp float;

attribute vec2 vertexCoordinates;

attribute vec2 instanceRebaseUv;

#define TEXELS_PER_SWATCH ${attributeMapper.texelsPerSwatch}.
#define TEXTURE_WIDTH ${attributeMapper.textureWidth}.
#define TEXTURE_HEIGHT ${attributeMapper.textureHeight}.

varying vec2 varyingRebaseUv;
varying float varyingTexelIndex;

const vec2 swatchSize =
  vec2(TEXELS_PER_SWATCH / TEXTURE_WIDTH, 1. / TEXTURE_HEIGHT);

void main () {
  varyingRebaseUv = instanceRebaseUv;
  varyingTexelIndex = (vertexCoordinates.x + .5) * TEXELS_PER_SWATCH - .5;
  vec2 swatchUv = instanceRebaseUv + (vertexCoordinates.xy + .5) * swatchSize;
  gl_Position = vec4(2. * swatchUv - 1., 0., 1.);
}
`;
    }

    /**
     * Set up a REGL draw command to update the memory of current and velocity
     * values for sprite attributes.
     *
     * @param coordinator Upstream renderer implementation.
     */
    function setupRebaseCommand(coordinator) {
        // Calling regl() requires a DrawConfig and returns a DrawCommand. The
        // property names are used in dynamically compiled code using the native
        // Function constructor, and therefore need to remain unchanged by JavaScript
        // minifiers/uglifiers.
        const drawConfig = {
            'frag': fragmentShader(coordinator.attributeMapper),
            'vert': vertexShader(coordinator.attributeMapper),
            'attributes': {
                // Corners and uv coords of the rectangle, same for each sprite.
                'vertexCoordinates': [
                    [-0.5, -0.5],
                    [0.5, -0.5],
                    [-0.5, 0.5],
                    [0.5, 0.5],
                ],
                // Instance swatch UV coordinates.
                'instanceRebaseUv': {
                    'buffer': () => coordinator.instanceRebaseUvBuffer,
                    'divisor': 1,
                },
            },
            'uniforms': {
                'ts': () => coordinator.elapsedTimeMs(),
                'targetValuesTexture': coordinator.targetValuesTexture,
                'previousValuesTexture': coordinator.previousValuesTexture,
            },
            'primitive': 'triangle strip',
            'count': 4,
            'instances': () => coordinator.rebaseCount,
            'framebuffer': () => coordinator.previousValuesFramebuffer,
        };
        const drawCommand = coordinator.regl(drawConfig);
        // Wrapping ensures that the caller will not pass in `this`.
        return () => {
            drawCommand();
        };
    }

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
     * @fileoverview Provides default timing functions for work scheduler and the
     * timing functions shim, which uses it for TypeScript typing.
     */
    /**
     * To enhance testability, the timing functions are constructor parameters to
     * the WorkScheduler. This is exported only for testing purposes, and generally
     * should not be of interest to API consumers.
     */
    const DEFAULT_TIMING_FUNCTIONS = Object.freeze({
        requestAnimationFrame: (callbackFn) => window.requestAnimationFrame(callbackFn),
        cancelAnimationFrame: (handle) => {
            window.cancelAnimationFrame(handle);
        },
        now: () => Date.now(),
    });

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
    class TinySDF {
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
        constructor(fontSize = 24, buffer = 3, radius = 8, cutoff = 0.25, fontFamily = 'sans-serif', fontWeight = 'normal') {
            this.fontSize = fontSize;
            this.buffer = buffer;
            this.radius = radius;
            this.cutoff = cutoff;
            this.fontFamily = fontFamily;
            this.fontWeight = fontWeight;
            const size = this.size = this.fontSize + this.buffer * 2;
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
            this.middle = Math.round((size / 2) * (navigator.userAgent.indexOf('Gecko/') >= 0 ? 1.2 : 1));
        }
        draw(chr) {
            this.ctx.clearRect(0, 0, this.size, this.size);
            this.ctx.fillText(chr, this.buffer, this.middle);
            const imgData = this.ctx.getImageData(0, 0, this.size, this.size);
            return imgDataToAlphaChannel(Object.assign(Object.assign({}, this), { imgData }));
        }
    }
    /**
     * Given an ImageData object retrieved from a canvas context, compute and
     * return the alpha channel as a Uint8ClampedArray.
     */
    function imgDataToAlphaChannel({ imgData, size, radius, cutoff, gridOuter, gridInner, f, v, z, }) {
        const alphaChannel = new Uint8ClampedArray(size * size);
        for (let i = 0; i < size * size; i++) {
            const a = imgData.data[i * 4 + 3] / 255; // alpha value
            gridOuter[i] = a === 1 ? 0 :
                a === 0 ? INF :
                    Math.pow(Math.max(0, 0.5 - a), 2);
            gridInner[i] = a === 1 ? INF :
                a === 0 ? 0 :
                    Math.pow(Math.max(0, a - 0.5), 2);
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
    function edt(data, width, height, f, v, z) {
        edtY(data, width, height, f, v, z);
        edtX(data, width, height, f, v, z);
    }
    function edtX(data, width, height, f, v, z) {
        for (let y = 0; y < height; y++) {
            edt1d(data, y * width, 1, width, f, v, z);
        }
    }
    function edtY(data, width, height, f, v, z) {
        for (let x = 0; x < width; x++) {
            edt1d(data, x, width, height, f, v, z);
        }
    }
    /**
     * 1D squared distance transform.
     */
    function edt1d(grid, offset, stride, length, f, v, z) {
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
    function canvasToSDFData(canvas, radius, cutoff = 0.5) {
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
            gridOuter[i] = gridOuterY[i] = gridOuterX[i] = a === 1 ? 0 :
                a === 0 ? INF :
                    Math.pow(Math.max(0, 0.5 - a), 2);
            gridInner[i] = gridInnerY[i] = gridInnerX[i] = a === 1 ? INF :
                a === 0 ? 0 :
                    Math.pow(Math.max(0, a - 0.5), 2);
        }
        edt(gridOuter, width, height, f, v, z);
        edt(gridInner, width, height, f, v, z);
        edtX(gridOuterX, width, height, f, v, z);
        edtX(gridInnerX, width, height, f, v, z);
        edtY(gridOuterY, width, height, f, v, z);
        edtY(gridInnerY, width, height, f, v, z);
        const finalData = new Float32Array(width * height * 3.0);
        for (let i = 0; i < width * height; i++) {
            finalData[i * 3] = Math.max(0, 1 -
                ((Math.sqrt(gridOuterX[i]) - Math.sqrt(gridInnerX[i])) / radius +
                    cutoff));
            finalData[i * 3 + 1] = Math.max(0, 1 -
                ((Math.sqrt(gridOuterY[i]) - Math.sqrt(gridInnerY[i])) / radius +
                    cutoff));
            finalData[i * 3 + 2] = 1 -
                ((Math.sqrt(gridOuter[i]) - Math.sqrt(gridInner[i])) / radius + cutoff);
        }
        return finalData;
    }

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
    const DEFAULT_GLYPH_FONT_SIZE_PX = 32;
    /**
     * Default settings for a GlyphMapper instance.
     */
    const DEFAULT_GLYPH_MAPPER_SETTINGS = Object.freeze({
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
    class GlyphMapper {
        constructor(options = DEFAULT_GLYPH_MAPPER_SETTINGS) {
            /**
             * Internal mapping to show where each glyph is in the texture.
             */
            this.glyphToCoordinates = new Map();
            // Copy default settings plus any provided settings.
            const settings = Object.assign({}, DEFAULT_GLYPH_MAPPER_SETTINGS, options || {});
            this.maxTextureSize = settings.maxTextureSize;
            this.tinySDF = new TinySDF(settings.fontSize, settings.buffer, settings.radius, settings.cutoff, settings.fontFamily, settings.fontWeight);
            this.glyphSize = this.tinySDF.size;
            this.glyphsPerRow = Math.floor(this.maxTextureSize / this.glyphSize);
            this.glyphCapacity = this.glyphsPerRow * this.glyphsPerRow;
            this.textureSize = this.glyphsPerRow * this.glyphSize;
            this.textureData = new Float32Array(this.textureSize * this.textureSize);
        }
        /**
         * Determine of a character has already been added to the glyph map.
         */
        hasGlyph(glyph) {
            return this.glyphToCoordinates.has(glyph);
        }
        /**
         * Return a glyph if it's already been added to the glyph map.
         */
        getGlyph(glyph) {
            return this.glyphToCoordinates.get(glyph);
        }
        /**
         * Add a character to the glyph map if it's not there already then return the
         * glyph's coordinates.
         */
        addGlyph(glyph) {
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
            const textureDataOffsetIndex = row * this.glyphSize * this.textureSize + col * this.glyphSize;
            const { canvas, ctx, size, buffer, middle, radius, cutoff, } = this.tinySDF;
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
                    const textureDataIndex = textureDataOffsetIndex + i * this.textureSize + j;
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
        get glyphs() {
            return [...this.glyphToCoordinates.keys()];
        }
    }

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
     * Default glyph set is the printable ASCII characters from 33 to 126 (decimal).
     */
    const DEFAULT_GLYPHS = '!"#$%&\'()*+,-./0123456789:;<=>?' + // ASCII 33 - 63.
        '@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_' + // ASCII 63 - 95.
        '`abcdefghijklmnopqrstuvwxyz{|}'; // ASCII 96 - 126.
    /**
     * Parameters to configure the Scene.
     */
    const DEFAULT_SCENE_SETTINGS = Object.freeze({
        container: document.body,
        defaultTransitionTimeMs: 250,
        desiredSpriteCapacity: 1e6,
        devicePixelRatio: undefined,
        glyphs: DEFAULT_GLYPHS,
        glyphMapper: DEFAULT_GLYPH_MAPPER_SETTINGS,
        orderZGranularity: 10,
        timingFunctions: DEFAULT_TIMING_FUNCTIONS,
    });

    /**
     * @license
     * Copyright 2021 Google Inc. All rights reserved.
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
     * @fileoverview Symbols are used to hide properties on objects in such a way
     * that they can be accessed by other trusted objects, but not by API consumers.
     */
    /**
     * Symbol used by SpriteImpl to make internal properties visible to Scene, but
     * not to upstream API consumers.
     */
    const InternalPropertiesSymbol = Symbol('internalProperties');
    /**
     * Symbol used by a SpriteViewImpl to access its portion of the Scene's data
     * buffer as a Float32Array DataView.
     */
    const DataViewSymbol = Symbol('dataView');
    /**
     * Symbol used by Scene to access its SceneInternal instance. Exported as a
     * symbol to allow access by the debugging demo.
     */
    const SceneInternalSymbol = Symbol('sceneInternal');

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
    class SpriteViewImpl {
        constructor(dataView) {
            this[DataViewSymbol] = dataView;
        }
        get TransitionTimeMs() {
            return this[DataViewSymbol][0];
        }
        set TransitionTimeMs(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('TransitionTimeMs cannot be NaN');
            }
            this[DataViewSymbol][0] = attributeValue;
        }
        get PositionWorldX() {
            return this[DataViewSymbol][1];
        }
        set PositionWorldX(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('PositionWorldX cannot be NaN');
            }
            this[DataViewSymbol][1] = attributeValue;
        }
        get PositionWorldY() {
            return this[DataViewSymbol][2];
        }
        set PositionWorldY(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('PositionWorldY cannot be NaN');
            }
            this[DataViewSymbol][2] = attributeValue;
        }
        get SizeWorldWidth() {
            return this[DataViewSymbol][3];
        }
        set SizeWorldWidth(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('SizeWorldWidth cannot be NaN');
            }
            this[DataViewSymbol][3] = attributeValue;
        }
        get SizeWorldHeight() {
            return this[DataViewSymbol][4];
        }
        set SizeWorldHeight(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('SizeWorldHeight cannot be NaN');
            }
            this[DataViewSymbol][4] = attributeValue;
        }
        get OrderZ() {
            return this[DataViewSymbol][5];
        }
        set OrderZ(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('OrderZ cannot be NaN');
            }
            if (attributeValue < 0) {
                throw new RangeError('OrderZ cannot be less than 0');
            }
            if (attributeValue > 1) {
                throw new RangeError('OrderZ cannot be greater than 1');
            }
            this[DataViewSymbol][5] = attributeValue;
        }
        get GeometricZoomX() {
            return this[DataViewSymbol][6];
        }
        set GeometricZoomX(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('GeometricZoomX cannot be NaN');
            }
            this[DataViewSymbol][6] = attributeValue;
        }
        get GeometricZoomY() {
            return this[DataViewSymbol][7];
        }
        set GeometricZoomY(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('GeometricZoomY cannot be NaN');
            }
            this[DataViewSymbol][7] = attributeValue;
        }
        get PositionPixelX() {
            return this[DataViewSymbol][8];
        }
        set PositionPixelX(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('PositionPixelX cannot be NaN');
            }
            this[DataViewSymbol][8] = attributeValue;
        }
        get PositionPixelY() {
            return this[DataViewSymbol][9];
        }
        set PositionPixelY(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('PositionPixelY cannot be NaN');
            }
            this[DataViewSymbol][9] = attributeValue;
        }
        get SizePixelWidth() {
            return this[DataViewSymbol][10];
        }
        set SizePixelWidth(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('SizePixelWidth cannot be NaN');
            }
            this[DataViewSymbol][10] = attributeValue;
        }
        get SizePixelHeight() {
            return this[DataViewSymbol][11];
        }
        set SizePixelHeight(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('SizePixelHeight cannot be NaN');
            }
            this[DataViewSymbol][11] = attributeValue;
        }
        get MaxSizePixelWidth() {
            return this[DataViewSymbol][12];
        }
        set MaxSizePixelWidth(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('MaxSizePixelWidth cannot be NaN');
            }
            this[DataViewSymbol][12] = attributeValue;
        }
        get MaxSizePixelHeight() {
            return this[DataViewSymbol][13];
        }
        set MaxSizePixelHeight(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('MaxSizePixelHeight cannot be NaN');
            }
            this[DataViewSymbol][13] = attributeValue;
        }
        get MinSizePixelWidth() {
            return this[DataViewSymbol][14];
        }
        set MinSizePixelWidth(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('MinSizePixelWidth cannot be NaN');
            }
            this[DataViewSymbol][14] = attributeValue;
        }
        get MinSizePixelHeight() {
            return this[DataViewSymbol][15];
        }
        set MinSizePixelHeight(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('MinSizePixelHeight cannot be NaN');
            }
            this[DataViewSymbol][15] = attributeValue;
        }
        get PositionRelativeX() {
            return this[DataViewSymbol][16];
        }
        set PositionRelativeX(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('PositionRelativeX cannot be NaN');
            }
            this[DataViewSymbol][16] = attributeValue;
        }
        get PositionRelativeY() {
            return this[DataViewSymbol][17];
        }
        set PositionRelativeY(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('PositionRelativeY cannot be NaN');
            }
            this[DataViewSymbol][17] = attributeValue;
        }
        get Sides() {
            return this[DataViewSymbol][18];
        }
        set Sides(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('Sides cannot be NaN');
            }
            this[DataViewSymbol][18] = attributeValue;
        }
        get ShapeTextureU() {
            return this[DataViewSymbol][19];
        }
        set ShapeTextureU(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('ShapeTextureU cannot be NaN');
            }
            this[DataViewSymbol][19] = attributeValue;
        }
        get ShapeTextureV() {
            return this[DataViewSymbol][20];
        }
        set ShapeTextureV(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('ShapeTextureV cannot be NaN');
            }
            this[DataViewSymbol][20] = attributeValue;
        }
        get ShapeTextureWidth() {
            return this[DataViewSymbol][21];
        }
        set ShapeTextureWidth(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('ShapeTextureWidth cannot be NaN');
            }
            this[DataViewSymbol][21] = attributeValue;
        }
        get ShapeTextureHeight() {
            return this[DataViewSymbol][22];
        }
        set ShapeTextureHeight(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('ShapeTextureHeight cannot be NaN');
            }
            this[DataViewSymbol][22] = attributeValue;
        }
        get BorderRadiusPixel() {
            return this[DataViewSymbol][23];
        }
        set BorderRadiusPixel(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('BorderRadiusPixel cannot be NaN');
            }
            this[DataViewSymbol][23] = attributeValue;
        }
        get BorderRadiusRelative() {
            return this[DataViewSymbol][24];
        }
        set BorderRadiusRelative(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('BorderRadiusRelative cannot be NaN');
            }
            this[DataViewSymbol][24] = attributeValue;
        }
        get BorderPlacement() {
            return this[DataViewSymbol][25];
        }
        set BorderPlacement(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('BorderPlacement cannot be NaN');
            }
            this[DataViewSymbol][25] = attributeValue;
        }
        get BorderColorR() {
            return this[DataViewSymbol][26];
        }
        set BorderColorR(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('BorderColorR cannot be NaN');
            }
            this[DataViewSymbol][26] = attributeValue;
        }
        get BorderColorG() {
            return this[DataViewSymbol][27];
        }
        set BorderColorG(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('BorderColorG cannot be NaN');
            }
            this[DataViewSymbol][27] = attributeValue;
        }
        get BorderColorB() {
            return this[DataViewSymbol][28];
        }
        set BorderColorB(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('BorderColorB cannot be NaN');
            }
            this[DataViewSymbol][28] = attributeValue;
        }
        get BorderColorOpacity() {
            return this[DataViewSymbol][29];
        }
        set BorderColorOpacity(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('BorderColorOpacity cannot be NaN');
            }
            this[DataViewSymbol][29] = attributeValue;
        }
        get FillBlend() {
            return this[DataViewSymbol][30];
        }
        set FillBlend(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('FillBlend cannot be NaN');
            }
            this[DataViewSymbol][30] = attributeValue;
        }
        get FillColorR() {
            return this[DataViewSymbol][31];
        }
        set FillColorR(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('FillColorR cannot be NaN');
            }
            this[DataViewSymbol][31] = attributeValue;
        }
        get FillColorG() {
            return this[DataViewSymbol][32];
        }
        set FillColorG(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('FillColorG cannot be NaN');
            }
            this[DataViewSymbol][32] = attributeValue;
        }
        get FillColorB() {
            return this[DataViewSymbol][33];
        }
        set FillColorB(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('FillColorB cannot be NaN');
            }
            this[DataViewSymbol][33] = attributeValue;
        }
        get FillColorOpacity() {
            return this[DataViewSymbol][34];
        }
        set FillColorOpacity(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('FillColorOpacity cannot be NaN');
            }
            this[DataViewSymbol][34] = attributeValue;
        }
        get FillTextureU() {
            return this[DataViewSymbol][35];
        }
        set FillTextureU(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('FillTextureU cannot be NaN');
            }
            this[DataViewSymbol][35] = attributeValue;
        }
        get FillTextureV() {
            return this[DataViewSymbol][36];
        }
        set FillTextureV(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('FillTextureV cannot be NaN');
            }
            this[DataViewSymbol][36] = attributeValue;
        }
        get FillTextureWidth() {
            return this[DataViewSymbol][37];
        }
        set FillTextureWidth(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('FillTextureWidth cannot be NaN');
            }
            this[DataViewSymbol][37] = attributeValue;
        }
        get FillTextureHeight() {
            return this[DataViewSymbol][38];
        }
        set FillTextureHeight(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('FillTextureHeight cannot be NaN');
            }
            this[DataViewSymbol][38] = attributeValue;
        }
        set PositionWorld(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.PositionWorldX = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.PositionWorldY = value[1];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No PositionWorld component index values were found');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('x' in value) {
                    this.PositionWorldX = value['x'];
                    anyComponentSet = true;
                }
                if ('y' in value) {
                    this.PositionWorldY = value['y'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No PositionWorld component key values were found');
                }
                return;
            }
            throw new TypeError('PositionWorld setter argument must be an array or object');
        }
        set SizeWorld(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.SizeWorldWidth = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.SizeWorldHeight = value[1];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No SizeWorld component index values were found');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('width' in value) {
                    this.SizeWorldWidth = value['width'];
                    anyComponentSet = true;
                }
                if ('height' in value) {
                    this.SizeWorldHeight = value['height'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No SizeWorld component key values were found');
                }
                return;
            }
            this.SizeWorldWidth = value;
            this.SizeWorldHeight = value;
        }
        set GeometricZoom(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.GeometricZoomX = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.GeometricZoomY = value[1];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No GeometricZoom component index values were found');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('x' in value) {
                    this.GeometricZoomX = value['x'];
                    anyComponentSet = true;
                }
                if ('y' in value) {
                    this.GeometricZoomY = value['y'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No GeometricZoom component key values were found');
                }
                return;
            }
            this.GeometricZoomX = value;
            this.GeometricZoomY = value;
        }
        set PositionPixel(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.PositionPixelX = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.PositionPixelY = value[1];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No PositionPixel component index values were found');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('x' in value) {
                    this.PositionPixelX = value['x'];
                    anyComponentSet = true;
                }
                if ('y' in value) {
                    this.PositionPixelY = value['y'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No PositionPixel component key values were found');
                }
                return;
            }
            throw new TypeError('PositionPixel setter argument must be an array or object');
        }
        set SizePixel(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.SizePixelWidth = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.SizePixelHeight = value[1];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No SizePixel component index values were found');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('width' in value) {
                    this.SizePixelWidth = value['width'];
                    anyComponentSet = true;
                }
                if ('height' in value) {
                    this.SizePixelHeight = value['height'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No SizePixel component key values were found');
                }
                return;
            }
            this.SizePixelWidth = value;
            this.SizePixelHeight = value;
        }
        set MaxSizePixel(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.MaxSizePixelWidth = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.MaxSizePixelHeight = value[1];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No MaxSizePixel component index values were found');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('width' in value) {
                    this.MaxSizePixelWidth = value['width'];
                    anyComponentSet = true;
                }
                if ('height' in value) {
                    this.MaxSizePixelHeight = value['height'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No MaxSizePixel component key values were found');
                }
                return;
            }
            this.MaxSizePixelWidth = value;
            this.MaxSizePixelHeight = value;
        }
        set MinSizePixel(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.MinSizePixelWidth = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.MinSizePixelHeight = value[1];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No MinSizePixel component index values were found');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('width' in value) {
                    this.MinSizePixelWidth = value['width'];
                    anyComponentSet = true;
                }
                if ('height' in value) {
                    this.MinSizePixelHeight = value['height'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No MinSizePixel component key values were found');
                }
                return;
            }
            this.MinSizePixelWidth = value;
            this.MinSizePixelHeight = value;
        }
        set PositionRelative(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.PositionRelativeX = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.PositionRelativeY = value[1];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No PositionRelative component index values were found');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('x' in value) {
                    this.PositionRelativeX = value['x'];
                    anyComponentSet = true;
                }
                if ('y' in value) {
                    this.PositionRelativeY = value['y'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No PositionRelative component key values were found');
                }
                return;
            }
            throw new TypeError('PositionRelative setter argument must be an array or object');
        }
        set ShapeTexture(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.ShapeTextureU = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.ShapeTextureV = value[1];
                    anyComponentSet = true;
                }
                if ('2' in value) {
                    this.ShapeTextureWidth = value[2];
                    anyComponentSet = true;
                }
                if ('3' in value) {
                    this.ShapeTextureHeight = value[3];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No ShapeTexture component index values were found');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('u' in value) {
                    this.ShapeTextureU = value['u'];
                    anyComponentSet = true;
                }
                if ('v' in value) {
                    this.ShapeTextureV = value['v'];
                    anyComponentSet = true;
                }
                if ('width' in value) {
                    this.ShapeTextureWidth = value['width'];
                    anyComponentSet = true;
                }
                if ('height' in value) {
                    this.ShapeTextureHeight = value['height'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No ShapeTexture component key values were found');
                }
                return;
            }
            throw new TypeError('ShapeTexture setter argument must be an array or object');
        }
        set BorderColor(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.BorderColorR = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.BorderColorG = value[1];
                    anyComponentSet = true;
                }
                if ('2' in value) {
                    this.BorderColorB = value[2];
                    anyComponentSet = true;
                }
                if ('3' in value) {
                    this.BorderColorOpacity = value[3];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No BorderColor component index values were found');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('r' in value) {
                    this.BorderColorR = value['r'];
                    anyComponentSet = true;
                }
                if ('g' in value) {
                    this.BorderColorG = value['g'];
                    anyComponentSet = true;
                }
                if ('b' in value) {
                    this.BorderColorB = value['b'];
                    anyComponentSet = true;
                }
                if ('opacity' in value) {
                    this.BorderColorOpacity = value['opacity'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No BorderColor component key values were found');
                }
                return;
            }
            throw new TypeError('BorderColor setter argument must be an array or object');
        }
        set FillColor(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.FillColorR = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.FillColorG = value[1];
                    anyComponentSet = true;
                }
                if ('2' in value) {
                    this.FillColorB = value[2];
                    anyComponentSet = true;
                }
                if ('3' in value) {
                    this.FillColorOpacity = value[3];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No FillColor component index values were found');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('r' in value) {
                    this.FillColorR = value['r'];
                    anyComponentSet = true;
                }
                if ('g' in value) {
                    this.FillColorG = value['g'];
                    anyComponentSet = true;
                }
                if ('b' in value) {
                    this.FillColorB = value['b'];
                    anyComponentSet = true;
                }
                if ('opacity' in value) {
                    this.FillColorOpacity = value['opacity'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No FillColor component key values were found');
                }
                return;
            }
            throw new TypeError('FillColor setter argument must be an array or object');
        }
        set FillTexture(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.FillTextureU = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.FillTextureV = value[1];
                    anyComponentSet = true;
                }
                if ('2' in value) {
                    this.FillTextureWidth = value[2];
                    anyComponentSet = true;
                }
                if ('3' in value) {
                    this.FillTextureHeight = value[3];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No FillTexture component index values were found');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('u' in value) {
                    this.FillTextureU = value['u'];
                    anyComponentSet = true;
                }
                if ('v' in value) {
                    this.FillTextureV = value['v'];
                    anyComponentSet = true;
                }
                if ('width' in value) {
                    this.FillTextureWidth = value['width'];
                    anyComponentSet = true;
                }
                if ('height' in value) {
                    this.FillTextureHeight = value['height'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No FillTexture component key values were found');
                }
                return;
            }
            throw new TypeError('FillTexture setter argument must be an array or object');
        }
    }

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
     * @fileoverview Defines the InternalError class for errors which ought not to
     * occur during operation.
     */
    class InternalError extends Error {
    }

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
    var LifecyclePhase;
    (function (LifecyclePhase) {
        /**
         * When a SpriteImpl is first created, there may not be capacity to represent
         * its data in the Scene's textures and buffers. In that case, the sprite will
         * wait in the Created phase until space is recovered from another exiting
         * sprite.
         */
        LifecyclePhase[LifecyclePhase["Created"] = 0] = "Created";
        /**
         * At rest, a SpriteImpl is not waiting for anything to happen. The values in
         * the target blob/array match those in the target texture, and there are no
         * pending callbacks.
         */
        LifecyclePhase[LifecyclePhase["Rest"] = 1] = "Rest";
        /**
         * Once the API user has set a callback, the SpriteImpl enters this state from
         * Rest.
         */
        LifecyclePhase[LifecyclePhase["HasCallback"] = 2] = "HasCallback";
        /**
         * After a callback has been run, if the arrival time (Ts) is in the future,
         * then the SpriteImpl enters this state, waiting for a rebase operation to
         * capture the instantaneous values and deltas of interpolable attributes.
         */
        LifecyclePhase[LifecyclePhase["NeedsRebase"] = 3] = "NeedsRebase";
        /**
         * In this state, the SpriteImpl is waiting for its values in the target blob/
         * array to be sync'd to the target texture. This could be because a callback
         * has been invoked, or because the sprite is being removed and zeros have
         * been set to its swatch of the target values blob/array.
         */
        LifecyclePhase[LifecyclePhase["NeedsTextureSync"] = 4] = "NeedsTextureSync";
        /**
         * Lastly, after the SpriteImpl has had zeros flashed to its swatch of the
         * target texture, the terminal lifecycle state is this one. At this point,
         * the memory that had been assigned to the SpriteImpl is recoverable by the
         * Scene to be assigned to another sprite.
         */
        LifecyclePhase[LifecyclePhase["Removed"] = 5] = "Removed";
    })(LifecyclePhase || (LifecyclePhase = {}));
    /**
     * Converts a phase transition to a unique numeric index. If the phase
     * transition is impossible, returns NaN.
     *
     * A LifecyclePhase transition is a situation where a Sprite in a particular
     * LifecyclePhase moves to a different LifecyclePhase. Since there are six
     * phases, there are 6x5=30 possible transitions. By assigning each transition a
     * numeric index, we can use bitwise arithmetic to check whether a given phase
     * transition is valid.
     */
    function transitionToFlag(fromPhase, toPhase) {
        return fromPhase === toPhase ?
            NaN :
            1 << (5 * fromPhase + toPhase - +(toPhase > fromPhase));
    }
    /**
     * Create a single integer value which encodes all the allowed LifecyclePhase
     * transitions. This value can be AND'd with a phase transition index to test
     * for whether the transition is allowed.
     */
    function createAllowedTransitionMask() {
        const { Created, Rest, HasCallback, NeedsRebase, NeedsTextureSync, Removed, } = LifecyclePhase;
        let mask = 0;
        // From the Created phase, once there's an available swatch it goes to Rest.
        mask |= transitionToFlag(Created, Rest);
        // From the Created phase, if the Sprite's abandon() method is called, it goes
        // directly to Removed.
        mask |= transitionToFlag(Created, Removed);
        // From the Rest phase, if the API user supplies a callback, the Sprite
        // transitions to the HasCallback phase.
        mask |= transitionToFlag(Rest, HasCallback);
        // From Rest, if the Sprite is slated for removal, it goes to NeedsTextureSync
        // so that zeros can be flashed to the texture before releasing the swatch to
        // another Sprite to use.
        mask |= transitionToFlag(Rest, NeedsTextureSync);
        // From HasCallback, once the callback has been run, if the arrival time is in
        // the future, then the Sprite goes to NeedsRebase so we can capture its
        // instantaneous values and deltas.
        mask |= transitionToFlag(HasCallback, NeedsRebase);
        // From HasCallback, once the callback has been run, if the arrival time has
        // already passed, then it goes to NeedsTextureSync so that its values can be
        // flashed to the target texture.
        mask |= transitionToFlag(HasCallback, NeedsTextureSync);
        // From NeedsRebase, after the rebase operation completes, the Sprite goes to
        // NeedsTextureSync to have its values flashed.
        mask |= transitionToFlag(NeedsRebase, NeedsTextureSync);
        // From NeedsTextureSync, once the sync has occurred, the Sprite goes to
        // HasCallback if there are more callbacks to run, or to Rest, or to Removed
        // if the Sprite has been marked for removal.
        mask |= transitionToFlag(NeedsTextureSync, Rest);
        mask |= transitionToFlag(NeedsTextureSync, HasCallback);
        mask |= transitionToFlag(NeedsTextureSync, Removed);
        // There are no transitions from the Removed phase as this is terminal.
        return mask;
    }
    const ALLOWED_TRANSITION_MASK = createAllowedTransitionMask();
    /**
     * Check whether a given LifecyclePhase is allowed. If not, throw an error.
     */
    function checkLifecyclePhaseTransition(fromPhase, toPhase) {
        if (!(transitionToFlag(fromPhase, toPhase) & ALLOWED_TRANSITION_MASK)) {
            throw new InternalError('Illegal sprite lifecycle phase transition');
        }
    }

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
     * @fileoverview Defines a range object for keeping track of bounds within an
     * array for batch processing purposes.
     */
    class NumericRange {
        constructor() {
            /**
             * NumericRange may be in a defined state, where bounds have numeric values.
             * Users of the range should check this property to see if the bounds are
             * defined.
             */
            this.isDefined = false;
            this.lowBound = NaN;
            this.highBound = NaN;
        }
        /**
         * Reset the range.
         */
        clear() {
            this.isDefined = false;
            this.lowBound = NaN;
            this.highBound = NaN;
        }
        /**
         * Expand either the lowBound, the highBound, or both so that the range
         * includes the provided value. This will define the range if it is not yet
         * defined.
         */
        expandToInclude(value) {
            if (!this.isDefined) {
                this.lowBound = value;
                this.highBound = value;
                this.isDefined = true;
                return;
            }
            if (value < this.lowBound) {
                this.lowBound = value;
            }
            if (value > this.highBound) {
                this.highBound = value;
            }
        }
        /**
         * Truncate the range such that its low and high bounds are both within the
         * provided values. If the current low and high bounds lie entirely outside
         * the provided values, then clear the range.
         *
         * Both the lowValue and highValue arguments are tested for validity. They
         * must be numbers, and highValue must be greater than or equal to lowValue.
         * If these conditions are not met, an error is thrown.
         *
         * If the range is not defined (isDefined == false), then calling this method
         * will have no impact on the object's internal state.
         */
        truncateToWithin(lowValue, highValue) {
            if (isNaN(+lowValue) || isNaN(+highValue)) {
                throw new RangeError('Both values must be numbers');
            }
            if (highValue < lowValue) {
                throw new RangeError('High bound must be greater than or equal to low bound');
            }
            if (!this.isDefined) {
                return;
            }
            if (lowValue > this.highBound || highValue < this.lowBound) {
                this.clear();
                return;
            }
            if (this.lowBound < lowValue) {
                this.lowBound = lowValue;
            }
            if (this.highBound > highValue) {
                this.highBound = highValue;
            }
        }
        /**
         * Determine whether this range overlaps another given range. If either range
         * is not defined, then they do not overlap (returns false). Otherwise, this
         * method returns true if there exist any numbers which appear in both ranges.
         */
        overlaps(otherRange) {
            return this.isDefined && otherRange.isDefined &&
                this.lowBound <= otherRange.highBound &&
                this.highBound >= otherRange.lowBound;
        }
    }

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
     * @fileoverview Implements the Selection API.
     */
    /**
     * Since binding may take some time, this enum lists the various states the
     * binding operation could be in.
     */
    var BindingState;
    (function (BindingState) {
        /**
         * Default state, no bind is waiting to occur or in flight.
         */
        BindingState[BindingState["None"] = 0] = "None";
        /**
         * If a call to bind() followed a call to clear(), then the bind() may be
         * blocked waiting for the clear to finish.
         */
        BindingState[BindingState["Blocked"] = 1] = "Blocked";
        /**
         * Once a call to bind() occurs, the various tasks may not begin until the
         * a later animation frame. In this case, the bind is scheduled.
         */
        BindingState[BindingState["Scheduled"] = 2] = "Scheduled";
        /**
         * Binding tasks have started being performed, but not finished.
         */
        BindingState[BindingState["Started"] = 3] = "Started";
    })(BindingState || (BindingState = {}));
    class SelectionImpl {
        /**
         * Create a new Selection which gets its Sprites from the provided Renderer,
         * and schedules tasks via the provided WorkScheduler.
         */
        constructor(stepsBetweenChecks, coordinator) {
            this.stepsBetweenChecks = stepsBetweenChecks;
            this.coordinator = coordinator;
            this.sprites = [];
            this.boundData = [];
            this.bindingState = BindingState.None;
            this.hasWarned = false;
            // Unique objects to identify this instance's bind() and clear() tasks.
            this.bindingTaskId = Symbol('bindingTask');
            this.clearingTaskId = Symbol('clearingTask');
        }
        onBind(bindCallback) {
            this.bindCallback = bindCallback;
            return this;
        }
        onInit(initCallback) {
            this.initCallback = initCallback;
            return this;
        }
        onEnter(enterCallback) {
            this.enterCallback = enterCallback;
            return this;
        }
        onUpdate(updateCallback) {
            this.updateCallback = updateCallback;
            return this;
        }
        onExit(exitCallback) {
            this.exitCallback = exitCallback;
            return this;
        }
        /**
         * Bind the supplied data array to the array of managed Sprites. This method
         * returns immediately, but queues an incremental task to be carried out by
         * the WorkScheduler.
         *
         * Note that whereas the Selection API offers the user callbacks for onBind(),
         * onInit(), onEnter(), onUpdate() and onExit(), the underlying Sprite API
         * offers only enter(), update() and exit(). To handle this mismatch, the
         * Sprite's update() callback must be used to invoke more than one of the
         * Selection's callback. Here's the implementation mapping:
         *
         *  - Selection::onInit() - Sprite::enter()
         *  - Selection::onEnter() - Sprite::update()
         *  - Selection::onUpdate() - Sprite::update()
         *  - Selection::onExit() - Sprite::exit()
         *  - Selection::onBind() - Sprite::enter(), ::update() and ::exit().
         *
         * The Selection's onBind() callback, if specified, will be invoked
         * immediately prior to every other callback. So for an entering datum, the
         * invocation schedule is as follows:
         *
         *  - Sprite::enter() calls Selection::onBind() then Selection::onInit()
         *  - Sprite::update() calls Selection::onBind() then Selection::onEnter()
         *
         * The underlying Sprite implementation ensures that its enter() callback will
         * be invoked before its update() callback. If both have been specified, they
         * will be invoked in separate animation frames. This guarantees that the
         * Selection's onInit() callback is called before onEnter().
         *
         * @param data Array of data to bind to the internal Sprites list.
         */
        bind(data, keyFn) {
            // TODO(jimbo): Implement keyFn for non-index binding.
            if (keyFn) {
                throw new Error('keyFn mapping is not yet supported');
            }
            // If a previous call to bind() has been scheduled but not started, it
            // probably indicates a bug in the API user's code.
            if (!this.hasWarned && this.bindingState === BindingState.Scheduled) {
                console.warn('Possibly conflicting .bind() invocations detected');
                this.hasWarned = true;
            }
            // If there's a clearingTask already in flight, then short-circuit here and
            // schedule a future attempt using the bindingTaskId.
            if (this.clearingTask) {
                this.bindingState = BindingState.Blocked;
                this.coordinator.workScheduler.scheduleUniqueTask({
                    id: this.bindingTaskId,
                    callback: () => {
                        this.bindingState = BindingState.None;
                        this.bind(data, keyFn);
                    },
                });
                return this;
            }
            // Keep track of number of steps taken during this task to break up the
            // number of times we check how much time is remaining.
            let step = 0;
            const dataLength = data.length;
            let lastEnterIndex = this.boundData.length;
            // Performs data binding for entering data while there's time remaining,
            // then returns whether there's more work to do.
            const enterTask = (remaining) => {
                while (lastEnterIndex < dataLength) {
                    step++;
                    const index = lastEnterIndex++;
                    const datum = data[index];
                    const sprite = this.coordinator.createSprite();
                    this.boundData[index] = datum;
                    this.sprites[index] = sprite;
                    const { initCallback, enterCallback, bindCallback } = this;
                    if (initCallback || bindCallback) {
                        // Schedule the Sprite's enter() callback to run. This will invoke
                        // the bindCallback and/or the initCallback, in that order.
                        sprite.enter(spriteView => {
                            if (bindCallback) {
                                // The bindCallback, if present is always invoked when binding
                                // data, immediately before more specific callbacks if present.
                                bindCallback(spriteView, datum);
                            }
                            if (initCallback) {
                                initCallback(spriteView, datum);
                            }
                            // NOTE: Because init() applies to the first frame of an entering
                            // data point, it should never have a transition time.
                            spriteView.TransitionTimeMs = 0;
                        });
                    }
                    if (enterCallback || bindCallback) {
                        // Schedule the Sprite's update() callback to run. This will invoke
                        // the bindCallback and/or the enterCallback, in that order.
                        sprite.update(spriteView => {
                            if (bindCallback) {
                                // The bindCallback, if present is always invoked when binding
                                // data, immediately before more specific callbacks if present.
                                bindCallback(spriteView, datum);
                            }
                            if (enterCallback) {
                                enterCallback(spriteView, datum);
                            }
                        });
                    }
                    if (step % this.stepsBetweenChecks === 0 && remaining() <= 0) {
                        break;
                    }
                }
                return lastEnterIndex >= dataLength;
            };
            let lastUpdateIndex = 0;
            const updateLength = Math.min(dataLength, this.boundData.length);
            // Performs update data binding while there's time remaining, then returns
            // whether there's more work to do.
            const updateTask = (remaining) => {
                while (lastUpdateIndex < updateLength) {
                    step++;
                    const index = lastUpdateIndex++;
                    const datum = data[index];
                    const sprite = this.sprites[index];
                    this.boundData[index] = datum;
                    const { updateCallback, bindCallback } = this;
                    if (updateCallback || bindCallback) {
                        // Schedule the Sprite's update() callback to run. This will invoke
                        // the bindCallback and/or the updateCallback, in that order.
                        sprite.update(spriteView => {
                            if (bindCallback) {
                                // The bindCallback, if present is always invoked when binding
                                // data, immediately before more specific callbacks if present.
                                bindCallback(spriteView, datum);
                            }
                            if (updateCallback) {
                                updateCallback(spriteView, datum);
                            }
                        });
                    }
                    if (step % this.stepsBetweenChecks === 0 && remaining() <= 0) {
                        break;
                    }
                }
                return lastUpdateIndex >= updateLength;
            };
            // Performs exit data binding while there's time remaining, then returns
            // whether there's more work to do.
            const exitTask = (remaining) => {
                let index = dataLength;
                while (index < this.boundData.length) {
                    step++;
                    const datum = this.boundData[index];
                    const sprite = this.sprites[index];
                    // Increment index here, so that it's always one more than the last
                    // index visited, even if we break early below due to time check.
                    index++;
                    if (!sprite.isAbandoned && !sprite.isActive && !sprite.isRemoved) {
                        // It may be that the exiting sprite was never rendered, for example
                        // if there was insufficient capacity in the data texture when an
                        // earlier call to bind() created it. In such a case, the appropriate
                        // thing to do is to just abandon it.
                        sprite.abandon();
                    }
                    else {
                        const { exitCallback, bindCallback } = this;
                        // Schedule the Sprite's exit() callback to run. This will invoke
                        // the bindCallback and/or the exitCallback, in that order.
                        sprite.exit(spriteView => {
                            if (bindCallback) {
                                // The bindCallback, if present is always invoked when binding
                                // data, immediately before more specific callbacks if present.
                                bindCallback(spriteView, datum);
                            }
                            if (exitCallback) {
                                exitCallback(spriteView, datum);
                            }
                        });
                    }
                    if (step % this.stepsBetweenChecks === 0 && remaining() <= 0) {
                        break;
                    }
                }
                // If we've made any progress at all, remove those data and sprites for
                // which we've successfully established exit callbacks.
                if (index > dataLength) {
                    this.boundData.splice(dataLength, index - dataLength);
                    this.sprites.splice(dataLength, index - dataLength);
                }
                // Return true when the length of the bound data is finally at parity with
                // the length of the incoming data to bind. That is, when we've spliced
                // out all of the exiting data and sprites.
                return this.boundData.length <= dataLength;
            };
            // Define a binding task which will be invoked by the WorkScheduler to
            // incrementally carry out the prevously defined tasks.
            this.bindingTask = {
                // Setting id to this ensures that there will be only one bindingTask
                // associated with this object at a time. If the API user calls bind()
                // again before the previous task finishes, whatever work it had been
                // doing will be dropped for the new parameters.
                id: this.bindingTaskId,
                // Perform at least one unit of work, starting with the exit data binding
                // tasks, then the updates, then the enters. Doing the exits first makes
                // it more likely that Sprite memory will be freed by the time we need it
                // for entering data points.
                callback: (remaining) => {
                    this.bindingState = BindingState.Started;
                    step = 0;
                    const result = exitTask(remaining) && updateTask(remaining) &&
                        enterTask(remaining);
                    if (result) {
                        delete this.bindingTask;
                        this.bindingState = BindingState.None;
                    }
                    return result;
                },
                // The return value of the callback indicates whether there's more to do.
                // Setting runUntilDone to true here signals that if the task cannot run
                // to completion due to time, the WorkScheduler should push it back onto
                // the end of the queue.
                runUntilDone: true,
            };
            // Use the provided WorkScheduler to schedule bindingTask.
            this.coordinator.workScheduler.scheduleUniqueTask(this.bindingTask);
            this.bindingState = BindingState.Scheduled;
            // Allow method call chaining.
            return this;
        }
        /**
         * Clear any previously bound data and Sprites. Previously bound Sprites will
         * still have their callbacks invoked. This is equivalent to calling bind()
         * with an empty array, except that it is guaranteed to drop expsting data and
         * Sprites, whereas calling bind([]) may be interrupted by a later call to
         * bind().
         */
        clear() {
            let step = 0;
            // Get a reference to the currently specified exitCallback and bindCallback,
            // if any. We do this now to ensure that later changes do not affect the way
            // thate the previously bound sprites leave.
            const { exitCallback, bindCallback } = this;
            // Performs exit data binding while there's time remaining, then returns
            // whether there's more work to do.
            const exitTask = (remaining) => {
                let index = 0;
                while (index < this.boundData.length) {
                    step++;
                    const datum = this.boundData[index];
                    const sprite = this.sprites[index];
                    // Increment index here, so that it's always one more than the last
                    // index visited, even if we break early below due to time check.
                    index++;
                    if (!sprite.isAbandoned && !sprite.isActive && !sprite.isRemoved) {
                        // It may be that the exiting sprite was never rendered, for example
                        // if there was insufficient capacity in the data texture when an
                        // earlier call to bind() created it. In such a case, the appropriate
                        // thing to do is to just abandon it.
                        sprite.abandon();
                    }
                    else {
                        // Schedule the Sprite's exit() callback to run. This will invoke
                        // the bindCallback and/or the exitCallback, in that order. Even if
                        // neither bindCallback nor exitCallback are specified, we still need
                        // to call .exit() to mark the Sprite for removal.
                        sprite.exit(spriteView => {
                            if (bindCallback) {
                                // The bindCallback, if present is always invoked when binding
                                // data, immediately before more specific callbacks if present.
                                bindCallback(spriteView, datum);
                            }
                            if (exitCallback) {
                                exitCallback(spriteView, datum);
                            }
                        });
                    }
                    if (step % this.stepsBetweenChecks === 0 && remaining() <= 0) {
                        break;
                    }
                }
                // Remove those data and sprites for which we've successfully established
                // exit callbacks.
                this.boundData.splice(0, index);
                this.sprites.splice(0, index);
                // Return whether there's more data to clear.
                return !this.boundData.length;
            };
            // Define a clearing task which will be invoked by the WorkScheduler to
            // incrementally clear all data.
            this.clearingTask = {
                // Setting id to this ensures that there will be only one bindingTask
                // associated with this object at a time. If the API user calls bind()
                // again before the previous task finishes, whatever work it had been
                // doing will be dropped for the new parameters.
                id: this.clearingTaskId,
                // Perform as much of the clearing work as time allows. When finished,
                // remove the clearingTask member. This will unblock the bindingTask, if
                // there is one.
                callback: (remaining) => {
                    step = 0;
                    const result = exitTask(remaining);
                    if (result) {
                        delete this.clearingTask;
                    }
                    return result;
                },
                // The return value of the callback indicates whether there's more to do.
                // Setting runUntilDone to true here signals that if the task cannot run
                // to completion due to time, the WorkScheduler should push it back onto
                // the end of the queue.
                runUntilDone: true,
            };
            // If a binding task was previously scheduled, unschedule it since clear
            // must take precedence.
            if (this.bindingTask) {
                this.coordinator.workScheduler.unscheduleTask(this.bindingTask);
                delete this.bindingTask;
            }
            // Use the provided WorkScheduler to schedule the task.
            this.coordinator.workScheduler.scheduleUniqueTask(this.clearingTask);
            this.bindingState = BindingState.None;
            // Allow method call chaining.
            return this;
        }
        /**
         * Given target coordinates relative to the drawable container,
         * determine which data-bound Sprites' bounding boxes intersect the target,
         * then resolve with a result that includes an array of the bound data. If
         * none of the Selection's Sprites intersect the target, then the resolved
         * array will be empty.
         *
         * @param hitTestParameters Coordinates of the box/point to test.
         * @return CancellablePromise Yielding a hit test result including the data.
         */
        hitTest(hitTestParameters) {
            const hitTestResults = this.coordinator.hitTest(Object.assign(Object.assign({}, hitTestParameters), { sprites: this.sprites }));
            // Collect the indices of hitTestResults whose values indicate that the
            // sprite was hit.
            const hitIndices = new Uint32Array(hitTestResults.length);
            let hitCount = 0;
            for (let i = 0; i < hitTestResults.length; i++) {
                const result = hitTestResults[i];
                if (result >= 0) {
                    hitIndices[hitCount++] = i;
                }
            }
            // Short-circuit if it was a total miss.
            if (!hitCount) {
                return [];
            }
            if (hitTestParameters.sortResults === undefined ||
                hitTestParameters.sortResults) {
                // Sort the hitIndices by the hitTestResult values for them. In most
                // cases, they'll already be mostly or entirely in order, but after
                // thrashing (creating and removing sprites aggressively) it could be that
                // later sprites use earlier swatches and would appear out-of-order in the
                // hitTestResults.
                hitIndices.subarray(0, hitCount)
                    .sort((a, b) => hitTestResults[a] - hitTestResults[b]);
            }
            // Collect bound data for hit sprites.
            const results = new Array(hitCount);
            for (let i = 0; i < hitCount; i++) {
                results[i] = this.boundData[hitIndices[i]];
            }
            return results;
        }
    }

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
     * Internal properties of a SpriteImpl that are available to the Scene
     * implementation but inaccessible to upstream API consumers.
     */
    class SpriteImplProperties {
        constructor() {
            /**
             * The lifecycle phase of the Sprite. Updates to this value are NOT arbitrary.
             * Only certain transitions are acceptable. See the lifecyclePhase setter.
             */
            this.internalLifecyclePhase = LifecyclePhase.Created;
        }
        /**
         * Return whether this sprite has any pending callbacks to run.
         */
        get hasCallback() {
            return !!(this.enterCallback || this.updateCallback || this.exitCallback);
        }
        /**
         * Get the current lifecycle state.
         */
        get lifecyclePhase() {
            return this.internalLifecyclePhase;
        }
        /**
         * Set the current lifecycle state. This will enforce the lifecycle
         * transitions and throw if an illegal transition is attempted.
         */
        set lifecyclePhase(lifecyclePhase) {
            checkLifecyclePhaseTransition(this.internalLifecyclePhase, lifecyclePhase);
            this.internalLifecyclePhase = lifecyclePhase;
        }
    }

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
    class SpriteImpl {
        /**
         * Create a new Sprite in the associated Scene.
         */
        constructor(coordinator) {
            this.coordinator = coordinator;
            this[InternalPropertiesSymbol] = new SpriteImplProperties();
        }
        enter(enterCallback) {
            if (this.isAbandoned) {
                throw new Error('Cannot add enter callback to abandoned sprite');
            }
            if (this.isRemoved) {
                throw new Error('Cannot add enter callback to Removed sprite');
            }
            const properties = this[InternalPropertiesSymbol];
            properties.enterCallback = enterCallback;
            if (properties.lifecyclePhase === LifecyclePhase.Rest) {
                if (properties.index === undefined) {
                    throw new InternalError('Sprite lacks index');
                }
                this.coordinator.markSpriteCallback(properties.index);
                properties.lifecyclePhase = LifecyclePhase.HasCallback;
            }
            return this;
        }
        update(updateCallback) {
            if (this.isAbandoned) {
                throw new Error('Cannot add update callback to abandoned sprite');
            }
            if (this.isRemoved) {
                throw new Error('Cannot add update callback to Removed sprite');
            }
            const properties = this[InternalPropertiesSymbol];
            properties.updateCallback = updateCallback;
            if (properties.lifecyclePhase === LifecyclePhase.Rest) {
                if (properties.index === undefined) {
                    throw new InternalError('Sprite lacks index');
                }
                this.coordinator.markSpriteCallback(properties.index);
                properties.lifecyclePhase = LifecyclePhase.HasCallback;
            }
            return this;
        }
        exit(exitCallback) {
            if (this.isAbandoned) {
                throw new Error('Cannot add exit callback to abandoned sprite');
            }
            if (this.isRemoved) {
                throw new Error('Cannot add exit callback to Removed sprite');
            }
            const properties = this[InternalPropertiesSymbol];
            properties.exitCallback = exitCallback;
            properties.toBeRemoved = true;
            if (properties.lifecyclePhase === LifecyclePhase.Rest) {
                if (properties.index === undefined) {
                    throw new InternalError('Sprite lacks index');
                }
                this.coordinator.markSpriteCallback(properties.index);
                properties.lifecyclePhase = LifecyclePhase.HasCallback;
            }
            return this;
        }
        abandon() {
            if (this.isAbandoned) {
                throw new Error('Cannot abandon a Sprite already marked abandoned');
            }
            if (this.isRemoved) {
                throw new Error('Cannot abandon a Sprite that has been removed');
            }
            if (this.isActive) {
                throw new Error('Cannot abandon an active Sprite');
            }
            const properties = this[InternalPropertiesSymbol];
            properties.isAbandoned = true;
            properties.enterCallback = undefined;
            properties.updateCallback = undefined;
            properties.exitCallback = undefined;
            properties.toBeRemoved = true;
            properties.lifecyclePhase = LifecyclePhase.Removed;
        }
        /**
         * Any lifecycle phase other than Created and Removed signals the Sprite is
         * active.
         */
        get isActive() {
            const lifecyclePhase = this[InternalPropertiesSymbol].lifecyclePhase;
            return lifecyclePhase !== LifecyclePhase.Created &&
                lifecyclePhase !== LifecyclePhase.Removed;
        }
        get isAbandoned() {
            return !!this[InternalPropertiesSymbol].isAbandoned;
        }
        get isRemoved() {
            return this[InternalPropertiesSymbol].lifecyclePhase ===
                LifecyclePhase.Removed;
        }
    }

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
     * Graphics cards have limited memory, and so it's possible for the API user to
     * create more sprites than are representable in the data textures. Additional
     * sprites beyond those that fit in GPU memory wait until other sprites have
     * been removed, freeing up memory. The runAssignWaiting() task assigns waiting
     * sprites to swatches that have been freed by other Removed sprites.
     *
     * @param coordinator Upstream object upon which this task operates.
     * @param remaining Function to test how much longer we can continue performing
     * operations before ceding control back to the UI thread.
     * @param stepsBetweenChecks Number of steps to perform between invocations of
     * the remaining time function. Must be a non-negative integer. Should be in the
     * 100-1000 range. Higher numbers reduce the frequency of time checks, but run
     * the risk of running too long before returning control to the UI thread
     * (laggy user experience).
     */
    function runAssignWaiting(coordinator, remaining, stepsBetweenChecks) {
        const { removedIndexRange, sprites, waitingSprites, } = coordinator;
        if (!removedIndexRange.isDefined) {
            // This indicates an error condition in which there was an assign task
            // queued but before it could run the removed index ranges were somehow
            // used up.
            throw new InternalError('No removed indices available to assign');
        }
        if (!waitingSprites.length) {
            // This indicates an error condition in which there is additional capacity
            // to dequeue waiting sprites, but somehow there are no waiting sprites to
            // dequeue.
            throw new InternalError('No waiting sprites to assign');
        }
        // Inside the while loop, we'll be iterating through both the removed index
        // range and the waiting sprites queue. Both of these lists contain items
        // which may not be applicable to our current task. A waiting sprite may be
        // abandoned, and the removed index range very likely contains non-removed
        // sprites. However, in no case will it ever make sense that we made no
        // progress through the waiting sprites list.
        let waitingIndex = 0;
        let removedIndex = removedIndexRange.lowBound;
        // Track number of steps to reduce calls to remaining() for time checks.
        // Starts at 1 to ensure we make at least some progress through the loop
        // before quitting to time.
        let step = 1;
        // Keep track whether we've assigned any sprites that already have a callback
        // set. If so then we'll need to queue a run callbacks task.
        let anyHasCallback = false;
        while (waitingIndex < waitingSprites.length &&
            removedIndex <= removedIndexRange.highBound) {
            // If we've made any progress and we're out of time, break.
            if (waitingIndex > 0 && step++ % stepsBetweenChecks === 0 &&
                remaining() <= 0) {
                break;
            }
            // The list of waiting sprites may contain some which have been abandoned,
            // so here we iterate until we find one that has NOT been abandoned, or we
            // run out of sprites to check. It's possible that all of the previously
            // waiting sprites have since been abandoned, and so we should allow for
            // that possibility.
            while (waitingIndex < waitingSprites.length &&
                waitingSprites[waitingIndex][InternalPropertiesSymbol].isAbandoned) {
                waitingIndex++;
            }
            if (waitingIndex >= waitingSprites.length) {
                // Ran out of potentially waiting sprites to check. This is not an error.
                // It may be that the waiting sprites at the end of the list have been
                // abandoned.
                break;
            }
            // The removedIndexRange contains all of the sprites slated for removal, but
            // very probably also includes sprites which are not removed, so here we
            // iterate until we find one that has been removed.
            while (removedIndex <= removedIndexRange.highBound &&
                !sprites[removedIndex].isRemoved) {
                removedIndex++;
            }
            if (removedIndex > removedIndexRange.highBound) {
                // This signals a bug in the removal logic. Even though the
                // removedIndexRange will often include non-removed Sprites, it should
                // never be the case that the Sprites sitting at the extents of that range
                // are not in the Removed lifecycle phase. Therefore as we iterate through
                // the range, when we get to the end, it should definitely be a removed
                // sprite whose index and swatch we can reuse.
                throw new InternalError('Removed index range ended on a non-removed sprite');
            }
            // Now that we've found both a non-abandoned waiting sprite, and a removed
            // sprite, we can give the removed sprite's index (and swatch) to the
            // waiting sprite.
            const waitingSprite = waitingSprites[waitingIndex];
            const removedSprite = sprites[removedIndex];
            const removedProperties = removedSprite[InternalPropertiesSymbol];
            const waitingProperties = waitingSprite[InternalPropertiesSymbol];
            if (removedProperties.index === undefined) {
                throw new InternalError('Removed Sprite lacks index');
            }
            coordinator.assignSpriteToIndex(waitingSprite, removedProperties.index);
            if (waitingProperties.index === undefined) {
                throw new InternalError('Sprite index was not assigned');
            }
            // Upgrade the waiting Sprite's phase from Rest to HasCallback if needed.
            if (waitingProperties.hasCallback) {
                anyHasCallback = true;
                waitingProperties.lifecyclePhase = LifecyclePhase.HasCallback;
                coordinator.callbacksIndexRange.expandToInclude(waitingProperties.index);
            }
            // Increment both the waitingIndex and the removedIndex so that the next
            // iteration of the loop starts looking beyond the current indices. If
            // either is beyond their designated ranges, the next loop will kick out.
            waitingIndex++;
            removedIndex++;
        }
        // Splice out the waiting sprites that have been assigned or skipped because
        // they were abandoned.
        waitingSprites.splice(0, waitingIndex);
        // Clear out the portion of the removed range having sprites which have had
        // their indices and swatches reassigned.
        if (removedIndex > removedIndexRange.highBound) {
            removedIndexRange.clear();
        }
        else {
            removedIndexRange.truncateToWithin(removedIndex, removedIndexRange.highBound);
        }
        if (anyHasCallback) {
            coordinator.queueRunCallbacks();
        }
        if (waitingSprites.length && removedIndexRange.isDefined) {
            coordinator.queueAssignWaiting();
        }
    }

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
     * Run callbacks for sprites that have them. May not finish due to time
     * constraints. Since this invokes callback functions provided by upstream API
     * users, great care must be taken to ensure that any errors which upstream
     * callbacks throw are made visible to the developer, but do not corrupt
     * internal state.
     *
     * @param coordinator Upstream object upon which this task operates.
     * @param remaining Function to test how much longer we can continue performing
     * operations before ceding control back to the UI thread.
     * @param stepsBetweenChecks Number of steps to perform between invocations of
     * the remaining time function.
     */
    function runCallbacks(coordinator, remaining, stepsBetweenChecks) {
        if (!coordinator.callbacksIndexRange.isDefined) {
            // This indicates a timing error in the code.
            throw new InternalError('Running callbacks requires a range of indices');
        }
        // Make note of the exit index range for looping purposes.
        const { lowBound, highBound } = coordinator.callbacksIndexRange;
        // Clear the range. It will be expanded as needed.
        coordinator.callbacksIndexRange.clear();
        // Keep track of the last Sprite visited and its properties. This way we can
        // recover from a user's callback error.
        let sprite;
        let properties;
        // Keep track of whether we've encountered any sprites that will need a
        // rebase before texture sync.
        let anyNeedsRebase = false;
        // Keep track of whether we've encountered any sprites that are ready for a
        // texture sync without need for rebase.
        let anyNeedsTextureSync = false;
        // To reduce the cost of invoking this constantly, reuse the time value.
        const currentTimeMs = coordinator.elapsedTimeMs();
        // Procedure for advancing the sprite state after its callback has been
        // invoked. Defined here so that its available in both try and catch.
        const afterCallback = () => {
            if (!properties) {
                throw new InternalError('Attempted to re-run afterCallback steps');
            }
            const { spriteView, index } = properties;
            if (!spriteView || index === undefined) {
                throw new InternalError('Sprite missing required properties');
            }
            // Append the current time to the arrival time value.
            spriteView.TransitionTimeMs += currentTimeMs;
            // Make sure that the draw Ts range includes the current transition time
            // plus a buffer to account for time taken by work tasks. Without the
            // buffer, it can happen that the last drawn frame does not include the
            // final resting state of the Sprite, especially when the user-specified
            // transition time is near or below one frame (about 17ms).
            coordinator.toDrawTsRange.expandToInclude(spriteView.TransitionTimeMs + coordinator.workScheduler.maxWorkTimeMs);
            if (spriteView.TransitionTimeMs > currentTimeMs) {
                // If the callback set a future arrival time (Ts), then this sprite
                // needs a rebase.
                anyNeedsRebase = true;
                properties.lifecyclePhase = LifecyclePhase.NeedsRebase;
                coordinator.needsRebaseIndexRange.expandToInclude(index);
            }
            else {
                // Otherwise it's ready for texture sync immediately.
                anyNeedsTextureSync = true;
                properties.lifecyclePhase = LifecyclePhase.NeedsTextureSync;
                coordinator.needsTextureSyncIndexRange.expandToInclude(index);
                if (properties.toBeRemoved && !properties.hasCallback) {
                    // If this sprite is slated for removal, and it has no further
                    // callbacks to invoke, then we need to flash zeros to the float array
                    // underlying the data view since this sprite's swatches will be
                    // returned for future reuse after the next texture sync.
                    spriteView[DataViewSymbol].fill(0);
                }
            }
            // Clear loop variables to make accidental re-running of afterCallback()
            // detectable (see error above).
            sprite = undefined;
            properties = undefined;
        };
        // Keep track of the last visited index so that we can know outside the loop
        // whether we made it all the way through.
        let index = lowBound;
        try {
            // Use a step counter to determine when to check the time remaining.
            // Starting at 1 ensures we don't perform a check right away upon entering
            // the loop. We'll iterate through the loop at least once. We always want
            // to make at least some progress before breaking.
            let step = 1;
            while (index <= highBound) {
                // Check to make sure we haven't run for too long without ceding the
                // execution thread. Always make sure we've gone at least one time
                // around the loop. This check is at the top of the loop so that it's
                // invoked every time without fail to prevent runaway execution.
                if (index > lowBound && step++ % stepsBetweenChecks === 0 &&
                    remaining() <= 0) {
                    break;
                }
                sprite = coordinator.sprites[index];
                properties = sprite[InternalPropertiesSymbol];
                // Increment the index here so that it's always one more than the
                // currently visited sprite. If we've managed to visit all of the
                // sprites with callbacks, then index will end up strictly greater than
                // the value of highBound.
                index++;
                if (properties.lifecyclePhase !== LifecyclePhase.HasCallback) {
                    continue;
                }
                if (!properties.spriteView) {
                    throw new InternalError('Sprite in HasCallback lifecycle phase missing SpriteView');
                }
                // Pick earliest callback to run (enter, then update, then exit).
                let callback;
                if (properties.enterCallback) {
                    callback = properties.enterCallback;
                    properties.enterCallback = undefined;
                }
                else if (properties.updateCallback) {
                    callback = properties.updateCallback;
                    properties.updateCallback = undefined;
                }
                else if (properties.exitCallback) {
                    callback = properties.exitCallback;
                    properties.exitCallback = undefined;
                }
                else {
                    // If this error occurs, it means that the sprite was in the
                    // HasCallback lifecycle phase but did not, in fact, have any
                    // callbacks. This should not be possible under normal operations
                    // and indicates a bug in the phase transition logic.
                    throw new InternalError('Sprite in HasCallback state missing callbacks');
                }
                // Poke the defaultTransitionTimeMs into the spriteView arrival time.
                // This value may be updated by the callback to specify a different
                // transition duration. Whether the value is changed or not as part of
                // the callback, the value will have the elapsed time added to it so
                // that the transition completion time is in the future.
                properties.spriteView.TransitionTimeMs =
                    coordinator.defaultTransitionTimeMs;
                // Reset the step counter to force a time check at the top of the next
                // iteration through the loop.
                step = 0;
                // Invoke the callback, may error out.
                callback.call(sprite, properties.spriteView);
                // Perform after callback steps. This is duplicated in the catch
                // clause, just in case.
                afterCallback();
            }
        }
        catch (err) {
            // The most likely place for an error to have occurred is the user's
            // callback function. So here we should ensure that the after callback
            // steps are invoked.
            if (properties &&
                properties.lifecyclePhase === LifecyclePhase.HasCallback) {
                afterCallback();
            }
            // Rethrowing here will not prevent the finally block below from running.
            throw err;
        }
        finally {
            if (anyNeedsRebase) {
                coordinator.queueRebase();
            }
            if (anyNeedsTextureSync) {
                coordinator.queueTextureSync();
            }
            if (index <= highBound) {
                // We didn't finish visiting all of the sprites between the low and high
                // bounds, so we need to make sure the range includes the portion that
                // we didn't get to.
                coordinator.callbacksIndexRange.expandToInclude(index);
                coordinator.callbacksIndexRange.expandToInclude(highBound);
            }
            if (coordinator.callbacksIndexRange.isDefined) {
                // There are still more sprites with callbacks. Schedule a future task to
                // continue the work.
                coordinator.queueRunCallbacks();
            }
            if (coordinator.toDrawTsRange.isDefined) {
                coordinator.queueDraw();
            }
        }
    }

    /**
     * Perform a hit test and read back the results.
     *
     * @param coordinator Upstream object upon which this task operates.
     */
    function runHitTest(coordinator) {
        // These values are API-user provided, but are already be checked for
        // correctness upstream in SceneInternal.
        const { sprites, width, height, inclusive } = coordinator.hitTestParameters;
        coordinator.hitTestCount = sprites.length;
        const results = coordinator.hitTestOutputResults.subarray(0, coordinator.hitTestCount);
        // Short-circuit if the parameters guarantee there will be no hits.
        if (!inclusive && (!width || !height)) {
            console.warn('Inclusive hit test on a box with zero size always misses');
            results.fill(-1);
            return;
        }
        // Shorthand variables to make code more readable.
        const inputUv = coordinator.instanceHitTestInputUvValues;
        const indexActive = coordinator.instanceHitTestInputIndexActiveValues;
        const swatchUv = coordinator.instanceSwatchUvValues;
        // Copy swatch UVs into the input UV values array. This way, when the command
        // runs, it will reference the correct swatches for the candidate sprites.
        for (let i = 0; i < sprites.length; i++) {
            const sprite = sprites[i];
            const swatchIndex = sprite[InternalPropertiesSymbol].index || 0;
            inputUv[i * 2] = swatchUv[swatchIndex * 2];
            inputUv[i * 2 + 1] = swatchUv[swatchIndex * 2 + 1];
            indexActive[i * 2] = swatchIndex;
            indexActive[i * 2 + 1] = sprite.isActive ? 1 : 0;
        }
        // Re-bind the UV and Index/Active values to their buffers.
        coordinator.instanceHitTestInputUvBuffer(inputUv.subarray(0, coordinator.hitTestCount * 2));
        coordinator.instanceHitTestInputIndexActiveBuffer(indexActive.subarray(0, coordinator.hitTestCount * 2));
        // Invoke the hit test command.
        coordinator.hitTestCommand();
        const readHeight = Math.ceil(coordinator.hitTestCount /
            coordinator.hitTestAttributeMapper.swatchesPerRow);
        // Read values back from framebuffer. This is SLOW! Upwards of 50ms-200ms
        // depending on the amount of data being read back. It's a blocking and
        // stalling procedure. Reading from the framebuffer requires that all the
        // queued GPU actions are finished and flushed.
        coordinator.regl.read({
            x: 0,
            y: 0,
            width: coordinator.hitTestAttributeMapper.textureWidth,
            height: readHeight,
            data: coordinator.hitTestOutputValues,
            framebuffer: coordinator.hitTestOutputValuesFramebuffer,
        });
        // Unpack results.
        const { totalSwatches } = coordinator.hitTestAttributeMapper;
        const outputValues = coordinator.hitTestOutputValues;
        for (let i = 0; i < coordinator.hitTestCount; i++) {
            // Read RGBA Uint8 color channels.
            const r = outputValues[i * 4];
            const g = outputValues[i * 4 + 1];
            const b = outputValues[i * 4 + 2];
            const a = outputValues[i * 4 + 3];
            // Unpack to recover floating point representation in the range 0-1.
            const n = (r / (256 * 256 * 256) + g / (256 * 256) + b / 256 + a) / 255;
            // Recover swatch index value, or -1 for a miss. These values will not be
            // 100% accurate due to loss of precision when normalizing and
            // packing/unpacking. However, misses will be definitely equal to -1, and
            // the values will be ordinally correct, meaning that greater numbers
            // equate to higher up the z-order.
            results[i] = n * (totalSwatches + 1) - 1;
        }
    }

    /**
     * Perform a rebase operation for all sprites in this state. This should be
     * invoked by the WorkScheduler.
     *
     * @param coordinator Upstream object upon which this task operates.
     */
    function runRebase(coordinator) {
        // Sanity check: nothing to do if the rebase index range is empty.
        if (!coordinator.needsRebaseIndexRange.isDefined) {
            throw new InternalError('No sprites are queued for rebase');
        }
        // For each queued sprite to rebase, copy its UV values into the
        // instanceRebaseUvValues array.
        coordinator.rebaseCount = 0;
        const { lowBound, highBound } = coordinator.needsRebaseIndexRange;
        for (let index = lowBound; index <= highBound; index++) {
            const sprite = coordinator.sprites[index];
            const properties = sprite[InternalPropertiesSymbol];
            // Skip sprites that are not waiting for a rebase.
            if (properties.lifecyclePhase !== LifecyclePhase.NeedsRebase) {
                continue;
            }
            // Update properties to match new state.
            coordinator.needsTextureSyncIndexRange.expandToInclude(index);
            properties.lifecyclePhase = LifecyclePhase.NeedsTextureSync;
            // Put instance swatch UV values to the rebase UV values array.
            coordinator.instanceRebaseUvValues[coordinator.rebaseCount * 2] =
                coordinator.instanceSwatchUvValues[index * 2];
            coordinator.instanceRebaseUvValues[coordinator.rebaseCount * 2 + 1] =
                coordinator.instanceSwatchUvValues[index * 2 + 1];
            coordinator.rebaseCount++;
        }
        if (!coordinator.rebaseCount) {
            // This signals that while the rebase index range was defined, none of the
            // sprites in that range were actually due for rebase.
            throw new InternalError('No sprites were found to need rebase');
        }
        // Queue a texture sync, since that's always the next lifecycle phase for
        // any sprites that have been rebased.
        coordinator.queueTextureSync();
        // Bind the rebase UV values to the buffer.
        coordinator.instanceRebaseUvBuffer(coordinator.instanceRebaseUvValues.subarray(0, coordinator.rebaseCount * 2));
        // Render using the rebase shader. This should leave intact any swatches
        // for sprites that are not being rebased.
        coordinator.rebaseCommand();
        // Flash values back to 'input' previous texture.
        coordinator.previousValuesFramebuffer.use(() => coordinator.previousValuesTexture({ copy: true }));
        // Reset the rebase queue length since the queue has been cleared.
        coordinator.needsRebaseIndexRange.clear();
    }

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
     * This batch task looks for sprites that have been marked for removal and
     * whose arrival times have passed. Those sprites need to have their values
     * flashed to zero and to be marked for texture sync. That way, the swatch
     * that the sprite used to command can be reused for another sprite later.
     *
     * @param coordinator Upstream object upon which this task operates.
     * @param remaining Function to test how much longer we can continue performing
     * operations before ceding control back to the UI thread.
     * @param stepsBetweenChecks Number of steps to perform between invocations of
     * the remaining time function.
     */
    function runRemoval(coordinator, remaining, stepsBetweenChecks) {
        if (!coordinator.toBeRemovedIndexRange.isDefined ||
            !coordinator.toBeRemovedTsRange.isDefined) {
            // This signals an error in lifecycle phase change logic of the coordinator.
            // This method should not be invoke until there are sprites slated for
            // removal.
            throw new InternalError('No sprites are queued for removal');
        }
        const currentTimeMs = coordinator.elapsedTimeMs();
        const lowTs = coordinator.toBeRemovedTsRange.lowBound;
        // Check whether any of the sprites that are marked for removal have reached
        // their target times. If not, then we queue a future removal task.
        if (currentTimeMs < lowTs) {
            coordinator.queueRemovalTask();
            return;
        }
        const { lowBound: lowIndex, highBound: highIndex } = coordinator.toBeRemovedIndexRange;
        // Clear the removal index and ts ranges. They will be added to as needed.
        coordinator.toBeRemovedIndexRange.clear();
        coordinator.toBeRemovedTsRange.clear();
        // Keep track of the last index visited. This is outside of the try block so
        // that we have access to it in the finally block afterwards.
        let index = lowIndex;
        try {
            // Track number of steps to reduce calls to the remaining() callback.
            let step = 1;
            for (; index <= highIndex; index++) {
                // Check to make sure we have made at least one step of progress and that
                // we haven't run for too long without ceding the thread.
                if (index > lowIndex && step++ % stepsBetweenChecks === 0 &&
                    remaining() <= 0) {
                    break;
                }
                const sprite = coordinator.sprites[index];
                const properties = sprite[InternalPropertiesSymbol];
                // Skip any sprites that are not both in the Rest phase and have had
                // their 'toBeRemoved' property set (had an exit callback).
                if (!properties.toBeRemoved ||
                    properties.lifecyclePhase !== LifecyclePhase.Rest) {
                    continue;
                }
                if (!properties.spriteView || properties.index === undefined) {
                    throw new InternalError('Sprite missing required properties');
                }
                // If the sprite's time has not yet finished, then add it back to the
                // index range. We'll reschedule another run after the loop.
                if (properties.spriteView.TransitionTimeMs > currentTimeMs) {
                    coordinator.toBeRemovedIndexRange.expandToInclude(index);
                    coordinator.toBeRemovedTsRange.expandToInclude(properties.spriteView.TransitionTimeMs);
                    continue;
                }
                // The sprite has been marked for removal, its in the right
                // LifecyclePhase, and its time has expired. Flash zeros to the sprite's
                // data view and schedule it for a texture sync.
                properties.spriteView[DataViewSymbol].fill(0);
                properties.lifecyclePhase = LifecyclePhase.NeedsTextureSync;
                coordinator.needsTextureSyncIndexRange.expandToInclude(properties.index);
            }
        }
        finally {
            if (coordinator.needsTextureSyncIndexRange.isDefined) {
                coordinator.queueTextureSync();
            }
            if (index < highIndex) {
                // Since we didn't finish the whole loop due to time, expand the index
                // range to include all the indices which were previously marked, but
                // which we didn't visit.
                coordinator.toBeRemovedIndexRange.expandToInclude(index + 1);
                coordinator.toBeRemovedIndexRange.expandToInclude(highIndex);
                // Expand the Ts range to include the timestamps of the remaining sprites.
                for (let i = index + 1; i <= highIndex; i++) {
                    const sprite = coordinator.sprites[i];
                    const properties = sprite[InternalPropertiesSymbol];
                    if (properties.toBeRemoved === true &&
                        properties.lifecyclePhase === LifecyclePhase.Rest) {
                        if (!properties.spriteView) {
                            // Indicates a bug in Megaplot. A Sprite in the Rest lifecycle phase
                            // ought to have been allocated a swatch and thus a SpriteView for
                            // interacting with it.
                            // eslint-disable-next-line no-unsafe-finally
                            throw new InternalError('Sprite lacks a SpriteView');
                        }
                        coordinator.toBeRemovedTsRange.expandToInclude(properties.spriteView.TransitionTimeMs);
                    }
                }
            }
            if (coordinator.toBeRemovedIndexRange.isDefined) {
                // At least one sprite wasn't ready to be removed, so requeue this task
                // to run again.
                coordinator.queueRemovalTask();
            }
        }
    }

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
     * Given a range, return a new range that expands to the edges of the nearest
     * swatch row on both sides.
     */
    function getSwatchRowExpandedRange(inputRange, swatchesPerRow) {
        const expandedRange = new NumericRange();
        if (!inputRange.isDefined) {
            return expandedRange;
        }
        const { lowBound, highBound } = inputRange;
        const lowRow = Math.floor(lowBound / swatchesPerRow);
        const highRow = Math.floor(highBound / swatchesPerRow) + 1;
        expandedRange.expandToInclude(lowRow * swatchesPerRow);
        expandedRange.expandToInclude(highRow * swatchesPerRow - 1);
        return expandedRange;
    }
    /**
     * Iterate through the Sprites and push data into the data texture.
     */
    function runTextureSync(coordinator) {
        // Short-circuit of there are no dirty indices to update.
        if (!coordinator.needsTextureSyncIndexRange.isDefined) {
            throw new InternalError('No sprites are in need of texture sync');
        }
        const { swatchesPerRow, textureWidth, valuesPerRow } = coordinator.attributeMapper;
        // Check to see if there's a collision between the block of sprites whose
        // texture data would be sync'd and sprites that are waiting for a rebase
        // operation.
        if (coordinator.needsRebaseIndexRange.isDefined) {
            const rebaseRowRange = getSwatchRowExpandedRange(coordinator.needsRebaseIndexRange, swatchesPerRow);
            const syncRowRange = getSwatchRowExpandedRange(coordinator.needsTextureSyncIndexRange, swatchesPerRow);
            if (syncRowRange.overlaps(rebaseRowRange)) {
                // Since there was a collision, the safe thing to do is schedule a
                // rebase operation, and then make another attempt at texture sync.
                coordinator.queueRebase();
                coordinator.queueTextureSync();
                return;
            }
        }
        const { lowBound, highBound } = coordinator.needsTextureSyncIndexRange;
        const lowRow = Math.floor(lowBound / swatchesPerRow);
        const highRow = Math.floor(highBound / swatchesPerRow) + 1;
        const rowHeight = highRow - lowRow;
        const dataView = coordinator.targetValuesArray.subarray(lowRow * valuesPerRow, highRow * valuesPerRow);
        // Keep track of whether any sprites have a callback to invoke.
        let anyHasCallback = false;
        // Keep track of whether any sprites are ready to be removed.
        let anyToBeRemoved = false;
        // Use an unchanging current time reference to reduce function calls.
        const currentTimeMs = coordinator.elapsedTimeMs();
        // Since we're performing on whole rows, the bounds of this loop have to
        // cover them.
        const lowIndex = lowRow * swatchesPerRow;
        const highIndex = Math.min(highRow * swatchesPerRow - 1, coordinator.sprites.length - 1);
        for (let index = lowIndex; index <= highIndex; index++) {
            const sprite = coordinator.sprites[index];
            const properties = sprite[InternalPropertiesSymbol];
            if (properties.lifecyclePhase === LifecyclePhase.NeedsRebase) {
                // Somehow a sprite in the NeedsRebase lifecycle phase made it into this
                // loop. It would be an error to sync its values to the texture because
                // doing so would destroy the information that the rebase command needs
                // to determine the intermediate attribute values and deltas.
                throw new InternalError('Sprite is in the wrong lifecycle phase for sync');
            }
            if (properties.lifecyclePhase !== LifecyclePhase.NeedsTextureSync) {
                // This sprite was a passive participant in the texture sync operation.
                // Its blob/array swatch and texture swatch were already sync'd.
                continue;
            }
            if (!properties.spriteView) {
                // Indicates a bug in Megaplot. Any Sprite in the NeedsTextureSync
                // lifecycle phase ought to have been allocated a swatch and thus a
                // SpriteView to update it.
                throw new InternalError('Sprite queued for texture sync lacks a SpriteView');
            }
            if (properties.hasCallback) {
                // If the sprite has any pending callbacks, then the correct next
                // phase is HasCallback, and we'll need to queue a run.
                anyHasCallback = true;
                properties.lifecyclePhase = LifecyclePhase.HasCallback;
                coordinator.callbacksIndexRange.expandToInclude(index);
                continue;
            }
            if (!properties.toBeRemoved) {
                // Sprite has no callbacks, but was not slated for removal, so return to
                // Rest phase and continue.
                properties.lifecyclePhase = LifecyclePhase.Rest;
                continue;
            }
            // The sprite was slated for removal. How to proceed depends on
            // whether it has more time left before its target arrival time.
            if (properties.spriteView.TransitionTimeMs <= currentTimeMs) {
                // The sprite was slated for removal, and its time has expired.
                // Return its swatch for future reuse.
                coordinator.removeSprite(sprite);
                continue;
            }
            // At this point, the sprite was slated for removal, but its time is not
            // up yet. So we return it to the Rest phase, but add it to the removal
            // ranges so that it can be revisited later.
            anyToBeRemoved = true;
            properties.lifecyclePhase = LifecyclePhase.Rest;
            coordinator.toBeRemovedIndexRange.expandToInclude(index);
            coordinator.toBeRemovedTsRange.expandToInclude(properties.spriteView.TransitionTimeMs);
        }
        if (coordinator.waitingSprites.length &&
            coordinator.removedIndexRange.isDefined) {
            coordinator.queueAssignWaiting();
        }
        if (anyHasCallback) {
            coordinator.queueRunCallbacks();
        }
        if (anyToBeRemoved) {
            coordinator.queueRemovalTask();
        }
        coordinator.needsTextureSyncIndexRange.clear();
        const subimageData = {
            data: dataView,
            width: textureWidth,
            height: rowHeight,
        };
        coordinator.targetValuesTexture.subimage(subimageData, 0, lowRow);
    }

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
     * @fileoverview Implements the TextSelection API for SceneImpl.
     */
    const DEFAULT_ALIGN_VALUE = 'center';
    const DEFAULT_VERTICAL_ALIGN_VALUE = 'middle';
    class TextSelectionImpl {
        /**
         * Create a new selection in the associated Scene.
         */
        constructor(stepsBetweenChecks, renderer, workScheduler, glyphMapper) {
            this.stepsBetweenChecks = stepsBetweenChecks;
            this.renderer = renderer;
            this.workScheduler = workScheduler;
            this.glyphMapper = glyphMapper;
            this.selections = [];
            this.boundData = [];
            // Unique objects to identify this instance's bind() and clear() tasks.
            this.bindingTaskId = Symbol('bindingTask');
            this.clearingTaskId = Symbol('clearingTask');
            this.textCallback = ((datum) => `${datum}`);
            this.alignCallback = (() => DEFAULT_ALIGN_VALUE);
            this.verticalAlignCallback = (() => DEFAULT_VERTICAL_ALIGN_VALUE);
        }
        text(textCallback) {
            this.textCallback = textCallback;
            return this;
        }
        align(alignCallback) {
            this.alignCallback = alignCallback;
            return this;
        }
        verticalAlign(verticalAlignCallback) {
            this.verticalAlignCallback = verticalAlignCallback;
            return this;
        }
        onBind(bindCallback) {
            this.bindCallback = bindCallback;
            return this;
        }
        onInit(initCallback) {
            this.initCallback = initCallback;
            return this;
        }
        onEnter(enterCallback) {
            this.enterCallback = enterCallback;
            return this;
        }
        onUpdate(updateCallback) {
            this.updateCallback = updateCallback;
            return this;
        }
        onExit(exitCallback) {
            this.exitCallback = exitCallback;
            return this;
        }
        datumToGlyphs(datum) {
            const text = (this.textCallback ? this.textCallback.call(datum, datum) :
                `${datum}`)
                .trim();
            const align = (this.alignCallback && this.alignCallback(datum)) ||
                DEFAULT_ALIGN_VALUE;
            const verticalAlign = (this.verticalAlignCallback && this.verticalAlignCallback(datum)) ||
                DEFAULT_VERTICAL_ALIGN_VALUE;
            const glyphs = [];
            for (let i = 0; i < text.length; i++) {
                let x;
                if (align === 'left') {
                    x = (i + 1) * .5;
                }
                else if (align === 'right') {
                    x = (i + 1 - text.length) * 0.5;
                }
                else {
                    x = (i + .75 - text.length * 0.5) * 0.5;
                }
                let y;
                if (verticalAlign === 'top') {
                    y = -0.5;
                }
                else if (verticalAlign === 'bottom') {
                    y = 0.5;
                }
                else {
                    y = 0;
                }
                const coords = this.glyphMapper.getGlyph(text.charAt(i));
                if (coords) {
                    glyphs.push({ datum, coords, position: { x, y } });
                }
            }
            return glyphs;
        }
        bind(data, keyFn) {
            // TODO(jimbo): Implement keyFn for non-index binding.
            if (keyFn) {
                throw new Error('keyFn mapping is not yet supported');
            }
            // If there's a clearingTask already in flight, then short-circuit here and
            // schedule a future attempt using the bindingTaskId.
            if (this.clearingTask) {
                this.workScheduler.scheduleUniqueTask({
                    id: this.bindingTaskId,
                    callback: () => this.bind(data, keyFn),
                });
                return this;
            }
            // Keep track of number of steps taken during this task to break up the
            // number of times we check how much time is remaining.
            let step = 0;
            const dataLength = data.length;
            let lastEnterIndex = this.boundData.length;
            // Performs enter data binding while there's time remaining, then returns
            // whether there's more work to do.
            const enterTask = (remaining) => {
                while (lastEnterIndex < dataLength) {
                    step++;
                    const index = lastEnterIndex++;
                    const datum = data[index];
                    const selection = this.renderer.createSelection();
                    this.boundData.push(datum);
                    this.selections.push(selection);
                    selection.onInit((spriteView, glyph) => {
                        if (this.initCallback) {
                            this.initCallback(spriteView, glyph.datum);
                        }
                    });
                    selection.onEnter((spriteView, glyph) => {
                        if (this.enterCallback) {
                            this.enterCallback(spriteView, glyph.datum);
                        }
                    });
                    selection.onUpdate((spriteView, glyph) => {
                        if (this.updateCallback) {
                            this.updateCallback(spriteView, glyph.datum);
                        }
                    });
                    selection.onExit((spriteView, glyph) => {
                        if (this.exitCallback) {
                            this.exitCallback(spriteView, glyph.datum);
                        }
                    });
                    selection.onBind((spriteView, glyph) => {
                        spriteView.Sides = 0;
                        spriteView.ShapeTexture = glyph.coords;
                        spriteView.PositionRelative = glyph.position;
                        if (this.bindCallback) {
                            this.bindCallback(spriteView, glyph.datum);
                        }
                    });
                    selection.bind(this.datumToGlyphs(datum));
                    if (step % this.stepsBetweenChecks === 0 && remaining() <= 0) {
                        break;
                    }
                }
                return lastEnterIndex >= dataLength;
            };
            let lastUpdateIndex = 0;
            const updateLength = Math.min(dataLength, this.boundData.length);
            // Performs update data binding while there's time remaining, then returns
            // whether there's more work to do.
            const updateTask = (remaining) => {
                while (lastUpdateIndex < updateLength) {
                    step++;
                    const index = lastUpdateIndex++;
                    const datum = data[index];
                    const selection = this.selections[index];
                    this.boundData[index] = datum;
                    selection.bind(this.datumToGlyphs(datum));
                    if (step % this.stepsBetweenChecks === 0 && remaining() <= 0) {
                        return false;
                    }
                }
                return lastUpdateIndex >= updateLength;
            };
            // Performs exit data binding while there's time remaining, then returns
            // whether there's more work to do.
            const exitTask = (remaining) => {
                let index = dataLength;
                while (index < this.boundData.length) {
                    step++;
                    const selection = this.selections[index];
                    index++;
                    selection.bind([]);
                    if (step % this.stepsBetweenChecks === 0 && remaining() <= 0) {
                        break;
                    }
                }
                this.boundData.splice(dataLength, index - dataLength);
                this.selections.splice(dataLength, index - dataLength);
                return dataLength >= this.boundData.length;
            };
            // Perform one unit of work, starting with any exit tasks, then updates,
            // then enter tasks. This way, previously used texture memory can be
            // recycled more quickly, keeping the area of used texture memory more
            // compact.
            this.bindingTask = {
                id: this,
                callback: (remaining) => {
                    step = 0;
                    return exitTask(remaining) && updateTask(remaining) &&
                        enterTask(remaining);
                },
                runUntilDone: true,
            };
            this.workScheduler.scheduleUniqueTask(this.bindingTask);
            return this;
        }
        /**
         * Clear any previously bound data and Sprites. Previously bound Sprites will
         * still have their callbacks invoked. This is equivalent to calling bind()
         * with an empty array, except that it is guaranteed to drop expsting data and
         * Sprites, whereas calling bind([]) may be interrupted by a later call to
         * bind().
         */
        clear() {
            let step = 0;
            // Performs exit data binding while there's time remaining, then returns
            // whether there's more work to do.
            const exitTask = (remaining) => {
                let index = 0;
                while (index < this.boundData.length) {
                    step++;
                    const selection = this.selections[index];
                    index++;
                    selection.clear();
                    if (step % this.stepsBetweenChecks === 0 && remaining() <= 0) {
                        break;
                    }
                }
                this.boundData.splice(0, index);
                this.selections.splice(0, index);
                return !this.boundData.length;
            };
            // Define a clearing task which will be invoked by the WorkScheduler to
            // incrementally clear all data.
            this.clearingTask = {
                // Setting id to this ensures that there will be only one bindingTask
                // associated with this object at a time. If the API user calls bind()
                // again before the previous task finishes, whatever work it had been
                // doing will be dropped for the new parameters.
                id: this.clearingTaskId,
                // Perform as much of the clearing work as time allows. When finished,
                // remove the clearingTask member. This will unblock the bindingTask, if
                // there is one.
                callback: (remaining) => {
                    step = 0;
                    const result = exitTask(remaining);
                    if (result) {
                        delete this.clearingTask;
                    }
                    return result;
                },
                // The return value of the callback indicates whether there's more to do.
                // Setting runUntilDone to true here signals that if the task cannot run
                // to completion due to time, the WorkScheduler should push it back onto
                // the end of the queue.
                runUntilDone: true,
            };
            // If a binding task was previously scheduled, unschedule it since clear
            // must take precedence.
            if (this.bindingTask) {
                this.workScheduler.unscheduleTask(this.bindingTask);
                delete this.bindingTask;
            }
            // Use the provided WorkScheduler to schedule the task.
            this.workScheduler.scheduleUniqueTask(this.clearingTask);
            // Allow method call chaining.
            return this;
        }
        /**
         * Given target coordinates relative to the drawable container,
         * determine which data-bound Sprites' bounding boxes intersect the target,
         * then resolve with a result that includes an array of the bound data. If
         * none of the Selection's Sprites intersect the target, then the resolved
         * array will be empty.
         *
         * @param hitTestParameters Coordinates of the box/point to test.
         */
        hitTest(hitTestParameters) {
            throw new Error('Not yet implemented');
        }
    }

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
     * @fileoverview The WorkScheduler operates on WorkTasks, which are callback
     * functions plus additional identifying and state information.
     */
    /**
     * Given a WorkTask or Function, determine if it meets the minimum necessary
     * criteria for being used as a WorkTask.
     */
    function isWorkTaskOrFunction(workTaskOrFunction) {
        return !!(workTaskOrFunction &&
            (workTaskOrFunction instanceof Function ||
                workTaskOrFunction.callback instanceof Function));
    }
    /**
     * Given a WorkTask or Function, determine what its id would be as a
     * WorkTaskWithId.
     */
    function getWorkTaskId(workTaskOrFunction) {
        if (!isWorkTaskOrFunction(workTaskOrFunction)) {
            throw new Error('Provided object was not a work task or function');
        }
        // The id of a naked Function is just the function itself.
        if (workTaskOrFunction instanceof Function) {
            return workTaskOrFunction;
        }
        // If the object has an id property, then return that.
        if (workTaskOrFunction.id !== undefined) {
            return workTaskOrFunction.id;
        }
        // The id of a WorkTask object that does not have an explicit id is its
        // callback function.
        return workTaskOrFunction.callback;
    }
    /**
     * Given a WorkTask or Function, create and return a WorkTask object. This
     * method will return the input parameter directly if it is a WorkTask object
     * with both 'callback' and 'id' properties. Otherwise, a new object will be
     * created and returned.
     *
     * If the input parameter is neither a WorkTask object, nor a Function, then an
     * error will be thrown.
     */
    function ensureOrCreateWorkTask(workTaskOrFunction) {
        if (!isWorkTaskOrFunction(workTaskOrFunction)) {
            throw new Error('Provided object was not a work task or function');
        }
        // Wrap naked function in an object with the minimum required properties.
        if (workTaskOrFunction instanceof Function) {
            return {
                callback: workTaskOrFunction,
                id: workTaskOrFunction,
            };
        }
        // At this point, we know the object is a WorkTask with at least a callback.
        // If the object also has an id, then return it directly.
        if (workTaskOrFunction.id !== undefined) {
            return workTaskOrFunction;
        }
        // The incoming object had a callback property (per initial check) but no id.
        return Object.assign(Object.assign({}, workTaskOrFunction), { id: workTaskOrFunction.callback });
    }

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
     * A WorkQueue consists of an array of work tasks with Ids, and a set for
     * looking up tasks by their Id to check for existence. Any given task,
     * identified by its id, can only be in the WorkQueue once at a time. After a
     * task has been removed, it can be re-added.
     */
    class WorkQueue {
        constructor() {
            /**
             * Set of WorkTask ids which are present in the task list. Maintained for
             * rapid lookup.
             */
            this.idSet = new Set();
            /**
             * List of tasks to be performed.
             */
            this.taskList = [];
        }
        /**
         * Return the length of the underlying task list.
         */
        get length() {
            return this.taskList.length;
        }
        /**
         * Return whether a WorkTask with the specified id has already been enqueued.
         */
        hasTaskId(id) {
            return this.idSet.has(id);
        }
        /**
         * Return whether a WorkTask has already been enqueued that matches the
         * provided input.
         */
        hasTask(workTaskOrFunction) {
            return this.hasTaskId(getWorkTaskId(workTaskOrFunction));
        }
        /**
         * Get the task that has the provided id.
         */
        getTaskById(id) {
            if (!this.hasTaskId(id)) {
                return undefined;
            }
            const index = this.findTaskIndexById(id);
            // Sanity check.
            if (index === -1) {
                throw new InternalError('Could not find matching task in task list');
            }
            return this.taskList[index];
        }
        /**
         * Given a WorkTask or a simple callback function, push it onto the end of the
         * internal taskList unless it's already present.
         */
        enqueueTask(workTaskOrFunction) {
            // Short-circuit if this task is already queued.
            if (this.hasTask(workTaskOrFunction)) {
                return;
            }
            const workTask = ensureOrCreateWorkTask(workTaskOrFunction);
            this.idSet.add(workTask.id);
            this.taskList.push(workTask);
        }
        /**
         * Dequeue a task from the front of the task list. If no tasks remain, throw.
         */
        dequeueTask() {
            const task = this.taskList.shift();
            if (!task) {
                throw new Error('No tasks remain to dequeue');
            }
            this.idSet.delete(task.id);
            return task;
        }
        /**
         * Given the id if of a WorkTask, if a matching WorkTask has been enqueued,
         * remove it and return it. Otherwise return undefined.
         */
        removeTaskById(id) {
            // Short-circuit if the task is not present in the WorkQueue's idSet.
            if (!this.hasTaskId(id)) {
                return undefined;
            }
            const index = this.findTaskIndexById(id);
            // Sanity check.
            if (index === -1) {
                throw new InternalError('Could not find matching task in task list');
            }
            const [task] = this.taskList.splice(index, 1);
            this.idSet.delete(task.id);
            return task;
        }
        /**
         * Given a WorkTask or function, if a matching WorkTask has been enqueued,
         * remove it and return it. Otherwise return undefined.
         */
        removeTask(workTaskOrFunction) {
            return this.removeTaskById(getWorkTaskId(workTaskOrFunction));
        }
        /**
         * Given an id, find the index of the task in the task list with that id. If
         * no task with that id is found, return -1.
         */
        findTaskIndexById(id) {
            let index = -1;
            for (let i = 0; i < this.taskList.length; i++) {
                if (this.taskList[i].id === id) {
                    // Sanity check.
                    if (index !== -1) {
                        throw new InternalError('Duplicate task found in task list');
                    }
                    index = i;
                }
            }
            return index;
        }
    }

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
     * Default settings to control the WorkScheduler's behavior. These can be
     * overridden in the WorkScheduler constructor.
     */
    const DEFAULT_WORK_SCHEDULER_SETTINGS = Object.freeze({
        /**
         * Timing functions.
         */
        timingFunctions: DEFAULT_TIMING_FUNCTIONS,
        /**
         * Maximum amount of time in milliseconds to perform work before ceding
         * control back to the caller.
         */
        maxWorkTimeMs: 20,
    });
    /**
     * The WorkScheduler class handles scheduling and working on tasks.
     *
     * Because the WorkScheduler is meant to ameliorate race conditions and other
     * timing problems, it is intolerant of calling its methods out of order, or in
     * a nested fashion. For example, calling performWork() from inside a call stack
     * that already includes a call to performWork() produces an error.
     */
    class WorkScheduler {
        constructor(options = DEFAULT_WORK_SCHEDULER_SETTINGS) {
            /**
             * Flag indicating whether the WorkScheduler is currently enabled. When it is
             * enabled, then it will be scheduling callbacks and running them. While this
             * value is initialized to false here, the WorkScheduler's enable() method is
             * called during construction, which flips this value to true.
             */
            this.isEnabled = false;
            /**
             * Flag indicating whether work is currently being performed. This is to
             * detect and prevent nested calls.
             */
            this.isPerformingWork = false;
            /**
             * Queue of work tasks to complete.
             */
            this.presentWorkQueue = new WorkQueue();
            /**
             * Future queue of work tasks to add to the presentWorkQueue when work is not
             * actively being performed. Tasks should be added to this list ONLY when
             * isPerformingWork is true. If isPerformingWork is false, then this array
             * should be empty, and new tasks should be pushed onto the presentWorkQueue.
             */
            this.futureWorkQueue = new WorkQueue();
            // Merge provided settings (if any) with defaults.
            const settings = Object.assign({}, DEFAULT_WORK_SCHEDULER_SETTINGS, options || {});
            // Copy timing functions.
            this.timingFunctions = Object.freeze(Object.assign({}, DEFAULT_TIMING_FUNCTIONS, (settings && settings.timingFunctions) || {}));
            // Copy other settings.
            this.maxWorkTimeMs = settings.maxWorkTimeMs;
            // Enable the work scheduler.
            this.enable();
        }
        /**
         * Push a work task onto the work queue. The incoming object may be either a
         * full WorkTask object, or just a function. In either case, a full WorkTask
         * object with an id is returned.
         */
        scheduleTask(workTaskOrFunction) {
            // Construct a WorkTask out of the input.
            const workTask = ensureOrCreateWorkTask(workTaskOrFunction);
            // Check to make sure this task has not already been scheduled.
            if (!this.presentWorkQueue.hasTask(workTask) &&
                !this.futureWorkQueue.hasTask(workTask)) {
                if (this.isPerformingWork && !workTask.beginImmediately) {
                    // At this point we're performing work but the task is not flagged as
                    // being safe to begin immediately. So instead of modifying the
                    // presentWorkQueue directly, we need to set the task aside for later
                    // insertion.
                    this.futureWorkQueue.enqueueTask(workTask);
                }
                else {
                    // Since we're not performing work, push this task onto the present
                    // queue.
                    this.presentWorkQueue.enqueueTask(workTask);
                }
            }
            this.updateTimer();
            return workTask;
        }
        /**
         * Get the scheduled task that matches the provided workTaskOrFunction input.
         */
        getTask(workTaskOrFunction) {
            const id = getWorkTaskId(workTaskOrFunction);
            const presentTask = this.presentWorkQueue.getTaskById(id);
            const futureTask = this.futureWorkQueue.getTaskById(id);
            // Sanity check. It should not be possible for the same task to be in both
            // the present and future work queues.
            if (presentTask && futureTask) {
                throw new InternalError('Found two matching tasks when at most one is allowed');
            }
            return presentTask || futureTask || undefined;
        }
        /**
         * Cancel any previously scheduled work task. Returns the task, or undefined
         * if no matching task was found.
         */
        unscheduleTask(workTaskOrFunction) {
            const id = getWorkTaskId(workTaskOrFunction);
            const presentRemovedTask = this.presentWorkQueue.removeTaskById(id);
            const futureRemovedTask = this.futureWorkQueue.removeTaskById(id);
            // Sanity check. It should not be possible for the same task to be in both
            // the present and future work queues.
            if (presentRemovedTask && futureRemovedTask) {
                throw new InternalError('Found two matching tasks when at most one is allowed');
            }
            this.updateTimer();
            return presentRemovedTask || futureRemovedTask || undefined;
        }
        /**
         * Determine whether there's at least one task already queued that matches the
         * provided work task or function.
         */
        isScheduledTask(workTaskOrFunction) {
            return this.isScheduledId(getWorkTaskId(workTaskOrFunction));
        }
        /**
         * Determine whether there's a task already queued with the provided Id.
         */
        isScheduledId(id) {
            return this.presentWorkQueue.hasTaskId(id) ||
                this.futureWorkQueue.hasTaskId(id);
        }
        /**
         * Convenience method for unscheduling all matching tasks and then scheduling
         * the specified task.
         */
        scheduleUniqueTask(workTaskOrFunction) {
            const workTask = ensureOrCreateWorkTask(workTaskOrFunction);
            this.unscheduleTask(workTask);
            this.scheduleTask(workTask);
            return workTask;
        }
        /**
         * Enable the WorkScheduler to work. Returns this object for further
         * invocations.
         */
        enable() {
            this.isEnabled = true;
            this.updateTimer();
            return this;
        }
        /**
         * Disable the WorkScheduler. Returns this object for more invocations.
         */
        disable() {
            this.isEnabled = false;
            this.updateTimer();
            return this;
        }
        /**
         * Set or unset the animation frame timer based on whether the work scheduler
         * is enabled and there's any work to do. Inside this method is the only place
         * where requestAnimationFrame or cancelAnimationFrame should be called.
         */
        updateTimer() {
            // Check if scheduler is enabled and there's work to do.
            if (this.isEnabled && this.presentWorkQueue.length) {
                if (this.animationFrameTimer === undefined) {
                    const { requestAnimationFrame } = this.timingFunctions;
                    this.animationFrameTimer = requestAnimationFrame(() => {
                        this.animationFrameTimer = undefined;
                        this.performWork();
                    });
                }
                return;
            }
            // Scheduler is not enabled, or there's no work to do.
            if (this.animationFrameTimer !== undefined) {
                const { cancelAnimationFrame } = this.timingFunctions;
                cancelAnimationFrame(this.animationFrameTimer);
                this.animationFrameTimer = undefined;
            }
        }
        /**
         * Perform some scheduled work immediately.
         */
        performWork() {
            if (this.isPerformingWork) {
                throw new InternalError('Only one invocation of performWork is allowed at a time');
            }
            this.isPerformingWork = true;
            const { now } = this.timingFunctions;
            // Keep track of how many tasks have been performed.
            let tasksRan = 0;
            const startTime = now();
            const remaining = () => this.maxWorkTimeMs + startTime - now();
            // For performance, the try/catch block encloses the loop that runs through
            // tasks to perform.
            try {
                while (this.presentWorkQueue.length) {
                    // If at least one task has been dequeued, and if we've run out of
                    // execution time, then break out of the loop.
                    if (tasksRan > 0 && remaining() <= 0) {
                        break;
                    }
                    const task = this.presentWorkQueue.dequeueTask();
                    tasksRan++;
                    const result = task.callback.call(null, remaining);
                    if (!task.runUntilDone || result) {
                        // Task was a simple callback function, nothing left to do.
                        continue;
                    }
                    // Task is not finished, so keep running it until either it finishes
                    // or we run out of time.
                    let done = result;
                    while (!done && remaining() > 0) {
                        done = task.callback.call(null, remaining);
                    }
                    if (!done) {
                        // The task did not finish! Schedule the task to continue later.
                        this.futureWorkQueue.enqueueTask(task);
                        // Since the task didn't finish, we must have run out of time.
                        break;
                    }
                }
            }
            finally {
                this.isPerformingWork = false;
                // Take any work tasks which were set aside during work and place them
                // into the queue at their correct place.
                while (this.futureWorkQueue.length) {
                    const futureTask = this.futureWorkQueue.dequeueTask();
                    this.scheduleTask(futureTask);
                }
                this.updateTimer();
            }
        }
    }

    /**
     * This constant controls how many steps in a loop should pass before asking the
     * WorkScheduler how much time is remaining by invoking the remaining() callback
     * function. This lets us replace a function call with a less expensive modulo
     * check in the affected loops.
     */
    const STEPS_BETWEEN_REMAINING_TIME_CHECKS = 500;
    /**
     * WebGL vertex shaders output coordinates in clip space, which is a 3D volume
     * where each component is clipped to the range (-1,1). The distance from
     * edge-to-edge is therefore 2.
     */
    const CLIP_SPACE_RANGE = 2;
    class SceneInternal {
        constructor(params = {}) {
            /**
             * Number of screen pixels to one world unit in the X and Y dimensions. When
             * the x or y values are set, handleViewChange() will be called.
             *
             * The scale and offset contribute to the view.
             */
            this.scale = new CallbackTriggerPoint(() => {
                this.handleViewChange();
            });
            /**
             * Offset (camera) coordinates. When the x or y values are set,
             * handleViewChange() will be called.
             *
             * The scale and offset contribute to the view.
             */
            this.offset = new CallbackTriggerPoint(() => {
                this.handleViewChange();
            });
            /**
             * Collection of Sprites that have been created and have swatches
             * assigned.
             */
            this.sprites = [];
            /**
             * Collection of Sprites that have been created, but do not yet have swatches
             * assigned. These will be in the Created lifecycle phase and will not be
             * rendered until some other sprites have been Removed and their swatches
             * recycled.
             */
            this.waitingSprites = [];
            /**
             * Number of instances whose values have been flashed to the
             * targetValuesTexture. These are ready to render.
             */
            this.instanceCount = 0;
            /**
             * Low and high index range within Sprite array for sprites that may have
             * callbacks to invoke.
             */
            this.callbacksIndexRange = new NumericRange();
            /**
             * Low and high bounds within Sprite array whose values may need to be flashed
             * to targetValuesTexture.
             */
            this.needsTextureSyncIndexRange = new NumericRange();
            /**
             * Low and high bounds within Sprite array whose values may need to be
             * captured by rebase.
             */
            this.needsRebaseIndexRange = new NumericRange();
            /**
             * Low and high bounds within the sprites array that have been marked for
             * removal.
             */
            this.toBeRemovedIndexRange = new NumericRange();
            /**
             * The range of arrival times (Ts) of sprites slated for removal. This may not
             * exactly match the times of sprites to be removed, for example if a sprite
             * to be removed has changed lifecycle phases. That's OK, this is used only to
             * short-circuit the runRemoval() task in the event that we know that no
             * sprites are due for removal.
             */
            this.toBeRemovedTsRange = new NumericRange();
            /**
             * Range of indexes in which there are sprites in the Removed lifecycle phase.
             * These slots can be recovered for use by a newly created sprite.
             */
            this.removedIndexRange = new NumericRange();
            /**
             * The range of arrival times (TransitionTimeMs) of sprites to be drawn. The
             * high bound is used to determine whether additional draw calls should be
             * queued.
             */
            this.toDrawTsRange = new NumericRange();
            /**
             * Task id to uniquely specify a call to the draw command.
             */
            this.drawTaskId = Symbol('drawTask');
            /**
             * Task id to uniquely specify a call to update the data texture.
             */
            this.textureSyncTaskId = Symbol('textureSyncTask');
            /**
             * Number of sprites whose UV values have been copied into the
             * instanceRebaseUvValues array for computation through the rebase shaders.
             */
            this.rebaseCount = 0;
            /**
             * Number of candidate sprites about to be hit tested.
             */
            this.hitTestCount = 0;
            /**
             * Task id to uniquely identify the removal task.
             */
            this.runRemovalTaskId = Symbol('runRemovalTaskId');
            /**
             * Task id to uniquely identify task to assign waiting sprites to recovered
             * swatches from other removed sprites.
             */
            this.runAssignWaitingTaskId = Symbol('runAssignWaitingTask');
            /**
             * Task id to uniquely identify rebase tasks.
             */
            this.rebaseTaskId = Symbol('rebaseTask');
            /**
             * Task id to uniquely identify the runCallbacks task.
             */
            this.runCallbacksTaskId = Symbol('runCallbacksTask');
            /**
             * Track whether scale and offset have been initialized.
             */
            this.isViewInitialized = false;
            // Set up settings based on incoming parameters.
            const settings = Object.assign({}, DEFAULT_SCENE_SETTINGS, params);
            const { timingFunctions } = settings;
            // Set up the elapsedTimeMs() method.
            const { now } = timingFunctions;
            this.basisTs = now();
            this.elapsedTimeMs = () => now() - this.basisTs;
            // Set up work scheduler to use timing functions.
            this.workScheduler = new WorkScheduler({ timingFunctions });
            // Override getDevicePixelRatio() method if an alternative was supplied.
            if (typeof settings.devicePixelRatio === 'function') {
                const devicePixelRatioCallback = settings.devicePixelRatio;
                this.getDevicePixelRatio = () => {
                    const devicePixelRatio = devicePixelRatioCallback();
                    if (isNaN(devicePixelRatio) || devicePixelRatio <= 0) {
                        throw new RangeError('Callback returned invalid devicePixelRatio');
                    }
                    return devicePixelRatio;
                };
            }
            else if (typeof settings.devicePixelRatio === 'number') {
                const { devicePixelRatio } = settings;
                if (isNaN(devicePixelRatio) || devicePixelRatio <= 0) {
                    throw new RangeError('Provided devicePixelRatio value is invalid');
                }
                this.getDevicePixelRatio = () => devicePixelRatio;
            }
            this.container = settings.container;
            this.defaultTransitionTimeMs = settings.defaultTransitionTimeMs;
            this.orderZGranularity = settings.orderZGranularity;
            // Look for either the REGL module or createREGL global since both are
            // supported. The latter is for hot-loading the standalone Regl JS file.
            const win = window;
            const createREGL = win['createREGL'] || REGL__default['default'];
            if (!createREGL) {
                throw new Error('Could not find REGL');
            }
            this.canvas = document.createElement('canvas');
            Object.assign(this.canvas.style, {
                border: 0,
                height: '100%',
                left: 0,
                margin: 0,
                padding: 0,
                top: 0,
                width: '100%',
            });
            this.container.appendChild(this.canvas);
            const { width, height } = this.canvas.getBoundingClientRect();
            const devicePixelRatio = this.getDevicePixelRatio();
            this.canvas.height = height * devicePixelRatio;
            this.canvas.width = width * devicePixelRatio;
            const regl = this.regl = createREGL({
                'attributes': {
                    'preserveDrawingBuffer': true,
                },
                'canvas': this.canvas,
                'extensions': [
                    'angle_instanced_arrays',
                    'OES_texture_float',
                    'OES_texture_float_linear',
                ],
            });
            // Initialize the scale and offset, which contribute to the view, if
            // possible. If the canvas has zero width or height (for example if it is
            // not attached to the DOM), then these properties will not be initialized.
            this.initView();
            // The attribute mapper is responsible for keeping track of how to shuttle
            // data between the Sprite state representation, and data values in
            // channels in the data textures.
            const attributeMapper = this.attributeMapper = new AttributeMapper({
                maxTextureSize: regl.limits.maxTextureSize,
                desiredSwatchCapacity: settings.desiredSpriteCapacity,
                dataChannelCount: 4,
            });
            // The previousValuesFramebuffer is written to by the rebase command and
            // read from by other Regl commands.
            this.previousValuesFramebuffer = regl.framebuffer({
                color: regl.texture({
                    width: attributeMapper.textureWidth,
                    height: attributeMapper.textureHeight,
                    channels: attributeMapper.dataChannelCount,
                    type: 'float32',
                    mag: 'nearest',
                    min: 'nearest',
                }),
                depthStencil: false,
            });
            // The previousValuesTexture contains the same data as the
            // previousValuesFramebuffer, but after a delay. It is used as the input
            // to the rebase command.
            this.previousValuesTexture = regl.texture({
                width: attributeMapper.textureWidth,
                height: attributeMapper.textureHeight,
                channels: attributeMapper.dataChannelCount,
                type: 'float32',
                mag: 'nearest',
                min: 'nearest',
            });
            this.targetValuesArray = new Float32Array(attributeMapper.totalValues);
            // Ultimately, to render the sprites, the GPU needs to be able to access
            // the data, and so it is flashed over to a texture. This texture is
            // written to only by the CPU via subimage write calls, and read from by
            // the GPU.
            this.targetValuesTexture = regl.texture({
                width: attributeMapper.textureWidth,
                height: attributeMapper.textureHeight,
                channels: attributeMapper.dataChannelCount,
                data: this.targetValuesArray,
                type: 'float32',
                mag: 'nearest',
                min: 'nearest',
            });
            // Instance swatch UV values are used to index into previous, target and
            // rebase textures.
            this.instanceSwatchUvValues =
                attributeMapper.generateInstanceSwatchUvValues();
            this.instanceIndexValues = new Float32Array(attributeMapper.totalSwatches);
            for (let i = 0; i < attributeMapper.totalSwatches; i++) {
                this.instanceIndexValues[i] = i;
            }
            // Set up an attribute mapper for the output of the hit test shader.
            const hitTestAttributeMapper = this.hitTestAttributeMapper =
                new AttributeMapper({
                    maxTextureSize: regl.limits.maxTextureSize,
                    desiredSwatchCapacity: attributeMapper.totalSwatches,
                    dataChannelCount: 4,
                    attributes: [
                        { attributeName: 'Hit' },
                    ],
                });
            // The instance hit test output UVs point to the places in the hit test
            // texture where the output of the test is written for each tested sprite.
            this.instanceHitTestOutputUvValues =
                this.hitTestAttributeMapper.generateInstanceSwatchUvValues();
            // Just before running a hit test, the specific list of candidate Sprites'
            // swatch UVs will be copied here, so that when the shader runs, it'll
            // know where to look for the previous and target values. The output UVs
            // however do not change. The Nth sprite in the HitTestParameters's
            // sprites array will always write to the Nth texel of the output
            // framebuffer.
            this.instanceHitTestInputUvValues =
                new Float32Array(this.instanceSwatchUvValues.length);
            // To accommodate the possibility of performing a hit test on all sprites
            // that have swatches, we allocate enough space for the index and the
            // active flag of a full complement. In the hit test shader, these values
            // will be mapped to a vec2 attribute.
            this.instanceHitTestInputIndexActiveValues =
                new Float32Array(attributeMapper.totalSwatches * 2);
            // The hitTestOutputValuesFramebuffer is written to by the hit test
            // command.
            this.hitTestOutputValuesFramebuffer = regl.framebuffer({
                color: regl.texture({
                    width: hitTestAttributeMapper.textureWidth,
                    height: hitTestAttributeMapper.textureHeight,
                    channels: hitTestAttributeMapper.dataChannelCount,
                    type: 'uint8',
                    mag: 'nearest',
                    min: 'nearest',
                }),
                depthStencil: false,
            });
            // The hit test command writes floating point values encoded as RGBA
            // components, which we then decode back into floats.
            this.hitTestOutputValues = new Uint8Array(hitTestAttributeMapper.dataChannelCount *
                hitTestAttributeMapper.totalSwatches);
            this.hitTestOutputResults =
                new Float32Array(hitTestAttributeMapper.totalSwatches);
            this.glyphMapper = new GlyphMapper(settings.glyphMapper);
            for (const glyph of settings.glyphs.split('')) {
                this.glyphMapper.addGlyph(glyph);
            }
            // TODO(jimbo): Handle additions to glyphMapper dynamically.
            this.sdfTexture = regl.texture({
                height: this.glyphMapper.textureSize,
                width: this.glyphMapper.textureSize,
                min: 'linear',
                mag: 'linear',
                wrap: 'clamp',
                data: this.glyphMapper.textureData,
                format: 'luminance',
                type: 'float32',
            });
            this.instanceSwatchUvBuffer = this.regl.buffer(this.instanceSwatchUvValues);
            this.instanceIndexBuffer = this.regl.buffer(this.instanceIndexValues);
            this.instanceHitTestInputUvBuffer =
                this.regl.buffer(this.instanceHitTestInputUvValues);
            this.instanceHitTestInputIndexActiveBuffer =
                this.regl.buffer(this.instanceHitTestInputIndexActiveValues);
            this.instanceHitTestOutputUvBuffer =
                this.regl.buffer(this.instanceHitTestOutputUvValues);
            // Rebase UV array is long enough to accommodate all sprites, but usually
            // it won't have this many.
            this.instanceRebaseUvValues =
                new Float32Array(this.instanceSwatchUvValues.length);
            this.instanceRebaseUvBuffer = this.regl.buffer({
                usage: 'dynamic',
                type: 'float',
                data: this.instanceRebaseUvValues,
            });
            this.drawCommand = setupDrawCommand(this);
            this.rebaseCommand = setupRebaseCommand(this);
            this.hitTestCommand = setupHitTestCommand(this);
            this.queueDraw();
        }
        /**
         * Wrap lookups for devicePixelRatio to satisfy aggressive compilation.
         */
        getDevicePixelRatio() {
            return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        }
        /**
         * Initialize the scale and offset of the Scene if possible. If the canvas has
         * zero width or height, then the scale and offset will not be initialized.
         */
        initView() {
            if (this.isViewInitialized) {
                return;
            }
            const { width, height } = this.canvas.getBoundingClientRect();
            if (!width || !height) {
                return;
            }
            this.lastDevicePixelRatio = this.getDevicePixelRatio();
            this.canvas.width = width * this.lastDevicePixelRatio;
            this.canvas.height = height * this.lastDevicePixelRatio;
            // Initialize scale and offset to put world 0,0 in the center.
            const defaultScale = Math.min(width, height) || Math.max(width, height) ||
                Math.min(window.innerWidth, window.innerHeight);
            this.scale.x = defaultScale;
            this.scale.y = defaultScale;
            this.offset.x = width / 2;
            this.offset.y = height / 2;
            this.isViewInitialized = true;
        }
        /**
         * The view is determined by the scale and offset. When any component of scale
         * or offset is changed, this method is invoked.
         */
        handleViewChange() {
            this.isViewInitialized = true;
            this.queueDraw();
        }
        /**
         * Adjust the offset and canvas properties to match the updated canvas shape.
         * This operation does not affect the scale of the Scene, the relationship
         * between world coordinate size and pixels.
         *
         * The optional fixedCanvasPoint will remain stationary before and after the
         * resizing operation. For example, (0,0) would preserve the top left corner.
         * If left unspecified, the center point will be preserved.
         *
         * @param fixedCanvasPoint Point in canvas coordinates which remains fixed
         * after resize (defaults to center).
         */
        resize(fixedCanvasPoint) {
            // Initialize view if it hasn't been initialized already.
            if (!this.isViewInitialized) {
                this.initView();
                return;
            }
            if (!this.lastDevicePixelRatio) {
                throw new InternalError('initView must set lastDevicePixelRatio');
            }
            const previousWidth = this.canvas.width / this.lastDevicePixelRatio;
            const previousHeight = this.canvas.height / this.lastDevicePixelRatio;
            fixedCanvasPoint =
                fixedCanvasPoint || { x: previousWidth / 2, y: previousHeight / 2 };
            // Avoid NaN on division by checking first.
            const proportionX = previousWidth > 0 ? fixedCanvasPoint.x / previousWidth : .5;
            const proportionY = previousHeight > 0 ? fixedCanvasPoint.y / previousHeight : .5;
            const { width: rectWidth, height: rectHeight } = this.canvas.getBoundingClientRect();
            this.lastDevicePixelRatio = this.getDevicePixelRatio();
            this.canvas.width = rectWidth * this.lastDevicePixelRatio;
            this.canvas.height = rectHeight * this.lastDevicePixelRatio;
            this.offset.x += proportionX * (rectWidth - previousWidth);
            this.offset.y += proportionY * (rectHeight - previousHeight);
            this.queueDraw();
        }
        /**
         * A hit test determines which Sprites from a candidate list intersect a
         * provided box in pixel coordinates relative to the canvas.
         */
        hitTest(hitTestParameters) {
            const { sprites, x, y, width, height, inclusive } = hitTestParameters;
            if (!Array.isArray(sprites)) {
                throw new Error('Hit testing requires an array of candidate sprites');
            }
            if (isNaN(x) || isNaN(y)) {
                throw new Error('Hit testing requires numeric x and y coordinates');
            }
            if ((width !== undefined && isNaN(width)) ||
                (height !== undefined && isNaN(height))) {
                throw new Error('If specified, width and height must be numeric');
            }
            this.hitTestParameters = {
                sprites,
                x,
                y,
                width: width || 0,
                height: height || 0,
                inclusive: inclusive === undefined || !!inclusive,
            };
            // Short-circuit if there are no candidate sprites to test.
            if (!sprites.length) {
                return new Float32Array(0);
            }
            // Perform the real hit test work.
            runHitTest(this);
            // Return results. Note that this is a .subarray(), not a .slice(), which
            // would copy the results. This is faster because it doesn't require a
            // memory operation, but it means the recipient needs to make use of it
            // immediately before the next hit test overwrites the results.
            // TODO(jimbo): Consider adding an option to copy results for safety.
            return this.hitTestOutputResults.subarray(0, sprites.length);
        }
        doDraw() {
            // Initialize view if it hasn't been already.
            this.initView();
            const currentTimeMs = this.elapsedTimeMs();
            this.drawCommand();
            if (this.toDrawTsRange.isDefined) {
                this.toDrawTsRange.truncateToWithin(currentTimeMs, Infinity);
                this.queueDraw(false);
            }
        }
        queueDraw(beginImmediately = true) {
            this.queueTask(this.drawTaskId, () => {
                this.doDraw();
            }, beginImmediately);
        }
        /**
         * Get a snapshot of the canvas by drawing to it then immediately asking for
         * the canvas to convert it to a blob.
         */
        snapshot() {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => {
                    this.canvas.toBlob(blob => {
                        blob ? resolve(blob) : reject(blob);
                    });
                });
            });
        }
        /**
         * View matrix converts world units into view (pixel) coordinates.
         */
        getViewMatrix() {
            if (!this.lastDevicePixelRatio) {
                throw new InternalError('initView must set lastDevicePixelRatio');
            }
            const scaleFactor = CLIP_SPACE_RANGE * this.lastDevicePixelRatio;
            return [
                // Column 0.
                this.scale.x * scaleFactor,
                0,
                0,
                // Column 1.
                0,
                this.scale.y * -scaleFactor,
                0,
                // Column 2.
                this.offset.x * scaleFactor,
                this.offset.y * scaleFactor,
                1,
            ];
        }
        /**
         * Scale is derived from viewMatrix properties to obviate division in the
         * vertex shader.
         */
        getViewMatrixScale() {
            if (!this.lastDevicePixelRatio) {
                throw new InternalError('initView must set lastDevicePixelRatio');
            }
            const scaleFactor = CLIP_SPACE_RANGE * this.lastDevicePixelRatio;
            const scaleX = this.scale.x * scaleFactor;
            const scaleY = this.scale.y * scaleFactor;
            return [scaleX, scaleY, 1 / scaleX, 1 / scaleY];
        }
        /**
         * Projection matrix converts view (pixel) coordinates into clip space.
         */
        getProjectionMatrix({ viewportWidth, viewportHeight }) {
            return [
                // Column 0.
                1 / viewportWidth,
                0,
                0,
                // Column 1.
                0,
                -1 / viewportHeight,
                0,
                // Column 2.
                -1,
                1,
                1,
            ];
        }
        /**
         * This method returns the next available index for a newly created sprite. If
         * all available capacity is already in use, then this returns undefined. If
         * there are any recoverable indices, the lowest one will be returned, and the
         * range of removed indexes will be updated to reflect that. If there is
         * capacity, and there are no removed sprites to recover, then this method
         * will return the next available index.
         */
        getNextIndex() {
            if (!this.removedIndexRange.isDefined) {
                return this.sprites.length < this.attributeMapper.totalSwatches ?
                    this.sprites.length :
                    undefined;
            }
            // Scan the removed index range for the next available index and return
            // it.
            const { lowBound, highBound } = this.removedIndexRange;
            for (let index = lowBound; index <= highBound; index++) {
                const sprite = this.sprites[index];
                const properties = sprite[InternalPropertiesSymbol];
                if (properties.lifecyclePhase !== LifecyclePhase.Removed) {
                    continue;
                }
                // Found a removed sprite. Truncate the removed index range and return.
                if (index === highBound) {
                    this.removedIndexRange.clear();
                }
                else {
                    this.removedIndexRange.truncateToWithin(index + 1, highBound);
                }
                return index;
            }
            // This signals a state maintenance bug. Somehow the removed index range
            // expanded to cover a range in which there are no removed sprites.
            throw new InternalError('No removed sprites found in removed index range');
        }
        createSprite() {
            const sprite = Object.seal(new SpriteImpl(this));
            if (this.waitingSprites.length > 0 ||
                (!this.removedIndexRange.isDefined &&
                    this.sprites.length >= this.attributeMapper.totalSwatches)) {
                // Either there are already sprites queued and waiting, or there is
                // insufficient swatch capacity remaining. Either way, we need to add
                // this one to the queue.
                this.waitingSprites.push(sprite);
            }
            else {
                // Since there's available capacity, assign this sprite to the next
                // available index.
                const nextIndex = this.getNextIndex();
                if (nextIndex === undefined) {
                    throw new InternalError('Next index undefined despite available capacity');
                }
                this.assignSpriteToIndex(sprite, nextIndex);
            }
            return sprite;
        }
        /**
         * Assign the provided sprite to the corresponding index.
         */
        assignSpriteToIndex(sprite, index) {
            const properties = sprite[InternalPropertiesSymbol];
            if (properties.lifecyclePhase !== LifecyclePhase.Created) {
                // This error indicates a bug in the logic handling Created (waiting)
                // sprites. Only Sprites which have never been assigned indices should
                // be considered for assignment.
                throw new InternalError('Only sprites in the Created phase can be assigned indices');
            }
            const { valuesPerSwatch } = this.attributeMapper;
            const dataView = this.targetValuesArray.subarray(index * valuesPerSwatch, (index + 1) * valuesPerSwatch);
            // TODO(jimbo): This should never contain non-zero data. Consider Error?
            // Flash zeros into the dataView just in case (should be a no-op).
            dataView.fill(0);
            properties.lifecyclePhase = LifecyclePhase.Rest;
            properties.index = index;
            properties.spriteView = Object.seal(new SpriteViewImpl(dataView));
            this.sprites[index] = sprite;
            if (this.instanceCount <= index + 1) {
                this.instanceCount = index + 1;
            }
        }
        markSpriteCallback(index) {
            this.callbacksIndexRange.expandToInclude(index);
            this.queueRunCallbacks();
        }
        /**
         * Cleanup associated with removing a sprite.
         */
        removeSprite(sprite) {
            if (sprite.isRemoved) {
                throw new InternalError('Sprite can be removed only once');
            }
            const properties = sprite[InternalPropertiesSymbol];
            if (properties.index === this.instanceCount - 1) {
                // In the case where the removed sprite happens to be the one at the end
                // of the list, decrement the instance count to compensate. In any other
                // case, the degenerate sprite will be left alone, having had zeros
                // flashed to its swatch values.
                this.instanceCount--;
            }
            properties.lifecyclePhase = LifecyclePhase.Removed;
            if (properties.spriteView) {
                // SpriteView instances are passed to user-land callbacks with the
                // expectation that those instances are not kept outside of the scope of
                // the callback function. But it is not possible to force the user to
                // abide this expectation. The user could keep a reference to the
                // SpriteView by setting a variable whose scope is outside the callback.
                // So here, we forcibly dissociate the SpriteView with its underlying
                // swatch. That way, if, for any reason, the SpriteView is used later,
                // it will throw.
                properties.spriteView[DataViewSymbol] =
                    undefined;
            }
            if (properties.index !== undefined) {
                this.removedIndexRange.expandToInclude(properties.index);
            }
        }
        /**
         * Helper method to queue a run method.
         */
        queueTask(taskId, runMethod, beginImmediately = false) {
            if (!this.workScheduler.isScheduledId(taskId)) {
                this.workScheduler.scheduleTask({
                    id: taskId,
                    callback: runMethod,
                    beginImmediately,
                });
            }
        }
        queueRebase() {
            this.queueTask(this.rebaseTaskId, () => {
                runRebase(this);
            });
        }
        /**
         * This method schedules runAssignWaiting to be invoked if it isn't already.
         * It uses available swatch capacity to take waiting sprites out of the queue.
         */
        queueAssignWaiting() {
            const runMethod = (remaining) => {
                runAssignWaiting(this, remaining, STEPS_BETWEEN_REMAINING_TIME_CHECKS);
            };
            this.queueTask(this.runAssignWaitingTaskId, runMethod);
        }
        /**
         * This method schedules runCallbacks to be invoked if it isn't already.
         */
        queueRunCallbacks() {
            const runMethod = (remaining) => {
                runCallbacks(this, remaining, STEPS_BETWEEN_REMAINING_TIME_CHECKS);
            };
            this.queueTask(this.runCallbacksTaskId, runMethod);
        }
        /**
         * This method schedules a task to remove sprites that have been marked for
         * removal. The task looks for sprites that have been marked for removal and
         * whose arrival times have passed. Those sprites need to have their values
         * flashed to zero and to be marked for texture sync. That way, the swatch
         * that the sprite used to command can be reused for another sprite later.
         */
        queueRemovalTask() {
            const runMethod = (remaining) => {
                runRemoval(this, remaining, STEPS_BETWEEN_REMAINING_TIME_CHECKS);
            };
            this.queueTask(this.runRemovalTaskId, runMethod);
        }
        queueTextureSync() {
            this.queueTask(this.textureSyncTaskId, () => {
                runTextureSync(this);
            });
        }
        createSelection() {
            return new SelectionImpl(STEPS_BETWEEN_REMAINING_TIME_CHECKS, this);
        }
        createTextSelection() {
            return new TextSelectionImpl(STEPS_BETWEEN_REMAINING_TIME_CHECKS, this, this.workScheduler, this.glyphMapper);
        }
    }

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
    class Scene {
        constructor(params = {}) {
            this[SceneInternalSymbol] = new SceneInternal(params);
        }
        /**
         * The scale object offers an interface to set the X and Y scale of the
         * rendered world. These numbers define how many pixel units there are to a
         * world unit in the X and Y directions to implement zooming.
         */
        get scale() {
            return this[SceneInternalSymbol].scale;
        }
        /**
         * The offset object offers an interface to set the X and Y offsets of the
         * rendered scene. These numbers define how many pixel units to shift in the X
         * and Y directions to implement panning.
         */
        get offset() {
            return this[SceneInternalSymbol].offset;
        }
        /**
         * Canvas element that the renderer uses to draw.
         */
        get canvas() {
            return this[SceneInternalSymbol].canvas;
        }
        /**
         * Adjust offset and canvas properties to match updated canvas shape.
         *
         * @param fixedWorldPoint Optional world point to preserve relative to the
         * canvas frame. Defaults to the world origin (0,0).
         */
        resize(fixedWorldPoint) {
            this[SceneInternalSymbol].resize(fixedWorldPoint);
        }
        /**
         * This method returns the total elapsed time in milliseconds since the
         * renderer was constructed. Using regular JavaScript timestamps (milliseconds
         * since the Unix epoch) is not feasible because the values need to preserve
         * millisecond precision when cast as Float32 to be used in WebGL.
         */
        elapsedTimeMs() {
            return this[SceneInternalSymbol].elapsedTimeMs();
        }
        /**
         * Create and return a new Sprite. If the Renderer is already above capacity,
         * the Sprite may not be renderable.
         */
        createSprite() {
            return this[SceneInternalSymbol].createSprite();
        }
        /**
         * A hit test determines which Sprites from a candidate list intersect a
         * provided box in pixel coordinates relative to the canvas.
         */
        hitTest(hitTestParameters) {
            return this[SceneInternalSymbol].hitTest(hitTestParameters);
        }
        /**
         * Provide a Selection object for mapping data points to sprites.
         */
        createSelection() {
            return this[SceneInternalSymbol].createSelection();
        }
        /**
         * Provide a TextSelection object for mapping data points to text strings as
         * represented by a sequence of glyphs.
         */
        createTextSelection() {
            return this[SceneInternalSymbol].createTextSelection();
        }
    }

    exports.Scene = Scene;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=index.js.map
