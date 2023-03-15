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
 * implemented as a SpriteImpl. During its lifecycle, it goes through a number
 * of phases, which are defined here.
 */

import { InternalError } from './internal-error';

export enum LifecyclePhase {
  /**
   * When a SpriteImpl is first created, there may not be capacity to represent
   * its data in the Scene's textures and buffers. In that case, the sprite will
   * wait in the Created phase until space is recovered from another exiting
   * sprite.
   */
  Created,

  /**
   * At rest, a SpriteImpl is not waiting for anything to happen. The values in
   * the target blob/array match those in the target texture, and there are no
   * pending callbacks.
   */
  Rest,

  /**
   * Once the API user has set a callback, the SpriteImpl enters this state from
   * Rest.
   */
  HasCallback,

  /**
   * After a callback has been run, if the arrival time (Ts) is in the future,
   * then the SpriteImpl enters this state, waiting for a rebase operation to
   * capture the instantaneous values and deltas of interpolable attributes.
   */
  NeedsRebase,

  /**
   * In this state, the SpriteImpl is waiting for its values in the target blob/
   * array to be sync'd to the target texture. This could be because a callback
   * has been invoked, or because the sprite is being removed and zeros have
   * been set to its swatch of the target values blob/array.
   */
  NeedsTextureSync,

  /**
   * Lastly, after the SpriteImpl has had zeros flashed to its swatch of the
   * target texture, the terminal lifecycle state is this one. At this point,
   * the memory that had been assigned to the SpriteImpl is recoverable by the
   * Scene to be assigned to another sprite.
   */
  Removed,
}

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
export function transitionToFlag(
  fromPhase: LifecyclePhase,
  toPhase: LifecyclePhase
): number {
  return fromPhase === toPhase
    ? NaN
    : 1 << (5 * fromPhase + toPhase - +(toPhase > fromPhase));
}

/**
 * Create a single integer value which encodes all the allowed LifecyclePhase
 * transitions. This value can be AND'd with a phase transition index to test
 * for whether the transition is allowed.
 */
export function createAllowedTransitionMask(): number {
  const { Created, Rest, HasCallback, NeedsRebase, NeedsTextureSync, Removed } =
    LifecyclePhase;

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

export const ALLOWED_TRANSITION_MASK = createAllowedTransitionMask();

/**
 * Check whether a given LifecyclePhase is allowed. If not, throw an error.
 */
export function checkLifecyclePhaseTransition(
  fromPhase: LifecyclePhase,
  toPhase: LifecyclePhase
) {
  if (!(transitionToFlag(fromPhase, toPhase) & ALLOWED_TRANSITION_MASK)) {
    throw new InternalError('Illegal sprite lifecycle phase transition');
  }
}
