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
 * @fileoverview Defines the Scene internal implementation.
 */
import REGL from 'regl';

import {AttributeMapper} from './attribute-mapper';
import {CallbackTriggerPoint} from './callback-trigger-point';
import {setupDrawCommand} from './commands/setup-draw-command';
import {setupHitTestCommand} from './commands/setup-hit-test-command';
import {setupRebaseCommand} from './commands/setup-rebase-command';
import {DEFAULT_SCENE_SETTINGS, SceneSettings} from './default-scene-settings';
import {SpriteViewImpl} from './generated/sprite-view-impl';
import {GlyphMapper} from './glyph-mapper';
import {HitTestParameters} from './hit-test-types';
import {InternalError} from './internal-error';
import {LifecyclePhase} from './lifecycle-phase';
import {NumericRange} from './numeric-range';
import {ReglContext} from './regl-types';
import {Renderer} from './renderer-types';
import {SelectionImpl} from './selection-impl';
import {Selection} from './selection-types';
import {Sprite} from './sprite';
import {SpriteImpl} from './sprite-impl';
import {DataViewSymbol, InternalPropertiesSymbol} from './symbols';
import {runAssignWaiting} from './tasks/run-assign-waiting';
import {runCallbacks} from './tasks/run-callbacks';
import {runHitTest} from './tasks/run-hit-test';
import {runRebase} from './tasks/run-rebase';
import {runRemoval} from './tasks/run-removal';
import {runTextureSync} from './tasks/run-texture-sync';
import {TextSelectionImpl} from './text-selection-impl';
import {TextSelection} from './text-selection-types';
import {RemainingTimeFn, WorkScheduler} from './work-scheduler';
import {WorkTaskId} from './work-task';

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

export class SceneInternal implements Renderer {
  /**
   * Container element to pass to Regl for rendering. Regl will place a canvas
   * therein.
   */
  readonly container: HTMLElement;

  /**
   * Default transition time if otherwise unspecified by the sprite callback.
   */
  defaultTransitionTimeMs: number;

  /**
   * Canvas element Regl will create and insert into the container element.
   */
  readonly canvas: HTMLCanvasElement;

  /**
   * Regl instance used for rendering.
   */
  readonly regl: REGL.Regl;

  /**
   * Number of screen pixels to one world unit in the X and Y dimensions. When
   * the x or y values are set, handleViewChange() will be called.
   *
   * The scale and offset contribute to the view.
   */
  scale = new CallbackTriggerPoint(() => {
    this.handleViewChange();
  });

  /**
   * Offset (camera) coordinates. When the x or y values are set,
   * handleViewChange() will be called.
   *
   * The scale and offset contribute to the view.
   */
  offset = new CallbackTriggerPoint(() => {
    this.handleViewChange();
  });

  /**
   * Granularity of OrderZ values. Higher means more granular control over
   * user-specified OrderZ, but reduces precision remaining for differentiating
   * stacked sprites with the same OrderZ.
   */
  orderZGranularity: number;

  /**
   * Collection of Sprites that have been created and have swatches
   * assigned.
   */
  readonly sprites: SpriteImpl[] = [];

  /**
   * Collection of Sprites that have been created, but do not yet have swatches
   * assigned. These will be in the Created lifecycle phase and will not be
   * rendered until some other sprites have been Removed and their swatches
   * recycled.
   */
  readonly waitingSprites: SpriteImpl[] = [];

  /**
   * Return the amount of elapsed time in milliseconds since the instance was
   * created according to the provided now() timing function.
   *
   * A simpler implementation would have been to use the UNIX epoch time
   * directly as returned by Date.now(). However, UNIX epoch timestamps have 13
   * or more digits of precision, making them unsuitable for use in a WebGL
   * context where floating point precision is capped at 32 bits. Using elapsed
   * time allows us to retain millisecond level timing precision in the shaders.
   */
  readonly elapsedTimeMs: () => number;

  /**
   * Instance of glyph mapper for mapping characters to sdfTexture swatches.
   */
  readonly glyphMapper: GlyphMapper;

  /**
   * Instance of WorkScheduler for handling the coordination of expensive tasks.
   */
  readonly workScheduler: WorkScheduler;

  /**
   * Number of instances whose values have been flashed to the
   * targetValuesTexture. These are ready to render.
   */
  instanceCount = 0;

  /**
   * Low and high index range within Sprite array for sprites that may have
   * callbacks to invoke.
   */
  callbacksIndexRange = new NumericRange();

  /**
   * Low and high bounds within Sprite array whose values may need to be flashed
   * to targetValuesTexture.
   */
  needsTextureSyncIndexRange = new NumericRange();

  /**
   * Low and high bounds within Sprite array whose values may need to be
   * captured by rebase.
   */
  needsRebaseIndexRange = new NumericRange();

  /**
   * Low and high bounds within the sprites array that have been marked for
   * removal.
   */
  toBeRemovedIndexRange = new NumericRange();

  /**
   * The range of arrival times (Ts) of sprites slated for removal. This may not
   * exactly match the times of sprites to be removed, for example if a sprite
   * to be removed has changed lifecycle phases. That's OK, this is used only to
   * short-circuit the runRemoval() task in the event that we know that no
   * sprites are due for removal.
   */
  toBeRemovedTsRange = new NumericRange();

  /**
   * Range of indexes in which there are sprites in the Removed lifecycle phase.
   * These slots can be recovered for use by a newly created sprite.
   */
  removedIndexRange = new NumericRange();

  /**
   * The range of arrival times (TransitionTimeMs) of sprites to be drawn. The
   * high bound is used to determine whether additional draw calls should be
   * queued.
   */
  toDrawTsRange = new NumericRange();

  /**
   * Regl texture for the Signed Distance Field (SDF) for rendering glyphs.
   */
  sdfTexture: REGL.Texture;

  /**
   * Time basis from which timestamps are computed.
   */
  private readonly basisTs: number;

  /**
   * Task id to uniquely specify a call to the draw command.
   */
  private readonly drawTaskId = Symbol('drawTask');

  /**
   * Task id to uniquely specify a call to update the data texture.
   */
  private readonly textureSyncTaskId = Symbol('textureSyncTask');

  /**
   * Array of UV values for the locations of instance swatches. These do not
   * change once set. There is an immutable mapping between the index of the
   * sprite in the sprites array and its swatch of texels in the data textures.
   */
  instanceSwatchUvValues: Float32Array;

  /**
   * Regl buffer for swatch UVs of instances.
   */
  instanceSwatchUvBuffer: REGL.Buffer;

  /**
   * Array of indices for the instances. Used when computing default z-order.
   * These do not change once initialized.
   */
  private readonly instanceIndexValues: Float32Array;

  /**
   * Buffer for instance indices.
   */
  instanceIndexBuffer: REGL.Buffer;

  /**
   * Array of UV values for the locations of instance swatches. These do not
   * change once set.
   */
  instanceRebaseUvValues: Float32Array;

  /**
   * REGL buffer for the instance rebase UV values.
   */
  instanceRebaseUvBuffer: REGL.Buffer;

  /**
   * Number of sprites whose UV values have been copied into the
   * instanceRebaseUvValues array for computation through the rebase shaders.
   */
  rebaseCount = 0;

  /**
   * Attribute mapper for sprite attributes.
   */
  readonly attributeMapper: AttributeMapper;

  /**
   * Attribute mapper for the OUTPUT of the hit test shaders.
   *
   * The inputs to the hit test use the same attributeMapper instance as
   * everything else to read sprite values from the previous/target textures.
   */
  hitTestAttributeMapper: AttributeMapper;

  /**
   * Array of UV values for sprites being input to a hit test. The values are
   * always copied from the instanceSwatchUvValues array, and will be set just
   * prior to invoking the hit test command.
   *
   * In most cases, only a small portion at the beginning of this array will be
   * used by the hit test shaders. However, to accommodate the possibility of
   * performing a hit test across all sprites in the scene at once, it will be
   * sized large enough to hold a full copy of all the sprites'
   * instanceSwatchUvValues.
   */
  instanceHitTestInputUvValues: Float32Array;

  /**
   * REGL Buffer for instance hit test UVs input. Will be re-bound to the
   * instanceHitTestInputUvValues array before each invocation of the hit test
   * command. This ensures that when the hit test command runs, the correct,
   * latest values are used by the shaders to compute which candidate sprites
   * were hit. See instanceHitTestInputUvValues for more detail.
   */
  instanceHitTestInputUvBuffer: REGL.Buffer;

  /**
   * Array of floats for Sprites about to be hit tested indicating, pairwise,
   * the index of the Sprite and whether the Sprite is active (1) or not (0).
   *
   * The index is needed in order to determine the z-ordering. A directionally
   * correct approximation (due to Float32 precision) of this value is what's
   * returned eventually in the output values.
   *
   * The active value is needed to handle the case where, for any reason, a
   * Sprite being hit tested lacks a swatch. The alternative would be to omit
   * these Sprites from being sent into the hit test command at all, but then
   * the resulting output would lack an entry for the sprite. By passing in an
   * active flag, we avoid having to reorder the output of the hit test command.
   * This causes slightly more data to be sent into the shader and pulled back,
   * but the overall latency of performing a read it all dominates.
   *
   * In most cases, only a small portion at the beginning of this array will be
   * used, but it will be sized to accommodate performing a hit test across all
   * sprites in the scene at once.
   */
  instanceHitTestInputIndexActiveValues: Float32Array;

  /**
   * REGL Buffer for instance hit test UVs input. Will be re-bound to
   * instanceHitTestInputIndexActiveValues before each invocation of the hit
   * test command. This ensures that the latest, correct values are sent to the
   * hit test shaders.
   */
  instanceHitTestInputIndexActiveBuffer: REGL.Buffer;

  /**
   * Array of UV values for outputting the results of a hit test. These values
   * never change. In effect, they map indices from the HitTestParameters'
   * sprites array into the output texture. The array's size will be sufficient
   * to cover hit testing all sprites in the scene at once.
   */
  instanceHitTestOutputUvValues: Float32Array;

  /**
   * Buffer for instance hit test UVs output. Because the values never change,
   * this only needs to be bound to the values once.
   */
  instanceHitTestOutputUvBuffer: REGL.Buffer;

  /**
   * The hit test shader writes to this framebuffer.
   */
  hitTestOutputValuesFramebuffer: REGL.Framebuffer2D;

  /**
   * A place to flash the intermediate, packed hit test values from the
   * framebuffer after the hit test shader runs. Note that these values are not
   * ready for use as-is. They need to be re-inflated to produce results.
   */
  hitTestOutputValues: Uint8Array;

  /**
   * After the hit test fragment shader runs, its output is written to the
   * hitTestOutputValuesFramebuffer and then read into the hitTestOutputValues
   * Uint8Array. Those values are then decoded, byte-wise into this array.
   *
   * A value of -1 means the hit test was a miss. Otherwise, the value will be
   * non-negative, and will be approximately equal to the index of the Sprite
   * that was tested. The value will be only approximate because some precision
   * is lost in the operation of normalizing, packing and unpacking values. But
   * the values are ordinally correct. Higher values mean closer to the camera,
   * further up the z axis.
   */
  hitTestOutputResults: Float32Array;

  /**
   * Parameters to the latest hit test.
   */
  hitTestParameters!: HitTestParameters;

  /**
   * Number of candidate sprites about to be hit tested.
   */
  hitTestCount = 0;

  /**
   * A WebGL draw call should not both read from and write to the same texture,
   * so we need two representations of the Sprites' previous values state data.
   * These are the previousValuesFramebuffer and the previousValuesTexture. At
   * rest, these should have the same data.
   *
   * First, the rebase command uses the previousValuesTexture as input and
   * writes rebased values out to the previousValuesFramebuffer. Not all of the
   * sprites' data will be updated in the draw call, just the portion which have
   * been called out for rebase. At this point, the previousValuesFramebuffer is
   * up to date and can be used by the draw command to place sprites on the
   * screen.
   *
   * But sometime before the next rebase call, the updated values have to be
   * read from the framebuffer and copied over to the texture.
   */
  previousValuesFramebuffer: REGL.Framebuffer2D;

  /**
   * Regl textures to hold previous sprite state attribute values.
   */
  previousValuesTexture: REGL.Texture2D;

  /**
   * Array of floating point values containing float values to flash to the
   * targetValuesTexture during texture sync.
   */
  targetValuesArray: Float32Array;

  /**
   * Regl texture to hold the target state data for the sprites. Used by the
   * draw command and rebase command (WebGL programs).
   */
  targetValuesTexture: REGL.Texture2D;

  /**
   * Regl command to capture the current value and velocity of attributes.
   */
  readonly rebaseCommand: () => void;

  /**
   * Regl command to render the current world to the viewable canvas.
   */
  private readonly drawCommand: () => void;

  /**
   * Regl command to capture the current hit test values.
   */
  hitTestCommand: () => void;

  /**
   * Task id to uniquely identify the removal task.
   */
  private readonly runRemovalTaskId = Symbol('runRemovalTaskId');

  /**
   * Task id to uniquely identify task to assign waiting sprites to recovered
   * swatches from other removed sprites.
   */
  private readonly runAssignWaitingTaskId = Symbol('runAssignWaitingTask');

  /**
   * Task id to uniquely identify rebase tasks.
   */
  private readonly rebaseTaskId = Symbol('rebaseTask');

  /**
   * Task id to uniquely identify the runCallbacks task.
   */
  private readonly runCallbacksTaskId = Symbol('runCallbacksTask');

  /**
   * Track whether scale and offset have been initialized.
   */
  private isViewInitialized = false;

  /**
   * Keep track of the devicePixelRatio used during the last initView() or
   * resize() call since it may change.
   */
  private lastDevicePixelRatio?: number;

  constructor(params: Partial<SceneSettings> = {}) {
    // Set up settings based on incoming parameters.
    const settings = Object.assign({}, DEFAULT_SCENE_SETTINGS, params);
    const {timingFunctions} = settings;

    // Set up the elapsedTimeMs() method.
    const {now} = timingFunctions;
    this.basisTs = now();
    this.elapsedTimeMs = () => now() - this.basisTs;

    // Set up work scheduler to use timing functions.
    this.workScheduler = new WorkScheduler({timingFunctions});

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
    } else if (typeof settings.devicePixelRatio === 'number') {
      const {devicePixelRatio} = settings;
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
    const win = window as unknown as {[key: string]: unknown};
    const createREGL = win['createREGL'] as (...args: unknown[]) =>
                           REGL.Regl || REGL;

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

    const {width, height} = this.canvas.getBoundingClientRect();
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
          dataChannelCount: 4,  // Must be 4, since these are rendered outputs.
          attributes: [
            {attributeName: 'Hit'},
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
    this.hitTestOutputValues = new Uint8Array(
        hitTestAttributeMapper.dataChannelCount *
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
  getDevicePixelRatio(): number {
    return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  }

  /**
   * Initialize the scale and offset of the Scene if possible. If the canvas has
   * zero width or height, then the scale and offset will not be initialized.
   */
  private initView() {
    if (this.isViewInitialized) {
      return;
    }

    const {width, height} = this.canvas.getBoundingClientRect();

    if (!width || !height) {
      console.warn('Delaying Scene initialization: canvas has zero size');
      if (!this.canvas.isConnected) {
        console.debug('Canvas is not connected to the DOM');
      }
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
  private handleViewChange() {
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
  resize(fixedCanvasPoint?: {x: number, y: number}) {
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
        fixedCanvasPoint || {x: previousWidth / 2, y: previousHeight / 2};

    // Avoid NaN on division by checking first.
    const proportionX =
        previousWidth > 0 ? fixedCanvasPoint.x / previousWidth : .5;
    const proportionY =
        previousHeight > 0 ? fixedCanvasPoint.y / previousHeight : .5;

    const {width: rectWidth, height: rectHeight} =
        this.canvas.getBoundingClientRect();

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
  hitTest(hitTestParameters: HitTestParameters): Float32Array {
    const {sprites, x, y, width, height, inclusive} = hitTestParameters;

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

  private doDraw() {
    // Initialize view if it hasn't been already.
    this.initView();

    const currentTimeMs = this.elapsedTimeMs();

    if (this.isViewInitialized) {
      this.drawCommand();
    } else {
      console.warn('Skipping draw: view is not initialized');
    }

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
  async snapshot(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(blob => {
        blob ? resolve(blob) : reject(blob);
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
      this.scale.y * -scaleFactor,  // Invert Y.
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
  getProjectionMatrix({viewportWidth, viewportHeight}: ReglContext) {
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
  private getNextIndex(): number|undefined {
    if (!this.removedIndexRange.isDefined) {
      return this.sprites.length < this.attributeMapper.totalSwatches ?
          this.sprites.length :
          undefined;
    }

    // Scan the removed index range for the next available index and return
    // it.
    const {lowBound, highBound} = this.removedIndexRange;
    for (let index = lowBound; index <= highBound; index++) {
      const sprite = this.sprites[index];
      const properties = sprite[InternalPropertiesSymbol];

      if (properties.lifecyclePhase !== LifecyclePhase.Removed) {
        continue;
      }

      // Found a removed sprite. Truncate the removed index range and return.
      if (index === highBound) {
        this.removedIndexRange.clear();
      } else {
        this.removedIndexRange.truncateToWithin(index + 1, highBound);
      }
      return index;
    }

    // This signals a state maintenance bug. Somehow the removed index range
    // expanded to cover a range in which there are no removed sprites.
    throw new InternalError('No removed sprites found in removed index range');
  }

  createSprite(): Sprite {
    const sprite = Object.seal(new SpriteImpl(this));

    if (this.waitingSprites.length > 0 ||
        (!this.removedIndexRange.isDefined &&
         this.sprites.length >= this.attributeMapper.totalSwatches)) {
      // Either there are already sprites queued and waiting, or there is
      // insufficient swatch capacity remaining. Either way, we need to add
      // this one to the queue.
      this.waitingSprites.push(sprite);
    } else {
      // Since there's available capacity, assign this sprite to the next
      // available index.
      const nextIndex = this.getNextIndex();
      if (nextIndex === undefined) {
        throw new InternalError(
            'Next index undefined despite available capacity');
      }
      this.assignSpriteToIndex(sprite, nextIndex);
    }

    return sprite;
  }

  /**
   * Assign the provided sprite to the corresponding index.
   */
  assignSpriteToIndex(sprite: SpriteImpl, index: number) {
    const properties = sprite[InternalPropertiesSymbol];
    if (properties.lifecyclePhase !== LifecyclePhase.Created) {
      // This error indicates a bug in the logic handling Created (waiting)
      // sprites. Only Sprites which have never been assigned indices should
      // be considered for assignment.
      throw new InternalError(
          'Only sprites in the Created phase can be assigned indices');
    }

    const {valuesPerSwatch} = this.attributeMapper;
    const dataView = this.targetValuesArray.subarray(
        index * valuesPerSwatch,
        (index + 1) * valuesPerSwatch,
    );

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

  markSpriteCallback(index: number) {
    this.callbacksIndexRange.expandToInclude(index);
    this.queueRunCallbacks();
  }

  /**
   * Cleanup associated with removing a sprite.
   */
  removeSprite(sprite: SpriteImpl) {
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
          undefined as unknown as Float32Array;
    }

    if (properties.index !== undefined) {
      this.removedIndexRange.expandToInclude(properties.index);
    }
  }

  /**
   * Helper method to queue a run method.
   */
  private queueTask(
      taskId: WorkTaskId,
      runMethod: (remaining: RemainingTimeFn) => void,
      beginImmediately = false,
  ) {
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
    const runMethod = (remaining: RemainingTimeFn) => {
      runAssignWaiting(this, remaining, STEPS_BETWEEN_REMAINING_TIME_CHECKS);
    };
    this.queueTask(this.runAssignWaitingTaskId, runMethod);
  }

  /**
   * This method schedules runCallbacks to be invoked if it isn't already.
   */
  queueRunCallbacks() {
    const runMethod = (remaining: RemainingTimeFn) => {
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
    const runMethod = (remaining: RemainingTimeFn) => {
      runRemoval(this, remaining, STEPS_BETWEEN_REMAINING_TIME_CHECKS);
    };
    this.queueTask(this.runRemovalTaskId, runMethod);
  }

  queueTextureSync() {
    this.queueTask(this.textureSyncTaskId, () => {
      runTextureSync(this);
    });
  }

  createSelection<T>(): Selection<T> {
    return new SelectionImpl<T>(
        STEPS_BETWEEN_REMAINING_TIME_CHECKS,
        this,
    );
  }

  createTextSelection<T>(): TextSelection<T> {
    return new TextSelectionImpl<T>(
        STEPS_BETWEEN_REMAINING_TIME_CHECKS,
        this,
        this.workScheduler,
        this.glyphMapper,
    );
  }
}
