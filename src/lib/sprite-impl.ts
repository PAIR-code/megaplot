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
 * @fileoverview Internal implementation of the Sprite interface for use by the
 * SceneImpl.
 */

import {InternalError} from './internal-error';
import {LifecyclePhase} from './lifecycle-phase';
import {Sprite, SpriteViewCallback} from './sprite';
import {SpriteImplProperties} from './sprite-impl-properties';
import {InternalPropertiesSymbol} from './symbols';

/**
 * To avoid circular imports, this file cannot depend on scene-internal.ts. Here
 * we define the minimum necessary API surface that we need.
 */
interface CoordinatorAPI {
  markSpriteCallback: (index: number) => void;
}

export class SpriteImpl {
  public[InternalPropertiesSymbol]: SpriteImplProperties;

  /**
   * Create a new Sprite in the associated Scene.
   */
  constructor(private readonly coordinator: CoordinatorAPI) {
    this[InternalPropertiesSymbol] = new SpriteImplProperties();
  }

  enter(enterCallback: SpriteViewCallback): Sprite {
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

  update(updateCallback: SpriteViewCallback): Sprite {
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

  exit(exitCallback: SpriteViewCallback): Sprite {
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
  get isActive(): boolean {
    const lifecyclePhase = this[InternalPropertiesSymbol].lifecyclePhase;
    return lifecyclePhase !== LifecyclePhase.Created &&
        lifecyclePhase !== LifecyclePhase.Removed;
  }

  get isAbandoned(): boolean {
    return !!this[InternalPropertiesSymbol].isAbandoned;
  }

  get isRemoved(): boolean {
    return this[InternalPropertiesSymbol].lifecyclePhase ===
        LifecyclePhase.Removed;
  }
}
