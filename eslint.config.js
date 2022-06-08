/**
 * @license
 * Copyright 2022 Google LLC
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
 * @fileoverview Configuration for ESLint.
 */

const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins:
  [
    '@typescript-eslint',
  ],
  extends:
  [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parserOptions: {
    project: ['tsconfig.json'],
    tsconfigRootDir:__dirname,
  },
  rules: {
    '@typescript-eslint/no-unsafe-return' :OFF,
    '@typescript-eslint/require-await' :OFF,
    '@typescript-eslint/restrict-plus-operands' :OFF,
    '@typescript-eslint/restrict-template-expressions' :OFF,
    '@typescript-eslint/unbound-method' :OFF,
  },
};
