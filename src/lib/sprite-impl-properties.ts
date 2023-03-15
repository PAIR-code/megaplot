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
 * @fileoverview A Sprite represents a renderable object, internally
 * implemented as a SpriteImpl, which may be provided to an API consumer. The
 * SpriteImplProperties defined here are hidden from the API consumer behind a
 * symbol accessor (InternalPropertiesSymbol).
 */

import { SpriteViewImpl } from './generated/sprite-view-impl';
import {
  checkLifecyclePhaseTransition,
  LifecyclePhase,
} from './lifecycle-phase';
import { SpriteViewCallback } from './sprite';

/**
 * Internal properties of a SpriteImpl that are available to the Scene
 * implementation but inaccessible to upstream API consumers.
 */
export class SpriteImplProperties {
  /**
   * The lifecycle phase of the Sprite. Updates to this value are NOT arbitrary.
   * Only certain transitions are acceptable. See the lifecyclePhase setter.
   */
  private internalLifecyclePhase = LifecyclePhase.Created;

  /**
   * The index of this Sprite within the array of Sprites maintained by the
   * Scene.
   */
  index?: number;

  /**
   * SpriteView object for poking values into the target values array/blob, to
   * be sync'd to the target values texture.
   */
  spriteView?: SpriteViewImpl;

  /**
   * Callback function to call on enter. If set, this will be invoked before the
   * update or exit callbacks.
   */
  enterCallback?: SpriteViewCallback;

  /**
   * Callback function to call on update. If set, this will be invoked after the
   * enter callback but before the exit callback.
   */
  updateCallback?: SpriteViewCallback;

  /**
   * Callback function to call on exit. If set, this will only be invoked after
   * the enter and update callbacks.
   */
  exitCallback?: SpriteViewCallback;

  /**
   * When the API user supplies an exit callback, this flag is set to true.
   * After the exitCallback is invoked, if this flag is still true, then the
   * sprite will be removed and its allocated swatches will be returned for
   * future reuse by another sprite.
   */
  toBeRemoved?: boolean;

  /**
   * When a sprite is being removed, its attributes are all set to zero so that
   * these zeros can be flashed to the data texture. This makes it invisible to
   * render (degenerate) while waiting for another sprite to use its swatch.
   * This flag is set after zeros have been flashed during the runRemoval task
   * to signal that after the next texture sync its index can be given to the
   * next waiting sprite.
   */
  zeroed?: boolean;

  /**
   * Whether the API user has requested this Sprite to be abandoned.
   */
  isAbandoned?: boolean;

  /**
   * Return whether this sprite has any pending callbacks to run.
   */
  get hasCallback(): boolean {
    return !!(this.enterCallback || this.updateCallback || this.exitCallback);
  }

  /**
   * Get the current lifecycle state.
   */
  get lifecyclePhase(): LifecyclePhase {
    return this.internalLifecyclePhase;
  }

  /**
   * Set the current lifecycle state. This will enforce the lifecycle
   * transitions and throw if an illegal transition is attempted.
   */
  set lifecyclePhase(lifecyclePhase: LifecyclePhase) {
    checkLifecyclePhaseTransition(this.internalLifecyclePhase, lifecyclePhase);
    this.internalLifecyclePhase = lifecyclePhase;
  }
}
