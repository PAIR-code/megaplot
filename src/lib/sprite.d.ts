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
 * @fileoverview A Sprite represents a renderable object. Generally, API users
 * will not work with these directly, but should prefer to use Selections that
 * perform data binding.
 */

import {SpriteView} from './generated/sprite-view';

export type SpriteViewCallback = (spriteView: SpriteView) => void;

/**
 * A Sprite is an object, created by a Renderer, which represents a 2D object.
 * It may have an enter callback, an update callback, an exit callback,
 * or any combination. The Renderer will invoke these callbacks in order,
 * passing in a SpriteView which the caller can use to modify values.
 *
 * The Sprite goes through three states:
 *
 *  - Created - Sprite exists, but has not been allocated a swatch of memory.
 *  - Active - Sprite has been allocated a swatch and is renderable.
 *  - Removed - Any resources the Sprite was allocated have been reclaimed.
 *
 * In many cases, the Sprite will advance directly from Created to Active at
 * creation time. However, at scale, a Sprite may stay in the Created state
 * waiting for memory to become available.
 *
 * Calling the Sprite's exit() method signals the intent to move from Active to
 * Removed. This transition does not necessarily happen immediately. Once the
 * Renderer has invoked the exit callback, and after enough time has elapsed to
 * complete the transition, then the Renderer will remove the Sprite from acitve
 * use and set its state to Removed. In the Removed state, the Sprite object
 * still exists, but its isRemoved property will return true, and the Renderer
 * will no longer maintain any reference to it.
 *
 * Once an exit callback has been set, the Sprite is marked for eventual
 * removal. Setting enter or update callbacks after this will not change the
 * fact that the Sprite is to be removed, however those callbacks will be
 * invoked.
 *
 * After the Sprite has been removed from use, additional calls to its enter(),
 * update() or exit() methods will throw an Error.
 *
 * In some cases, a Sprite in the Created state may no longer be needed. For
 * example, a Selection may create more Sprites than are renderable such that
 * only some are Active and the rest wait in the Created state. If a later call
 * to that Selection's bind() method reduces the number of Sprites, some of
 * those in the Created state may no longer be necessary.
 *
 * In cases where the Sprite was in the Created state but is no longer needed
 * (and therefore should never render), use its abandon() method to mark it for
 * immediate removal. Once a Sprite is abandoned, its callbacks will be cleared
 * and any attempts to set them will throw Errors.
 */
export interface Sprite {
  /**
   * Set the enter callback, return the Sprite for optional chaining.
   */
  enter: (enterCallback: SpriteViewCallback) => Sprite;

  /**
   * Set the update callback, return the Sprite for optional chaining.
   */
  update: (updateCallback: SpriteViewCallback) => Sprite;

  /**
   * Set the exit callback, return the Sprite for optional chaining. Once
   * invoked, the Sprite is irreversibly marked for removal.
   */
  exit: (exitCallback: SpriteViewCallback) => Sprite;

  /**
   * Abandon the sprite if it has not been assigned a swatch. If the Sprite is
   * already active or removed, this method will throw an error.
   *
   * Since the enter, update and exit callbacks are all asynchronous, and since
   * the Sprite may be waiting in the Created state for resources to become
   * available, there may be cases where the API user wishes to abandon the
   * Sprite rather than have its callbacks invoked.
   */
  abandon: () => void;

  /**
   * Tracks whether this Sprite has been allocated a swatch of memory in order
   * to be rendered.
   */
  isActive: boolean;

  /**
   * Tracks whether this Sprite has been marked for abandonment.
   */
  isAbandoned: boolean;

  /**
   * Tracks whether this sprite has already been removed. If so, then calls to
   * any of the callback-setting functions will throw an error.
   */
  isRemoved: boolean;
}
