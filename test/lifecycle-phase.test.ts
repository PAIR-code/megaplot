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
 * @fileoverview Tests for LifecyclePhase related functionality.
 */

import {
  checkLifecyclePhaseTransition,
  LifecyclePhase,
} from '../src/lib/lifecycle-phase';

describe('LifecyclePhase', () => {
  it('should exist.', () => {
    expect(typeof LifecyclePhase).toBe('object');
  });

  it('should have expected values.', () => {
    expect(LifecyclePhase.Created).toBeDefined();
    expect(LifecyclePhase.Rest).toBeDefined();
    expect(LifecyclePhase.HasCallback).toBeDefined();
    expect(LifecyclePhase.NeedsRebase).toBeDefined();
    expect(LifecyclePhase.NeedsTextureSync).toBeDefined();
    expect(LifecyclePhase.Removed).toBeDefined();
  });
});

describe('checkLifecyclePhaseTransition', () => {
  it('should exist.', () => {
    expect(typeof checkLifecyclePhaseTransition).toBe('function');
  });

  it('should permit allowed transitions.', () => {
    const {
      Created,
      Rest,
      HasCallback,
      NeedsRebase,
      NeedsTextureSync,
      Removed,
    } = LifecyclePhase;

    const checkFn = checkLifecyclePhaseTransition;

    // Created -> *.
    expect(() => checkFn(Created, Rest)).not.toThrow();
    expect(() => checkFn(Created, Removed)).not.toThrow();

    // Rest -> *.
    expect(() => checkFn(Rest, HasCallback)).not.toThrow();
    expect(() => checkFn(Rest, NeedsTextureSync)).not.toThrow();

    // HasCallback -> *.
    expect(() => checkFn(HasCallback, NeedsRebase)).not.toThrow();
    expect(() => checkFn(HasCallback, NeedsTextureSync)).not.toThrow();

    // NeedsRebase -> *.
    expect(() => checkFn(NeedsRebase, NeedsTextureSync)).not.toThrow();

    // NeedsTextureSync -> *.
    expect(() => checkFn(NeedsTextureSync, Rest)).not.toThrow();
    expect(() => checkFn(NeedsTextureSync, HasCallback)).not.toThrow();
    expect(() => checkFn(NeedsTextureSync, Removed)).not.toThrow();

    // Removed -> *.
    // No legal transitions from Removed phase.
  });

  it('should throw on illegal transitions.', () => {
    const {
      Created,
      Rest,
      HasCallback,
      NeedsRebase,
      NeedsTextureSync,
      Removed,
    } = LifecyclePhase;

    const checkFn = checkLifecyclePhaseTransition;

    // Created -> *.
    expect(() => checkFn(Created, Created)).toThrow();
    expect(() => checkFn(Created, HasCallback)).toThrow();
    expect(() => checkFn(Created, NeedsRebase)).toThrow();
    expect(() => checkFn(Created, NeedsTextureSync)).toThrow();

    // Rest -> *.
    expect(() => checkFn(Rest, Created)).toThrow();
    expect(() => checkFn(Rest, Rest)).toThrow();
    expect(() => checkFn(Rest, NeedsRebase)).toThrow();
    expect(() => checkFn(Rest, Removed)).toThrow();

    // HasCallback -> *.
    expect(() => checkFn(HasCallback, Created)).toThrow();
    expect(() => checkFn(HasCallback, Rest)).toThrow();
    expect(() => checkFn(HasCallback, HasCallback)).toThrow();
    expect(() => checkFn(HasCallback, Removed)).toThrow();

    // NeedsRebase -> *.
    expect(() => checkFn(NeedsRebase, Created)).toThrow();
    expect(() => checkFn(NeedsRebase, Rest)).toThrow();
    expect(() => checkFn(NeedsRebase, HasCallback)).toThrow();
    expect(() => checkFn(NeedsRebase, NeedsRebase)).toThrow();
    expect(() => checkFn(NeedsRebase, Removed)).toThrow();

    // NeedsTextureSync -> *.
    expect(() => checkFn(NeedsTextureSync, Created)).toThrow();
    expect(() => checkFn(NeedsTextureSync, NeedsRebase)).toThrow();
    expect(() => checkFn(NeedsTextureSync, NeedsTextureSync)).toThrow();

    // Removed -> *.
    expect(() => checkFn(Removed, Created)).toThrow();
    expect(() => checkFn(Removed, Rest)).toThrow();
    expect(() => checkFn(Removed, HasCallback)).toThrow();
    expect(() => checkFn(Removed, NeedsRebase)).toThrow();
    expect(() => checkFn(Removed, NeedsTextureSync)).toThrow();
    expect(() => checkFn(Removed, Removed)).toThrow();
  });
});
