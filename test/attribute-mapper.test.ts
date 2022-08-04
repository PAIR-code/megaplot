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
 * @fileoverview Tests for the AttributeMapper.
 */

import REGL from 'regl';

import {AttributeMapper} from '../src/lib/attribute-mapper';

const DEFAULT_MAX_TEXTURE_SIZE = 4096;

describe('AttributeMapper', () => {
  it('should exist', () => {
    expect(typeof AttributeMapper).toBe('function');
  });

  it('should map four values per texel in RGBA', () => {
    const attributes = [
      {
        attributeName: 'TransitionTimeMs',
      },
      {
        attributeName: 'Position',
        isInterpolable: true,
        components: ['X', 'Y', 'Z'],
      },
    ];

    const attributeMapper = new AttributeMapper({
      maxTextureSize: 11,
      attributes,
    });

    expect(attributeMapper.texelsPerSwatch).toBe(2);
    expect(attributeMapper.valuesPerSwatch).toBe(8);
    expect(attributeMapper.swatchesPerRow).toBe(5);
    expect(attributeMapper.textureWidth).toBe(10);
    expect(attributeMapper.textureHeight).toBe(11);
  });

  it('should map three values per texel in RGB', () => {
    const attributes = [
      {
        attributeName: 'TransitionTimeMs',
      },
      {
        attributeName: 'Position',
        isInterpolable: true,
        components: ['X', 'Y', 'Z'],
      },
    ];

    const attributeMapper = new AttributeMapper({
      maxTextureSize: 11,
      dataChannelCount: 3,
      attributes,
    });

    expect(attributeMapper.texelsPerSwatch).toBe(3);
    expect(attributeMapper.valuesPerSwatch).toBe(9);
    expect(attributeMapper.swatchesPerRow).toBe(3);
    expect(attributeMapper.textureWidth).toBe(9);
    expect(attributeMapper.textureHeight).toBe(11);
  });

  it('should set up attribute index lookup', () => {
    const attributes = [
      {
        attributeName: 'TransitionTimeMs',
      },
      {
        attributeName: 'Position',
        isInterpolable: true,
        components: ['X', 'Y', 'Z'],
      },
    ];

    const {attributeComponentIndices} = new AttributeMapper({
      maxTextureSize: DEFAULT_MAX_TEXTURE_SIZE,
      attributes,
    });

    expect(Object.keys(attributeComponentIndices).length).toBe(7);

    expect(attributeComponentIndices['TransitionTimeMs']).toBe(0);
    expect(attributeComponentIndices['PositionX']).toBe(1);
    expect(attributeComponentIndices['PositionY']).toBe(2);
    expect(attributeComponentIndices['PositionZ']).toBe(3);
    expect(attributeComponentIndices['PositionXDelta']).toBe(4);
    expect(attributeComponentIndices['PositionYDelta']).toBe(5);
    expect(attributeComponentIndices['PositionZDelta']).toBe(6);
  });

  it('should set up component-to-attribute map', () => {
    const attributes = [
      {
        attributeName: 'TransitionTimeMs',
      },
      {
        attributeName: 'Position',
        isInterpolable: true,
        components: ['X', 'Y', 'Z'],
      },
    ];

    const {componentToAttributeMap} = new AttributeMapper({
      maxTextureSize: DEFAULT_MAX_TEXTURE_SIZE,
      attributes,
    });

    expect(Object.keys(componentToAttributeMap).length).toBe(4);

    expect(componentToAttributeMap['TransitionTimeMs']).toBe(attributes[0]);
    expect(componentToAttributeMap['PositionX']).toBe(attributes[1]);
    expect(componentToAttributeMap['PositionY']).toBe(attributes[1]);
    expect(componentToAttributeMap['PositionZ']).toBe(attributes[1]);
  });

  describe('generateTexelReaderGLSL', () => {
    it('should generate data texture reader GLSL code', () => {
      const attributes = [
        {
          attributeName: 'TransitionTimeMs',
        },
        {
          attributeName: 'Position',
          isInterpolable: true,
          components: ['X', 'Y', 'Z'],
        },
      ];

      const attributeMapper =
          new AttributeMapper({maxTextureSize: 10, attributes});

      const glsl = attributeMapper.generateTexelReaderGLSL();

      expect(glsl).toContain(
          'texelValues[0] = texture2D(dataTexture, instanceSwatchUv + vec2(0.05, 0.05));');
      expect(glsl).toContain(
          'texelValues[1] = texture2D(dataTexture, instanceSwatchUv + vec2(0.15, 0.05));');
    });
  });

  describe('generateAttributeDefinesGLSL', () => {
    it('should generate data texture #define GLSL code', () => {
      const attributes = [
        {
          attributeName: 'TransitionTimeMs',
        },
        {
          attributeName: 'Position',
          isInterpolable: true,
          components: ['X', 'Y', 'Z'],
        },
      ];

      const attributeMapper =
          new AttributeMapper({maxTextureSize: 11, attributes});

      const glsl = attributeMapper.generateAttributeDefinesGLSL('target');

      expect(glsl).toContain(
          '#define targetTransitionTimeMs() texelValues[0].r');
      expect(glsl).toContain(
          '#define targetPosition() vec3(texelValues[0].g, texelValues[0].b, texelValues[0].a)');
      expect(glsl).toContain(
          '#define targetPositionDelta() vec3(texelValues[1].r, texelValues[1].g, texelValues[1].b)');
    });
  });

  describe('generateRebaseFragmentGLSL', () => {
    it('should generate GLSL code for a fragment shader to update attributes',
       () => {
         const attributes = [
           {
             attributeName: 'TransitionTimeMs',
             isTimestamp: true,
           },
           {
             attributeName: 'Position',
             isInterpolable: true,
             components: ['X', 'Y', 'Z'],
           },
           {
             attributeName: 'Shape',
           },
         ];

         const attributeMapper =
             new AttributeMapper({maxTextureSize: 11, attributes});

         const glsl = attributeMapper.generateRebaseFragmentGLSL();
         const lines = glsl.split('\n');

         expect(lines.length).toBe(14);
         expect(lines[0]).toContain('if (texelIndex < 0.5) {');
         expect(lines[1]).toContain('gl_FragColor.r = rebaseTs');
         expect(lines[2]).toContain('gl_FragColor.g = computeValueAtTime');
         expect(lines[3]).toContain('gl_FragColor.b = computeValueAtTime');
         expect(lines[4]).toContain('gl_FragColor.a = computeValueAtTime');
         expect(lines[5]).toContain('return;');
         expect(lines[6]).toContain('}');
         expect(lines[7]).toContain('if (texelIndex < 1.5) {');
         expect(lines[8]).toContain('gl_FragColor.r = computeThresholdValue');
         expect(lines[9]).toContain('gl_FragColor.g = computeDeltaAtTime');
         expect(lines[10]).toContain('gl_FragColor.b = computeDeltaAtTime');
         expect(lines[11]).toContain('gl_FragColor.a = computeDeltaAtTime');
       });
  });

  describe('generateInstanceSwatchUvValues', () => {
    it('should generate an array of instance swatch UV values', () => {
      const attributes = [
        {
          attributeName: 'TransitionTimeMs',
          isTimestamp: true,
        },
        {
          attributeName: 'Position',
          isInterpolable: true,
          components: ['X', 'Y', 'Z'],
        },
        {
          attributeName: 'Shape',
        },
      ];

      const attributeMapper = new AttributeMapper({
        maxTextureSize: DEFAULT_MAX_TEXTURE_SIZE,
        desiredSwatchCapacity: 4,
        attributes,
      });

      const instanceSwatchUvValues =
          attributeMapper.generateInstanceSwatchUvValues();

      expect(instanceSwatchUvValues.length).toBe(8);
      expect(instanceSwatchUvValues[0]).toBe(0);
      expect(instanceSwatchUvValues[1]).toBe(0);
      expect(instanceSwatchUvValues[2]).toBe(0.5);
      expect(instanceSwatchUvValues[3]).toBe(0);
      expect(instanceSwatchUvValues[4]).toBe(0);
      expect(instanceSwatchUvValues[5]).toBe(0.5);
      expect(instanceSwatchUvValues[6]).toBe(0.5);
      expect(instanceSwatchUvValues[7]).toBe(0.5);
    });
  });
});

describe('AttributeMapper rebase integration test', () => {
  it('should compute and set values', () => {
    const attributes = [
      {
        attributeName: 'TransitionTimeMs',
        isTimestamp: true,
      },
      {
        attributeName: 'Position',
        isInterpolable: true,
        components: ['X', 'Y', 'Z'],
      },
      {
        attributeName: 'Shape',
      },
    ];

    const attributeMapper = new AttributeMapper({
      maxTextureSize: DEFAULT_MAX_TEXTURE_SIZE,
      desiredSwatchCapacity: 4,
      attributes,
    });

    const regl = REGL({
      extensions: [
        'ANGLE_instanced_arrays',
        'OES_texture_float',
      ],
    });

    const previousValues = Float32Array.from([
      // Sprite Index 0.
      0,   // TransitionTimeMs
      10,  // PositionX
      15,  // PositionY
      0,   // PositionZ
      0,   // Shape
      0,   // PositionXDelta
      0,   // PositionYDelta
      0,   // PositionZDelta
      // Sprite Index 1.
      0,    // TransitionTimeMs
      -10,  // PositionX
      -15,  // PositionY
      0,    // PositionZ
      1,    // Shape
      0,    // PositionXDelta
      0,    // PositionYDelta
      0,    // PositionZDelta
      // Sprite Index 2.
      500,  // TransitionTimeMs
      100,  // PositionX
      150,  // PositionY
      0,    // PositionZ
      0,    // Shape
      0,    // PositionXDelta
      0,    // PositionYDelta
      0,    // PositionZDelta
      // Sprite Index 3.
      500,   // TransitionTimeMs
      -100,  // PositionX
      -150,  // PositionY
      0,     // PositionZ
      1,     // Shape
      0,     // PositionXDelta
      0,     // PositionYDelta
      0,     // PositionZDelta
    ]);

    const previousValuesTexture = regl.texture({
      width: attributeMapper.textureWidth,
      height: attributeMapper.textureHeight,
      channels: attributeMapper.dataChannelCount,
      data: previousValues,
      type: 'float32',
      mag: 'nearest',
      min: 'nearest',
    });

    const targetValues = Float32Array.from([
      // Sprite Index 0.
      2000,  // TransitionTimeMs
      20,    // PositionX
      35,    // PositionY
      0,     // PositionZ
      2,     // Shape
      0,     // PositionXDelta
      0,     // PositionYDelta
      0,     // PositionZDelta
      // Sprite Index 1.
      4000,  // TransitionTimeMs
      -20,   // PositionX
      -15,   // PositionY
      0,     // PositionZ
      3,     // Shape
      0,     // PositionXDelta
      0,     // PositionYDelta
      0,     // PositionZDelta
      // Sprite Index 2.
      600,  // TransitionTimeMs
      200,  // PositionX
      350,  // PositionY
      0,    // PositionZ
      2,    // Shape
      0,    // PositionXDelta
      0,    // PositionYDelta
      0,    // PositionZDelta
      // Sprite Index 3.
      600,   // TransitionTimeMs
      -200,  // PositionX
      -150,  // PositionY
      0,     // PositionZ
      3,     // Shape
      0,     // PositionXDelta
      0,     // PositionYDelta
      0,     // PositionZDelta
    ]);

    const targetValuesTexture = regl.texture({
      width: attributeMapper.textureWidth,
      height: attributeMapper.textureHeight,
      channels: attributeMapper.dataChannelCount,
      data: targetValues,
      type: 'float32',
      mag: 'nearest',
      min: 'nearest',
    });

    const rebaseValuesTexture = regl.texture({
      width: attributeMapper.textureWidth,
      height: attributeMapper.textureHeight,
      channels: attributeMapper.dataChannelCount,
      data: targetValues,
      type: 'float32',
      mag: 'nearest',
      min: 'nearest',
    });

    const rebaseValuesFramebuffer = regl.framebuffer({
      color: rebaseValuesTexture,
      depthStencil: false,
    });

    // Bottom-left coordinates for the instances.
    const instanceSwatchUvValues =
        attributeMapper.generateInstanceSwatchUvValues();

    const instanceSwatchUvBuffer = regl.buffer(instanceSwatchUvValues);

    const instanceRebaseFlagValues = Float32Array.from([
      1,  // Sprite 0. Rebase.
      1,  // Sprite 1. Rebase.
      0,  // Sprite 2. Copy.
      0,  // Sprite 3. Copy.
    ]);

    const instanceRebaseFlagBuffer = regl.buffer(instanceRebaseFlagValues);

    const previousAttributeDefines =
        attributeMapper.generateAttributeDefinesGLSL(
            'previous', 'previousTexelValues');
    const targetAttributeDefines = attributeMapper.generateAttributeDefinesGLSL(
        'target', 'targetTexelValues');

    const fragmentShader = `
      precision mediump float;

      uniform float ts;

      uniform sampler2D previousValuesTexture;
      uniform sampler2D targetValuesTexture;

      varying float varyingTexelIndex;
      varying vec2 varyingSwatchUv;
      varying float varyingRebaseFlag;

      vec4 previousTexelValues[${attributeMapper.texelsPerSwatch}];
      vec4 targetTexelValues[${attributeMapper.texelsPerSwatch}];

      ${previousAttributeDefines}
      ${targetAttributeDefines}

      float range(float x, float y, float a) {
        return (a - x) / (y - x);
      }

      float cubicEaseInOut(float t) {
        return t < 0.5 ? 4.0 * t * t * t :
          4.0 * (t - 1.0) * (t - 1.0) * (t - 1.0) + 1.0;
      }

      float computeValueAtTime(
          float startingValue,
          float startingDelta,
          float targetValue,
          float ts) {
        float rangeT = clamp(range(previousTransitionTimeMs(), targetTransitionTimeMs(), ts), 0., 1.);
        float easeT = cubicEaseInOut(rangeT);

        float currentValue = mix(startingValue, targetValue, easeT);
        float projectedValue = startingDelta * (targetTransitionTimeMs() - previousTransitionTimeMs());

        return currentValue + projectedValue *
          rangeT * (1. - rangeT) * (1. - rangeT) * (1. - rangeT);
      }

      #define DELTA_MS .1

      float computeDeltaAtTime(
          float startingValue,
          float startingDelta,
          float targetValue,
          float ts) {
        if (ts <= previousTransitionTimeMs()) {
          return startingDelta;
        }
        return (
            computeValueAtTime(
                startingValue, startingDelta, targetValue, ts + DELTA_MS) -
            computeValueAtTime(
                startingValue, startingDelta, targetValue, ts)
            ) / DELTA_MS;
      }

      float computeThresholdValue(
          float previousValue,
          float targetValue,
          float rebaseTs) {
        return mix(previousValue, targetValue,
          step(mix(previousTransitionTimeMs(), targetTransitionTimeMs(), .5), rebaseTs));
      }

      void readInputTexels() {
        ${
        attributeMapper.generateTexelReaderGLSL(
            'previousTexelValues', 'previousValuesTexture', 'varyingSwatchUv')}
        ${
        attributeMapper.generateTexelReaderGLSL(
            'targetTexelValues', 'targetValuesTexture', 'varyingSwatchUv')}
        }

      void setOutputTexel() {
        float rebaseTs = varyingRebaseFlag > 0. ? ts : previousTransitionTimeMs();
        ${
        attributeMapper.generateRebaseFragmentGLSL(
            'previousTexelValues', 'targetTexelValues', 'varyingTexelIndex',
            'rebaseTs')}
      }

      void main () {
        readInputTexels();
        setOutputTexel();
      }
    `;

    const vertexShader = `
      precision mediump float;

      attribute vec2 vertexCoordinates;

      attribute vec2 instanceSwatchUv;
      attribute float instanceRebaseFlag;

      #define TEXELS_PER_SWATCH ${attributeMapper.texelsPerSwatch}.
      #define TEXTURE_WIDTH ${attributeMapper.textureWidth}.
      #define TEXTURE_HEIGHT ${attributeMapper.textureHeight}.

      varying vec2 varyingSwatchUv;
      varying float varyingRebaseFlag;
      varying float varyingTexelIndex;

      vec2 swatchSize = vec2(
          TEXELS_PER_SWATCH / TEXTURE_WIDTH,
          1. / TEXTURE_HEIGHT
      );

      void main () {
        varyingSwatchUv = instanceSwatchUv;
        varyingRebaseFlag = instanceRebaseFlag;

        varyingTexelIndex = (vertexCoordinates.x + .5) * TEXELS_PER_SWATCH - .5;

        vec2 swatchUv =
          instanceSwatchUv + (vertexCoordinates.xy + .5) * swatchSize;

        gl_Position = vec4(2. * swatchUv - 1., 0., 1.);
      }
    `;

    const ts = 1000;

    const drawCommand = regl({
      frag: fragmentShader,

      vert: vertexShader,

      attributes: {
        // Corners and uv coords of the rectangle, same for each sprite.
        vertexCoordinates: [
          [-0.5, -0.5],
          [0.5, -0.5],
          [-0.5, 0.5],
          [0.5, 0.5],
        ],

        // Instance swatch UV coordinates.
        instanceSwatchUv: {
          buffer: instanceSwatchUvBuffer,
          divisor: 1,
        },

        instanceRebaseFlag: {
          buffer: instanceRebaseFlagBuffer,
          divisor: 1,
        },
      },

      uniforms: {
        ts,
        targetValuesTexture,
        previousValuesTexture,
      },

      primitive: 'triangle strip',
      count: 4,      // 4 vertices.
      instances: 4,  // 4 Sprites.

      framebuffer: rebaseValuesFramebuffer,
    });

    drawCommand(() => {
      regl.clear({color: [0, 0, 0, 0]});
    });

    drawCommand();

    const rebaseValues = new Float32Array(attributeMapper.totalValues);

    regl.read({
      x: 0,
      y: 0,
      width: attributeMapper.textureWidth,
      height: attributeMapper.textureHeight,
      data: rebaseValues,
      framebuffer: rebaseValuesFramebuffer,
    })

    // Sprite 0.
    expect(rebaseValues[0]).toBe(ts);
    expect(rebaseValues[1]).toBeCloseTo(15, 0);
    expect(rebaseValues[2]).toBeCloseTo(25, 0);
    expect(rebaseValues[3]).toBe(0);
    expect(rebaseValues[4]).toBe(2);
    expect(rebaseValues[5]).toBeGreaterThan(0);
    expect(rebaseValues[6]).toBeGreaterThan(0);
    expect(rebaseValues[7]).toBe(0);

    // Sprite 1.
    expect(rebaseValues[8]).toBe(ts);
    expect(rebaseValues[9]).toBeCloseTo(-11, 0);
    expect(rebaseValues[10]).toBeCloseTo(-15, 0);
    expect(rebaseValues[11]).toBe(0);
    expect(rebaseValues[12]).toBe(1);
    expect(rebaseValues[13]).toBeLessThan(0);
    expect(rebaseValues[14]).toBe(0);
    expect(rebaseValues[15]).toBe(0);

    // Sprite 2.
    expect(rebaseValues[16]).toBe(previousValues[16]);
    expect(rebaseValues[17]).toBe(previousValues[17]);
    expect(rebaseValues[18]).toBe(previousValues[18]);
    expect(rebaseValues[19]).toBe(previousValues[19]);
    expect(rebaseValues[20]).toBe(previousValues[20]);
    expect(rebaseValues[21]).toBe(previousValues[21]);
    expect(rebaseValues[22]).toBe(previousValues[22]);
    expect(rebaseValues[23]).toBe(previousValues[23]);

    // Sprite 3.
    expect(rebaseValues[24]).toBe(previousValues[24]);
    expect(rebaseValues[25]).toBe(previousValues[25]);
    expect(rebaseValues[26]).toBe(previousValues[26]);
    expect(rebaseValues[27]).toBe(previousValues[27]);
    expect(rebaseValues[28]).toBe(previousValues[28]);
    expect(rebaseValues[29]).toBe(previousValues[29]);
    expect(rebaseValues[30]).toBe(previousValues[30]);
    expect(rebaseValues[31]).toBe(previousValues[31]);
  });
});
