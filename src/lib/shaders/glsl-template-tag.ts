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
 * @fileoverview Provides a template tag for marking strings of GLSL code.
 */

/**
 * Template tag to mark GLSL code fragments, for syntax highlighting in editors
 * which that it.
 */
export function glsl(
    strs: TemplateStringsArray, ...args: Array<string|number>) {
  const interleaved: string[] = [];
  for (let i = 0; i < args.length; i++) {
    interleaved.push(strs[i], `${args[i]}`);
  }
  interleaved.push(strs[strs.length - 1]);
  return interleaved.join('');
}
