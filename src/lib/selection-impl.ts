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

import {CancellablePromise} from './promise-types';
import {Renderer} from './renderer-types';
import {Selection, SelectionCallback, SelectionHitTestResult} from './selection-types';
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

export class SelectionImpl<T> implements Selection<T> {
  private sprites: Sprite[] = [];

  private boundData: T[] = [];

  private bindingState = BindingState.None;

  private hasWarned = false;

  // Unique objects to identify this instance's bind() and clear() tasks.
  private bindingTaskId = Symbol('bindingTask');
  private clearingTaskId = Symbol('clearingTask');

  // Binding or clearing task, if scheduled.
  private bindingTask?: WorkTaskWithId;
  private clearingTask?: WorkTaskWithId;

  private bindCallback?: SelectionCallback<T>;
  private initCallback?: SelectionCallback<T>;
  private enterCallback?: SelectionCallback<T>;
  private updateCallback?: SelectionCallback<T>;
  private exitCallback?: SelectionCallback<T>;

  /**
   * Create a new Selection which gets its Sprites from the provided Renderer,
   * and schedules tasks via the provided WorkScheduler.
   */
  constructor(
      private stepsBetweenChecks: number,
      private renderer: Renderer,
      private workScheduler: WorkScheduler,
  ) {}

  onBind(bindCallback: SelectionCallback<T>) {
    this.bindCallback = bindCallback;
    return this;
  }

  onInit(initCallback: SelectionCallback<T>) {
    this.initCallback = initCallback;
    return this;
  }

  onEnter(enterCallback: SelectionCallback<T>) {
    this.enterCallback = enterCallback;
    return this;
  }

  onUpdate(updateCallback: SelectionCallback<T>) {
    this.updateCallback = updateCallback;
    return this;
  }

  onExit(exitCallback: SelectionCallback<T>) {
    this.exitCallback = exitCallback;
    return this;
  }

  /**
   * Bind the supplied data array to the array of managed Sprites. This method
   * returns immediately, but queues an incremental task to be carried out by
   * the WorkScheduler.
   *
   * Note that whereas the Selection API offers the user callbacks for onBind(),
   * onInit(), onEnter(), onUpdate() and onExit(), the underlying Sprite API
   * offers only enter(), update() and exit(). To handle this mismatch, the
   * Sprite's update() callback must be used to invoke more than one of the
   * Selection's callback. Here's the implementation mapping:
   *
   *  - Selection::onInit() - Sprite::enter()
   *  - Selection::onEnter() - Sprite::update()
   *  - Selection::onUpdate() - Sprite::update()
   *  - Selection::onExit() - Sprite::exit()
   *  - Selection::onBind() - Sprite::enter(), ::update() and ::exit().
   *
   * The Selection's onBind() callback, if specified, will be invoked
   * immediately prior to every other callback. So for an entering datum, the
   * invocation schedule is as follows:
   *
   *  - Sprite::enter() calls Selection::onBind() then Selection::onInit()
   *  - Sprite::update() calls Selection::onBind() then Selection::onEnter()
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
      console.warn('Possibly conflicting .bind() invocations detected.');
      this.hasWarned = true;
    }

    // If there's a clearingTask already in flight, then short-circuit here and
    // schedule a future attempt using the bindingTaskId.
    if (this.clearingTask) {
      this.bindingState = BindingState.Blocked;
      this.workScheduler.scheduleUniqueTask({
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

    // Performs data binding for entering data while there's time remaining,
    // then returns whether there's more work to do.
    const enterTask = (remaining: RemainingTimeFn) => {
      while (lastEnterIndex < dataLength) {
        step++;
        const index = lastEnterIndex++;
        const datum = data[index];
        const sprite = this.renderer.createSprite();

        this.boundData[index] = datum;
        this.sprites[index] = sprite;

        const {initCallback, enterCallback, bindCallback} = this;

        if (initCallback || bindCallback) {
          // Schedule the Sprite's enter() callback to run. This will invoke
          // the bindCallback and/or the initCallback, in that order.
          sprite.enter(spriteView => {
            if (bindCallback) {
              // The bindCallback, if present is always invoked when binding
              // data, immediately before more specific callbacks if present.
              bindCallback(spriteView, datum);
            }
            if (initCallback) {
              initCallback(spriteView, datum);
            }
            // NOTE: Because init() applies to the first frame of an entering
            // data point, it should never have a transition time.
            spriteView.TransitionTimeMs = 0;
          });
        }

        if (enterCallback || bindCallback) {
          // Schedule the Sprite's update() callback to run. This will invoke
          // the bindCallback and/or the enterCallback, in that order.
          sprite.update(spriteView => {
            if (bindCallback) {
              // The bindCallback, if present is always invoked when binding
              // data, immediately before more specific callbacks if present.
              bindCallback(spriteView, datum);
            }
            if (enterCallback) {
              enterCallback(spriteView, datum);
            }
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

        const {updateCallback, bindCallback} = this;

        if (updateCallback || bindCallback) {
          // Schedule the Sprite's update() callback to run. This will invoke
          // the bindCallback and/or the updateCallback, in that order.
          sprite.update(spriteView => {
            if (bindCallback) {
              // The bindCallback, if present is always invoked when binding
              // data, immediately before more specific callbacks if present.
              bindCallback(spriteView, datum);
            }
            if (updateCallback) {
              updateCallback(spriteView, datum);
            }
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
          const {exitCallback, bindCallback} = this;

          // Schedule the Sprite's exit() callback to run. This will invoke
          // the bindCallback and/or the exitCallback, in that order.
          sprite.exit(spriteView => {
            if (bindCallback) {
              // The bindCallback, if present is always invoked when binding
              // data, immediately before more specific callbacks if present.
              bindCallback(spriteView, datum);
            }
            if (exitCallback) {
              exitCallback(spriteView, datum);
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
    // incrementally carry out the prevously defined tasks.
    this.bindingTask = {
      // Setting id to this ensures that there will be only one bindingTask
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
    this.workScheduler.scheduleUniqueTask(this.bindingTask);
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

    // Get a reference to the currently specified exitCallback and bindCallback,
    // if any. We do this now to ensure that later changes do not affect the way
    // thate the previously bound sprites leave.
    const {exitCallback, bindCallback} = this;

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
          // the bindCallback and/or the exitCallback, in that order. Even if
          // neither bindCallback nor exitCallback are specified, we still need
          // to call .exit() to mark the Sprite for removal.
          sprite.exit(spriteView => {
            if (bindCallback) {
              // The bindCallback, if present is always invoked when binding
              // data, immediately before more specific callbacks if present.
              bindCallback(spriteView, datum);
            }
            if (exitCallback) {
              exitCallback(spriteView, datum);
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
      // Setting id to this ensures that there will be only one bindingTask
      // associated with this object at a time. If the API user calls bind()
      // again before the previous task finishes, whatever work it had been
      // doing will be dropped for the new parameters.
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
      this.workScheduler.unscheduleTask(this.bindingTask);
      delete this.bindingTask;
    }

    // Use the provided WorkScheduler to schedule the task.
    this.workScheduler.scheduleUniqueTask(this.clearingTask);
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
  hitTest(/* hitTestParameters: Partial<HitTestParameters> */):
      CancellablePromise<SelectionHitTestResult<T>> {
    throw new Error('Not yet implemented.');
  }
}
