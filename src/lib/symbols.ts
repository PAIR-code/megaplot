/**
 * @license
 * Copyright 2021 Google Inc. All rights reserved.
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
 * @fileoverview Symbols are used to hide properties on objects in such a way
 * that they can be accessed by other trusted objects, but not by API consumers.
 */

/**
 * Symbol used by SpriteImpl to make internal properties visible to Scene, but
 * not to upstream API consumers.
 */
export const InternalPropertiesSymbol = Symbol('internalProperties');

/**
 * Symbol used by a SpriteViewImpl to access its portion of the Scene's data
 * buffer as a Float32Array DataView.
 */
export const DataViewSymbol = Symbol('dataView');

/**
 * Symbol used by Scene to access its SceneInternal instance. Exported as a
 * symbol to allow access by the debugging demo.
 */
export const SceneInternalSymbol = Symbol('sceneInternal');
