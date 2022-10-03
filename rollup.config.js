/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import {terser} from 'rollup-plugin-terser';
import visualizer from 'rollup-plugin-visualizer';

import {version} from './package.json';

const MEGAPLOT_BANNER = `/**
 * @license
 * Copyright ${(new Date).getFullYear()} Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
`;

const TINY_SDF_BANNER = `/**
 * @license
 * Copyright © 2016-2017 Mapbox, Inc.
 * This code available under the terms of the BSD 2-Clause license.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS”
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
`;

const REGL_BANNER = `/**
 * @license
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Mikola Lysenko
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
`;

function config({
  plugins = [],
  output = {},
  external = [],
  visualize = false,
  tsCompilerOptions = {},
  additionalBanner = '',
  minify = false,
}) {
  if (visualize) {
    const filename = output.file + '.html';
    plugins.push(visualizer({sourcemap: true, filename}));
    console.log(`Will output a bundle visualization in ${filename}`);
  }

  const defaultTsOptions = {
    include: ['src/**/*.ts'],
    module: 'ES2015',
  };
  const tsoptions = Object.assign({}, defaultTsOptions, tsCompilerOptions);

  const banner = `${MEGAPLOT_BANNER}${TINY_SDF_BANNER}${additionalBanner}`;

  if (minify) {
    plugins.push(terser({
      output: {
        preamble: banner,
        comments: false,
      }
    }));
  }

  return {
    input: 'src/index.ts',
    plugins: [
      typescript(tsoptions), resolve(),
      // Polyfill require() from dependencies.
      commonjs({
        ignore: [],
        include: 'node_modules/**',
      }),
      ...plugins
    ],
    output: {
      banner,
      sourcemap: true,
      ...output,
    },
    external,
    onwarn: warning => {
      const {code} = warning;
      if (code === 'CIRCULAR_DEPENDENCY' || code === 'CIRCULAR' ||
          code === 'THIS_IS_UNDEFINED') {
        return;
      }
      console.warn('WARNING: ', warning.toString());
    }
  };
}

module.exports = cmdOptions => {
  const bundles = [];

  const name = 'megaplot';
  const extend = true;
  const browserFormat = 'umd';
  const fileName = `megaplot-v${version}`;

  // Browser ES2015 unminified, standalone.
  bundles.push(config({
    output: {
      format: browserFormat,
      name,
      extend,
      file: `dist/${fileName}.es2015.js`,
      globals: {'regl': 'REGL'},
    },
    external: ['regl'],
    visualize: true,
    tsCompilerOptions: {target: 'es2015'},
  }));

  // Browser ES2015 minified, standalone.
  bundles.push(config({
    output: {
      format: browserFormat,
      name,
      extend,
      file: `dist/${fileName}.es2015.min.js`,
      globals: {'regl': 'REGL'},
    },
    external: ['regl'],
    visualize: true,
    tsCompilerOptions: {target: 'es2015'},
    minify: true,
  }));

  // Browser ES2015 unminified, all-in-one bundle (includes deps).
  bundles.push(config({
    output: {
      format: browserFormat,
      name,
      extend,
      file: `dist/${fileName}.bundle.es2015.js`,
    },
    tsCompilerOptions: {target: 'es2015'},
    additionalBanner: REGL_BANNER,
  }));

  // Browser ES2015 minified, all-in-one bundle (includes deps).
  bundles.push(config({
    output: {
      format: browserFormat,
      name,
      extend,
      file: `dist/${fileName}.bundle.es2015.min.js`,
    },
    tsCompilerOptions: {target: 'es2015'},
    additionalBanner: REGL_BANNER,
    minify: true,
  }));

  return bundles;
};
