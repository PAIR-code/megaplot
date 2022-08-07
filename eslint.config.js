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

const fs = require('fs');
const skipWords = fs.readFileSync('eslint.skipWords.txt', 'utf8')
                      .split('\n')
                      .map(line => line.trim())
                      .filter(line => !!line);


const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins:
  [
    '@typescript-eslint',
    'spellcheck',
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
    '@typescript-eslint/no-confusing-void-expression': ERROR,
    '@typescript-eslint/prefer-readonly': ERROR,
    'spellcheck/spell-checker': [WARN, {
      'comments': true,
      'strings': true,
      'identifiers': true,
      'templates': false,
      'lang': 'en_US',
      'skipWords': skipWords,
      'skipIfMatch': [
        'dat\\.GUI',
        'TODO\\s*\\([^\\)]+\\):',
      ],
    }],
  },
};
