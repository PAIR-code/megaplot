/**
 * @license
 * Copyright 2022 Google LLC
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
/**
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
/**
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

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.megaplot = global.megaplot || {}));
}(this, (function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var regl = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
        module.exports = factory() ;
    }(commonjsGlobal, (function () {
    var isTypedArray = function (x) {
      return (
        x instanceof Uint8Array ||
        x instanceof Uint16Array ||
        x instanceof Uint32Array ||
        x instanceof Int8Array ||
        x instanceof Int16Array ||
        x instanceof Int32Array ||
        x instanceof Float32Array ||
        x instanceof Float64Array ||
        x instanceof Uint8ClampedArray
      )
    };

    var extend = function (base, opts) {
      var keys = Object.keys(opts);
      for (var i = 0; i < keys.length; ++i) {
        base[keys[i]] = opts[keys[i]];
      }
      return base
    };

    // Error checking and parameter validation.
    //
    // Statements for the form `check.someProcedure(...)` get removed by
    // a browserify transform for optimized/minified bundles.
    //
    /* globals atob */
    var endl = '\n';

    // only used for extracting shader names.  if atob not present, then errors
    // will be slightly crappier
    function decodeB64 (str) {
      if (typeof atob !== 'undefined') {
        return atob(str)
      }
      return 'base64:' + str
    }

    function raise (message) {
      var error = new Error('(regl) ' + message);
      console.error(error);
      throw error
    }

    function check (pred, message) {
      if (!pred) {
        raise(message);
      }
    }

    function encolon (message) {
      if (message) {
        return ': ' + message
      }
      return ''
    }

    function checkParameter (param, possibilities, message) {
      if (!(param in possibilities)) {
        raise('unknown parameter (' + param + ')' + encolon(message) +
              '. possible values: ' + Object.keys(possibilities).join());
      }
    }

    function checkIsTypedArray (data, message) {
      if (!isTypedArray(data)) {
        raise(
          'invalid parameter type' + encolon(message) +
          '. must be a typed array');
      }
    }

    function standardTypeEh (value, type) {
      switch (type) {
        case 'number': return typeof value === 'number'
        case 'object': return typeof value === 'object'
        case 'string': return typeof value === 'string'
        case 'boolean': return typeof value === 'boolean'
        case 'function': return typeof value === 'function'
        case 'undefined': return typeof value === 'undefined'
        case 'symbol': return typeof value === 'symbol'
      }
    }

    function checkTypeOf (value, type, message) {
      if (!standardTypeEh(value, type)) {
        raise(
          'invalid parameter type' + encolon(message) +
          '. expected ' + type + ', got ' + (typeof value));
      }
    }

    function checkNonNegativeInt (value, message) {
      if (!((value >= 0) &&
            ((value | 0) === value))) {
        raise('invalid parameter type, (' + value + ')' + encolon(message) +
              '. must be a nonnegative integer');
      }
    }

    function checkOneOf (value, list, message) {
      if (list.indexOf(value) < 0) {
        raise('invalid value' + encolon(message) + '. must be one of: ' + list);
      }
    }

    var constructorKeys = [
      'gl',
      'canvas',
      'container',
      'attributes',
      'pixelRatio',
      'extensions',
      'optionalExtensions',
      'profile',
      'onDone'
    ];

    function checkConstructor (obj) {
      Object.keys(obj).forEach(function (key) {
        if (constructorKeys.indexOf(key) < 0) {
          raise('invalid regl constructor argument "' + key + '". must be one of ' + constructorKeys);
        }
      });
    }

    function leftPad (str, n) {
      str = str + '';
      while (str.length < n) {
        str = ' ' + str;
      }
      return str
    }

    function ShaderFile () {
      this.name = 'unknown';
      this.lines = [];
      this.index = {};
      this.hasErrors = false;
    }

    function ShaderLine (number, line) {
      this.number = number;
      this.line = line;
      this.errors = [];
    }

    function ShaderError (fileNumber, lineNumber, message) {
      this.file = fileNumber;
      this.line = lineNumber;
      this.message = message;
    }

    function guessCommand () {
      var error = new Error();
      var stack = (error.stack || error).toString();
      var pat = /compileProcedure.*\n\s*at.*\((.*)\)/.exec(stack);
      if (pat) {
        return pat[1]
      }
      var pat2 = /compileProcedure.*\n\s*at\s+(.*)(\n|$)/.exec(stack);
      if (pat2) {
        return pat2[1]
      }
      return 'unknown'
    }

    function guessCallSite () {
      var error = new Error();
      var stack = (error.stack || error).toString();
      var pat = /at REGLCommand.*\n\s+at.*\((.*)\)/.exec(stack);
      if (pat) {
        return pat[1]
      }
      var pat2 = /at REGLCommand.*\n\s+at\s+(.*)\n/.exec(stack);
      if (pat2) {
        return pat2[1]
      }
      return 'unknown'
    }

    function parseSource (source, command) {
      var lines = source.split('\n');
      var lineNumber = 1;
      var fileNumber = 0;
      var files = {
        unknown: new ShaderFile(),
        0: new ShaderFile()
      };
      files.unknown.name = files[0].name = command || guessCommand();
      files.unknown.lines.push(new ShaderLine(0, ''));
      for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];
        var parts = /^\s*#\s*(\w+)\s+(.+)\s*$/.exec(line);
        if (parts) {
          switch (parts[1]) {
            case 'line':
              var lineNumberInfo = /(\d+)(\s+\d+)?/.exec(parts[2]);
              if (lineNumberInfo) {
                lineNumber = lineNumberInfo[1] | 0;
                if (lineNumberInfo[2]) {
                  fileNumber = lineNumberInfo[2] | 0;
                  if (!(fileNumber in files)) {
                    files[fileNumber] = new ShaderFile();
                  }
                }
              }
              break
            case 'define':
              var nameInfo = /SHADER_NAME(_B64)?\s+(.*)$/.exec(parts[2]);
              if (nameInfo) {
                files[fileNumber].name = (nameInfo[1]
                  ? decodeB64(nameInfo[2])
                  : nameInfo[2]);
              }
              break
          }
        }
        files[fileNumber].lines.push(new ShaderLine(lineNumber++, line));
      }
      Object.keys(files).forEach(function (fileNumber) {
        var file = files[fileNumber];
        file.lines.forEach(function (line) {
          file.index[line.number] = line;
        });
      });
      return files
    }

    function parseErrorLog (errLog) {
      var result = [];
      errLog.split('\n').forEach(function (errMsg) {
        if (errMsg.length < 5) {
          return
        }
        var parts = /^ERROR:\s+(\d+):(\d+):\s*(.*)$/.exec(errMsg);
        if (parts) {
          result.push(new ShaderError(
            parts[1] | 0,
            parts[2] | 0,
            parts[3].trim()));
        } else if (errMsg.length > 0) {
          result.push(new ShaderError('unknown', 0, errMsg));
        }
      });
      return result
    }

    function annotateFiles (files, errors) {
      errors.forEach(function (error) {
        var file = files[error.file];
        if (file) {
          var line = file.index[error.line];
          if (line) {
            line.errors.push(error);
            file.hasErrors = true;
            return
          }
        }
        files.unknown.hasErrors = true;
        files.unknown.lines[0].errors.push(error);
      });
    }

    function checkShaderError (gl, shader, source, type, command) {
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var errLog = gl.getShaderInfoLog(shader);
        var typeName = type === gl.FRAGMENT_SHADER ? 'fragment' : 'vertex';
        checkCommandType(source, 'string', typeName + ' shader source must be a string', command);
        var files = parseSource(source, command);
        var errors = parseErrorLog(errLog);
        annotateFiles(files, errors);

        Object.keys(files).forEach(function (fileNumber) {
          var file = files[fileNumber];
          if (!file.hasErrors) {
            return
          }

          var strings = [''];
          var styles = [''];

          function push (str, style) {
            strings.push(str);
            styles.push(style || '');
          }

          push('file number ' + fileNumber + ': ' + file.name + '\n', 'color:red;text-decoration:underline;font-weight:bold');

          file.lines.forEach(function (line) {
            if (line.errors.length > 0) {
              push(leftPad(line.number, 4) + '|  ', 'background-color:yellow; font-weight:bold');
              push(line.line + endl, 'color:red; background-color:yellow; font-weight:bold');

              // try to guess token
              var offset = 0;
              line.errors.forEach(function (error) {
                var message = error.message;
                var token = /^\s*'(.*)'\s*:\s*(.*)$/.exec(message);
                if (token) {
                  var tokenPat = token[1];
                  message = token[2];
                  switch (tokenPat) {
                    case 'assign':
                      tokenPat = '=';
                      break
                  }
                  offset = Math.max(line.line.indexOf(tokenPat, offset), 0);
                } else {
                  offset = 0;
                }

                push(leftPad('| ', 6));
                push(leftPad('^^^', offset + 3) + endl, 'font-weight:bold');
                push(leftPad('| ', 6));
                push(message + endl, 'font-weight:bold');
              });
              push(leftPad('| ', 6) + endl);
            } else {
              push(leftPad(line.number, 4) + '|  ');
              push(line.line + endl, 'color:red');
            }
          });
          if (typeof document !== 'undefined' && !window.chrome) {
            styles[0] = strings.join('%c');
            console.log.apply(console, styles);
          } else {
            console.log(strings.join(''));
          }
        });

        check.raise('Error compiling ' + typeName + ' shader, ' + files[0].name);
      }
    }

    function checkLinkError (gl, program, fragShader, vertShader, command) {
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        var errLog = gl.getProgramInfoLog(program);
        var fragParse = parseSource(fragShader, command);
        var vertParse = parseSource(vertShader, command);

        var header = 'Error linking program with vertex shader, "' +
          vertParse[0].name + '", and fragment shader "' + fragParse[0].name + '"';

        if (typeof document !== 'undefined') {
          console.log('%c' + header + endl + '%c' + errLog,
            'color:red;text-decoration:underline;font-weight:bold',
            'color:red');
        } else {
          console.log(header + endl + errLog);
        }
        check.raise(header);
      }
    }

    function saveCommandRef (object) {
      object._commandRef = guessCommand();
    }

    function saveDrawCommandInfo (opts, uniforms, attributes, stringStore) {
      saveCommandRef(opts);

      function id (str) {
        if (str) {
          return stringStore.id(str)
        }
        return 0
      }
      opts._fragId = id(opts.static.frag);
      opts._vertId = id(opts.static.vert);

      function addProps (dict, set) {
        Object.keys(set).forEach(function (u) {
          dict[stringStore.id(u)] = true;
        });
      }

      var uniformSet = opts._uniformSet = {};
      addProps(uniformSet, uniforms.static);
      addProps(uniformSet, uniforms.dynamic);

      var attributeSet = opts._attributeSet = {};
      addProps(attributeSet, attributes.static);
      addProps(attributeSet, attributes.dynamic);

      opts._hasCount = (
        'count' in opts.static ||
        'count' in opts.dynamic ||
        'elements' in opts.static ||
        'elements' in opts.dynamic);
    }

    function commandRaise (message, command) {
      var callSite = guessCallSite();
      raise(message +
        ' in command ' + (command || guessCommand()) +
        (callSite === 'unknown' ? '' : ' called from ' + callSite));
    }

    function checkCommand (pred, message, command) {
      if (!pred) {
        commandRaise(message, command || guessCommand());
      }
    }

    function checkParameterCommand (param, possibilities, message, command) {
      if (!(param in possibilities)) {
        commandRaise(
          'unknown parameter (' + param + ')' + encolon(message) +
          '. possible values: ' + Object.keys(possibilities).join(),
          command || guessCommand());
      }
    }

    function checkCommandType (value, type, message, command) {
      if (!standardTypeEh(value, type)) {
        commandRaise(
          'invalid parameter type' + encolon(message) +
          '. expected ' + type + ', got ' + (typeof value),
          command || guessCommand());
      }
    }

    function checkOptional (block) {
      block();
    }

    function checkFramebufferFormat (attachment, texFormats, rbFormats) {
      if (attachment.texture) {
        checkOneOf(
          attachment.texture._texture.internalformat,
          texFormats,
          'unsupported texture format for attachment');
      } else {
        checkOneOf(
          attachment.renderbuffer._renderbuffer.format,
          rbFormats,
          'unsupported renderbuffer format for attachment');
      }
    }

    var GL_CLAMP_TO_EDGE = 0x812F;

    var GL_NEAREST = 0x2600;
    var GL_NEAREST_MIPMAP_NEAREST = 0x2700;
    var GL_LINEAR_MIPMAP_NEAREST = 0x2701;
    var GL_NEAREST_MIPMAP_LINEAR = 0x2702;
    var GL_LINEAR_MIPMAP_LINEAR = 0x2703;

    var GL_BYTE = 5120;
    var GL_UNSIGNED_BYTE = 5121;
    var GL_SHORT = 5122;
    var GL_UNSIGNED_SHORT = 5123;
    var GL_INT = 5124;
    var GL_UNSIGNED_INT = 5125;
    var GL_FLOAT = 5126;

    var GL_UNSIGNED_SHORT_4_4_4_4 = 0x8033;
    var GL_UNSIGNED_SHORT_5_5_5_1 = 0x8034;
    var GL_UNSIGNED_SHORT_5_6_5 = 0x8363;
    var GL_UNSIGNED_INT_24_8_WEBGL = 0x84FA;

    var GL_HALF_FLOAT_OES = 0x8D61;

    var TYPE_SIZE = {};

    TYPE_SIZE[GL_BYTE] =
    TYPE_SIZE[GL_UNSIGNED_BYTE] = 1;

    TYPE_SIZE[GL_SHORT] =
    TYPE_SIZE[GL_UNSIGNED_SHORT] =
    TYPE_SIZE[GL_HALF_FLOAT_OES] =
    TYPE_SIZE[GL_UNSIGNED_SHORT_5_6_5] =
    TYPE_SIZE[GL_UNSIGNED_SHORT_4_4_4_4] =
    TYPE_SIZE[GL_UNSIGNED_SHORT_5_5_5_1] = 2;

    TYPE_SIZE[GL_INT] =
    TYPE_SIZE[GL_UNSIGNED_INT] =
    TYPE_SIZE[GL_FLOAT] =
    TYPE_SIZE[GL_UNSIGNED_INT_24_8_WEBGL] = 4;

    function pixelSize (type, channels) {
      if (type === GL_UNSIGNED_SHORT_5_5_5_1 ||
          type === GL_UNSIGNED_SHORT_4_4_4_4 ||
          type === GL_UNSIGNED_SHORT_5_6_5) {
        return 2
      } else if (type === GL_UNSIGNED_INT_24_8_WEBGL) {
        return 4
      } else {
        return TYPE_SIZE[type] * channels
      }
    }

    function isPow2 (v) {
      return !(v & (v - 1)) && (!!v)
    }

    function checkTexture2D (info, mipData, limits) {
      var i;
      var w = mipData.width;
      var h = mipData.height;
      var c = mipData.channels;

      // Check texture shape
      check(w > 0 && w <= limits.maxTextureSize &&
            h > 0 && h <= limits.maxTextureSize,
      'invalid texture shape');

      // check wrap mode
      if (info.wrapS !== GL_CLAMP_TO_EDGE || info.wrapT !== GL_CLAMP_TO_EDGE) {
        check(isPow2(w) && isPow2(h),
          'incompatible wrap mode for texture, both width and height must be power of 2');
      }

      if (mipData.mipmask === 1) {
        if (w !== 1 && h !== 1) {
          check(
            info.minFilter !== GL_NEAREST_MIPMAP_NEAREST &&
            info.minFilter !== GL_NEAREST_MIPMAP_LINEAR &&
            info.minFilter !== GL_LINEAR_MIPMAP_NEAREST &&
            info.minFilter !== GL_LINEAR_MIPMAP_LINEAR,
            'min filter requires mipmap');
        }
      } else {
        // texture must be power of 2
        check(isPow2(w) && isPow2(h),
          'texture must be a square power of 2 to support mipmapping');
        check(mipData.mipmask === (w << 1) - 1,
          'missing or incomplete mipmap data');
      }

      if (mipData.type === GL_FLOAT) {
        if (limits.extensions.indexOf('oes_texture_float_linear') < 0) {
          check(info.minFilter === GL_NEAREST && info.magFilter === GL_NEAREST,
            'filter not supported, must enable oes_texture_float_linear');
        }
        check(!info.genMipmaps,
          'mipmap generation not supported with float textures');
      }

      // check image complete
      var mipimages = mipData.images;
      for (i = 0; i < 16; ++i) {
        if (mipimages[i]) {
          var mw = w >> i;
          var mh = h >> i;
          check(mipData.mipmask & (1 << i), 'missing mipmap data');

          var img = mipimages[i];

          check(
            img.width === mw &&
            img.height === mh,
            'invalid shape for mip images');

          check(
            img.format === mipData.format &&
            img.internalformat === mipData.internalformat &&
            img.type === mipData.type,
            'incompatible type for mip image');

          if (img.compressed) ; else if (img.data) {
            // check(img.data.byteLength === mw * mh *
            // Math.max(pixelSize(img.type, c), img.unpackAlignment),
            var rowSize = Math.ceil(pixelSize(img.type, c) * mw / img.unpackAlignment) * img.unpackAlignment;
            check(img.data.byteLength === rowSize * mh,
              'invalid data for image, buffer size is inconsistent with image format');
          } else if (img.element) ; else if (img.copy) ;
        } else if (!info.genMipmaps) {
          check((mipData.mipmask & (1 << i)) === 0, 'extra mipmap data');
        }
      }

      if (mipData.compressed) {
        check(!info.genMipmaps,
          'mipmap generation for compressed images not supported');
      }
    }

    function checkTextureCube (texture, info, faces, limits) {
      var w = texture.width;
      var h = texture.height;
      var c = texture.channels;

      // Check texture shape
      check(
        w > 0 && w <= limits.maxTextureSize && h > 0 && h <= limits.maxTextureSize,
        'invalid texture shape');
      check(
        w === h,
        'cube map must be square');
      check(
        info.wrapS === GL_CLAMP_TO_EDGE && info.wrapT === GL_CLAMP_TO_EDGE,
        'wrap mode not supported by cube map');

      for (var i = 0; i < faces.length; ++i) {
        var face = faces[i];
        check(
          face.width === w && face.height === h,
          'inconsistent cube map face shape');

        if (info.genMipmaps) {
          check(!face.compressed,
            'can not generate mipmap for compressed textures');
          check(face.mipmask === 1,
            'can not specify mipmaps and generate mipmaps');
        }

        var mipmaps = face.images;
        for (var j = 0; j < 16; ++j) {
          var img = mipmaps[j];
          if (img) {
            var mw = w >> j;
            var mh = h >> j;
            check(face.mipmask & (1 << j), 'missing mipmap data');
            check(
              img.width === mw &&
              img.height === mh,
              'invalid shape for mip images');
            check(
              img.format === texture.format &&
              img.internalformat === texture.internalformat &&
              img.type === texture.type,
              'incompatible type for mip image');

            if (img.compressed) ; else if (img.data) {
              check(img.data.byteLength === mw * mh *
                Math.max(pixelSize(img.type, c), img.unpackAlignment),
              'invalid data for image, buffer size is inconsistent with image format');
            } else if (img.element) ; else if (img.copy) ;
          }
        }
      }
    }

    var check$1 = extend(check, {
      optional: checkOptional,
      raise: raise,
      commandRaise: commandRaise,
      command: checkCommand,
      parameter: checkParameter,
      commandParameter: checkParameterCommand,
      constructor: checkConstructor,
      type: checkTypeOf,
      commandType: checkCommandType,
      isTypedArray: checkIsTypedArray,
      nni: checkNonNegativeInt,
      oneOf: checkOneOf,
      shaderError: checkShaderError,
      linkError: checkLinkError,
      callSite: guessCallSite,
      saveCommandRef: saveCommandRef,
      saveDrawInfo: saveDrawCommandInfo,
      framebufferFormat: checkFramebufferFormat,
      guessCommand: guessCommand,
      texture2D: checkTexture2D,
      textureCube: checkTextureCube
    });

    var VARIABLE_COUNTER = 0;

    var DYN_FUNC = 0;

    function DynamicVariable (type, data) {
      this.id = (VARIABLE_COUNTER++);
      this.type = type;
      this.data = data;
    }

    function escapeStr (str) {
      return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    }

    function splitParts (str) {
      if (str.length === 0) {
        return []
      }

      var firstChar = str.charAt(0);
      var lastChar = str.charAt(str.length - 1);

      if (str.length > 1 &&
          firstChar === lastChar &&
          (firstChar === '"' || firstChar === "'")) {
        return ['"' + escapeStr(str.substr(1, str.length - 2)) + '"']
      }

      var parts = /\[(false|true|null|\d+|'[^']*'|"[^"]*")\]/.exec(str);
      if (parts) {
        return (
          splitParts(str.substr(0, parts.index))
            .concat(splitParts(parts[1]))
            .concat(splitParts(str.substr(parts.index + parts[0].length)))
        )
      }

      var subparts = str.split('.');
      if (subparts.length === 1) {
        return ['"' + escapeStr(str) + '"']
      }

      var result = [];
      for (var i = 0; i < subparts.length; ++i) {
        result = result.concat(splitParts(subparts[i]));
      }
      return result
    }

    function toAccessorString (str) {
      return '[' + splitParts(str).join('][') + ']'
    }

    function defineDynamic (type, data) {
      return new DynamicVariable(type, toAccessorString(data + ''))
    }

    function isDynamic (x) {
      return (typeof x === 'function' && !x._reglType) ||
             x instanceof DynamicVariable
    }

    function unbox (x, path) {
      if (typeof x === 'function') {
        return new DynamicVariable(DYN_FUNC, x)
      }
      return x
    }

    var dynamic = {
      DynamicVariable: DynamicVariable,
      define: defineDynamic,
      isDynamic: isDynamic,
      unbox: unbox,
      accessor: toAccessorString
    };

    /* globals requestAnimationFrame, cancelAnimationFrame */
    var raf = {
      next: typeof requestAnimationFrame === 'function'
        ? function (cb) { return requestAnimationFrame(cb) }
        : function (cb) { return setTimeout(cb, 16) },
      cancel: typeof cancelAnimationFrame === 'function'
        ? function (raf) { return cancelAnimationFrame(raf) }
        : clearTimeout
    };

    /* globals performance */
    var clock = (typeof performance !== 'undefined' && performance.now)
        ? function () { return performance.now() }
        : function () { return +(new Date()) };

    function createStringStore () {
      var stringIds = { '': 0 };
      var stringValues = [''];
      return {
        id: function (str) {
          var result = stringIds[str];
          if (result) {
            return result
          }
          result = stringIds[str] = stringValues.length;
          stringValues.push(str);
          return result
        },

        str: function (id) {
          return stringValues[id]
        }
      }
    }

    // Context and canvas creation helper functions
    function createCanvas (element, onDone, pixelRatio) {
      var canvas = document.createElement('canvas');
      extend(canvas.style, {
        border: 0,
        margin: 0,
        padding: 0,
        top: 0,
        left: 0
      });
      element.appendChild(canvas);

      if (element === document.body) {
        canvas.style.position = 'absolute';
        extend(element.style, {
          margin: 0,
          padding: 0
        });
      }

      function resize () {
        var w = window.innerWidth;
        var h = window.innerHeight;
        if (element !== document.body) {
          var bounds = element.getBoundingClientRect();
          w = bounds.right - bounds.left;
          h = bounds.bottom - bounds.top;
        }
        canvas.width = pixelRatio * w;
        canvas.height = pixelRatio * h;
        extend(canvas.style, {
          width: w + 'px',
          height: h + 'px'
        });
      }

      window.addEventListener('resize', resize, false);

      function onDestroy () {
        window.removeEventListener('resize', resize);
        element.removeChild(canvas);
      }

      resize();

      return {
        canvas: canvas,
        onDestroy: onDestroy
      }
    }

    function createContext (canvas, contextAttributes) {
      function get (name) {
        try {
          return canvas.getContext(name, contextAttributes)
        } catch (e) {
          return null
        }
      }
      return (
        get('webgl') ||
        get('experimental-webgl') ||
        get('webgl-experimental')
      )
    }

    function isHTMLElement (obj) {
      return (
        typeof obj.nodeName === 'string' &&
        typeof obj.appendChild === 'function' &&
        typeof obj.getBoundingClientRect === 'function'
      )
    }

    function isWebGLContext (obj) {
      return (
        typeof obj.drawArrays === 'function' ||
        typeof obj.drawElements === 'function'
      )
    }

    function parseExtensions (input) {
      if (typeof input === 'string') {
        return input.split()
      }
      check$1(Array.isArray(input), 'invalid extension array');
      return input
    }

    function getElement (desc) {
      if (typeof desc === 'string') {
        check$1(typeof document !== 'undefined', 'not supported outside of DOM');
        return document.querySelector(desc)
      }
      return desc
    }

    function parseArgs (args_) {
      var args = args_ || {};
      var element, container, canvas, gl;
      var contextAttributes = {};
      var extensions = [];
      var optionalExtensions = [];
      var pixelRatio = (typeof window === 'undefined' ? 1 : window.devicePixelRatio);
      var profile = false;
      var onDone = function (err) {
        if (err) {
          check$1.raise(err);
        }
      };
      var onDestroy = function () {};
      if (typeof args === 'string') {
        check$1(
          typeof document !== 'undefined',
          'selector queries only supported in DOM enviroments');
        element = document.querySelector(args);
        check$1(element, 'invalid query string for element');
      } else if (typeof args === 'object') {
        if (isHTMLElement(args)) {
          element = args;
        } else if (isWebGLContext(args)) {
          gl = args;
          canvas = gl.canvas;
        } else {
          check$1.constructor(args);
          if ('gl' in args) {
            gl = args.gl;
          } else if ('canvas' in args) {
            canvas = getElement(args.canvas);
          } else if ('container' in args) {
            container = getElement(args.container);
          }
          if ('attributes' in args) {
            contextAttributes = args.attributes;
            check$1.type(contextAttributes, 'object', 'invalid context attributes');
          }
          if ('extensions' in args) {
            extensions = parseExtensions(args.extensions);
          }
          if ('optionalExtensions' in args) {
            optionalExtensions = parseExtensions(args.optionalExtensions);
          }
          if ('onDone' in args) {
            check$1.type(
              args.onDone, 'function',
              'invalid or missing onDone callback');
            onDone = args.onDone;
          }
          if ('profile' in args) {
            profile = !!args.profile;
          }
          if ('pixelRatio' in args) {
            pixelRatio = +args.pixelRatio;
            check$1(pixelRatio > 0, 'invalid pixel ratio');
          }
        }
      } else {
        check$1.raise('invalid arguments to regl');
      }

      if (element) {
        if (element.nodeName.toLowerCase() === 'canvas') {
          canvas = element;
        } else {
          container = element;
        }
      }

      if (!gl) {
        if (!canvas) {
          check$1(
            typeof document !== 'undefined',
            'must manually specify webgl context outside of DOM environments');
          var result = createCanvas(container || document.body, onDone, pixelRatio);
          if (!result) {
            return null
          }
          canvas = result.canvas;
          onDestroy = result.onDestroy;
        }
        // workaround for chromium bug, premultiplied alpha value is platform dependent
        contextAttributes.premultipliedAlpha = contextAttributes.premultipliedAlpha || false;
        gl = createContext(canvas, contextAttributes);
      }

      if (!gl) {
        onDestroy();
        onDone('webgl not supported, try upgrading your browser or graphics drivers http://get.webgl.org');
        return null
      }

      return {
        gl: gl,
        canvas: canvas,
        container: container,
        extensions: extensions,
        optionalExtensions: optionalExtensions,
        pixelRatio: pixelRatio,
        profile: profile,
        onDone: onDone,
        onDestroy: onDestroy
      }
    }

    function createExtensionCache (gl, config) {
      var extensions = {};

      function tryLoadExtension (name_) {
        check$1.type(name_, 'string', 'extension name must be string');
        var name = name_.toLowerCase();
        var ext;
        try {
          ext = extensions[name] = gl.getExtension(name);
        } catch (e) {}
        return !!ext
      }

      for (var i = 0; i < config.extensions.length; ++i) {
        var name = config.extensions[i];
        if (!tryLoadExtension(name)) {
          config.onDestroy();
          config.onDone('"' + name + '" extension is not supported by the current WebGL context, try upgrading your system or a different browser');
          return null
        }
      }

      config.optionalExtensions.forEach(tryLoadExtension);

      return {
        extensions: extensions,
        restore: function () {
          Object.keys(extensions).forEach(function (name) {
            if (extensions[name] && !tryLoadExtension(name)) {
              throw new Error('(regl): error restoring extension ' + name)
            }
          });
        }
      }
    }

    function loop (n, f) {
      var result = Array(n);
      for (var i = 0; i < n; ++i) {
        result[i] = f(i);
      }
      return result
    }

    var GL_BYTE$1 = 5120;
    var GL_UNSIGNED_BYTE$2 = 5121;
    var GL_SHORT$1 = 5122;
    var GL_UNSIGNED_SHORT$1 = 5123;
    var GL_INT$1 = 5124;
    var GL_UNSIGNED_INT$1 = 5125;
    var GL_FLOAT$2 = 5126;

    function nextPow16 (v) {
      for (var i = 16; i <= (1 << 28); i *= 16) {
        if (v <= i) {
          return i
        }
      }
      return 0
    }

    function log2 (v) {
      var r, shift;
      r = (v > 0xFFFF) << 4;
      v >>>= r;
      shift = (v > 0xFF) << 3;
      v >>>= shift; r |= shift;
      shift = (v > 0xF) << 2;
      v >>>= shift; r |= shift;
      shift = (v > 0x3) << 1;
      v >>>= shift; r |= shift;
      return r | (v >> 1)
    }

    function createPool () {
      var bufferPool = loop(8, function () {
        return []
      });

      function alloc (n) {
        var sz = nextPow16(n);
        var bin = bufferPool[log2(sz) >> 2];
        if (bin.length > 0) {
          return bin.pop()
        }
        return new ArrayBuffer(sz)
      }

      function free (buf) {
        bufferPool[log2(buf.byteLength) >> 2].push(buf);
      }

      function allocType (type, n) {
        var result = null;
        switch (type) {
          case GL_BYTE$1:
            result = new Int8Array(alloc(n), 0, n);
            break
          case GL_UNSIGNED_BYTE$2:
            result = new Uint8Array(alloc(n), 0, n);
            break
          case GL_SHORT$1:
            result = new Int16Array(alloc(2 * n), 0, n);
            break
          case GL_UNSIGNED_SHORT$1:
            result = new Uint16Array(alloc(2 * n), 0, n);
            break
          case GL_INT$1:
            result = new Int32Array(alloc(4 * n), 0, n);
            break
          case GL_UNSIGNED_INT$1:
            result = new Uint32Array(alloc(4 * n), 0, n);
            break
          case GL_FLOAT$2:
            result = new Float32Array(alloc(4 * n), 0, n);
            break
          default:
            return null
        }
        if (result.length !== n) {
          return result.subarray(0, n)
        }
        return result
      }

      function freeType (array) {
        free(array.buffer);
      }

      return {
        alloc: alloc,
        free: free,
        allocType: allocType,
        freeType: freeType
      }
    }

    var pool = createPool();

    // zero pool for initial zero data
    pool.zero = createPool();

    var GL_SUBPIXEL_BITS = 0x0D50;
    var GL_RED_BITS = 0x0D52;
    var GL_GREEN_BITS = 0x0D53;
    var GL_BLUE_BITS = 0x0D54;
    var GL_ALPHA_BITS = 0x0D55;
    var GL_DEPTH_BITS = 0x0D56;
    var GL_STENCIL_BITS = 0x0D57;

    var GL_ALIASED_POINT_SIZE_RANGE = 0x846D;
    var GL_ALIASED_LINE_WIDTH_RANGE = 0x846E;

    var GL_MAX_TEXTURE_SIZE = 0x0D33;
    var GL_MAX_VIEWPORT_DIMS = 0x0D3A;
    var GL_MAX_VERTEX_ATTRIBS = 0x8869;
    var GL_MAX_VERTEX_UNIFORM_VECTORS = 0x8DFB;
    var GL_MAX_VARYING_VECTORS = 0x8DFC;
    var GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS = 0x8B4D;
    var GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS = 0x8B4C;
    var GL_MAX_TEXTURE_IMAGE_UNITS = 0x8872;
    var GL_MAX_FRAGMENT_UNIFORM_VECTORS = 0x8DFD;
    var GL_MAX_CUBE_MAP_TEXTURE_SIZE = 0x851C;
    var GL_MAX_RENDERBUFFER_SIZE = 0x84E8;

    var GL_VENDOR = 0x1F00;
    var GL_RENDERER = 0x1F01;
    var GL_VERSION = 0x1F02;
    var GL_SHADING_LANGUAGE_VERSION = 0x8B8C;

    var GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT = 0x84FF;

    var GL_MAX_COLOR_ATTACHMENTS_WEBGL = 0x8CDF;
    var GL_MAX_DRAW_BUFFERS_WEBGL = 0x8824;

    var GL_TEXTURE_2D = 0x0DE1;
    var GL_TEXTURE_CUBE_MAP = 0x8513;
    var GL_TEXTURE_CUBE_MAP_POSITIVE_X = 0x8515;
    var GL_TEXTURE0 = 0x84C0;
    var GL_RGBA = 0x1908;
    var GL_FLOAT$1 = 0x1406;
    var GL_UNSIGNED_BYTE$1 = 0x1401;
    var GL_FRAMEBUFFER = 0x8D40;
    var GL_FRAMEBUFFER_COMPLETE = 0x8CD5;
    var GL_COLOR_ATTACHMENT0 = 0x8CE0;
    var GL_COLOR_BUFFER_BIT$1 = 0x4000;

    var wrapLimits = function (gl, extensions) {
      var maxAnisotropic = 1;
      if (extensions.ext_texture_filter_anisotropic) {
        maxAnisotropic = gl.getParameter(GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT);
      }

      var maxDrawbuffers = 1;
      var maxColorAttachments = 1;
      if (extensions.webgl_draw_buffers) {
        maxDrawbuffers = gl.getParameter(GL_MAX_DRAW_BUFFERS_WEBGL);
        maxColorAttachments = gl.getParameter(GL_MAX_COLOR_ATTACHMENTS_WEBGL);
      }

      // detect if reading float textures is available (Safari doesn't support)
      var readFloat = !!extensions.oes_texture_float;
      if (readFloat) {
        var readFloatTexture = gl.createTexture();
        gl.bindTexture(GL_TEXTURE_2D, readFloatTexture);
        gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, 1, 1, 0, GL_RGBA, GL_FLOAT$1, null);

        var fbo = gl.createFramebuffer();
        gl.bindFramebuffer(GL_FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, readFloatTexture, 0);
        gl.bindTexture(GL_TEXTURE_2D, null);

        if (gl.checkFramebufferStatus(GL_FRAMEBUFFER) !== GL_FRAMEBUFFER_COMPLETE) readFloat = false;

        else {
          gl.viewport(0, 0, 1, 1);
          gl.clearColor(1.0, 0.0, 0.0, 1.0);
          gl.clear(GL_COLOR_BUFFER_BIT$1);
          var pixels = pool.allocType(GL_FLOAT$1, 4);
          gl.readPixels(0, 0, 1, 1, GL_RGBA, GL_FLOAT$1, pixels);

          if (gl.getError()) readFloat = false;
          else {
            gl.deleteFramebuffer(fbo);
            gl.deleteTexture(readFloatTexture);

            readFloat = pixels[0] === 1.0;
          }

          pool.freeType(pixels);
        }
      }

      // detect non power of two cube textures support (IE doesn't support)
      var isIE = typeof navigator !== 'undefined' && (/MSIE/.test(navigator.userAgent) || /Trident\//.test(navigator.appVersion) || /Edge/.test(navigator.userAgent));

      var npotTextureCube = true;

      if (!isIE) {
        var cubeTexture = gl.createTexture();
        var data = pool.allocType(GL_UNSIGNED_BYTE$1, 36);
        gl.activeTexture(GL_TEXTURE0);
        gl.bindTexture(GL_TEXTURE_CUBE_MAP, cubeTexture);
        gl.texImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X, 0, GL_RGBA, 3, 3, 0, GL_RGBA, GL_UNSIGNED_BYTE$1, data);
        pool.freeType(data);
        gl.bindTexture(GL_TEXTURE_CUBE_MAP, null);
        gl.deleteTexture(cubeTexture);
        npotTextureCube = !gl.getError();
      }

      return {
        // drawing buffer bit depth
        colorBits: [
          gl.getParameter(GL_RED_BITS),
          gl.getParameter(GL_GREEN_BITS),
          gl.getParameter(GL_BLUE_BITS),
          gl.getParameter(GL_ALPHA_BITS)
        ],
        depthBits: gl.getParameter(GL_DEPTH_BITS),
        stencilBits: gl.getParameter(GL_STENCIL_BITS),
        subpixelBits: gl.getParameter(GL_SUBPIXEL_BITS),

        // supported extensions
        extensions: Object.keys(extensions).filter(function (ext) {
          return !!extensions[ext]
        }),

        // max aniso samples
        maxAnisotropic: maxAnisotropic,

        // max draw buffers
        maxDrawbuffers: maxDrawbuffers,
        maxColorAttachments: maxColorAttachments,

        // point and line size ranges
        pointSizeDims: gl.getParameter(GL_ALIASED_POINT_SIZE_RANGE),
        lineWidthDims: gl.getParameter(GL_ALIASED_LINE_WIDTH_RANGE),
        maxViewportDims: gl.getParameter(GL_MAX_VIEWPORT_DIMS),
        maxCombinedTextureUnits: gl.getParameter(GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS),
        maxCubeMapSize: gl.getParameter(GL_MAX_CUBE_MAP_TEXTURE_SIZE),
        maxRenderbufferSize: gl.getParameter(GL_MAX_RENDERBUFFER_SIZE),
        maxTextureUnits: gl.getParameter(GL_MAX_TEXTURE_IMAGE_UNITS),
        maxTextureSize: gl.getParameter(GL_MAX_TEXTURE_SIZE),
        maxAttributes: gl.getParameter(GL_MAX_VERTEX_ATTRIBS),
        maxVertexUniforms: gl.getParameter(GL_MAX_VERTEX_UNIFORM_VECTORS),
        maxVertexTextureUnits: gl.getParameter(GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS),
        maxVaryingVectors: gl.getParameter(GL_MAX_VARYING_VECTORS),
        maxFragmentUniforms: gl.getParameter(GL_MAX_FRAGMENT_UNIFORM_VECTORS),

        // vendor info
        glsl: gl.getParameter(GL_SHADING_LANGUAGE_VERSION),
        renderer: gl.getParameter(GL_RENDERER),
        vendor: gl.getParameter(GL_VENDOR),
        version: gl.getParameter(GL_VERSION),

        // quirks
        readFloat: readFloat,
        npotTextureCube: npotTextureCube
      }
    };

    function isNDArrayLike (obj) {
      return (
        !!obj &&
        typeof obj === 'object' &&
        Array.isArray(obj.shape) &&
        Array.isArray(obj.stride) &&
        typeof obj.offset === 'number' &&
        obj.shape.length === obj.stride.length &&
        (Array.isArray(obj.data) ||
          isTypedArray(obj.data)))
    }

    var values = function (obj) {
      return Object.keys(obj).map(function (key) { return obj[key] })
    };

    var flattenUtils = {
      shape: arrayShape$1,
      flatten: flattenArray
    };

    function flatten1D (array, nx, out) {
      for (var i = 0; i < nx; ++i) {
        out[i] = array[i];
      }
    }

    function flatten2D (array, nx, ny, out) {
      var ptr = 0;
      for (var i = 0; i < nx; ++i) {
        var row = array[i];
        for (var j = 0; j < ny; ++j) {
          out[ptr++] = row[j];
        }
      }
    }

    function flatten3D (array, nx, ny, nz, out, ptr_) {
      var ptr = ptr_;
      for (var i = 0; i < nx; ++i) {
        var row = array[i];
        for (var j = 0; j < ny; ++j) {
          var col = row[j];
          for (var k = 0; k < nz; ++k) {
            out[ptr++] = col[k];
          }
        }
      }
    }

    function flattenRec (array, shape, level, out, ptr) {
      var stride = 1;
      for (var i = level + 1; i < shape.length; ++i) {
        stride *= shape[i];
      }
      var n = shape[level];
      if (shape.length - level === 4) {
        var nx = shape[level + 1];
        var ny = shape[level + 2];
        var nz = shape[level + 3];
        for (i = 0; i < n; ++i) {
          flatten3D(array[i], nx, ny, nz, out, ptr);
          ptr += stride;
        }
      } else {
        for (i = 0; i < n; ++i) {
          flattenRec(array[i], shape, level + 1, out, ptr);
          ptr += stride;
        }
      }
    }

    function flattenArray (array, shape, type, out_) {
      var sz = 1;
      if (shape.length) {
        for (var i = 0; i < shape.length; ++i) {
          sz *= shape[i];
        }
      } else {
        sz = 0;
      }
      var out = out_ || pool.allocType(type, sz);
      switch (shape.length) {
        case 0:
          break
        case 1:
          flatten1D(array, shape[0], out);
          break
        case 2:
          flatten2D(array, shape[0], shape[1], out);
          break
        case 3:
          flatten3D(array, shape[0], shape[1], shape[2], out, 0);
          break
        default:
          flattenRec(array, shape, 0, out, 0);
      }
      return out
    }

    function arrayShape$1 (array_) {
      var shape = [];
      for (var array = array_; array.length; array = array[0]) {
        shape.push(array.length);
      }
      return shape
    }

    var arrayTypes =  {
    	"[object Int8Array]": 5120,
    	"[object Int16Array]": 5122,
    	"[object Int32Array]": 5124,
    	"[object Uint8Array]": 5121,
    	"[object Uint8ClampedArray]": 5121,
    	"[object Uint16Array]": 5123,
    	"[object Uint32Array]": 5125,
    	"[object Float32Array]": 5126,
    	"[object Float64Array]": 5121,
    	"[object ArrayBuffer]": 5121
    };

    var int8 = 5120;
    var int16 = 5122;
    var int32 = 5124;
    var uint8 = 5121;
    var uint16 = 5123;
    var uint32 = 5125;
    var float = 5126;
    var float32 = 5126;
    var glTypes = {
    	int8: int8,
    	int16: int16,
    	int32: int32,
    	uint8: uint8,
    	uint16: uint16,
    	uint32: uint32,
    	float: float,
    	float32: float32
    };

    var dynamic$1 = 35048;
    var stream = 35040;
    var usageTypes = {
    	dynamic: dynamic$1,
    	stream: stream,
    	"static": 35044
    };

    var arrayFlatten = flattenUtils.flatten;
    var arrayShape = flattenUtils.shape;

    var GL_STATIC_DRAW = 0x88E4;
    var GL_STREAM_DRAW = 0x88E0;

    var GL_UNSIGNED_BYTE$3 = 5121;
    var GL_FLOAT$3 = 5126;

    var DTYPES_SIZES = [];
    DTYPES_SIZES[5120] = 1; // int8
    DTYPES_SIZES[5122] = 2; // int16
    DTYPES_SIZES[5124] = 4; // int32
    DTYPES_SIZES[5121] = 1; // uint8
    DTYPES_SIZES[5123] = 2; // uint16
    DTYPES_SIZES[5125] = 4; // uint32
    DTYPES_SIZES[5126] = 4; // float32

    function typedArrayCode (data) {
      return arrayTypes[Object.prototype.toString.call(data)] | 0
    }

    function copyArray (out, inp) {
      for (var i = 0; i < inp.length; ++i) {
        out[i] = inp[i];
      }
    }

    function transpose (
      result, data, shapeX, shapeY, strideX, strideY, offset) {
      var ptr = 0;
      for (var i = 0; i < shapeX; ++i) {
        for (var j = 0; j < shapeY; ++j) {
          result[ptr++] = data[strideX * i + strideY * j + offset];
        }
      }
    }

    function wrapBufferState (gl, stats, config, destroyBuffer) {
      var bufferCount = 0;
      var bufferSet = {};

      function REGLBuffer (type) {
        this.id = bufferCount++;
        this.buffer = gl.createBuffer();
        this.type = type;
        this.usage = GL_STATIC_DRAW;
        this.byteLength = 0;
        this.dimension = 1;
        this.dtype = GL_UNSIGNED_BYTE$3;

        this.persistentData = null;

        if (config.profile) {
          this.stats = { size: 0 };
        }
      }

      REGLBuffer.prototype.bind = function () {
        gl.bindBuffer(this.type, this.buffer);
      };

      REGLBuffer.prototype.destroy = function () {
        destroy(this);
      };

      var streamPool = [];

      function createStream (type, data) {
        var buffer = streamPool.pop();
        if (!buffer) {
          buffer = new REGLBuffer(type);
        }
        buffer.bind();
        initBufferFromData(buffer, data, GL_STREAM_DRAW, 0, 1, false);
        return buffer
      }

      function destroyStream (stream$$1) {
        streamPool.push(stream$$1);
      }

      function initBufferFromTypedArray (buffer, data, usage) {
        buffer.byteLength = data.byteLength;
        gl.bufferData(buffer.type, data, usage);
      }

      function initBufferFromData (buffer, data, usage, dtype, dimension, persist) {
        var shape;
        buffer.usage = usage;
        if (Array.isArray(data)) {
          buffer.dtype = dtype || GL_FLOAT$3;
          if (data.length > 0) {
            var flatData;
            if (Array.isArray(data[0])) {
              shape = arrayShape(data);
              var dim = 1;
              for (var i = 1; i < shape.length; ++i) {
                dim *= shape[i];
              }
              buffer.dimension = dim;
              flatData = arrayFlatten(data, shape, buffer.dtype);
              initBufferFromTypedArray(buffer, flatData, usage);
              if (persist) {
                buffer.persistentData = flatData;
              } else {
                pool.freeType(flatData);
              }
            } else if (typeof data[0] === 'number') {
              buffer.dimension = dimension;
              var typedData = pool.allocType(buffer.dtype, data.length);
              copyArray(typedData, data);
              initBufferFromTypedArray(buffer, typedData, usage);
              if (persist) {
                buffer.persistentData = typedData;
              } else {
                pool.freeType(typedData);
              }
            } else if (isTypedArray(data[0])) {
              buffer.dimension = data[0].length;
              buffer.dtype = dtype || typedArrayCode(data[0]) || GL_FLOAT$3;
              flatData = arrayFlatten(
                data,
                [data.length, data[0].length],
                buffer.dtype);
              initBufferFromTypedArray(buffer, flatData, usage);
              if (persist) {
                buffer.persistentData = flatData;
              } else {
                pool.freeType(flatData);
              }
            } else {
              check$1.raise('invalid buffer data');
            }
          }
        } else if (isTypedArray(data)) {
          buffer.dtype = dtype || typedArrayCode(data);
          buffer.dimension = dimension;
          initBufferFromTypedArray(buffer, data, usage);
          if (persist) {
            buffer.persistentData = new Uint8Array(new Uint8Array(data.buffer));
          }
        } else if (isNDArrayLike(data)) {
          shape = data.shape;
          var stride = data.stride;
          var offset = data.offset;

          var shapeX = 0;
          var shapeY = 0;
          var strideX = 0;
          var strideY = 0;
          if (shape.length === 1) {
            shapeX = shape[0];
            shapeY = 1;
            strideX = stride[0];
            strideY = 0;
          } else if (shape.length === 2) {
            shapeX = shape[0];
            shapeY = shape[1];
            strideX = stride[0];
            strideY = stride[1];
          } else {
            check$1.raise('invalid shape');
          }

          buffer.dtype = dtype || typedArrayCode(data.data) || GL_FLOAT$3;
          buffer.dimension = shapeY;

          var transposeData = pool.allocType(buffer.dtype, shapeX * shapeY);
          transpose(transposeData,
            data.data,
            shapeX, shapeY,
            strideX, strideY,
            offset);
          initBufferFromTypedArray(buffer, transposeData, usage);
          if (persist) {
            buffer.persistentData = transposeData;
          } else {
            pool.freeType(transposeData);
          }
        } else if (data instanceof ArrayBuffer) {
          buffer.dtype = GL_UNSIGNED_BYTE$3;
          buffer.dimension = dimension;
          initBufferFromTypedArray(buffer, data, usage);
          if (persist) {
            buffer.persistentData = new Uint8Array(new Uint8Array(data));
          }
        } else {
          check$1.raise('invalid buffer data');
        }
      }

      function destroy (buffer) {
        stats.bufferCount--;

        // remove attribute link
        destroyBuffer(buffer);

        var handle = buffer.buffer;
        check$1(handle, 'buffer must not be deleted already');
        gl.deleteBuffer(handle);
        buffer.buffer = null;
        delete bufferSet[buffer.id];
      }

      function createBuffer (options, type, deferInit, persistent) {
        stats.bufferCount++;

        var buffer = new REGLBuffer(type);
        bufferSet[buffer.id] = buffer;

        function reglBuffer (options) {
          var usage = GL_STATIC_DRAW;
          var data = null;
          var byteLength = 0;
          var dtype = 0;
          var dimension = 1;
          if (Array.isArray(options) ||
              isTypedArray(options) ||
              isNDArrayLike(options) ||
              options instanceof ArrayBuffer) {
            data = options;
          } else if (typeof options === 'number') {
            byteLength = options | 0;
          } else if (options) {
            check$1.type(
              options, 'object',
              'buffer arguments must be an object, a number or an array');

            if ('data' in options) {
              check$1(
                data === null ||
                Array.isArray(data) ||
                isTypedArray(data) ||
                isNDArrayLike(data),
                'invalid data for buffer');
              data = options.data;
            }

            if ('usage' in options) {
              check$1.parameter(options.usage, usageTypes, 'invalid buffer usage');
              usage = usageTypes[options.usage];
            }

            if ('type' in options) {
              check$1.parameter(options.type, glTypes, 'invalid buffer type');
              dtype = glTypes[options.type];
            }

            if ('dimension' in options) {
              check$1.type(options.dimension, 'number', 'invalid dimension');
              dimension = options.dimension | 0;
            }

            if ('length' in options) {
              check$1.nni(byteLength, 'buffer length must be a nonnegative integer');
              byteLength = options.length | 0;
            }
          }

          buffer.bind();
          if (!data) {
            // #475
            if (byteLength) gl.bufferData(buffer.type, byteLength, usage);
            buffer.dtype = dtype || GL_UNSIGNED_BYTE$3;
            buffer.usage = usage;
            buffer.dimension = dimension;
            buffer.byteLength = byteLength;
          } else {
            initBufferFromData(buffer, data, usage, dtype, dimension, persistent);
          }

          if (config.profile) {
            buffer.stats.size = buffer.byteLength * DTYPES_SIZES[buffer.dtype];
          }

          return reglBuffer
        }

        function setSubData (data, offset) {
          check$1(offset + data.byteLength <= buffer.byteLength,
            'invalid buffer subdata call, buffer is too small. ' + ' Can\'t write data of size ' + data.byteLength + ' starting from offset ' + offset + ' to a buffer of size ' + buffer.byteLength);

          gl.bufferSubData(buffer.type, offset, data);
        }

        function subdata (data, offset_) {
          var offset = (offset_ || 0) | 0;
          var shape;
          buffer.bind();
          if (isTypedArray(data) || data instanceof ArrayBuffer) {
            setSubData(data, offset);
          } else if (Array.isArray(data)) {
            if (data.length > 0) {
              if (typeof data[0] === 'number') {
                var converted = pool.allocType(buffer.dtype, data.length);
                copyArray(converted, data);
                setSubData(converted, offset);
                pool.freeType(converted);
              } else if (Array.isArray(data[0]) || isTypedArray(data[0])) {
                shape = arrayShape(data);
                var flatData = arrayFlatten(data, shape, buffer.dtype);
                setSubData(flatData, offset);
                pool.freeType(flatData);
              } else {
                check$1.raise('invalid buffer data');
              }
            }
          } else if (isNDArrayLike(data)) {
            shape = data.shape;
            var stride = data.stride;

            var shapeX = 0;
            var shapeY = 0;
            var strideX = 0;
            var strideY = 0;
            if (shape.length === 1) {
              shapeX = shape[0];
              shapeY = 1;
              strideX = stride[0];
              strideY = 0;
            } else if (shape.length === 2) {
              shapeX = shape[0];
              shapeY = shape[1];
              strideX = stride[0];
              strideY = stride[1];
            } else {
              check$1.raise('invalid shape');
            }
            var dtype = Array.isArray(data.data)
              ? buffer.dtype
              : typedArrayCode(data.data);

            var transposeData = pool.allocType(dtype, shapeX * shapeY);
            transpose(transposeData,
              data.data,
              shapeX, shapeY,
              strideX, strideY,
              data.offset);
            setSubData(transposeData, offset);
            pool.freeType(transposeData);
          } else {
            check$1.raise('invalid data for buffer subdata');
          }
          return reglBuffer
        }

        if (!deferInit) {
          reglBuffer(options);
        }

        reglBuffer._reglType = 'buffer';
        reglBuffer._buffer = buffer;
        reglBuffer.subdata = subdata;
        if (config.profile) {
          reglBuffer.stats = buffer.stats;
        }
        reglBuffer.destroy = function () { destroy(buffer); };

        return reglBuffer
      }

      function restoreBuffers () {
        values(bufferSet).forEach(function (buffer) {
          buffer.buffer = gl.createBuffer();
          gl.bindBuffer(buffer.type, buffer.buffer);
          gl.bufferData(
            buffer.type, buffer.persistentData || buffer.byteLength, buffer.usage);
        });
      }

      if (config.profile) {
        stats.getTotalBufferSize = function () {
          var total = 0;
          // TODO: Right now, the streams are not part of the total count.
          Object.keys(bufferSet).forEach(function (key) {
            total += bufferSet[key].stats.size;
          });
          return total
        };
      }

      return {
        create: createBuffer,

        createStream: createStream,
        destroyStream: destroyStream,

        clear: function () {
          values(bufferSet).forEach(destroy);
          streamPool.forEach(destroy);
        },

        getBuffer: function (wrapper) {
          if (wrapper && wrapper._buffer instanceof REGLBuffer) {
            return wrapper._buffer
          }
          return null
        },

        restore: restoreBuffers,

        _initBuffer: initBufferFromData
      }
    }

    var points = 0;
    var point = 0;
    var lines = 1;
    var line = 1;
    var triangles = 4;
    var triangle = 4;
    var primTypes = {
    	points: points,
    	point: point,
    	lines: lines,
    	line: line,
    	triangles: triangles,
    	triangle: triangle,
    	"line loop": 2,
    	"line strip": 3,
    	"triangle strip": 5,
    	"triangle fan": 6
    };

    var GL_POINTS = 0;
    var GL_LINES = 1;
    var GL_TRIANGLES = 4;

    var GL_BYTE$2 = 5120;
    var GL_UNSIGNED_BYTE$4 = 5121;
    var GL_SHORT$2 = 5122;
    var GL_UNSIGNED_SHORT$2 = 5123;
    var GL_INT$2 = 5124;
    var GL_UNSIGNED_INT$2 = 5125;

    var GL_ELEMENT_ARRAY_BUFFER = 34963;

    var GL_STREAM_DRAW$1 = 0x88E0;
    var GL_STATIC_DRAW$1 = 0x88E4;

    function wrapElementsState (gl, extensions, bufferState, stats) {
      var elementSet = {};
      var elementCount = 0;

      var elementTypes = {
        'uint8': GL_UNSIGNED_BYTE$4,
        'uint16': GL_UNSIGNED_SHORT$2
      };

      if (extensions.oes_element_index_uint) {
        elementTypes.uint32 = GL_UNSIGNED_INT$2;
      }

      function REGLElementBuffer (buffer) {
        this.id = elementCount++;
        elementSet[this.id] = this;
        this.buffer = buffer;
        this.primType = GL_TRIANGLES;
        this.vertCount = 0;
        this.type = 0;
      }

      REGLElementBuffer.prototype.bind = function () {
        this.buffer.bind();
      };

      var bufferPool = [];

      function createElementStream (data) {
        var result = bufferPool.pop();
        if (!result) {
          result = new REGLElementBuffer(bufferState.create(
            null,
            GL_ELEMENT_ARRAY_BUFFER,
            true,
            false)._buffer);
        }
        initElements(result, data, GL_STREAM_DRAW$1, -1, -1, 0, 0);
        return result
      }

      function destroyElementStream (elements) {
        bufferPool.push(elements);
      }

      function initElements (
        elements,
        data,
        usage,
        prim,
        count,
        byteLength,
        type) {
        elements.buffer.bind();
        var dtype;
        if (data) {
          var predictedType = type;
          if (!type && (
            !isTypedArray(data) ||
             (isNDArrayLike(data) && !isTypedArray(data.data)))) {
            predictedType = extensions.oes_element_index_uint
              ? GL_UNSIGNED_INT$2
              : GL_UNSIGNED_SHORT$2;
          }
          bufferState._initBuffer(
            elements.buffer,
            data,
            usage,
            predictedType,
            3);
        } else {
          gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, byteLength, usage);
          elements.buffer.dtype = dtype || GL_UNSIGNED_BYTE$4;
          elements.buffer.usage = usage;
          elements.buffer.dimension = 3;
          elements.buffer.byteLength = byteLength;
        }

        dtype = type;
        if (!type) {
          switch (elements.buffer.dtype) {
            case GL_UNSIGNED_BYTE$4:
            case GL_BYTE$2:
              dtype = GL_UNSIGNED_BYTE$4;
              break

            case GL_UNSIGNED_SHORT$2:
            case GL_SHORT$2:
              dtype = GL_UNSIGNED_SHORT$2;
              break

            case GL_UNSIGNED_INT$2:
            case GL_INT$2:
              dtype = GL_UNSIGNED_INT$2;
              break

            default:
              check$1.raise('unsupported type for element array');
          }
          elements.buffer.dtype = dtype;
        }
        elements.type = dtype;

        // Check oes_element_index_uint extension
        check$1(
          dtype !== GL_UNSIGNED_INT$2 ||
          !!extensions.oes_element_index_uint,
          '32 bit element buffers not supported, enable oes_element_index_uint first');

        // try to guess default primitive type and arguments
        var vertCount = count;
        if (vertCount < 0) {
          vertCount = elements.buffer.byteLength;
          if (dtype === GL_UNSIGNED_SHORT$2) {
            vertCount >>= 1;
          } else if (dtype === GL_UNSIGNED_INT$2) {
            vertCount >>= 2;
          }
        }
        elements.vertCount = vertCount;

        // try to guess primitive type from cell dimension
        var primType = prim;
        if (prim < 0) {
          primType = GL_TRIANGLES;
          var dimension = elements.buffer.dimension;
          if (dimension === 1) primType = GL_POINTS;
          if (dimension === 2) primType = GL_LINES;
          if (dimension === 3) primType = GL_TRIANGLES;
        }
        elements.primType = primType;
      }

      function destroyElements (elements) {
        stats.elementsCount--;

        check$1(elements.buffer !== null, 'must not double destroy elements');
        delete elementSet[elements.id];
        elements.buffer.destroy();
        elements.buffer = null;
      }

      function createElements (options, persistent) {
        var buffer = bufferState.create(null, GL_ELEMENT_ARRAY_BUFFER, true);
        var elements = new REGLElementBuffer(buffer._buffer);
        stats.elementsCount++;

        function reglElements (options) {
          if (!options) {
            buffer();
            elements.primType = GL_TRIANGLES;
            elements.vertCount = 0;
            elements.type = GL_UNSIGNED_BYTE$4;
          } else if (typeof options === 'number') {
            buffer(options);
            elements.primType = GL_TRIANGLES;
            elements.vertCount = options | 0;
            elements.type = GL_UNSIGNED_BYTE$4;
          } else {
            var data = null;
            var usage = GL_STATIC_DRAW$1;
            var primType = -1;
            var vertCount = -1;
            var byteLength = 0;
            var dtype = 0;
            if (Array.isArray(options) ||
                isTypedArray(options) ||
                isNDArrayLike(options)) {
              data = options;
            } else {
              check$1.type(options, 'object', 'invalid arguments for elements');
              if ('data' in options) {
                data = options.data;
                check$1(
                  Array.isArray(data) ||
                    isTypedArray(data) ||
                    isNDArrayLike(data),
                  'invalid data for element buffer');
              }
              if ('usage' in options) {
                check$1.parameter(
                  options.usage,
                  usageTypes,
                  'invalid element buffer usage');
                usage = usageTypes[options.usage];
              }
              if ('primitive' in options) {
                check$1.parameter(
                  options.primitive,
                  primTypes,
                  'invalid element buffer primitive');
                primType = primTypes[options.primitive];
              }
              if ('count' in options) {
                check$1(
                  typeof options.count === 'number' && options.count >= 0,
                  'invalid vertex count for elements');
                vertCount = options.count | 0;
              }
              if ('type' in options) {
                check$1.parameter(
                  options.type,
                  elementTypes,
                  'invalid buffer type');
                dtype = elementTypes[options.type];
              }
              if ('length' in options) {
                byteLength = options.length | 0;
              } else {
                byteLength = vertCount;
                if (dtype === GL_UNSIGNED_SHORT$2 || dtype === GL_SHORT$2) {
                  byteLength *= 2;
                } else if (dtype === GL_UNSIGNED_INT$2 || dtype === GL_INT$2) {
                  byteLength *= 4;
                }
              }
            }
            initElements(
              elements,
              data,
              usage,
              primType,
              vertCount,
              byteLength,
              dtype);
          }

          return reglElements
        }

        reglElements(options);

        reglElements._reglType = 'elements';
        reglElements._elements = elements;
        reglElements.subdata = function (data, offset) {
          buffer.subdata(data, offset);
          return reglElements
        };
        reglElements.destroy = function () {
          destroyElements(elements);
        };

        return reglElements
      }

      return {
        create: createElements,
        createStream: createElementStream,
        destroyStream: destroyElementStream,
        getElements: function (elements) {
          if (typeof elements === 'function' &&
              elements._elements instanceof REGLElementBuffer) {
            return elements._elements
          }
          return null
        },
        clear: function () {
          values(elementSet).forEach(destroyElements);
        }
      }
    }

    var FLOAT = new Float32Array(1);
    var INT = new Uint32Array(FLOAT.buffer);

    var GL_UNSIGNED_SHORT$4 = 5123;

    function convertToHalfFloat (array) {
      var ushorts = pool.allocType(GL_UNSIGNED_SHORT$4, array.length);

      for (var i = 0; i < array.length; ++i) {
        if (isNaN(array[i])) {
          ushorts[i] = 0xffff;
        } else if (array[i] === Infinity) {
          ushorts[i] = 0x7c00;
        } else if (array[i] === -Infinity) {
          ushorts[i] = 0xfc00;
        } else {
          FLOAT[0] = array[i];
          var x = INT[0];

          var sgn = (x >>> 31) << 15;
          var exp = ((x << 1) >>> 24) - 127;
          var frac = (x >> 13) & ((1 << 10) - 1);

          if (exp < -24) {
            // round non-representable denormals to 0
            ushorts[i] = sgn;
          } else if (exp < -14) {
            // handle denormals
            var s = -14 - exp;
            ushorts[i] = sgn + ((frac + (1 << 10)) >> s);
          } else if (exp > 15) {
            // round overflow to +/- Infinity
            ushorts[i] = sgn + 0x7c00;
          } else {
            // otherwise convert directly
            ushorts[i] = sgn + ((exp + 15) << 10) + frac;
          }
        }
      }

      return ushorts
    }

    function isArrayLike (s) {
      return Array.isArray(s) || isTypedArray(s)
    }

    var isPow2$1 = function (v) {
      return !(v & (v - 1)) && (!!v)
    };

    var GL_COMPRESSED_TEXTURE_FORMATS = 0x86A3;

    var GL_TEXTURE_2D$1 = 0x0DE1;
    var GL_TEXTURE_CUBE_MAP$1 = 0x8513;
    var GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 = 0x8515;

    var GL_RGBA$1 = 0x1908;
    var GL_ALPHA = 0x1906;
    var GL_RGB = 0x1907;
    var GL_LUMINANCE = 0x1909;
    var GL_LUMINANCE_ALPHA = 0x190A;

    var GL_RGBA4 = 0x8056;
    var GL_RGB5_A1 = 0x8057;
    var GL_RGB565 = 0x8D62;

    var GL_UNSIGNED_SHORT_4_4_4_4$1 = 0x8033;
    var GL_UNSIGNED_SHORT_5_5_5_1$1 = 0x8034;
    var GL_UNSIGNED_SHORT_5_6_5$1 = 0x8363;
    var GL_UNSIGNED_INT_24_8_WEBGL$1 = 0x84FA;

    var GL_DEPTH_COMPONENT = 0x1902;
    var GL_DEPTH_STENCIL = 0x84F9;

    var GL_SRGB_EXT = 0x8C40;
    var GL_SRGB_ALPHA_EXT = 0x8C42;

    var GL_HALF_FLOAT_OES$1 = 0x8D61;

    var GL_COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83F0;
    var GL_COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83F1;
    var GL_COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83F2;
    var GL_COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;

    var GL_COMPRESSED_RGB_ATC_WEBGL = 0x8C92;
    var GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL = 0x8C93;
    var GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL = 0x87EE;

    var GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8C00;
    var GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG = 0x8C01;
    var GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8C02;
    var GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = 0x8C03;

    var GL_COMPRESSED_RGB_ETC1_WEBGL = 0x8D64;

    var GL_UNSIGNED_BYTE$5 = 0x1401;
    var GL_UNSIGNED_SHORT$3 = 0x1403;
    var GL_UNSIGNED_INT$3 = 0x1405;
    var GL_FLOAT$4 = 0x1406;

    var GL_TEXTURE_WRAP_S = 0x2802;
    var GL_TEXTURE_WRAP_T = 0x2803;

    var GL_REPEAT = 0x2901;
    var GL_CLAMP_TO_EDGE$1 = 0x812F;
    var GL_MIRRORED_REPEAT = 0x8370;

    var GL_TEXTURE_MAG_FILTER = 0x2800;
    var GL_TEXTURE_MIN_FILTER = 0x2801;

    var GL_NEAREST$1 = 0x2600;
    var GL_LINEAR = 0x2601;
    var GL_NEAREST_MIPMAP_NEAREST$1 = 0x2700;
    var GL_LINEAR_MIPMAP_NEAREST$1 = 0x2701;
    var GL_NEAREST_MIPMAP_LINEAR$1 = 0x2702;
    var GL_LINEAR_MIPMAP_LINEAR$1 = 0x2703;

    var GL_GENERATE_MIPMAP_HINT = 0x8192;
    var GL_DONT_CARE = 0x1100;
    var GL_FASTEST = 0x1101;
    var GL_NICEST = 0x1102;

    var GL_TEXTURE_MAX_ANISOTROPY_EXT = 0x84FE;

    var GL_UNPACK_ALIGNMENT = 0x0CF5;
    var GL_UNPACK_FLIP_Y_WEBGL = 0x9240;
    var GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL = 0x9241;
    var GL_UNPACK_COLORSPACE_CONVERSION_WEBGL = 0x9243;

    var GL_BROWSER_DEFAULT_WEBGL = 0x9244;

    var GL_TEXTURE0$1 = 0x84C0;

    var MIPMAP_FILTERS = [
      GL_NEAREST_MIPMAP_NEAREST$1,
      GL_NEAREST_MIPMAP_LINEAR$1,
      GL_LINEAR_MIPMAP_NEAREST$1,
      GL_LINEAR_MIPMAP_LINEAR$1
    ];

    var CHANNELS_FORMAT = [
      0,
      GL_LUMINANCE,
      GL_LUMINANCE_ALPHA,
      GL_RGB,
      GL_RGBA$1
    ];

    var FORMAT_CHANNELS = {};
    FORMAT_CHANNELS[GL_LUMINANCE] =
    FORMAT_CHANNELS[GL_ALPHA] =
    FORMAT_CHANNELS[GL_DEPTH_COMPONENT] = 1;
    FORMAT_CHANNELS[GL_DEPTH_STENCIL] =
    FORMAT_CHANNELS[GL_LUMINANCE_ALPHA] = 2;
    FORMAT_CHANNELS[GL_RGB] =
    FORMAT_CHANNELS[GL_SRGB_EXT] = 3;
    FORMAT_CHANNELS[GL_RGBA$1] =
    FORMAT_CHANNELS[GL_SRGB_ALPHA_EXT] = 4;

    function objectName (str) {
      return '[object ' + str + ']'
    }

    var CANVAS_CLASS = objectName('HTMLCanvasElement');
    var OFFSCREENCANVAS_CLASS = objectName('OffscreenCanvas');
    var CONTEXT2D_CLASS = objectName('CanvasRenderingContext2D');
    var BITMAP_CLASS = objectName('ImageBitmap');
    var IMAGE_CLASS = objectName('HTMLImageElement');
    var VIDEO_CLASS = objectName('HTMLVideoElement');

    var PIXEL_CLASSES = Object.keys(arrayTypes).concat([
      CANVAS_CLASS,
      OFFSCREENCANVAS_CLASS,
      CONTEXT2D_CLASS,
      BITMAP_CLASS,
      IMAGE_CLASS,
      VIDEO_CLASS
    ]);

    // for every texture type, store
    // the size in bytes.
    var TYPE_SIZES = [];
    TYPE_SIZES[GL_UNSIGNED_BYTE$5] = 1;
    TYPE_SIZES[GL_FLOAT$4] = 4;
    TYPE_SIZES[GL_HALF_FLOAT_OES$1] = 2;

    TYPE_SIZES[GL_UNSIGNED_SHORT$3] = 2;
    TYPE_SIZES[GL_UNSIGNED_INT$3] = 4;

    var FORMAT_SIZES_SPECIAL = [];
    FORMAT_SIZES_SPECIAL[GL_RGBA4] = 2;
    FORMAT_SIZES_SPECIAL[GL_RGB5_A1] = 2;
    FORMAT_SIZES_SPECIAL[GL_RGB565] = 2;
    FORMAT_SIZES_SPECIAL[GL_DEPTH_STENCIL] = 4;

    FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_S3TC_DXT1_EXT] = 0.5;
    FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_S3TC_DXT1_EXT] = 0.5;
    FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_S3TC_DXT3_EXT] = 1;
    FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_S3TC_DXT5_EXT] = 1;

    FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_ATC_WEBGL] = 0.5;
    FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL] = 1;
    FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL] = 1;

    FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG] = 0.5;
    FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG] = 0.25;
    FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG] = 0.5;
    FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG] = 0.25;

    FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_ETC1_WEBGL] = 0.5;

    function isNumericArray (arr) {
      return (
        Array.isArray(arr) &&
        (arr.length === 0 ||
        typeof arr[0] === 'number'))
    }

    function isRectArray (arr) {
      if (!Array.isArray(arr)) {
        return false
      }
      var width = arr.length;
      if (width === 0 || !isArrayLike(arr[0])) {
        return false
      }
      return true
    }

    function classString (x) {
      return Object.prototype.toString.call(x)
    }

    function isCanvasElement (object) {
      return classString(object) === CANVAS_CLASS
    }

    function isOffscreenCanvas (object) {
      return classString(object) === OFFSCREENCANVAS_CLASS
    }

    function isContext2D (object) {
      return classString(object) === CONTEXT2D_CLASS
    }

    function isBitmap (object) {
      return classString(object) === BITMAP_CLASS
    }

    function isImageElement (object) {
      return classString(object) === IMAGE_CLASS
    }

    function isVideoElement (object) {
      return classString(object) === VIDEO_CLASS
    }

    function isPixelData (object) {
      if (!object) {
        return false
      }
      var className = classString(object);
      if (PIXEL_CLASSES.indexOf(className) >= 0) {
        return true
      }
      return (
        isNumericArray(object) ||
        isRectArray(object) ||
        isNDArrayLike(object))
    }

    function typedArrayCode$1 (data) {
      return arrayTypes[Object.prototype.toString.call(data)] | 0
    }

    function convertData (result, data) {
      var n = data.length;
      switch (result.type) {
        case GL_UNSIGNED_BYTE$5:
        case GL_UNSIGNED_SHORT$3:
        case GL_UNSIGNED_INT$3:
        case GL_FLOAT$4:
          var converted = pool.allocType(result.type, n);
          converted.set(data);
          result.data = converted;
          break

        case GL_HALF_FLOAT_OES$1:
          result.data = convertToHalfFloat(data);
          break

        default:
          check$1.raise('unsupported texture type, must specify a typed array');
      }
    }

    function preConvert (image, n) {
      return pool.allocType(
        image.type === GL_HALF_FLOAT_OES$1
          ? GL_FLOAT$4
          : image.type, n)
    }

    function postConvert (image, data) {
      if (image.type === GL_HALF_FLOAT_OES$1) {
        image.data = convertToHalfFloat(data);
        pool.freeType(data);
      } else {
        image.data = data;
      }
    }

    function transposeData (image, array, strideX, strideY, strideC, offset) {
      var w = image.width;
      var h = image.height;
      var c = image.channels;
      var n = w * h * c;
      var data = preConvert(image, n);

      var p = 0;
      for (var i = 0; i < h; ++i) {
        for (var j = 0; j < w; ++j) {
          for (var k = 0; k < c; ++k) {
            data[p++] = array[strideX * j + strideY * i + strideC * k + offset];
          }
        }
      }

      postConvert(image, data);
    }

    function getTextureSize (format, type, width, height, isMipmap, isCube) {
      var s;
      if (typeof FORMAT_SIZES_SPECIAL[format] !== 'undefined') {
        // we have a special array for dealing with weird color formats such as RGB5A1
        s = FORMAT_SIZES_SPECIAL[format];
      } else {
        s = FORMAT_CHANNELS[format] * TYPE_SIZES[type];
      }

      if (isCube) {
        s *= 6;
      }

      if (isMipmap) {
        // compute the total size of all the mipmaps.
        var total = 0;

        var w = width;
        while (w >= 1) {
          // we can only use mipmaps on a square image,
          // so we can simply use the width and ignore the height:
          total += s * w * w;
          w /= 2;
        }
        return total
      } else {
        return s * width * height
      }
    }

    function createTextureSet (
      gl, extensions, limits, reglPoll, contextState, stats, config) {
      // -------------------------------------------------------
      // Initialize constants and parameter tables here
      // -------------------------------------------------------
      var mipmapHint = {
        "don't care": GL_DONT_CARE,
        'dont care': GL_DONT_CARE,
        'nice': GL_NICEST,
        'fast': GL_FASTEST
      };

      var wrapModes = {
        'repeat': GL_REPEAT,
        'clamp': GL_CLAMP_TO_EDGE$1,
        'mirror': GL_MIRRORED_REPEAT
      };

      var magFilters = {
        'nearest': GL_NEAREST$1,
        'linear': GL_LINEAR
      };

      var minFilters = extend({
        'mipmap': GL_LINEAR_MIPMAP_LINEAR$1,
        'nearest mipmap nearest': GL_NEAREST_MIPMAP_NEAREST$1,
        'linear mipmap nearest': GL_LINEAR_MIPMAP_NEAREST$1,
        'nearest mipmap linear': GL_NEAREST_MIPMAP_LINEAR$1,
        'linear mipmap linear': GL_LINEAR_MIPMAP_LINEAR$1
      }, magFilters);

      var colorSpace = {
        'none': 0,
        'browser': GL_BROWSER_DEFAULT_WEBGL
      };

      var textureTypes = {
        'uint8': GL_UNSIGNED_BYTE$5,
        'rgba4': GL_UNSIGNED_SHORT_4_4_4_4$1,
        'rgb565': GL_UNSIGNED_SHORT_5_6_5$1,
        'rgb5 a1': GL_UNSIGNED_SHORT_5_5_5_1$1
      };

      var textureFormats = {
        'alpha': GL_ALPHA,
        'luminance': GL_LUMINANCE,
        'luminance alpha': GL_LUMINANCE_ALPHA,
        'rgb': GL_RGB,
        'rgba': GL_RGBA$1,
        'rgba4': GL_RGBA4,
        'rgb5 a1': GL_RGB5_A1,
        'rgb565': GL_RGB565
      };

      var compressedTextureFormats = {};

      if (extensions.ext_srgb) {
        textureFormats.srgb = GL_SRGB_EXT;
        textureFormats.srgba = GL_SRGB_ALPHA_EXT;
      }

      if (extensions.oes_texture_float) {
        textureTypes.float32 = textureTypes.float = GL_FLOAT$4;
      }

      if (extensions.oes_texture_half_float) {
        textureTypes['float16'] = textureTypes['half float'] = GL_HALF_FLOAT_OES$1;
      }

      if (extensions.webgl_depth_texture) {
        extend(textureFormats, {
          'depth': GL_DEPTH_COMPONENT,
          'depth stencil': GL_DEPTH_STENCIL
        });

        extend(textureTypes, {
          'uint16': GL_UNSIGNED_SHORT$3,
          'uint32': GL_UNSIGNED_INT$3,
          'depth stencil': GL_UNSIGNED_INT_24_8_WEBGL$1
        });
      }

      if (extensions.webgl_compressed_texture_s3tc) {
        extend(compressedTextureFormats, {
          'rgb s3tc dxt1': GL_COMPRESSED_RGB_S3TC_DXT1_EXT,
          'rgba s3tc dxt1': GL_COMPRESSED_RGBA_S3TC_DXT1_EXT,
          'rgba s3tc dxt3': GL_COMPRESSED_RGBA_S3TC_DXT3_EXT,
          'rgba s3tc dxt5': GL_COMPRESSED_RGBA_S3TC_DXT5_EXT
        });
      }

      if (extensions.webgl_compressed_texture_atc) {
        extend(compressedTextureFormats, {
          'rgb atc': GL_COMPRESSED_RGB_ATC_WEBGL,
          'rgba atc explicit alpha': GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL,
          'rgba atc interpolated alpha': GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL
        });
      }

      if (extensions.webgl_compressed_texture_pvrtc) {
        extend(compressedTextureFormats, {
          'rgb pvrtc 4bppv1': GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
          'rgb pvrtc 2bppv1': GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG,
          'rgba pvrtc 4bppv1': GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
          'rgba pvrtc 2bppv1': GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG
        });
      }

      if (extensions.webgl_compressed_texture_etc1) {
        compressedTextureFormats['rgb etc1'] = GL_COMPRESSED_RGB_ETC1_WEBGL;
      }

      // Copy over all texture formats
      var supportedCompressedFormats = Array.prototype.slice.call(
        gl.getParameter(GL_COMPRESSED_TEXTURE_FORMATS));
      Object.keys(compressedTextureFormats).forEach(function (name) {
        var format = compressedTextureFormats[name];
        if (supportedCompressedFormats.indexOf(format) >= 0) {
          textureFormats[name] = format;
        }
      });

      var supportedFormats = Object.keys(textureFormats);
      limits.textureFormats = supportedFormats;

      // associate with every format string its
      // corresponding GL-value.
      var textureFormatsInvert = [];
      Object.keys(textureFormats).forEach(function (key) {
        var val = textureFormats[key];
        textureFormatsInvert[val] = key;
      });

      // associate with every type string its
      // corresponding GL-value.
      var textureTypesInvert = [];
      Object.keys(textureTypes).forEach(function (key) {
        var val = textureTypes[key];
        textureTypesInvert[val] = key;
      });

      var magFiltersInvert = [];
      Object.keys(magFilters).forEach(function (key) {
        var val = magFilters[key];
        magFiltersInvert[val] = key;
      });

      var minFiltersInvert = [];
      Object.keys(minFilters).forEach(function (key) {
        var val = minFilters[key];
        minFiltersInvert[val] = key;
      });

      var wrapModesInvert = [];
      Object.keys(wrapModes).forEach(function (key) {
        var val = wrapModes[key];
        wrapModesInvert[val] = key;
      });

      // colorFormats[] gives the format (channels) associated to an
      // internalformat
      var colorFormats = supportedFormats.reduce(function (color, key) {
        var glenum = textureFormats[key];
        if (glenum === GL_LUMINANCE ||
            glenum === GL_ALPHA ||
            glenum === GL_LUMINANCE ||
            glenum === GL_LUMINANCE_ALPHA ||
            glenum === GL_DEPTH_COMPONENT ||
            glenum === GL_DEPTH_STENCIL ||
            (extensions.ext_srgb &&
                    (glenum === GL_SRGB_EXT ||
                     glenum === GL_SRGB_ALPHA_EXT))) {
          color[glenum] = glenum;
        } else if (glenum === GL_RGB5_A1 || key.indexOf('rgba') >= 0) {
          color[glenum] = GL_RGBA$1;
        } else {
          color[glenum] = GL_RGB;
        }
        return color
      }, {});

      function TexFlags () {
        // format info
        this.internalformat = GL_RGBA$1;
        this.format = GL_RGBA$1;
        this.type = GL_UNSIGNED_BYTE$5;
        this.compressed = false;

        // pixel storage
        this.premultiplyAlpha = false;
        this.flipY = false;
        this.unpackAlignment = 1;
        this.colorSpace = GL_BROWSER_DEFAULT_WEBGL;

        // shape info
        this.width = 0;
        this.height = 0;
        this.channels = 0;
      }

      function copyFlags (result, other) {
        result.internalformat = other.internalformat;
        result.format = other.format;
        result.type = other.type;
        result.compressed = other.compressed;

        result.premultiplyAlpha = other.premultiplyAlpha;
        result.flipY = other.flipY;
        result.unpackAlignment = other.unpackAlignment;
        result.colorSpace = other.colorSpace;

        result.width = other.width;
        result.height = other.height;
        result.channels = other.channels;
      }

      function parseFlags (flags, options) {
        if (typeof options !== 'object' || !options) {
          return
        }

        if ('premultiplyAlpha' in options) {
          check$1.type(options.premultiplyAlpha, 'boolean',
            'invalid premultiplyAlpha');
          flags.premultiplyAlpha = options.premultiplyAlpha;
        }

        if ('flipY' in options) {
          check$1.type(options.flipY, 'boolean',
            'invalid texture flip');
          flags.flipY = options.flipY;
        }

        if ('alignment' in options) {
          check$1.oneOf(options.alignment, [1, 2, 4, 8],
            'invalid texture unpack alignment');
          flags.unpackAlignment = options.alignment;
        }

        if ('colorSpace' in options) {
          check$1.parameter(options.colorSpace, colorSpace,
            'invalid colorSpace');
          flags.colorSpace = colorSpace[options.colorSpace];
        }

        if ('type' in options) {
          var type = options.type;
          check$1(extensions.oes_texture_float ||
            !(type === 'float' || type === 'float32'),
          'you must enable the OES_texture_float extension in order to use floating point textures.');
          check$1(extensions.oes_texture_half_float ||
            !(type === 'half float' || type === 'float16'),
          'you must enable the OES_texture_half_float extension in order to use 16-bit floating point textures.');
          check$1(extensions.webgl_depth_texture ||
            !(type === 'uint16' || type === 'uint32' || type === 'depth stencil'),
          'you must enable the WEBGL_depth_texture extension in order to use depth/stencil textures.');
          check$1.parameter(type, textureTypes,
            'invalid texture type');
          flags.type = textureTypes[type];
        }

        var w = flags.width;
        var h = flags.height;
        var c = flags.channels;
        var hasChannels = false;
        if ('shape' in options) {
          check$1(Array.isArray(options.shape) && options.shape.length >= 2,
            'shape must be an array');
          w = options.shape[0];
          h = options.shape[1];
          if (options.shape.length === 3) {
            c = options.shape[2];
            check$1(c > 0 && c <= 4, 'invalid number of channels');
            hasChannels = true;
          }
          check$1(w >= 0 && w <= limits.maxTextureSize, 'invalid width');
          check$1(h >= 0 && h <= limits.maxTextureSize, 'invalid height');
        } else {
          if ('radius' in options) {
            w = h = options.radius;
            check$1(w >= 0 && w <= limits.maxTextureSize, 'invalid radius');
          }
          if ('width' in options) {
            w = options.width;
            check$1(w >= 0 && w <= limits.maxTextureSize, 'invalid width');
          }
          if ('height' in options) {
            h = options.height;
            check$1(h >= 0 && h <= limits.maxTextureSize, 'invalid height');
          }
          if ('channels' in options) {
            c = options.channels;
            check$1(c > 0 && c <= 4, 'invalid number of channels');
            hasChannels = true;
          }
        }
        flags.width = w | 0;
        flags.height = h | 0;
        flags.channels = c | 0;

        var hasFormat = false;
        if ('format' in options) {
          var formatStr = options.format;
          check$1(extensions.webgl_depth_texture ||
            !(formatStr === 'depth' || formatStr === 'depth stencil'),
          'you must enable the WEBGL_depth_texture extension in order to use depth/stencil textures.');
          check$1.parameter(formatStr, textureFormats,
            'invalid texture format');
          var internalformat = flags.internalformat = textureFormats[formatStr];
          flags.format = colorFormats[internalformat];
          if (formatStr in textureTypes) {
            if (!('type' in options)) {
              flags.type = textureTypes[formatStr];
            }
          }
          if (formatStr in compressedTextureFormats) {
            flags.compressed = true;
          }
          hasFormat = true;
        }

        // Reconcile channels and format
        if (!hasChannels && hasFormat) {
          flags.channels = FORMAT_CHANNELS[flags.format];
        } else if (hasChannels && !hasFormat) {
          if (flags.channels !== CHANNELS_FORMAT[flags.format]) {
            flags.format = flags.internalformat = CHANNELS_FORMAT[flags.channels];
          }
        } else if (hasFormat && hasChannels) {
          check$1(
            flags.channels === FORMAT_CHANNELS[flags.format],
            'number of channels inconsistent with specified format');
        }
      }

      function setFlags (flags) {
        gl.pixelStorei(GL_UNPACK_FLIP_Y_WEBGL, flags.flipY);
        gl.pixelStorei(GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL, flags.premultiplyAlpha);
        gl.pixelStorei(GL_UNPACK_COLORSPACE_CONVERSION_WEBGL, flags.colorSpace);
        gl.pixelStorei(GL_UNPACK_ALIGNMENT, flags.unpackAlignment);
      }

      // -------------------------------------------------------
      // Tex image data
      // -------------------------------------------------------
      function TexImage () {
        TexFlags.call(this);

        this.xOffset = 0;
        this.yOffset = 0;

        // data
        this.data = null;
        this.needsFree = false;

        // html element
        this.element = null;

        // copyTexImage info
        this.needsCopy = false;
      }

      function parseImage (image, options) {
        var data = null;
        if (isPixelData(options)) {
          data = options;
        } else if (options) {
          check$1.type(options, 'object', 'invalid pixel data type');
          parseFlags(image, options);
          if ('x' in options) {
            image.xOffset = options.x | 0;
          }
          if ('y' in options) {
            image.yOffset = options.y | 0;
          }
          if (isPixelData(options.data)) {
            data = options.data;
          }
        }

        check$1(
          !image.compressed ||
          data instanceof Uint8Array,
          'compressed texture data must be stored in a uint8array');

        if (options.copy) {
          check$1(!data, 'can not specify copy and data field for the same texture');
          var viewW = contextState.viewportWidth;
          var viewH = contextState.viewportHeight;
          image.width = image.width || (viewW - image.xOffset);
          image.height = image.height || (viewH - image.yOffset);
          image.needsCopy = true;
          check$1(image.xOffset >= 0 && image.xOffset < viewW &&
                image.yOffset >= 0 && image.yOffset < viewH &&
                image.width > 0 && image.width <= viewW &&
                image.height > 0 && image.height <= viewH,
          'copy texture read out of bounds');
        } else if (!data) {
          image.width = image.width || 1;
          image.height = image.height || 1;
          image.channels = image.channels || 4;
        } else if (isTypedArray(data)) {
          image.channels = image.channels || 4;
          image.data = data;
          if (!('type' in options) && image.type === GL_UNSIGNED_BYTE$5) {
            image.type = typedArrayCode$1(data);
          }
        } else if (isNumericArray(data)) {
          image.channels = image.channels || 4;
          convertData(image, data);
          image.alignment = 1;
          image.needsFree = true;
        } else if (isNDArrayLike(data)) {
          var array = data.data;
          if (!Array.isArray(array) && image.type === GL_UNSIGNED_BYTE$5) {
            image.type = typedArrayCode$1(array);
          }
          var shape = data.shape;
          var stride = data.stride;
          var shapeX, shapeY, shapeC, strideX, strideY, strideC;
          if (shape.length === 3) {
            shapeC = shape[2];
            strideC = stride[2];
          } else {
            check$1(shape.length === 2, 'invalid ndarray pixel data, must be 2 or 3D');
            shapeC = 1;
            strideC = 1;
          }
          shapeX = shape[0];
          shapeY = shape[1];
          strideX = stride[0];
          strideY = stride[1];
          image.alignment = 1;
          image.width = shapeX;
          image.height = shapeY;
          image.channels = shapeC;
          image.format = image.internalformat = CHANNELS_FORMAT[shapeC];
          image.needsFree = true;
          transposeData(image, array, strideX, strideY, strideC, data.offset);
        } else if (isCanvasElement(data) || isOffscreenCanvas(data) || isContext2D(data)) {
          if (isCanvasElement(data) || isOffscreenCanvas(data)) {
            image.element = data;
          } else {
            image.element = data.canvas;
          }
          image.width = image.element.width;
          image.height = image.element.height;
          image.channels = 4;
        } else if (isBitmap(data)) {
          image.element = data;
          image.width = data.width;
          image.height = data.height;
          image.channels = 4;
        } else if (isImageElement(data)) {
          image.element = data;
          image.width = data.naturalWidth;
          image.height = data.naturalHeight;
          image.channels = 4;
        } else if (isVideoElement(data)) {
          image.element = data;
          image.width = data.videoWidth;
          image.height = data.videoHeight;
          image.channels = 4;
        } else if (isRectArray(data)) {
          var w = image.width || data[0].length;
          var h = image.height || data.length;
          var c = image.channels;
          if (isArrayLike(data[0][0])) {
            c = c || data[0][0].length;
          } else {
            c = c || 1;
          }
          var arrayShape = flattenUtils.shape(data);
          var n = 1;
          for (var dd = 0; dd < arrayShape.length; ++dd) {
            n *= arrayShape[dd];
          }
          var allocData = preConvert(image, n);
          flattenUtils.flatten(data, arrayShape, '', allocData);
          postConvert(image, allocData);
          image.alignment = 1;
          image.width = w;
          image.height = h;
          image.channels = c;
          image.format = image.internalformat = CHANNELS_FORMAT[c];
          image.needsFree = true;
        }

        if (image.type === GL_FLOAT$4) {
          check$1(limits.extensions.indexOf('oes_texture_float') >= 0,
            'oes_texture_float extension not enabled');
        } else if (image.type === GL_HALF_FLOAT_OES$1) {
          check$1(limits.extensions.indexOf('oes_texture_half_float') >= 0,
            'oes_texture_half_float extension not enabled');
        }

        // do compressed texture  validation here.
      }

      function setImage (info, target, miplevel) {
        var element = info.element;
        var data = info.data;
        var internalformat = info.internalformat;
        var format = info.format;
        var type = info.type;
        var width = info.width;
        var height = info.height;

        setFlags(info);

        if (element) {
          gl.texImage2D(target, miplevel, format, format, type, element);
        } else if (info.compressed) {
          gl.compressedTexImage2D(target, miplevel, internalformat, width, height, 0, data);
        } else if (info.needsCopy) {
          reglPoll();
          gl.copyTexImage2D(
            target, miplevel, format, info.xOffset, info.yOffset, width, height, 0);
        } else {
          gl.texImage2D(target, miplevel, format, width, height, 0, format, type, data || null);
        }
      }

      function setSubImage (info, target, x, y, miplevel) {
        var element = info.element;
        var data = info.data;
        var internalformat = info.internalformat;
        var format = info.format;
        var type = info.type;
        var width = info.width;
        var height = info.height;

        setFlags(info);

        if (element) {
          gl.texSubImage2D(
            target, miplevel, x, y, format, type, element);
        } else if (info.compressed) {
          gl.compressedTexSubImage2D(
            target, miplevel, x, y, internalformat, width, height, data);
        } else if (info.needsCopy) {
          reglPoll();
          gl.copyTexSubImage2D(
            target, miplevel, x, y, info.xOffset, info.yOffset, width, height);
        } else {
          gl.texSubImage2D(
            target, miplevel, x, y, width, height, format, type, data);
        }
      }

      // texImage pool
      var imagePool = [];

      function allocImage () {
        return imagePool.pop() || new TexImage()
      }

      function freeImage (image) {
        if (image.needsFree) {
          pool.freeType(image.data);
        }
        TexImage.call(image);
        imagePool.push(image);
      }

      // -------------------------------------------------------
      // Mip map
      // -------------------------------------------------------
      function MipMap () {
        TexFlags.call(this);

        this.genMipmaps = false;
        this.mipmapHint = GL_DONT_CARE;
        this.mipmask = 0;
        this.images = Array(16);
      }

      function parseMipMapFromShape (mipmap, width, height) {
        var img = mipmap.images[0] = allocImage();
        mipmap.mipmask = 1;
        img.width = mipmap.width = width;
        img.height = mipmap.height = height;
        img.channels = mipmap.channels = 4;
      }

      function parseMipMapFromObject (mipmap, options) {
        var imgData = null;
        if (isPixelData(options)) {
          imgData = mipmap.images[0] = allocImage();
          copyFlags(imgData, mipmap);
          parseImage(imgData, options);
          mipmap.mipmask = 1;
        } else {
          parseFlags(mipmap, options);
          if (Array.isArray(options.mipmap)) {
            var mipData = options.mipmap;
            for (var i = 0; i < mipData.length; ++i) {
              imgData = mipmap.images[i] = allocImage();
              copyFlags(imgData, mipmap);
              imgData.width >>= i;
              imgData.height >>= i;
              parseImage(imgData, mipData[i]);
              mipmap.mipmask |= (1 << i);
            }
          } else {
            imgData = mipmap.images[0] = allocImage();
            copyFlags(imgData, mipmap);
            parseImage(imgData, options);
            mipmap.mipmask = 1;
          }
        }
        copyFlags(mipmap, mipmap.images[0]);

        // For textures of the compressed format WEBGL_compressed_texture_s3tc
        // we must have that
        //
        // "When level equals zero width and height must be a multiple of 4.
        // When level is greater than 0 width and height must be 0, 1, 2 or a multiple of 4. "
        //
        // but we do not yet support having multiple mipmap levels for compressed textures,
        // so we only test for level zero.

        if (
          mipmap.compressed &&
          (
            mipmap.internalformat === GL_COMPRESSED_RGB_S3TC_DXT1_EXT ||
            mipmap.internalformat === GL_COMPRESSED_RGBA_S3TC_DXT1_EXT ||
            mipmap.internalformat === GL_COMPRESSED_RGBA_S3TC_DXT3_EXT ||
            mipmap.internalformat === GL_COMPRESSED_RGBA_S3TC_DXT5_EXT
          )
        ) {
          check$1(mipmap.width % 4 === 0 && mipmap.height % 4 === 0,
            'for compressed texture formats, mipmap level 0 must have width and height that are a multiple of 4');
        }
      }

      function setMipMap (mipmap, target) {
        var images = mipmap.images;
        for (var i = 0; i < images.length; ++i) {
          if (!images[i]) {
            return
          }
          setImage(images[i], target, i);
        }
      }

      var mipPool = [];

      function allocMipMap () {
        var result = mipPool.pop() || new MipMap();
        TexFlags.call(result);
        result.mipmask = 0;
        for (var i = 0; i < 16; ++i) {
          result.images[i] = null;
        }
        return result
      }

      function freeMipMap (mipmap) {
        var images = mipmap.images;
        for (var i = 0; i < images.length; ++i) {
          if (images[i]) {
            freeImage(images[i]);
          }
          images[i] = null;
        }
        mipPool.push(mipmap);
      }

      // -------------------------------------------------------
      // Tex info
      // -------------------------------------------------------
      function TexInfo () {
        this.minFilter = GL_NEAREST$1;
        this.magFilter = GL_NEAREST$1;

        this.wrapS = GL_CLAMP_TO_EDGE$1;
        this.wrapT = GL_CLAMP_TO_EDGE$1;

        this.anisotropic = 1;

        this.genMipmaps = false;
        this.mipmapHint = GL_DONT_CARE;
      }

      function parseTexInfo (info, options) {
        if ('min' in options) {
          var minFilter = options.min;
          check$1.parameter(minFilter, minFilters);
          info.minFilter = minFilters[minFilter];
          if (MIPMAP_FILTERS.indexOf(info.minFilter) >= 0 && !('faces' in options)) {
            info.genMipmaps = true;
          }
        }

        if ('mag' in options) {
          var magFilter = options.mag;
          check$1.parameter(magFilter, magFilters);
          info.magFilter = magFilters[magFilter];
        }

        var wrapS = info.wrapS;
        var wrapT = info.wrapT;
        if ('wrap' in options) {
          var wrap = options.wrap;
          if (typeof wrap === 'string') {
            check$1.parameter(wrap, wrapModes);
            wrapS = wrapT = wrapModes[wrap];
          } else if (Array.isArray(wrap)) {
            check$1.parameter(wrap[0], wrapModes);
            check$1.parameter(wrap[1], wrapModes);
            wrapS = wrapModes[wrap[0]];
            wrapT = wrapModes[wrap[1]];
          }
        } else {
          if ('wrapS' in options) {
            var optWrapS = options.wrapS;
            check$1.parameter(optWrapS, wrapModes);
            wrapS = wrapModes[optWrapS];
          }
          if ('wrapT' in options) {
            var optWrapT = options.wrapT;
            check$1.parameter(optWrapT, wrapModes);
            wrapT = wrapModes[optWrapT];
          }
        }
        info.wrapS = wrapS;
        info.wrapT = wrapT;

        if ('anisotropic' in options) {
          var anisotropic = options.anisotropic;
          check$1(typeof anisotropic === 'number' &&
             anisotropic >= 1 && anisotropic <= limits.maxAnisotropic,
          'aniso samples must be between 1 and ');
          info.anisotropic = options.anisotropic;
        }

        if ('mipmap' in options) {
          var hasMipMap = false;
          switch (typeof options.mipmap) {
            case 'string':
              check$1.parameter(options.mipmap, mipmapHint,
                'invalid mipmap hint');
              info.mipmapHint = mipmapHint[options.mipmap];
              info.genMipmaps = true;
              hasMipMap = true;
              break

            case 'boolean':
              hasMipMap = info.genMipmaps = options.mipmap;
              break

            case 'object':
              check$1(Array.isArray(options.mipmap), 'invalid mipmap type');
              info.genMipmaps = false;
              hasMipMap = true;
              break

            default:
              check$1.raise('invalid mipmap type');
          }
          if (hasMipMap && !('min' in options)) {
            info.minFilter = GL_NEAREST_MIPMAP_NEAREST$1;
          }
        }
      }

      function setTexInfo (info, target) {
        gl.texParameteri(target, GL_TEXTURE_MIN_FILTER, info.minFilter);
        gl.texParameteri(target, GL_TEXTURE_MAG_FILTER, info.magFilter);
        gl.texParameteri(target, GL_TEXTURE_WRAP_S, info.wrapS);
        gl.texParameteri(target, GL_TEXTURE_WRAP_T, info.wrapT);
        if (extensions.ext_texture_filter_anisotropic) {
          gl.texParameteri(target, GL_TEXTURE_MAX_ANISOTROPY_EXT, info.anisotropic);
        }
        if (info.genMipmaps) {
          gl.hint(GL_GENERATE_MIPMAP_HINT, info.mipmapHint);
          gl.generateMipmap(target);
        }
      }

      // -------------------------------------------------------
      // Full texture object
      // -------------------------------------------------------
      var textureCount = 0;
      var textureSet = {};
      var numTexUnits = limits.maxTextureUnits;
      var textureUnits = Array(numTexUnits).map(function () {
        return null
      });

      function REGLTexture (target) {
        TexFlags.call(this);
        this.mipmask = 0;
        this.internalformat = GL_RGBA$1;

        this.id = textureCount++;

        this.refCount = 1;

        this.target = target;
        this.texture = gl.createTexture();

        this.unit = -1;
        this.bindCount = 0;

        this.texInfo = new TexInfo();

        if (config.profile) {
          this.stats = { size: 0 };
        }
      }

      function tempBind (texture) {
        gl.activeTexture(GL_TEXTURE0$1);
        gl.bindTexture(texture.target, texture.texture);
      }

      function tempRestore () {
        var prev = textureUnits[0];
        if (prev) {
          gl.bindTexture(prev.target, prev.texture);
        } else {
          gl.bindTexture(GL_TEXTURE_2D$1, null);
        }
      }

      function destroy (texture) {
        var handle = texture.texture;
        check$1(handle, 'must not double destroy texture');
        var unit = texture.unit;
        var target = texture.target;
        if (unit >= 0) {
          gl.activeTexture(GL_TEXTURE0$1 + unit);
          gl.bindTexture(target, null);
          textureUnits[unit] = null;
        }
        gl.deleteTexture(handle);
        texture.texture = null;
        texture.params = null;
        texture.pixels = null;
        texture.refCount = 0;
        delete textureSet[texture.id];
        stats.textureCount--;
      }

      extend(REGLTexture.prototype, {
        bind: function () {
          var texture = this;
          texture.bindCount += 1;
          var unit = texture.unit;
          if (unit < 0) {
            for (var i = 0; i < numTexUnits; ++i) {
              var other = textureUnits[i];
              if (other) {
                if (other.bindCount > 0) {
                  continue
                }
                other.unit = -1;
              }
              textureUnits[i] = texture;
              unit = i;
              break
            }
            if (unit >= numTexUnits) {
              check$1.raise('insufficient number of texture units');
            }
            if (config.profile && stats.maxTextureUnits < (unit + 1)) {
              stats.maxTextureUnits = unit + 1; // +1, since the units are zero-based
            }
            texture.unit = unit;
            gl.activeTexture(GL_TEXTURE0$1 + unit);
            gl.bindTexture(texture.target, texture.texture);
          }
          return unit
        },

        unbind: function () {
          this.bindCount -= 1;
        },

        decRef: function () {
          if (--this.refCount <= 0) {
            destroy(this);
          }
        }
      });

      function createTexture2D (a, b) {
        var texture = new REGLTexture(GL_TEXTURE_2D$1);
        textureSet[texture.id] = texture;
        stats.textureCount++;

        function reglTexture2D (a, b) {
          var texInfo = texture.texInfo;
          TexInfo.call(texInfo);
          var mipData = allocMipMap();

          if (typeof a === 'number') {
            if (typeof b === 'number') {
              parseMipMapFromShape(mipData, a | 0, b | 0);
            } else {
              parseMipMapFromShape(mipData, a | 0, a | 0);
            }
          } else if (a) {
            check$1.type(a, 'object', 'invalid arguments to regl.texture');
            parseTexInfo(texInfo, a);
            parseMipMapFromObject(mipData, a);
          } else {
            // empty textures get assigned a default shape of 1x1
            parseMipMapFromShape(mipData, 1, 1);
          }

          if (texInfo.genMipmaps) {
            mipData.mipmask = (mipData.width << 1) - 1;
          }
          texture.mipmask = mipData.mipmask;

          copyFlags(texture, mipData);

          check$1.texture2D(texInfo, mipData, limits);
          texture.internalformat = mipData.internalformat;

          reglTexture2D.width = mipData.width;
          reglTexture2D.height = mipData.height;

          tempBind(texture);
          setMipMap(mipData, GL_TEXTURE_2D$1);
          setTexInfo(texInfo, GL_TEXTURE_2D$1);
          tempRestore();

          freeMipMap(mipData);

          if (config.profile) {
            texture.stats.size = getTextureSize(
              texture.internalformat,
              texture.type,
              mipData.width,
              mipData.height,
              texInfo.genMipmaps,
              false);
          }
          reglTexture2D.format = textureFormatsInvert[texture.internalformat];
          reglTexture2D.type = textureTypesInvert[texture.type];

          reglTexture2D.mag = magFiltersInvert[texInfo.magFilter];
          reglTexture2D.min = minFiltersInvert[texInfo.minFilter];

          reglTexture2D.wrapS = wrapModesInvert[texInfo.wrapS];
          reglTexture2D.wrapT = wrapModesInvert[texInfo.wrapT];

          return reglTexture2D
        }

        function subimage (image, x_, y_, level_) {
          check$1(!!image, 'must specify image data');

          var x = x_ | 0;
          var y = y_ | 0;
          var level = level_ | 0;

          var imageData = allocImage();
          copyFlags(imageData, texture);
          imageData.width = 0;
          imageData.height = 0;
          parseImage(imageData, image);
          imageData.width = imageData.width || ((texture.width >> level) - x);
          imageData.height = imageData.height || ((texture.height >> level) - y);

          check$1(
            texture.type === imageData.type &&
            texture.format === imageData.format &&
            texture.internalformat === imageData.internalformat,
            'incompatible format for texture.subimage');
          check$1(
            x >= 0 && y >= 0 &&
            x + imageData.width <= texture.width &&
            y + imageData.height <= texture.height,
            'texture.subimage write out of bounds');
          check$1(
            texture.mipmask & (1 << level),
            'missing mipmap data');
          check$1(
            imageData.data || imageData.element || imageData.needsCopy,
            'missing image data');

          tempBind(texture);
          setSubImage(imageData, GL_TEXTURE_2D$1, x, y, level);
          tempRestore();

          freeImage(imageData);

          return reglTexture2D
        }

        function resize (w_, h_) {
          var w = w_ | 0;
          var h = (h_ | 0) || w;
          if (w === texture.width && h === texture.height) {
            return reglTexture2D
          }

          reglTexture2D.width = texture.width = w;
          reglTexture2D.height = texture.height = h;

          tempBind(texture);

          for (var i = 0; texture.mipmask >> i; ++i) {
            var _w = w >> i;
            var _h = h >> i;
            if (!_w || !_h) break
            gl.texImage2D(
              GL_TEXTURE_2D$1,
              i,
              texture.format,
              _w,
              _h,
              0,
              texture.format,
              texture.type,
              null);
          }
          tempRestore();

          // also, recompute the texture size.
          if (config.profile) {
            texture.stats.size = getTextureSize(
              texture.internalformat,
              texture.type,
              w,
              h,
              false,
              false);
          }

          return reglTexture2D
        }

        reglTexture2D(a, b);

        reglTexture2D.subimage = subimage;
        reglTexture2D.resize = resize;
        reglTexture2D._reglType = 'texture2d';
        reglTexture2D._texture = texture;
        if (config.profile) {
          reglTexture2D.stats = texture.stats;
        }
        reglTexture2D.destroy = function () {
          texture.decRef();
        };

        return reglTexture2D
      }

      function createTextureCube (a0, a1, a2, a3, a4, a5) {
        var texture = new REGLTexture(GL_TEXTURE_CUBE_MAP$1);
        textureSet[texture.id] = texture;
        stats.cubeCount++;

        var faces = new Array(6);

        function reglTextureCube (a0, a1, a2, a3, a4, a5) {
          var i;
          var texInfo = texture.texInfo;
          TexInfo.call(texInfo);
          for (i = 0; i < 6; ++i) {
            faces[i] = allocMipMap();
          }

          if (typeof a0 === 'number' || !a0) {
            var s = (a0 | 0) || 1;
            for (i = 0; i < 6; ++i) {
              parseMipMapFromShape(faces[i], s, s);
            }
          } else if (typeof a0 === 'object') {
            if (a1) {
              parseMipMapFromObject(faces[0], a0);
              parseMipMapFromObject(faces[1], a1);
              parseMipMapFromObject(faces[2], a2);
              parseMipMapFromObject(faces[3], a3);
              parseMipMapFromObject(faces[4], a4);
              parseMipMapFromObject(faces[5], a5);
            } else {
              parseTexInfo(texInfo, a0);
              parseFlags(texture, a0);
              if ('faces' in a0) {
                var faceInput = a0.faces;
                check$1(Array.isArray(faceInput) && faceInput.length === 6,
                  'cube faces must be a length 6 array');
                for (i = 0; i < 6; ++i) {
                  check$1(typeof faceInput[i] === 'object' && !!faceInput[i],
                    'invalid input for cube map face');
                  copyFlags(faces[i], texture);
                  parseMipMapFromObject(faces[i], faceInput[i]);
                }
              } else {
                for (i = 0; i < 6; ++i) {
                  parseMipMapFromObject(faces[i], a0);
                }
              }
            }
          } else {
            check$1.raise('invalid arguments to cube map');
          }

          copyFlags(texture, faces[0]);

          if (!limits.npotTextureCube) {
            check$1(isPow2$1(texture.width) && isPow2$1(texture.height), 'your browser does not support non power or two texture dimensions');
          }

          if (texInfo.genMipmaps) {
            texture.mipmask = (faces[0].width << 1) - 1;
          } else {
            texture.mipmask = faces[0].mipmask;
          }

          check$1.textureCube(texture, texInfo, faces, limits);
          texture.internalformat = faces[0].internalformat;

          reglTextureCube.width = faces[0].width;
          reglTextureCube.height = faces[0].height;

          tempBind(texture);
          for (i = 0; i < 6; ++i) {
            setMipMap(faces[i], GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + i);
          }
          setTexInfo(texInfo, GL_TEXTURE_CUBE_MAP$1);
          tempRestore();

          if (config.profile) {
            texture.stats.size = getTextureSize(
              texture.internalformat,
              texture.type,
              reglTextureCube.width,
              reglTextureCube.height,
              texInfo.genMipmaps,
              true);
          }

          reglTextureCube.format = textureFormatsInvert[texture.internalformat];
          reglTextureCube.type = textureTypesInvert[texture.type];

          reglTextureCube.mag = magFiltersInvert[texInfo.magFilter];
          reglTextureCube.min = minFiltersInvert[texInfo.minFilter];

          reglTextureCube.wrapS = wrapModesInvert[texInfo.wrapS];
          reglTextureCube.wrapT = wrapModesInvert[texInfo.wrapT];

          for (i = 0; i < 6; ++i) {
            freeMipMap(faces[i]);
          }

          return reglTextureCube
        }

        function subimage (face, image, x_, y_, level_) {
          check$1(!!image, 'must specify image data');
          check$1(typeof face === 'number' && face === (face | 0) &&
            face >= 0 && face < 6, 'invalid face');

          var x = x_ | 0;
          var y = y_ | 0;
          var level = level_ | 0;

          var imageData = allocImage();
          copyFlags(imageData, texture);
          imageData.width = 0;
          imageData.height = 0;
          parseImage(imageData, image);
          imageData.width = imageData.width || ((texture.width >> level) - x);
          imageData.height = imageData.height || ((texture.height >> level) - y);

          check$1(
            texture.type === imageData.type &&
            texture.format === imageData.format &&
            texture.internalformat === imageData.internalformat,
            'incompatible format for texture.subimage');
          check$1(
            x >= 0 && y >= 0 &&
            x + imageData.width <= texture.width &&
            y + imageData.height <= texture.height,
            'texture.subimage write out of bounds');
          check$1(
            texture.mipmask & (1 << level),
            'missing mipmap data');
          check$1(
            imageData.data || imageData.element || imageData.needsCopy,
            'missing image data');

          tempBind(texture);
          setSubImage(imageData, GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + face, x, y, level);
          tempRestore();

          freeImage(imageData);

          return reglTextureCube
        }

        function resize (radius_) {
          var radius = radius_ | 0;
          if (radius === texture.width) {
            return
          }

          reglTextureCube.width = texture.width = radius;
          reglTextureCube.height = texture.height = radius;

          tempBind(texture);
          for (var i = 0; i < 6; ++i) {
            for (var j = 0; texture.mipmask >> j; ++j) {
              gl.texImage2D(
                GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + i,
                j,
                texture.format,
                radius >> j,
                radius >> j,
                0,
                texture.format,
                texture.type,
                null);
            }
          }
          tempRestore();

          if (config.profile) {
            texture.stats.size = getTextureSize(
              texture.internalformat,
              texture.type,
              reglTextureCube.width,
              reglTextureCube.height,
              false,
              true);
          }

          return reglTextureCube
        }

        reglTextureCube(a0, a1, a2, a3, a4, a5);

        reglTextureCube.subimage = subimage;
        reglTextureCube.resize = resize;
        reglTextureCube._reglType = 'textureCube';
        reglTextureCube._texture = texture;
        if (config.profile) {
          reglTextureCube.stats = texture.stats;
        }
        reglTextureCube.destroy = function () {
          texture.decRef();
        };

        return reglTextureCube
      }

      // Called when regl is destroyed
      function destroyTextures () {
        for (var i = 0; i < numTexUnits; ++i) {
          gl.activeTexture(GL_TEXTURE0$1 + i);
          gl.bindTexture(GL_TEXTURE_2D$1, null);
          textureUnits[i] = null;
        }
        values(textureSet).forEach(destroy);

        stats.cubeCount = 0;
        stats.textureCount = 0;
      }

      if (config.profile) {
        stats.getTotalTextureSize = function () {
          var total = 0;
          Object.keys(textureSet).forEach(function (key) {
            total += textureSet[key].stats.size;
          });
          return total
        };
      }

      function restoreTextures () {
        for (var i = 0; i < numTexUnits; ++i) {
          var tex = textureUnits[i];
          if (tex) {
            tex.bindCount = 0;
            tex.unit = -1;
            textureUnits[i] = null;
          }
        }

        values(textureSet).forEach(function (texture) {
          texture.texture = gl.createTexture();
          gl.bindTexture(texture.target, texture.texture);
          for (var i = 0; i < 32; ++i) {
            if ((texture.mipmask & (1 << i)) === 0) {
              continue
            }
            if (texture.target === GL_TEXTURE_2D$1) {
              gl.texImage2D(GL_TEXTURE_2D$1,
                i,
                texture.internalformat,
                texture.width >> i,
                texture.height >> i,
                0,
                texture.internalformat,
                texture.type,
                null);
            } else {
              for (var j = 0; j < 6; ++j) {
                gl.texImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + j,
                  i,
                  texture.internalformat,
                  texture.width >> i,
                  texture.height >> i,
                  0,
                  texture.internalformat,
                  texture.type,
                  null);
              }
            }
          }
          setTexInfo(texture.texInfo, texture.target);
        });
      }

      return {
        create2D: createTexture2D,
        createCube: createTextureCube,
        clear: destroyTextures,
        getTexture: function (wrapper) {
          return null
        },
        restore: restoreTextures
      }
    }

    var GL_RENDERBUFFER = 0x8D41;

    var GL_RGBA4$1 = 0x8056;
    var GL_RGB5_A1$1 = 0x8057;
    var GL_RGB565$1 = 0x8D62;
    var GL_DEPTH_COMPONENT16 = 0x81A5;
    var GL_STENCIL_INDEX8 = 0x8D48;
    var GL_DEPTH_STENCIL$1 = 0x84F9;

    var GL_SRGB8_ALPHA8_EXT = 0x8C43;

    var GL_RGBA32F_EXT = 0x8814;

    var GL_RGBA16F_EXT = 0x881A;
    var GL_RGB16F_EXT = 0x881B;

    var FORMAT_SIZES = [];

    FORMAT_SIZES[GL_RGBA4$1] = 2;
    FORMAT_SIZES[GL_RGB5_A1$1] = 2;
    FORMAT_SIZES[GL_RGB565$1] = 2;

    FORMAT_SIZES[GL_DEPTH_COMPONENT16] = 2;
    FORMAT_SIZES[GL_STENCIL_INDEX8] = 1;
    FORMAT_SIZES[GL_DEPTH_STENCIL$1] = 4;

    FORMAT_SIZES[GL_SRGB8_ALPHA8_EXT] = 4;
    FORMAT_SIZES[GL_RGBA32F_EXT] = 16;
    FORMAT_SIZES[GL_RGBA16F_EXT] = 8;
    FORMAT_SIZES[GL_RGB16F_EXT] = 6;

    function getRenderbufferSize (format, width, height) {
      return FORMAT_SIZES[format] * width * height
    }

    var wrapRenderbuffers = function (gl, extensions, limits, stats, config) {
      var formatTypes = {
        'rgba4': GL_RGBA4$1,
        'rgb565': GL_RGB565$1,
        'rgb5 a1': GL_RGB5_A1$1,
        'depth': GL_DEPTH_COMPONENT16,
        'stencil': GL_STENCIL_INDEX8,
        'depth stencil': GL_DEPTH_STENCIL$1
      };

      if (extensions.ext_srgb) {
        formatTypes['srgba'] = GL_SRGB8_ALPHA8_EXT;
      }

      if (extensions.ext_color_buffer_half_float) {
        formatTypes['rgba16f'] = GL_RGBA16F_EXT;
        formatTypes['rgb16f'] = GL_RGB16F_EXT;
      }

      if (extensions.webgl_color_buffer_float) {
        formatTypes['rgba32f'] = GL_RGBA32F_EXT;
      }

      var formatTypesInvert = [];
      Object.keys(formatTypes).forEach(function (key) {
        var val = formatTypes[key];
        formatTypesInvert[val] = key;
      });

      var renderbufferCount = 0;
      var renderbufferSet = {};

      function REGLRenderbuffer (renderbuffer) {
        this.id = renderbufferCount++;
        this.refCount = 1;

        this.renderbuffer = renderbuffer;

        this.format = GL_RGBA4$1;
        this.width = 0;
        this.height = 0;

        if (config.profile) {
          this.stats = { size: 0 };
        }
      }

      REGLRenderbuffer.prototype.decRef = function () {
        if (--this.refCount <= 0) {
          destroy(this);
        }
      };

      function destroy (rb) {
        var handle = rb.renderbuffer;
        check$1(handle, 'must not double destroy renderbuffer');
        gl.bindRenderbuffer(GL_RENDERBUFFER, null);
        gl.deleteRenderbuffer(handle);
        rb.renderbuffer = null;
        rb.refCount = 0;
        delete renderbufferSet[rb.id];
        stats.renderbufferCount--;
      }

      function createRenderbuffer (a, b) {
        var renderbuffer = new REGLRenderbuffer(gl.createRenderbuffer());
        renderbufferSet[renderbuffer.id] = renderbuffer;
        stats.renderbufferCount++;

        function reglRenderbuffer (a, b) {
          var w = 0;
          var h = 0;
          var format = GL_RGBA4$1;

          if (typeof a === 'object' && a) {
            var options = a;
            if ('shape' in options) {
              var shape = options.shape;
              check$1(Array.isArray(shape) && shape.length >= 2,
                'invalid renderbuffer shape');
              w = shape[0] | 0;
              h = shape[1] | 0;
            } else {
              if ('radius' in options) {
                w = h = options.radius | 0;
              }
              if ('width' in options) {
                w = options.width | 0;
              }
              if ('height' in options) {
                h = options.height | 0;
              }
            }
            if ('format' in options) {
              check$1.parameter(options.format, formatTypes,
                'invalid renderbuffer format');
              format = formatTypes[options.format];
            }
          } else if (typeof a === 'number') {
            w = a | 0;
            if (typeof b === 'number') {
              h = b | 0;
            } else {
              h = w;
            }
          } else if (!a) {
            w = h = 1;
          } else {
            check$1.raise('invalid arguments to renderbuffer constructor');
          }

          // check shape
          check$1(
            w > 0 && h > 0 &&
            w <= limits.maxRenderbufferSize && h <= limits.maxRenderbufferSize,
            'invalid renderbuffer size');

          if (w === renderbuffer.width &&
              h === renderbuffer.height &&
              format === renderbuffer.format) {
            return
          }

          reglRenderbuffer.width = renderbuffer.width = w;
          reglRenderbuffer.height = renderbuffer.height = h;
          renderbuffer.format = format;

          gl.bindRenderbuffer(GL_RENDERBUFFER, renderbuffer.renderbuffer);
          gl.renderbufferStorage(GL_RENDERBUFFER, format, w, h);

          check$1(
            gl.getError() === 0,
            'invalid render buffer format');

          if (config.profile) {
            renderbuffer.stats.size = getRenderbufferSize(renderbuffer.format, renderbuffer.width, renderbuffer.height);
          }
          reglRenderbuffer.format = formatTypesInvert[renderbuffer.format];

          return reglRenderbuffer
        }

        function resize (w_, h_) {
          var w = w_ | 0;
          var h = (h_ | 0) || w;

          if (w === renderbuffer.width && h === renderbuffer.height) {
            return reglRenderbuffer
          }

          // check shape
          check$1(
            w > 0 && h > 0 &&
            w <= limits.maxRenderbufferSize && h <= limits.maxRenderbufferSize,
            'invalid renderbuffer size');

          reglRenderbuffer.width = renderbuffer.width = w;
          reglRenderbuffer.height = renderbuffer.height = h;

          gl.bindRenderbuffer(GL_RENDERBUFFER, renderbuffer.renderbuffer);
          gl.renderbufferStorage(GL_RENDERBUFFER, renderbuffer.format, w, h);

          check$1(
            gl.getError() === 0,
            'invalid render buffer format');

          // also, recompute size.
          if (config.profile) {
            renderbuffer.stats.size = getRenderbufferSize(
              renderbuffer.format, renderbuffer.width, renderbuffer.height);
          }

          return reglRenderbuffer
        }

        reglRenderbuffer(a, b);

        reglRenderbuffer.resize = resize;
        reglRenderbuffer._reglType = 'renderbuffer';
        reglRenderbuffer._renderbuffer = renderbuffer;
        if (config.profile) {
          reglRenderbuffer.stats = renderbuffer.stats;
        }
        reglRenderbuffer.destroy = function () {
          renderbuffer.decRef();
        };

        return reglRenderbuffer
      }

      if (config.profile) {
        stats.getTotalRenderbufferSize = function () {
          var total = 0;
          Object.keys(renderbufferSet).forEach(function (key) {
            total += renderbufferSet[key].stats.size;
          });
          return total
        };
      }

      function restoreRenderbuffers () {
        values(renderbufferSet).forEach(function (rb) {
          rb.renderbuffer = gl.createRenderbuffer();
          gl.bindRenderbuffer(GL_RENDERBUFFER, rb.renderbuffer);
          gl.renderbufferStorage(GL_RENDERBUFFER, rb.format, rb.width, rb.height);
        });
        gl.bindRenderbuffer(GL_RENDERBUFFER, null);
      }

      return {
        create: createRenderbuffer,
        clear: function () {
          values(renderbufferSet).forEach(destroy);
        },
        restore: restoreRenderbuffers
      }
    };

    // We store these constants so that the minifier can inline them
    var GL_FRAMEBUFFER$1 = 0x8D40;
    var GL_RENDERBUFFER$1 = 0x8D41;

    var GL_TEXTURE_2D$2 = 0x0DE1;
    var GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 = 0x8515;

    var GL_COLOR_ATTACHMENT0$1 = 0x8CE0;
    var GL_DEPTH_ATTACHMENT = 0x8D00;
    var GL_STENCIL_ATTACHMENT = 0x8D20;
    var GL_DEPTH_STENCIL_ATTACHMENT = 0x821A;

    var GL_FRAMEBUFFER_COMPLETE$1 = 0x8CD5;
    var GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT = 0x8CD6;
    var GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = 0x8CD7;
    var GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS = 0x8CD9;
    var GL_FRAMEBUFFER_UNSUPPORTED = 0x8CDD;

    var GL_HALF_FLOAT_OES$2 = 0x8D61;
    var GL_UNSIGNED_BYTE$6 = 0x1401;
    var GL_FLOAT$5 = 0x1406;

    var GL_RGB$1 = 0x1907;
    var GL_RGBA$2 = 0x1908;

    var GL_DEPTH_COMPONENT$1 = 0x1902;

    var colorTextureFormatEnums = [
      GL_RGB$1,
      GL_RGBA$2
    ];

    // for every texture format, store
    // the number of channels
    var textureFormatChannels = [];
    textureFormatChannels[GL_RGBA$2] = 4;
    textureFormatChannels[GL_RGB$1] = 3;

    // for every texture type, store
    // the size in bytes.
    var textureTypeSizes = [];
    textureTypeSizes[GL_UNSIGNED_BYTE$6] = 1;
    textureTypeSizes[GL_FLOAT$5] = 4;
    textureTypeSizes[GL_HALF_FLOAT_OES$2] = 2;

    var GL_RGBA4$2 = 0x8056;
    var GL_RGB5_A1$2 = 0x8057;
    var GL_RGB565$2 = 0x8D62;
    var GL_DEPTH_COMPONENT16$1 = 0x81A5;
    var GL_STENCIL_INDEX8$1 = 0x8D48;
    var GL_DEPTH_STENCIL$2 = 0x84F9;

    var GL_SRGB8_ALPHA8_EXT$1 = 0x8C43;

    var GL_RGBA32F_EXT$1 = 0x8814;

    var GL_RGBA16F_EXT$1 = 0x881A;
    var GL_RGB16F_EXT$1 = 0x881B;

    var colorRenderbufferFormatEnums = [
      GL_RGBA4$2,
      GL_RGB5_A1$2,
      GL_RGB565$2,
      GL_SRGB8_ALPHA8_EXT$1,
      GL_RGBA16F_EXT$1,
      GL_RGB16F_EXT$1,
      GL_RGBA32F_EXT$1
    ];

    var statusCode = {};
    statusCode[GL_FRAMEBUFFER_COMPLETE$1] = 'complete';
    statusCode[GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT] = 'incomplete attachment';
    statusCode[GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS] = 'incomplete dimensions';
    statusCode[GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT] = 'incomplete, missing attachment';
    statusCode[GL_FRAMEBUFFER_UNSUPPORTED] = 'unsupported';

    function wrapFBOState (
      gl,
      extensions,
      limits,
      textureState,
      renderbufferState,
      stats) {
      var framebufferState = {
        cur: null,
        next: null,
        dirty: false,
        setFBO: null
      };

      var colorTextureFormats = ['rgba'];
      var colorRenderbufferFormats = ['rgba4', 'rgb565', 'rgb5 a1'];

      if (extensions.ext_srgb) {
        colorRenderbufferFormats.push('srgba');
      }

      if (extensions.ext_color_buffer_half_float) {
        colorRenderbufferFormats.push('rgba16f', 'rgb16f');
      }

      if (extensions.webgl_color_buffer_float) {
        colorRenderbufferFormats.push('rgba32f');
      }

      var colorTypes = ['uint8'];
      if (extensions.oes_texture_half_float) {
        colorTypes.push('half float', 'float16');
      }
      if (extensions.oes_texture_float) {
        colorTypes.push('float', 'float32');
      }

      function FramebufferAttachment (target, texture, renderbuffer) {
        this.target = target;
        this.texture = texture;
        this.renderbuffer = renderbuffer;

        var w = 0;
        var h = 0;
        if (texture) {
          w = texture.width;
          h = texture.height;
        } else if (renderbuffer) {
          w = renderbuffer.width;
          h = renderbuffer.height;
        }
        this.width = w;
        this.height = h;
      }

      function decRef (attachment) {
        if (attachment) {
          if (attachment.texture) {
            attachment.texture._texture.decRef();
          }
          if (attachment.renderbuffer) {
            attachment.renderbuffer._renderbuffer.decRef();
          }
        }
      }

      function incRefAndCheckShape (attachment, width, height) {
        if (!attachment) {
          return
        }
        if (attachment.texture) {
          var texture = attachment.texture._texture;
          var tw = Math.max(1, texture.width);
          var th = Math.max(1, texture.height);
          check$1(tw === width && th === height,
            'inconsistent width/height for supplied texture');
          texture.refCount += 1;
        } else {
          var renderbuffer = attachment.renderbuffer._renderbuffer;
          check$1(
            renderbuffer.width === width && renderbuffer.height === height,
            'inconsistent width/height for renderbuffer');
          renderbuffer.refCount += 1;
        }
      }

      function attach (location, attachment) {
        if (attachment) {
          if (attachment.texture) {
            gl.framebufferTexture2D(
              GL_FRAMEBUFFER$1,
              location,
              attachment.target,
              attachment.texture._texture.texture,
              0);
          } else {
            gl.framebufferRenderbuffer(
              GL_FRAMEBUFFER$1,
              location,
              GL_RENDERBUFFER$1,
              attachment.renderbuffer._renderbuffer.renderbuffer);
          }
        }
      }

      function parseAttachment (attachment) {
        var target = GL_TEXTURE_2D$2;
        var texture = null;
        var renderbuffer = null;

        var data = attachment;
        if (typeof attachment === 'object') {
          data = attachment.data;
          if ('target' in attachment) {
            target = attachment.target | 0;
          }
        }

        check$1.type(data, 'function', 'invalid attachment data');

        var type = data._reglType;
        if (type === 'texture2d') {
          texture = data;
          check$1(target === GL_TEXTURE_2D$2);
        } else if (type === 'textureCube') {
          texture = data;
          check$1(
            target >= GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 &&
            target < GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 + 6,
            'invalid cube map target');
        } else if (type === 'renderbuffer') {
          renderbuffer = data;
          target = GL_RENDERBUFFER$1;
        } else {
          check$1.raise('invalid regl object for attachment');
        }

        return new FramebufferAttachment(target, texture, renderbuffer)
      }

      function allocAttachment (
        width,
        height,
        isTexture,
        format,
        type) {
        if (isTexture) {
          var texture = textureState.create2D({
            width: width,
            height: height,
            format: format,
            type: type
          });
          texture._texture.refCount = 0;
          return new FramebufferAttachment(GL_TEXTURE_2D$2, texture, null)
        } else {
          var rb = renderbufferState.create({
            width: width,
            height: height,
            format: format
          });
          rb._renderbuffer.refCount = 0;
          return new FramebufferAttachment(GL_RENDERBUFFER$1, null, rb)
        }
      }

      function unwrapAttachment (attachment) {
        return attachment && (attachment.texture || attachment.renderbuffer)
      }

      function resizeAttachment (attachment, w, h) {
        if (attachment) {
          if (attachment.texture) {
            attachment.texture.resize(w, h);
          } else if (attachment.renderbuffer) {
            attachment.renderbuffer.resize(w, h);
          }
          attachment.width = w;
          attachment.height = h;
        }
      }

      var framebufferCount = 0;
      var framebufferSet = {};

      function REGLFramebuffer () {
        this.id = framebufferCount++;
        framebufferSet[this.id] = this;

        this.framebuffer = gl.createFramebuffer();
        this.width = 0;
        this.height = 0;

        this.colorAttachments = [];
        this.depthAttachment = null;
        this.stencilAttachment = null;
        this.depthStencilAttachment = null;
      }

      function decFBORefs (framebuffer) {
        framebuffer.colorAttachments.forEach(decRef);
        decRef(framebuffer.depthAttachment);
        decRef(framebuffer.stencilAttachment);
        decRef(framebuffer.depthStencilAttachment);
      }

      function destroy (framebuffer) {
        var handle = framebuffer.framebuffer;
        check$1(handle, 'must not double destroy framebuffer');
        gl.deleteFramebuffer(handle);
        framebuffer.framebuffer = null;
        stats.framebufferCount--;
        delete framebufferSet[framebuffer.id];
      }

      function updateFramebuffer (framebuffer) {
        var i;

        gl.bindFramebuffer(GL_FRAMEBUFFER$1, framebuffer.framebuffer);
        var colorAttachments = framebuffer.colorAttachments;
        for (i = 0; i < colorAttachments.length; ++i) {
          attach(GL_COLOR_ATTACHMENT0$1 + i, colorAttachments[i]);
        }
        for (i = colorAttachments.length; i < limits.maxColorAttachments; ++i) {
          gl.framebufferTexture2D(
            GL_FRAMEBUFFER$1,
            GL_COLOR_ATTACHMENT0$1 + i,
            GL_TEXTURE_2D$2,
            null,
            0);
        }

        gl.framebufferTexture2D(
          GL_FRAMEBUFFER$1,
          GL_DEPTH_STENCIL_ATTACHMENT,
          GL_TEXTURE_2D$2,
          null,
          0);
        gl.framebufferTexture2D(
          GL_FRAMEBUFFER$1,
          GL_DEPTH_ATTACHMENT,
          GL_TEXTURE_2D$2,
          null,
          0);
        gl.framebufferTexture2D(
          GL_FRAMEBUFFER$1,
          GL_STENCIL_ATTACHMENT,
          GL_TEXTURE_2D$2,
          null,
          0);

        attach(GL_DEPTH_ATTACHMENT, framebuffer.depthAttachment);
        attach(GL_STENCIL_ATTACHMENT, framebuffer.stencilAttachment);
        attach(GL_DEPTH_STENCIL_ATTACHMENT, framebuffer.depthStencilAttachment);

        // Check status code
        var status = gl.checkFramebufferStatus(GL_FRAMEBUFFER$1);
        if (!gl.isContextLost() && status !== GL_FRAMEBUFFER_COMPLETE$1) {
          check$1.raise('framebuffer configuration not supported, status = ' +
            statusCode[status]);
        }

        gl.bindFramebuffer(GL_FRAMEBUFFER$1, framebufferState.next ? framebufferState.next.framebuffer : null);
        framebufferState.cur = framebufferState.next;

        // FIXME: Clear error code here.  This is a work around for a bug in
        // headless-gl
        gl.getError();
      }

      function createFBO (a0, a1) {
        var framebuffer = new REGLFramebuffer();
        stats.framebufferCount++;

        function reglFramebuffer (a, b) {
          var i;

          check$1(framebufferState.next !== framebuffer,
            'can not update framebuffer which is currently in use');

          var width = 0;
          var height = 0;

          var needsDepth = true;
          var needsStencil = true;

          var colorBuffer = null;
          var colorTexture = true;
          var colorFormat = 'rgba';
          var colorType = 'uint8';
          var colorCount = 1;

          var depthBuffer = null;
          var stencilBuffer = null;
          var depthStencilBuffer = null;
          var depthStencilTexture = false;

          if (typeof a === 'number') {
            width = a | 0;
            height = (b | 0) || width;
          } else if (!a) {
            width = height = 1;
          } else {
            check$1.type(a, 'object', 'invalid arguments for framebuffer');
            var options = a;

            if ('shape' in options) {
              var shape = options.shape;
              check$1(Array.isArray(shape) && shape.length >= 2,
                'invalid shape for framebuffer');
              width = shape[0];
              height = shape[1];
            } else {
              if ('radius' in options) {
                width = height = options.radius;
              }
              if ('width' in options) {
                width = options.width;
              }
              if ('height' in options) {
                height = options.height;
              }
            }

            if ('color' in options ||
                'colors' in options) {
              colorBuffer =
                options.color ||
                options.colors;
              if (Array.isArray(colorBuffer)) {
                check$1(
                  colorBuffer.length === 1 || extensions.webgl_draw_buffers,
                  'multiple render targets not supported');
              }
            }

            if (!colorBuffer) {
              if ('colorCount' in options) {
                colorCount = options.colorCount | 0;
                check$1(colorCount > 0, 'invalid color buffer count');
              }

              if ('colorTexture' in options) {
                colorTexture = !!options.colorTexture;
                colorFormat = 'rgba4';
              }

              if ('colorType' in options) {
                colorType = options.colorType;
                if (!colorTexture) {
                  if (colorType === 'half float' || colorType === 'float16') {
                    check$1(extensions.ext_color_buffer_half_float,
                      'you must enable EXT_color_buffer_half_float to use 16-bit render buffers');
                    colorFormat = 'rgba16f';
                  } else if (colorType === 'float' || colorType === 'float32') {
                    check$1(extensions.webgl_color_buffer_float,
                      'you must enable WEBGL_color_buffer_float in order to use 32-bit floating point renderbuffers');
                    colorFormat = 'rgba32f';
                  }
                } else {
                  check$1(extensions.oes_texture_float ||
                    !(colorType === 'float' || colorType === 'float32'),
                  'you must enable OES_texture_float in order to use floating point framebuffer objects');
                  check$1(extensions.oes_texture_half_float ||
                    !(colorType === 'half float' || colorType === 'float16'),
                  'you must enable OES_texture_half_float in order to use 16-bit floating point framebuffer objects');
                }
                check$1.oneOf(colorType, colorTypes, 'invalid color type');
              }

              if ('colorFormat' in options) {
                colorFormat = options.colorFormat;
                if (colorTextureFormats.indexOf(colorFormat) >= 0) {
                  colorTexture = true;
                } else if (colorRenderbufferFormats.indexOf(colorFormat) >= 0) {
                  colorTexture = false;
                } else {
                  if (colorTexture) {
                    check$1.oneOf(
                      options.colorFormat, colorTextureFormats,
                      'invalid color format for texture');
                  } else {
                    check$1.oneOf(
                      options.colorFormat, colorRenderbufferFormats,
                      'invalid color format for renderbuffer');
                  }
                }
              }
            }

            if ('depthTexture' in options || 'depthStencilTexture' in options) {
              depthStencilTexture = !!(options.depthTexture ||
                options.depthStencilTexture);
              check$1(!depthStencilTexture || extensions.webgl_depth_texture,
                'webgl_depth_texture extension not supported');
            }

            if ('depth' in options) {
              if (typeof options.depth === 'boolean') {
                needsDepth = options.depth;
              } else {
                depthBuffer = options.depth;
                needsStencil = false;
              }
            }

            if ('stencil' in options) {
              if (typeof options.stencil === 'boolean') {
                needsStencil = options.stencil;
              } else {
                stencilBuffer = options.stencil;
                needsDepth = false;
              }
            }

            if ('depthStencil' in options) {
              if (typeof options.depthStencil === 'boolean') {
                needsDepth = needsStencil = options.depthStencil;
              } else {
                depthStencilBuffer = options.depthStencil;
                needsDepth = false;
                needsStencil = false;
              }
            }
          }

          // parse attachments
          var colorAttachments = null;
          var depthAttachment = null;
          var stencilAttachment = null;
          var depthStencilAttachment = null;

          // Set up color attachments
          if (Array.isArray(colorBuffer)) {
            colorAttachments = colorBuffer.map(parseAttachment);
          } else if (colorBuffer) {
            colorAttachments = [parseAttachment(colorBuffer)];
          } else {
            colorAttachments = new Array(colorCount);
            for (i = 0; i < colorCount; ++i) {
              colorAttachments[i] = allocAttachment(
                width,
                height,
                colorTexture,
                colorFormat,
                colorType);
            }
          }

          check$1(extensions.webgl_draw_buffers || colorAttachments.length <= 1,
            'you must enable the WEBGL_draw_buffers extension in order to use multiple color buffers.');
          check$1(colorAttachments.length <= limits.maxColorAttachments,
            'too many color attachments, not supported');

          width = width || colorAttachments[0].width;
          height = height || colorAttachments[0].height;

          if (depthBuffer) {
            depthAttachment = parseAttachment(depthBuffer);
          } else if (needsDepth && !needsStencil) {
            depthAttachment = allocAttachment(
              width,
              height,
              depthStencilTexture,
              'depth',
              'uint32');
          }

          if (stencilBuffer) {
            stencilAttachment = parseAttachment(stencilBuffer);
          } else if (needsStencil && !needsDepth) {
            stencilAttachment = allocAttachment(
              width,
              height,
              false,
              'stencil',
              'uint8');
          }

          if (depthStencilBuffer) {
            depthStencilAttachment = parseAttachment(depthStencilBuffer);
          } else if (!depthBuffer && !stencilBuffer && needsStencil && needsDepth) {
            depthStencilAttachment = allocAttachment(
              width,
              height,
              depthStencilTexture,
              'depth stencil',
              'depth stencil');
          }

          check$1(
            (!!depthBuffer) + (!!stencilBuffer) + (!!depthStencilBuffer) <= 1,
            'invalid framebuffer configuration, can specify exactly one depth/stencil attachment');

          var commonColorAttachmentSize = null;

          for (i = 0; i < colorAttachments.length; ++i) {
            incRefAndCheckShape(colorAttachments[i], width, height);
            check$1(!colorAttachments[i] ||
              (colorAttachments[i].texture &&
                colorTextureFormatEnums.indexOf(colorAttachments[i].texture._texture.format) >= 0) ||
              (colorAttachments[i].renderbuffer &&
                colorRenderbufferFormatEnums.indexOf(colorAttachments[i].renderbuffer._renderbuffer.format) >= 0),
            'framebuffer color attachment ' + i + ' is invalid');

            if (colorAttachments[i] && colorAttachments[i].texture) {
              var colorAttachmentSize =
                  textureFormatChannels[colorAttachments[i].texture._texture.format] *
                  textureTypeSizes[colorAttachments[i].texture._texture.type];

              if (commonColorAttachmentSize === null) {
                commonColorAttachmentSize = colorAttachmentSize;
              } else {
                // We need to make sure that all color attachments have the same number of bitplanes
                // (that is, the same numer of bits per pixel)
                // This is required by the GLES2.0 standard. See the beginning of Chapter 4 in that document.
                check$1(commonColorAttachmentSize === colorAttachmentSize,
                  'all color attachments much have the same number of bits per pixel.');
              }
            }
          }
          incRefAndCheckShape(depthAttachment, width, height);
          check$1(!depthAttachment ||
            (depthAttachment.texture &&
              depthAttachment.texture._texture.format === GL_DEPTH_COMPONENT$1) ||
            (depthAttachment.renderbuffer &&
              depthAttachment.renderbuffer._renderbuffer.format === GL_DEPTH_COMPONENT16$1),
          'invalid depth attachment for framebuffer object');
          incRefAndCheckShape(stencilAttachment, width, height);
          check$1(!stencilAttachment ||
            (stencilAttachment.renderbuffer &&
              stencilAttachment.renderbuffer._renderbuffer.format === GL_STENCIL_INDEX8$1),
          'invalid stencil attachment for framebuffer object');
          incRefAndCheckShape(depthStencilAttachment, width, height);
          check$1(!depthStencilAttachment ||
            (depthStencilAttachment.texture &&
              depthStencilAttachment.texture._texture.format === GL_DEPTH_STENCIL$2) ||
            (depthStencilAttachment.renderbuffer &&
              depthStencilAttachment.renderbuffer._renderbuffer.format === GL_DEPTH_STENCIL$2),
          'invalid depth-stencil attachment for framebuffer object');

          // decrement references
          decFBORefs(framebuffer);

          framebuffer.width = width;
          framebuffer.height = height;

          framebuffer.colorAttachments = colorAttachments;
          framebuffer.depthAttachment = depthAttachment;
          framebuffer.stencilAttachment = stencilAttachment;
          framebuffer.depthStencilAttachment = depthStencilAttachment;

          reglFramebuffer.color = colorAttachments.map(unwrapAttachment);
          reglFramebuffer.depth = unwrapAttachment(depthAttachment);
          reglFramebuffer.stencil = unwrapAttachment(stencilAttachment);
          reglFramebuffer.depthStencil = unwrapAttachment(depthStencilAttachment);

          reglFramebuffer.width = framebuffer.width;
          reglFramebuffer.height = framebuffer.height;

          updateFramebuffer(framebuffer);

          return reglFramebuffer
        }

        function resize (w_, h_) {
          check$1(framebufferState.next !== framebuffer,
            'can not resize a framebuffer which is currently in use');

          var w = Math.max(w_ | 0, 1);
          var h = Math.max((h_ | 0) || w, 1);
          if (w === framebuffer.width && h === framebuffer.height) {
            return reglFramebuffer
          }

          // resize all buffers
          var colorAttachments = framebuffer.colorAttachments;
          for (var i = 0; i < colorAttachments.length; ++i) {
            resizeAttachment(colorAttachments[i], w, h);
          }
          resizeAttachment(framebuffer.depthAttachment, w, h);
          resizeAttachment(framebuffer.stencilAttachment, w, h);
          resizeAttachment(framebuffer.depthStencilAttachment, w, h);

          framebuffer.width = reglFramebuffer.width = w;
          framebuffer.height = reglFramebuffer.height = h;

          updateFramebuffer(framebuffer);

          return reglFramebuffer
        }

        reglFramebuffer(a0, a1);

        return extend(reglFramebuffer, {
          resize: resize,
          _reglType: 'framebuffer',
          _framebuffer: framebuffer,
          destroy: function () {
            destroy(framebuffer);
            decFBORefs(framebuffer);
          },
          use: function (block) {
            framebufferState.setFBO({
              framebuffer: reglFramebuffer
            }, block);
          }
        })
      }

      function createCubeFBO (options) {
        var faces = Array(6);

        function reglFramebufferCube (a) {
          var i;

          check$1(faces.indexOf(framebufferState.next) < 0,
            'can not update framebuffer which is currently in use');

          var params = {
            color: null
          };

          var radius = 0;

          var colorBuffer = null;
          var colorFormat = 'rgba';
          var colorType = 'uint8';
          var colorCount = 1;

          if (typeof a === 'number') {
            radius = a | 0;
          } else if (!a) {
            radius = 1;
          } else {
            check$1.type(a, 'object', 'invalid arguments for framebuffer');
            var options = a;

            if ('shape' in options) {
              var shape = options.shape;
              check$1(
                Array.isArray(shape) && shape.length >= 2,
                'invalid shape for framebuffer');
              check$1(
                shape[0] === shape[1],
                'cube framebuffer must be square');
              radius = shape[0];
            } else {
              if ('radius' in options) {
                radius = options.radius | 0;
              }
              if ('width' in options) {
                radius = options.width | 0;
                if ('height' in options) {
                  check$1(options.height === radius, 'must be square');
                }
              } else if ('height' in options) {
                radius = options.height | 0;
              }
            }

            if ('color' in options ||
                'colors' in options) {
              colorBuffer =
                options.color ||
                options.colors;
              if (Array.isArray(colorBuffer)) {
                check$1(
                  colorBuffer.length === 1 || extensions.webgl_draw_buffers,
                  'multiple render targets not supported');
              }
            }

            if (!colorBuffer) {
              if ('colorCount' in options) {
                colorCount = options.colorCount | 0;
                check$1(colorCount > 0, 'invalid color buffer count');
              }

              if ('colorType' in options) {
                check$1.oneOf(
                  options.colorType, colorTypes,
                  'invalid color type');
                colorType = options.colorType;
              }

              if ('colorFormat' in options) {
                colorFormat = options.colorFormat;
                check$1.oneOf(
                  options.colorFormat, colorTextureFormats,
                  'invalid color format for texture');
              }
            }

            if ('depth' in options) {
              params.depth = options.depth;
            }

            if ('stencil' in options) {
              params.stencil = options.stencil;
            }

            if ('depthStencil' in options) {
              params.depthStencil = options.depthStencil;
            }
          }

          var colorCubes;
          if (colorBuffer) {
            if (Array.isArray(colorBuffer)) {
              colorCubes = [];
              for (i = 0; i < colorBuffer.length; ++i) {
                colorCubes[i] = colorBuffer[i];
              }
            } else {
              colorCubes = [ colorBuffer ];
            }
          } else {
            colorCubes = Array(colorCount);
            var cubeMapParams = {
              radius: radius,
              format: colorFormat,
              type: colorType
            };
            for (i = 0; i < colorCount; ++i) {
              colorCubes[i] = textureState.createCube(cubeMapParams);
            }
          }

          // Check color cubes
          params.color = Array(colorCubes.length);
          for (i = 0; i < colorCubes.length; ++i) {
            var cube = colorCubes[i];
            check$1(
              typeof cube === 'function' && cube._reglType === 'textureCube',
              'invalid cube map');
            radius = radius || cube.width;
            check$1(
              cube.width === radius && cube.height === radius,
              'invalid cube map shape');
            params.color[i] = {
              target: GL_TEXTURE_CUBE_MAP_POSITIVE_X$2,
              data: colorCubes[i]
            };
          }

          for (i = 0; i < 6; ++i) {
            for (var j = 0; j < colorCubes.length; ++j) {
              params.color[j].target = GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 + i;
            }
            // reuse depth-stencil attachments across all cube maps
            if (i > 0) {
              params.depth = faces[0].depth;
              params.stencil = faces[0].stencil;
              params.depthStencil = faces[0].depthStencil;
            }
            if (faces[i]) {
              (faces[i])(params);
            } else {
              faces[i] = createFBO(params);
            }
          }

          return extend(reglFramebufferCube, {
            width: radius,
            height: radius,
            color: colorCubes
          })
        }

        function resize (radius_) {
          var i;
          var radius = radius_ | 0;
          check$1(radius > 0 && radius <= limits.maxCubeMapSize,
            'invalid radius for cube fbo');

          if (radius === reglFramebufferCube.width) {
            return reglFramebufferCube
          }

          var colors = reglFramebufferCube.color;
          for (i = 0; i < colors.length; ++i) {
            colors[i].resize(radius);
          }

          for (i = 0; i < 6; ++i) {
            faces[i].resize(radius);
          }

          reglFramebufferCube.width = reglFramebufferCube.height = radius;

          return reglFramebufferCube
        }

        reglFramebufferCube(options);

        return extend(reglFramebufferCube, {
          faces: faces,
          resize: resize,
          _reglType: 'framebufferCube',
          destroy: function () {
            faces.forEach(function (f) {
              f.destroy();
            });
          }
        })
      }

      function restoreFramebuffers () {
        framebufferState.cur = null;
        framebufferState.next = null;
        framebufferState.dirty = true;
        values(framebufferSet).forEach(function (fb) {
          fb.framebuffer = gl.createFramebuffer();
          updateFramebuffer(fb);
        });
      }

      return extend(framebufferState, {
        getFramebuffer: function (object) {
          if (typeof object === 'function' && object._reglType === 'framebuffer') {
            var fbo = object._framebuffer;
            if (fbo instanceof REGLFramebuffer) {
              return fbo
            }
          }
          return null
        },
        create: createFBO,
        createCube: createCubeFBO,
        clear: function () {
          values(framebufferSet).forEach(destroy);
        },
        restore: restoreFramebuffers
      })
    }

    var GL_FLOAT$6 = 5126;
    var GL_ARRAY_BUFFER$1 = 34962;

    function AttributeRecord () {
      this.state = 0;

      this.x = 0.0;
      this.y = 0.0;
      this.z = 0.0;
      this.w = 0.0;

      this.buffer = null;
      this.size = 0;
      this.normalized = false;
      this.type = GL_FLOAT$6;
      this.offset = 0;
      this.stride = 0;
      this.divisor = 0;
    }

    function wrapAttributeState (
      gl,
      extensions,
      limits,
      stats,
      bufferState) {
      var NUM_ATTRIBUTES = limits.maxAttributes;
      var attributeBindings = new Array(NUM_ATTRIBUTES);
      for (var i = 0; i < NUM_ATTRIBUTES; ++i) {
        attributeBindings[i] = new AttributeRecord();
      }
      var vaoCount = 0;
      var vaoSet = {};

      var state = {
        Record: AttributeRecord,
        scope: {},
        state: attributeBindings,
        currentVAO: null,
        targetVAO: null,
        restore: extVAO() ? restoreVAO : function () {},
        createVAO: createVAO,
        getVAO: getVAO,
        destroyBuffer: destroyBuffer,
        setVAO: extVAO() ? setVAOEXT : setVAOEmulated,
        clear: extVAO() ? destroyVAOEXT : function () {}
      };

      function destroyBuffer (buffer) {
        for (var i = 0; i < attributeBindings.length; ++i) {
          var record = attributeBindings[i];
          if (record.buffer === buffer) {
            gl.disableVertexAttribArray(i);
            record.buffer = null;
          }
        }
      }

      function extVAO () {
        return extensions.oes_vertex_array_object
      }

      function extInstanced () {
        return extensions.angle_instanced_arrays
      }

      function getVAO (vao) {
        if (typeof vao === 'function' && vao._vao) {
          return vao._vao
        }
        return null
      }

      function setVAOEXT (vao) {
        if (vao === state.currentVAO) {
          return
        }
        var ext = extVAO();
        if (vao) {
          ext.bindVertexArrayOES(vao.vao);
        } else {
          ext.bindVertexArrayOES(null);
        }
        state.currentVAO = vao;
      }

      function setVAOEmulated (vao) {
        if (vao === state.currentVAO) {
          return
        }
        if (vao) {
          vao.bindAttrs();
        } else {
          var exti = extInstanced();
          for (let i = 0; i < attributeBindings.length; ++i) {
            var binding = attributeBindings[i];
            if (binding.buffer) {
              gl.enableVertexAttribArray(i);
              gl.vertexAttribPointer(i, binding.size, binding.type, binding.normalized, binding.stride, binding.offfset);
              if (exti) {
                exti.vertexAttribDivisorANGLE(i, binding.divisor);
              }
            } else {
              gl.disableVertexAttribArray(i);
              gl.vertexAttrib4f(i, binding.x, binding.y, binding.z, binding.w);
            }
          }
        }
        state.currentVAO = vao;
      }

      function destroyVAOEXT (vao) {
        values(vaoSet).forEach((vao) => {
          vao.destroy();
        });
      }

      function REGLVAO () {
        this.id = ++vaoCount;
        this.attributes = [];
        var extension = extVAO();
        if (extension) {
          this.vao = extension.createVertexArrayOES();
        } else {
          this.vao = null;
        }
        vaoSet[this.id] = this;
        this.buffers = [];
      }

      REGLVAO.prototype.bindAttrs = function () {
        var exti = extInstanced();
        var attributes = this.attributes;
        for (var i = 0; i < attributes.length; ++i) {
          var attr = attributes[i];
          if (attr.buffer) {
            gl.enableVertexAttribArray(i);
            gl.bindBuffer(GL_ARRAY_BUFFER$1, attr.buffer.buffer);
            gl.vertexAttribPointer(i, attr.size, attr.type, attr.normalized, attr.stride, attr.offset);
            if (exti) {
              exti.vertexAttribDivisorANGLE(i, attr.divisor);
            }
          } else {
            gl.disableVertexAttribArray(i);
            gl.vertexAttrib4f(i, attr.x, attr.y, attr.z, attr.w);
          }
        }
        for (var j = attributes.length; j < NUM_ATTRIBUTES; ++j) {
          gl.disableVertexAttribArray(j);
        }
      };

      REGLVAO.prototype.refresh = function () {
        var ext = extVAO();
        if (ext) {
          ext.bindVertexArrayOES(this.vao);
          this.bindAttrs();
          state.currentVAO = this;
        }
      };

      REGLVAO.prototype.destroy = function () {
        if (this.vao) {
          var extension = extVAO();
          if (this === state.currentVAO) {
            state.currentVAO = null;
            extension.bindVertexArrayOES(null);
          }
          extension.deleteVertexArrayOES(this.vao);
          this.vao = null;
        }
        if (vaoSet[this.id]) {
          delete vaoSet[this.id];
          stats.vaoCount -= 1;
        }
      };

      function restoreVAO () {
        var ext = extVAO();
        if (ext) {
          values(vaoSet).forEach(function (vao) {
            vao.refresh();
          });
        }
      }

      function createVAO (_attr) {
        var vao = new REGLVAO();
        stats.vaoCount += 1;

        function updateVAO (attributes) {
          check$1(Array.isArray(attributes), 'arguments to vertex array constructor must be an array');
          check$1(attributes.length < NUM_ATTRIBUTES, 'too many attributes');
          check$1(attributes.length > 0, 'must specify at least one attribute');

          for (var j = 0; j < vao.buffers.length; ++j) {
            vao.buffers[j].destroy();
          }
          vao.buffers.length = 0;

          var nattributes = vao.attributes;
          nattributes.length = attributes.length;
          for (var i = 0; i < attributes.length; ++i) {
            var spec = attributes[i];
            var rec = nattributes[i] = new AttributeRecord();
            if (Array.isArray(spec) || isTypedArray(spec) || isNDArrayLike(spec)) {
              var buf = bufferState.create(spec, GL_ARRAY_BUFFER$1, false, true);
              rec.buffer = bufferState.getBuffer(buf);
              rec.size = rec.buffer.dimension | 0;
              rec.normalized = false;
              rec.type = rec.buffer.dtype;
              rec.offset = 0;
              rec.stride = 0;
              rec.divisor = 0;
              rec.state = 1;
              vao.buffers.push(buf);
            } else if (bufferState.getBuffer(spec)) {
              rec.buffer = bufferState.getBuffer(spec);
              rec.size = rec.buffer.dimension | 0;
              rec.normalized = false;
              rec.type = rec.buffer.dtype;
              rec.offset = 0;
              rec.stride = 0;
              rec.divisor = 0;
              rec.state = 1;
            } else if (bufferState.getBuffer(spec.buffer)) {
              rec.buffer = bufferState.getBuffer(spec.buffer);
              rec.size = ((+spec.size) || rec.buffer.dimension) | 0;
              rec.normalized = !!spec.normalized || false;
              if ('type' in spec) {
                check$1.parameter(spec.type, glTypes, 'invalid buffer type');
                rec.type = glTypes[spec.type];
              } else {
                rec.type = rec.buffer.dtype;
              }
              rec.offset = (spec.offset || 0) | 0;
              rec.stride = (spec.stride || 0) | 0;
              rec.divisor = (spec.divisor || 0) | 0;
              rec.state = 1;

              check$1(rec.size >= 1 && rec.size <= 4, 'size must be between 1 and 4');
              check$1(rec.offset >= 0, 'invalid offset');
              check$1(rec.stride >= 0 && rec.stride <= 255, 'stride must be between 0 and 255');
              check$1(rec.divisor >= 0, 'divisor must be positive');
              check$1(!rec.divisor || !!extensions.angle_instanced_arrays, 'ANGLE_instanced_arrays must be enabled to use divisor');
            } else if ('x' in spec) {
              check$1(i > 0, 'first attribute must not be a constant');
              rec.x = +spec.x || 0;
              rec.y = +spec.y || 0;
              rec.z = +spec.z || 0;
              rec.w = +spec.w || 0;
              rec.state = 2;
            } else {
              check$1(false, 'invalid attribute spec for location ' + i);
            }
          }

          vao.refresh();
          return updateVAO
        }

        updateVAO.destroy = function () {
          vao.destroy();
        };

        updateVAO._vao = vao;
        updateVAO._reglType = 'vao';

        return updateVAO(_attr)
      }

      return state
    }

    var GL_FRAGMENT_SHADER = 35632;
    var GL_VERTEX_SHADER = 35633;

    var GL_ACTIVE_UNIFORMS = 0x8B86;
    var GL_ACTIVE_ATTRIBUTES = 0x8B89;

    function wrapShaderState (gl, stringStore, stats, config) {
      // ===================================================
      // glsl compilation and linking
      // ===================================================
      var fragShaders = {};
      var vertShaders = {};

      function ActiveInfo (name, id, location, info) {
        this.name = name;
        this.id = id;
        this.location = location;
        this.info = info;
      }

      function insertActiveInfo (list, info) {
        for (var i = 0; i < list.length; ++i) {
          if (list[i].id === info.id) {
            list[i].location = info.location;
            return
          }
        }
        list.push(info);
      }

      function getShader (type, id, command) {
        var cache = type === GL_FRAGMENT_SHADER ? fragShaders : vertShaders;
        var shader = cache[id];

        if (!shader) {
          var source = stringStore.str(id);
          shader = gl.createShader(type);
          gl.shaderSource(shader, source);
          gl.compileShader(shader);
          check$1.shaderError(gl, shader, source, type, command);
          cache[id] = shader;
        }

        return shader
      }

      // ===================================================
      // program linking
      // ===================================================
      var programCache = {};
      var programList = [];

      var PROGRAM_COUNTER = 0;

      function REGLProgram (fragId, vertId) {
        this.id = PROGRAM_COUNTER++;
        this.fragId = fragId;
        this.vertId = vertId;
        this.program = null;
        this.uniforms = [];
        this.attributes = [];

        if (config.profile) {
          this.stats = {
            uniformsCount: 0,
            attributesCount: 0
          };
        }
      }

      function linkProgram (desc, command, attributeLocations) {
        var i, info;

        // -------------------------------
        // compile & link
        // -------------------------------
        var fragShader = getShader(GL_FRAGMENT_SHADER, desc.fragId);
        var vertShader = getShader(GL_VERTEX_SHADER, desc.vertId);

        var program = desc.program = gl.createProgram();
        gl.attachShader(program, fragShader);
        gl.attachShader(program, vertShader);
        if (attributeLocations) {
          for (let i = 0; i < attributeLocations.length; ++i) {
            var binding = attributeLocations[i];
            gl.bindAttribLocation(program, binding[0], binding[1]);
          }
        }

        gl.linkProgram(program);
        check$1.linkError(
          gl,
          program,
          stringStore.str(desc.fragId),
          stringStore.str(desc.vertId),
          command);

        // -------------------------------
        // grab uniforms
        // -------------------------------
        var numUniforms = gl.getProgramParameter(program, GL_ACTIVE_UNIFORMS);
        if (config.profile) {
          desc.stats.uniformsCount = numUniforms;
        }
        var uniforms = desc.uniforms;
        for (i = 0; i < numUniforms; ++i) {
          info = gl.getActiveUniform(program, i);
          if (info) {
            if (info.size > 1) {
              for (var j = 0; j < info.size; ++j) {
                var name = info.name.replace('[0]', '[' + j + ']');
                insertActiveInfo(uniforms, new ActiveInfo(
                  name,
                  stringStore.id(name),
                  gl.getUniformLocation(program, name),
                  info));
              }
            } else {
              insertActiveInfo(uniforms, new ActiveInfo(
                info.name,
                stringStore.id(info.name),
                gl.getUniformLocation(program, info.name),
                info));
            }
          }
        }

        // -------------------------------
        // grab attributes
        // -------------------------------
        var numAttributes = gl.getProgramParameter(program, GL_ACTIVE_ATTRIBUTES);
        if (config.profile) {
          desc.stats.attributesCount = numAttributes;
        }

        var attributes = desc.attributes;
        for (i = 0; i < numAttributes; ++i) {
          info = gl.getActiveAttrib(program, i);
          if (info) {
            insertActiveInfo(attributes, new ActiveInfo(
              info.name,
              stringStore.id(info.name),
              gl.getAttribLocation(program, info.name),
              info));
          }
        }
      }

      if (config.profile) {
        stats.getMaxUniformsCount = function () {
          var m = 0;
          programList.forEach(function (desc) {
            if (desc.stats.uniformsCount > m) {
              m = desc.stats.uniformsCount;
            }
          });
          return m
        };

        stats.getMaxAttributesCount = function () {
          var m = 0;
          programList.forEach(function (desc) {
            if (desc.stats.attributesCount > m) {
              m = desc.stats.attributesCount;
            }
          });
          return m
        };
      }

      function restoreShaders () {
        fragShaders = {};
        vertShaders = {};
        for (var i = 0; i < programList.length; ++i) {
          linkProgram(programList[i], null, programList[i].attributes.map(function (info) {
            return [info.location, info.name]
          }));
        }
      }

      return {
        clear: function () {
          var deleteShader = gl.deleteShader.bind(gl);
          values(fragShaders).forEach(deleteShader);
          fragShaders = {};
          values(vertShaders).forEach(deleteShader);
          vertShaders = {};

          programList.forEach(function (desc) {
            gl.deleteProgram(desc.program);
          });
          programList.length = 0;
          programCache = {};

          stats.shaderCount = 0;
        },

        program: function (vertId, fragId, command, attribLocations) {
          check$1.command(vertId >= 0, 'missing vertex shader', command);
          check$1.command(fragId >= 0, 'missing fragment shader', command);

          var cache = programCache[fragId];
          if (!cache) {
            cache = programCache[fragId] = {};
          }
          var prevProgram = cache[vertId];
          if (prevProgram && !attribLocations) {
            return prevProgram
          }
          var program = new REGLProgram(fragId, vertId);
          stats.shaderCount++;
          linkProgram(program, command, attribLocations);
          if (!prevProgram) {
            cache[vertId] = program;
          }
          programList.push(program);
          return program
        },

        restore: restoreShaders,

        shader: getShader,

        frag: -1,
        vert: -1
      }
    }

    var GL_RGBA$3 = 6408;
    var GL_UNSIGNED_BYTE$7 = 5121;
    var GL_PACK_ALIGNMENT = 0x0D05;
    var GL_FLOAT$7 = 0x1406; // 5126

    function wrapReadPixels (
      gl,
      framebufferState,
      reglPoll,
      context,
      glAttributes,
      extensions,
      limits) {
      function readPixelsImpl (input) {
        var type;
        if (framebufferState.next === null) {
          check$1(
            glAttributes.preserveDrawingBuffer,
            'you must create a webgl context with "preserveDrawingBuffer":true in order to read pixels from the drawing buffer');
          type = GL_UNSIGNED_BYTE$7;
        } else {
          check$1(
            framebufferState.next.colorAttachments[0].texture !== null,
            'You cannot read from a renderbuffer');
          type = framebufferState.next.colorAttachments[0].texture._texture.type;

          if (extensions.oes_texture_float) {
            check$1(
              type === GL_UNSIGNED_BYTE$7 || type === GL_FLOAT$7,
              'Reading from a framebuffer is only allowed for the types \'uint8\' and \'float\'');

            if (type === GL_FLOAT$7) {
              check$1(limits.readFloat, 'Reading \'float\' values is not permitted in your browser. For a fallback, please see: https://www.npmjs.com/package/glsl-read-float');
            }
          } else {
            check$1(
              type === GL_UNSIGNED_BYTE$7,
              'Reading from a framebuffer is only allowed for the type \'uint8\'');
          }
        }

        var x = 0;
        var y = 0;
        var width = context.framebufferWidth;
        var height = context.framebufferHeight;
        var data = null;

        if (isTypedArray(input)) {
          data = input;
        } else if (input) {
          check$1.type(input, 'object', 'invalid arguments to regl.read()');
          x = input.x | 0;
          y = input.y | 0;
          check$1(
            x >= 0 && x < context.framebufferWidth,
            'invalid x offset for regl.read');
          check$1(
            y >= 0 && y < context.framebufferHeight,
            'invalid y offset for regl.read');
          width = (input.width || (context.framebufferWidth - x)) | 0;
          height = (input.height || (context.framebufferHeight - y)) | 0;
          data = input.data || null;
        }

        // sanity check input.data
        if (data) {
          if (type === GL_UNSIGNED_BYTE$7) {
            check$1(
              data instanceof Uint8Array,
              'buffer must be \'Uint8Array\' when reading from a framebuffer of type \'uint8\'');
          } else if (type === GL_FLOAT$7) {
            check$1(
              data instanceof Float32Array,
              'buffer must be \'Float32Array\' when reading from a framebuffer of type \'float\'');
          }
        }

        check$1(
          width > 0 && width + x <= context.framebufferWidth,
          'invalid width for read pixels');
        check$1(
          height > 0 && height + y <= context.framebufferHeight,
          'invalid height for read pixels');

        // Update WebGL state
        reglPoll();

        // Compute size
        var size = width * height * 4;

        // Allocate data
        if (!data) {
          if (type === GL_UNSIGNED_BYTE$7) {
            data = new Uint8Array(size);
          } else if (type === GL_FLOAT$7) {
            data = data || new Float32Array(size);
          }
        }

        // Type check
        check$1.isTypedArray(data, 'data buffer for regl.read() must be a typedarray');
        check$1(data.byteLength >= size, 'data buffer for regl.read() too small');

        // Run read pixels
        gl.pixelStorei(GL_PACK_ALIGNMENT, 4);
        gl.readPixels(x, y, width, height, GL_RGBA$3,
          type,
          data);

        return data
      }

      function readPixelsFBO (options) {
        var result;
        framebufferState.setFBO({
          framebuffer: options.framebuffer
        }, function () {
          result = readPixelsImpl(options);
        });
        return result
      }

      function readPixels (options) {
        if (!options || !('framebuffer' in options)) {
          return readPixelsImpl(options)
        } else {
          return readPixelsFBO(options)
        }
      }

      return readPixels
    }

    function slice (x) {
      return Array.prototype.slice.call(x)
    }

    function join (x) {
      return slice(x).join('')
    }

    function createEnvironment () {
      // Unique variable id counter
      var varCounter = 0;

      // Linked values are passed from this scope into the generated code block
      // Calling link() passes a value into the generated scope and returns
      // the variable name which it is bound to
      var linkedNames = [];
      var linkedValues = [];
      function link (value) {
        for (var i = 0; i < linkedValues.length; ++i) {
          if (linkedValues[i] === value) {
            return linkedNames[i]
          }
        }

        var name = 'g' + (varCounter++);
        linkedNames.push(name);
        linkedValues.push(value);
        return name
      }

      // create a code block
      function block () {
        var code = [];
        function push () {
          code.push.apply(code, slice(arguments));
        }

        var vars = [];
        function def () {
          var name = 'v' + (varCounter++);
          vars.push(name);

          if (arguments.length > 0) {
            code.push(name, '=');
            code.push.apply(code, slice(arguments));
            code.push(';');
          }

          return name
        }

        return extend(push, {
          def: def,
          toString: function () {
            return join([
              (vars.length > 0 ? 'var ' + vars.join(',') + ';' : ''),
              join(code)
            ])
          }
        })
      }

      function scope () {
        var entry = block();
        var exit = block();

        var entryToString = entry.toString;
        var exitToString = exit.toString;

        function save (object, prop) {
          exit(object, prop, '=', entry.def(object, prop), ';');
        }

        return extend(function () {
          entry.apply(entry, slice(arguments));
        }, {
          def: entry.def,
          entry: entry,
          exit: exit,
          save: save,
          set: function (object, prop, value) {
            save(object, prop);
            entry(object, prop, '=', value, ';');
          },
          toString: function () {
            return entryToString() + exitToString()
          }
        })
      }

      function conditional () {
        var pred = join(arguments);
        var thenBlock = scope();
        var elseBlock = scope();

        var thenToString = thenBlock.toString;
        var elseToString = elseBlock.toString;

        return extend(thenBlock, {
          then: function () {
            thenBlock.apply(thenBlock, slice(arguments));
            return this
          },
          else: function () {
            elseBlock.apply(elseBlock, slice(arguments));
            return this
          },
          toString: function () {
            var elseClause = elseToString();
            if (elseClause) {
              elseClause = 'else{' + elseClause + '}';
            }
            return join([
              'if(', pred, '){',
              thenToString(),
              '}', elseClause
            ])
          }
        })
      }

      // procedure list
      var globalBlock = block();
      var procedures = {};
      function proc (name, count) {
        var args = [];
        function arg () {
          var name = 'a' + args.length;
          args.push(name);
          return name
        }

        count = count || 0;
        for (var i = 0; i < count; ++i) {
          arg();
        }

        var body = scope();
        var bodyToString = body.toString;

        var result = procedures[name] = extend(body, {
          arg: arg,
          toString: function () {
            return join([
              'function(', args.join(), '){',
              bodyToString(),
              '}'
            ])
          }
        });

        return result
      }

      function compile () {
        var code = ['"use strict";',
          globalBlock,
          'return {'];
        Object.keys(procedures).forEach(function (name) {
          code.push('"', name, '":', procedures[name].toString(), ',');
        });
        code.push('}');
        var src = join(code)
          .replace(/;/g, ';\n')
          .replace(/}/g, '}\n')
          .replace(/{/g, '{\n');
        var proc = Function.apply(null, linkedNames.concat(src));
        return proc.apply(null, linkedValues)
      }

      return {
        global: globalBlock,
        link: link,
        block: block,
        proc: proc,
        scope: scope,
        cond: conditional,
        compile: compile
      }
    }

    // "cute" names for vector components
    var CUTE_COMPONENTS = 'xyzw'.split('');

    var GL_UNSIGNED_BYTE$8 = 5121;

    var ATTRIB_STATE_POINTER = 1;
    var ATTRIB_STATE_CONSTANT = 2;

    var DYN_FUNC$1 = 0;
    var DYN_PROP$1 = 1;
    var DYN_CONTEXT$1 = 2;
    var DYN_STATE$1 = 3;
    var DYN_THUNK = 4;

    var S_DITHER = 'dither';
    var S_BLEND_ENABLE = 'blend.enable';
    var S_BLEND_COLOR = 'blend.color';
    var S_BLEND_EQUATION = 'blend.equation';
    var S_BLEND_FUNC = 'blend.func';
    var S_DEPTH_ENABLE = 'depth.enable';
    var S_DEPTH_FUNC = 'depth.func';
    var S_DEPTH_RANGE = 'depth.range';
    var S_DEPTH_MASK = 'depth.mask';
    var S_COLOR_MASK = 'colorMask';
    var S_CULL_ENABLE = 'cull.enable';
    var S_CULL_FACE = 'cull.face';
    var S_FRONT_FACE = 'frontFace';
    var S_LINE_WIDTH = 'lineWidth';
    var S_POLYGON_OFFSET_ENABLE = 'polygonOffset.enable';
    var S_POLYGON_OFFSET_OFFSET = 'polygonOffset.offset';
    var S_SAMPLE_ALPHA = 'sample.alpha';
    var S_SAMPLE_ENABLE = 'sample.enable';
    var S_SAMPLE_COVERAGE = 'sample.coverage';
    var S_STENCIL_ENABLE = 'stencil.enable';
    var S_STENCIL_MASK = 'stencil.mask';
    var S_STENCIL_FUNC = 'stencil.func';
    var S_STENCIL_OPFRONT = 'stencil.opFront';
    var S_STENCIL_OPBACK = 'stencil.opBack';
    var S_SCISSOR_ENABLE = 'scissor.enable';
    var S_SCISSOR_BOX = 'scissor.box';
    var S_VIEWPORT = 'viewport';

    var S_PROFILE = 'profile';

    var S_FRAMEBUFFER = 'framebuffer';
    var S_VERT = 'vert';
    var S_FRAG = 'frag';
    var S_ELEMENTS = 'elements';
    var S_PRIMITIVE = 'primitive';
    var S_COUNT = 'count';
    var S_OFFSET = 'offset';
    var S_INSTANCES = 'instances';
    var S_VAO = 'vao';

    var SUFFIX_WIDTH = 'Width';
    var SUFFIX_HEIGHT = 'Height';

    var S_FRAMEBUFFER_WIDTH = S_FRAMEBUFFER + SUFFIX_WIDTH;
    var S_FRAMEBUFFER_HEIGHT = S_FRAMEBUFFER + SUFFIX_HEIGHT;
    var S_VIEWPORT_WIDTH = S_VIEWPORT + SUFFIX_WIDTH;
    var S_VIEWPORT_HEIGHT = S_VIEWPORT + SUFFIX_HEIGHT;
    var S_DRAWINGBUFFER = 'drawingBuffer';
    var S_DRAWINGBUFFER_WIDTH = S_DRAWINGBUFFER + SUFFIX_WIDTH;
    var S_DRAWINGBUFFER_HEIGHT = S_DRAWINGBUFFER + SUFFIX_HEIGHT;

    var NESTED_OPTIONS = [
      S_BLEND_FUNC,
      S_BLEND_EQUATION,
      S_STENCIL_FUNC,
      S_STENCIL_OPFRONT,
      S_STENCIL_OPBACK,
      S_SAMPLE_COVERAGE,
      S_VIEWPORT,
      S_SCISSOR_BOX,
      S_POLYGON_OFFSET_OFFSET
    ];

    var GL_ARRAY_BUFFER$2 = 34962;
    var GL_ELEMENT_ARRAY_BUFFER$1 = 34963;

    var GL_FRAGMENT_SHADER$1 = 35632;
    var GL_VERTEX_SHADER$1 = 35633;

    var GL_TEXTURE_2D$3 = 0x0DE1;
    var GL_TEXTURE_CUBE_MAP$2 = 0x8513;

    var GL_CULL_FACE = 0x0B44;
    var GL_BLEND = 0x0BE2;
    var GL_DITHER = 0x0BD0;
    var GL_STENCIL_TEST = 0x0B90;
    var GL_DEPTH_TEST = 0x0B71;
    var GL_SCISSOR_TEST = 0x0C11;
    var GL_POLYGON_OFFSET_FILL = 0x8037;
    var GL_SAMPLE_ALPHA_TO_COVERAGE = 0x809E;
    var GL_SAMPLE_COVERAGE = 0x80A0;

    var GL_FLOAT$8 = 5126;
    var GL_FLOAT_VEC2 = 35664;
    var GL_FLOAT_VEC3 = 35665;
    var GL_FLOAT_VEC4 = 35666;
    var GL_INT$3 = 5124;
    var GL_INT_VEC2 = 35667;
    var GL_INT_VEC3 = 35668;
    var GL_INT_VEC4 = 35669;
    var GL_BOOL = 35670;
    var GL_BOOL_VEC2 = 35671;
    var GL_BOOL_VEC3 = 35672;
    var GL_BOOL_VEC4 = 35673;
    var GL_FLOAT_MAT2 = 35674;
    var GL_FLOAT_MAT3 = 35675;
    var GL_FLOAT_MAT4 = 35676;
    var GL_SAMPLER_2D = 35678;
    var GL_SAMPLER_CUBE = 35680;

    var GL_TRIANGLES$1 = 4;

    var GL_FRONT = 1028;
    var GL_BACK = 1029;
    var GL_CW = 0x0900;
    var GL_CCW = 0x0901;
    var GL_MIN_EXT = 0x8007;
    var GL_MAX_EXT = 0x8008;
    var GL_ALWAYS = 519;
    var GL_KEEP = 7680;
    var GL_ZERO = 0;
    var GL_ONE = 1;
    var GL_FUNC_ADD = 0x8006;
    var GL_LESS = 513;

    var GL_FRAMEBUFFER$2 = 0x8D40;
    var GL_COLOR_ATTACHMENT0$2 = 0x8CE0;

    var blendFuncs = {
      '0': 0,
      '1': 1,
      'zero': 0,
      'one': 1,
      'src color': 768,
      'one minus src color': 769,
      'src alpha': 770,
      'one minus src alpha': 771,
      'dst color': 774,
      'one minus dst color': 775,
      'dst alpha': 772,
      'one minus dst alpha': 773,
      'constant color': 32769,
      'one minus constant color': 32770,
      'constant alpha': 32771,
      'one minus constant alpha': 32772,
      'src alpha saturate': 776
    };

    // There are invalid values for srcRGB and dstRGB. See:
    // https://www.khronos.org/registry/webgl/specs/1.0/#6.13
    // https://github.com/KhronosGroup/WebGL/blob/0d3201f5f7ec3c0060bc1f04077461541f1987b9/conformance-suites/1.0.3/conformance/misc/webgl-specific.html#L56
    var invalidBlendCombinations = [
      'constant color, constant alpha',
      'one minus constant color, constant alpha',
      'constant color, one minus constant alpha',
      'one minus constant color, one minus constant alpha',
      'constant alpha, constant color',
      'constant alpha, one minus constant color',
      'one minus constant alpha, constant color',
      'one minus constant alpha, one minus constant color'
    ];

    var compareFuncs = {
      'never': 512,
      'less': 513,
      '<': 513,
      'equal': 514,
      '=': 514,
      '==': 514,
      '===': 514,
      'lequal': 515,
      '<=': 515,
      'greater': 516,
      '>': 516,
      'notequal': 517,
      '!=': 517,
      '!==': 517,
      'gequal': 518,
      '>=': 518,
      'always': 519
    };

    var stencilOps = {
      '0': 0,
      'zero': 0,
      'keep': 7680,
      'replace': 7681,
      'increment': 7682,
      'decrement': 7683,
      'increment wrap': 34055,
      'decrement wrap': 34056,
      'invert': 5386
    };

    var shaderType = {
      'frag': GL_FRAGMENT_SHADER$1,
      'vert': GL_VERTEX_SHADER$1
    };

    var orientationType = {
      'cw': GL_CW,
      'ccw': GL_CCW
    };

    function isBufferArgs (x) {
      return Array.isArray(x) ||
        isTypedArray(x) ||
        isNDArrayLike(x)
    }

    // Make sure viewport is processed first
    function sortState (state) {
      return state.sort(function (a, b) {
        if (a === S_VIEWPORT) {
          return -1
        } else if (b === S_VIEWPORT) {
          return 1
        }
        return (a < b) ? -1 : 1
      })
    }

    function Declaration (thisDep, contextDep, propDep, append) {
      this.thisDep = thisDep;
      this.contextDep = contextDep;
      this.propDep = propDep;
      this.append = append;
    }

    function isStatic (decl) {
      return decl && !(decl.thisDep || decl.contextDep || decl.propDep)
    }

    function createStaticDecl (append) {
      return new Declaration(false, false, false, append)
    }

    function createDynamicDecl (dyn, append) {
      var type = dyn.type;
      if (type === DYN_FUNC$1) {
        var numArgs = dyn.data.length;
        return new Declaration(
          true,
          numArgs >= 1,
          numArgs >= 2,
          append)
      } else if (type === DYN_THUNK) {
        var data = dyn.data;
        return new Declaration(
          data.thisDep,
          data.contextDep,
          data.propDep,
          append)
      } else {
        return new Declaration(
          type === DYN_STATE$1,
          type === DYN_CONTEXT$1,
          type === DYN_PROP$1,
          append)
      }
    }

    var SCOPE_DECL = new Declaration(false, false, false, function () {});

    function reglCore (
      gl,
      stringStore,
      extensions,
      limits,
      bufferState,
      elementState,
      textureState,
      framebufferState,
      uniformState,
      attributeState,
      shaderState,
      drawState,
      contextState,
      timer,
      config) {
      var AttributeRecord = attributeState.Record;

      var blendEquations = {
        'add': 32774,
        'subtract': 32778,
        'reverse subtract': 32779
      };
      if (extensions.ext_blend_minmax) {
        blendEquations.min = GL_MIN_EXT;
        blendEquations.max = GL_MAX_EXT;
      }

      var extInstancing = extensions.angle_instanced_arrays;
      var extDrawBuffers = extensions.webgl_draw_buffers;

      // ===================================================
      // ===================================================
      // WEBGL STATE
      // ===================================================
      // ===================================================
      var currentState = {
        dirty: true,
        profile: config.profile
      };
      var nextState = {};
      var GL_STATE_NAMES = [];
      var GL_FLAGS = {};
      var GL_VARIABLES = {};

      function propName (name) {
        return name.replace('.', '_')
      }

      function stateFlag (sname, cap, init) {
        var name = propName(sname);
        GL_STATE_NAMES.push(sname);
        nextState[name] = currentState[name] = !!init;
        GL_FLAGS[name] = cap;
      }

      function stateVariable (sname, func, init) {
        var name = propName(sname);
        GL_STATE_NAMES.push(sname);
        if (Array.isArray(init)) {
          currentState[name] = init.slice();
          nextState[name] = init.slice();
        } else {
          currentState[name] = nextState[name] = init;
        }
        GL_VARIABLES[name] = func;
      }

      // Dithering
      stateFlag(S_DITHER, GL_DITHER);

      // Blending
      stateFlag(S_BLEND_ENABLE, GL_BLEND);
      stateVariable(S_BLEND_COLOR, 'blendColor', [0, 0, 0, 0]);
      stateVariable(S_BLEND_EQUATION, 'blendEquationSeparate',
        [GL_FUNC_ADD, GL_FUNC_ADD]);
      stateVariable(S_BLEND_FUNC, 'blendFuncSeparate',
        [GL_ONE, GL_ZERO, GL_ONE, GL_ZERO]);

      // Depth
      stateFlag(S_DEPTH_ENABLE, GL_DEPTH_TEST, true);
      stateVariable(S_DEPTH_FUNC, 'depthFunc', GL_LESS);
      stateVariable(S_DEPTH_RANGE, 'depthRange', [0, 1]);
      stateVariable(S_DEPTH_MASK, 'depthMask', true);

      // Color mask
      stateVariable(S_COLOR_MASK, S_COLOR_MASK, [true, true, true, true]);

      // Face culling
      stateFlag(S_CULL_ENABLE, GL_CULL_FACE);
      stateVariable(S_CULL_FACE, 'cullFace', GL_BACK);

      // Front face orientation
      stateVariable(S_FRONT_FACE, S_FRONT_FACE, GL_CCW);

      // Line width
      stateVariable(S_LINE_WIDTH, S_LINE_WIDTH, 1);

      // Polygon offset
      stateFlag(S_POLYGON_OFFSET_ENABLE, GL_POLYGON_OFFSET_FILL);
      stateVariable(S_POLYGON_OFFSET_OFFSET, 'polygonOffset', [0, 0]);

      // Sample coverage
      stateFlag(S_SAMPLE_ALPHA, GL_SAMPLE_ALPHA_TO_COVERAGE);
      stateFlag(S_SAMPLE_ENABLE, GL_SAMPLE_COVERAGE);
      stateVariable(S_SAMPLE_COVERAGE, 'sampleCoverage', [1, false]);

      // Stencil
      stateFlag(S_STENCIL_ENABLE, GL_STENCIL_TEST);
      stateVariable(S_STENCIL_MASK, 'stencilMask', -1);
      stateVariable(S_STENCIL_FUNC, 'stencilFunc', [GL_ALWAYS, 0, -1]);
      stateVariable(S_STENCIL_OPFRONT, 'stencilOpSeparate',
        [GL_FRONT, GL_KEEP, GL_KEEP, GL_KEEP]);
      stateVariable(S_STENCIL_OPBACK, 'stencilOpSeparate',
        [GL_BACK, GL_KEEP, GL_KEEP, GL_KEEP]);

      // Scissor
      stateFlag(S_SCISSOR_ENABLE, GL_SCISSOR_TEST);
      stateVariable(S_SCISSOR_BOX, 'scissor',
        [0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight]);

      // Viewport
      stateVariable(S_VIEWPORT, S_VIEWPORT,
        [0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight]);

      // ===================================================
      // ===================================================
      // ENVIRONMENT
      // ===================================================
      // ===================================================
      var sharedState = {
        gl: gl,
        context: contextState,
        strings: stringStore,
        next: nextState,
        current: currentState,
        draw: drawState,
        elements: elementState,
        buffer: bufferState,
        shader: shaderState,
        attributes: attributeState.state,
        vao: attributeState,
        uniforms: uniformState,
        framebuffer: framebufferState,
        extensions: extensions,

        timer: timer,
        isBufferArgs: isBufferArgs
      };

      var sharedConstants = {
        primTypes: primTypes,
        compareFuncs: compareFuncs,
        blendFuncs: blendFuncs,
        blendEquations: blendEquations,
        stencilOps: stencilOps,
        glTypes: glTypes,
        orientationType: orientationType
      };

      check$1.optional(function () {
        sharedState.isArrayLike = isArrayLike;
      });

      if (extDrawBuffers) {
        sharedConstants.backBuffer = [GL_BACK];
        sharedConstants.drawBuffer = loop(limits.maxDrawbuffers, function (i) {
          if (i === 0) {
            return [0]
          }
          return loop(i, function (j) {
            return GL_COLOR_ATTACHMENT0$2 + j
          })
        });
      }

      var drawCallCounter = 0;
      function createREGLEnvironment () {
        var env = createEnvironment();
        var link = env.link;
        var global = env.global;
        env.id = drawCallCounter++;

        env.batchId = '0';

        // link shared state
        var SHARED = link(sharedState);
        var shared = env.shared = {
          props: 'a0'
        };
        Object.keys(sharedState).forEach(function (prop) {
          shared[prop] = global.def(SHARED, '.', prop);
        });

        // Inject runtime assertion stuff for debug builds
        check$1.optional(function () {
          env.CHECK = link(check$1);
          env.commandStr = check$1.guessCommand();
          env.command = link(env.commandStr);
          env.assert = function (block, pred, message) {
            block(
              'if(!(', pred, '))',
              this.CHECK, '.commandRaise(', link(message), ',', this.command, ');');
          };

          sharedConstants.invalidBlendCombinations = invalidBlendCombinations;
        });

        // Copy GL state variables over
        var nextVars = env.next = {};
        var currentVars = env.current = {};
        Object.keys(GL_VARIABLES).forEach(function (variable) {
          if (Array.isArray(currentState[variable])) {
            nextVars[variable] = global.def(shared.next, '.', variable);
            currentVars[variable] = global.def(shared.current, '.', variable);
          }
        });

        // Initialize shared constants
        var constants = env.constants = {};
        Object.keys(sharedConstants).forEach(function (name) {
          constants[name] = global.def(JSON.stringify(sharedConstants[name]));
        });

        // Helper function for calling a block
        env.invoke = function (block, x) {
          switch (x.type) {
            case DYN_FUNC$1:
              var argList = [
                'this',
                shared.context,
                shared.props,
                env.batchId
              ];
              return block.def(
                link(x.data), '.call(',
                argList.slice(0, Math.max(x.data.length + 1, 4)),
                ')')
            case DYN_PROP$1:
              return block.def(shared.props, x.data)
            case DYN_CONTEXT$1:
              return block.def(shared.context, x.data)
            case DYN_STATE$1:
              return block.def('this', x.data)
            case DYN_THUNK:
              x.data.append(env, block);
              return x.data.ref
          }
        };

        env.attribCache = {};

        var scopeAttribs = {};
        env.scopeAttrib = function (name) {
          var id = stringStore.id(name);
          if (id in scopeAttribs) {
            return scopeAttribs[id]
          }
          var binding = attributeState.scope[id];
          if (!binding) {
            binding = attributeState.scope[id] = new AttributeRecord();
          }
          var result = scopeAttribs[id] = link(binding);
          return result
        };

        return env
      }

      // ===================================================
      // ===================================================
      // PARSING
      // ===================================================
      // ===================================================
      function parseProfile (options) {
        var staticOptions = options.static;
        var dynamicOptions = options.dynamic;

        var profileEnable;
        if (S_PROFILE in staticOptions) {
          var value = !!staticOptions[S_PROFILE];
          profileEnable = createStaticDecl(function (env, scope) {
            return value
          });
          profileEnable.enable = value;
        } else if (S_PROFILE in dynamicOptions) {
          var dyn = dynamicOptions[S_PROFILE];
          profileEnable = createDynamicDecl(dyn, function (env, scope) {
            return env.invoke(scope, dyn)
          });
        }

        return profileEnable
      }

      function parseFramebuffer (options, env) {
        var staticOptions = options.static;
        var dynamicOptions = options.dynamic;

        if (S_FRAMEBUFFER in staticOptions) {
          var framebuffer = staticOptions[S_FRAMEBUFFER];
          if (framebuffer) {
            framebuffer = framebufferState.getFramebuffer(framebuffer);
            check$1.command(framebuffer, 'invalid framebuffer object');
            return createStaticDecl(function (env, block) {
              var FRAMEBUFFER = env.link(framebuffer);
              var shared = env.shared;
              block.set(
                shared.framebuffer,
                '.next',
                FRAMEBUFFER);
              var CONTEXT = shared.context;
              block.set(
                CONTEXT,
                '.' + S_FRAMEBUFFER_WIDTH,
                FRAMEBUFFER + '.width');
              block.set(
                CONTEXT,
                '.' + S_FRAMEBUFFER_HEIGHT,
                FRAMEBUFFER + '.height');
              return FRAMEBUFFER
            })
          } else {
            return createStaticDecl(function (env, scope) {
              var shared = env.shared;
              scope.set(
                shared.framebuffer,
                '.next',
                'null');
              var CONTEXT = shared.context;
              scope.set(
                CONTEXT,
                '.' + S_FRAMEBUFFER_WIDTH,
                CONTEXT + '.' + S_DRAWINGBUFFER_WIDTH);
              scope.set(
                CONTEXT,
                '.' + S_FRAMEBUFFER_HEIGHT,
                CONTEXT + '.' + S_DRAWINGBUFFER_HEIGHT);
              return 'null'
            })
          }
        } else if (S_FRAMEBUFFER in dynamicOptions) {
          var dyn = dynamicOptions[S_FRAMEBUFFER];
          return createDynamicDecl(dyn, function (env, scope) {
            var FRAMEBUFFER_FUNC = env.invoke(scope, dyn);
            var shared = env.shared;
            var FRAMEBUFFER_STATE = shared.framebuffer;
            var FRAMEBUFFER = scope.def(
              FRAMEBUFFER_STATE, '.getFramebuffer(', FRAMEBUFFER_FUNC, ')');

            check$1.optional(function () {
              env.assert(scope,
                '!' + FRAMEBUFFER_FUNC + '||' + FRAMEBUFFER,
                'invalid framebuffer object');
            });

            scope.set(
              FRAMEBUFFER_STATE,
              '.next',
              FRAMEBUFFER);
            var CONTEXT = shared.context;
            scope.set(
              CONTEXT,
              '.' + S_FRAMEBUFFER_WIDTH,
              FRAMEBUFFER + '?' + FRAMEBUFFER + '.width:' +
              CONTEXT + '.' + S_DRAWINGBUFFER_WIDTH);
            scope.set(
              CONTEXT,
              '.' + S_FRAMEBUFFER_HEIGHT,
              FRAMEBUFFER +
              '?' + FRAMEBUFFER + '.height:' +
              CONTEXT + '.' + S_DRAWINGBUFFER_HEIGHT);
            return FRAMEBUFFER
          })
        } else {
          return null
        }
      }

      function parseViewportScissor (options, framebuffer, env) {
        var staticOptions = options.static;
        var dynamicOptions = options.dynamic;

        function parseBox (param) {
          if (param in staticOptions) {
            var box = staticOptions[param];
            check$1.commandType(box, 'object', 'invalid ' + param, env.commandStr);

            var isStatic = true;
            var x = box.x | 0;
            var y = box.y | 0;
            var w, h;
            if ('width' in box) {
              w = box.width | 0;
              check$1.command(w >= 0, 'invalid ' + param, env.commandStr);
            } else {
              isStatic = false;
            }
            if ('height' in box) {
              h = box.height | 0;
              check$1.command(h >= 0, 'invalid ' + param, env.commandStr);
            } else {
              isStatic = false;
            }

            return new Declaration(
              !isStatic && framebuffer && framebuffer.thisDep,
              !isStatic && framebuffer && framebuffer.contextDep,
              !isStatic && framebuffer && framebuffer.propDep,
              function (env, scope) {
                var CONTEXT = env.shared.context;
                var BOX_W = w;
                if (!('width' in box)) {
                  BOX_W = scope.def(CONTEXT, '.', S_FRAMEBUFFER_WIDTH, '-', x);
                }
                var BOX_H = h;
                if (!('height' in box)) {
                  BOX_H = scope.def(CONTEXT, '.', S_FRAMEBUFFER_HEIGHT, '-', y);
                }
                return [x, y, BOX_W, BOX_H]
              })
          } else if (param in dynamicOptions) {
            var dynBox = dynamicOptions[param];
            var result = createDynamicDecl(dynBox, function (env, scope) {
              var BOX = env.invoke(scope, dynBox);

              check$1.optional(function () {
                env.assert(scope,
                  BOX + '&&typeof ' + BOX + '==="object"',
                  'invalid ' + param);
              });

              var CONTEXT = env.shared.context;
              var BOX_X = scope.def(BOX, '.x|0');
              var BOX_Y = scope.def(BOX, '.y|0');
              var BOX_W = scope.def(
                '"width" in ', BOX, '?', BOX, '.width|0:',
                '(', CONTEXT, '.', S_FRAMEBUFFER_WIDTH, '-', BOX_X, ')');
              var BOX_H = scope.def(
                '"height" in ', BOX, '?', BOX, '.height|0:',
                '(', CONTEXT, '.', S_FRAMEBUFFER_HEIGHT, '-', BOX_Y, ')');

              check$1.optional(function () {
                env.assert(scope,
                  BOX_W + '>=0&&' +
                  BOX_H + '>=0',
                  'invalid ' + param);
              });

              return [BOX_X, BOX_Y, BOX_W, BOX_H]
            });
            if (framebuffer) {
              result.thisDep = result.thisDep || framebuffer.thisDep;
              result.contextDep = result.contextDep || framebuffer.contextDep;
              result.propDep = result.propDep || framebuffer.propDep;
            }
            return result
          } else if (framebuffer) {
            return new Declaration(
              framebuffer.thisDep,
              framebuffer.contextDep,
              framebuffer.propDep,
              function (env, scope) {
                var CONTEXT = env.shared.context;
                return [
                  0, 0,
                  scope.def(CONTEXT, '.', S_FRAMEBUFFER_WIDTH),
                  scope.def(CONTEXT, '.', S_FRAMEBUFFER_HEIGHT)]
              })
          } else {
            return null
          }
        }

        var viewport = parseBox(S_VIEWPORT);

        if (viewport) {
          var prevViewport = viewport;
          viewport = new Declaration(
            viewport.thisDep,
            viewport.contextDep,
            viewport.propDep,
            function (env, scope) {
              var VIEWPORT = prevViewport.append(env, scope);
              var CONTEXT = env.shared.context;
              scope.set(
                CONTEXT,
                '.' + S_VIEWPORT_WIDTH,
                VIEWPORT[2]);
              scope.set(
                CONTEXT,
                '.' + S_VIEWPORT_HEIGHT,
                VIEWPORT[3]);
              return VIEWPORT
            });
        }

        return {
          viewport: viewport,
          scissor_box: parseBox(S_SCISSOR_BOX)
        }
      }

      function parseAttribLocations (options, attributes) {
        var staticOptions = options.static;
        var staticProgram =
          typeof staticOptions[S_FRAG] === 'string' &&
          typeof staticOptions[S_VERT] === 'string';
        if (staticProgram) {
          if (Object.keys(attributes.dynamic).length > 0) {
            return null
          }
          var staticAttributes = attributes.static;
          var sAttributes = Object.keys(staticAttributes);
          if (sAttributes.length > 0 && typeof staticAttributes[sAttributes[0]] === 'number') {
            var bindings = [];
            for (var i = 0; i < sAttributes.length; ++i) {
              check$1(typeof staticAttributes[sAttributes[i]] === 'number', 'must specify all vertex attribute locations when using vaos');
              bindings.push([staticAttributes[sAttributes[i]] | 0, sAttributes[i]]);
            }
            return bindings
          }
        }
        return null
      }

      function parseProgram (options, env, attribLocations) {
        var staticOptions = options.static;
        var dynamicOptions = options.dynamic;

        function parseShader (name) {
          if (name in staticOptions) {
            var id = stringStore.id(staticOptions[name]);
            check$1.optional(function () {
              shaderState.shader(shaderType[name], id, check$1.guessCommand());
            });
            var result = createStaticDecl(function () {
              return id
            });
            result.id = id;
            return result
          } else if (name in dynamicOptions) {
            var dyn = dynamicOptions[name];
            return createDynamicDecl(dyn, function (env, scope) {
              var str = env.invoke(scope, dyn);
              var id = scope.def(env.shared.strings, '.id(', str, ')');
              check$1.optional(function () {
                scope(
                  env.shared.shader, '.shader(',
                  shaderType[name], ',',
                  id, ',',
                  env.command, ');');
              });
              return id
            })
          }
          return null
        }

        var frag = parseShader(S_FRAG);
        var vert = parseShader(S_VERT);

        var program = null;
        var progVar;
        if (isStatic(frag) && isStatic(vert)) {
          program = shaderState.program(vert.id, frag.id, null, attribLocations);
          progVar = createStaticDecl(function (env, scope) {
            return env.link(program)
          });
        } else {
          progVar = new Declaration(
            (frag && frag.thisDep) || (vert && vert.thisDep),
            (frag && frag.contextDep) || (vert && vert.contextDep),
            (frag && frag.propDep) || (vert && vert.propDep),
            function (env, scope) {
              var SHADER_STATE = env.shared.shader;
              var fragId;
              if (frag) {
                fragId = frag.append(env, scope);
              } else {
                fragId = scope.def(SHADER_STATE, '.', S_FRAG);
              }
              var vertId;
              if (vert) {
                vertId = vert.append(env, scope);
              } else {
                vertId = scope.def(SHADER_STATE, '.', S_VERT);
              }
              var progDef = SHADER_STATE + '.program(' + vertId + ',' + fragId;
              check$1.optional(function () {
                progDef += ',' + env.command;
              });
              return scope.def(progDef + ')')
            });
        }

        return {
          frag: frag,
          vert: vert,
          progVar: progVar,
          program: program
        }
      }

      function parseDraw (options, env) {
        var staticOptions = options.static;
        var dynamicOptions = options.dynamic;

        function parseElements () {
          if (S_ELEMENTS in staticOptions) {
            var elements = staticOptions[S_ELEMENTS];
            if (isBufferArgs(elements)) {
              elements = elementState.getElements(elementState.create(elements, true));
            } else if (elements) {
              elements = elementState.getElements(elements);
              check$1.command(elements, 'invalid elements', env.commandStr);
            }
            var result = createStaticDecl(function (env, scope) {
              if (elements) {
                var result = env.link(elements);
                env.ELEMENTS = result;
                return result
              }
              env.ELEMENTS = null;
              return null
            });
            result.value = elements;
            return result
          } else if (S_ELEMENTS in dynamicOptions) {
            var dyn = dynamicOptions[S_ELEMENTS];
            return createDynamicDecl(dyn, function (env, scope) {
              var shared = env.shared;

              var IS_BUFFER_ARGS = shared.isBufferArgs;
              var ELEMENT_STATE = shared.elements;

              var elementDefn = env.invoke(scope, dyn);
              var elements = scope.def('null');
              var elementStream = scope.def(IS_BUFFER_ARGS, '(', elementDefn, ')');

              var ifte = env.cond(elementStream)
                .then(elements, '=', ELEMENT_STATE, '.createStream(', elementDefn, ');')
                .else(elements, '=', ELEMENT_STATE, '.getElements(', elementDefn, ');');

              check$1.optional(function () {
                env.assert(ifte.else,
                  '!' + elementDefn + '||' + elements,
                  'invalid elements');
              });

              scope.entry(ifte);
              scope.exit(
                env.cond(elementStream)
                  .then(ELEMENT_STATE, '.destroyStream(', elements, ');'));

              env.ELEMENTS = elements;

              return elements
            })
          }

          return null
        }

        var elements = parseElements();

        function parsePrimitive () {
          if (S_PRIMITIVE in staticOptions) {
            var primitive = staticOptions[S_PRIMITIVE];
            check$1.commandParameter(primitive, primTypes, 'invalid primitve', env.commandStr);
            return createStaticDecl(function (env, scope) {
              return primTypes[primitive]
            })
          } else if (S_PRIMITIVE in dynamicOptions) {
            var dynPrimitive = dynamicOptions[S_PRIMITIVE];
            return createDynamicDecl(dynPrimitive, function (env, scope) {
              var PRIM_TYPES = env.constants.primTypes;
              var prim = env.invoke(scope, dynPrimitive);
              check$1.optional(function () {
                env.assert(scope,
                  prim + ' in ' + PRIM_TYPES,
                  'invalid primitive, must be one of ' + Object.keys(primTypes));
              });
              return scope.def(PRIM_TYPES, '[', prim, ']')
            })
          } else if (elements) {
            if (isStatic(elements)) {
              if (elements.value) {
                return createStaticDecl(function (env, scope) {
                  return scope.def(env.ELEMENTS, '.primType')
                })
              } else {
                return createStaticDecl(function () {
                  return GL_TRIANGLES$1
                })
              }
            } else {
              return new Declaration(
                elements.thisDep,
                elements.contextDep,
                elements.propDep,
                function (env, scope) {
                  var elements = env.ELEMENTS;
                  return scope.def(elements, '?', elements, '.primType:', GL_TRIANGLES$1)
                })
            }
          }
          return null
        }

        function parseParam (param, isOffset) {
          if (param in staticOptions) {
            var value = staticOptions[param] | 0;
            check$1.command(!isOffset || value >= 0, 'invalid ' + param, env.commandStr);
            return createStaticDecl(function (env, scope) {
              if (isOffset) {
                env.OFFSET = value;
              }
              return value
            })
          } else if (param in dynamicOptions) {
            var dynValue = dynamicOptions[param];
            return createDynamicDecl(dynValue, function (env, scope) {
              var result = env.invoke(scope, dynValue);
              if (isOffset) {
                env.OFFSET = result;
                check$1.optional(function () {
                  env.assert(scope,
                    result + '>=0',
                    'invalid ' + param);
                });
              }
              return result
            })
          } else if (isOffset && elements) {
            return createStaticDecl(function (env, scope) {
              env.OFFSET = '0';
              return 0
            })
          }
          return null
        }

        var OFFSET = parseParam(S_OFFSET, true);

        function parseVertCount () {
          if (S_COUNT in staticOptions) {
            var count = staticOptions[S_COUNT] | 0;
            check$1.command(
              typeof count === 'number' && count >= 0, 'invalid vertex count', env.commandStr);
            return createStaticDecl(function () {
              return count
            })
          } else if (S_COUNT in dynamicOptions) {
            var dynCount = dynamicOptions[S_COUNT];
            return createDynamicDecl(dynCount, function (env, scope) {
              var result = env.invoke(scope, dynCount);
              check$1.optional(function () {
                env.assert(scope,
                  'typeof ' + result + '==="number"&&' +
                  result + '>=0&&' +
                  result + '===(' + result + '|0)',
                  'invalid vertex count');
              });
              return result
            })
          } else if (elements) {
            if (isStatic(elements)) {
              if (elements) {
                if (OFFSET) {
                  return new Declaration(
                    OFFSET.thisDep,
                    OFFSET.contextDep,
                    OFFSET.propDep,
                    function (env, scope) {
                      var result = scope.def(
                        env.ELEMENTS, '.vertCount-', env.OFFSET);

                      check$1.optional(function () {
                        env.assert(scope,
                          result + '>=0',
                          'invalid vertex offset/element buffer too small');
                      });

                      return result
                    })
                } else {
                  return createStaticDecl(function (env, scope) {
                    return scope.def(env.ELEMENTS, '.vertCount')
                  })
                }
              } else {
                var result = createStaticDecl(function () {
                  return -1
                });
                check$1.optional(function () {
                  result.MISSING = true;
                });
                return result
              }
            } else {
              var variable = new Declaration(
                elements.thisDep || OFFSET.thisDep,
                elements.contextDep || OFFSET.contextDep,
                elements.propDep || OFFSET.propDep,
                function (env, scope) {
                  var elements = env.ELEMENTS;
                  if (env.OFFSET) {
                    return scope.def(elements, '?', elements, '.vertCount-',
                      env.OFFSET, ':-1')
                  }
                  return scope.def(elements, '?', elements, '.vertCount:-1')
                });
              check$1.optional(function () {
                variable.DYNAMIC = true;
              });
              return variable
            }
          }
          return null
        }

        return {
          elements: elements,
          primitive: parsePrimitive(),
          count: parseVertCount(),
          instances: parseParam(S_INSTANCES, false),
          offset: OFFSET
        }
      }

      function parseGLState (options, env) {
        var staticOptions = options.static;
        var dynamicOptions = options.dynamic;

        var STATE = {};

        GL_STATE_NAMES.forEach(function (prop) {
          var param = propName(prop);

          function parseParam (parseStatic, parseDynamic) {
            if (prop in staticOptions) {
              var value = parseStatic(staticOptions[prop]);
              STATE[param] = createStaticDecl(function () {
                return value
              });
            } else if (prop in dynamicOptions) {
              var dyn = dynamicOptions[prop];
              STATE[param] = createDynamicDecl(dyn, function (env, scope) {
                return parseDynamic(env, scope, env.invoke(scope, dyn))
              });
            }
          }

          switch (prop) {
            case S_CULL_ENABLE:
            case S_BLEND_ENABLE:
            case S_DITHER:
            case S_STENCIL_ENABLE:
            case S_DEPTH_ENABLE:
            case S_SCISSOR_ENABLE:
            case S_POLYGON_OFFSET_ENABLE:
            case S_SAMPLE_ALPHA:
            case S_SAMPLE_ENABLE:
            case S_DEPTH_MASK:
              return parseParam(
                function (value) {
                  check$1.commandType(value, 'boolean', prop, env.commandStr);
                  return value
                },
                function (env, scope, value) {
                  check$1.optional(function () {
                    env.assert(scope,
                      'typeof ' + value + '==="boolean"',
                      'invalid flag ' + prop, env.commandStr);
                  });
                  return value
                })

            case S_DEPTH_FUNC:
              return parseParam(
                function (value) {
                  check$1.commandParameter(value, compareFuncs, 'invalid ' + prop, env.commandStr);
                  return compareFuncs[value]
                },
                function (env, scope, value) {
                  var COMPARE_FUNCS = env.constants.compareFuncs;
                  check$1.optional(function () {
                    env.assert(scope,
                      value + ' in ' + COMPARE_FUNCS,
                      'invalid ' + prop + ', must be one of ' + Object.keys(compareFuncs));
                  });
                  return scope.def(COMPARE_FUNCS, '[', value, ']')
                })

            case S_DEPTH_RANGE:
              return parseParam(
                function (value) {
                  check$1.command(
                    isArrayLike(value) &&
                    value.length === 2 &&
                    typeof value[0] === 'number' &&
                    typeof value[1] === 'number' &&
                    value[0] <= value[1],
                    'depth range is 2d array',
                    env.commandStr);
                  return value
                },
                function (env, scope, value) {
                  check$1.optional(function () {
                    env.assert(scope,
                      env.shared.isArrayLike + '(' + value + ')&&' +
                      value + '.length===2&&' +
                      'typeof ' + value + '[0]==="number"&&' +
                      'typeof ' + value + '[1]==="number"&&' +
                      value + '[0]<=' + value + '[1]',
                      'depth range must be a 2d array');
                  });

                  var Z_NEAR = scope.def('+', value, '[0]');
                  var Z_FAR = scope.def('+', value, '[1]');
                  return [Z_NEAR, Z_FAR]
                })

            case S_BLEND_FUNC:
              return parseParam(
                function (value) {
                  check$1.commandType(value, 'object', 'blend.func', env.commandStr);
                  var srcRGB = ('srcRGB' in value ? value.srcRGB : value.src);
                  var srcAlpha = ('srcAlpha' in value ? value.srcAlpha : value.src);
                  var dstRGB = ('dstRGB' in value ? value.dstRGB : value.dst);
                  var dstAlpha = ('dstAlpha' in value ? value.dstAlpha : value.dst);
                  check$1.commandParameter(srcRGB, blendFuncs, param + '.srcRGB', env.commandStr);
                  check$1.commandParameter(srcAlpha, blendFuncs, param + '.srcAlpha', env.commandStr);
                  check$1.commandParameter(dstRGB, blendFuncs, param + '.dstRGB', env.commandStr);
                  check$1.commandParameter(dstAlpha, blendFuncs, param + '.dstAlpha', env.commandStr);

                  check$1.command(
                    (invalidBlendCombinations.indexOf(srcRGB + ', ' + dstRGB) === -1),
                    'unallowed blending combination (srcRGB, dstRGB) = (' + srcRGB + ', ' + dstRGB + ')', env.commandStr);

                  return [
                    blendFuncs[srcRGB],
                    blendFuncs[dstRGB],
                    blendFuncs[srcAlpha],
                    blendFuncs[dstAlpha]
                  ]
                },
                function (env, scope, value) {
                  var BLEND_FUNCS = env.constants.blendFuncs;

                  check$1.optional(function () {
                    env.assert(scope,
                      value + '&&typeof ' + value + '==="object"',
                      'invalid blend func, must be an object');
                  });

                  function read (prefix, suffix) {
                    var func = scope.def(
                      '"', prefix, suffix, '" in ', value,
                      '?', value, '.', prefix, suffix,
                      ':', value, '.', prefix);

                    check$1.optional(function () {
                      env.assert(scope,
                        func + ' in ' + BLEND_FUNCS,
                        'invalid ' + prop + '.' + prefix + suffix + ', must be one of ' + Object.keys(blendFuncs));
                    });

                    return func
                  }

                  var srcRGB = read('src', 'RGB');
                  var dstRGB = read('dst', 'RGB');

                  check$1.optional(function () {
                    var INVALID_BLEND_COMBINATIONS = env.constants.invalidBlendCombinations;

                    env.assert(scope,
                      INVALID_BLEND_COMBINATIONS +
                               '.indexOf(' + srcRGB + '+", "+' + dstRGB + ') === -1 ',
                      'unallowed blending combination for (srcRGB, dstRGB)'
                    );
                  });

                  var SRC_RGB = scope.def(BLEND_FUNCS, '[', srcRGB, ']');
                  var SRC_ALPHA = scope.def(BLEND_FUNCS, '[', read('src', 'Alpha'), ']');
                  var DST_RGB = scope.def(BLEND_FUNCS, '[', dstRGB, ']');
                  var DST_ALPHA = scope.def(BLEND_FUNCS, '[', read('dst', 'Alpha'), ']');

                  return [SRC_RGB, DST_RGB, SRC_ALPHA, DST_ALPHA]
                })

            case S_BLEND_EQUATION:
              return parseParam(
                function (value) {
                  if (typeof value === 'string') {
                    check$1.commandParameter(value, blendEquations, 'invalid ' + prop, env.commandStr);
                    return [
                      blendEquations[value],
                      blendEquations[value]
                    ]
                  } else if (typeof value === 'object') {
                    check$1.commandParameter(
                      value.rgb, blendEquations, prop + '.rgb', env.commandStr);
                    check$1.commandParameter(
                      value.alpha, blendEquations, prop + '.alpha', env.commandStr);
                    return [
                      blendEquations[value.rgb],
                      blendEquations[value.alpha]
                    ]
                  } else {
                    check$1.commandRaise('invalid blend.equation', env.commandStr);
                  }
                },
                function (env, scope, value) {
                  var BLEND_EQUATIONS = env.constants.blendEquations;

                  var RGB = scope.def();
                  var ALPHA = scope.def();

                  var ifte = env.cond('typeof ', value, '==="string"');

                  check$1.optional(function () {
                    function checkProp (block, name, value) {
                      env.assert(block,
                        value + ' in ' + BLEND_EQUATIONS,
                        'invalid ' + name + ', must be one of ' + Object.keys(blendEquations));
                    }
                    checkProp(ifte.then, prop, value);

                    env.assert(ifte.else,
                      value + '&&typeof ' + value + '==="object"',
                      'invalid ' + prop);
                    checkProp(ifte.else, prop + '.rgb', value + '.rgb');
                    checkProp(ifte.else, prop + '.alpha', value + '.alpha');
                  });

                  ifte.then(
                    RGB, '=', ALPHA, '=', BLEND_EQUATIONS, '[', value, '];');
                  ifte.else(
                    RGB, '=', BLEND_EQUATIONS, '[', value, '.rgb];',
                    ALPHA, '=', BLEND_EQUATIONS, '[', value, '.alpha];');

                  scope(ifte);

                  return [RGB, ALPHA]
                })

            case S_BLEND_COLOR:
              return parseParam(
                function (value) {
                  check$1.command(
                    isArrayLike(value) &&
                    value.length === 4,
                    'blend.color must be a 4d array', env.commandStr);
                  return loop(4, function (i) {
                    return +value[i]
                  })
                },
                function (env, scope, value) {
                  check$1.optional(function () {
                    env.assert(scope,
                      env.shared.isArrayLike + '(' + value + ')&&' +
                      value + '.length===4',
                      'blend.color must be a 4d array');
                  });
                  return loop(4, function (i) {
                    return scope.def('+', value, '[', i, ']')
                  })
                })

            case S_STENCIL_MASK:
              return parseParam(
                function (value) {
                  check$1.commandType(value, 'number', param, env.commandStr);
                  return value | 0
                },
                function (env, scope, value) {
                  check$1.optional(function () {
                    env.assert(scope,
                      'typeof ' + value + '==="number"',
                      'invalid stencil.mask');
                  });
                  return scope.def(value, '|0')
                })

            case S_STENCIL_FUNC:
              return parseParam(
                function (value) {
                  check$1.commandType(value, 'object', param, env.commandStr);
                  var cmp = value.cmp || 'keep';
                  var ref = value.ref || 0;
                  var mask = 'mask' in value ? value.mask : -1;
                  check$1.commandParameter(cmp, compareFuncs, prop + '.cmp', env.commandStr);
                  check$1.commandType(ref, 'number', prop + '.ref', env.commandStr);
                  check$1.commandType(mask, 'number', prop + '.mask', env.commandStr);
                  return [
                    compareFuncs[cmp],
                    ref,
                    mask
                  ]
                },
                function (env, scope, value) {
                  var COMPARE_FUNCS = env.constants.compareFuncs;
                  check$1.optional(function () {
                    function assert () {
                      env.assert(scope,
                        Array.prototype.join.call(arguments, ''),
                        'invalid stencil.func');
                    }
                    assert(value + '&&typeof ', value, '==="object"');
                    assert('!("cmp" in ', value, ')||(',
                      value, '.cmp in ', COMPARE_FUNCS, ')');
                  });
                  var cmp = scope.def(
                    '"cmp" in ', value,
                    '?', COMPARE_FUNCS, '[', value, '.cmp]',
                    ':', GL_KEEP);
                  var ref = scope.def(value, '.ref|0');
                  var mask = scope.def(
                    '"mask" in ', value,
                    '?', value, '.mask|0:-1');
                  return [cmp, ref, mask]
                })

            case S_STENCIL_OPFRONT:
            case S_STENCIL_OPBACK:
              return parseParam(
                function (value) {
                  check$1.commandType(value, 'object', param, env.commandStr);
                  var fail = value.fail || 'keep';
                  var zfail = value.zfail || 'keep';
                  var zpass = value.zpass || 'keep';
                  check$1.commandParameter(fail, stencilOps, prop + '.fail', env.commandStr);
                  check$1.commandParameter(zfail, stencilOps, prop + '.zfail', env.commandStr);
                  check$1.commandParameter(zpass, stencilOps, prop + '.zpass', env.commandStr);
                  return [
                    prop === S_STENCIL_OPBACK ? GL_BACK : GL_FRONT,
                    stencilOps[fail],
                    stencilOps[zfail],
                    stencilOps[zpass]
                  ]
                },
                function (env, scope, value) {
                  var STENCIL_OPS = env.constants.stencilOps;

                  check$1.optional(function () {
                    env.assert(scope,
                      value + '&&typeof ' + value + '==="object"',
                      'invalid ' + prop);
                  });

                  function read (name) {
                    check$1.optional(function () {
                      env.assert(scope,
                        '!("' + name + '" in ' + value + ')||' +
                        '(' + value + '.' + name + ' in ' + STENCIL_OPS + ')',
                        'invalid ' + prop + '.' + name + ', must be one of ' + Object.keys(stencilOps));
                    });

                    return scope.def(
                      '"', name, '" in ', value,
                      '?', STENCIL_OPS, '[', value, '.', name, ']:',
                      GL_KEEP)
                  }

                  return [
                    prop === S_STENCIL_OPBACK ? GL_BACK : GL_FRONT,
                    read('fail'),
                    read('zfail'),
                    read('zpass')
                  ]
                })

            case S_POLYGON_OFFSET_OFFSET:
              return parseParam(
                function (value) {
                  check$1.commandType(value, 'object', param, env.commandStr);
                  var factor = value.factor | 0;
                  var units = value.units | 0;
                  check$1.commandType(factor, 'number', param + '.factor', env.commandStr);
                  check$1.commandType(units, 'number', param + '.units', env.commandStr);
                  return [factor, units]
                },
                function (env, scope, value) {
                  check$1.optional(function () {
                    env.assert(scope,
                      value + '&&typeof ' + value + '==="object"',
                      'invalid ' + prop);
                  });

                  var FACTOR = scope.def(value, '.factor|0');
                  var UNITS = scope.def(value, '.units|0');

                  return [FACTOR, UNITS]
                })

            case S_CULL_FACE:
              return parseParam(
                function (value) {
                  var face = 0;
                  if (value === 'front') {
                    face = GL_FRONT;
                  } else if (value === 'back') {
                    face = GL_BACK;
                  }
                  check$1.command(!!face, param, env.commandStr);
                  return face
                },
                function (env, scope, value) {
                  check$1.optional(function () {
                    env.assert(scope,
                      value + '==="front"||' +
                      value + '==="back"',
                      'invalid cull.face');
                  });
                  return scope.def(value, '==="front"?', GL_FRONT, ':', GL_BACK)
                })

            case S_LINE_WIDTH:
              return parseParam(
                function (value) {
                  check$1.command(
                    typeof value === 'number' &&
                    value >= limits.lineWidthDims[0] &&
                    value <= limits.lineWidthDims[1],
                    'invalid line width, must be a positive number between ' +
                    limits.lineWidthDims[0] + ' and ' + limits.lineWidthDims[1], env.commandStr);
                  return value
                },
                function (env, scope, value) {
                  check$1.optional(function () {
                    env.assert(scope,
                      'typeof ' + value + '==="number"&&' +
                      value + '>=' + limits.lineWidthDims[0] + '&&' +
                      value + '<=' + limits.lineWidthDims[1],
                      'invalid line width');
                  });

                  return value
                })

            case S_FRONT_FACE:
              return parseParam(
                function (value) {
                  check$1.commandParameter(value, orientationType, param, env.commandStr);
                  return orientationType[value]
                },
                function (env, scope, value) {
                  check$1.optional(function () {
                    env.assert(scope,
                      value + '==="cw"||' +
                      value + '==="ccw"',
                      'invalid frontFace, must be one of cw,ccw');
                  });
                  return scope.def(value + '==="cw"?' + GL_CW + ':' + GL_CCW)
                })

            case S_COLOR_MASK:
              return parseParam(
                function (value) {
                  check$1.command(
                    isArrayLike(value) && value.length === 4,
                    'color.mask must be length 4 array', env.commandStr);
                  return value.map(function (v) { return !!v })
                },
                function (env, scope, value) {
                  check$1.optional(function () {
                    env.assert(scope,
                      env.shared.isArrayLike + '(' + value + ')&&' +
                      value + '.length===4',
                      'invalid color.mask');
                  });
                  return loop(4, function (i) {
                    return '!!' + value + '[' + i + ']'
                  })
                })

            case S_SAMPLE_COVERAGE:
              return parseParam(
                function (value) {
                  check$1.command(typeof value === 'object' && value, param, env.commandStr);
                  var sampleValue = 'value' in value ? value.value : 1;
                  var sampleInvert = !!value.invert;
                  check$1.command(
                    typeof sampleValue === 'number' &&
                    sampleValue >= 0 && sampleValue <= 1,
                    'sample.coverage.value must be a number between 0 and 1', env.commandStr);
                  return [sampleValue, sampleInvert]
                },
                function (env, scope, value) {
                  check$1.optional(function () {
                    env.assert(scope,
                      value + '&&typeof ' + value + '==="object"',
                      'invalid sample.coverage');
                  });
                  var VALUE = scope.def(
                    '"value" in ', value, '?+', value, '.value:1');
                  var INVERT = scope.def('!!', value, '.invert');
                  return [VALUE, INVERT]
                })
          }
        });

        return STATE
      }

      function parseUniforms (uniforms, env) {
        var staticUniforms = uniforms.static;
        var dynamicUniforms = uniforms.dynamic;

        var UNIFORMS = {};

        Object.keys(staticUniforms).forEach(function (name) {
          var value = staticUniforms[name];
          var result;
          if (typeof value === 'number' ||
              typeof value === 'boolean') {
            result = createStaticDecl(function () {
              return value
            });
          } else if (typeof value === 'function') {
            var reglType = value._reglType;
            if (reglType === 'texture2d' ||
                reglType === 'textureCube') {
              result = createStaticDecl(function (env) {
                return env.link(value)
              });
            } else if (reglType === 'framebuffer' ||
                       reglType === 'framebufferCube') {
              check$1.command(value.color.length > 0,
                'missing color attachment for framebuffer sent to uniform "' + name + '"', env.commandStr);
              result = createStaticDecl(function (env) {
                return env.link(value.color[0])
              });
            } else {
              check$1.commandRaise('invalid data for uniform "' + name + '"', env.commandStr);
            }
          } else if (isArrayLike(value)) {
            result = createStaticDecl(function (env) {
              var ITEM = env.global.def('[',
                loop(value.length, function (i) {
                  check$1.command(
                    typeof value[i] === 'number' ||
                    typeof value[i] === 'boolean',
                    'invalid uniform ' + name, env.commandStr);
                  return value[i]
                }), ']');
              return ITEM
            });
          } else {
            check$1.commandRaise('invalid or missing data for uniform "' + name + '"', env.commandStr);
          }
          result.value = value;
          UNIFORMS[name] = result;
        });

        Object.keys(dynamicUniforms).forEach(function (key) {
          var dyn = dynamicUniforms[key];
          UNIFORMS[key] = createDynamicDecl(dyn, function (env, scope) {
            return env.invoke(scope, dyn)
          });
        });

        return UNIFORMS
      }

      function parseAttributes (attributes, env) {
        var staticAttributes = attributes.static;
        var dynamicAttributes = attributes.dynamic;

        var attributeDefs = {};

        Object.keys(staticAttributes).forEach(function (attribute) {
          var value = staticAttributes[attribute];
          var id = stringStore.id(attribute);

          var record = new AttributeRecord();
          if (isBufferArgs(value)) {
            record.state = ATTRIB_STATE_POINTER;
            record.buffer = bufferState.getBuffer(
              bufferState.create(value, GL_ARRAY_BUFFER$2, false, true));
            record.type = 0;
          } else {
            var buffer = bufferState.getBuffer(value);
            if (buffer) {
              record.state = ATTRIB_STATE_POINTER;
              record.buffer = buffer;
              record.type = 0;
            } else {
              check$1.command(typeof value === 'object' && value,
                'invalid data for attribute ' + attribute, env.commandStr);
              if ('constant' in value) {
                var constant = value.constant;
                record.buffer = 'null';
                record.state = ATTRIB_STATE_CONSTANT;
                if (typeof constant === 'number') {
                  record.x = constant;
                } else {
                  check$1.command(
                    isArrayLike(constant) &&
                    constant.length > 0 &&
                    constant.length <= 4,
                    'invalid constant for attribute ' + attribute, env.commandStr);
                  CUTE_COMPONENTS.forEach(function (c, i) {
                    if (i < constant.length) {
                      record[c] = constant[i];
                    }
                  });
                }
              } else {
                if (isBufferArgs(value.buffer)) {
                  buffer = bufferState.getBuffer(
                    bufferState.create(value.buffer, GL_ARRAY_BUFFER$2, false, true));
                } else {
                  buffer = bufferState.getBuffer(value.buffer);
                }
                check$1.command(!!buffer, 'missing buffer for attribute "' + attribute + '"', env.commandStr);

                var offset = value.offset | 0;
                check$1.command(offset >= 0,
                  'invalid offset for attribute "' + attribute + '"', env.commandStr);

                var stride = value.stride | 0;
                check$1.command(stride >= 0 && stride < 256,
                  'invalid stride for attribute "' + attribute + '", must be integer betweeen [0, 255]', env.commandStr);

                var size = value.size | 0;
                check$1.command(!('size' in value) || (size > 0 && size <= 4),
                  'invalid size for attribute "' + attribute + '", must be 1,2,3,4', env.commandStr);

                var normalized = !!value.normalized;

                var type = 0;
                if ('type' in value) {
                  check$1.commandParameter(
                    value.type, glTypes,
                    'invalid type for attribute ' + attribute, env.commandStr);
                  type = glTypes[value.type];
                }

                var divisor = value.divisor | 0;
                if ('divisor' in value) {
                  check$1.command(divisor === 0 || extInstancing,
                    'cannot specify divisor for attribute "' + attribute + '", instancing not supported', env.commandStr);
                  check$1.command(divisor >= 0,
                    'invalid divisor for attribute "' + attribute + '"', env.commandStr);
                }

                check$1.optional(function () {
                  var command = env.commandStr;

                  var VALID_KEYS = [
                    'buffer',
                    'offset',
                    'divisor',
                    'normalized',
                    'type',
                    'size',
                    'stride'
                  ];

                  Object.keys(value).forEach(function (prop) {
                    check$1.command(
                      VALID_KEYS.indexOf(prop) >= 0,
                      'unknown parameter "' + prop + '" for attribute pointer "' + attribute + '" (valid parameters are ' + VALID_KEYS + ')',
                      command);
                  });
                });

                record.buffer = buffer;
                record.state = ATTRIB_STATE_POINTER;
                record.size = size;
                record.normalized = normalized;
                record.type = type || buffer.dtype;
                record.offset = offset;
                record.stride = stride;
                record.divisor = divisor;
              }
            }
          }

          attributeDefs[attribute] = createStaticDecl(function (env, scope) {
            var cache = env.attribCache;
            if (id in cache) {
              return cache[id]
            }
            var result = {
              isStream: false
            };
            Object.keys(record).forEach(function (key) {
              result[key] = record[key];
            });
            if (record.buffer) {
              result.buffer = env.link(record.buffer);
              result.type = result.type || (result.buffer + '.dtype');
            }
            cache[id] = result;
            return result
          });
        });

        Object.keys(dynamicAttributes).forEach(function (attribute) {
          var dyn = dynamicAttributes[attribute];

          function appendAttributeCode (env, block) {
            var VALUE = env.invoke(block, dyn);

            var shared = env.shared;
            var constants = env.constants;

            var IS_BUFFER_ARGS = shared.isBufferArgs;
            var BUFFER_STATE = shared.buffer;

            // Perform validation on attribute
            check$1.optional(function () {
              env.assert(block,
                VALUE + '&&(typeof ' + VALUE + '==="object"||typeof ' +
                VALUE + '==="function")&&(' +
                IS_BUFFER_ARGS + '(' + VALUE + ')||' +
                BUFFER_STATE + '.getBuffer(' + VALUE + ')||' +
                BUFFER_STATE + '.getBuffer(' + VALUE + '.buffer)||' +
                IS_BUFFER_ARGS + '(' + VALUE + '.buffer)||' +
                '("constant" in ' + VALUE +
                '&&(typeof ' + VALUE + '.constant==="number"||' +
                shared.isArrayLike + '(' + VALUE + '.constant))))',
                'invalid dynamic attribute "' + attribute + '"');
            });

            // allocate names for result
            var result = {
              isStream: block.def(false)
            };
            var defaultRecord = new AttributeRecord();
            defaultRecord.state = ATTRIB_STATE_POINTER;
            Object.keys(defaultRecord).forEach(function (key) {
              result[key] = block.def('' + defaultRecord[key]);
            });

            var BUFFER = result.buffer;
            var TYPE = result.type;
            block(
              'if(', IS_BUFFER_ARGS, '(', VALUE, ')){',
              result.isStream, '=true;',
              BUFFER, '=', BUFFER_STATE, '.createStream(', GL_ARRAY_BUFFER$2, ',', VALUE, ');',
              TYPE, '=', BUFFER, '.dtype;',
              '}else{',
              BUFFER, '=', BUFFER_STATE, '.getBuffer(', VALUE, ');',
              'if(', BUFFER, '){',
              TYPE, '=', BUFFER, '.dtype;',
              '}else if("constant" in ', VALUE, '){',
              result.state, '=', ATTRIB_STATE_CONSTANT, ';',
              'if(typeof ' + VALUE + '.constant === "number"){',
              result[CUTE_COMPONENTS[0]], '=', VALUE, '.constant;',
              CUTE_COMPONENTS.slice(1).map(function (n) {
                return result[n]
              }).join('='), '=0;',
              '}else{',
              CUTE_COMPONENTS.map(function (name, i) {
                return (
                  result[name] + '=' + VALUE + '.constant.length>' + i +
                  '?' + VALUE + '.constant[' + i + ']:0;'
                )
              }).join(''),
              '}}else{',
              'if(', IS_BUFFER_ARGS, '(', VALUE, '.buffer)){',
              BUFFER, '=', BUFFER_STATE, '.createStream(', GL_ARRAY_BUFFER$2, ',', VALUE, '.buffer);',
              '}else{',
              BUFFER, '=', BUFFER_STATE, '.getBuffer(', VALUE, '.buffer);',
              '}',
              TYPE, '="type" in ', VALUE, '?',
              constants.glTypes, '[', VALUE, '.type]:', BUFFER, '.dtype;',
              result.normalized, '=!!', VALUE, '.normalized;');
            function emitReadRecord (name) {
              block(result[name], '=', VALUE, '.', name, '|0;');
            }
            emitReadRecord('size');
            emitReadRecord('offset');
            emitReadRecord('stride');
            emitReadRecord('divisor');

            block('}}');

            block.exit(
              'if(', result.isStream, '){',
              BUFFER_STATE, '.destroyStream(', BUFFER, ');',
              '}');

            return result
          }

          attributeDefs[attribute] = createDynamicDecl(dyn, appendAttributeCode);
        });

        return attributeDefs
      }

      function parseVAO (options, env) {
        var staticOptions = options.static;
        var dynamicOptions = options.dynamic;
        if (S_VAO in staticOptions) {
          var vao = staticOptions[S_VAO];
          if (vao !== null && attributeState.getVAO(vao) === null) {
            vao = attributeState.createVAO(vao);
          }
          return createStaticDecl(function (env) {
            return env.link(attributeState.getVAO(vao))
          })
        } else if (S_VAO in dynamicOptions) {
          var dyn = dynamicOptions[S_VAO];
          return createDynamicDecl(dyn, function (env, scope) {
            var vaoRef = env.invoke(scope, dyn);
            return scope.def(env.shared.vao + '.getVAO(' + vaoRef + ')')
          })
        }
        return null
      }

      function parseContext (context) {
        var staticContext = context.static;
        var dynamicContext = context.dynamic;
        var result = {};

        Object.keys(staticContext).forEach(function (name) {
          var value = staticContext[name];
          result[name] = createStaticDecl(function (env, scope) {
            if (typeof value === 'number' || typeof value === 'boolean') {
              return '' + value
            } else {
              return env.link(value)
            }
          });
        });

        Object.keys(dynamicContext).forEach(function (name) {
          var dyn = dynamicContext[name];
          result[name] = createDynamicDecl(dyn, function (env, scope) {
            return env.invoke(scope, dyn)
          });
        });

        return result
      }

      function parseArguments (options, attributes, uniforms, context, env) {
        var staticOptions = options.static;
        var dynamicOptions = options.dynamic;

        check$1.optional(function () {
          var KEY_NAMES = [
            S_FRAMEBUFFER,
            S_VERT,
            S_FRAG,
            S_ELEMENTS,
            S_PRIMITIVE,
            S_OFFSET,
            S_COUNT,
            S_INSTANCES,
            S_PROFILE,
            S_VAO
          ].concat(GL_STATE_NAMES);

          function checkKeys (dict) {
            Object.keys(dict).forEach(function (key) {
              check$1.command(
                KEY_NAMES.indexOf(key) >= 0,
                'unknown parameter "' + key + '"',
                env.commandStr);
            });
          }

          checkKeys(staticOptions);
          checkKeys(dynamicOptions);
        });

        var attribLocations = parseAttribLocations(options, attributes);

        var framebuffer = parseFramebuffer(options);
        var viewportAndScissor = parseViewportScissor(options, framebuffer, env);
        var draw = parseDraw(options, env);
        var state = parseGLState(options, env);
        var shader = parseProgram(options, env, attribLocations);

        function copyBox (name) {
          var defn = viewportAndScissor[name];
          if (defn) {
            state[name] = defn;
          }
        }
        copyBox(S_VIEWPORT);
        copyBox(propName(S_SCISSOR_BOX));

        var dirty = Object.keys(state).length > 0;

        var result = {
          framebuffer: framebuffer,
          draw: draw,
          shader: shader,
          state: state,
          dirty: dirty,
          scopeVAO: null,
          drawVAO: null,
          useVAO: false,
          attributes: {}
        };

        result.profile = parseProfile(options);
        result.uniforms = parseUniforms(uniforms, env);
        result.drawVAO = result.scopeVAO = parseVAO(options);
        // special case: check if we can statically allocate a vertex array object for this program
        if (!result.drawVAO && shader.program && !attribLocations && extensions.angle_instanced_arrays) {
          var useVAO = true;
          var staticBindings = shader.program.attributes.map(function (attr) {
            var binding = attributes.static[attr];
            useVAO = useVAO && !!binding;
            return binding
          });
          if (useVAO && staticBindings.length > 0) {
            var vao = attributeState.getVAO(attributeState.createVAO(staticBindings));
            result.drawVAO = new Declaration(null, null, null, function (env, scope) {
              return env.link(vao)
            });
            result.useVAO = true;
          }
        }
        if (attribLocations) {
          result.useVAO = true;
        } else {
          result.attributes = parseAttributes(attributes, env);
        }
        result.context = parseContext(context);
        return result
      }

      // ===================================================
      // ===================================================
      // COMMON UPDATE FUNCTIONS
      // ===================================================
      // ===================================================
      function emitContext (env, scope, context) {
        var shared = env.shared;
        var CONTEXT = shared.context;

        var contextEnter = env.scope();

        Object.keys(context).forEach(function (name) {
          scope.save(CONTEXT, '.' + name);
          var defn = context[name];
          contextEnter(CONTEXT, '.', name, '=', defn.append(env, scope), ';');
        });

        scope(contextEnter);
      }

      // ===================================================
      // ===================================================
      // COMMON DRAWING FUNCTIONS
      // ===================================================
      // ===================================================
      function emitPollFramebuffer (env, scope, framebuffer, skipCheck) {
        var shared = env.shared;

        var GL = shared.gl;
        var FRAMEBUFFER_STATE = shared.framebuffer;
        var EXT_DRAW_BUFFERS;
        if (extDrawBuffers) {
          EXT_DRAW_BUFFERS = scope.def(shared.extensions, '.webgl_draw_buffers');
        }

        var constants = env.constants;

        var DRAW_BUFFERS = constants.drawBuffer;
        var BACK_BUFFER = constants.backBuffer;

        var NEXT;
        if (framebuffer) {
          NEXT = framebuffer.append(env, scope);
        } else {
          NEXT = scope.def(FRAMEBUFFER_STATE, '.next');
        }

        if (!skipCheck) {
          scope('if(', NEXT, '!==', FRAMEBUFFER_STATE, '.cur){');
        }
        scope(
          'if(', NEXT, '){',
          GL, '.bindFramebuffer(', GL_FRAMEBUFFER$2, ',', NEXT, '.framebuffer);');
        if (extDrawBuffers) {
          scope(EXT_DRAW_BUFFERS, '.drawBuffersWEBGL(',
            DRAW_BUFFERS, '[', NEXT, '.colorAttachments.length]);');
        }
        scope('}else{',
          GL, '.bindFramebuffer(', GL_FRAMEBUFFER$2, ',null);');
        if (extDrawBuffers) {
          scope(EXT_DRAW_BUFFERS, '.drawBuffersWEBGL(', BACK_BUFFER, ');');
        }
        scope(
          '}',
          FRAMEBUFFER_STATE, '.cur=', NEXT, ';');
        if (!skipCheck) {
          scope('}');
        }
      }

      function emitPollState (env, scope, args) {
        var shared = env.shared;

        var GL = shared.gl;

        var CURRENT_VARS = env.current;
        var NEXT_VARS = env.next;
        var CURRENT_STATE = shared.current;
        var NEXT_STATE = shared.next;

        var block = env.cond(CURRENT_STATE, '.dirty');

        GL_STATE_NAMES.forEach(function (prop) {
          var param = propName(prop);
          if (param in args.state) {
            return
          }

          var NEXT, CURRENT;
          if (param in NEXT_VARS) {
            NEXT = NEXT_VARS[param];
            CURRENT = CURRENT_VARS[param];
            var parts = loop(currentState[param].length, function (i) {
              return block.def(NEXT, '[', i, ']')
            });
            block(env.cond(parts.map(function (p, i) {
              return p + '!==' + CURRENT + '[' + i + ']'
            }).join('||'))
              .then(
                GL, '.', GL_VARIABLES[param], '(', parts, ');',
                parts.map(function (p, i) {
                  return CURRENT + '[' + i + ']=' + p
                }).join(';'), ';'));
          } else {
            NEXT = block.def(NEXT_STATE, '.', param);
            var ifte = env.cond(NEXT, '!==', CURRENT_STATE, '.', param);
            block(ifte);
            if (param in GL_FLAGS) {
              ifte(
                env.cond(NEXT)
                  .then(GL, '.enable(', GL_FLAGS[param], ');')
                  .else(GL, '.disable(', GL_FLAGS[param], ');'),
                CURRENT_STATE, '.', param, '=', NEXT, ';');
            } else {
              ifte(
                GL, '.', GL_VARIABLES[param], '(', NEXT, ');',
                CURRENT_STATE, '.', param, '=', NEXT, ';');
            }
          }
        });
        if (Object.keys(args.state).length === 0) {
          block(CURRENT_STATE, '.dirty=false;');
        }
        scope(block);
      }

      function emitSetOptions (env, scope, options, filter) {
        var shared = env.shared;
        var CURRENT_VARS = env.current;
        var CURRENT_STATE = shared.current;
        var GL = shared.gl;
        sortState(Object.keys(options)).forEach(function (param) {
          var defn = options[param];
          if (filter && !filter(defn)) {
            return
          }
          var variable = defn.append(env, scope);
          if (GL_FLAGS[param]) {
            var flag = GL_FLAGS[param];
            if (isStatic(defn)) {
              if (variable) {
                scope(GL, '.enable(', flag, ');');
              } else {
                scope(GL, '.disable(', flag, ');');
              }
            } else {
              scope(env.cond(variable)
                .then(GL, '.enable(', flag, ');')
                .else(GL, '.disable(', flag, ');'));
            }
            scope(CURRENT_STATE, '.', param, '=', variable, ';');
          } else if (isArrayLike(variable)) {
            var CURRENT = CURRENT_VARS[param];
            scope(
              GL, '.', GL_VARIABLES[param], '(', variable, ');',
              variable.map(function (v, i) {
                return CURRENT + '[' + i + ']=' + v
              }).join(';'), ';');
          } else {
            scope(
              GL, '.', GL_VARIABLES[param], '(', variable, ');',
              CURRENT_STATE, '.', param, '=', variable, ';');
          }
        });
      }

      function injectExtensions (env, scope) {
        if (extInstancing) {
          env.instancing = scope.def(
            env.shared.extensions, '.angle_instanced_arrays');
        }
      }

      function emitProfile (env, scope, args, useScope, incrementCounter) {
        var shared = env.shared;
        var STATS = env.stats;
        var CURRENT_STATE = shared.current;
        var TIMER = shared.timer;
        var profileArg = args.profile;

        function perfCounter () {
          if (typeof performance === 'undefined') {
            return 'Date.now()'
          } else {
            return 'performance.now()'
          }
        }

        var CPU_START, QUERY_COUNTER;
        function emitProfileStart (block) {
          CPU_START = scope.def();
          block(CPU_START, '=', perfCounter(), ';');
          if (typeof incrementCounter === 'string') {
            block(STATS, '.count+=', incrementCounter, ';');
          } else {
            block(STATS, '.count++;');
          }
          if (timer) {
            if (useScope) {
              QUERY_COUNTER = scope.def();
              block(QUERY_COUNTER, '=', TIMER, '.getNumPendingQueries();');
            } else {
              block(TIMER, '.beginQuery(', STATS, ');');
            }
          }
        }

        function emitProfileEnd (block) {
          block(STATS, '.cpuTime+=', perfCounter(), '-', CPU_START, ';');
          if (timer) {
            if (useScope) {
              block(TIMER, '.pushScopeStats(',
                QUERY_COUNTER, ',',
                TIMER, '.getNumPendingQueries(),',
                STATS, ');');
            } else {
              block(TIMER, '.endQuery();');
            }
          }
        }

        function scopeProfile (value) {
          var prev = scope.def(CURRENT_STATE, '.profile');
          scope(CURRENT_STATE, '.profile=', value, ';');
          scope.exit(CURRENT_STATE, '.profile=', prev, ';');
        }

        var USE_PROFILE;
        if (profileArg) {
          if (isStatic(profileArg)) {
            if (profileArg.enable) {
              emitProfileStart(scope);
              emitProfileEnd(scope.exit);
              scopeProfile('true');
            } else {
              scopeProfile('false');
            }
            return
          }
          USE_PROFILE = profileArg.append(env, scope);
          scopeProfile(USE_PROFILE);
        } else {
          USE_PROFILE = scope.def(CURRENT_STATE, '.profile');
        }

        var start = env.block();
        emitProfileStart(start);
        scope('if(', USE_PROFILE, '){', start, '}');
        var end = env.block();
        emitProfileEnd(end);
        scope.exit('if(', USE_PROFILE, '){', end, '}');
      }

      function emitAttributes (env, scope, args, attributes, filter) {
        var shared = env.shared;

        function typeLength (x) {
          switch (x) {
            case GL_FLOAT_VEC2:
            case GL_INT_VEC2:
            case GL_BOOL_VEC2:
              return 2
            case GL_FLOAT_VEC3:
            case GL_INT_VEC3:
            case GL_BOOL_VEC3:
              return 3
            case GL_FLOAT_VEC4:
            case GL_INT_VEC4:
            case GL_BOOL_VEC4:
              return 4
            default:
              return 1
          }
        }

        function emitBindAttribute (ATTRIBUTE, size, record) {
          var GL = shared.gl;

          var LOCATION = scope.def(ATTRIBUTE, '.location');
          var BINDING = scope.def(shared.attributes, '[', LOCATION, ']');

          var STATE = record.state;
          var BUFFER = record.buffer;
          var CONST_COMPONENTS = [
            record.x,
            record.y,
            record.z,
            record.w
          ];

          var COMMON_KEYS = [
            'buffer',
            'normalized',
            'offset',
            'stride'
          ];

          function emitBuffer () {
            scope(
              'if(!', BINDING, '.buffer){',
              GL, '.enableVertexAttribArray(', LOCATION, ');}');

            var TYPE = record.type;
            var SIZE;
            if (!record.size) {
              SIZE = size;
            } else {
              SIZE = scope.def(record.size, '||', size);
            }

            scope('if(',
              BINDING, '.type!==', TYPE, '||',
              BINDING, '.size!==', SIZE, '||',
              COMMON_KEYS.map(function (key) {
                return BINDING + '.' + key + '!==' + record[key]
              }).join('||'),
              '){',
              GL, '.bindBuffer(', GL_ARRAY_BUFFER$2, ',', BUFFER, '.buffer);',
              GL, '.vertexAttribPointer(', [
                LOCATION,
                SIZE,
                TYPE,
                record.normalized,
                record.stride,
                record.offset
              ], ');',
              BINDING, '.type=', TYPE, ';',
              BINDING, '.size=', SIZE, ';',
              COMMON_KEYS.map(function (key) {
                return BINDING + '.' + key + '=' + record[key] + ';'
              }).join(''),
              '}');

            if (extInstancing) {
              var DIVISOR = record.divisor;
              scope(
                'if(', BINDING, '.divisor!==', DIVISOR, '){',
                env.instancing, '.vertexAttribDivisorANGLE(', [LOCATION, DIVISOR], ');',
                BINDING, '.divisor=', DIVISOR, ';}');
            }
          }

          function emitConstant () {
            scope(
              'if(', BINDING, '.buffer){',
              GL, '.disableVertexAttribArray(', LOCATION, ');',
              BINDING, '.buffer=null;',
              '}if(', CUTE_COMPONENTS.map(function (c, i) {
                return BINDING + '.' + c + '!==' + CONST_COMPONENTS[i]
              }).join('||'), '){',
              GL, '.vertexAttrib4f(', LOCATION, ',', CONST_COMPONENTS, ');',
              CUTE_COMPONENTS.map(function (c, i) {
                return BINDING + '.' + c + '=' + CONST_COMPONENTS[i] + ';'
              }).join(''),
              '}');
          }

          if (STATE === ATTRIB_STATE_POINTER) {
            emitBuffer();
          } else if (STATE === ATTRIB_STATE_CONSTANT) {
            emitConstant();
          } else {
            scope('if(', STATE, '===', ATTRIB_STATE_POINTER, '){');
            emitBuffer();
            scope('}else{');
            emitConstant();
            scope('}');
          }
        }

        attributes.forEach(function (attribute) {
          var name = attribute.name;
          var arg = args.attributes[name];
          var record;
          if (arg) {
            if (!filter(arg)) {
              return
            }
            record = arg.append(env, scope);
          } else {
            if (!filter(SCOPE_DECL)) {
              return
            }
            var scopeAttrib = env.scopeAttrib(name);
            check$1.optional(function () {
              env.assert(scope,
                scopeAttrib + '.state',
                'missing attribute ' + name);
            });
            record = {};
            Object.keys(new AttributeRecord()).forEach(function (key) {
              record[key] = scope.def(scopeAttrib, '.', key);
            });
          }
          emitBindAttribute(
            env.link(attribute), typeLength(attribute.info.type), record);
        });
      }

      function emitUniforms (env, scope, args, uniforms, filter) {
        var shared = env.shared;
        var GL = shared.gl;

        var infix;
        for (var i = 0; i < uniforms.length; ++i) {
          var uniform = uniforms[i];
          var name = uniform.name;
          var type = uniform.info.type;
          var arg = args.uniforms[name];
          var UNIFORM = env.link(uniform);
          var LOCATION = UNIFORM + '.location';

          var VALUE;
          if (arg) {
            if (!filter(arg)) {
              continue
            }
            if (isStatic(arg)) {
              var value = arg.value;
              check$1.command(
                value !== null && typeof value !== 'undefined',
                'missing uniform "' + name + '"', env.commandStr);
              if (type === GL_SAMPLER_2D || type === GL_SAMPLER_CUBE) {
                check$1.command(
                  typeof value === 'function' &&
                  ((type === GL_SAMPLER_2D &&
                    (value._reglType === 'texture2d' ||
                    value._reglType === 'framebuffer')) ||
                  (type === GL_SAMPLER_CUBE &&
                    (value._reglType === 'textureCube' ||
                    value._reglType === 'framebufferCube'))),
                  'invalid texture for uniform ' + name, env.commandStr);
                var TEX_VALUE = env.link(value._texture || value.color[0]._texture);
                scope(GL, '.uniform1i(', LOCATION, ',', TEX_VALUE + '.bind());');
                scope.exit(TEX_VALUE, '.unbind();');
              } else if (
                type === GL_FLOAT_MAT2 ||
                type === GL_FLOAT_MAT3 ||
                type === GL_FLOAT_MAT4) {
                check$1.optional(function () {
                  check$1.command(isArrayLike(value),
                    'invalid matrix for uniform ' + name, env.commandStr);
                  check$1.command(
                    (type === GL_FLOAT_MAT2 && value.length === 4) ||
                    (type === GL_FLOAT_MAT3 && value.length === 9) ||
                    (type === GL_FLOAT_MAT4 && value.length === 16),
                    'invalid length for matrix uniform ' + name, env.commandStr);
                });
                var MAT_VALUE = env.global.def('new Float32Array([' +
                  Array.prototype.slice.call(value) + '])');
                var dim = 2;
                if (type === GL_FLOAT_MAT3) {
                  dim = 3;
                } else if (type === GL_FLOAT_MAT4) {
                  dim = 4;
                }
                scope(
                  GL, '.uniformMatrix', dim, 'fv(',
                  LOCATION, ',false,', MAT_VALUE, ');');
              } else {
                switch (type) {
                  case GL_FLOAT$8:
                    check$1.commandType(value, 'number', 'uniform ' + name, env.commandStr);
                    infix = '1f';
                    break
                  case GL_FLOAT_VEC2:
                    check$1.command(
                      isArrayLike(value) && value.length === 2,
                      'uniform ' + name, env.commandStr);
                    infix = '2f';
                    break
                  case GL_FLOAT_VEC3:
                    check$1.command(
                      isArrayLike(value) && value.length === 3,
                      'uniform ' + name, env.commandStr);
                    infix = '3f';
                    break
                  case GL_FLOAT_VEC4:
                    check$1.command(
                      isArrayLike(value) && value.length === 4,
                      'uniform ' + name, env.commandStr);
                    infix = '4f';
                    break
                  case GL_BOOL:
                    check$1.commandType(value, 'boolean', 'uniform ' + name, env.commandStr);
                    infix = '1i';
                    break
                  case GL_INT$3:
                    check$1.commandType(value, 'number', 'uniform ' + name, env.commandStr);
                    infix = '1i';
                    break
                  case GL_BOOL_VEC2:
                    check$1.command(
                      isArrayLike(value) && value.length === 2,
                      'uniform ' + name, env.commandStr);
                    infix = '2i';
                    break
                  case GL_INT_VEC2:
                    check$1.command(
                      isArrayLike(value) && value.length === 2,
                      'uniform ' + name, env.commandStr);
                    infix = '2i';
                    break
                  case GL_BOOL_VEC3:
                    check$1.command(
                      isArrayLike(value) && value.length === 3,
                      'uniform ' + name, env.commandStr);
                    infix = '3i';
                    break
                  case GL_INT_VEC3:
                    check$1.command(
                      isArrayLike(value) && value.length === 3,
                      'uniform ' + name, env.commandStr);
                    infix = '3i';
                    break
                  case GL_BOOL_VEC4:
                    check$1.command(
                      isArrayLike(value) && value.length === 4,
                      'uniform ' + name, env.commandStr);
                    infix = '4i';
                    break
                  case GL_INT_VEC4:
                    check$1.command(
                      isArrayLike(value) && value.length === 4,
                      'uniform ' + name, env.commandStr);
                    infix = '4i';
                    break
                }
                scope(GL, '.uniform', infix, '(', LOCATION, ',',
                  isArrayLike(value) ? Array.prototype.slice.call(value) : value,
                  ');');
              }
              continue
            } else {
              VALUE = arg.append(env, scope);
            }
          } else {
            if (!filter(SCOPE_DECL)) {
              continue
            }
            VALUE = scope.def(shared.uniforms, '[', stringStore.id(name), ']');
          }

          if (type === GL_SAMPLER_2D) {
            scope(
              'if(', VALUE, '&&', VALUE, '._reglType==="framebuffer"){',
              VALUE, '=', VALUE, '.color[0];',
              '}');
          } else if (type === GL_SAMPLER_CUBE) {
            scope(
              'if(', VALUE, '&&', VALUE, '._reglType==="framebufferCube"){',
              VALUE, '=', VALUE, '.color[0];',
              '}');
          }

          // perform type validation
          check$1.optional(function () {
            function check (pred, message) {
              env.assert(scope, pred,
                'bad data or missing for uniform "' + name + '".  ' + message);
            }

            function checkType (type) {
              check(
                'typeof ' + VALUE + '==="' + type + '"',
                'invalid type, expected ' + type);
            }

            function checkVector (n, type) {
              check(
                shared.isArrayLike + '(' + VALUE + ')&&' + VALUE + '.length===' + n,
                'invalid vector, should have length ' + n, env.commandStr);
            }

            function checkTexture (target) {
              check(
                'typeof ' + VALUE + '==="function"&&' +
                VALUE + '._reglType==="texture' +
                (target === GL_TEXTURE_2D$3 ? '2d' : 'Cube') + '"',
                'invalid texture type', env.commandStr);
            }

            switch (type) {
              case GL_INT$3:
                checkType('number');
                break
              case GL_INT_VEC2:
                checkVector(2);
                break
              case GL_INT_VEC3:
                checkVector(3);
                break
              case GL_INT_VEC4:
                checkVector(4);
                break
              case GL_FLOAT$8:
                checkType('number');
                break
              case GL_FLOAT_VEC2:
                checkVector(2);
                break
              case GL_FLOAT_VEC3:
                checkVector(3);
                break
              case GL_FLOAT_VEC4:
                checkVector(4);
                break
              case GL_BOOL:
                checkType('boolean');
                break
              case GL_BOOL_VEC2:
                checkVector(2);
                break
              case GL_BOOL_VEC3:
                checkVector(3);
                break
              case GL_BOOL_VEC4:
                checkVector(4);
                break
              case GL_FLOAT_MAT2:
                checkVector(4);
                break
              case GL_FLOAT_MAT3:
                checkVector(9);
                break
              case GL_FLOAT_MAT4:
                checkVector(16);
                break
              case GL_SAMPLER_2D:
                checkTexture(GL_TEXTURE_2D$3);
                break
              case GL_SAMPLER_CUBE:
                checkTexture(GL_TEXTURE_CUBE_MAP$2);
                break
            }
          });

          var unroll = 1;
          switch (type) {
            case GL_SAMPLER_2D:
            case GL_SAMPLER_CUBE:
              var TEX = scope.def(VALUE, '._texture');
              scope(GL, '.uniform1i(', LOCATION, ',', TEX, '.bind());');
              scope.exit(TEX, '.unbind();');
              continue

            case GL_INT$3:
            case GL_BOOL:
              infix = '1i';
              break

            case GL_INT_VEC2:
            case GL_BOOL_VEC2:
              infix = '2i';
              unroll = 2;
              break

            case GL_INT_VEC3:
            case GL_BOOL_VEC3:
              infix = '3i';
              unroll = 3;
              break

            case GL_INT_VEC4:
            case GL_BOOL_VEC4:
              infix = '4i';
              unroll = 4;
              break

            case GL_FLOAT$8:
              infix = '1f';
              break

            case GL_FLOAT_VEC2:
              infix = '2f';
              unroll = 2;
              break

            case GL_FLOAT_VEC3:
              infix = '3f';
              unroll = 3;
              break

            case GL_FLOAT_VEC4:
              infix = '4f';
              unroll = 4;
              break

            case GL_FLOAT_MAT2:
              infix = 'Matrix2fv';
              break

            case GL_FLOAT_MAT3:
              infix = 'Matrix3fv';
              break

            case GL_FLOAT_MAT4:
              infix = 'Matrix4fv';
              break
          }

          scope(GL, '.uniform', infix, '(', LOCATION, ',');
          if (infix.charAt(0) === 'M') {
            var matSize = Math.pow(type - GL_FLOAT_MAT2 + 2, 2);
            var STORAGE = env.global.def('new Float32Array(', matSize, ')');
            scope(
              'false,(Array.isArray(', VALUE, ')||', VALUE, ' instanceof Float32Array)?', VALUE, ':(',
              loop(matSize, function (i) {
                return STORAGE + '[' + i + ']=' + VALUE + '[' + i + ']'
              }), ',', STORAGE, ')');
          } else if (unroll > 1) {
            scope(loop(unroll, function (i) {
              return VALUE + '[' + i + ']'
            }));
          } else {
            scope(VALUE);
          }
          scope(');');
        }
      }

      function emitDraw (env, outer, inner, args) {
        var shared = env.shared;
        var GL = shared.gl;
        var DRAW_STATE = shared.draw;

        var drawOptions = args.draw;

        function emitElements () {
          var defn = drawOptions.elements;
          var ELEMENTS;
          var scope = outer;
          if (defn) {
            if ((defn.contextDep && args.contextDynamic) || defn.propDep) {
              scope = inner;
            }
            ELEMENTS = defn.append(env, scope);
          } else {
            ELEMENTS = scope.def(DRAW_STATE, '.', S_ELEMENTS);
          }
          if (ELEMENTS) {
            scope(
              'if(' + ELEMENTS + ')' +
              GL + '.bindBuffer(' + GL_ELEMENT_ARRAY_BUFFER$1 + ',' + ELEMENTS + '.buffer.buffer);');
          }
          return ELEMENTS
        }

        function emitCount () {
          var defn = drawOptions.count;
          var COUNT;
          var scope = outer;
          if (defn) {
            if ((defn.contextDep && args.contextDynamic) || defn.propDep) {
              scope = inner;
            }
            COUNT = defn.append(env, scope);
            check$1.optional(function () {
              if (defn.MISSING) {
                env.assert(outer, 'false', 'missing vertex count');
              }
              if (defn.DYNAMIC) {
                env.assert(scope, COUNT + '>=0', 'missing vertex count');
              }
            });
          } else {
            COUNT = scope.def(DRAW_STATE, '.', S_COUNT);
            check$1.optional(function () {
              env.assert(scope, COUNT + '>=0', 'missing vertex count');
            });
          }
          return COUNT
        }

        var ELEMENTS = emitElements();
        function emitValue (name) {
          var defn = drawOptions[name];
          if (defn) {
            if ((defn.contextDep && args.contextDynamic) || defn.propDep) {
              return defn.append(env, inner)
            } else {
              return defn.append(env, outer)
            }
          } else {
            return outer.def(DRAW_STATE, '.', name)
          }
        }

        var PRIMITIVE = emitValue(S_PRIMITIVE);
        var OFFSET = emitValue(S_OFFSET);

        var COUNT = emitCount();
        if (typeof COUNT === 'number') {
          if (COUNT === 0) {
            return
          }
        } else {
          inner('if(', COUNT, '){');
          inner.exit('}');
        }

        var INSTANCES, EXT_INSTANCING;
        if (extInstancing) {
          INSTANCES = emitValue(S_INSTANCES);
          EXT_INSTANCING = env.instancing;
        }

        var ELEMENT_TYPE = ELEMENTS + '.type';

        var elementsStatic = drawOptions.elements && isStatic(drawOptions.elements);

        function emitInstancing () {
          function drawElements () {
            inner(EXT_INSTANCING, '.drawElementsInstancedANGLE(', [
              PRIMITIVE,
              COUNT,
              ELEMENT_TYPE,
              OFFSET + '<<((' + ELEMENT_TYPE + '-' + GL_UNSIGNED_BYTE$8 + ')>>1)',
              INSTANCES
            ], ');');
          }

          function drawArrays () {
            inner(EXT_INSTANCING, '.drawArraysInstancedANGLE(',
              [PRIMITIVE, OFFSET, COUNT, INSTANCES], ');');
          }

          if (ELEMENTS) {
            if (!elementsStatic) {
              inner('if(', ELEMENTS, '){');
              drawElements();
              inner('}else{');
              drawArrays();
              inner('}');
            } else {
              drawElements();
            }
          } else {
            drawArrays();
          }
        }

        function emitRegular () {
          function drawElements () {
            inner(GL + '.drawElements(' + [
              PRIMITIVE,
              COUNT,
              ELEMENT_TYPE,
              OFFSET + '<<((' + ELEMENT_TYPE + '-' + GL_UNSIGNED_BYTE$8 + ')>>1)'
            ] + ');');
          }

          function drawArrays () {
            inner(GL + '.drawArrays(' + [PRIMITIVE, OFFSET, COUNT] + ');');
          }

          if (ELEMENTS) {
            if (!elementsStatic) {
              inner('if(', ELEMENTS, '){');
              drawElements();
              inner('}else{');
              drawArrays();
              inner('}');
            } else {
              drawElements();
            }
          } else {
            drawArrays();
          }
        }

        if (extInstancing && (typeof INSTANCES !== 'number' || INSTANCES >= 0)) {
          if (typeof INSTANCES === 'string') {
            inner('if(', INSTANCES, '>0){');
            emitInstancing();
            inner('}else if(', INSTANCES, '<0){');
            emitRegular();
            inner('}');
          } else {
            emitInstancing();
          }
        } else {
          emitRegular();
        }
      }

      function createBody (emitBody, parentEnv, args, program, count) {
        var env = createREGLEnvironment();
        var scope = env.proc('body', count);
        check$1.optional(function () {
          env.commandStr = parentEnv.commandStr;
          env.command = env.link(parentEnv.commandStr);
        });
        if (extInstancing) {
          env.instancing = scope.def(
            env.shared.extensions, '.angle_instanced_arrays');
        }
        emitBody(env, scope, args, program);
        return env.compile().body
      }

      // ===================================================
      // ===================================================
      // DRAW PROC
      // ===================================================
      // ===================================================
      function emitDrawBody (env, draw, args, program) {
        injectExtensions(env, draw);
        if (args.useVAO) {
          if (args.drawVAO) {
            draw(env.shared.vao, '.setVAO(', args.drawVAO.append(env, draw), ');');
          } else {
            draw(env.shared.vao, '.setVAO(', env.shared.vao, '.targetVAO);');
          }
        } else {
          draw(env.shared.vao, '.setVAO(null);');
          emitAttributes(env, draw, args, program.attributes, function () {
            return true
          });
        }
        emitUniforms(env, draw, args, program.uniforms, function () {
          return true
        });
        emitDraw(env, draw, draw, args);
      }

      function emitDrawProc (env, args) {
        var draw = env.proc('draw', 1);

        injectExtensions(env, draw);

        emitContext(env, draw, args.context);
        emitPollFramebuffer(env, draw, args.framebuffer);

        emitPollState(env, draw, args);
        emitSetOptions(env, draw, args.state);

        emitProfile(env, draw, args, false, true);

        var program = args.shader.progVar.append(env, draw);
        draw(env.shared.gl, '.useProgram(', program, '.program);');

        if (args.shader.program) {
          emitDrawBody(env, draw, args, args.shader.program);
        } else {
          draw(env.shared.vao, '.setVAO(null);');
          var drawCache = env.global.def('{}');
          var PROG_ID = draw.def(program, '.id');
          var CACHED_PROC = draw.def(drawCache, '[', PROG_ID, ']');
          draw(
            env.cond(CACHED_PROC)
              .then(CACHED_PROC, '.call(this,a0);')
              .else(
                CACHED_PROC, '=', drawCache, '[', PROG_ID, ']=',
                env.link(function (program) {
                  return createBody(emitDrawBody, env, args, program, 1)
                }), '(', program, ');',
                CACHED_PROC, '.call(this,a0);'));
        }

        if (Object.keys(args.state).length > 0) {
          draw(env.shared.current, '.dirty=true;');
        }
      }

      // ===================================================
      // ===================================================
      // BATCH PROC
      // ===================================================
      // ===================================================

      function emitBatchDynamicShaderBody (env, scope, args, program) {
        env.batchId = 'a1';

        injectExtensions(env, scope);

        function all () {
          return true
        }

        emitAttributes(env, scope, args, program.attributes, all);
        emitUniforms(env, scope, args, program.uniforms, all);
        emitDraw(env, scope, scope, args);
      }

      function emitBatchBody (env, scope, args, program) {
        injectExtensions(env, scope);

        var contextDynamic = args.contextDep;

        var BATCH_ID = scope.def();
        var PROP_LIST = 'a0';
        var NUM_PROPS = 'a1';
        var PROPS = scope.def();
        env.shared.props = PROPS;
        env.batchId = BATCH_ID;

        var outer = env.scope();
        var inner = env.scope();

        scope(
          outer.entry,
          'for(', BATCH_ID, '=0;', BATCH_ID, '<', NUM_PROPS, ';++', BATCH_ID, '){',
          PROPS, '=', PROP_LIST, '[', BATCH_ID, '];',
          inner,
          '}',
          outer.exit);

        function isInnerDefn (defn) {
          return ((defn.contextDep && contextDynamic) || defn.propDep)
        }

        function isOuterDefn (defn) {
          return !isInnerDefn(defn)
        }

        if (args.needsContext) {
          emitContext(env, inner, args.context);
        }
        if (args.needsFramebuffer) {
          emitPollFramebuffer(env, inner, args.framebuffer);
        }
        emitSetOptions(env, inner, args.state, isInnerDefn);

        if (args.profile && isInnerDefn(args.profile)) {
          emitProfile(env, inner, args, false, true);
        }

        if (!program) {
          var progCache = env.global.def('{}');
          var PROGRAM = args.shader.progVar.append(env, inner);
          var PROG_ID = inner.def(PROGRAM, '.id');
          var CACHED_PROC = inner.def(progCache, '[', PROG_ID, ']');
          inner(
            env.shared.gl, '.useProgram(', PROGRAM, '.program);',
            'if(!', CACHED_PROC, '){',
            CACHED_PROC, '=', progCache, '[', PROG_ID, ']=',
            env.link(function (program) {
              return createBody(
                emitBatchDynamicShaderBody, env, args, program, 2)
            }), '(', PROGRAM, ');}',
            CACHED_PROC, '.call(this,a0[', BATCH_ID, '],', BATCH_ID, ');');
        } else {
          if (args.useVAO) {
            if (args.drawVAO) {
              if (isInnerDefn(args.drawVAO)) {
                // vao is a prop
                inner(env.shared.vao, '.setVAO(', args.drawVAO.append(env, inner), ');');
              } else {
                // vao is invariant
                outer(env.shared.vao, '.setVAO(', args.drawVAO.append(env, outer), ');');
              }
            } else {
              // scoped vao binding
              outer(env.shared.vao, '.setVAO(', env.shared.vao, '.targetVAO);');
            }
          } else {
            outer(env.shared.vao, '.setVAO(null);');
            emitAttributes(env, outer, args, program.attributes, isOuterDefn);
            emitAttributes(env, inner, args, program.attributes, isInnerDefn);
          }
          emitUniforms(env, outer, args, program.uniforms, isOuterDefn);
          emitUniforms(env, inner, args, program.uniforms, isInnerDefn);
          emitDraw(env, outer, inner, args);
        }
      }

      function emitBatchProc (env, args) {
        var batch = env.proc('batch', 2);
        env.batchId = '0';

        injectExtensions(env, batch);

        // Check if any context variables depend on props
        var contextDynamic = false;
        var needsContext = true;
        Object.keys(args.context).forEach(function (name) {
          contextDynamic = contextDynamic || args.context[name].propDep;
        });
        if (!contextDynamic) {
          emitContext(env, batch, args.context);
          needsContext = false;
        }

        // framebuffer state affects framebufferWidth/height context vars
        var framebuffer = args.framebuffer;
        var needsFramebuffer = false;
        if (framebuffer) {
          if (framebuffer.propDep) {
            contextDynamic = needsFramebuffer = true;
          } else if (framebuffer.contextDep && contextDynamic) {
            needsFramebuffer = true;
          }
          if (!needsFramebuffer) {
            emitPollFramebuffer(env, batch, framebuffer);
          }
        } else {
          emitPollFramebuffer(env, batch, null);
        }

        // viewport is weird because it can affect context vars
        if (args.state.viewport && args.state.viewport.propDep) {
          contextDynamic = true;
        }

        function isInnerDefn (defn) {
          return (defn.contextDep && contextDynamic) || defn.propDep
        }

        // set webgl options
        emitPollState(env, batch, args);
        emitSetOptions(env, batch, args.state, function (defn) {
          return !isInnerDefn(defn)
        });

        if (!args.profile || !isInnerDefn(args.profile)) {
          emitProfile(env, batch, args, false, 'a1');
        }

        // Save these values to args so that the batch body routine can use them
        args.contextDep = contextDynamic;
        args.needsContext = needsContext;
        args.needsFramebuffer = needsFramebuffer;

        // determine if shader is dynamic
        var progDefn = args.shader.progVar;
        if ((progDefn.contextDep && contextDynamic) || progDefn.propDep) {
          emitBatchBody(
            env,
            batch,
            args,
            null);
        } else {
          var PROGRAM = progDefn.append(env, batch);
          batch(env.shared.gl, '.useProgram(', PROGRAM, '.program);');
          if (args.shader.program) {
            emitBatchBody(
              env,
              batch,
              args,
              args.shader.program);
          } else {
            batch(env.shared.vao, '.setVAO(null);');
            var batchCache = env.global.def('{}');
            var PROG_ID = batch.def(PROGRAM, '.id');
            var CACHED_PROC = batch.def(batchCache, '[', PROG_ID, ']');
            batch(
              env.cond(CACHED_PROC)
                .then(CACHED_PROC, '.call(this,a0,a1);')
                .else(
                  CACHED_PROC, '=', batchCache, '[', PROG_ID, ']=',
                  env.link(function (program) {
                    return createBody(emitBatchBody, env, args, program, 2)
                  }), '(', PROGRAM, ');',
                  CACHED_PROC, '.call(this,a0,a1);'));
          }
        }

        if (Object.keys(args.state).length > 0) {
          batch(env.shared.current, '.dirty=true;');
        }
      }

      // ===================================================
      // ===================================================
      // SCOPE COMMAND
      // ===================================================
      // ===================================================
      function emitScopeProc (env, args) {
        var scope = env.proc('scope', 3);
        env.batchId = 'a2';

        var shared = env.shared;
        var CURRENT_STATE = shared.current;

        emitContext(env, scope, args.context);

        if (args.framebuffer) {
          args.framebuffer.append(env, scope);
        }

        sortState(Object.keys(args.state)).forEach(function (name) {
          var defn = args.state[name];
          var value = defn.append(env, scope);
          if (isArrayLike(value)) {
            value.forEach(function (v, i) {
              scope.set(env.next[name], '[' + i + ']', v);
            });
          } else {
            scope.set(shared.next, '.' + name, value);
          }
        });

        emitProfile(env, scope, args, true, true)

        ;[S_ELEMENTS, S_OFFSET, S_COUNT, S_INSTANCES, S_PRIMITIVE].forEach(
          function (opt) {
            var variable = args.draw[opt];
            if (!variable) {
              return
            }
            scope.set(shared.draw, '.' + opt, '' + variable.append(env, scope));
          });

        Object.keys(args.uniforms).forEach(function (opt) {
          scope.set(
            shared.uniforms,
            '[' + stringStore.id(opt) + ']',
            args.uniforms[opt].append(env, scope));
        });

        Object.keys(args.attributes).forEach(function (name) {
          var record = args.attributes[name].append(env, scope);
          var scopeAttrib = env.scopeAttrib(name);
          Object.keys(new AttributeRecord()).forEach(function (prop) {
            scope.set(scopeAttrib, '.' + prop, record[prop]);
          });
        });

        if (args.scopeVAO) {
          scope.set(shared.vao, '.targetVAO', args.scopeVAO.append(env, scope));
        }

        function saveShader (name) {
          var shader = args.shader[name];
          if (shader) {
            scope.set(shared.shader, '.' + name, shader.append(env, scope));
          }
        }
        saveShader(S_VERT);
        saveShader(S_FRAG);

        if (Object.keys(args.state).length > 0) {
          scope(CURRENT_STATE, '.dirty=true;');
          scope.exit(CURRENT_STATE, '.dirty=true;');
        }

        scope('a1(', env.shared.context, ',a0,', env.batchId, ');');
      }

      function isDynamicObject (object) {
        if (typeof object !== 'object' || isArrayLike(object)) {
          return
        }
        var props = Object.keys(object);
        for (var i = 0; i < props.length; ++i) {
          if (dynamic.isDynamic(object[props[i]])) {
            return true
          }
        }
        return false
      }

      function splatObject (env, options, name) {
        var object = options.static[name];
        if (!object || !isDynamicObject(object)) {
          return
        }

        var globals = env.global;
        var keys = Object.keys(object);
        var thisDep = false;
        var contextDep = false;
        var propDep = false;
        var objectRef = env.global.def('{}');
        keys.forEach(function (key) {
          var value = object[key];
          if (dynamic.isDynamic(value)) {
            if (typeof value === 'function') {
              value = object[key] = dynamic.unbox(value);
            }
            var deps = createDynamicDecl(value, null);
            thisDep = thisDep || deps.thisDep;
            propDep = propDep || deps.propDep;
            contextDep = contextDep || deps.contextDep;
          } else {
            globals(objectRef, '.', key, '=');
            switch (typeof value) {
              case 'number':
                globals(value);
                break
              case 'string':
                globals('"', value, '"');
                break
              case 'object':
                if (Array.isArray(value)) {
                  globals('[', value.join(), ']');
                }
                break
              default:
                globals(env.link(value));
                break
            }
            globals(';');
          }
        });

        function appendBlock (env, block) {
          keys.forEach(function (key) {
            var value = object[key];
            if (!dynamic.isDynamic(value)) {
              return
            }
            var ref = env.invoke(block, value);
            block(objectRef, '.', key, '=', ref, ';');
          });
        }

        options.dynamic[name] = new dynamic.DynamicVariable(DYN_THUNK, {
          thisDep: thisDep,
          contextDep: contextDep,
          propDep: propDep,
          ref: objectRef,
          append: appendBlock
        });
        delete options.static[name];
      }

      // ===========================================================================
      // ===========================================================================
      // MAIN DRAW COMMAND
      // ===========================================================================
      // ===========================================================================
      function compileCommand (options, attributes, uniforms, context, stats) {
        var env = createREGLEnvironment();

        // link stats, so that we can easily access it in the program.
        env.stats = env.link(stats);

        // splat options and attributes to allow for dynamic nested properties
        Object.keys(attributes.static).forEach(function (key) {
          splatObject(env, attributes, key);
        });
        NESTED_OPTIONS.forEach(function (name) {
          splatObject(env, options, name);
        });

        var args = parseArguments(options, attributes, uniforms, context, env);

        emitDrawProc(env, args);
        emitScopeProc(env, args);
        emitBatchProc(env, args);

        return env.compile()
      }

      // ===========================================================================
      // ===========================================================================
      // POLL / REFRESH
      // ===========================================================================
      // ===========================================================================
      return {
        next: nextState,
        current: currentState,
        procs: (function () {
          var env = createREGLEnvironment();
          var poll = env.proc('poll');
          var refresh = env.proc('refresh');
          var common = env.block();
          poll(common);
          refresh(common);

          var shared = env.shared;
          var GL = shared.gl;
          var NEXT_STATE = shared.next;
          var CURRENT_STATE = shared.current;

          common(CURRENT_STATE, '.dirty=false;');

          emitPollFramebuffer(env, poll);
          emitPollFramebuffer(env, refresh, null, true);

          // Refresh updates all attribute state changes
          var INSTANCING;
          if (extInstancing) {
            INSTANCING = env.link(extInstancing);
          }

          // update vertex array bindings
          if (extensions.oes_vertex_array_object) {
            refresh(env.link(extensions.oes_vertex_array_object), '.bindVertexArrayOES(null);');
          }
          for (var i = 0; i < limits.maxAttributes; ++i) {
            var BINDING = refresh.def(shared.attributes, '[', i, ']');
            var ifte = env.cond(BINDING, '.buffer');
            ifte.then(
              GL, '.enableVertexAttribArray(', i, ');',
              GL, '.bindBuffer(',
              GL_ARRAY_BUFFER$2, ',',
              BINDING, '.buffer.buffer);',
              GL, '.vertexAttribPointer(',
              i, ',',
              BINDING, '.size,',
              BINDING, '.type,',
              BINDING, '.normalized,',
              BINDING, '.stride,',
              BINDING, '.offset);'
            ).else(
              GL, '.disableVertexAttribArray(', i, ');',
              GL, '.vertexAttrib4f(',
              i, ',',
              BINDING, '.x,',
              BINDING, '.y,',
              BINDING, '.z,',
              BINDING, '.w);',
              BINDING, '.buffer=null;');
            refresh(ifte);
            if (extInstancing) {
              refresh(
                INSTANCING, '.vertexAttribDivisorANGLE(',
                i, ',',
                BINDING, '.divisor);');
            }
          }
          refresh(
            env.shared.vao, '.currentVAO=null;',
            env.shared.vao, '.setVAO(', env.shared.vao, '.targetVAO);');

          Object.keys(GL_FLAGS).forEach(function (flag) {
            var cap = GL_FLAGS[flag];
            var NEXT = common.def(NEXT_STATE, '.', flag);
            var block = env.block();
            block('if(', NEXT, '){',
              GL, '.enable(', cap, ')}else{',
              GL, '.disable(', cap, ')}',
              CURRENT_STATE, '.', flag, '=', NEXT, ';');
            refresh(block);
            poll(
              'if(', NEXT, '!==', CURRENT_STATE, '.', flag, '){',
              block,
              '}');
          });

          Object.keys(GL_VARIABLES).forEach(function (name) {
            var func = GL_VARIABLES[name];
            var init = currentState[name];
            var NEXT, CURRENT;
            var block = env.block();
            block(GL, '.', func, '(');
            if (isArrayLike(init)) {
              var n = init.length;
              NEXT = env.global.def(NEXT_STATE, '.', name);
              CURRENT = env.global.def(CURRENT_STATE, '.', name);
              block(
                loop(n, function (i) {
                  return NEXT + '[' + i + ']'
                }), ');',
                loop(n, function (i) {
                  return CURRENT + '[' + i + ']=' + NEXT + '[' + i + '];'
                }).join(''));
              poll(
                'if(', loop(n, function (i) {
                  return NEXT + '[' + i + ']!==' + CURRENT + '[' + i + ']'
                }).join('||'), '){',
                block,
                '}');
            } else {
              NEXT = common.def(NEXT_STATE, '.', name);
              CURRENT = common.def(CURRENT_STATE, '.', name);
              block(
                NEXT, ');',
                CURRENT_STATE, '.', name, '=', NEXT, ';');
              poll(
                'if(', NEXT, '!==', CURRENT, '){',
                block,
                '}');
            }
            refresh(block);
          });

          return env.compile()
        })(),
        compile: compileCommand
      }
    }

    function stats () {
      return {
        vaoCount: 0,
        bufferCount: 0,
        elementsCount: 0,
        framebufferCount: 0,
        shaderCount: 0,
        textureCount: 0,
        cubeCount: 0,
        renderbufferCount: 0,
        maxTextureUnits: 0
      }
    }

    var GL_QUERY_RESULT_EXT = 0x8866;
    var GL_QUERY_RESULT_AVAILABLE_EXT = 0x8867;
    var GL_TIME_ELAPSED_EXT = 0x88BF;

    var createTimer = function (gl, extensions) {
      if (!extensions.ext_disjoint_timer_query) {
        return null
      }

      // QUERY POOL BEGIN
      var queryPool = [];
      function allocQuery () {
        return queryPool.pop() || extensions.ext_disjoint_timer_query.createQueryEXT()
      }
      function freeQuery (query) {
        queryPool.push(query);
      }
      // QUERY POOL END

      var pendingQueries = [];
      function beginQuery (stats) {
        var query = allocQuery();
        extensions.ext_disjoint_timer_query.beginQueryEXT(GL_TIME_ELAPSED_EXT, query);
        pendingQueries.push(query);
        pushScopeStats(pendingQueries.length - 1, pendingQueries.length, stats);
      }

      function endQuery () {
        extensions.ext_disjoint_timer_query.endQueryEXT(GL_TIME_ELAPSED_EXT);
      }

      //
      // Pending stats pool.
      //
      function PendingStats () {
        this.startQueryIndex = -1;
        this.endQueryIndex = -1;
        this.sum = 0;
        this.stats = null;
      }
      var pendingStatsPool = [];
      function allocPendingStats () {
        return pendingStatsPool.pop() || new PendingStats()
      }
      function freePendingStats (pendingStats) {
        pendingStatsPool.push(pendingStats);
      }
      // Pending stats pool end

      var pendingStats = [];
      function pushScopeStats (start, end, stats) {
        var ps = allocPendingStats();
        ps.startQueryIndex = start;
        ps.endQueryIndex = end;
        ps.sum = 0;
        ps.stats = stats;
        pendingStats.push(ps);
      }

      // we should call this at the beginning of the frame,
      // in order to update gpuTime
      var timeSum = [];
      var queryPtr = [];
      function update () {
        var ptr, i;

        var n = pendingQueries.length;
        if (n === 0) {
          return
        }

        // Reserve space
        queryPtr.length = Math.max(queryPtr.length, n + 1);
        timeSum.length = Math.max(timeSum.length, n + 1);
        timeSum[0] = 0;
        queryPtr[0] = 0;

        // Update all pending timer queries
        var queryTime = 0;
        ptr = 0;
        for (i = 0; i < pendingQueries.length; ++i) {
          var query = pendingQueries[i];
          if (extensions.ext_disjoint_timer_query.getQueryObjectEXT(query, GL_QUERY_RESULT_AVAILABLE_EXT)) {
            queryTime += extensions.ext_disjoint_timer_query.getQueryObjectEXT(query, GL_QUERY_RESULT_EXT);
            freeQuery(query);
          } else {
            pendingQueries[ptr++] = query;
          }
          timeSum[i + 1] = queryTime;
          queryPtr[i + 1] = ptr;
        }
        pendingQueries.length = ptr;

        // Update all pending stat queries
        ptr = 0;
        for (i = 0; i < pendingStats.length; ++i) {
          var stats = pendingStats[i];
          var start = stats.startQueryIndex;
          var end = stats.endQueryIndex;
          stats.sum += timeSum[end] - timeSum[start];
          var startPtr = queryPtr[start];
          var endPtr = queryPtr[end];
          if (endPtr === startPtr) {
            stats.stats.gpuTime += stats.sum / 1e6;
            freePendingStats(stats);
          } else {
            stats.startQueryIndex = startPtr;
            stats.endQueryIndex = endPtr;
            pendingStats[ptr++] = stats;
          }
        }
        pendingStats.length = ptr;
      }

      return {
        beginQuery: beginQuery,
        endQuery: endQuery,
        pushScopeStats: pushScopeStats,
        update: update,
        getNumPendingQueries: function () {
          return pendingQueries.length
        },
        clear: function () {
          queryPool.push.apply(queryPool, pendingQueries);
          for (var i = 0; i < queryPool.length; i++) {
            extensions.ext_disjoint_timer_query.deleteQueryEXT(queryPool[i]);
          }
          pendingQueries.length = 0;
          queryPool.length = 0;
        },
        restore: function () {
          pendingQueries.length = 0;
          queryPool.length = 0;
        }
      }
    };

    var GL_COLOR_BUFFER_BIT = 16384;
    var GL_DEPTH_BUFFER_BIT = 256;
    var GL_STENCIL_BUFFER_BIT = 1024;

    var GL_ARRAY_BUFFER = 34962;

    var CONTEXT_LOST_EVENT = 'webglcontextlost';
    var CONTEXT_RESTORED_EVENT = 'webglcontextrestored';

    var DYN_PROP = 1;
    var DYN_CONTEXT = 2;
    var DYN_STATE = 3;

    function find (haystack, needle) {
      for (var i = 0; i < haystack.length; ++i) {
        if (haystack[i] === needle) {
          return i
        }
      }
      return -1
    }

    function wrapREGL (args) {
      var config = parseArgs(args);
      if (!config) {
        return null
      }

      var gl = config.gl;
      var glAttributes = gl.getContextAttributes();
      var contextLost = gl.isContextLost();

      var extensionState = createExtensionCache(gl, config);
      if (!extensionState) {
        return null
      }

      var stringStore = createStringStore();
      var stats$$1 = stats();
      var extensions = extensionState.extensions;
      var timer = createTimer(gl, extensions);

      var START_TIME = clock();
      var WIDTH = gl.drawingBufferWidth;
      var HEIGHT = gl.drawingBufferHeight;

      var contextState = {
        tick: 0,
        time: 0,
        viewportWidth: WIDTH,
        viewportHeight: HEIGHT,
        framebufferWidth: WIDTH,
        framebufferHeight: HEIGHT,
        drawingBufferWidth: WIDTH,
        drawingBufferHeight: HEIGHT,
        pixelRatio: config.pixelRatio
      };
      var uniformState = {};
      var drawState = {
        elements: null,
        primitive: 4, // GL_TRIANGLES
        count: -1,
        offset: 0,
        instances: -1
      };

      var limits = wrapLimits(gl, extensions);
      var bufferState = wrapBufferState(
        gl,
        stats$$1,
        config,
        destroyBuffer);
      var attributeState = wrapAttributeState(
        gl,
        extensions,
        limits,
        stats$$1,
        bufferState);
      function destroyBuffer (buffer) {
        return attributeState.destroyBuffer(buffer)
      }
      var elementState = wrapElementsState(gl, extensions, bufferState, stats$$1);
      var shaderState = wrapShaderState(gl, stringStore, stats$$1, config);
      var textureState = createTextureSet(
        gl,
        extensions,
        limits,
        function () { core.procs.poll(); },
        contextState,
        stats$$1,
        config);
      var renderbufferState = wrapRenderbuffers(gl, extensions, limits, stats$$1, config);
      var framebufferState = wrapFBOState(
        gl,
        extensions,
        limits,
        textureState,
        renderbufferState,
        stats$$1);
      var core = reglCore(
        gl,
        stringStore,
        extensions,
        limits,
        bufferState,
        elementState,
        textureState,
        framebufferState,
        uniformState,
        attributeState,
        shaderState,
        drawState,
        contextState,
        timer,
        config);
      var readPixels = wrapReadPixels(
        gl,
        framebufferState,
        core.procs.poll,
        contextState,
        glAttributes, extensions, limits);

      var nextState = core.next;
      var canvas = gl.canvas;

      var rafCallbacks = [];
      var lossCallbacks = [];
      var restoreCallbacks = [];
      var destroyCallbacks = [config.onDestroy];

      var activeRAF = null;
      function handleRAF () {
        if (rafCallbacks.length === 0) {
          if (timer) {
            timer.update();
          }
          activeRAF = null;
          return
        }

        // schedule next animation frame
        activeRAF = raf.next(handleRAF);

        // poll for changes
        poll();

        // fire a callback for all pending rafs
        for (var i = rafCallbacks.length - 1; i >= 0; --i) {
          var cb = rafCallbacks[i];
          if (cb) {
            cb(contextState, null, 0);
          }
        }

        // flush all pending webgl calls
        gl.flush();

        // poll GPU timers *after* gl.flush so we don't delay command dispatch
        if (timer) {
          timer.update();
        }
      }

      function startRAF () {
        if (!activeRAF && rafCallbacks.length > 0) {
          activeRAF = raf.next(handleRAF);
        }
      }

      function stopRAF () {
        if (activeRAF) {
          raf.cancel(handleRAF);
          activeRAF = null;
        }
      }

      function handleContextLoss (event) {
        event.preventDefault();

        // set context lost flag
        contextLost = true;

        // pause request animation frame
        stopRAF();

        // lose context
        lossCallbacks.forEach(function (cb) {
          cb();
        });
      }

      function handleContextRestored (event) {
        // clear error code
        gl.getError();

        // clear context lost flag
        contextLost = false;

        // refresh state
        extensionState.restore();
        shaderState.restore();
        bufferState.restore();
        textureState.restore();
        renderbufferState.restore();
        framebufferState.restore();
        attributeState.restore();
        if (timer) {
          timer.restore();
        }

        // refresh state
        core.procs.refresh();

        // restart RAF
        startRAF();

        // restore context
        restoreCallbacks.forEach(function (cb) {
          cb();
        });
      }

      if (canvas) {
        canvas.addEventListener(CONTEXT_LOST_EVENT, handleContextLoss, false);
        canvas.addEventListener(CONTEXT_RESTORED_EVENT, handleContextRestored, false);
      }

      function destroy () {
        rafCallbacks.length = 0;
        stopRAF();

        if (canvas) {
          canvas.removeEventListener(CONTEXT_LOST_EVENT, handleContextLoss);
          canvas.removeEventListener(CONTEXT_RESTORED_EVENT, handleContextRestored);
        }

        shaderState.clear();
        framebufferState.clear();
        renderbufferState.clear();
        textureState.clear();
        elementState.clear();
        bufferState.clear();
        attributeState.clear();

        if (timer) {
          timer.clear();
        }

        destroyCallbacks.forEach(function (cb) {
          cb();
        });
      }

      function compileProcedure (options) {
        check$1(!!options, 'invalid args to regl({...})');
        check$1.type(options, 'object', 'invalid args to regl({...})');

        function flattenNestedOptions (options) {
          var result = extend({}, options);
          delete result.uniforms;
          delete result.attributes;
          delete result.context;
          delete result.vao;

          if ('stencil' in result && result.stencil.op) {
            result.stencil.opBack = result.stencil.opFront = result.stencil.op;
            delete result.stencil.op;
          }

          function merge (name) {
            if (name in result) {
              var child = result[name];
              delete result[name];
              Object.keys(child).forEach(function (prop) {
                result[name + '.' + prop] = child[prop];
              });
            }
          }
          merge('blend');
          merge('depth');
          merge('cull');
          merge('stencil');
          merge('polygonOffset');
          merge('scissor');
          merge('sample');

          if ('vao' in options) {
            result.vao = options.vao;
          }

          return result
        }

        function separateDynamic (object) {
          var staticItems = {};
          var dynamicItems = {};
          Object.keys(object).forEach(function (option) {
            var value = object[option];
            if (dynamic.isDynamic(value)) {
              dynamicItems[option] = dynamic.unbox(value, option);
            } else {
              staticItems[option] = value;
            }
          });
          return {
            dynamic: dynamicItems,
            static: staticItems
          }
        }

        // Treat context variables separate from other dynamic variables
        var context = separateDynamic(options.context || {});
        var uniforms = separateDynamic(options.uniforms || {});
        var attributes = separateDynamic(options.attributes || {});
        var opts = separateDynamic(flattenNestedOptions(options));

        var stats$$1 = {
          gpuTime: 0.0,
          cpuTime: 0.0,
          count: 0
        };

        var compiled = core.compile(opts, attributes, uniforms, context, stats$$1);

        var draw = compiled.draw;
        var batch = compiled.batch;
        var scope = compiled.scope;

        // FIXME: we should modify code generation for batch commands so this
        // isn't necessary
        var EMPTY_ARRAY = [];
        function reserve (count) {
          while (EMPTY_ARRAY.length < count) {
            EMPTY_ARRAY.push(null);
          }
          return EMPTY_ARRAY
        }

        function REGLCommand (args, body) {
          var i;
          if (contextLost) {
            check$1.raise('context lost');
          }
          if (typeof args === 'function') {
            return scope.call(this, null, args, 0)
          } else if (typeof body === 'function') {
            if (typeof args === 'number') {
              for (i = 0; i < args; ++i) {
                scope.call(this, null, body, i);
              }
            } else if (Array.isArray(args)) {
              for (i = 0; i < args.length; ++i) {
                scope.call(this, args[i], body, i);
              }
            } else {
              return scope.call(this, args, body, 0)
            }
          } else if (typeof args === 'number') {
            if (args > 0) {
              return batch.call(this, reserve(args | 0), args | 0)
            }
          } else if (Array.isArray(args)) {
            if (args.length) {
              return batch.call(this, args, args.length)
            }
          } else {
            return draw.call(this, args)
          }
        }

        return extend(REGLCommand, {
          stats: stats$$1
        })
      }

      var setFBO = framebufferState.setFBO = compileProcedure({
        framebuffer: dynamic.define.call(null, DYN_PROP, 'framebuffer')
      });

      function clearImpl (_, options) {
        var clearFlags = 0;
        core.procs.poll();

        var c = options.color;
        if (c) {
          gl.clearColor(+c[0] || 0, +c[1] || 0, +c[2] || 0, +c[3] || 0);
          clearFlags |= GL_COLOR_BUFFER_BIT;
        }
        if ('depth' in options) {
          gl.clearDepth(+options.depth);
          clearFlags |= GL_DEPTH_BUFFER_BIT;
        }
        if ('stencil' in options) {
          gl.clearStencil(options.stencil | 0);
          clearFlags |= GL_STENCIL_BUFFER_BIT;
        }

        check$1(!!clearFlags, 'called regl.clear with no buffer specified');
        gl.clear(clearFlags);
      }

      function clear (options) {
        check$1(
          typeof options === 'object' && options,
          'regl.clear() takes an object as input');
        if ('framebuffer' in options) {
          if (options.framebuffer &&
              options.framebuffer_reglType === 'framebufferCube') {
            for (var i = 0; i < 6; ++i) {
              setFBO(extend({
                framebuffer: options.framebuffer.faces[i]
              }, options), clearImpl);
            }
          } else {
            setFBO(options, clearImpl);
          }
        } else {
          clearImpl(null, options);
        }
      }

      function frame (cb) {
        check$1.type(cb, 'function', 'regl.frame() callback must be a function');
        rafCallbacks.push(cb);

        function cancel () {
          // FIXME:  should we check something other than equals cb here?
          // what if a user calls frame twice with the same callback...
          //
          var i = find(rafCallbacks, cb);
          check$1(i >= 0, 'cannot cancel a frame twice');
          function pendingCancel () {
            var index = find(rafCallbacks, pendingCancel);
            rafCallbacks[index] = rafCallbacks[rafCallbacks.length - 1];
            rafCallbacks.length -= 1;
            if (rafCallbacks.length <= 0) {
              stopRAF();
            }
          }
          rafCallbacks[i] = pendingCancel;
        }

        startRAF();

        return {
          cancel: cancel
        }
      }

      // poll viewport
      function pollViewport () {
        var viewport = nextState.viewport;
        var scissorBox = nextState.scissor_box;
        viewport[0] = viewport[1] = scissorBox[0] = scissorBox[1] = 0;
        contextState.viewportWidth =
          contextState.framebufferWidth =
          contextState.drawingBufferWidth =
          viewport[2] =
          scissorBox[2] = gl.drawingBufferWidth;
        contextState.viewportHeight =
          contextState.framebufferHeight =
          contextState.drawingBufferHeight =
          viewport[3] =
          scissorBox[3] = gl.drawingBufferHeight;
      }

      function poll () {
        contextState.tick += 1;
        contextState.time = now();
        pollViewport();
        core.procs.poll();
      }

      function refresh () {
        pollViewport();
        core.procs.refresh();
        if (timer) {
          timer.update();
        }
      }

      function now () {
        return (clock() - START_TIME) / 1000.0
      }

      refresh();

      function addListener (event, callback) {
        check$1.type(callback, 'function', 'listener callback must be a function');

        var callbacks;
        switch (event) {
          case 'frame':
            return frame(callback)
          case 'lost':
            callbacks = lossCallbacks;
            break
          case 'restore':
            callbacks = restoreCallbacks;
            break
          case 'destroy':
            callbacks = destroyCallbacks;
            break
          default:
            check$1.raise('invalid event, must be one of frame,lost,restore,destroy');
        }

        callbacks.push(callback);
        return {
          cancel: function () {
            for (var i = 0; i < callbacks.length; ++i) {
              if (callbacks[i] === callback) {
                callbacks[i] = callbacks[callbacks.length - 1];
                callbacks.pop();
                return
              }
            }
          }
        }
      }

      var regl = extend(compileProcedure, {
        // Clear current FBO
        clear: clear,

        // Short cuts for dynamic variables
        prop: dynamic.define.bind(null, DYN_PROP),
        context: dynamic.define.bind(null, DYN_CONTEXT),
        this: dynamic.define.bind(null, DYN_STATE),

        // executes an empty draw command
        draw: compileProcedure({}),

        // Resources
        buffer: function (options) {
          return bufferState.create(options, GL_ARRAY_BUFFER, false, false)
        },
        elements: function (options) {
          return elementState.create(options, false)
        },
        texture: textureState.create2D,
        cube: textureState.createCube,
        renderbuffer: renderbufferState.create,
        framebuffer: framebufferState.create,
        framebufferCube: framebufferState.createCube,
        vao: attributeState.createVAO,

        // Expose context attributes
        attributes: glAttributes,

        // Frame rendering
        frame: frame,
        on: addListener,

        // System limits
        limits: limits,
        hasExtension: function (name) {
          return limits.extensions.indexOf(name.toLowerCase()) >= 0
        },

        // Read pixels
        read: readPixels,

        // Destroy regl and all associated resources
        destroy: destroy,

        // Direct GL state manipulation
        _gl: gl,
        _refresh: refresh,

        poll: function () {
          poll();
          if (timer) {
            timer.update();
          }
        },

        // Current time
        now: now,

        // regl Statistics Information
        stats: stats$$1
      });

      config.onDone(null, regl);

      return regl
    }

    return wrapREGL;

    })));
    //# sourceMappingURL=regl.js.map
    });

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
     * @fileoverview Attributes of a Sprite.
     */
    /**
     * This is the complete list of attributes that each Sprite has. These are used
     * to generate GLSL code to unpack values from the input data textures. These
     * are also used when computing instantaneous values to flash to data textures
     * during the rebase operation.
     *
     * Notes:
     *  - X coordinates are always oriented positive=right.
     *  - Y coordinates are positive=up for World coordinates.
     *  - Y coordinates are positive=down for Pixel coordinates.
     *  - Opacity is named as it is for compatibility with D3 color objects.
     */
    const SPRITE_ATTRIBUTES = [
        /**
         * Time in milliseconds that the sprite's other attributes should take to
         * animate to their target states. Should not be negative. A value of zero
         * means that the sprite should achieve its target state immediately.
         */
        {
            attributeName: 'TransitionTimeMs',
            isTimestamp: true,
        },
        /**
         * Sprite position and size in world coordinates.
         */
        {
            attributeName: 'PositionWorld',
            isInterpolable: true,
            components: ['X', 'Y'],
        },
        {
            attributeName: 'SizeWorld',
            isInterpolable: true,
            isBroadcastable: true,
            components: ['Width', 'Height'],
        },
        /**
         * Amount to zoom sprite sizes based on current scale. In the shaders, this
         * formula is used:
         *
         *   currentSizeWorld * exp(log(scale) * (1. - currentGeometricZoom))
         *
         * The default value of 0 means to linearly scale the world size with the
         * current scale value. A value of 1 means to not scale at all. This would
         * effectively interpret the world coordinate as a pixel value (1=1).
         *
         * Values in between 0 and 1 signal a partial scaling of sizes based on
         * zoom level. This produces an intermediate effect such that a dense
         * scatter plot's points grow somewhat, but not so much that they occlude
         * when zoomed far in.
         *
         * Geometric zoom is applied before adding SizePixel values, and before
         * capping to MaxSizePixel or MinSizePixel.
         *
         * This behavior is based on Benjamin Schmidt's approach (linked below),
         * except that it uses a default value of zero. This design choice
         * preserves the sprite initialization and memory restoration procedures
         * of flashing zeros to the underlyng buffers' swatches.
         *
         * https://observablehq.com/@bmschmidt/zoom-strategies-for-huge-scatterplots-with-three-js
         */
        {
            attributeName: 'GeometricZoom',
            isInterpolable: true,
            isBroadcastable: true,
            components: ['X', 'Y'],
        },
        /**
         * Sprite offset position in pixels.
         */
        {
            attributeName: 'PositionPixel',
            isInterpolable: true,
            components: ['X', 'Y'],
        },
        /**
         * Additional width and height in pixels.
         */
        {
            attributeName: 'SizePixel',
            isInterpolable: true,
            isBroadcastable: true,
            components: ['Width', 'Height'],
        },
        /**
         * Maxium size when rendered in pixels. Any non-positive value is treated
         * as unbounded.
         */
        {
            attributeName: 'MaxSizePixel',
            isInterpolable: true,
            isBroadcastable: true,
            components: ['Width', 'Height'],
        },
        /**
         * Minimum size when rendered in pixels. Any non-positive value is treated
         * as unbounded.
         */
        {
            attributeName: 'MinSizePixel',
            isInterpolable: true,
            isBroadcastable: true,
            components: ['Width', 'Height'],
        },
        /**
         * Sprite offset position in multiples of the rendered size. Importantly, this
         * additional position is computed after Max and Min pixel sizes are applied.
         * This is principally used when positioning text label glyphs so that they
         * remain in place during scaling.
         */
        {
            attributeName: 'PositionRelative',
            isInterpolable: true,
            components: ['X', 'Y'],
        },
        /**
         * When rendered, each sprite is presented to the fragment shader a
         * rectangle (an instanced quad of two triangles joined at the diagonal).
         * You can think of this like a bounding box. Within those bounds
         * different fragment-shader rendered shapes are possible.
         *
         * The Sides attribute specifies how the fragment shader should compute the
         * signed 'distance' of each pixel.
         *
         * The following table describes the range of behaviors:
         *   s == 0     : Use SDF texture coordinates.
         *   0 > s > 1  : Reserved / Undefined.
         *   s == 1     : Circle / Ellipse.
         *   1 > s > 2  : Reserved / Undefined.
         *   s == 2     : Filled Square / Rectangle.
         *   s > 2      : Regular Polygon.
         *
         * Regular Polygons are rendered with the first point pointing upwards. For
         * example, the value 3 creates a unilateral triangle pointed up. The
         * value 4 creates a square pointed up--that is, with sides at 45 degrees
         * to the Cartesian plane (like a diamond).
         */
        {
            attributeName: 'Sides',
        },
        /**
         * When Sides == 0, these coordinates describe where within the SDF texture to
         * sample for this sprite's shape. (Used for glyphs of text).
         */
        {
            attributeName: 'ShapeTexture',
            components: ['U', 'V', 'Width', 'Height'],
        },
        /**
         * The border can have width in both world and pixel coordinates. These
         * are additive.
         */
        {
            attributeName: 'BorderRadiusWorld',
            isInterpolable: true,
        },
        {
            attributeName: 'BorderRadiusPixel',
            isInterpolable: true,
        },
        /**
         * Placement of the border from totally inside the shape (0) to totally
         * outside the shape (1). A value of 0.5 places the center of the border
         * exactly on the line between inside and outside the shape.
         */
        {
            attributeName: 'BorderPlacement',
            isInterpolable: true,
        },
        {
            attributeName: 'BorderColor',
            isInterpolable: true,
            components: ['R', 'G', 'B', 'Opacity'],
        },
        /**
         * Fill blend determines whether the fill should be entirely defined by
         * the fill color (0), or entirely by the sampled atlas texture (1).
         */
        {
            attributeName: 'FillBlend',
            isInterpolable: true,
        },
        {
            attributeName: 'FillColor',
            isInterpolable: true,
            components: ['R', 'G', 'B', 'Opacity'],
        },
        {
            attributeName: 'FillTexture',
            components: ['U', 'V', 'Width', 'Height'],
        },
    ];

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
    const RGBA = Object.freeze(['r', 'g', 'b', 'a']);
    /**
     * Default values for settings to the AttributeMapper constructor.
     */
    const DEFAULT_ATTRIBUTE_MAPPER_SETTINGS = Object.freeze({
        /**
         * Number of data channels to use when mapping values to texels.
         */
        dataChannelCount: 4,
        /**
         * Desired number of swatches to support. Will not exceed device limits.
         */
        desiredSwatchCapacity: Infinity,
        /**
         * List of attributes to map.
         */
        attributes: SPRITE_ATTRIBUTES,
    });
    // 4 bytes in a 32 bit Float.
    const BYTES_PER_FLOAT = 4;
    class AttributeMapper {
        constructor(options) {
            const settings = Object.assign({}, DEFAULT_ATTRIBUTE_MAPPER_SETTINGS, options || {});
            if (!isFinite(settings.maxTextureSize) &&
                !isFinite(settings.desiredSwatchCapacity)) {
                throw new Error('Cannot map attributes to texture of infinite size.');
            }
            this.dataChannelCount = settings.dataChannelCount;
            this.maxTextureSize = settings.maxTextureSize;
            this.desiredSwatchCapacity = settings.desiredSwatchCapacity;
            this.attributes = settings.attributes;
            this.attributeComponentIndices = {};
            this.attributeComponentNames = [];
            this.isAttributeTimestamp = [];
            // Copy attribute component names into local array and create lookup index.
            for (const attribute of this.attributes) {
                const { attributeName, components } = attribute;
                for (const component of (components || [''])) {
                    const attributeComponentName = `${attributeName}${component}`;
                    if (attributeComponentName in this.attributeComponentIndices) {
                        throw new Error(`Duplicate attribute component name detected: ${attributeComponentName}`);
                    }
                    const index = this.attributeComponentNames.length;
                    this.attributeComponentNames[index] = attributeComponentName;
                    this.attributeComponentIndices[attributeComponentName] = index;
                    this.isAttributeTimestamp[index] = !!attribute.isTimestamp;
                }
            }
            for (const attribute of this.attributes) {
                if (!attribute.isInterpolable) {
                    continue;
                }
                const { attributeName, components } = attribute;
                for (const component of (components || [''])) {
                    const attributeComponentName = `${attributeName}${component}Delta`;
                    if (attributeComponentName in this.attributeComponentIndices) {
                        throw new Error(`Duplicate attribute component name detected: ${attributeComponentName}`);
                    }
                    const index = this.attributeComponentNames.length;
                    this.attributeComponentNames[index] = attributeComponentName;
                    this.attributeComponentIndices[attributeComponentName] = index;
                    this.isAttributeTimestamp[index] = !!attribute.isTimestamp;
                }
            }
            Object.freeze(this.attributeComponentIndices);
            Object.freeze(this.attributeComponentNames);
            Object.freeze(this.isAttributeTimestamp);
            // Calculate constants.
            this.texelsPerSwatch =
                Math.ceil(this.attributeComponentNames.length / this.dataChannelCount);
            this.valuesPerSwatch = this.texelsPerSwatch * this.dataChannelCount;
            this.bytesPerSwatch = this.valuesPerSwatch * BYTES_PER_FLOAT;
            this.swatchesPerRow =
                Math.floor(this.maxTextureSize / this.texelsPerSwatch);
            this.textureWidth = this.texelsPerSwatch * this.swatchesPerRow;
            this.textureHeight = this.maxTextureSize;
            this.totalSwatches = this.swatchesPerRow * this.textureHeight;
            // Apply desired capacity constraint.
            if (this.totalSwatches > this.desiredSwatchCapacity) {
                this.swatchesPerRow = Math.min(this.swatchesPerRow, Math.ceil(Math.sqrt(this.desiredSwatchCapacity / this.texelsPerSwatch)));
                this.textureWidth = this.texelsPerSwatch * this.swatchesPerRow;
                this.textureHeight = Math.min(this.textureHeight, Math.ceil(this.desiredSwatchCapacity / this.swatchesPerRow));
                this.totalSwatches = this.swatchesPerRow * this.textureHeight;
            }
            this.valuesPerRow = this.swatchesPerRow * this.valuesPerSwatch;
            this.bytesPerRow = this.valuesPerRow * BYTES_PER_FLOAT;
            this.totalTexels = this.textureWidth * this.textureHeight;
            this.totalValues = this.totalTexels * this.dataChannelCount;
            this.totalBytes = this.totalValues * BYTES_PER_FLOAT;
            Object.freeze(this);
        }
        /**
         * Generate GLSL code for reading texel values. Produces long lines that look
         * like these examples:
         *
         *  texelValues[0] = texture2D(dataTexture, swatchUv + vec2(0.05, 0.05));
         *  texelValues[1] = texture2D(dataTexture, swatchUv + vec2(0.15, 0.05));
         */
        generateTexelReaderGLSL(texelValuesVarName = 'texelValues', dataTextureVarName = 'dataTexture', swatchUvVarName = 'instanceSwatchUv') {
            const setters = [];
            const texelCount = this.texelsPerSwatch;
            for (let texelIndex = 0; texelIndex < texelCount; texelIndex++) {
                const x = ((texelIndex % this.texelsPerSwatch) + 0.5) /
                    this.texelsPerSwatch / this.swatchesPerRow;
                const y = (Math.floor(texelIndex / this.texelsPerSwatch) + 0.5) /
                    this.textureHeight;
                setters.push(`${texelValuesVarName}[${texelIndex}] = ` +
                    `texture2D(${dataTextureVarName}, ${swatchUvVarName} + vec2(${x}, ${y}));`);
            }
            return setters.join('\n');
        }
        /**
         * Generate GLSL code for a replacement macro for each attribute variable.
         * Produces long lines that look like these examples (newlines added for
         * readability in this comment):
         *
         *  #define previousTransitionTimeMs() previousTexelValues[0].r
         *  #define previousPositionWorld() vec2(previousTexelValues[0].g,
         *    previousTexelValues[0].b)
         *  #define previousSizeWorld() vec2(previousTexelValues[0].a,
         *    previousTexelValues[1].r)
         *  #define previousGeometricZoom() vec2(previousTexelValues[1].g,
         *    previousTexelValues[1].b)
         *  #define previousPositionPixel() vec2(previousTexelValues[1].a,
         *    previousTexelValues[2].r)
         *
         * To work, these #define macros assume that there will be a populated array
         * of texel values sampled from the associated texture. The GLSL that
         * accomplishes that is produced by the `generateTexelReaderGLSL()` method.
         */
        generateAttributeDefinesGLSL(attributePrefix, texelValuesVarName = 'texelValues') {
            // Create a #define macro for each attribute.
            const attributeValueDefines = this.attributes.map(attribute => {
                const { attributeName } = attribute;
                const components = (attribute.components || [''])
                    .map(component => {
                    const index = this.attributeComponentIndices[`${attributeName}${component}`];
                    const texel = Math.floor(index / this.dataChannelCount);
                    const channel = RGBA[index % this.dataChannelCount];
                    return `${texelValuesVarName}[${texel}].${channel}`;
                })
                    .join(', ');
                const value = attribute.components ?
                    `vec${attribute.components.length}(${components})` :
                    components;
                return `#define ${attributePrefix}${attributeName}() ${value}`;
            });
            // Create #define macros for the *Delta attributes of interpolable
            // attributes.
            const attributeDeltaDefines = this.attributes.filter(attribute => attribute.isInterpolable)
                .map(attribute => {
                const { attributeName } = attribute;
                const components = (attribute.components || [''])
                    .map(component => {
                    const index = this.attributeComponentIndices[`${attributeName}${component}Delta`];
                    const texel = Math.floor(index / this.dataChannelCount);
                    const channel = ['r', 'g', 'b', 'a'][index % this.dataChannelCount];
                    return `${texelValuesVarName}[${texel}].${channel}`;
                })
                    .join(', ');
                const value = attribute.components ?
                    `vec${attribute.components.length}(${components})` :
                    components;
                return `#define ${attributePrefix}${attributeName}Delta() ${value}`;
            });
            const glsl = [...attributeValueDefines, ...attributeDeltaDefines].join('\n');
            return glsl;
        }
        /**
         * Generate GLSL for a fragment shader which will update the texel values
         * during a rebase operation.
         */
        generateRebaseFragmentGLSL(previousTexelValuesVarName = 'previousTexelValues', targetTexelValuesVarName = 'targetTexelValues', texelIndexVarName = 'texelIndex', rebaseTsVarName = 'rebaseTs') {
            const codes = {};
            for (const attribute of this.attributes) {
                const { attributeName } = attribute;
                for (const component of (attribute.components || [''])) {
                    const attributeComponentName = `${attributeName}${component}`;
                    const index = this.attributeComponentIndices[attributeComponentName];
                    const texelIndex = Math.floor(index / this.dataChannelCount);
                    const channel = RGBA[index % this.dataChannelCount];
                    const previousValueCode = `${previousTexelValuesVarName}[${texelIndex}].${channel}`;
                    const targetValueCode = `${targetTexelValuesVarName}[${texelIndex}].${channel}`;
                    if (!(texelIndex in codes)) {
                        codes[texelIndex] = {};
                    }
                    if (attribute.isTimestamp) {
                        // If this attribute is a timestamp, then all we do is copy the rebase
                        // timestamp variable's value.
                        const computeCode = `${rebaseTsVarName};`;
                        codes[texelIndex][channel] = computeCode;
                    }
                    else if (attribute.isInterpolable) {
                        // If this attribute is interpolable, then we need to lookup its
                        // previous delta (velocity) value in order to compute the current
                        // value and current delta.
                        const attributeComponentDeltaName = `${attributeComponentName}Delta`;
                        const deltaIndex = this.attributeComponentIndices[attributeComponentDeltaName];
                        const deltaTexelIndex = Math.floor(deltaIndex / this.dataChannelCount);
                        const deltaChannel = RGBA[deltaIndex % this.dataChannelCount];
                        if (!(deltaTexelIndex in codes)) {
                            codes[deltaTexelIndex] = {};
                        }
                        const previousDeltaCode = `${previousTexelValuesVarName}[${deltaTexelIndex}].${deltaChannel}`;
                        codes[texelIndex][channel] =
                            `computeValueAtTime(${previousValueCode}, ${previousDeltaCode}, ${targetValueCode}, ${rebaseTsVarName});`;
                        codes[deltaTexelIndex][deltaChannel] =
                            `computeDeltaAtTime(${previousValueCode}, ${previousDeltaCode}, ${targetValueCode}, ${rebaseTsVarName});`;
                    }
                    else {
                        // If the attribute is neither a timestamp, nor interpolable, then the
                        // code to compute its value is a simple threshold operation.
                        codes[texelIndex][channel] = `computeThresholdValue(${previousValueCode}, ${targetValueCode}, ${rebaseTsVarName});`;
                    }
                }
            }
            // Iterate through codes and build lines of GLSL.
            const lines = [];
            for (let i = 0; i < this.texelsPerSwatch; i++) {
                const channelCodes = codes[i];
                lines.push(`if (${texelIndexVarName} < ${i}.5) {`);
                for (let j = 0; j < this.dataChannelCount; j++) {
                    const channel = RGBA[j];
                    if (channel in channelCodes) {
                        lines.push(`  gl_FragColor.${channel} = ${channelCodes[channel]}`);
                    }
                }
                lines.push('  return;');
                lines.push('}');
            }
            const glsl = lines.join('\n');
            return glsl;
        }
        /**
         * Given the capacity and other computed values, produce an array of UV
         * coordinate values for the swatches.
         */
        generateInstanceSwatchUvValues() {
            const instanceSwatchUvValues = new Float32Array(this.totalSwatches * 2);
            for (let row = 0; row < this.textureHeight; row++) {
                for (let col = 0; col < this.swatchesPerRow; col++) {
                    const i = (row * this.swatchesPerRow + col) * 2;
                    instanceSwatchUvValues[i] = col / this.swatchesPerRow;
                    instanceSwatchUvValues[i + 1] = row / this.textureHeight;
                }
            }
            return instanceSwatchUvValues;
        }
    }

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
     * Template tag to mark GLSL code fragments.
     */
    function glsl(strs, ...args) {
        const interleaved = [];
        for (let i = 0; i < args.length; i++) {
            interleaved.push(strs[i], `${args[i]}`);
        }
        interleaved.push(strs[strs.length - 1]);
        return interleaved.join('');
    }

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
     * List of types for creating vectorizied versions of functions.
     */
    const GEN_TYPES = ['float', 'vec2', 'vec3', 'vec4'];
    /**
     * Range function. Inverse of GLSL built in mix() funcition.
     */
    function range() {
        return glsl `
float range(float x, float y, float a) {
  return (a - x) / (y - x);
}
`;
    }
    /**
     * Ease an input value t between 0 and 1 smoothly.
     */
    function cubicEaseInOut() {
        return glsl `
float cubicEaseInOut(float t) {
  return t < 0.5 ? 4.0 * t * t * t :
    4.0 * (t - 1.0) * (t - 1.0) * (t - 1.0) + 1.0;
}
`;
    }
    /**
     * Given a starting value, velocity and an ending value, compute the
     * instantaneous current value.
     *
     * These functions make use of the following macro variables which are presumed
     * to already be defined and in scope:
     *
     * - targetTransitionTimeMs() - #define macro for animation arrival time.
     * - previousTransitionTimeMs() - #define macro for animation start time.
     *
     * @param rangeT Name of GLSL variable containing the range'd time value. This
     * should be a value between 0 and 1 to signal progress between the previous and
     * target transition times.
     * @param easeT Name of the GLSL vairable containing the result of cubic easing
     * having been applied to the rangeT variable.
     */
    function computeCurrentValue(rangeT = 't', easeT = 'varyingT') {
        return GEN_TYPES
            .map(genType => glsl `
${genType} computeCurrentValue(
    ${genType} startingValue,
    ${genType} startingVelocity,
    ${genType} targetValue) {
  ${genType} currentValue = mix(startingValue, targetValue, ${easeT});
  ${genType} projectedValue = startingVelocity *
    (targetTransitionTimeMs() - previousTransitionTimeMs());
  return currentValue + projectedValue *
    ${rangeT} * (1. - ${rangeT}) * (1. - ${rangeT}) * (1. - ${rangeT});
}
  `).join('\n');
    }
    /**
     * For a given vertex coordinate, and other calculated values, compute the
     * viewVertexPosition, the location in view space (screen pixels) where the
     * sprite's vertex would appear.
     */
    function computeViewVertexPosition() {
        return glsl `
/**
 * @param positionWorld The position of the sprite in world coords.
 * @param size Size of the sprite in world coordinates.
 * @param positionRelative Offset position relative to vert coords.
 * @param positionPixel Offset position in screen pixels.
 * @param vertCoords Local coordinates for this vertex.
 * @param viewMatrix Matrix to project world coords into view space (pixels).
 */
vec2 computeViewVertexPosition(
    vec2 positionWorld,
    vec2 size,
    vec2 positionRelative,
    vec2 positionPixel,
    vec2 vertCoords,
    mat3 viewMatrix
) {
  vec2 vertexPositionWorld =
    positionWorld + size * (positionRelative + vertCoords);
  vec2 viewVertexPosition =
    (viewMatrix * vec3(vertexPositionWorld, 1.)).xy + positionPixel * 4.;
  return viewVertexPosition;
}
`;
    }
    /**
     * Compute the size of the sprite in world units, incorporating the effect of
     * geometric zoom and capping to max and min pixel sizes if specified.
     */
    function computeSize() {
        return glsl `
/**
 *
 * @param sizeWorld Size of the sprite in world coordinates.
 * @param sizePixel Offset size of the sprite in pixels.
 * @param geometricZoom The geometric zoom size modifier.
 * @param viewMatrixScale XY scale (world coords to pixels), and ZW inverse.
 * @param maxSizePixel Maximum allowed size in pixels.
 * @param minSizePixel Minimum allowed size in pixels.
 */
vec2 computeSize(
  vec2 sizeWorld,
  vec2 sizePixel,
  vec2 geometricZoom,
  vec4 viewMatrixScale,
  vec2 maxSizePixel,
  vec2 minSizePixel
) {
  // Combine scale with geometric zoom effect.
  vec2 zoomScale = exp(log(viewMatrixScale.xy) * (1. - geometricZoom));

  // Project the size in world coordinates to pixels to apply min/max.
  vec2 projectedSizePixel = (sizeWorld * zoomScale + sizePixel * 4.);

  // Inital computed size in world coordinates is based on projected pixel size.
  vec2 computedSize = projectedSizePixel * viewMatrixScale.zw;

  // TODO(jimbo): Add border width to size if positioned externally.

  // Compute whether max and min size components are positive, in parallel.
  // XY contains results for max, ZW contains results for min.
  bvec4 isPositive = greaterThan(vec4(maxSizePixel, minSizePixel), vec4(0.));

  // Apply maximums if set.
  bvec2 gtMax = greaterThan(projectedSizePixel, maxSizePixel);
  if (isPositive.x && gtMax.x) {
    computedSize.x = maxSizePixel.x * viewMatrixScale.z;
  }
  if (isPositive.y && gtMax.y) {
    computedSize.y = maxSizePixel.y * viewMatrixScale.w;
  }

  // Apply minimums if set.
  bvec2 ltMin = lessThan(projectedSizePixel, minSizePixel);
  if (isPositive.z && ltMin.x) {
    computedSize.x = minSizePixel.x * viewMatrixScale.z;
  }
  if (isPositive.w && ltMin.y) {
    computedSize.y = minSizePixel.y * viewMatrixScale.w;
  }

  return computedSize;
}
`;
    }
    /**
     * In parallel, compute the current world and pixel component sizes.
     */
    function computeCurrentSizePixelAndWorld() {
        return glsl `
vec4 computeCurrentSizePixelAndWorld() {
  return computeCurrentValue(
    vec4(
      previousSizePixel(),
      previousSizeWorld()),
    vec4(
      previousSizePixelDelta(),
      previousSizeWorldDelta()),
    vec4(
      targetSizePixel(),
      targetSizeWorld())
  );
}
`;
    }
    /**
     * In parallel, compute the current max and min pixel component sizes.
     */
    function computeCurrentMaxAndMinSizePixel() {
        return glsl `
vec4 computeCurrentMaxAndMinSizePixel() {
  return computeCurrentValue(
    vec4(
      previousMaxSizePixel(),
      previousMinSizePixel()
    ),
    vec4(
      previousMaxSizePixelDelta(),
      previousMinSizePixelDelta()
    ),
    vec4(
      targetMaxSizePixel(),
      targetMinSizePixel()
    )
  ) * 4.;
}
`;
    }
    /**
     * Given the size of the sprite, compute its aspect ratio and the inverse. One
     * of the components will be 1., while the other component will be the multiple.
     * For example, a sprite which is twice as wide as it is tall will yield the
     * vector: vec4(2., 1., .5, 1.);
     */
    function computeAspectRatio() {
        return glsl `
/**
 * @param size The size of the sprite.
 * @return The aspect ratio (XY) and the inverse of the aspect ratio (ZW).
 */
vec4 computeAspectRatio(vec2 size) {
  vec2 ar = size / min(size.x, size.y);
  return vec4(ar, 1. / ar);
}
`;
    }

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
     * Returns the code for the Scene's main rendering fragment shader program.
     */
    function fragmentShader$2() {
        return glsl `
precision lowp float;

/**
 * View matrix for converting from world space to clip space.
 */
uniform mat3 viewMatrix;

/**
 * Signed-distance field (SDF) texture. Sampled for implementing glyphs of text.
 */
uniform sampler2D sdfTexture;

/**
 * Varying time value, eased using cubic-in-out between the previous and target
 * timestamps for this Sprite.
 */
varying float varyingT;

/**
 * Interpolated, per-vertex coordinate attributes for the quad into which the
 * sprite will be rendered.
 */
varying vec4 varyingVertexCoordinates;

/**
 * Threshold distance values to consider the pixel outside the shape (X) or
 * inside the shape (Y). Values between constitue the borde.
 */
varying vec2 varyingBorderThresholds;

/**
 * Aspect ratio of the sprite's renderable area (XY) and their inverses (ZW).
 * One component of each pair will be 1. For the XY pair, the other component
 * be be greater than 1. and for the inverse pair it will be smaller.
 *
 * For example, a rectangle that's twice as wide as it is tall wolud have
 * varyingAspectRatio equal to vec4(2., 1., .5, 1.).
 */
varying vec4 varyingAspectRatio;

/**
 * Color attributes.
 */
varying vec4 varyingBorderColor;
varying vec4 varyingFillColor;

/**
 * Shape attributes used by fragment shader.
 */
varying float varyingPreviousSides;
varying float varyingTargetSides;
varying vec4 varyingPreviousShapeTexture;
varying vec4 varyingTargetShapeTexture;

// Import utility shader functions).
${range()}

const float PI = 3.1415926535897932384626433832795;

/**
 * Given a line segment described by two points (a,b), find the point along that
 * line segment nearest to a point of interest (p).
 */
vec2 closestPoint(vec2 a, vec2 b, vec2 p) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  vec2 baNorm = normalize(ba);
  float baLen = length(ba);
  float projectedLen = dot(baNorm, pa);
  vec2 closest =
    projectedLen < 0. ? a :
    projectedLen > baLen ? b :
    a + baNorm * projectedLen;
  return closest;
}

/**
 * Matrix to flip XY coordinates for theta computation. To orient polygons and
 * stars pointing upwards, we compute angles counter-clockwise from vertical.
 */
const mat2 FLIP_MATRIX = mat2(vec2(0., 1.), vec2(-1., 0.));

/**
 * Given a point in the range (-1,-1) to (1,1), compute the angle to that point,
 * going counter-clockwise from vertical.
 */
float computeTheta(vec2 point) {
  vec2 f = FLIP_MATRIX * point;
  return atan(f.y, f.x) + PI;
}

/**
 * Given the varying coordinates of interest, the dimensions of the shape's
 * bounding box, the number of sides, and a list of repeating offset radii,
 * determine the signed distance from the coordinates to the nearest edge of the
 * shape.
 *
 * @param sides Number of sides of the polygon or star.
 * @param radii List of four repeating offset radii to render stars. If all
 * values are 0., then the rendered distance will be a regular polygon.
 */
float getDistStar(int sides, vec4 radii) {
  float fSides = float(sides);

  // Flip radii (0. means align with unit circle, 1. means center of shape).
  radii = 1. - radii;

  // Angle to cut through the midpoint of a regular polygon's side.
  float piSides = PI / fSides;

  // With the polygon pointed up, this is the angle (counter-clockwise from top)
  // to the point just before crossing the X-axis. For a triangle, this will
  // just be the same as piSides.
  float wideAngle = floor(fSides * .5) * piSides;

  // Compute radius for dilation to fill bounding box.
  float dilation = 1. / max(sin(wideAngle), sin(piSides));

  // Compute the height of the shape, for centering.
  float height = dilation * (1. + max(cos(PI - 2. * wideAngle), cos(piSides)));

  // The point of interest starts with the varyingVertexCoordinates, but shifted
  // to center the shape vertically.
  vec2 poi = 2. * varyingVertexCoordinates.xy + vec2(0., 2. - height);

  // Compute theta for point of interest, counter-clockwise from vertical.
  float theta = computeTheta(poi);

  // Incorporate aspect ratio calculation. This ensures that distances to
  // borders do not stretch with the shape.
  vec2 aspect = varyingAspectRatio.xy;
  poi *= aspect;

  // Compute which side of the star we're on, and use this to compute adjustment
  // to a and b points. This creates the star effect.
  float side = floor(theta / PI * .5 * fSides);

  float minDistance = 1.e20;
  float distanceSign;

  // Look at sides to the left/right (clockwise) to find the closest.
  for (int i = -1; i < 2; i++) {
    float thisSide = side + float(i);
    float m = mod(thisSide + 4., 4.);

    vec2 adjust =
      m < 1. ? radii.xy :
      m < 2. ? radii.yz :
      m < 3. ? radii.zw :
      radii.wx;

    // Find the ab line segment endpoints.
    float thetaA = 2. * thisSide * piSides;
    float thetaB = thetaA + 2. * piSides;
    vec2 a = aspect * dilation * adjust.x * vec2(-sin(thetaA), cos(thetaA));
    vec2 b = aspect * dilation * adjust.y * vec2(-sin(thetaB), cos(thetaB));

    // Find the closest point on the segment and update minDistance.
    vec2 c = closestPoint(a, b, poi).xy;
    minDistance = min(minDistance, distance(poi, c));

    // If we're in our own segment, capture the distance sign.
    if (i == 0) {
      // Use cross product to determine if we're inside or outside the line.
      distanceSign = sign(cross(vec3(b - a, 0.), vec3(poi - c, 0.)).z);
    }
  }

  return minDistance * distanceSign;
}

/**
 * Convenience method for calling getDistStar() with a fixed size array of 0.
 * values to create a regular polygon.
 */
float getDistPolygon(int sides) {
  return getDistStar(sides, vec4(0.));
}

/**
 * Estimate the distance from the varying vertex coordinate to the nearest point
 * on an ellipse of the specified aspect ratio. Mathematically, a closed-form
 * solution for this problem has not yet been discovered.
 *
 * Higher accuracy estimates of ellipse distance are possible with more
 * computation steps, but the procedure used here yields sufficient accurancy
 * for data visualization purposes.
 */
float getDistEllipse() {
  // All quadrants can be treated the same, so use the absolute value of the
  // vertex coordinates, and flip if needed so that the X dimension is always
  // the greater.
  bool flipped = varyingAspectRatio.x < varyingAspectRatio.y;
  vec4 aspectRatio = flipped ? varyingAspectRatio.yxwz : varyingAspectRatio;

  // Point of interest in the expanded circle (before aspect ratio stretching).
  vec2 circlePoint = 2. * abs(
      flipped ? varyingVertexCoordinates.yx : varyingVertexCoordinates.xy);

  // Capture length for inside/outside checking.
  float len = length(circlePoint);

  // Point of interest in the ellipse (after aspect ratio stretching).
  vec2 ellipsePoint = circlePoint * aspectRatio.xy;

  // Compute the angle from the x-axis up to the point of interest.
  float theta = PI - atan(circlePoint.y, -circlePoint.x);

  // Find the point where a ray from the origin through c hits the ellipse.
  vec2 p1 = aspectRatio.xy * vec2(cos(theta), sin(theta));

  // Find a second point by casting up from the x-axis. If the point of interest
  // is outside the ellipse and past the tip, use the tip coordinate.
  float invAr2 = aspectRatio.z * aspectRatio.z;
  vec2 p2 = ellipsePoint.x > aspectRatio.x ? vec2(aspectRatio.x, 0.) :
    vec2(ellipsePoint.x, sqrt(1. - ellipsePoint.x * ellipsePoint.x * invAr2));

  // Take the minimum distance between ray intersection point and vertical.
  float dist = min(distance(ellipsePoint, p1), distance(ellipsePoint, p2));

  // If the point of interest is outside of the ellipse, smooth by checking the
  // distance to one more point: the point on the ellipse between p1 and p2 such
  // that its X coordinate is half way between.
  if (len > 1.) {
    vec2 pm = mix(p1, p2, .5);
    pm.y = sqrt(1. - pm.x * pm.x * invAr2);
    dist = min(dist, distance(ellipsePoint, pm));
  }

  // Return signed distance.
  return dist * sign(1. - len);
}

/**
 * Compute the signed distance from the point of interest to the nearest edge of
 * the sprite bonding box.
 */
float getDistRect() {
  // All quadrants can be treated the same, so we limit our computation to the
  // top right.
  vec2 ar = varyingAspectRatio.xy;
  vec2 p = ar * 2. * abs(varyingVertexCoordinates.xy);

  // If the point of intrest is beyond the top corner, return the negative
  // distance to that corner.
  if (all(greaterThan(p, ar))) {
    return -distance(p, ar);
  }

  // Determine distance to nearest edge.
  vec2 d = ar - p;
  vec2 dabs = abs(d);
  return dabs.x < dabs.y ? d.x : d.y;
}

/**
 * Sample the distance from the sdfTexture. The texture is assumed to have
 * one-dimensional distances in the X and Y componets and two-dimensional
 * distance in the Z component.
 *
 * @param shapeTexture UV coordinates and width/height of the region of the SDF
 * texture within which to sample (corresponds to the glyph being rendered).
 */
float getDistSDF(vec4 shapeTexture) {
  vec2 textureUv =
      shapeTexture.xy +
      shapeTexture.zw * varyingVertexCoordinates.zw;
  return 2. * texture2D(sdfTexture, textureUv).z - 1.;
}

/**
 * Generic distance function that calls through to one of the more specific
 * distance functions.
 *
 * @param sides Number of sides of the polygon/star, or special value:
 *  s < 0      : Reserved / Undefined.
 *  s == 0     : Use SDF texture coordinates.
 *  s == 1     : Circle.
 *  s == 2     : Filled rectangle.
 *  s > 2      : Polygon / Star.
 * @param textureUv Offset into SDF texture.
 */
float getDist(int sides, vec4 shapeTexture) {
  return
    sides == 0 ? getDistSDF(shapeTexture) :
    sides == 1 ? getDistEllipse() :
    sides == 2 ? getDistRect() :
    sides > 2 ? getDistPolygon(sides) :
    1.; // Reserved / undefined.
}

void main () {
  int previousSides = int(varyingPreviousSides);
  int targetSides = int(varyingTargetSides);

  float previousDistance = getDist(previousSides, varyingPreviousShapeTexture);
  float targetDistance = getDist(targetSides, varyingTargetShapeTexture);
  float signedDistance = mix(previousDistance, targetDistance, varyingT);

  gl_FragColor =
    signedDistance < varyingBorderThresholds.x ? vec4(0.) :
    signedDistance < varyingBorderThresholds.y ? varyingBorderColor :
    varyingFillColor;
}
`;
    }

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
     * Returns the code for the Scene's main rendering vertex shader program.
     * Uses generated GLSL code fragments produced by the supplied AttributeMapper.
     */
    function vertexShader$2(attributeMapper) {
        return glsl `
precision lowp float;

/**
 * Current uniform timestamp for interpolating.
 */
uniform float ts;

/**
 * Incremental clip-space Z for stacking sprites based on their instanceIndex.
 * This ensures that partial-opacity pixels of stacked sprites will be
 * alpha-blended. Without this, occluded sprites' pixels may not blend.
 */
uniform float instanceZ;

/**
 * View and projection matrices for converting from world space to clip space.
 */
uniform mat3 viewMatrix;
uniform mat3 projectionMatrix;

/**
 * Scale includes the X and Y dimensions of the viewMatrix, and their inverses
 * in the WZ components.
 */
uniform vec4 viewMatrixScale;

/**
 * Data textures holding the previous and target Sprite instance
 * attributes. The instantaneous value for each attribute is determined by
 * interpolating between the previous and target according to the ts uniform.
 */
uniform sampler2D previousValuesTexture;
uniform sampler2D targetValuesTexture;

/**
 * Per-vertex coordinates for the quad into which the sprite will be rendered.
 * XY contain the local cartesian coordinates for a unit square centered at the
 * origin. The ZW coordinates contain the y-flipped UV coordinates for orienting
 * the square against texture atlases.
 *
 *   vertexCoordinates: [
 *     [-0.5, -0.5, 0, 1],
 *     [0.5, -0.5, 1, 1],
 *     [-0.5, 0.5, 0, 0],
 *     [0.5, 0.5, 1, 0],
 *   ],
 *
 */
attribute vec4 vertexCoordinates;

/**
 * Instanced, per-sprite index and UV coordinates of the sprite's data swatch.
 */
attribute float instanceIndex;
attribute vec2 instanceSwatchUv;

/**
 * Varying time value, eased using cubic-in-out between the previous and target
 * timestamps for this Sprite.
 */
varying float varyingT;

/**
 * Interpolated vertexCoordinates for fragment shader.
 */
varying vec4 varyingVertexCoordinates;

/**
 * Threshold distance values to consider the pixel outside the shape (X) or
 * inside the shape (Y). Values between constitue the borde.
 */
varying vec2 varyingBorderThresholds;

/**
 * Aspect ratio of the sprite's renderable area (XY) and their inverses (ZW).
 * One component of each pair will be 1. For the XY pair, the other component
 * be be greater than 1. and for the inverse pair it will be smaller.
 *
 * For example, a rectangle that's twice as wide as it is tall would have
 * varyingAspectRatio equal to vec4(2., 1., .5, 1.).
 */
varying vec4 varyingAspectRatio;

/**
 * Color attributes used by fragment shader.
 */
varying vec4 varyingBorderColor;
varying vec4 varyingFillColor;

/**
 * Shape attributes used by fragment shader.
 */
varying float varyingPreviousSides;
varying float varyingTargetSides;
varying vec4 varyingPreviousShapeTexture;
varying vec4 varyingTargetShapeTexture;

// Import utility shader functions.
${range()}
${cubicEaseInOut()}

// These arrays are filled in by code generated by the AttributeMapper.
vec4 previousTexelValues[${attributeMapper.texelsPerSwatch}];
vec4 targetTexelValues[${attributeMapper.texelsPerSwatch}];

/**
 * Read data texel values into the previous and target arrays.
 */
void readTexels() {
    ${attributeMapper.generateTexelReaderGLSL('previousTexelValues', 'previousValuesTexture', 'instanceSwatchUv')}
    ${attributeMapper.generateTexelReaderGLSL('targetTexelValues', 'targetValuesTexture', 'instanceSwatchUv')}
}

// Dynamically generate #DEFINE statements to access texel attributes by name.
// These look like method invocations elsewhere in the code. For example, the
// define "targetTransitionTimeMs()" extracts the float value
// targetTexelValues[0].r.
${attributeMapper.generateAttributeDefinesGLSL('previous', 'previousTexelValues')}
${attributeMapper.generateAttributeDefinesGLSL('target', 'targetTexelValues')}

/**
 * Local, non-eased, normalized time value between 0 and 1, computed between the
 * previous and target timestamp according to the uniform ts.
 */
float t;

${computeCurrentValue()}

/**
 * Precomputed constant value for converting colors in the 0-255 RGB range to
 * the GL standard 0-1 range. (1 / 255 = 0.00392156862745098)
 */
const vec4 GL_COLOR = vec4(vec3(0.00392156862745098), 1.);

/**
 * Function to compute all the varying values needed by the fragment shader.
 */
void setupVaryings() {
  // Clamp and range t value within previous and target timestamps.
  t =
    ts >= targetTransitionTimeMs() ? 1. :
    ts <= previousTransitionTimeMs() ? 0. :
    clamp(range(previousTransitionTimeMs(), targetTransitionTimeMs(), ts),
        0., 1.);

  // Compute eased varyingT.
  varyingT = cubicEaseInOut(t);

  // Copy and interpolate vertex coordinate values.
  varyingVertexCoordinates = vertexCoordinates;

  // Copy previous and target shape attributes.
  varyingPreviousSides = previousSides();
  varyingPreviousShapeTexture = previousShapeTexture();
  varyingTargetSides = targetSides();
  varyingTargetShapeTexture = targetShapeTexture();

  // Compute color attributes.
  varyingBorderColor = computeCurrentValue(
    previousBorderColor(),
    previousBorderColorDelta(),
    targetBorderColor()) * GL_COLOR;
  varyingFillColor = computeCurrentValue(
    previousFillColor(),
    previousFillColorDelta(),
    targetFillColor()) * GL_COLOR;
}

${computeAspectRatio()}
${computeCurrentMaxAndMinSizePixel()}
${computeCurrentSizePixelAndWorld()}
${computeSize()}
${computeViewVertexPosition()}

void main () {

  // Read data values from previous and target data textures.
  readTexels();

  // Setup varying values used both here and by the fragment shader.
  setupVaryings();

  // Compute current size component values by interpolation (parallelized).
  vec4 currentSizePixelAndWorld = computeCurrentSizePixelAndWorld();
  vec2 currentSizePixel = currentSizePixelAndWorld.xy;
  vec2 currentSizeWorld = currentSizePixelAndWorld.zw;

  vec2 currentGeometricZoom = computeCurrentValue(
      previousGeometricZoom(),
      previousGeometricZoomDelta(),
      targetGeometricZoom()
  );

  vec4 currentMaxAndMinSizePixel = computeCurrentMaxAndMinSizePixel();
  vec2 currentMaxSizePixel = currentMaxAndMinSizePixel.xy;
  vec2 currentMinSizePixel = currentMaxAndMinSizePixel.zw;

  // Compute the current size of the sprite in world units, including the effect
  // of geometric zoom and applying min and max pixel sizes.
  vec2 computedSize = computeSize(
    currentSizeWorld,
    currentSizePixel,
    currentGeometricZoom,
    viewMatrixScale,
    currentMaxSizePixel,
    currentMinSizePixel
  );

  // Compute border attributes in parallel.
  vec3 borderProperties = computeCurrentValue(
      vec3(
        previousBorderRadiusWorld(),
        previousBorderRadiusPixel(),
        previousBorderPlacement()),
      vec3(
        previousBorderRadiusWorldDelta(),
        previousBorderRadiusPixelDelta(),
        previousBorderPlacementDelta()),
      vec3(
        targetBorderRadiusWorld(),
        targetBorderRadiusPixel(),
        targetBorderPlacement())
  );

  // The fragment shader needs to know the threshold signed distances that
  // indicate whether each pixel is inside the shape, in the boreder, or outside
  // of the shape.
  vec2 projectedSizePixel = computedSize.xy * viewMatrixScale.xy;
  float edgeDistance = borderProperties.x +
    borderProperties.y * 8. / min(projectedSizePixel.x, projectedSizePixel.y);
  varyingBorderThresholds =
    vec2(0., edgeDistance) + mix(0., -edgeDistance, borderProperties.z);

  // Compute the sprite's aspect ratio and the inverse.
  varyingAspectRatio = computeAspectRatio(computedSize);

  // Compute the current position component attributes.
  vec2 currentPositionPixel = computeCurrentValue(
      previousPositionPixel(),
      previousPositionPixelDelta(),
      targetPositionPixel());

  vec2 currentPositionWorld = computeCurrentValue(
      previousPositionWorld(),
      previousPositionWorldDelta(),
      targetPositionWorld());

  vec2 currentPositionRelative = computeCurrentValue(
      previousPositionRelative(),
      previousPositionRelativeDelta(),
      targetPositionRelative());

  // Project the world position into pixel space, then add the pixel component.
  vec2 viewVertexPosition = computeViewVertexPosition(
      currentPositionWorld,
      computedSize,
      currentPositionRelative,
      currentPositionPixel,
      vertexCoordinates.xy,
      viewMatrix
  );

  // Project the pixel space coordinate into clip space.
  vec2 clipVertexPosition =
    (projectionMatrix * vec3(viewVertexPosition, 1.)).xy;

  // Align Z axis clip-space coordinate (perpendicular to screen) with instance
  // index for blending stacked sprites.
  gl_Position = vec4(clipVertexPosition, -instanceIndex * instanceZ, 1.);
}
`;
    }

    /**
     * Setup the draw command which reads from both the previous Sprite state
     * texture and the target state texture.
     */
    function setupDrawCommand(coordinator) {
        const regl = coordinator.regl;
        return regl({
            // TODO(jimbo): Expose a mechansim to allow the API user to override these.
            blend: {
                enable: true,
                func: {
                    srcRGB: 'src alpha',
                    srcAlpha: 1,
                    dstRGB: 'one minus src alpha',
                    dstAlpha: 1
                },
                equation: {
                    rgb: 'add',
                    alpha: 'max',
                },
            },
            frag: fragmentShader$2(),
            vert: vertexShader$2(coordinator.attributeMapper),
            attributes: {
                // Corners and uv coords of the rectangle, same for each sprite.
                vertexCoordinates: [
                    [-0.5, -0.5, 0, 1],
                    [0.5, -0.5, 1, 1],
                    [-0.5, 0.5, 0, 0],
                    [0.5, 0.5, 1, 0],
                ],
                // Swatch uv coordinates for retrieving data texture values.
                instanceSwatchUv: {
                    buffer: coordinator.instanceSwatchUvBuffer,
                    divisor: 1,
                },
                // Instance indices for computing default z-ordering.
                instanceIndex: {
                    buffer: coordinator.instanceIndexBuffer,
                    divisor: 1,
                },
            },
            uniforms: {
                ts: () => coordinator.elapsedTimeMs(),
                instanceZ: () => 1 / (1 + coordinator.instanceCount),
                viewMatrix: () => coordinator.getViewMatrix(),
                viewMatrixScale: () => coordinator.getViewMatrixScale(),
                projectionMatrix: context => coordinator.getProjectionMatrix(context),
                sdfTexture: coordinator.sdfTexture,
                previousValuesTexture: coordinator.previousValuesFramebuffer,
                targetValuesTexture: coordinator.targetValuesTexture,
            },
            primitive: 'triangle strip',
            count: 4,
            instances: () => coordinator.instanceCount, // But many sprite instances.
        });
    }

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
     * Generate the fragment (pixel) shader for the hit test command. For each
     * sprite, this shader writes whether the screen pixel of interest intersects it
     * to the RGB color channels of the output texel.
     */
    function fragmentShader$1() {
        return glsl `
precision lowp float;

varying float varyingHitTestResult;

void main () {
  gl_FragColor = vec4(vec3(varyingHitTestResult), 1.);
}
`;
    }
    /**
     * Generate the vertex shader for the hit test shader program. This positions
     * the coordinates of the rect to exactly cover the single output texel pointed
     * to by instanceHitTestUv.
     *
     * @param hitTestAttributeMapper Mapper for hit test output texels.
     * @param attributeMapper Mapper for sprite state attributes.
     */
    function vertexShader$1(hitTestAttributeMapper, attributeMapper) {
        return glsl `
precision lowp float;

uniform float ts;

/**
 * Screen pixel coordinates for performing the hit test. The XY channels contain
 * the screen x and y coordinates respectively. The ZW channels hold the width
 * and height of the bounding box of interest. Currently those are ignored.
 */
uniform vec4 hitTestCoordinates;

uniform mat3 viewMatrix;

/**
 * Scale includes the X and Y dimensions of the viewMatrix, and their inverses
 * in the WZ components.
 */
uniform vec4 viewMatrixScale;

uniform sampler2D previousValuesTexture;
uniform sampler2D targetValuesTexture;

attribute vec2 vertexCoordinates;

attribute vec2 instanceSwatchUv;
attribute vec2 instanceHitTestUv;

#define TEXELS_PER_SWATCH ${hitTestAttributeMapper.texelsPerSwatch}.
#define TEXTURE_WIDTH ${hitTestAttributeMapper.textureWidth}.
#define TEXTURE_HEIGHT ${hitTestAttributeMapper.textureHeight}.

// The result of the hit test, written to the data texel by the fragment shader.
varying float varyingHitTestResult;

vec4 previousTexelValues[${attributeMapper.texelsPerSwatch}];
vec4 targetTexelValues[${attributeMapper.texelsPerSwatch}];

${attributeMapper.generateAttributeDefinesGLSL('previous', 'previousTexelValues')}
${attributeMapper.generateAttributeDefinesGLSL('target', 'targetTexelValues')}

float rangeT;
float easeT;

// Import utility shader functions.
${range()}
${cubicEaseInOut()}
${computeCurrentValue('rangeT', 'easeT')}
${computeCurrentMaxAndMinSizePixel()}
${computeCurrentSizePixelAndWorld()}
${computeSize()}
${computeViewVertexPosition()}

void readInputTexels() {
${attributeMapper.generateTexelReaderGLSL('previousTexelValues', 'previousValuesTexture', 'instanceSwatchUv')}
${attributeMapper.generateTexelReaderGLSL('targetTexelValues', 'targetValuesTexture', 'instanceSwatchUv')}
}

const vec2 swatchSize =
  vec2(TEXELS_PER_SWATCH / TEXTURE_WIDTH, 1. / TEXTURE_HEIGHT);

void main () {
  readInputTexels();

  // Compute time variables.
  rangeT = clamp(
      range(previousTransitionTimeMs(), targetTransitionTimeMs(), ts),
      0., 1.);
  easeT = cubicEaseInOut(rangeT);

  // Compute current size component values by interpolation (parallelized).
  vec4 currentSizePixelAndWorld = computeCurrentSizePixelAndWorld();
  vec2 currentSizePixel = currentSizePixelAndWorld.xy;
  vec2 currentSizeWorld = currentSizePixelAndWorld.zw;

  vec2 currentGeometricZoom = computeCurrentValue(
      previousGeometricZoom(),
      previousGeometricZoomDelta(),
      targetGeometricZoom()
  );

  vec4 currentMaxAndMinSizePixel = computeCurrentMaxAndMinSizePixel();
  vec2 currentMaxSizePixel = currentMaxAndMinSizePixel.xy;
  vec2 currentMinSizePixel = currentMaxAndMinSizePixel.zw;

  // Compute the current size of the sprite in world units, including the effect
  // of geometric zoom and applying min and max pixel sizes.
  vec2 computedSize = computeSize(
    currentSizeWorld,
    currentSizePixel,
    currentGeometricZoom,
    viewMatrixScale,
    currentMaxSizePixel,
    currentMinSizePixel
  );

  // Compute the current position component attributes.
  vec2 currentPositionPixel = computeCurrentValue(
      previousPositionPixel(),
      previousPositionPixelDelta(),
      targetPositionPixel());

  vec2 currentPositionWorld = computeCurrentValue(
      previousPositionWorld(),
      previousPositionWorldDelta(),
      targetPositionWorld());

  vec2 currentPositionRelative = computeCurrentValue(
      previousPositionRelative(),
      previousPositionRelativeDelta(),
      targetPositionRelative());

  // Project the world position into pixel space for the bottom left and top
  // right corners of the sprite's quad.
  vec2 bottomLeft = computeViewVertexPosition(
      currentPositionWorld,
      computedSize,
      currentPositionRelative,
      currentPositionPixel,
      vec2(-.5, -.5),
      viewMatrix
  ) * .25;
  vec2 topRight = computeViewVertexPosition(
      currentPositionWorld,
      computedSize,
      currentPositionRelative,
      currentPositionPixel,
      vec2(.5, .5),
      viewMatrix
  ) * .25;

  // Test whether the coordinates of interest are within the sprite quad's
  // bounding box.
  // TODO (jimbo): Use ZW components to test for area of interest.
  varyingHitTestResult =
    bottomLeft.x < hitTestCoordinates.x &&
    bottomLeft.y > hitTestCoordinates.y &&
    topRight.x > hitTestCoordinates.x &&
    topRight.y < hitTestCoordinates.y ? 1. : 0.;

  vec2 swatchUv =
    instanceHitTestUv + (vertexCoordinates.xy + .5) * swatchSize;

  // Position the verts to write into the appropriate data texel.
  gl_Position = vec4(2. * swatchUv - 1., 0., 1.);
}
`;
    }

    /**
     * Set up a REGL draw command to update the hit test framebuffer.
     *
     * @param coordinator Upstream renderer implementation.
     */
    function setupHitTestCommand(coordinator) {
        const { regl, attributeMapper, hitTestAttributeMapper } = coordinator;
        return regl({
            frag: fragmentShader$1(),
            vert: vertexShader$1(hitTestAttributeMapper, attributeMapper),
            attributes: {
                // Corners and UV coords of the rectangle, same for each sprite.
                vertexCoordinates: [
                    [-0.5, -0.5],
                    [0.5, -0.5],
                    [-0.5, 0.5],
                    [0.5, 0.5],
                ],
                // Swatch UV coordinates for retrieving previous and target texture
                // values.
                instanceSwatchUv: {
                    buffer: coordinator.instanceSwatchUvBuffer,
                    divisor: 1,
                },
                // Instance swatch UV coordinates.
                instanceHitTestUv: {
                    buffer: coordinator.instanceHitTestUvBuffer,
                    divisor: 1,
                },
            },
            uniforms: {
                ts: () => coordinator.elapsedTimeMs(),
                hitTestCoordinates: () => ([
                    coordinator.hitTestParameters.x,
                    coordinator.hitTestParameters.y,
                    coordinator.hitTestParameters.width,
                    coordinator.hitTestParameters.height,
                ]),
                inclusive: () => coordinator.hitTestParameters.inclusive ? 1 : 0,
                viewMatrix: () => coordinator.getViewMatrix(),
                viewMatrixScale: () => coordinator.getViewMatrixScale(),
                targetValuesTexture: coordinator.targetValuesTexture,
                previousValuesTexture: coordinator.previousValuesTexture,
            },
            primitive: 'triangle strip',
            count: 4,
            instances: () => coordinator.instanceCount,
            framebuffer: () => coordinator.hitTestValuesFramebuffer,
        });
    }

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
     * Generate the fragment (pixel) shader for the rebase command. The supplied
     * AttributeMapper is used to translate between texel channels and sprite
     * attribute values.
     */
    function fragmentShader(attributeMapper) {
        return glsl `
precision lowp float;

uniform float ts;

uniform sampler2D previousValuesTexture;
uniform sampler2D targetValuesTexture;

varying float varyingTexelIndex;
varying vec2 varyingRebaseUv;

vec4 previousTexelValues[${attributeMapper.texelsPerSwatch}];
vec4 targetTexelValues[${attributeMapper.texelsPerSwatch}];

${attributeMapper.generateAttributeDefinesGLSL('previous', 'previousTexelValues')}
${attributeMapper.generateAttributeDefinesGLSL('target', 'targetTexelValues')}

// Import utility shader functions.
${range()}
${cubicEaseInOut()}

float computeValueAtTime(
    float startingValue,
    float startingDelta,
    float targetValue,
    float ts) {
  float rangeT =
    ts >= targetTransitionTimeMs() ? 1. :
    ts <= previousTransitionTimeMs() ? 0. :
    clamp(
        range(previousTransitionTimeMs(), targetTransitionTimeMs(), ts),
        0., 1.);
  float easeT = cubicEaseInOut(rangeT);

  float currentValue = mix(startingValue, targetValue, easeT);
  float projectedValue = startingDelta *
    (targetTransitionTimeMs() - previousTransitionTimeMs());

  return currentValue + projectedValue * rangeT * pow(1. - rangeT, 3.);
}

// DELTA_MS is the duration in milliseconds to use when estimating the
// 'instantaneous' change in a value. INV_DELTA_MS is its inverse.
#define DELTA_MS 1.
#define INV_DELTA_MS 1.

float computeDeltaAtTime(
    float startingValue,
    float startingDelta,
    float targetValue,
    float ts
) {
  if (ts >= targetTransitionTimeMs()) {
    return 0.;
  }
  if (ts <= previousTransitionTimeMs()) {
    return startingDelta;
  }
  return (
      computeValueAtTime(
          startingValue, startingDelta, targetValue, ts + DELTA_MS) -
      computeValueAtTime(
          startingValue, startingDelta, targetValue, ts)
      ) * INV_DELTA_MS;
}

float computeThresholdValue(
    float previousValue,
    float targetValue,
    float rebaseTs
) {
  float mid = mix(previousTransitionTimeMs(), targetTransitionTimeMs(), .5);
  return rebaseTs < mid ? previousValue : targetValue;
}

void readInputTexels() {
${attributeMapper.generateTexelReaderGLSL('previousTexelValues', 'previousValuesTexture', 'varyingRebaseUv')}
${attributeMapper.generateTexelReaderGLSL('targetTexelValues', 'targetValuesTexture', 'varyingRebaseUv')}
}

void setOutputTexel() {
  float rebaseTs = ts;
  ${attributeMapper.generateRebaseFragmentGLSL('previousTexelValues', 'targetTexelValues', 'varyingTexelIndex', 'rebaseTs')}
}

void main () {
  readInputTexels();
  setOutputTexel();
}
`;
    }
    /**
     * Generate the vertex shader for the rebase program.
     */
    function vertexShader(attributeMapper) {
        return glsl `
precision lowp float;

attribute vec2 vertexCoordinates;

attribute vec2 instanceRebaseUv;

#define TEXELS_PER_SWATCH ${attributeMapper.texelsPerSwatch}.
#define TEXTURE_WIDTH ${attributeMapper.textureWidth}.
#define TEXTURE_HEIGHT ${attributeMapper.textureHeight}.

varying vec2 varyingRebaseUv;
varying float varyingTexelIndex;

const vec2 swatchSize =
  vec2(TEXELS_PER_SWATCH / TEXTURE_WIDTH, 1. / TEXTURE_HEIGHT);

void main () {
  varyingRebaseUv = instanceRebaseUv;
  varyingTexelIndex = (vertexCoordinates.x + .5) * TEXELS_PER_SWATCH - .5;
  vec2 swatchUv = instanceRebaseUv + (vertexCoordinates.xy + .5) * swatchSize;
  gl_Position = vec4(2. * swatchUv - 1., 0., 1.);
}
`;
    }

    /**
     * Set up a REGL draw command to update the memory of current and velocity
     * values for sprite attributes.
     *
     * @param coordinator Upstream renderer implementation.
     */
    function setupRebaseCommand(coordinator) {
        const { regl, attributeMapper } = coordinator;
        return regl({
            frag: fragmentShader(attributeMapper),
            vert: vertexShader(attributeMapper),
            attributes: {
                // Corners and uv coords of the rectangle, same for each sprite.
                vertexCoordinates: [
                    [-0.5, -0.5],
                    [0.5, -0.5],
                    [-0.5, 0.5],
                    [0.5, 0.5],
                ],
                // Instance swatch UV coordinates.
                instanceRebaseUv: {
                    buffer: () => coordinator.instanceRebaseUvBuffer,
                    divisor: 1,
                },
            },
            uniforms: {
                ts: () => coordinator.elapsedTimeMs(),
                targetValuesTexture: coordinator.targetValuesTexture,
                previousValuesTexture: coordinator.previousValuesTexture,
            },
            primitive: 'triangle strip',
            count: 4,
            instances: () => coordinator.rebaseCount,
            framebuffer: () => coordinator.previousValuesFramebuffer,
        });
    }

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
     * @fileoverview Provides default timing functions for work scheduler and the
     * timing functions shim, which uses it for TypeScript typing.
     */
    /**
     * To enhance testability, the timing functions are constructor parameters to
     * the WorkScheduler. This is exported for testing purposes, but generally
     * should not be of interest to API consumers.
     */
    const DEFAULT_TIMING_FUNCTIONS = Object.freeze({
        requestAnimationFrame: window.requestAnimationFrame.bind(window),
        cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
        setTimeout: (callbackFn, delay = 0, ...args) => {
            return window.setTimeout(callbackFn, delay, ...args);
        },
        clearTimeout: window.clearTimeout.bind(window),
        now: Date.now.bind(Date),
    });

    /**
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
    /**
     * @fileoverview This TypeScript code is based on TinySDF JavaScript library.
     *
     * In addition to providing typings, and some rearrangement of utility
     * functions, this library exposes a new function: canvasToSDFData(). This
     * function produces a Float32 array of SDF values for use with an RGB floating
     * point texture. Unlike the original TinySDF library, which only produced a
     * single channel of Uint8 precision, the canavasToSDFData() function includes
     * the vertical and horizontal components in the red and green color channels,
     * with the true 2D distance in the blue channel.
     *
     * @see https://github.com/mapbox/tiny-sdf/blob/master/index.js
     */
    const INF = 1e20;
    /**
     * This implementation mirrors the upstream index.js except using TypeScript
     * class nomenclature, and the extraction of the imgDataToAlphaChannel()
     * function.
     */
    class TinySDF {
        /**
         * @param fontSize number Size of font to render in pixels.
         * @param buffer number Padding in pixels to leave around each glyph.
         * @param radius number Thickness of SDF field around edge.
         * @param cutoff number How far from totally outside (0) to totally inside (1)
         *  of the edge to situate the alpha scale. A cutoff of 0.5 means the edge of
         *  the shape will be assigned an alpha value of 128.
         * @param fontFamily string Name of the typeface to draw.
         * @param fontWeight string Weight of the font to draw.
         */
        constructor(fontSize = 24, buffer = 3, radius = 8, cutoff = 0.25, fontFamily = 'sans-serif', fontWeight = 'normal') {
            this.fontSize = fontSize;
            this.buffer = buffer;
            this.radius = radius;
            this.cutoff = cutoff;
            this.fontFamily = fontFamily;
            this.fontWeight = fontWeight;
            const size = this.size = this.fontSize + this.buffer * 2;
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.canvas.height = size;
            this.ctx = this.canvas.getContext('2d');
            this.ctx.font =
                this.fontWeight + ' ' + this.fontSize + 'px ' + this.fontFamily;
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = 'black';
            // temporary arrays for the distance transform
            this.gridOuter = new Float64Array(size * size);
            this.gridInner = new Float64Array(size * size);
            this.f = new Float64Array(size);
            this.z = new Float64Array(size + 1);
            this.v = new Uint16Array(size);
            // hack around https://bugzilla.mozilla.org/show_bug.cgi?id=737852
            this.middle = Math.round((size / 2) * (navigator.userAgent.indexOf('Gecko/') >= 0 ? 1.2 : 1));
        }
        draw(chr) {
            this.ctx.clearRect(0, 0, this.size, this.size);
            this.ctx.fillText(chr, this.buffer, this.middle);
            const imgData = this.ctx.getImageData(0, 0, this.size, this.size);
            return imgDataToAlphaChannel(Object.assign(Object.assign({}, this), { imgData }));
        }
    }
    /**
     * Given an ImageData object retrieved from a canvas context, compute and
     * return the alpha channel as a Uint8ClampedArray.
     */
    function imgDataToAlphaChannel({ imgData, size, radius, cutoff, gridOuter, gridInner, f, v, z, }) {
        const alphaChannel = new Uint8ClampedArray(size * size);
        for (let i = 0; i < size * size; i++) {
            const a = imgData.data[i * 4 + 3] / 255; // alpha value
            gridOuter[i] = a === 1 ? 0 :
                a === 0 ? INF :
                    Math.pow(Math.max(0, 0.5 - a), 2);
            gridInner[i] = a === 1 ? INF :
                a === 0 ? 0 :
                    Math.pow(Math.max(0, a - 0.5), 2);
        }
        edt(gridOuter, size, size, f, v, z);
        edt(gridInner, size, size, f, v, z);
        for (let i = 0; i < size * size; i++) {
            const d = Math.sqrt(gridOuter[i]) - Math.sqrt(gridInner[i]);
            alphaChannel[i] = Math.round(255 - 255 * (d / radius + cutoff));
        }
        return alphaChannel;
    }
    /**
     * 2D Euclidean squared distance transform by Felzenszwalb & Huttenlocher.
     * @see https://cs.brown.edu/~pff/papers/dt-final.pdf
     */
    function edt(data, width, height, f, v, z) {
        edtY(data, width, height, f, v, z);
        edtX(data, width, height, f, v, z);
    }
    function edtX(data, width, height, f, v, z) {
        for (let y = 0; y < height; y++) {
            edt1d(data, y * width, 1, width, f, v, z);
        }
    }
    function edtY(data, width, height, f, v, z) {
        for (let x = 0; x < width; x++) {
            edt1d(data, x, width, height, f, v, z);
        }
    }
    /**
     * 1D squared distance transform.
     */
    function edt1d(grid, offset, stride, length, f, v, z) {
        let q, k, s, r;
        v[0] = 0;
        z[0] = -INF;
        z[1] = INF;
        for (q = 0; q < length; q++) {
            f[q] = grid[offset + q * stride];
        }
        for (q = 1, k = 0, s = 0; q < length; q++) {
            do {
                r = v[k];
                s = (f[q] - f[r] + q * q - r * r) / (q - r) / 2;
            } while (s <= z[k] && --k > -1);
            k++;
            v[k] = q;
            z[k] = s;
            z[k + 1] = INF;
        }
        for (q = 0, k = 0; q < length; q++) {
            while (z[k + 1] < q) {
                k++;
            }
            r = v[k];
            grid[offset + q * stride] = f[r] + (q - r) * (q - r);
        }
    }
    /**
     * Given a canvas, compute the horizontal, vertical and 2D signed distance
     * fields with floating point precision (range from -1 to 1). These values map
     * to the red, green and blue color channels of an RGB texture respectively.
     *
     * Keeping the component 1D distances (horizontal and vertical) in addition to
     * the Euclidian 2D distance allows for estimation when the field is stretched.
     */
    function canvasToSDFData(canvas, radius, cutoff = 0.5) {
        const { width, height } = canvas;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, width, height);
        const gridOuterX = new Float64Array(width * height);
        const gridInnerX = new Float64Array(width * height);
        const gridOuterY = new Float64Array(width * height);
        const gridInnerY = new Float64Array(width * height);
        const gridOuter = new Float64Array(width * height);
        const gridInner = new Float64Array(width * height);
        const f = new Float64Array(width);
        const z = new Float64Array(width + 1);
        const v = new Uint16Array(width);
        for (let i = 0; i < width * height; i++) {
            const a = imgData.data[i * 4 + 3] / 255; // alpha value
            gridOuter[i] = gridOuterY[i] = gridOuterX[i] = a === 1 ? 0 :
                a === 0 ? INF :
                    Math.pow(Math.max(0, 0.5 - a), 2);
            gridInner[i] = gridInnerY[i] = gridInnerX[i] = a === 1 ? INF :
                a === 0 ? 0 :
                    Math.pow(Math.max(0, a - 0.5), 2);
        }
        edt(gridOuter, width, height, f, v, z);
        edt(gridInner, width, height, f, v, z);
        edtX(gridOuterX, width, height, f, v, z);
        edtX(gridInnerX, width, height, f, v, z);
        edtY(gridOuterY, width, height, f, v, z);
        edtY(gridInnerY, width, height, f, v, z);
        const finalData = new Float32Array(width * height * 3.0);
        for (let i = 0; i < width * height; i++) {
            finalData[i * 3] = Math.max(0, 1 -
                ((Math.sqrt(gridOuterX[i]) - Math.sqrt(gridInnerX[i])) / radius +
                    cutoff));
            finalData[i * 3 + 1] = Math.max(0, 1 -
                ((Math.sqrt(gridOuterY[i]) - Math.sqrt(gridInnerY[i])) / radius +
                    cutoff));
            finalData[i * 3 + 2] = 1 -
                ((Math.sqrt(gridOuter[i]) - Math.sqrt(gridInner[i])) / radius + cutoff);
        }
        return finalData;
    }

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
    const DEFAULT_GLYPH_FONT_SIZE_PX = 32;
    /**
     * Default settings for a GlyphMapper instance.
     */
    const DEFAULT_GLYPH_MAPPER_SETTINGS = Object.freeze({
        /**
         * See https://webglstats.com/webgl/parameter/MAX_TEXTURE_SIZE
         */
        maxTextureSize: 2048,
        // Font size in texels (relative to texture size).
        fontSize: DEFAULT_GLYPH_FONT_SIZE_PX,
        // Padding around the glyph in texels.
        buffer: Math.ceil(DEFAULT_GLYPH_FONT_SIZE_PX / 4),
        // Radius around the glyph in texels.
        radius: DEFAULT_GLYPH_FONT_SIZE_PX,
        // How to situate the alpha scale from totally outside (0) to inside (1). This
        // default value ensures that a distance of zero coincides with the edge of
        // the glyph.
        cutoff: 0.5,
        fontFamily: 'monospace',
        fontWeight: 'normal',
    });
    /**
     * The GlyphMapper creates and manages a signed distance field (SDF) for
     * rendering characters of text. While the GlyphMapper doesn't directly manage a
     * WebGL texture, it provides the RGB values for one via a Float32 array.
     */
    class GlyphMapper {
        constructor(options = DEFAULT_GLYPH_MAPPER_SETTINGS) {
            /**
             * Internal mapping to show where each glyph is in the texture.
             */
            this.glyphToCoordinates = new Map();
            // Copy default settings plus any provided settings.
            const settings = Object.assign({}, DEFAULT_GLYPH_MAPPER_SETTINGS, options || {});
            this.maxTextureSize = settings.maxTextureSize;
            this.tinySDF = new TinySDF(settings.fontSize, settings.buffer, settings.radius, settings.cutoff, settings.fontFamily, settings.fontWeight);
            this.glyphSize = this.tinySDF.size;
            this.glyphsPerRow = Math.floor(this.maxTextureSize / this.glyphSize);
            this.glyphCapacity = this.glyphsPerRow * this.glyphsPerRow;
            this.textureSize = this.glyphsPerRow * this.glyphSize;
            this.textureData = new Float32Array(this.textureSize * this.textureSize);
        }
        /**
         * Determine of a character has already been added to the glyph map.
         */
        hasGlyph(glyph) {
            return this.glyphToCoordinates.has(glyph);
        }
        /**
         * Return a glyph if it's already been added to the glyph map.
         */
        getGlyph(glyph) {
            return this.glyphToCoordinates.get(glyph);
        }
        /**
         * Add a character to the glyph map if it's not there already then return the
         * glyph's coordinates.
         */
        addGlyph(glyph) {
            if (this.hasGlyph(glyph)) {
                return this.getGlyph(glyph);
            }
            const index = this.glyphToCoordinates.size;
            if (index >= this.glyphCapacity) {
                throw new Error('Cannot add glyph, already at capacity.');
            }
            const row = Math.floor(index / this.glyphsPerRow);
            const col = index % this.glyphsPerRow;
            // The index of the first texel of this glyph.
            const textureDataOffsetIndex = row * this.glyphSize * this.textureSize + col * this.glyphSize;
            const { canvas, ctx, size, buffer, middle, radius, cutoff, } = this.tinySDF;
            ctx.clearRect(0, 0, size, size);
            ctx.fillText(glyph, buffer, middle);
            const sdfData = canvasToSDFData(canvas, radius, cutoff);
            // TODO(jimbo): Scan for any pixel values in the -1 to 1 range.
            // Entirely empty canvases (space character) may be filled with infinities.
            for (let i = 0; i < this.glyphSize; i++) {
                for (let j = 0; j < this.glyphSize; j++) {
                    // Offset index into the sdfData array is computed by the current row
                    // (i), the current column (j) and accounting for the fact that there
                    // are three values per SDF data texel (horizontal, vertical and 2D
                    // distance).
                    const sdfDataIndex = (i * this.glyphSize + j) * 3 + 2;
                    // The index of the same value in the textureData array starts at the
                    // textureDataOffsetIndex, and then skips one full width per row, plus
                    // the offset for the current column.
                    const textureDataIndex = textureDataOffsetIndex + i * this.textureSize + j;
                    this.textureData[textureDataIndex] = sdfData[sdfDataIndex];
                }
            }
            const coordinates = {
                u: col / this.glyphsPerRow,
                v: row / this.glyphsPerRow,
                width: this.glyphSize / this.textureSize,
                height: this.glyphSize / this.textureSize,
            };
            this.glyphToCoordinates.set(glyph, coordinates);
            return coordinates;
        }
        /**
         * Retrieve a list of all glyphs currently added.
         */
        get glyphs() {
            return [...this.glyphToCoordinates.keys()];
        }
    }

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
     * Default glyph set is the printible ASCII characters from 33 to 126 (dec).
     */
    const DEFAULT_GLYPHS = '!"#$%&\'()*+,-./0123456789:;<=>?' + // ASCII 33 - 63.
        '@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_' + // ASCII 63 - 95.
        '`abcdefghijklmnopqrstuvwxyz{|}'; // ASCII 96 - 126.
    /**
     * Parameters to configure the Scene.
     */
    const DEFAULT_SCENE_SETTINGS = Object.freeze({
        /**
         * HTML element into which regl will place a drawable canvas.
         */
        container: document.body,
        /**
         * Default duration of transitions if not otherwise specified.
         */
        defaultTransitionTimeMs: 250,
        /**
         * String of characters to support in glyph mapper.
         */
        glyphs: DEFAULT_GLYPHS,
        /**
         * Desired number of sprites to be able to render. As this number could be
         * arbitrarily large, it may not be possible to satisfy given other system
         * constraints.
         */
        desiredSpriteCapacity: 1e6,
        /**
         * Timing functions for WorkScheduler.
         */
        timingFunctions: DEFAULT_TIMING_FUNCTIONS,
        /**
         * Settings for the glyph mapper.
         */
        glyphMapper: DEFAULT_GLYPH_MAPPER_SETTINGS,
    });

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
     * @fileoverview A DrawTriggerPoint object maintains an x and y coordinate pair
     * and invokes the coordinator object's queueDraw() whenever either are set.
     * Used for the offset and scale properties.
     */
    class DrawTriggerPoint {
        constructor(coordinator) {
            this.coordinator = coordinator;
            this.xValue = 0;
            this.yValue = 0;
        }
        get x() {
            return this.xValue;
        }
        set x(x) {
            this.xValue = x;
            this.coordinator.queueDraw();
        }
        get y() {
            return this.yValue;
        }
        set y(y) {
            this.yValue = y;
            this.coordinator.queueDraw();
        }
    }

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
    const InternalPropertiesSymbol = Symbol('internalProperties');
    /**
     * Symbol used by a SpriteViewImpl to access its portion of the Scene's data
     * buffer as a Float32Array DataView.
     */
    const DataViewSymbol = Symbol('dataView');
    /**
     * Symbol used by Scene to access its SceneInternal instance. Exported as a
     * symbol to allow access by the debugging demo.
     */
    const SceneInternalSymbol = Symbol('sceneInternal');

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
    class SpriteViewImpl {
        constructor(dataView) {
            this[DataViewSymbol] = dataView;
        }
        get TransitionTimeMs() {
            return this[DataViewSymbol][0];
        }
        set TransitionTimeMs(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('TransitionTimeMs cannot be NaN.');
            }
            this[DataViewSymbol][0] = attributeValue;
        }
        get PositionWorldX() {
            return this[DataViewSymbol][1];
        }
        set PositionWorldX(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('PositionWorldX cannot be NaN.');
            }
            this[DataViewSymbol][1] = attributeValue;
        }
        get PositionWorldY() {
            return this[DataViewSymbol][2];
        }
        set PositionWorldY(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('PositionWorldY cannot be NaN.');
            }
            this[DataViewSymbol][2] = attributeValue;
        }
        get SizeWorldWidth() {
            return this[DataViewSymbol][3];
        }
        set SizeWorldWidth(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('SizeWorldWidth cannot be NaN.');
            }
            this[DataViewSymbol][3] = attributeValue;
        }
        get SizeWorldHeight() {
            return this[DataViewSymbol][4];
        }
        set SizeWorldHeight(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('SizeWorldHeight cannot be NaN.');
            }
            this[DataViewSymbol][4] = attributeValue;
        }
        get GeometricZoomX() {
            return this[DataViewSymbol][5];
        }
        set GeometricZoomX(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('GeometricZoomX cannot be NaN.');
            }
            this[DataViewSymbol][5] = attributeValue;
        }
        get GeometricZoomY() {
            return this[DataViewSymbol][6];
        }
        set GeometricZoomY(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('GeometricZoomY cannot be NaN.');
            }
            this[DataViewSymbol][6] = attributeValue;
        }
        get PositionPixelX() {
            return this[DataViewSymbol][7];
        }
        set PositionPixelX(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('PositionPixelX cannot be NaN.');
            }
            this[DataViewSymbol][7] = attributeValue;
        }
        get PositionPixelY() {
            return this[DataViewSymbol][8];
        }
        set PositionPixelY(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('PositionPixelY cannot be NaN.');
            }
            this[DataViewSymbol][8] = attributeValue;
        }
        get SizePixelWidth() {
            return this[DataViewSymbol][9];
        }
        set SizePixelWidth(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('SizePixelWidth cannot be NaN.');
            }
            this[DataViewSymbol][9] = attributeValue;
        }
        get SizePixelHeight() {
            return this[DataViewSymbol][10];
        }
        set SizePixelHeight(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('SizePixelHeight cannot be NaN.');
            }
            this[DataViewSymbol][10] = attributeValue;
        }
        get MaxSizePixelWidth() {
            return this[DataViewSymbol][11];
        }
        set MaxSizePixelWidth(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('MaxSizePixelWidth cannot be NaN.');
            }
            this[DataViewSymbol][11] = attributeValue;
        }
        get MaxSizePixelHeight() {
            return this[DataViewSymbol][12];
        }
        set MaxSizePixelHeight(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('MaxSizePixelHeight cannot be NaN.');
            }
            this[DataViewSymbol][12] = attributeValue;
        }
        get MinSizePixelWidth() {
            return this[DataViewSymbol][13];
        }
        set MinSizePixelWidth(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('MinSizePixelWidth cannot be NaN.');
            }
            this[DataViewSymbol][13] = attributeValue;
        }
        get MinSizePixelHeight() {
            return this[DataViewSymbol][14];
        }
        set MinSizePixelHeight(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('MinSizePixelHeight cannot be NaN.');
            }
            this[DataViewSymbol][14] = attributeValue;
        }
        get PositionRelativeX() {
            return this[DataViewSymbol][15];
        }
        set PositionRelativeX(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('PositionRelativeX cannot be NaN.');
            }
            this[DataViewSymbol][15] = attributeValue;
        }
        get PositionRelativeY() {
            return this[DataViewSymbol][16];
        }
        set PositionRelativeY(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('PositionRelativeY cannot be NaN.');
            }
            this[DataViewSymbol][16] = attributeValue;
        }
        get Sides() {
            return this[DataViewSymbol][17];
        }
        set Sides(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('Sides cannot be NaN.');
            }
            this[DataViewSymbol][17] = attributeValue;
        }
        get ShapeTextureU() {
            return this[DataViewSymbol][18];
        }
        set ShapeTextureU(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('ShapeTextureU cannot be NaN.');
            }
            this[DataViewSymbol][18] = attributeValue;
        }
        get ShapeTextureV() {
            return this[DataViewSymbol][19];
        }
        set ShapeTextureV(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('ShapeTextureV cannot be NaN.');
            }
            this[DataViewSymbol][19] = attributeValue;
        }
        get ShapeTextureWidth() {
            return this[DataViewSymbol][20];
        }
        set ShapeTextureWidth(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('ShapeTextureWidth cannot be NaN.');
            }
            this[DataViewSymbol][20] = attributeValue;
        }
        get ShapeTextureHeight() {
            return this[DataViewSymbol][21];
        }
        set ShapeTextureHeight(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('ShapeTextureHeight cannot be NaN.');
            }
            this[DataViewSymbol][21] = attributeValue;
        }
        get BorderRadiusWorld() {
            return this[DataViewSymbol][22];
        }
        set BorderRadiusWorld(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('BorderRadiusWorld cannot be NaN.');
            }
            this[DataViewSymbol][22] = attributeValue;
        }
        get BorderRadiusPixel() {
            return this[DataViewSymbol][23];
        }
        set BorderRadiusPixel(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('BorderRadiusPixel cannot be NaN.');
            }
            this[DataViewSymbol][23] = attributeValue;
        }
        get BorderPlacement() {
            return this[DataViewSymbol][24];
        }
        set BorderPlacement(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('BorderPlacement cannot be NaN.');
            }
            this[DataViewSymbol][24] = attributeValue;
        }
        get BorderColorR() {
            return this[DataViewSymbol][25];
        }
        set BorderColorR(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('BorderColorR cannot be NaN.');
            }
            this[DataViewSymbol][25] = attributeValue;
        }
        get BorderColorG() {
            return this[DataViewSymbol][26];
        }
        set BorderColorG(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('BorderColorG cannot be NaN.');
            }
            this[DataViewSymbol][26] = attributeValue;
        }
        get BorderColorB() {
            return this[DataViewSymbol][27];
        }
        set BorderColorB(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('BorderColorB cannot be NaN.');
            }
            this[DataViewSymbol][27] = attributeValue;
        }
        get BorderColorOpacity() {
            return this[DataViewSymbol][28];
        }
        set BorderColorOpacity(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('BorderColorOpacity cannot be NaN.');
            }
            this[DataViewSymbol][28] = attributeValue;
        }
        get FillBlend() {
            return this[DataViewSymbol][29];
        }
        set FillBlend(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('FillBlend cannot be NaN.');
            }
            this[DataViewSymbol][29] = attributeValue;
        }
        get FillColorR() {
            return this[DataViewSymbol][30];
        }
        set FillColorR(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('FillColorR cannot be NaN.');
            }
            this[DataViewSymbol][30] = attributeValue;
        }
        get FillColorG() {
            return this[DataViewSymbol][31];
        }
        set FillColorG(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('FillColorG cannot be NaN.');
            }
            this[DataViewSymbol][31] = attributeValue;
        }
        get FillColorB() {
            return this[DataViewSymbol][32];
        }
        set FillColorB(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('FillColorB cannot be NaN.');
            }
            this[DataViewSymbol][32] = attributeValue;
        }
        get FillColorOpacity() {
            return this[DataViewSymbol][33];
        }
        set FillColorOpacity(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('FillColorOpacity cannot be NaN.');
            }
            this[DataViewSymbol][33] = attributeValue;
        }
        get FillTextureU() {
            return this[DataViewSymbol][34];
        }
        set FillTextureU(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('FillTextureU cannot be NaN.');
            }
            this[DataViewSymbol][34] = attributeValue;
        }
        get FillTextureV() {
            return this[DataViewSymbol][35];
        }
        set FillTextureV(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('FillTextureV cannot be NaN.');
            }
            this[DataViewSymbol][35] = attributeValue;
        }
        get FillTextureWidth() {
            return this[DataViewSymbol][36];
        }
        set FillTextureWidth(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('FillTextureWidth cannot be NaN.');
            }
            this[DataViewSymbol][36] = attributeValue;
        }
        get FillTextureHeight() {
            return this[DataViewSymbol][37];
        }
        set FillTextureHeight(attributeValue) {
            if (isNaN(attributeValue)) {
                throw new RangeError('FillTextureHeight cannot be NaN.');
            }
            this[DataViewSymbol][37] = attributeValue;
        }
        set PositionWorld(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.PositionWorldX = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.PositionWorldY = value[1];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No PositionWorld component index values were found.');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('x' in value) {
                    this.PositionWorldX = value['x'];
                    anyComponentSet = true;
                }
                if ('y' in value) {
                    this.PositionWorldY = value['y'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No PositionWorld component key values were found.');
                }
                return;
            }
            throw new TypeError('Argument must be an array or object.');
        }
        set SizeWorld(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.SizeWorldWidth = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.SizeWorldHeight = value[1];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No SizeWorld component index values were found.');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('width' in value) {
                    this.SizeWorldWidth = value['width'];
                    anyComponentSet = true;
                }
                if ('height' in value) {
                    this.SizeWorldHeight = value['height'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No SizeWorld component key values were found.');
                }
                return;
            }
            this.SizeWorldWidth = value;
            this.SizeWorldHeight = value;
        }
        set GeometricZoom(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.GeometricZoomX = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.GeometricZoomY = value[1];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No GeometricZoom component index values were found.');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('x' in value) {
                    this.GeometricZoomX = value['x'];
                    anyComponentSet = true;
                }
                if ('y' in value) {
                    this.GeometricZoomY = value['y'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No GeometricZoom component key values were found.');
                }
                return;
            }
            this.GeometricZoomX = value;
            this.GeometricZoomY = value;
        }
        set PositionPixel(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.PositionPixelX = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.PositionPixelY = value[1];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No PositionPixel component index values were found.');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('x' in value) {
                    this.PositionPixelX = value['x'];
                    anyComponentSet = true;
                }
                if ('y' in value) {
                    this.PositionPixelY = value['y'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No PositionPixel component key values were found.');
                }
                return;
            }
            throw new TypeError('Argument must be an array or object.');
        }
        set SizePixel(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.SizePixelWidth = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.SizePixelHeight = value[1];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No SizePixel component index values were found.');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('width' in value) {
                    this.SizePixelWidth = value['width'];
                    anyComponentSet = true;
                }
                if ('height' in value) {
                    this.SizePixelHeight = value['height'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No SizePixel component key values were found.');
                }
                return;
            }
            this.SizePixelWidth = value;
            this.SizePixelHeight = value;
        }
        set MaxSizePixel(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.MaxSizePixelWidth = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.MaxSizePixelHeight = value[1];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No MaxSizePixel component index values were found.');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('width' in value) {
                    this.MaxSizePixelWidth = value['width'];
                    anyComponentSet = true;
                }
                if ('height' in value) {
                    this.MaxSizePixelHeight = value['height'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No MaxSizePixel component key values were found.');
                }
                return;
            }
            this.MaxSizePixelWidth = value;
            this.MaxSizePixelHeight = value;
        }
        set MinSizePixel(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.MinSizePixelWidth = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.MinSizePixelHeight = value[1];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No MinSizePixel component index values were found.');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('width' in value) {
                    this.MinSizePixelWidth = value['width'];
                    anyComponentSet = true;
                }
                if ('height' in value) {
                    this.MinSizePixelHeight = value['height'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No MinSizePixel component key values were found.');
                }
                return;
            }
            this.MinSizePixelWidth = value;
            this.MinSizePixelHeight = value;
        }
        set PositionRelative(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.PositionRelativeX = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.PositionRelativeY = value[1];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No PositionRelative component index values were found.');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('x' in value) {
                    this.PositionRelativeX = value['x'];
                    anyComponentSet = true;
                }
                if ('y' in value) {
                    this.PositionRelativeY = value['y'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No PositionRelative component key values were found.');
                }
                return;
            }
            throw new TypeError('Argument must be an array or object.');
        }
        set ShapeTexture(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.ShapeTextureU = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.ShapeTextureV = value[1];
                    anyComponentSet = true;
                }
                if ('2' in value) {
                    this.ShapeTextureWidth = value[2];
                    anyComponentSet = true;
                }
                if ('3' in value) {
                    this.ShapeTextureHeight = value[3];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No ShapeTexture component index values were found.');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('u' in value) {
                    this.ShapeTextureU = value['u'];
                    anyComponentSet = true;
                }
                if ('v' in value) {
                    this.ShapeTextureV = value['v'];
                    anyComponentSet = true;
                }
                if ('width' in value) {
                    this.ShapeTextureWidth = value['width'];
                    anyComponentSet = true;
                }
                if ('height' in value) {
                    this.ShapeTextureHeight = value['height'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No ShapeTexture component key values were found.');
                }
                return;
            }
            throw new TypeError('Argument must be an array or object.');
        }
        set BorderColor(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.BorderColorR = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.BorderColorG = value[1];
                    anyComponentSet = true;
                }
                if ('2' in value) {
                    this.BorderColorB = value[2];
                    anyComponentSet = true;
                }
                if ('3' in value) {
                    this.BorderColorOpacity = value[3];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No BorderColor component index values were found.');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('r' in value) {
                    this.BorderColorR = value['r'];
                    anyComponentSet = true;
                }
                if ('g' in value) {
                    this.BorderColorG = value['g'];
                    anyComponentSet = true;
                }
                if ('b' in value) {
                    this.BorderColorB = value['b'];
                    anyComponentSet = true;
                }
                if ('opacity' in value) {
                    this.BorderColorOpacity = value['opacity'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No BorderColor component key values were found.');
                }
                return;
            }
            throw new TypeError('Argument must be an array or object.');
        }
        set FillColor(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.FillColorR = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.FillColorG = value[1];
                    anyComponentSet = true;
                }
                if ('2' in value) {
                    this.FillColorB = value[2];
                    anyComponentSet = true;
                }
                if ('3' in value) {
                    this.FillColorOpacity = value[3];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No FillColor component index values were found.');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('r' in value) {
                    this.FillColorR = value['r'];
                    anyComponentSet = true;
                }
                if ('g' in value) {
                    this.FillColorG = value['g'];
                    anyComponentSet = true;
                }
                if ('b' in value) {
                    this.FillColorB = value['b'];
                    anyComponentSet = true;
                }
                if ('opacity' in value) {
                    this.FillColorOpacity = value['opacity'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No FillColor component key values were found.');
                }
                return;
            }
            throw new TypeError('Argument must be an array or object.');
        }
        set FillTexture(value) {
            if (Array.isArray(value)) {
                let anyComponentSet = false;
                if ('0' in value) {
                    this.FillTextureU = value[0];
                    anyComponentSet = true;
                }
                if ('1' in value) {
                    this.FillTextureV = value[1];
                    anyComponentSet = true;
                }
                if ('2' in value) {
                    this.FillTextureWidth = value[2];
                    anyComponentSet = true;
                }
                if ('3' in value) {
                    this.FillTextureHeight = value[3];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No FillTexture component index values were found.');
                }
                return;
            }
            if (typeof value === 'object') {
                let anyComponentSet = false;
                if ('u' in value) {
                    this.FillTextureU = value['u'];
                    anyComponentSet = true;
                }
                if ('v' in value) {
                    this.FillTextureV = value['v'];
                    anyComponentSet = true;
                }
                if ('width' in value) {
                    this.FillTextureWidth = value['width'];
                    anyComponentSet = true;
                }
                if ('height' in value) {
                    this.FillTextureHeight = value['height'];
                    anyComponentSet = true;
                }
                if (!anyComponentSet) {
                    throw new TypeError('No FillTexture component key values were found.');
                }
                return;
            }
            throw new TypeError('Argument must be an array or object.');
        }
    }

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
     * implemented as a SpriteImpl. During its lifecyle, it goes through a number of
     * phases, which are defined here.
     */
    var LifecyclePhase;
    (function (LifecyclePhase) {
        /**
         * When a SpriteImpl is first created, there may not be capacity to represent
         * its data in the Scene's textures and buffers. In that case, the sprite will
         * wait in the Created phase until space is recovered from another exiting
         * sprite.
         */
        LifecyclePhase[LifecyclePhase["Created"] = 0] = "Created";
        /**
         * At rest, a SpriteImpl is not waiting for anything to happen. The values in
         * the target blob/array match those in the target texture, and there are no
         * pending callbacks.
         */
        LifecyclePhase[LifecyclePhase["Rest"] = 1] = "Rest";
        /**
         * Once the API user has set a callback, the SpriteImpl enters this state from
         * Rest.
         */
        LifecyclePhase[LifecyclePhase["HasCallback"] = 2] = "HasCallback";
        /**
         * After a callback has been run, if the arrival time (Ts) is in the future,
         * then the SpriteImpl enters this state, waiting for a rebase operation to
         * capture the instantaneous values and deltas of interpolable attributes.
         */
        LifecyclePhase[LifecyclePhase["NeedsRebase"] = 3] = "NeedsRebase";
        /**
         * In this state, the SpriteImpl is waiting for its values in the target blob/
         * array to be sync'd to the target texture. This could be because a callback
         * has been invoked, or because the sprite is being removed and zeros have
         * been set to its swatch of the target values blob/array.
         */
        LifecyclePhase[LifecyclePhase["NeedsTextureSync"] = 4] = "NeedsTextureSync";
        /**
         * Lastly, after the SpriteImpl has had zeros flashed to its swatch of the
         * target texture, the terminal lifecycle state is this one. At this point,
         * the memory that had been assigned to the SpriteImpl is recoverable by the
         * Scene to be assigned to another sprite.
         */
        LifecyclePhase[LifecyclePhase["Removed"] = 5] = "Removed";
    })(LifecyclePhase || (LifecyclePhase = {}));
    /**
     * Converts a phase transition to a unique numeric index. If the phase
     * transition is impossible, returns NaN.
     *
     * A LifecyclePhase transition is a situation where a Sprite in a particular
     * LifecyclePhase moves to a different LifecyclePhase. Since there are six
     * phases, there are 6x5=30 possible transitions. By assigning each transition a
     * numeric index, we can use bitwise arithmatic to check whether a given phase
     * transition is valid.
     */
    function transitionToFlag(fromPhase, toPhase) {
        return fromPhase === toPhase ?
            NaN :
            1 << (5 * fromPhase + toPhase - +(toPhase > fromPhase));
    }
    /**
     * Create a single integer value which enocodes all the allowed LifecyclePhase
     * transitions. This value can be AND'd with a phase transition index to test
     * for whether the transition is allowed.
     */
    function createAllowedTransitionMask() {
        const { Created, Rest, HasCallback, NeedsRebase, NeedsTextureSync, Removed, } = LifecyclePhase;
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
        // From NeedsTextureSync, once the sync has occured, the Sprite goes to
        // HasCallback if there are more callbacks to run, or to Rest, or to Removed
        // if the Sprite has been marked for removal.
        mask |= transitionToFlag(NeedsTextureSync, Rest);
        mask |= transitionToFlag(NeedsTextureSync, HasCallback);
        mask |= transitionToFlag(NeedsTextureSync, Removed);
        // There are no transitions from the Removed phase as this is terminal.
        return mask;
    }
    const ALLOWED_TRANSITION_MASK = createAllowedTransitionMask();
    /**
     * Check whether a given LifecyclePhase is allowed. If not, throw an error.
     */
    function checkLifecyclePhaseTransition(fromPhase, toPhase) {
        if (!(transitionToFlag(fromPhase, toPhase) & ALLOWED_TRANSITION_MASK)) {
            throw new Error('Illegal sprite lifecycle phase transition.');
        }
    }

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
     * @fileoverview Defines a range object for keeping track of bounds within an
     * array for batch processing purposes.
     */
    class NumericRange {
        constructor() {
            /**
             * NumericRange may be in a defined state, where bounds have numeric values.
             * Users of the range should check this property to see if the bounds are
             * defined.
             */
            this.isDefined = false;
            this.lowBound = NaN;
            this.highBound = NaN;
        }
        /**
         * Reset the range.
         */
        clear() {
            this.isDefined = false;
            this.lowBound = NaN;
            this.highBound = NaN;
        }
        /**
         * Expand either the lowBound, the highBound, or both so that the range
         * includes the provided value. This will define the range if it is not yet
         * defined.
         */
        expandToInclude(value) {
            if (!this.isDefined) {
                this.lowBound = value;
                this.highBound = value;
                this.isDefined = true;
                return;
            }
            if (value < this.lowBound) {
                this.lowBound = value;
            }
            if (value > this.highBound) {
                this.highBound = value;
            }
        }
        /**
         * Truncate the range such that its low and high bounds are both within the
         * provided values. If the current low and high bounds lie entirely outside
         * the provided values, then clear the range.
         *
         * Both the lowValue and highValue arguments are tested for validity. They
         * must be numbers, and highValue must be greater than or equal to lowValue.
         * If these conditions are not met, an error is thrown.
         *
         * If the range is not defined (isDefined == false), then calling this method
         * will have no impact on the object's internal state.
         */
        truncateToWithin(lowValue, highValue) {
            if (isNaN(+lowValue) || isNaN(+highValue)) {
                throw new Error('Both values must be numbers');
            }
            if (highValue < lowValue) {
                throw new Error('High bound must be greater than or equal to low bound.');
            }
            if (!this.isDefined) {
                return;
            }
            if (lowValue > this.highBound || highValue < this.lowBound) {
                this.clear();
                return;
            }
            if (this.lowBound < lowValue) {
                this.lowBound = lowValue;
            }
            if (this.highBound > highValue) {
                this.highBound = highValue;
            }
        }
        /**
         * Determine whether this range overlaps another given range. If either range
         * is not defined, then they do not overlap (returns false). Otherwise, this
         * method returns true if there exist any numbers which appear in both ranges.
         */
        overlaps(otherRange) {
            return this.isDefined && otherRange.isDefined &&
                this.lowBound <= otherRange.highBound &&
                this.highBound >= otherRange.lowBound;
        }
    }

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
     * @fileoverview Implements the Selection API for SceneImpl.
     */
    class SelectionImpl {
        /**
         * Create a new Selection which gets its Sprites from the provided Renderer,
         * and schedules tasks via the provided WorkScheduler.
         */
        constructor(stepsBetweenChecks, renderer, workScheduler) {
            this.stepsBetweenChecks = stepsBetweenChecks;
            this.renderer = renderer;
            this.workScheduler = workScheduler;
            this.sprites = [];
            this.boundData = [];
        }
        onBind(bindCallback) {
            this.bindCallback = bindCallback;
            return this;
        }
        onInit(initCallback) {
            this.initCallback = initCallback;
            return this;
        }
        onEnter(enterCallback) {
            this.enterCallback = enterCallback;
            return this;
        }
        onUpdate(updateCallback) {
            this.updateCallback = updateCallback;
            return this;
        }
        onExit(exitCallback) {
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
        bind(data) {
            // TODO(jimbo): Implement keyFn for non-index binding.
            // Key function signature: keyFn?: (datum: T) => string.
            // Keep track of number of steps taken during this task to break up the
            // number of times we check how much time is remaining.
            let step = 0;
            const dataLength = data.length;
            let lastEnterIndex = this.boundData.length;
            // Performs data binding for entering data while there's time remaining,
            // then returns whether there's more work to do.
            const enterTask = (remaining) => {
                while (lastEnterIndex < dataLength) {
                    step++;
                    const index = lastEnterIndex++;
                    const datum = data[index];
                    const sprite = this.renderer.createSprite();
                    this.boundData[index] = datum;
                    this.sprites[index] = sprite;
                    const { initCallback, enterCallback, bindCallback } = this;
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
            const updateTask = (remaining) => {
                while (lastUpdateIndex < updateLength) {
                    step++;
                    const index = lastUpdateIndex++;
                    const datum = data[index];
                    const sprite = this.sprites[index];
                    this.boundData[index] = datum;
                    const { updateCallback, bindCallback } = this;
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
            const exitTask = (remaining) => {
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
                    }
                    else {
                        const { exitCallback, bindCallback } = this;
                        if (exitCallback || bindCallback) {
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
            const bindingTask = {
                // Setting id to this ensures that there will be only one bindingTask
                // associated with this object at a time. If the API user calls bind()
                // again before the previous task finishes, whatever work it had been
                // doing will be dropped for the new parameters.
                id: this,
                // Perform one unit of work, starting with the enter data binding tasks,
                // then the updates, then the exits.
                callback: (remaining) => {
                    step = 0;
                    return exitTask(remaining) && updateTask(remaining) &&
                        enterTask(remaining);
                },
                // The return value of the callback indicates whether there's more to do.
                // Setting runUntilDone to true here signals that if the task cannot run
                // to completion due to time, the WorkScheduler should push it back onto
                // the end of the queue.
                runUntilDone: true,
            };
            // Use the provided WorkScheduler to schedule the task.
            this.workScheduler.scheduleUniqueTask(bindingTask);
            // Allow method call chaining.
            return this;
        }
    }

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
     * Internal properties of a SpriteImpl that are available to the Scene
     * implementation but inaccessible to upstream API consumers.
     */
    class SpriteImplProperties {
        constructor() {
            /**
             * The lifecycle phase of the Sprite. Updates to this value are NOT arbitrary.
             * Only certain transitions are acceptable. See the lifecyclePhase setter.
             */
            this.internalLifecyclePhase = LifecyclePhase.Created;
        }
        /**
         * Return whether this sprite has any pending callbacks to run.
         */
        get hasCallback() {
            return !!(this.enterCallback || this.updateCallback || this.exitCallback);
        }
        /**
         * Get the current lifecycle state.
         */
        get lifecyclePhase() {
            return this.internalLifecyclePhase;
        }
        /**
         * Set the current lifecycle state. This will enforce the lifecycle
         * transitions and throw if an illegal transition is attempted.
         */
        set lifecyclePhase(lifecyclePhase) {
            checkLifecyclePhaseTransition(this.internalLifecyclePhase, lifecyclePhase);
            this.internalLifecyclePhase = lifecyclePhase;
        }
    }

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
    class SpriteImpl {
        /**
         * Create a new Sprite in the associated Scene.
         */
        constructor(coordinator) {
            this.coordinator = coordinator;
            this[InternalPropertiesSymbol] = new SpriteImplProperties();
        }
        enter(enterCallback) {
            if (this.isAbandoned) {
                throw new Error('Cannot add enter callback to abondend sprite.');
            }
            if (this.isRemoved) {
                throw new Error('Cannot add enter callback to Removed sprite.');
            }
            const properties = this[InternalPropertiesSymbol];
            properties.enterCallback = enterCallback;
            if (properties.lifecyclePhase === LifecyclePhase.Rest) {
                this.coordinator.markSpriteCallback(properties.index);
                properties.lifecyclePhase = LifecyclePhase.HasCallback;
            }
            return this;
        }
        update(updateCallback) {
            if (this.isAbandoned) {
                throw new Error('Cannot add update callback to abandoned sprite.');
            }
            if (this.isRemoved) {
                throw new Error('Cannot add update callback to Removed sprite.');
            }
            const properties = this[InternalPropertiesSymbol];
            properties.updateCallback = updateCallback;
            if (properties.lifecyclePhase === LifecyclePhase.Rest) {
                this.coordinator.markSpriteCallback(properties.index);
                properties.lifecyclePhase = LifecyclePhase.HasCallback;
            }
            return this;
        }
        exit(exitCallback) {
            if (this.isAbandoned) {
                throw new Error('Cannot add exit callback to abandoned sprite.');
            }
            if (this.isRemoved) {
                throw new Error('Cannot add exit callback to Removed sprite.');
            }
            const properties = this[InternalPropertiesSymbol];
            properties.exitCallback = exitCallback;
            properties.toBeRemoved = true;
            if (properties.lifecyclePhase === LifecyclePhase.Rest) {
                this.coordinator.markSpriteCallback(properties.index);
                properties.lifecyclePhase = LifecyclePhase.HasCallback;
            }
            return this;
        }
        abandon() {
            if (this.isAbandoned) {
                throw new Error('Cannot abandon a Sprite already marked abandoned.');
            }
            if (this.isRemoved) {
                throw new Error('Cannot abandon a Sprite that has been removed.');
            }
            if (this.isActive) {
                throw new Error('Cannot abandon an active Sprite.');
            }
            const properties = this[InternalPropertiesSymbol];
            properties.isAbandoned = true;
            properties.enterCallback = undefined;
            properties.updateCallback = undefined;
            properties.exitCallback = undefined;
            properties.toBeRemoved = true;
            properties.lifecyclePhase = LifecyclePhase.Removed;
        }
        /**
         * Any lifecycle phase other than Created and Removed signals the Sprite is
         * active.
         */
        get isActive() {
            const lifecyclePhase = this[InternalPropertiesSymbol].lifecyclePhase;
            return lifecyclePhase !== LifecyclePhase.Created &&
                lifecyclePhase !== LifecyclePhase.Removed;
        }
        get isAbandoned() {
            return !!this[InternalPropertiesSymbol].isAbandoned;
        }
        get isRemoved() {
            return this[InternalPropertiesSymbol].lifecyclePhase ===
                LifecyclePhase.Removed;
        }
    }

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
     * Graphics cards have limited memory, and so it's possible for the API user to
     * create more sprites than are representable in the data textures. Additional
     * sprites beyond those that fit in GPU memory wait until other sprites have
     * been removed, freeing up memory. The runAssignWaiting() task assigns waiting
     * sprites to swatches that have been freed by other Removed sprites.
     *
     * @param coordinator Upstream object upon which this task operates.
     * @param remaining Function to test how much longer we can continue performing
     * operations before ceding control back to the UI thread.
     * @param stepsBetweenChecks Number of steps to perform between invocations of
     * the remaining time function. Must be a non-negative integer. Should be in the
     * 100-1000 range. Higher numbers reduce the frequency of time checks, but run
     * the risk of running too long before returning control to the UI thread
     * (laggy user experince).
     */
    function runAssignWaiting(coordinator, remaining, stepsBetweenChecks) {
        const { removedIndexRange, sprites, waitingSprites, } = coordinator;
        if (!removedIndexRange.isDefined) {
            // This indicates an error condition in which there was an assign task
            // queued but before it could run the removed index ranges were somehow
            // used up.
            throw new Error('No removed indices available to assign.');
        }
        if (!waitingSprites.length) {
            // This indicates an error condition in which there is additional capacity
            // to dequeue waiting sprites, but somehow there are no waiting sprites to
            // dequeue.
            throw new Error('No waiting sprites to assign.');
        }
        // Inside the while loop, we'll be iterating through both the removed index
        // range and the waiting sprites queue. Both of these lists contain items
        // which may not be applicable to our current task. A waiting sprite may be
        // abandoned, and the removed index range very likely contains non-removed
        // sprites. However, in no case will it ever make sense that we made no
        // progress through the waiting sprites list.
        let waitingIndex = 0;
        let removedIndex = removedIndexRange.lowBound;
        // Track number of steps to reduce calls to remaining() for time checks.
        // Starts at 1 to ensure we make at least some progress through the loop
        // before quitting to time.
        let step = 1;
        // Keep track whether we've assigned any sprites that already have a callback
        // set. If so then we'll need to queue a run callbacks task.
        let anyHasCallback = false;
        while (waitingIndex < waitingSprites.length &&
            removedIndex <= removedIndexRange.highBound) {
            // If we've made any progress and we're out of time, break.
            if (waitingIndex > 0 && step++ % stepsBetweenChecks === 0 &&
                remaining() <= 0) {
                break;
            }
            // The list of waiting sprites may contain some which have been abandoned,
            // so here we iterate until we find one that has NOT been abandoned, or we
            // run out of sprites to check. It's possible that all of the previously
            // waiting sprites have since been abandoned, and so we should allow for
            // that possibility.
            while (waitingIndex < waitingSprites.length &&
                waitingSprites[waitingIndex][InternalPropertiesSymbol].isAbandoned) {
                waitingIndex++;
            }
            if (waitingIndex >= waitingSprites.length) {
                // Ran out of potentially waiting sprites to check. This is not an error.
                // It may be that the waiting sprites at the end of the list have been
                // abandoned.
                break;
            }
            // The removedIndexRange contains all of the sprites slated for removal, but
            // very probably also includes sprites which are not removed, so here we
            // iterate until we find one that has been removed.
            while (removedIndex <= removedIndexRange.highBound &&
                !sprites[removedIndex].isRemoved) {
                removedIndex++;
            }
            if (removedIndex > removedIndexRange.highBound) {
                // This signals a bug in the removal logic. Even though the
                // removedIndexRange will often include non-removed Sprites, it should
                // never be the case that the Sprites sitting at the extents of that range
                // are not in the Removed lifecycle phase. Therefore as we iterate through
                // the range, when we get to the end, it should definitely be a removed
                // sprite whose index and swatch we can reuse.
                throw new Error('Removed index range ended on a non-removed sprite.');
            }
            // Now that we've found both a non-abandoned waiting sprite, and a removed
            // sprite, we can give the removed sprite's index (and swatch) to the
            // waiting sprite.
            const waitingSprite = waitingSprites[waitingIndex];
            const removedSprite = sprites[removedIndex];
            coordinator.assignSpriteToIndex(waitingSprite, removedSprite[InternalPropertiesSymbol].index);
            // Upgrade the waiting Sprite's phase from Rest to HasCallback if needed.
            const waitingProperties = waitingSprite[InternalPropertiesSymbol];
            if (waitingProperties.hasCallback) {
                anyHasCallback = true;
                waitingProperties.lifecyclePhase = LifecyclePhase.HasCallback;
                coordinator.callbacksIndexRange.expandToInclude(waitingProperties.index);
            }
            // Increment both the waitingIndex and the removedIndex so that the next
            // iteration of the loop starts looking beyond the current indices. If
            // either is beyond their designated ranges, the next loop will kick out.
            waitingIndex++;
            removedIndex++;
        }
        // Splice out the waiting sprites that have been assigned or skipped because
        // they were abandoned.
        waitingSprites.splice(0, waitingIndex);
        // Clear out the portion of the removed range having sprites which have had
        // their indices and swatches reassigned.
        if (removedIndex > removedIndexRange.highBound) {
            removedIndexRange.clear();
        }
        else {
            removedIndexRange.truncateToWithin(removedIndex, removedIndexRange.highBound);
        }
        if (anyHasCallback) {
            coordinator.queueRunCallbacks();
        }
        if (waitingSprites.length && removedIndexRange.isDefined) {
            coordinator.queueAssignWaiting();
        }
    }

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
     * Run callbacks for sprites that have them. May not finish due to time
     * constraints. Since this invokes callback functions provided by upstream API
     * users, great care must be taken to ensure that any errors which upstream
     * callbacks throw are made visible to the developer, but do not corrupt
     * internal state.
     *
     * @param coordinator Upstream object upon which this task operates.
     * @param remaining Function to test how much longer we can continue performing
     * operations before ceding control back to the UI thread.
     * @param stepsBetweenChecks Number of steps to perform between invocations of
     * the remaining time function.
     */
    function runCallbacks(coordinator, remaining, stepsBetweenChecks) {
        if (!coordinator.callbacksIndexRange.isDefined) {
            // This indicates a timing error in the code.
            throw new Error('Running callbacks requires a range of indices.');
        }
        // Make note of the exit index range for looping purposes.
        const { lowBound, highBound } = coordinator.callbacksIndexRange;
        // Clear the range. It will be expanded as needed.
        coordinator.callbacksIndexRange.clear();
        // Keep track of the last Sprite visited and its properties. This way we can
        // recover from a user's callback error.
        let sprite;
        let properties;
        // Keep track of whether we've encountered any sprites that will need a
        // rebase before texture sync.
        let anyNeedsRebase = false;
        // Keep track of whether we've encountered any sprites that are ready for a
        // texture sync without need for rebase.
        let anyNeedsTextureSync = false;
        // To reduce the cost of invoking this constantly, reuse the time value.
        const currentTimeMs = coordinator.elapsedTimeMs();
        // Procedure for advancing the sprite state after its callback has been
        // invoked. Defined here so that its available in both try and catch.
        const afterCallback = () => {
            if (!properties) {
                throw new Error('Attempted to re-run afterCallback steps.');
            }
            // Append the current time to the arrival time value.
            const spriteView = properties.spriteView;
            spriteView.TransitionTimeMs += currentTimeMs;
            // Make sure the the draw Ts range includes the current transition time.
            coordinator.toDrawTsRange.expandToInclude(spriteView.TransitionTimeMs);
            if (spriteView.TransitionTimeMs > currentTimeMs) {
                // If the callback set a future arrival time (Ts), then this sprite
                // needs a rebase.
                anyNeedsRebase = true;
                properties.lifecyclePhase = LifecyclePhase.NeedsRebase;
                coordinator.needsRebaseIndexRange.expandToInclude(properties.index);
            }
            else {
                // Otherwise it's ready for texture sync immediately.
                anyNeedsTextureSync = true;
                properties.lifecyclePhase = LifecyclePhase.NeedsTextureSync;
                coordinator.needsTextureSyncIndexRange.expandToInclude(properties.index);
                if (properties.toBeRemoved && !properties.hasCallback) {
                    // If this sprite is slated for removal, and it has no further
                    // callbacks to invoke, then we need to flash zeros to the float array
                    // underlying the data view since this sprite's swatches will be
                    // returned for future reuse after the next texture sync.
                    spriteView[DataViewSymbol].fill(0);
                }
            }
            // Clear loop variables to make accidental re-running of afterCallback()
            // detectable (see error above).
            sprite = undefined;
            properties = undefined;
        };
        // Keep track of the last visited index so that we can know outside the loop
        // whether we made it all the way through.
        let index = lowBound;
        try {
            // Use a step counter to determine when to check the time remaining.
            // Starting at 1 ensures we don't perform a check right away upon entering
            // the loop. We'll iterate through the loop at least once. We always want
            // to make at least some progress before breaking.
            let step = 1;
            while (index <= highBound) {
                // Check to make sure we haven't run for too long without ceding the
                // execution thread. Always make sure we've gone at least one time
                // around the loop. This check is at the top of the loop so that it's
                // invoked every time without fail to prevent runaway execution.
                if (index > lowBound && step++ % stepsBetweenChecks === 0 &&
                    remaining() <= 0) {
                    break;
                }
                sprite = coordinator.sprites[index];
                properties = sprite[InternalPropertiesSymbol];
                // Increment the index here so that it's always one more than the
                // currently visited sprite. If we've managed to visit all of the
                // sprites with callbacks, then index will end up strictly greater than
                // the value of highBound.
                index++;
                if (properties.lifecyclePhase !== LifecyclePhase.HasCallback) {
                    continue;
                }
                // Pick earliest callback to run (enter, then update, then exit).
                let callback;
                if (properties.enterCallback) {
                    callback = properties.enterCallback;
                    properties.enterCallback = undefined;
                }
                else if (properties.updateCallback) {
                    callback = properties.updateCallback;
                    properties.updateCallback = undefined;
                }
                else if (properties.exitCallback) {
                    callback = properties.exitCallback;
                    properties.exitCallback = undefined;
                }
                else {
                    // If this error occurs, it means that the sprite was in the
                    // HasCallback lifecycle phase but did not, in fact, have any
                    // callbacks. This should not be possible under normal operations
                    // and indicates a bug in the phase transition logic.
                    throw new Error('Sprite in HasCallback state missing callbacks.');
                }
                // Poke the defaultTransitionTimeMs into the spriteView arrival time.
                // This value may be updated by the callback to specify a different
                // transition duration. Whether the value is changed or not as part of
                // the callback, the value will have the elapsed time added to it so
                // that the transition completion time is in the future.
                properties.spriteView.TransitionTimeMs =
                    coordinator.defaultTransitionTimeMs;
                // Reset the step counter to force a time check at the top of the next
                // iteration through the loop.
                step = 0;
                // Invoke the callback, may error out.
                callback.call(sprite, properties.spriteView);
                // Perform after callback steps. This is duplicated in the catch
                // clause, just in case.
                afterCallback();
            }
        }
        catch (err) {
            // The most likely place for an error to have occurred is the user's
            // callback function. So here we should ensure that the after callback
            // steps are invoked.
            if (properties &&
                properties.lifecyclePhase === LifecyclePhase.HasCallback) {
                afterCallback();
            }
            // Rethrowing here will not prevent the finally block below from running.
            throw err;
        }
        finally {
            if (anyNeedsRebase) {
                coordinator.queueRebase();
            }
            if (anyNeedsTextureSync) {
                coordinator.queueTextureSync();
            }
            if (index <= highBound) {
                // We didn't finish visiting all of the sprites between the low and high
                // bounds, so we need to make sure the range includes the portion that
                // we didn't get to.
                coordinator.callbacksIndexRange.expandToInclude(index);
                coordinator.callbacksIndexRange.expandToInclude(highBound);
            }
            if (coordinator.callbacksIndexRange.isDefined) {
                // There are still more sprites with callbacks. Schedule a future task to
                // continue the work.
                coordinator.queueRunCallbacks();
            }
            if (coordinator.toDrawTsRange.isDefined) {
                coordinator.queueDraw();
            }
        }
        // We're done with this task.
        return true;
    }

    /**
     * Perform a rebase operation for all sprites in this state. This should be
     * invoked by the WorkScheduler.
     *
     * @param coordinator Upstream object upon which this task operates.
     */
    function runRebase(coordinator) {
        // Sanity check: nothing to do if there's nothing in the rebase queue.
        if (!coordinator.needsRebaseIndexRange.isDefined) {
            throw new Error('No sprites are queued for rebase.');
        }
        // For each queued sprite to rebase, copy its UV values into the
        // instanceRebaseUvValues array.
        coordinator.rebaseCount = 0;
        const { lowBound, highBound } = coordinator.needsRebaseIndexRange;
        for (let index = lowBound; index <= highBound; index++) {
            const sprite = coordinator.sprites[index];
            const properties = sprite[InternalPropertiesSymbol];
            // Skip sprites that are not waiting for a rebase.
            if (properties.lifecyclePhase !== LifecyclePhase.NeedsRebase) {
                continue;
            }
            // Update properties to match new state.
            coordinator.needsTextureSyncIndexRange.expandToInclude(index);
            properties.lifecyclePhase = LifecyclePhase.NeedsTextureSync;
            // Put instance swatch UV values to the rebase UV values array.
            coordinator.instanceRebaseUvValues[coordinator.rebaseCount * 2] =
                coordinator.instanceSwatchUvValues[index * 2];
            coordinator.instanceRebaseUvValues[coordinator.rebaseCount * 2 + 1] =
                coordinator.instanceSwatchUvValues[index * 2 + 1];
            coordinator.rebaseCount++;
        }
        if (!coordinator.rebaseCount) {
            // This signals that while the rebase index range was defined, none of the
            // sprites in that range were actually due for rebase.
            throw new Error('No sprites were found to need rebase.');
        }
        // Queue a texture sync, since that's always the next lifecycle phase for
        // any sprites that have been rebased.
        coordinator.queueTextureSync();
        // Bind the rebase UV values to the buffer.
        coordinator.instanceRebaseUvBuffer(coordinator.instanceRebaseUvValues.subarray(0, coordinator.rebaseCount * 2));
        // Render using the rebase shader. This should leave intact any swatches
        // for sprites that are not being rebased.
        coordinator.rebaseCommand();
        // Flash values back to 'input' previous texture.
        coordinator.previousValuesFramebuffer.use(() => coordinator.previousValuesTexture({ copy: true }));
        // Reset the rebase queue length since the queue has been cleared.
        coordinator.needsRebaseIndexRange.clear();
    }

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
     * This batch task looks for sprites that have been marked for removal and
     * whose arrival times have passed. Those sprites need to have their values
     * flashed to zero and to be marked for texture sync. That way, the swatch
     * that the sprite used to command can be reused for another sprite later.
     *
     * @param coordinator Upstream object upon which this task operates.
     * @param remaining Function to test how much longer we can continue performing
     * operations before ceding control back to the UI thread.
     * @param stepsBetweenChecks Number of steps to perform between invocations of
     * the remaining time function.
     */
    function runRemoval(coordinator, remaining, stepsBetweenChecks) {
        if (!coordinator.toBeRemovedIndexRange.isDefined ||
            !coordinator.toBeRemovedTsRange.isDefined) {
            // This signals an error in lifecycle phase change logic of the coordinator.
            // This method should not be invoke until there are sprites slated for
            // removal.
            throw new Error('No sprites are queued for removal.');
        }
        const currentTimeMs = coordinator.elapsedTimeMs();
        const lowTs = coordinator.toBeRemovedTsRange.lowBound;
        // Check whether any of the sprites that are marked for removal have reached
        // their target times. If not, then we queue a future removal task.
        if (currentTimeMs < lowTs) {
            coordinator.queueRemovalTask();
            return true;
        }
        let { lowBound: lowIndex, highBound: highIndex } = coordinator.toBeRemovedIndexRange;
        // Clear the removal index and ts ranges. They will be added to as needed.
        coordinator.toBeRemovedIndexRange.clear();
        coordinator.toBeRemovedTsRange.clear();
        // Keep track of the last index visited. This is outside of the try block so
        // that we have access to it in the finally block afterwards.
        let index = lowIndex;
        try {
            // Track number of steps to reduce calls to the remaining() callback.
            let step = 1;
            for (; index <= highIndex; index++) {
                // Check to make sure we have made at least one step of progress and that
                // we haven't run for too long without ceding the thread.
                if (index > lowIndex && step++ % stepsBetweenChecks === 0 &&
                    remaining() <= 0) {
                    break;
                }
                const sprite = coordinator.sprites[index];
                const properties = sprite[InternalPropertiesSymbol];
                // Skip any sprites that are not both in the Rest phase and have had
                // their 'toBeRemoved' property set (had an exit callback).
                if (!properties.toBeRemoved ||
                    properties.lifecyclePhase !== LifecyclePhase.Rest) {
                    continue;
                }
                // If the sprite's time has not yet finished, then add it back to the
                // index range. We'll reschedule another run after the loop.
                if (properties.spriteView.TransitionTimeMs > currentTimeMs) {
                    coordinator.toBeRemovedIndexRange.expandToInclude(index);
                    coordinator.toBeRemovedTsRange.expandToInclude(properties.spriteView.TransitionTimeMs);
                    continue;
                }
                // The sprite has been marked for removal, its in the right
                // LifeciclePhase, and its time has expired. Flash zeros to the sprite's
                // data view and schedule it for a texture sync.
                properties.spriteView[DataViewSymbol].fill(0);
                properties.lifecyclePhase = LifecyclePhase.NeedsTextureSync;
                coordinator.needsTextureSyncIndexRange.expandToInclude(properties.index);
            }
        }
        finally {
            if (coordinator.needsTextureSyncIndexRange.isDefined) {
                coordinator.queueTextureSync();
            }
            if (index < highIndex) {
                // Since we didn't finish the whole loop due to time, expand the index
                // range to include all the indices which were previously marked, but
                // which we didn't visit.
                coordinator.toBeRemovedIndexRange.expandToInclude(index + 1);
                coordinator.toBeRemovedIndexRange.expandToInclude(highIndex);
                // Expand the Ts range to include the timestamps of the remaining sprites.
                for (let i = index + 1; i <= highIndex; i++) {
                    const sprite = coordinator.sprites[i];
                    const properties = sprite[InternalPropertiesSymbol];
                    if (properties.toBeRemoved === true &&
                        properties.lifecyclePhase === LifecyclePhase.Rest) {
                        coordinator.toBeRemovedTsRange.expandToInclude(properties.spriteView.TransitionTimeMs);
                    }
                }
            }
            if (coordinator.toBeRemovedIndexRange.isDefined) {
                // At least one sprite wasn't ready to be removed, so requeue this task
                // to run again.
                coordinator.queueRemovalTask();
            }
        }
        return true;
    }

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
     * Given a range, return a new range that expands to the edges of the nearest
     * swatch row on both sides.
     */
    function getSwatchRowExpandedRange(inputRange, swatchesPerRow) {
        const expandedRange = new NumericRange();
        if (!inputRange.isDefined) {
            return expandedRange;
        }
        const { lowBound, highBound } = inputRange;
        const lowRow = Math.floor(lowBound / swatchesPerRow);
        const highRow = Math.floor(highBound / swatchesPerRow) + 1;
        expandedRange.expandToInclude(lowRow * swatchesPerRow);
        expandedRange.expandToInclude(highRow * swatchesPerRow - 1);
        return expandedRange;
    }
    /**
     * Iterate through the Sprites and push data into the data texture.
     */
    function runTextureSync(coordinator) {
        // Short-circuit of there are no dirty indices to update.
        if (!coordinator.needsTextureSyncIndexRange.isDefined) {
            throw new Error('No sprites are in need of texture sync.');
        }
        const { swatchesPerRow, textureWidth, valuesPerRow } = coordinator.attributeMapper;
        // Check to see if there's a collision between the block of sprites whose
        // texture data would be sync'd and sprites that are waiting for a rebase
        // operation.
        if (coordinator.needsRebaseIndexRange.isDefined) {
            const rebaseRowRange = getSwatchRowExpandedRange(coordinator.needsRebaseIndexRange, swatchesPerRow);
            const syncRowRange = getSwatchRowExpandedRange(coordinator.needsTextureSyncIndexRange, swatchesPerRow);
            if (syncRowRange.overlaps(rebaseRowRange)) {
                // Since there was a collision, the safe thing to do is schedule a
                // rebase operation, and then make another attempt at texture sync.
                coordinator.queueRebase();
                coordinator.queueTextureSync();
                return true;
            }
        }
        const { lowBound, highBound } = coordinator.needsTextureSyncIndexRange;
        const lowRow = Math.floor(lowBound / swatchesPerRow);
        const highRow = Math.floor(highBound / swatchesPerRow) + 1;
        const rowHeight = highRow - lowRow;
        const dataView = coordinator.targetValuesArray.subarray(lowRow * valuesPerRow, highRow * valuesPerRow);
        // Keep track of whether any sprites have a callback to invoke.
        let anyHasCallback = false;
        // Keep track of whether any sprites are ready to be removed.
        let anyToBeRemoved = false;
        // Use an unchanging current time reference to reduce function calls.
        const currentTimeMs = coordinator.elapsedTimeMs();
        // Since we're performing on whole rows, the bounds of this loop have to
        // cover them.
        const lowIndex = lowRow * swatchesPerRow;
        const highIndex = Math.min(highRow * swatchesPerRow - 1, coordinator.sprites.length - 1);
        for (let index = lowIndex; index <= highIndex; index++) {
            const sprite = coordinator.sprites[index];
            const properties = sprite[InternalPropertiesSymbol];
            if (properties.lifecyclePhase === LifecyclePhase.NeedsRebase) {
                // Somehow a sprite in the NeedsRebase lifecycle phase made it into this
                // loop. It would be an error to sync its values to the texture because
                // doing so would destroy the information that the rebase command needs
                // to determine the intermediate attribute values and deltas.
                throw new Error('Sprite is in the wrong lifecycle phase for sync.');
            }
            if (properties.lifecyclePhase !== LifecyclePhase.NeedsTextureSync) {
                // This sprite was a passive participant in the texture sync operation.
                // Its blob/array swatch and texture swatch were already sync'd.
                continue;
            }
            if (properties.hasCallback) {
                // If the sprite has any pending callbacks, then the correct next
                // phase is HasCallback, and we'll need to queue a run.
                anyHasCallback = true;
                properties.lifecyclePhase = LifecyclePhase.HasCallback;
                coordinator.callbacksIndexRange.expandToInclude(index);
                continue;
            }
            if (!properties.toBeRemoved) {
                // Sprite has no callbacks, but was not slated for removal, so return to
                // Rest phase and continue.
                properties.lifecyclePhase = LifecyclePhase.Rest;
                continue;
            }
            // The sprite was slated for removal. How to proceed depends on
            // whether it has more time left before its target arrival time.
            if (properties.spriteView.TransitionTimeMs <= currentTimeMs) {
                // The sprite was slated for removal, and its time has expired.
                // Return its swatch for future reuse.
                coordinator.removeSprite(sprite);
                continue;
            }
            // At this point, the sprite was slated for removal, but its time is not
            // up yet. So we return it to the Rest phase, but add it to the removal
            // ranges so that it can be revisited later.
            anyToBeRemoved = true;
            properties.lifecyclePhase = LifecyclePhase.Rest;
            coordinator.toBeRemovedIndexRange.expandToInclude(index);
            coordinator.toBeRemovedTsRange.expandToInclude(properties.spriteView.TransitionTimeMs);
        }
        if (coordinator.waitingSprites.length &&
            coordinator.removedIndexRange.isDefined) {
            coordinator.queueAssignWaiting();
        }
        if (anyHasCallback) {
            coordinator.queueRunCallbacks();
        }
        if (anyToBeRemoved) {
            coordinator.queueRemovalTask();
        }
        // By definition, we've updated all sprites that surround the low and high
        // dirty indices.
        coordinator.needsTextureSyncIndexRange.clear();
        // TODO(jimbo): 'subimage' seems to be missing from REGL texture type.
        const subimageData = {
            data: dataView,
            width: textureWidth,
            height: rowHeight,
        };
        coordinator.targetValuesTexture.subimage(subimageData, 0, lowRow);
        return true;
    }

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
     * @fileoverview Implements the TextSelection API for SceneImpl.
     */
    const DEFAULT_ALIGN_VALUE = 'center';
    const DEFAULT_VERTICAL_ALIGN_VALUE = 'middle';
    class TextSelectionImpl {
        /**
         * Create a new selection in the associated Scene.
         */
        constructor(stepsBetweenChecks, renderer, workScheduler, glyphMapper) {
            this.stepsBetweenChecks = stepsBetweenChecks;
            this.renderer = renderer;
            this.workScheduler = workScheduler;
            this.glyphMapper = glyphMapper;
            this.selections = [];
            this.boundData = [];
            this.textCallback = ((datum) => `${datum}`);
            this.alignCallback = (() => DEFAULT_ALIGN_VALUE);
            this.verticalAlignCallback = (() => DEFAULT_VERTICAL_ALIGN_VALUE);
        }
        text(textCallback) {
            this.textCallback = textCallback;
            return this;
        }
        align(alignCallback) {
            this.alignCallback = alignCallback;
            return this;
        }
        verticalAlign(verticalAlignCallback) {
            this.verticalAlignCallback = verticalAlignCallback;
            return this;
        }
        onBind(bindCallback) {
            this.bindCallback = bindCallback;
            return this;
        }
        onInit(initCallback) {
            this.initCallback = initCallback;
            return this;
        }
        onEnter(enterCallback) {
            this.enterCallback = enterCallback;
            return this;
        }
        onUpdate(updateCallback) {
            this.updateCallback = updateCallback;
            return this;
        }
        onExit(exitCallback) {
            this.exitCallback = exitCallback;
            return this;
        }
        datumToGlyphs(datum) {
            const text = (this.textCallback ? this.textCallback.call(datum, datum) : `${datum}`)
                .trim();
            const align = (this.alignCallback && this.alignCallback(datum)) ||
                DEFAULT_ALIGN_VALUE;
            const verticalAlign = (this.verticalAlignCallback && this.verticalAlignCallback(datum)) ||
                DEFAULT_VERTICAL_ALIGN_VALUE;
            const glyphs = [];
            for (let i = 0; i < text.length; i++) {
                let x;
                if (align === 'left') {
                    x = (i + 1) * .5;
                }
                else if (align === 'right') {
                    x = (i + 1 - text.length) * 0.5;
                }
                else {
                    x = (i + .75 - text.length * 0.5) * 0.5;
                }
                let y;
                if (verticalAlign === 'top') {
                    y = -0.5;
                }
                else if (verticalAlign === 'bottom') {
                    y = 0.5;
                }
                else {
                    y = 0;
                }
                const coords = this.glyphMapper.getGlyph(text.charAt(i));
                if (coords) {
                    glyphs.push({ datum, coords, position: { x, y } });
                }
            }
            return glyphs;
        }
        bind(data) {
            // Keep track of number of steps taken during this task to break up the
            // number of times we check how much time is remaining.
            let step = 0;
            const dataLength = data.length;
            let lastEnterIndex = this.boundData.length;
            // Performs enter data binding while there's time remaning, then returns
            // whether there's more work to do.
            const enterTask = (remaining) => {
                while (lastEnterIndex < dataLength) {
                    step++;
                    const index = lastEnterIndex++;
                    const datum = data[index];
                    const selection = this.renderer.createSelection();
                    this.boundData.push(datum);
                    this.selections.push(selection);
                    selection.onInit((spriteView, glyph) => {
                        if (this.initCallback) {
                            this.initCallback(spriteView, glyph.datum);
                        }
                    });
                    selection.onEnter((spriteView, glyph) => {
                        if (this.enterCallback) {
                            this.enterCallback(spriteView, glyph.datum);
                        }
                    });
                    selection.onUpdate((spriteView, glyph) => {
                        if (this.updateCallback) {
                            this.updateCallback(spriteView, glyph.datum);
                        }
                    });
                    selection.onExit((spriteView, glyph) => {
                        if (this.exitCallback) {
                            this.exitCallback(spriteView, glyph.datum);
                        }
                    });
                    selection.onBind((spriteView, glyph) => {
                        spriteView.Sides = 0;
                        spriteView.ShapeTexture = glyph.coords;
                        spriteView.PositionRelative = glyph.position;
                        if (this.bindCallback) {
                            this.bindCallback(spriteView, glyph.datum);
                        }
                    });
                    selection.bind(this.datumToGlyphs(datum));
                    if (step % this.stepsBetweenChecks === 0 && remaining() <= 0) {
                        return false;
                    }
                }
                return lastEnterIndex >= dataLength;
            };
            let lastUpdateIndex = 0;
            const updateLength = Math.min(dataLength, this.boundData.length);
            // Performs update data binding while there's time remaining, then returns
            // whether there's more work to do.
            const updateTask = (remaining) => {
                while (lastUpdateIndex < updateLength) {
                    step++;
                    const index = lastUpdateIndex++;
                    const datum = data[index];
                    const selection = this.selections[index];
                    this.boundData[index] = datum;
                    selection.bind(this.datumToGlyphs(datum));
                    if (step % this.stepsBetweenChecks === 0 && remaining() <= 0) {
                        return false;
                    }
                }
                return lastUpdateIndex >= updateLength;
            };
            // Performs exit data binding while there's time remaining, then returns
            // whether there's more work to do.
            const exitTask = (remaining) => {
                // TODO(jimbo): Instead, iterate forward through the list.
                while (dataLength < this.boundData.length) {
                    step++;
                    this.boundData.pop();
                    const selection = this.selections.pop();
                    selection.bind([]);
                    if (step % this.stepsBetweenChecks === 0 && remaining() <= 0) {
                        return false;
                    }
                }
                return dataLength >= this.boundData.length;
            };
            // Perform one unit of work, starting with any exit tasks, then updates,
            // then enter tasks. This way, previously used texture memory can be
            // recycled more quickly, keeping the area of used texture memory more
            // compact.
            const bindingTask = {
                id: this,
                callback: (remaining) => {
                    step = 0;
                    return exitTask(remaining) && updateTask(remaining) &&
                        enterTask(remaining);
                },
                runUntilDone: true,
            };
            this.workScheduler.scheduleUniqueTask(bindingTask);
            return this;
        }
    }

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
     * @fileoverview The WorkScheduler operates on WorkTasks, which are callback
     * functions plus additional identifing and state information.
     */
    /**
     * Given a WorkTask or Function, determine if it meets the minimum necessary
     * criteria for being used as a WorkTask.
     */
    function isWorkTaskOrFunction(workTaskOrFunction) {
        return !!(workTaskOrFunction &&
            (workTaskOrFunction instanceof Function ||
                workTaskOrFunction.callback instanceof Function));
    }
    /**
     * Given a WorkTask or Function, determine what its id would be as a
     * WorkTaskWithId.
     */
    function getWorkTaskId(workTaskOrFunction) {
        if (!isWorkTaskOrFunction(workTaskOrFunction)) {
            throw new Error('Provided object was not a work task or function.');
        }
        // The id of a naked Function is just the function itself.
        if (workTaskOrFunction instanceof Function) {
            return workTaskOrFunction;
        }
        // If the object has an id property, then return that.
        if (workTaskOrFunction.id !== undefined) {
            return workTaskOrFunction.id;
        }
        // The id of a WorkTask object that does not have an explicit id is its
        // callback funciton.
        return workTaskOrFunction.callback;
    }
    /**
     * Given a WorkTask or Function, create and return a WorkTask object. This
     * method will return the input parameter directly if it is a WorkTask object
     * with both 'callback' and 'id' properties. Otherwise, a new object will be
     * created and returned.
     *
     * If the input parameter is neither a WorkTask object, nor a Function, then an
     * error will be thrown.
     */
    function ensureOrCreateWorkTask(workTaskOrFunction) {
        if (!isWorkTaskOrFunction(workTaskOrFunction)) {
            throw new Error('Provided object was not a work task or function.');
        }
        // Wrap naked function in an object with the minimum required properties.
        if (workTaskOrFunction instanceof Function) {
            return {
                callback: workTaskOrFunction,
                id: workTaskOrFunction,
            };
        }
        // At this point, we know the object is a WorkTask with at least a callback.
        // If the object also has an id, then return it directly.
        if (workTaskOrFunction.id !== undefined) {
            return workTaskOrFunction;
        }
        // The incoming object had a callback property (per initial check) but no id.
        return Object.assign(Object.assign({}, workTaskOrFunction), { id: workTaskOrFunction.callback });
    }

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
     * A WorkQueue consists of an array of work tasks with Ids, and a set for
     * looking up tasks by their Id to check for existence. Any given task,
     * identified by its id, can only be in the WorkQueue once at a time. After a
     * task has been removed, it can be readded.
     */
    class WorkQueue {
        constructor() {
            /**
             * Set of WorkTask ids which are present in the task list. Maintained for
             * rapid lookup.
             */
            this.idSet = new Set();
            /**
             * List of tasks to be performed.
             */
            this.taskList = [];
        }
        /**
         * Return the length of the underlying task list.
         */
        get length() {
            return this.taskList.length;
        }
        /**
         * Return whether a WorkTask with the specified id has already been enqueued.
         */
        hasTaskId(id) {
            return this.idSet.has(id);
        }
        /**
         * Return whether a WorkTask has already been enqueued that matches the
         * provided input.
         */
        hasTask(workTaskOrFunction) {
            return this.hasTaskId(getWorkTaskId(workTaskOrFunction));
        }
        /**
         * Get the task that has the provided id.
         */
        getTaskById(id) {
            if (!this.hasTaskId(id)) {
                return undefined;
            }
            const index = this.findTaskIndexById(id);
            // Sanity check.
            if (index === -1) {
                throw new Error('Could not find matching task in task list.');
            }
            return this.taskList[index];
        }
        /**
         * Given a WorkTask or a simple callback function, push it onto the end of the
         * internal taskList unless it's already present.
         */
        enqueueTask(workTaskOrFunction) {
            // Short-circuit if this task is already queued.
            if (this.hasTask(workTaskOrFunction)) {
                return;
            }
            const workTask = ensureOrCreateWorkTask(workTaskOrFunction);
            this.idSet.add(workTask.id);
            this.taskList.push(workTask);
        }
        /**
         * Dequeue a task from the front of the task list. If no tasks remain, throw.
         */
        dequeueTask() {
            if (!this.length) {
                throw new Error('No tasks remain to dequeue.');
            }
            const task = this.taskList.shift();
            this.idSet.delete(task.id);
            return task;
        }
        /**
         * Given the id if of a WorkTask, if a matching WorkTask has been enqueued,
         * remove it and return it. Otherwise return undefined.
         */
        removeTaskById(id) {
            // Short-circuit if the task is not present in the WorkQueue's idSet.
            if (!this.hasTaskId(id)) {
                return undefined;
            }
            const index = this.findTaskIndexById(id);
            // Sanity check.
            if (index === -1) {
                throw new Error('Could not find matching task in task list.');
            }
            const [task] = this.taskList.splice(index, 1);
            this.idSet.delete(task.id);
            return task;
        }
        /**
         * Given a WorkTask or function, if a matching WorkTask has been enqueued,
         * remove it and return it. Otherwise return undefined.
         */
        removeTask(workTaskOrFunction) {
            return this.removeTaskById(getWorkTaskId(workTaskOrFunction));
        }
        /**
         * Given an id, find the index of the task in the task list with that id. If
         * no task with that id is found, return -1.
         */
        findTaskIndexById(id) {
            let index = -1;
            for (let i = 0; i < this.taskList.length; i++) {
                if (this.taskList[i].id === id) {
                    // Sanity check.
                    if (index !== -1) {
                        throw new Error('Duplicate task found in task list.');
                    }
                    index = i;
                }
            }
            return index;
        }
    }

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
     * Grab a reference to the JavaScript generator function constructor class.
     * While the Function class is available in the global/window scope, neither
     * GeneratorFunction nor AsyncFunction are available.
     */
    const GeneratorFunction = (function* () { }).constructor;
    /**
     * Default settings to control the WorkScheduler's behavior. These can be
     * overridden in the WorkScheduler constructor.
     */
    const DEFAULT_WORK_SCHEDULER_SETTINGS = Object.freeze({
        /**
         * Timing functions.
         */
        timingFunctions: DEFAULT_TIMING_FUNCTIONS,
        /**
         * Maximum amount of time in milliseconds to perform work before ceding
         * control back to the caller.
         */
        maxWorkTimeMs: 20,
        /**
         * When using setTimout() to schedule future off-screen runnable tasks, use
         * this number of milliseconds.
         */
        timeoutMs: 0,
    });
    /**
     * The WorkScheduler class handles scheduling and working on tasks.
     *
     * Because the WorkScheduler is meant to ameliorate race conditions and other
     * timing problems, it is intolerant of calling its methods out of order, or in
     * a nested fashion. For example, calling performWork() from inside a call stack
     * that already includes a call to performWork() produces an error.
     */
    class WorkScheduler {
        constructor(options = DEFAULT_WORK_SCHEDULER_SETTINGS) {
            /**
             * Flag indicating whether the WorkScheduler is currently enabled. When it is
             * enabled, then it will be scheduling callbacks and running them. While this
             * value is initialized to false here, the WorkScheduler's enable() method is
             * called during construciton, which flips this value to true.
             */
            this.isEnabled = false;
            /**
             * Flag indicating whether work is currently being performed. This is to
             * detect and prevent nested calls.
             */
            this.isPerformingWork = false;
            /**
             * Flag indicating whether work is currently being performed in the midst of
             * an animation frame. This is to detect and prevent nested calls.
             */
            this.isPerformingAnimationFrameWork = false;
            /**
             * Flag indicating whether work is currently being performed in the midst of
             * a timeout callback. This is to detect and prevent nested calls.
             */
            this.isPerformingTimoutWork = false;
            /**
             * Queue of work tasks to complete.
             */
            this.presentWorkQueue = new WorkQueue();
            /**
             * Future queue of work tasks to add to the presentWorkQueue when work is not
             * actively being performed. Tasks should be added to this list ONLY when
             * isPerformingWork is true. If isPerformingWork is false, then this array
             * should be empty, and new tasks should be pushed onto the presentWorkQueue.
             */
            this.futureWorkQueue = new WorkQueue();
            // Merge provided settings (if any) with defaults.
            const settings = Object.assign({}, DEFAULT_WORK_SCHEDULER_SETTINGS, options || {});
            // Copy timing functions.
            this.timingFunctions = Object.freeze(Object.assign({}, DEFAULT_TIMING_FUNCTIONS, (settings && settings.timingFunctions) || {}));
            // Copy other settings.
            this.maxWorkTimeMs = settings.maxWorkTimeMs;
            this.timeoutMs = settings.timeoutMs;
            // Enable the work scheduler.
            this.enable();
        }
        /**
         * Push a work task onto the work queue. The incoming object may be either a
         * full WorkTask object, or just a function. In either case, a full WorkTask
         * object with an id is returned.
         */
        scheduleTask(workTaskOrFunction) {
            // Construct a WorkTask out of the input.
            const workTask = ensureOrCreateWorkTask(workTaskOrFunction);
            // Check to make sure this task has not already been scheduled.
            if (!this.presentWorkQueue.hasTask(workTask) &&
                !this.futureWorkQueue.hasTask(workTask)) {
                if (this.isPerformingWork && !workTask.beginImmediately) {
                    // At this point we're performing work but the task is not flagged as
                    // being safe to begin immediately. So instead of modifying the
                    // presentWorkQueue directly, we need to set the task aside for later
                    // insertion.
                    this.futureWorkQueue.enqueueTask(workTask);
                }
                else {
                    // Since we're not performing work, push this task onto the present
                    // queue.
                    this.presentWorkQueue.enqueueTask(workTask);
                }
            }
            // Make sure timers are set.
            this.updateTimers();
            return workTask;
        }
        /**
         * Get the scheduled task that matches the provided workTaskOrFunction input.
         */
        getTask(workTaskOrFunction) {
            const id = getWorkTaskId(workTaskOrFunction);
            const presentTask = this.presentWorkQueue.getTaskById(id);
            const futureTask = this.futureWorkQueue.getTaskById(id);
            // Sanity check. It should not be possible for the same task to be in both
            // the present and future work queues.
            if (presentTask && futureTask) {
                throw new Error('Found two matching tasks when at most one is allowed.');
            }
            return presentTask || futureTask || undefined;
        }
        /**
         * Cancel any previously scheduled work task. Returns the task, or undefined
         * if no matching task was found.
         */
        unscheduleTask(workTaskOrFunction) {
            const id = getWorkTaskId(workTaskOrFunction);
            const presentRemovedTask = this.presentWorkQueue.removeTaskById(id);
            const futureRemovedTask = this.futureWorkQueue.removeTaskById(id);
            // Sanity check. It should not be possible for the same task to be in both
            // the present and future work queues.
            if (presentRemovedTask && futureRemovedTask) {
                throw new Error('Found two matching tasks when at most one is allowed.');
            }
            // Make sure timers are set.
            this.updateTimers();
            return presentRemovedTask || futureRemovedTask || undefined;
        }
        /**
         * Determine whether there's at least one task already queued that matches the
         * provided work task or function.
         */
        isScheduledTask(workTaskOrFunction) {
            return this.isScheduledId(getWorkTaskId(workTaskOrFunction));
        }
        /**
         * Determine whether there's a task already queued with the provided Id.
         */
        isScheduledId(id) {
            return this.presentWorkQueue.hasTaskId(id) ||
                this.futureWorkQueue.hasTaskId(id);
        }
        /**
         * Convenience method for unscheduling all matching tasks and then scheduling
         * the specified task.
         */
        scheduleUniqueTask(workTaskOrFunction) {
            const workTask = ensureOrCreateWorkTask(workTaskOrFunction);
            this.unscheduleTask(workTask);
            this.scheduleTask(workTask);
            return workTask;
        }
        /**
         * Enable the WorkScheduler to work. Returns this object for further
         * invocations.
         */
        enable() {
            this.isEnabled = true;
            this.updateTimers();
            return this;
        }
        /**
         * Disable the WorkScheduler. Returns this object for more invocations.
         */
        disable() {
            this.isEnabled = false;
            this.updateTimers();
            return this;
        }
        /**
         * Make sure timers are set if the WorkScheduler is enabled and there is work
         * to do. If the WorkScheduler is disabled, or if there is no work, then clear
         * the timers.
         */
        updateTimers() {
            const { requestAnimationFrame, cancelAnimationFrame, setTimeout, clearTimeout, } = this.timingFunctions;
            // If the WorkScheduler is disabled, or there's no work left to do, then
            // remove the outstanding timers.
            if (!this.isEnabled ||
                (!this.presentWorkQueue.length && !this.futureWorkQueue.length)) {
                if (this.animationFrameTimer !== undefined) {
                    cancelAnimationFrame(this.animationFrameTimer);
                    this.animationFrameTimer = undefined;
                }
                if (this.timeoutTimer !== undefined) {
                    clearTimeout(this.timeoutTimer);
                    this.timeoutTimer = undefined;
                }
                return;
            }
            // Since the WorkScheduler is enabled and there's work left to do, make sure
            // the timers are set up.
            if (this.animationFrameTimer === undefined) {
                const animationFrameCallback = () => {
                    if (!this.isEnabled) {
                        this.animationFrameTimer = undefined;
                        return;
                    }
                    this.animationFrameTimer =
                        requestAnimationFrame(animationFrameCallback);
                    this.performAnimationFrameWork();
                };
                this.animationFrameTimer = requestAnimationFrame(animationFrameCallback);
            }
            if (this.timeoutTimer === undefined) {
                const timeoutCallback = () => {
                    if (!this.isEnabled) {
                        this.timeoutTimer = undefined;
                        return;
                    }
                    this.timeoutTimer = setTimeout(timeoutCallback, this.timeoutMs);
                    this.performTimeoutWork();
                };
                this.timeoutTimer = setTimeout(timeoutCallback, this.timeoutMs);
            }
        }
        /**
         * Perform some scheduled work immediately.
         */
        performWork() {
            if (this.isPerformingWork) {
                throw new Error('Only one invocation of performWork is allowed at a time.');
            }
            this.isPerformingWork = true;
            const { now } = this.timingFunctions;
            // Keep track of how many tasks have been performed.
            let tasksRan = 0;
            // For performance, the try/catch block encloses the loop that runs through
            // tasks to perform.
            try {
                const startTime = now();
                const remaining = () => this.maxWorkTimeMs + startTime - now();
                while (this.presentWorkQueue.length) {
                    // If at least one task has been dequeued, and if we've run out of
                    // execution time, then break out of the loop.
                    if (tasksRan > 0 && remaining() <= 0) {
                        break;
                    }
                    let task = this.presentWorkQueue.dequeueTask();
                    if (!this.isPerformingAnimationFrameWork &&
                        (task.animationOnly === undefined || task.animationOnly)) {
                        // Unfortunately, this task is set to only run on animation frames,
                        // and we're not currently in one. Add the task to the future work
                        // queue and continue.
                        this.futureWorkQueue.enqueueTask(task);
                        continue;
                    }
                    // Immediately following this line, either the callback function will be
                    // called, or a previously created iterator will be invoked.
                    tasksRan++;
                    if (!task.iterator) {
                        const result = task.callback.call(null, remaining);
                        // Check to see if this was anything other than a generator.
                        if (task.callback.constructor !== GeneratorFunction) {
                            if (!task.runUntilDone || result) {
                                // Task was a simple callback function, nothing left to do.
                                continue;
                            }
                            // Task is not finished, so keep running it until either it finishes
                            // or we run out of time.
                            let done = result;
                            while (!done && remaining() > 0) {
                                done = task.callback.call(null, remaining);
                            }
                            if (!done) {
                                // The task did not finish! Schedule the task to continue.
                                this.futureWorkQueue.enqueueTask(task);
                            }
                            continue;
                        }
                        // Sanity check. At this point, the result value must be an iterator
                        // produced by a generator function. Had the callback been a non-
                        // generator function, then the loop would have been escaped already
                        // from within the preceding block.
                        if (!result || typeof result !== 'object' || result === null ||
                            !(result.constructor instanceof Function) ||
                            result.constructor.constructor !== GeneratorFunction) {
                            throw new Error('Generator function did not return an iterator.');
                        }
                        // Replace the task with a copy but including the iterator for future
                        // invocation.
                        const iterator = result;
                        task = Object.freeze(Object.assign(Object.assign({}, task), { iterator }));
                    }
                    // Start running down the iterator until it finishes or time runs out.
                    let done = false;
                    while (!done) {
                        done = task.iterator.next().done;
                        if (remaining() <= 0) {
                            break;
                        }
                    }
                    if (!done) {
                        // The iterator did not finish! Schedule the task for further work.
                        this.futureWorkQueue.enqueueTask(task);
                    }
                }
            }
            finally {
                this.isPerformingWork = false;
            }
            // Take any work tasks which were set aside during work and place them
            // into the queue at their correct place.
            while (this.futureWorkQueue.length) {
                const futureTask = this.futureWorkQueue.dequeueTask();
                this.scheduleTask(futureTask);
            }
        }
        /**
         * Perform work that is suitable for an animation frame.
         */
        performAnimationFrameWork() {
            if (this.isPerformingAnimationFrameWork) {
                throw new Error('Only one invocation of performAnimationFrameWork at a time.');
            }
            this.isPerformingAnimationFrameWork = true;
            try {
                this.performWork();
            }
            finally {
                this.isPerformingAnimationFrameWork = false;
            }
        }
        /**
         * Perform work that is suitable for a timeout callback.
         */
        performTimeoutWork() {
            if (this.isPerformingTimoutWork) {
                throw new Error('Only one invocation of performTimoutWork at a time.');
            }
            this.isPerformingTimoutWork = true;
            try {
                this.performWork();
            }
            finally {
                this.isPerformingTimoutWork = false;
            }
        }
    }

    /**
     * This constant controls how many steps in a loop should pass before asking the
     * WorkScheduler how much time is remaining by invoking the remaining() callback
     * function. This lets us replace a function call with a less expensive modulo
     * check in the affected loops.
     */
    const STEPS_BETWEEN_REMAINING_TIME_CHECKS = 500;
    class SceneInternal {
        constructor(params = {}) {
            /**
             * Number of screen pixels to one world unit in the X and Y dimensions. When
             * the x or y values are set, queueDraw() will be called.
             */
            this.scale = new DrawTriggerPoint(this);
            /**
             * Offset (camera) coordinates. When the x or y values are set, queueDraw()
             * will be called.
             */
            this.offset = new DrawTriggerPoint(this);
            /**
             * Collection of Sprites that have been created and have swatches
             * assigned.
             */
            this.sprites = [];
            /**
             * Collection of Sprites that have been created, but do not yet have swatches
             * assigned. These will be in the Created lifecycle phase and will not be
             * rendered until some other sprites have been Removed and their swatches
             * recycled.
             */
            this.waitingSprites = [];
            /**
             * Number of instances whose values have been flashed to the
             * targetValuesTexture. These are ready to render.
             */
            this.instanceCount = 0;
            /**
             * Low and high index range within Sprite array for sprites that may have
             * callbacks to invoke.
             */
            this.callbacksIndexRange = new NumericRange();
            /**
             * Low and high bounds within Sprite array whose values may need to be flashed
             * to targetValuesTexture.
             */
            this.needsTextureSyncIndexRange = new NumericRange();
            /**
             * Low and high bounds within Sprite array whose values may need to be
             * captured by rebase.
             */
            this.needsRebaseIndexRange = new NumericRange();
            /**
             * Low and high bounds within the sprites array that have been marked for
             * removal.
             */
            this.toBeRemovedIndexRange = new NumericRange();
            /**
             * The range of arrival times (Ts) of sprites slated for removal. This may not
             * exactly match the times of sprites to be removed, for example if a sprite
             * to be removed has changed lifecycle phases. That's OK, this is used only to
             * short-circuit the runRemoval() task in the evet that we know that no
             * sprites are due for removal.
             */
            this.toBeRemovedTsRange = new NumericRange();
            /**
             * Range of indexes in which there are sprites in the Removed lifecycle phase.
             * These slots can be recovered for use by a newly created sprite.
             */
            this.removedIndexRange = new NumericRange();
            /**
             * The range of arrival times (TransitionTimeMs) of sprites to be drawn. The
             * high bound is used to determine whether additional draw calls should be
             * queued.
             */
            this.toDrawTsRange = new NumericRange();
            /**
             * Task id to uniquely specify a call to the draw command.
             */
            this.drawTaskId = Symbol('drawTask');
            /**
             * Task id to uniquely specify a call to update the data texture.
             */
            this.textureSyncTaskId = Symbol('textureSyncTask');
            /**
             * Number of sprites whose UV values have been copied into the
             * instanceRebaseUvValues array for computation through the rebase shaders.
             */
            this.rebaseCount = 0;
            /**
             * Task id to uniquely identify the removal task.
             */
            this.runRemovalTaskId = Symbol('runRemovalTaskId');
            /**
             * Task id to uniquely identify task to assign waiting sprites to recovered
             * swatches from other removed sprites.
             */
            this.runAssignWaitingTaskId = Symbol('runAssignWaitingTask');
            /**
             * Task id to uniquely identify rebase tasks.
             */
            this.rebaseTaskId = Symbol('rebaseTask');
            /**
             * Task id to uniquely identify the runCallbacks task.
             */
            this.runCallbacksTaskId = Symbol('runCallbacksTask');
            /**
             * Task id to uniquely identify the hit test task.
             */
            this.hitTestTaskId = Symbol('hitTestTask');
            /**
             * Pixel coordinates relative to the container to perform the hit test.
             */
            this.hitTestParameters = {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                inclusive: true,
            };
            // Set up settings based on incoming parameters.
            const settings = Object.assign({}, DEFAULT_SCENE_SETTINGS, params || {});
            const timingFunctions = Object.assign({}, DEFAULT_SCENE_SETTINGS.timingFunctions, settings.timingFunctions || {});
            // Set up the elapsedTimeMs() method.
            const { now } = timingFunctions;
            this.basisTs = now();
            this.elapsedTimeMs = () => now() - this.basisTs;
            // Set up work scheduler to use timing functions.
            this.workScheduler = new WorkScheduler({ timingFunctions });
            this.container = settings.container;
            this.defaultTransitionTimeMs = settings.defaultTransitionTimeMs;
            // Take note of the container element's children before Regl inserts its
            // canvas.
            const previousChildren = new Set(Array.from(this.container.children));
            // Look for either the REGL module or createREGL global since both are
            // supported. The latter is for hot-loading the standalone Regl JS file.
            const win = window;
            const createREGL = (win['REGL'] || win['createREGL']) || regl;
            if (!createREGL) {
                throw new Error('Could not find REGL.');
            }
            const regl$1 = this.regl = createREGL({
                container: this.container,
                extensions: [
                    'angle_instanced_arrays',
                    'EXT_blend_minmax',
                    'OES_texture_float',
                    'OES_texture_float_linear',
                ],
            });
            const insertedChildren = Array.from(this.container.children).filter(child => {
                return child instanceof HTMLCanvasElement &&
                    !previousChildren.has(child);
            });
            if (!insertedChildren.length) {
                throw new Error('Container is missing an inserted canvas.');
            }
            this.canvas = insertedChildren[0];
            // Initialize scale and offset to put world 0,0 in the center.
            // TODO(jimbo): Confirm initial scale/offset for all device pixel ratios.
            const { width, height } = this.canvas.getBoundingClientRect();
            const defaultScale = Math.min(width, height) || Math.max(width, height) ||
                Math.min(window.innerWidth, window.innerHeight);
            this.scale.x = defaultScale;
            this.scale.y = defaultScale;
            this.offset.x = width / 2;
            this.offset.y = height / 2;
            // The attribute mapper is responsible for keeping track of how to shuttle
            // data between the Sprite state representation, and data values in channels
            // in the data textures.
            const attributeMapper = this.attributeMapper = new AttributeMapper({
                maxTextureSize: regl$1.limits.maxTextureSize,
                desiredSwatchCapacity: settings.desiredSpriteCapacity,
                dataChannelCount: 4,
            });
            // The previousValuesFramebuffer is written to by the rebase command and
            // read from by other Regl commands.
            this.previousValuesFramebuffer = regl$1.framebuffer({
                color: regl$1.texture({
                    width: attributeMapper.textureWidth,
                    height: attributeMapper.textureHeight,
                    channels: attributeMapper.dataChannelCount,
                    type: 'float32',
                    mag: 'nearest',
                    min: 'nearest',
                }),
                depthStencil: false,
            });
            // The previousValuesTexture contains the same data as the
            // previousValuesFramebuffer, but after a delay. It is used as the input to
            // the rebase command.
            this.previousValuesTexture = regl$1.texture({
                width: attributeMapper.textureWidth,
                height: attributeMapper.textureHeight,
                channels: attributeMapper.dataChannelCount,
                type: 'float32',
                mag: 'nearest',
                min: 'nearest',
            });
            this.targetValuesArray = new Float32Array(attributeMapper.totalValues);
            // Ultimately, to render the sprites, the GPU needs to be able to access the
            // data, and so it is flashed over to a texture. This texture is written to
            // only by the CPU via subimage write calls, and read from by the GPU.
            this.targetValuesTexture = regl$1.texture({
                width: attributeMapper.textureWidth,
                height: attributeMapper.textureHeight,
                channels: attributeMapper.dataChannelCount,
                data: this.targetValuesArray,
                type: 'float32',
                mag: 'nearest',
                min: 'nearest',
            });
            // Instance swatch UV values are used to index into previous, target and
            // rebase textures.
            this.instanceSwatchUvValues =
                attributeMapper.generateInstanceSwatchUvValues();
            this.instanceIndexValues = new Float32Array(attributeMapper.totalSwatches);
            for (let i = 0; i < attributeMapper.totalSwatches; i++) {
                this.instanceIndexValues[i] = i;
            }
            // Set up an attribute mapper for the output of the hit test shader.
            const hitTestAttributeMapper = this.hitTestAttributeMapper =
                new AttributeMapper({
                    maxTextureSize: regl$1.limits.maxTextureSize,
                    desiredSwatchCapacity: attributeMapper.totalSwatches,
                    dataChannelCount: 4,
                    attributes: [
                        { attributeName: 'Hit' },
                    ],
                });
            // The instance hit test UVs point to the places in the hit test texture
            // where the output of the test is written.
            this.instanceHitTestUvValues =
                this.hitTestAttributeMapper.generateInstanceSwatchUvValues();
            // The hitTestValuesFramebuffer is written to by the hit test command and
            // read from by sampling.
            this.hitTestValuesFramebuffer = regl$1.framebuffer({
                color: regl$1.texture({
                    width: hitTestAttributeMapper.textureWidth,
                    height: hitTestAttributeMapper.textureHeight,
                    channels: hitTestAttributeMapper.dataChannelCount,
                    type: 'uint8',
                    mag: 'nearest',
                    min: 'nearest',
                }),
                depthStencil: false,
            });
            this.hitTestValues = new Uint8Array(hitTestAttributeMapper.dataChannelCount *
                hitTestAttributeMapper.totalSwatches);
            this.glyphMapper = new GlyphMapper(settings.glyphMapper);
            for (const glyph of settings.glyphs.split('')) {
                this.glyphMapper.addGlyph(glyph);
            }
            // TODO(jimbo): Handle additions to glyphMapper dynamically.
            this.sdfTexture = regl$1.texture({
                height: this.glyphMapper.textureSize,
                width: this.glyphMapper.textureSize,
                min: 'linear',
                mag: 'linear',
                wrap: 'clamp',
                data: this.glyphMapper.textureData,
                format: 'luminance',
                type: 'float32',
            });
            this.instanceSwatchUvBuffer = this.regl.buffer(this.instanceSwatchUvValues);
            this.instanceIndexBuffer = this.regl.buffer(this.instanceIndexValues);
            this.instanceHitTestUvBuffer =
                this.regl.buffer(this.instanceHitTestUvValues);
            // Rebase UV array is long enough to accomodate all sprites, but usually it
            // won't have this many.
            this.instanceRebaseUvValues =
                new Float32Array(this.instanceSwatchUvValues.length);
            this.instanceRebaseUvBuffer = this.regl.buffer({
                usage: 'dynamic',
                type: 'float',
                data: this.instanceRebaseUvValues,
            });
            this.drawCommand = setupDrawCommand(this);
            this.rebaseCommand = setupRebaseCommand(this);
            this.hitTestCommand = setupHitTestCommand(this);
            this.queueDraw();
        }
        /**
         * Schedule a hit test (if one is not already scheduled) and return a Promise
         * that will be resolved with the results. Only one hit test can be scheduled
         * at a time, so if there is one scheduled already, all we do here is
         * overwrite the parameters so that when the hit test runs, it reports based
         * on the most recent coordinates.
         */
        hitTest(x, y, width = 0, height = 0, inclusive = true) {
            this.hitTestParameters.x = x;
            this.hitTestParameters.y = y;
            this.hitTestParameters.width = width;
            this.hitTestParameters.height = height;
            this.hitTestParameters.inclusive = inclusive;
            // If a promise already exists, return that. Only the last hitTest's
            // coordinates will be tested.
            if (this.hitTestPromise) {
                return this.hitTestPromise;
            }
            // Set up the hit test promise and capture its callback functions.
            let hitTestCallbacks;
            this.hitTestPromise = new Promise((resolve, reject) => {
                hitTestCallbacks = { resolve, reject };
            });
            // Set up the hit test task to be scheduled by WorkScheduler.
            const hitTestTask = {
                id: this.hitTestTaskId,
                callback: () => {
                    try {
                        const result = this.performHitTest();
                        hitTestCallbacks.resolve(result);
                    }
                    catch (err) {
                        hitTestCallbacks.reject(err);
                    }
                    finally {
                        delete this.hitTestPromise;
                    }
                }
            };
            // Set up cancellation procedure.
            this.hitTestPromise.cancel = () => {
                this.workScheduler.unscheduleTask(hitTestTask);
                delete this.hitTestPromise;
                hitTestCallbacks.reject(new Error('HitTest Cancelled.'));
            };
            // Schedule a hit test which will resolve the promise.
            this.workScheduler.scheduleUniqueTask(hitTestTask);
            return this.hitTestPromise;
        }
        performHitTest() {
            this.hitTestCommand();
            // TODO(jimbo): This read takes 50+ ms for 200k sprites. Speed up!
            this.regl.read({
                x: 0,
                y: 0,
                width: this.hitTestAttributeMapper.textureWidth,
                height: this.hitTestAttributeMapper.textureHeight,
                data: this.hitTestValues,
                framebuffer: this.hitTestValuesFramebuffer,
            });
            const hits = [];
            for (let index = 0; index < this.instanceCount; index++) {
                if (this.hitTestValues[index * 4] > 0) {
                    const sprite = this.sprites[index];
                    const properties = sprite[InternalPropertiesSymbol];
                    if (properties.lifecyclePhase !== LifecyclePhase.Removed) {
                        hits.push(this.sprites[index]);
                    }
                }
            }
            return {
                parameters: this.hitTestParameters,
                hits,
            };
        }
        doDraw() {
            const currentTimeMs = this.elapsedTimeMs();
            try {
                this.drawCommand();
            }
            finally {
                this.toDrawTsRange.truncateToWithin(currentTimeMs, Infinity);
                if (this.toDrawTsRange.isDefined) {
                    this.queueDraw(false);
                }
            }
        }
        queueDraw(beginImmediately = true) {
            this.queueTask(this.drawTaskId, () => this.doDraw(), beginImmediately);
        }
        /**
         * Get a snapshot of the canvas by drawing to it then immediately asking for
         * the canvas to convert it to a blob.
         */
        snapshot() {
            return __awaiter(this, void 0, void 0, function* () {
                this.drawCommand();
                return new Promise((resolve, reject) => {
                    this.canvas.toBlob(blob => blob ? resolve(blob) : reject(blob));
                });
            });
        }
        /**
         * View matrix converts world units into view (pixel) coordinates.
         */
        getViewMatrix() {
            return [
                // Column 0.
                4 * this.scale.x,
                0,
                0,
                // Column 1.
                0,
                -4 * this.scale.y,
                0,
                // Column 2.
                4 * this.offset.x,
                4 * this.offset.y,
                1,
            ];
        }
        /**
         * Scale is derived from viewMatrix properties to obviate division in the
         * vertex shader.
         */
        getViewMatrixScale() {
            return [
                4 * this.scale.x,
                4 * this.scale.y,
                .25 / this.scale.x,
                .25 / this.scale.y,
            ];
        }
        /**
         * Projection matrix converts view (pixel) coordinates into clip space.
         */
        getProjectionMatrix({ viewportWidth, viewportHeight }) {
            return [
                // Column 0.
                1 / viewportWidth,
                0,
                0,
                // Column 1.
                0,
                -1 / viewportHeight,
                0,
                // Column 2.
                -1,
                1,
                1,
            ];
        }
        /**
         * This method returns the next available index for a newly created sprite. If
         * all available capacity is already in use, then this returns undefined. If
         * there are any recoverable indices, the lowest one will be returned, and the
         * range of removed indexes will be updated to reflect that. If there is
         * capacity, and there are no removed sprites to recover, then this method
         * will return the next available index.
         */
        getNextIndex() {
            if (!this.removedIndexRange.isDefined) {
                return this.sprites.length < this.attributeMapper.totalSwatches ?
                    this.sprites.length :
                    undefined;
            }
            // Scan the removed index range for the next available index and return it.
            const { lowBound, highBound } = this.removedIndexRange;
            for (let index = lowBound; index <= highBound; index++) {
                const sprite = this.sprites[index];
                const properties = sprite[InternalPropertiesSymbol];
                if (properties.lifecyclePhase !== LifecyclePhase.Removed) {
                    continue;
                }
                // Found a removed sprite. Truncate the removed index range and return.
                if (index === highBound) {
                    this.removedIndexRange.clear();
                }
                else {
                    this.removedIndexRange.truncateToWithin(index + 1, highBound);
                }
                return index;
            }
            // This signals a state maintenance bug. Somehow the removed index range
            // expanded to cover a range in which there are no removed sprites.
            throw new Error('No removed sprites found in removed index range.');
        }
        createSprite() {
            const sprite = Object.seal(new SpriteImpl(this));
            if (this.waitingSprites.length > 0 ||
                (!this.removedIndexRange.isDefined &&
                    this.sprites.length >= this.attributeMapper.totalSwatches)) {
                // Either there are already sprites queued and waiting, or there is
                // insufficient swatch capacity remaining. Either way, we need to add this
                // one to the queue.
                this.waitingSprites.push(sprite);
            }
            else {
                // Since there's available capacity, assign this sprite to the next
                // available index.
                this.assignSpriteToIndex(sprite, this.getNextIndex());
            }
            return sprite;
        }
        /**
         * Assign the provided sprite to the corresponding index.
         */
        assignSpriteToIndex(sprite, index) {
            const properties = sprite[InternalPropertiesSymbol];
            if (properties.lifecyclePhase !== LifecyclePhase.Created) {
                // This error indicates a bug in the logic handling Created (waiting)
                // sprites. Only Sprites which have never been assigned indices should be
                // considered for assignment.
                throw new Error('Only sprites in the Created phase can be assigned indices');
            }
            const { valuesPerSwatch } = this.attributeMapper;
            const dataView = this.targetValuesArray.subarray(index * valuesPerSwatch, (index + 1) * valuesPerSwatch);
            // TODO(jimbo): This should never contain non-zero data. Consider Error?
            // Flash zeros into the dataView just in case (should be a no-op).
            dataView.fill(0);
            properties.lifecyclePhase = LifecyclePhase.Rest;
            properties.index = index;
            properties.spriteView = Object.seal(new SpriteViewImpl(dataView));
            this.sprites[index] = sprite;
            if (this.instanceCount <= index + 1) {
                this.instanceCount = index + 1;
            }
        }
        markSpriteCallback(index) {
            this.callbacksIndexRange.expandToInclude(index);
            this.queueRunCallbacks();
        }
        /**
         * Cleanup associated with removing a sprite.
         */
        removeSprite(sprite) {
            if (sprite.isRemoved) {
                throw new Error('Sprite can be removed only once.');
            }
            const properties = sprite[InternalPropertiesSymbol];
            if (properties.index === this.instanceCount - 1) {
                // In the case where the removed sprite happens to be the one at the end
                // of the list, decrement the instance count to compensate. In any other
                // case, the degenerate sprite will be left alone, having had zeros
                // flashed to its swatches.
                this.instanceCount--;
            }
            properties.lifecyclePhase = LifecyclePhase.Removed;
            properties.spriteView[DataViewSymbol] = undefined;
            this.removedIndexRange.expandToInclude(properties.index);
        }
        /**
         * Helper method to queue a run method.
         */
        queueTask(taskId, runMethod, beginImmediately = false) {
            if (!this.workScheduler.isScheduledId(taskId)) {
                this.workScheduler.scheduleTask({
                    id: taskId,
                    callback: runMethod.bind(this),
                    beginImmediately,
                });
            }
        }
        queueRebase() {
            this.queueTask(this.rebaseTaskId, () => runRebase(this));
        }
        /**
         * This method schedules runAssignWaiting to be invoked if it isn't already.
         */
        queueAssignWaiting() {
            this.queueTask(this.runAssignWaitingTaskId, this.runAssignWaiting);
        }
        /**
         * Use available swatch capacity to take waiting sprites out of the queue.
         */
        runAssignWaiting(remaining) {
            return runAssignWaiting(this, remaining, STEPS_BETWEEN_REMAINING_TIME_CHECKS);
        }
        /**
         * This method schedules runCallbacks to be invoked if it isn't already.
         */
        queueRunCallbacks() {
            this.queueTask(this.runCallbacksTaskId, this.runCallbacks);
        }
        /**
         * Method to run callbacks for sprites that have them. This should be invoked
         * by the WorkScheduler.
         */
        runCallbacks(remaining) {
            return runCallbacks(this, remaining, STEPS_BETWEEN_REMAINING_TIME_CHECKS);
        }
        /**
         * This method schedules a task to remove sprites that have been marked for
         * removal.
         */
        queueRemovalTask() {
            this.queueTask(this.runRemovalTaskId, this.runRemoval);
        }
        /**
         * This batch task looks for sprites that have been marked for removal and
         * whose arrival times have passed. Those sprites need to have their values
         * flashed to zero and to be marked for texture sync. That way, the swatch
         * that the sprite used to command can be reused for another sprite later.
         */
        runRemoval(remaining) {
            return runRemoval(this, remaining, STEPS_BETWEEN_REMAINING_TIME_CHECKS);
        }
        queueTextureSync() {
            this.queueTask(this.textureSyncTaskId, () => runTextureSync(this));
        }
        createSelection() {
            return new SelectionImpl(STEPS_BETWEEN_REMAINING_TIME_CHECKS, this, this.workScheduler);
        }
        createTextSelection() {
            return new TextSelectionImpl(STEPS_BETWEEN_REMAINING_TIME_CHECKS, this, this.workScheduler, this.glyphMapper);
        }
    }

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
    class Scene {
        constructor(params = {}) {
            this[SceneInternalSymbol] = new SceneInternal(params);
        }
        /**
         * The scale object offers an interface to set the X and Y scale of the
         * rendered world. These numbers define how many pixel units there are to a
         * world unit in the X and Y directions to implement zooming.
         */
        get scale() {
            return this[SceneInternalSymbol].scale;
        }
        /**
         * The offset object offers an interface to set the X and Y offsets of the
         * rendered scene. These numbers define how many pixel units to shift in the X
         * and Y directions to implement panning.
         */
        get offset() {
            return this[SceneInternalSymbol].offset;
        }
        /**
         * Canvas element that the renderer uses to draw.
         */
        get canvas() {
            return this[SceneInternalSymbol].canvas;
        }
        /**
         * This method returns the total elapsed time in milliseconds since the
         * renderer was constructed. Using regular JavaScript timestamps (milliseconds
         * since the Unix epoch) is not feasible because the values need to preserve
         * millisecond precision when cast as Float32 to be used in WebGL.
         */
        elapsedTimeMs() {
            return this[SceneInternalSymbol].elapsedTimeMs();
        }
        /**
         * Create and return a new Sprite. If the Renderer is already above capacity,
         * the Sprite may not be renderable.
         */
        createSprite() {
            return this[SceneInternalSymbol].createSprite();
        }
        /**
         * Given a pair of mouse coordinates relative to the drawable container,
         * determine which Sprites' bounding boxes intersect that point and return
         * them. If multiple hit tests are in flight simultaneously, the same promise
         * may be returned and only the final specified set of coordinates will be
         * used.
         */
        hitTest(x, y, width = 0, height = 0, inclusive = true) {
            return this[SceneInternalSymbol].hitTest(x, y, width, height, inclusive);
        }
        /**
         * Provide a Selection object for mapping data points to sprites.
         */
        createSelection() {
            return this[SceneInternalSymbol].createSelection();
        }
        /**
         * Provide a TextSelection object for mapping data points to text strings as
         * represented by a sequence of glyphs.
         */
        createTextSelection() {
            return this[SceneInternalSymbol].createTextSelection();
        }
    }

    exports.Scene = Scene;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=megaplot-v0.1.1.bundle.es2015.js.map
