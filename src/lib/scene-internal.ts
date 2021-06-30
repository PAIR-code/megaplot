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
import {setupDrawCommand} from './commands/setup-draw-command';
import {setupHitTestCommand} from './commands/setup-hit-test-command';
import {setupRebaseCommand} from './commands/setup-rebase-command';
import {DEFAULT_SCENE_SETTINGS} from './default-scene-settings';
import {DrawTriggerPoint} from './draw-trigger-point';
import {SpriteViewImpl} from './generated/sprite-view-impl';
import {GlyphMapper} from './glyph-mapper';
import {HitTestParameters, HitTestPromise, HitTestResult} from './hit-test-types';
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
import {runRebase} from './tasks/run-rebase';
import {runRemoval} from './tasks/run-removal';
import {runTextureSync} from './tasks/run-texture-sync';
import {TextSelectionImpl} from './text-selection-impl';
import {TextSelection} from './text-selection-types';
import {RemainingTimeFn, WorkScheduler} from './work-scheduler';

/**
 * This constant controls how many steps in a loop should pass before asking the
 * WorkScheduler how much time is remaining by invoking the remaining() callback
 * function. This lets us replace a function call with a less expensive modulo
 * check in the affected loops.
 */
const STEPS_BETWEEN_REMAINING_TIME_CHECKS = 500;

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
   * the x or y values are set, queueDraw() will be called.
   */
  scale = new DrawTriggerPoint(this);

  /**
   * Offset (camera) coordinates. When the x or y values are set, queueDraw()
   * will be called.
   */
  offset = new DrawTriggerPoint(this);

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
   * short-circuit the runRemoval() task in the evet that we know that no
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
  private basisTs: number;

  /**
   * Task id to uniquely specify a call to the draw command.
   */
  private drawTaskId = Symbol('drawTask');

  /**
   * Task id to uniquely specify a call to update the data texture.
   */
  private textureSyncTaskId = Symbol('textureSyncTask');

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
  private instanceIndexValues: Float32Array;

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
   * Attribute mapper for the output of the hit test shader.
   */
  hitTestAttributeMapper: AttributeMapper;

  /**
   * Array of UV values for the locations of instance hit test swatches. These
   * do not change once initialized.
   */
  private instanceHitTestUvValues: Float32Array;

  /**
   * Buffer for instance hit test UVs.
   */
  instanceHitTestUvBuffer: REGL.Buffer;

  /**
   * The hit test shader writes to this framebuffer.
   */
  hitTestValuesFramebuffer: REGL.Framebuffer2D;

  /**
   * A place to flash the hit test values from the framebuffer.
   */
  private hitTestValues: Uint8Array;

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
  rebaseCommand?: REGL.DrawCommand;

  /**
   * Regl command to render the current world to the viewable canvas.
   */
  private drawCommand?: REGL.DrawCommand;

  /**
   * Regl command to capture the current hit test values.
   */
  private hitTestCommand?: REGL.DrawCommand;

  /**
   * Task id to uniquely identify the removal task.
   */
  private runRemovalTaskId = Symbol('runRemovalTaskId');

  /**
   * Task id to uniquely identify task to assign waiting sprites to recovered
   * swatches from other removed sprites.
   */
  private runAssignWaitingTaskId = Symbol('runAssignWaitingTask');

  /**
   * Task id to uniquely identify rebase tasks.
   */
  private rebaseTaskId = Symbol('rebaseTask');

  /**
   * Task id to uniquely identify the runCallbacks task.
   */
  private runCallbacksTaskId = Symbol('runCallbacksTask');

  /**
   * Task id to uniquely identify the hit test task.
   */
  private hitTestTaskId = Symbol('hitTestTask');

  /**
   * Pixel coordinates relative to the container to perform the hit test.
   */
  readonly hitTestParameters: HitTestParameters = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    inclusive: true,
  };

  /**
   * Promise which will eventually yield a HitTestResult.
   */
  private hitTestPromise?: HitTestPromise;

  constructor(params: Partial<typeof DEFAULT_SCENE_SETTINGS> = {}) {
    // Set up settings based on incoming parameters.
    const settings = Object.assign({}, DEFAULT_SCENE_SETTINGS, params || {});

    const timingFunctions = Object.assign(
        {},
        DEFAULT_SCENE_SETTINGS.timingFunctions,
        settings.timingFunctions || {},
    );

    // Set up the elapsedTimeMs() method.
    const {now} = timingFunctions;
    this.basisTs = now();
    this.elapsedTimeMs = () => now() - this.basisTs;

    // Set up work scheduler to use timing functions.
    this.workScheduler = new WorkScheduler({timingFunctions});

    this.container = settings.container;
    this.defaultTransitionTimeMs = settings.defaultTransitionTimeMs;

    // Take note of the container element's children before Regl inserts its
    // canvas.
    const previousChildren = new Set(Array.from(this.container.children));

    // Look for either the REGL module or createREGL global since both are
    // supported. The latter is for hot-loading the standalone Regl JS file.
    const win = window as {} as {[key: string]: unknown};
    const createREGL =
        (win['REGL'] || win['createREGL'])! as typeof REGL || REGL;

    if (!createREGL) {
      throw new Error('Could not find REGL.');
    }

    const regl = this.regl = createREGL({
      container: this.container,
      extensions: [
        'angle_instanced_arrays',
        'EXT_blend_minmax',
        'OES_texture_float',
        'OES_texture_float_linear',
      ],
    });

    const insertedChildren =
        Array.from(this.container.children).filter(child => {
          return child instanceof HTMLCanvasElement &&
              !previousChildren.has(child);
        });
    if (!insertedChildren.length) {
      throw new Error('Container is missing an inserted canvas.');
    }
    this.canvas = insertedChildren[0] as HTMLCanvasElement;

    // Initialize scale and offset to put world 0,0 in the center.
    // TODO(jimbo): Confirm initial scale/offset for all device pixel ratios.
    const {width, height} = this.canvas.getBoundingClientRect();
    const defaultScale = Math.min(width, height) || Math.max(width, height) ||
        Math.min(window.innerWidth, window.innerHeight);
    this.scale.x = defaultScale;
    this.scale.y = defaultScale;
    this.offset.x = width / 2;
    this.offset.y = height / 2;

    // The attribute mapper is responsible for keeping track of how to shuttle
    // data between the Sprite state representation, and data values in channels
    // in the data textures.
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
    // previousValuesFramebuffer, but after a delay. It is used as the input to
    // the rebase command.
    this.previousValuesTexture = regl.texture({
      width: attributeMapper.textureWidth,
      height: attributeMapper.textureHeight,
      channels: attributeMapper.dataChannelCount,
      type: 'float32',
      mag: 'nearest',
      min: 'nearest',
    });

    this.targetValuesArray = new Float32Array(attributeMapper.totalValues);

    // Ultimately, to render the sprites, the GPU needs to be able to access the
    // data, and so it is flashed over to a texture. This texture is written to
    // only by the CPU via subimage write calls, and read from by the GPU.
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
            {attributeName: 'Hit'},
          ],
        });

    // The instance hit test UVs point to the places in the hit test texture
    // where the output of the test is written.
    this.instanceHitTestUvValues =
        this.hitTestAttributeMapper.generateInstanceSwatchUvValues();

    // The hitTestValuesFramebuffer is written to by the hit test command and
    // read from by sampling.
    this.hitTestValuesFramebuffer = regl.framebuffer({
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

    this.hitTestValues = new Uint8Array(
        hitTestAttributeMapper.dataChannelCount *
        hitTestAttributeMapper.totalSwatches);

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

    this.instanceHitTestUvBuffer =
        this.regl.buffer(this.instanceHitTestUvValues);

    // Rebase UV array is long enough to accomodate all sprites, but usually it
    // won't have this many.
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
   * Schedule a hit test (if one is not already scheduled) and return a Promise
   * that will be resolved with the results. Only one hit test can be scheduled
   * at a time, so if there is one scheduled already, all we do here is
   * overwrite the parameters so that when the hit test runs, it reports based
   * on the most recent coordinates.
   */
  hitTest(
      x: number,
      y: number,
      width = 0,
      height = 0,
      inclusive = true,
      ): HitTestPromise {
    this.hitTestParameters.x = x;
    this.hitTestParameters.y = y;
    this.hitTestParameters.width = width;
    this.hitTestParameters.height = height;
    this.hitTestParameters.inclusive = inclusive;

    // If a promise already exists, return that. Only the last hitTest's
    // coordinates will be tested.
    if (this.hitTestPromise) {
      return this.hitTestPromise;
    }

    // Set up the hit test promise and capture its callback functions.
    let hitTestCallbacks: {resolve: Function, reject: Function};
    this.hitTestPromise = new Promise<HitTestResult>((resolve, reject) => {
                            hitTestCallbacks = {resolve, reject};
                          }) as HitTestPromise;

    // Set up the hit test task to be scheduled by WorkScheduler.
    const hitTestTask = {
      id: this.hitTestTaskId,
      callback: () => {
        try {
          const result = this.performHitTest();
          hitTestCallbacks.resolve(result);
        } catch (err) {
          hitTestCallbacks.reject(err);
        } finally {
          delete this.hitTestPromise;
        }
      }
    };

    // Set up cancellation procedure.
    this.hitTestPromise.cancel = () => {
      this.workScheduler.unscheduleTask(hitTestTask);
      delete this.hitTestPromise;
      hitTestCallbacks.reject(new Error('HitTest Cancelled.'));
    };

    // Schedule a hit test which will resolve the promise.
    this.workScheduler.scheduleUniqueTask(hitTestTask);

    return this.hitTestPromise;
  }

  protected performHitTest(): HitTestResult {
    this.hitTestCommand!();

    // TODO(jimbo): This read takes 50+ ms for 200k sprites. Speed up!
    this.regl.read({
      x: 0,
      y: 0,
      width: this.hitTestAttributeMapper.textureWidth,
      height: this.hitTestAttributeMapper.textureHeight,
      data: this.hitTestValues,
      framebuffer: this.hitTestValuesFramebuffer,
    });

    const hits: Sprite[] = [];

    for (let index = 0; index < this.instanceCount; index++) {
      if (this.hitTestValues[index * 4] > 0) {
        const sprite = this.sprites[index];
        const properties = sprite[InternalPropertiesSymbol];
        if (properties.lifecyclePhase !== LifecyclePhase.Removed) {
          hits.push(this.sprites[index]);
        }
      }
    }

    return {
      parameters: this.hitTestParameters,
      hits,
    };
  }

  doDraw() {
    const currentTimeMs = this.elapsedTimeMs();
    try {
      this.drawCommand!();
    } finally {
      this.toDrawTsRange.truncateToWithin(currentTimeMs, Infinity);
      if (this.toDrawTsRange.isDefined) {
        this.queueDraw(false);
      }
    }
  }

  queueDraw(beginImmediately = true) {
    this.queueTask(this.drawTaskId, () => this.doDraw(), beginImmediately);
  }

  /**
   * Get a snapshot of the canvas by drawing to it then immediately asking for
   * the canvas to convert it to a blob.
   */
  async snapshot(): Promise<Blob> {
    this.drawCommand!();
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(blob => blob ? resolve(blob) : reject(blob));
    });
  }

  /**
   * View matrix converts world units into view (pixel) coordinates.
   */
  getViewMatrix() {
    return [
      // Column 0.
      4 * this.scale.x,
      0,
      0,
      // Column 1.
      0,
      -4 * this.scale.y,
      0,
      // Column 2.
      4 * this.offset.x,
      4 * this.offset.y,
      1,
    ];
  }

  /**
   * Scale is derived from viewMatrix properties to obviate division in the
   * vertex shader.
   */
  getViewMatrixScale() {
    return [
      4 * this.scale.x,
      4 * this.scale.y,
      .25 / this.scale.x,
      .25 / this.scale.y,
    ];
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

    // Scan the removed index range for the next available index and return it.
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
    throw new Error('No removed sprites found in removed index range.');
  }

  createSprite(): Sprite {
    const sprite = Object.seal(new SpriteImpl(this));

    if (this.waitingSprites.length > 0 ||
        (!this.removedIndexRange.isDefined &&
         this.sprites.length >= this.attributeMapper.totalSwatches)) {
      // Either there are already sprites queued and waiting, or there is
      // insufficient swatch capacity remaining. Either way, we need to add this
      // one to the queue.
      this.waitingSprites.push(sprite);
    } else {
      // Since there's available capacity, assign this sprite to the next
      // available index.
      this.assignSpriteToIndex(sprite, this.getNextIndex()!);
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
      // sprites. Only Sprites which have never been assigned indices should be
      // considered for assignment.
      throw new Error(
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
      throw new Error('Sprite can be removed only once.');
    }

    const properties = sprite[InternalPropertiesSymbol];

    if (properties.index === this.instanceCount - 1) {
      // In the case where the removed sprite happens to be the one at the end
      // of the list, decrement the instance count to compensate. In any other
      // case, the degenerate sprite will be left alone, having had zeros
      // flashed to its swatches.
      this.instanceCount--;
    }

    properties.lifecyclePhase = LifecyclePhase.Removed;
    properties.spriteView![DataViewSymbol] = undefined!;
    this.removedIndexRange.expandToInclude(properties.index!);
  }

  /**
   * Helper method to queue a run method.
   */
  private queueTask(
      taskId: {},
      runMethod: (remaining: RemainingTimeFn) => void,
      beginImmediately = false,
  ) {
    if (!this.workScheduler.isScheduledId(taskId)) {
      this.workScheduler.scheduleTask({
        id: taskId,
        callback: runMethod.bind(this),
        beginImmediately,
      });
    }
  }

  queueRebase() {
    this.queueTask(this.rebaseTaskId, () => runRebase(this));
  }

  /**
   * This method schedules runAssignWaiting to be invoked if it isn't already.
   */
  queueAssignWaiting() {
    this.queueTask(this.runAssignWaitingTaskId, this.runAssignWaiting);
  }

  /**
   * Use available swatch capacity to take waiting sprites out of the queue.
   */
  runAssignWaiting(remaining: RemainingTimeFn) {
    return runAssignWaiting(
        this, remaining, STEPS_BETWEEN_REMAINING_TIME_CHECKS);
  }

  /**
   * This method schedules runCallbacks to be invoked if it isn't already.
   */
  queueRunCallbacks() {
    this.queueTask(this.runCallbacksTaskId, this.runCallbacks);
  }

  /**
   * Method to run callbacks for sprites that have them. This should be invoked
   * by the WorkScheduler.
   */
  runCallbacks(remaining: RemainingTimeFn) {
    return runCallbacks(this, remaining, STEPS_BETWEEN_REMAINING_TIME_CHECKS);
  }

  /**
   * This method schedules a task to remove sprites that have been marked for
   * removal.
   */
  queueRemovalTask() {
    this.queueTask(this.runRemovalTaskId, this.runRemoval);
  }

  /**
   * This batch task looks for sprites that have been marked for removal and
   * whose arrival times have passed. Those sprites need to have their values
   * flashed to zero and to be marked for texture sync. That way, the swatch
   * that the sprite used to command can be reused for another sprite later.
   */
  runRemoval(remaining: RemainingTimeFn) {
    return runRemoval(this, remaining, STEPS_BETWEEN_REMAINING_TIME_CHECKS);
  }

  queueTextureSync() {
    this.queueTask(this.textureSyncTaskId, () => runTextureSync(this));
  }

  createSelection<T>(): Selection<T> {
    return new SelectionImpl<T>(
        STEPS_BETWEEN_REMAINING_TIME_CHECKS,
        this,
        this.workScheduler,
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
