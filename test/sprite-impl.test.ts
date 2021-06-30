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
 * @fileoverview Unit tests for the SpriteImpl implementation of the Sprite API.
 */

import {LifecyclePhase} from '../src/lib/lifecycle-phase';
import {SpriteImpl} from '../src/lib/sprite-impl';
import {InternalPropertiesSymbol} from '../src/lib/symbols';

describe('SpriteImpl', () => {
  it('should exist and have expected methods.', () => {
    expect(typeof SpriteImpl).toBe('function');

    // Minimum coordinator API required by SpriteImpl.
    const coordinator = {
      markSpriteCallback: () => {},
    };

    const sprite = new SpriteImpl(coordinator);

    expect(sprite).toBeInstanceOf(SpriteImpl);
    expect(typeof sprite.enter).toBe('function');
    expect(typeof sprite.update).toBe('function');
    expect(typeof sprite.update).toBe('function');
    expect(typeof sprite.abandon).toBe('function');
  });

  describe('abandon()', () => {
    it('should allow abandoning a waiting sprite.', () => {
      // Minimum coordinator API required by SpriteImpl.
      const coordinator = {
        markSpriteCallback: () => {},
      };

      const sprite = new SpriteImpl(coordinator);

      expect(sprite.isActive).toBeFalse();
      expect(sprite.isRemoved).toBeFalse();
      expect(sprite.isAbandoned).toBeFalse();

      expect(() => sprite.abandon()).not.toThrow();

      expect(sprite.isActive).toBeFalse();
      expect(sprite.isRemoved).toBeTrue();
      expect(sprite.isAbandoned).toBeTrue();
    });

    it('should throw when trying to abandon an active sprite.', () => {
      // Minimum coordinator API required by SpriteImpl.
      const coordinator = {
        markSpriteCallback: () => {},
      };

      const sprite = new SpriteImpl(coordinator);
      const properties = sprite[InternalPropertiesSymbol];

      properties.lifecyclePhase = LifecyclePhase.Rest;

      expect(sprite.isActive).toBeTrue();
      expect(sprite.isRemoved).toBeFalse();
      expect(sprite.isAbandoned).toBeFalse();

      expect(() => sprite.abandon()).toThrow();
    });

    it('should throw when trying to abandon a removed sprite.', () => {
      // Minimum coordinator API required by SpriteImpl.
      const coordinator = {
        markSpriteCallback: () => {},
      };

      const sprite = new SpriteImpl(coordinator);
      const properties = sprite[InternalPropertiesSymbol];

      properties.lifecyclePhase = LifecyclePhase.Removed;

      expect(sprite.isActive).toBeFalse();
      expect(sprite.isRemoved).toBeTrue();
      expect(sprite.isAbandoned).toBeFalse();

      expect(() => sprite.abandon()).toThrow();
    });

    it('should throw when trying to abandon an abandoned sprite.', () => {
      // Minimum coordinator API required by SpriteImpl.
      const coordinator = {
        markSpriteCallback: () => {},
      };

      const sprite = new SpriteImpl(coordinator);
      const properties = sprite[InternalPropertiesSymbol];

      properties.isAbandoned = true;

      expect(() => sprite.abandon()).toThrow();
    });
  });
});
