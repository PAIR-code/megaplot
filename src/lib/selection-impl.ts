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

import {Renderer} from './renderer-types';
import {Selection, SelectionCallback, SelectionHitTestParameters} from './selection-types';
import {Sprite} from './sprite';
import {RemainingTimeFn, WorkScheduler} from './work-scheduler';
import {WorkTaskWithId} from './work-task';

/**
 * Since binding may take some time, this enum lists the various states the
 * binding operation could be in.
 */
enum BindingState {
  /**
   * Default state, no bind is waiting to occur or in flight.
   */
  None,

  /**
   * If a call to bind() followed a call to clear(), then the bind() may be
   * blocked waiting for the clear to finish.
   */
  Blocked,

  /**
   * Once a call to bind() occurs, the various tasks may not begin until the
   * a later animation frame. In this case, the bind is scheduled.
   */
  Scheduled,

  /**
   * Binding tasks have started being performed, but not finished.
   */
  Started,
}

/**
 * To avoid circular imports, this file cannot depend on scene-internal.ts so
 * here we define the minimum necessary API surface that the task implementation
 * needs to operate.
 */
interface CoordinatorAPI extends Renderer {
  workScheduler: WorkScheduler;
}

export class SelectionImpl<T> implements Selection<T> {
  private sprites: Sprite[] = [];

  private boundData: T[] = [];

  private bindingState = BindingState.None;

  private hasWarned = false;

  // Unique objects to identify this instance's bind() and clear() tasks.
  private readonly bindingTaskId = Symbol('bindingTask');
  private readonly clearingTaskId = Symbol('clearingTask');

  // Binding or clearing task, if scheduled.
  private bindingTask?: WorkTaskWithId;
  private clearingTask?: WorkTaskWithId;

  private onInitCallback?: SelectionCallback<T>;
  private onEnterCallback?: SelectionCallback<T>;
  private onUpdateCallback?: SelectionCallback<T>;
  private onExitCallback?: SelectionCallback<T>;

  /**
   * Create a new Selection which gets its Sprites from the provided Renderer,
   * and schedules tasks via the provided WorkScheduler.
   */
  constructor(
      private readonly stepsBetweenChecks: number,
      private readonly coordinator: CoordinatorAPI,
  ) {}

  onInit(onInitCallback: SelectionCallback<T>) {
    this.onInitCallback = onInitCallback;
    return this;
  }

  onEnter(onEnterCallback: SelectionCallback<T>) {
    this.onEnterCallback = onEnterCallback;
    return this;
  }

  onUpdate(onUpdateCallback: SelectionCallback<T>) {
    this.onUpdateCallback = onUpdateCallback;
    return this;
  }

  onExit(onExitCallback: SelectionCallback<T>) {
    this.onExitCallback = onExitCallback;
    return this;
  }

  /**
   * Bind the supplied data array to the array of managed Sprites. This method
   * returns immediately, but queues an incremental task to be carried out by
   * the WorkScheduler.
   *
   * Note that whereas the Selection API offers the user callbacks for,
   * onInit(), onEnter(), onUpdate() and onExit(), the underlying Sprite API
   * offers only enter(), update() and exit(). To handle this mismatch, the
   * Sprite's update() callback must be used to invoke more than one of the
   * Selection's callback. Here's the implementation mapping:
   *
   *  - Selection::onInit() - Sprite::enter()
   *  - Selection::onEnter() - Sprite::update()
   *  - Selection::onUpdate() - Sprite::update()
   *  - Selection::onExit() - Sprite::exit()
   *
   * The underlying Sprite implementation ensures that its enter() callback will
   * be invoked before its update() callback. If both have been specified, they
   * will be invoked in separate animation frames. This guarantees that the
   * Selection's onInit() callback is called before onEnter().
   *
   * @param data Array of data to bind to the internal Sprites list.
   */
  bind(data: T[], keyFn?: (datum: T) => string) {
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

    // Capture callback functions immediately.
    const {onInitCallback, onEnterCallback, onUpdateCallback, onExitCallback} =
        this;

    // Performs data binding for entering data while there's time remaining,
    // then returns whether there's more work to do.
    const enterTask = (remaining: RemainingTimeFn) => {
      while (lastEnterIndex < dataLength) {
        step++;
        const index = lastEnterIndex++;
        const datum = data[index];
        const sprite = this.coordinator.createSprite();

        this.boundData[index] = datum;
        this.sprites[index] = sprite;

        // The underlying Sprite API offers three methods for changing Sprite
        // attributes: enter(), update() and exit(). Each method takes a
        // user-provided callback which will be invoked asynchronously.
        // Callbacks are guaranteed to be invoked in order. (See the API
        // documentation in sprite.d.ts for more detail).
        //
        // In the case of an entering datum, we want to guarantee that the
        // onInitCallback is invoked BEFORE the onEnterCallback. For this
        // reason, we use the Sprite's .enter() method to schedule the
        // onInitCallback since that has highest priority.
        if (onInitCallback) {
          // Use Sprite's enter() to invoke onInitCallback.
          sprite.enter(spriteView => {
            onInitCallback(spriteView, datum);
            // NOTE: Because init() applies to the first frame of an entering
            // data point, it should never have a transition time.
            spriteView.TransitionTimeMs = 0;
          });
        }

        // Since we want to guarantee that the onInitCallback will is invoked
        // before the onEnterCallback, and because we already used the Sprite's
        // .enter() method to schedule the onInitCallback, here we use the
        // Sprite's .update() method to schedule the onEnterCallback.
        if (onEnterCallback) {
          // Use Sprite's update() to invoke onEnterCallback.
          sprite.update(spriteView => {
            onEnterCallback(spriteView, datum);
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
    const updateTask = (remaining: RemainingTimeFn) => {
      while (lastUpdateIndex < updateLength) {
        step++;
        const index = lastUpdateIndex++;
        const datum = data[index];
        const sprite = this.sprites[index];

        this.boundData[index] = datum;

        if (onUpdateCallback) {
          // Use the Sprite's update() to invoke the onUpdateCallback.
          sprite.update(spriteView => {
            onUpdateCallback(spriteView, datum);
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
    const exitTask = (remaining: RemainingTimeFn) => {
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

        } else {
          // Use the Sprite's exit() to invoke the onExitCallback.
          sprite.exit(spriteView => {
            if (onExitCallback) {
              onExitCallback(spriteView, datum);
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
    // incrementally carry out the previously defined tasks.
    this.bindingTask = {
      // Setting the id ensures that there will be only one bindingTask
      // associated with this object at a time. If the API user calls bind()
      // again before the previous task finishes, whatever work it had been
      // doing will be dropped for the new parameters.
      id: this.bindingTaskId,

      // Perform at least one unit of work, starting with the exit data binding
      // tasks, then the updates, then the enters. Doing the exits first makes
      // it more likely that Sprite memory will be freed by the time we need it
      // for entering data points.
      callback: (remaining: RemainingTimeFn) => {
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

    // Get a reference to the currently specified onExitCallback, if any. We do
    // this now to ensure that later changes do not affect the way that the
    // previously bound sprites leave.
    const {onExitCallback} = this;

    // Performs exit data binding while there's time remaining, then returns
    // whether there's more work to do.
    const exitTask = (remaining: RemainingTimeFn) => {
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
        } else {
          // Schedule the Sprite's exit() callback to run. This will invoke
          // the onExitCallback, if any.
          sprite.exit(spriteView => {
            if (onExitCallback) {
              onExitCallback(spriteView, datum);
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
      // Setting the id ensures that there will be only one clearingTask
      // associated with this object at a time.
      id: this.clearingTaskId,

      // Perform as much of the clearing work as time allows. When finished,
      // remove the clearingTask member. This will unblock the bindingTask, if
      // there is one.
      callback: (remaining: RemainingTimeFn) => {
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
  hitTest(hitTestParameters: SelectionHitTestParameters): T[] {
    const hitTestResults =
        this.coordinator.hitTest({...hitTestParameters, sprites: this.sprites});

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
    const results = new Array<T>(hitCount);
    for (let i = 0; i < hitCount; i++) {
      results[i] = this.boundData[hitIndices[i]];
    }
    return results;
  }
}
