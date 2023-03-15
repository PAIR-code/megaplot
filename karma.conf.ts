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
 * @fileoverview Karma configuration.
 */

// @see https://github.com/karma-runner/karma/issues/3329#issuecomment-772089662
// @ts-nocheck
process[Symbol.for('ts-node.register.instance')]?.enabled(false);

module.exports = (config) => {
  config.set({
    // Base path that will be used to resolve all patterns (eg. files, exclude).
    basePath: '',

    // Frameworks to use.
    frameworks: ['jasmine', 'webpack'],

    // List of files / patterns to load in the browser.
    files: [
      // Set TEST_PATTERN env var to test a specific file.
      process.env.TEST_PATTERN || 'test/**/*.test.ts',
    ],

    // List of files / patterns to exclude.
    exclude: [],

    // Preprocess matching files before serving them to the browser.
    preprocessors: {
      '**/*.ts': ['webpack'],
    },

    // Webpack settings.
    webpack: {
      mode: 'development',
      module: {
        rules: [{ test: /\.ts$/, use: 'ts-loader' }],
      },
      resolve: {
        extensions: ['.ts'],
      },
    },

    // Test results reporter to use.
    reporters: ['progress'],

    // Web server port.
    port: 9876,

    // Enable / disable colors in the output (reporters and logs).
    colors: true,

    // Level of logging.
    logLevel: config.LOG_INFO,

    // Enable executing tests whenever any file changes.
    autoWatch: true,

    // Start these browsers.
    browsers: [],

    // Continuous Integration mode.
    singleRun: false,

    // Concurrency level (max simultaneous browser instances).
    concurrency: Infinity,
  });
};
