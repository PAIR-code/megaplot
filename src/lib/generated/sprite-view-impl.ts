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
 * @fileoverview GENERATED CODE FOR SETTING SPRITE ATTRIBUTES.
 */

import {DataViewSymbol} from '../symbols';

import {SpriteView} from './sprite-view';

export class SpriteViewImpl implements SpriteView {
  public[DataViewSymbol]: Float32Array;

  constructor(dataView: Float32Array) {
    this[DataViewSymbol] = dataView;
  }

  get TransitionTimeMs(): number {
    return this[DataViewSymbol][0];
  }

  set TransitionTimeMs(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('TransitionTimeMs cannot be NaN.');
    }
    this[DataViewSymbol][0] = attributeValue;
  }

  get PositionWorldX(): number {
    return this[DataViewSymbol][1];
  }

  set PositionWorldX(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('PositionWorldX cannot be NaN.');
    }
    this[DataViewSymbol][1] = attributeValue;
  }

  get PositionWorldY(): number {
    return this[DataViewSymbol][2];
  }

  set PositionWorldY(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('PositionWorldY cannot be NaN.');
    }
    this[DataViewSymbol][2] = attributeValue;
  }

  get SizeWorldWidth(): number {
    return this[DataViewSymbol][3];
  }

  set SizeWorldWidth(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('SizeWorldWidth cannot be NaN.');
    }
    this[DataViewSymbol][3] = attributeValue;
  }

  get SizeWorldHeight(): number {
    return this[DataViewSymbol][4];
  }

  set SizeWorldHeight(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('SizeWorldHeight cannot be NaN.');
    }
    this[DataViewSymbol][4] = attributeValue;
  }

  get GeometricZoomX(): number {
    return this[DataViewSymbol][5];
  }

  set GeometricZoomX(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('GeometricZoomX cannot be NaN.');
    }
    this[DataViewSymbol][5] = attributeValue;
  }

  get GeometricZoomY(): number {
    return this[DataViewSymbol][6];
  }

  set GeometricZoomY(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('GeometricZoomY cannot be NaN.');
    }
    this[DataViewSymbol][6] = attributeValue;
  }

  get PositionPixelX(): number {
    return this[DataViewSymbol][7];
  }

  set PositionPixelX(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('PositionPixelX cannot be NaN.');
    }
    this[DataViewSymbol][7] = attributeValue;
  }

  get PositionPixelY(): number {
    return this[DataViewSymbol][8];
  }

  set PositionPixelY(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('PositionPixelY cannot be NaN.');
    }
    this[DataViewSymbol][8] = attributeValue;
  }

  get SizePixelWidth(): number {
    return this[DataViewSymbol][9];
  }

  set SizePixelWidth(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('SizePixelWidth cannot be NaN.');
    }
    this[DataViewSymbol][9] = attributeValue;
  }

  get SizePixelHeight(): number {
    return this[DataViewSymbol][10];
  }

  set SizePixelHeight(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('SizePixelHeight cannot be NaN.');
    }
    this[DataViewSymbol][10] = attributeValue;
  }

  get MaxSizePixelWidth(): number {
    return this[DataViewSymbol][11];
  }

  set MaxSizePixelWidth(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('MaxSizePixelWidth cannot be NaN.');
    }
    this[DataViewSymbol][11] = attributeValue;
  }

  get MaxSizePixelHeight(): number {
    return this[DataViewSymbol][12];
  }

  set MaxSizePixelHeight(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('MaxSizePixelHeight cannot be NaN.');
    }
    this[DataViewSymbol][12] = attributeValue;
  }

  get MinSizePixelWidth(): number {
    return this[DataViewSymbol][13];
  }

  set MinSizePixelWidth(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('MinSizePixelWidth cannot be NaN.');
    }
    this[DataViewSymbol][13] = attributeValue;
  }

  get MinSizePixelHeight(): number {
    return this[DataViewSymbol][14];
  }

  set MinSizePixelHeight(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('MinSizePixelHeight cannot be NaN.');
    }
    this[DataViewSymbol][14] = attributeValue;
  }

  get PositionRelativeX(): number {
    return this[DataViewSymbol][15];
  }

  set PositionRelativeX(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('PositionRelativeX cannot be NaN.');
    }
    this[DataViewSymbol][15] = attributeValue;
  }

  get PositionRelativeY(): number {
    return this[DataViewSymbol][16];
  }

  set PositionRelativeY(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('PositionRelativeY cannot be NaN.');
    }
    this[DataViewSymbol][16] = attributeValue;
  }

  get Sides(): number {
    return this[DataViewSymbol][17];
  }

  set Sides(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('Sides cannot be NaN.');
    }
    this[DataViewSymbol][17] = attributeValue;
  }

  get ShapeTextureU(): number {
    return this[DataViewSymbol][18];
  }

  set ShapeTextureU(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('ShapeTextureU cannot be NaN.');
    }
    this[DataViewSymbol][18] = attributeValue;
  }

  get ShapeTextureV(): number {
    return this[DataViewSymbol][19];
  }

  set ShapeTextureV(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('ShapeTextureV cannot be NaN.');
    }
    this[DataViewSymbol][19] = attributeValue;
  }

  get ShapeTextureWidth(): number {
    return this[DataViewSymbol][20];
  }

  set ShapeTextureWidth(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('ShapeTextureWidth cannot be NaN.');
    }
    this[DataViewSymbol][20] = attributeValue;
  }

  get ShapeTextureHeight(): number {
    return this[DataViewSymbol][21];
  }

  set ShapeTextureHeight(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('ShapeTextureHeight cannot be NaN.');
    }
    this[DataViewSymbol][21] = attributeValue;
  }

  get BorderRadiusWorld(): number {
    return this[DataViewSymbol][22];
  }

  set BorderRadiusWorld(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('BorderRadiusWorld cannot be NaN.');
    }
    this[DataViewSymbol][22] = attributeValue;
  }

  get BorderRadiusPixel(): number {
    return this[DataViewSymbol][23];
  }

  set BorderRadiusPixel(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('BorderRadiusPixel cannot be NaN.');
    }
    this[DataViewSymbol][23] = attributeValue;
  }

  get BorderPlacement(): number {
    return this[DataViewSymbol][24];
  }

  set BorderPlacement(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('BorderPlacement cannot be NaN.');
    }
    this[DataViewSymbol][24] = attributeValue;
  }

  get BorderColorR(): number {
    return this[DataViewSymbol][25];
  }

  set BorderColorR(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('BorderColorR cannot be NaN.');
    }
    this[DataViewSymbol][25] = attributeValue;
  }

  get BorderColorG(): number {
    return this[DataViewSymbol][26];
  }

  set BorderColorG(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('BorderColorG cannot be NaN.');
    }
    this[DataViewSymbol][26] = attributeValue;
  }

  get BorderColorB(): number {
    return this[DataViewSymbol][27];
  }

  set BorderColorB(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('BorderColorB cannot be NaN.');
    }
    this[DataViewSymbol][27] = attributeValue;
  }

  get BorderColorOpacity(): number {
    return this[DataViewSymbol][28];
  }

  set BorderColorOpacity(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('BorderColorOpacity cannot be NaN.');
    }
    this[DataViewSymbol][28] = attributeValue;
  }

  get FillBlend(): number {
    return this[DataViewSymbol][29];
  }

  set FillBlend(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('FillBlend cannot be NaN.');
    }
    this[DataViewSymbol][29] = attributeValue;
  }

  get FillColorR(): number {
    return this[DataViewSymbol][30];
  }

  set FillColorR(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('FillColorR cannot be NaN.');
    }
    this[DataViewSymbol][30] = attributeValue;
  }

  get FillColorG(): number {
    return this[DataViewSymbol][31];
  }

  set FillColorG(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('FillColorG cannot be NaN.');
    }
    this[DataViewSymbol][31] = attributeValue;
  }

  get FillColorB(): number {
    return this[DataViewSymbol][32];
  }

  set FillColorB(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('FillColorB cannot be NaN.');
    }
    this[DataViewSymbol][32] = attributeValue;
  }

  get FillColorOpacity(): number {
    return this[DataViewSymbol][33];
  }

  set FillColorOpacity(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('FillColorOpacity cannot be NaN.');
    }
    this[DataViewSymbol][33] = attributeValue;
  }

  get FillTextureU(): number {
    return this[DataViewSymbol][34];
  }

  set FillTextureU(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('FillTextureU cannot be NaN.');
    }
    this[DataViewSymbol][34] = attributeValue;
  }

  get FillTextureV(): number {
    return this[DataViewSymbol][35];
  }

  set FillTextureV(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('FillTextureV cannot be NaN.');
    }
    this[DataViewSymbol][35] = attributeValue;
  }

  get FillTextureWidth(): number {
    return this[DataViewSymbol][36];
  }

  set FillTextureWidth(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('FillTextureWidth cannot be NaN.');
    }
    this[DataViewSymbol][36] = attributeValue;
  }

  get FillTextureHeight(): number {
    return this[DataViewSymbol][37];
  }

  set FillTextureHeight(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('FillTextureHeight cannot be NaN.');
    }
    this[DataViewSymbol][37] = attributeValue;
  }

  set PositionWorld(value: (number[] | {x?: number; y?: number;})) {
    if (Array.isArray(value)) {
      let anyComponentSet = false;
      if ('0' in value) {
        this.PositionWorldX = value[0]!;
        anyComponentSet = true;
      }
      if ('1' in value) {
        this.PositionWorldY = value[1]!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No PositionWorld component index values were found.');
      }
      return;
    }

    if (typeof value === 'object') {
      let anyComponentSet = false;
      if ('x' in value) {
        this.PositionWorldX = value['x']!;
        anyComponentSet = true;
      }
      if ('y' in value) {
        this.PositionWorldY = value['y']!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No PositionWorld component key values were found.');
      }
      return;
    }

    throw new TypeError('Argument must be an array or object.');
  }

  set SizeWorld(value: (number[] | {width?: number; height?: number;} | number)) {
    if (Array.isArray(value)) {
      let anyComponentSet = false;
      if ('0' in value) {
        this.SizeWorldWidth = value[0]!;
        anyComponentSet = true;
      }
      if ('1' in value) {
        this.SizeWorldHeight = value[1]!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No SizeWorld component index values were found.');
      }
      return;
    }

    if (typeof value === 'object') {
      let anyComponentSet = false;
      if ('width' in value) {
        this.SizeWorldWidth = value['width']!;
        anyComponentSet = true;
      }
      if ('height' in value) {
        this.SizeWorldHeight = value['height']!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No SizeWorld component key values were found.');
      }
      return;
    }

    this.SizeWorldWidth = value;
    this.SizeWorldHeight = value;
  }

  set GeometricZoom(value: (number[] | {x?: number; y?: number;} | number)) {
    if (Array.isArray(value)) {
      let anyComponentSet = false;
      if ('0' in value) {
        this.GeometricZoomX = value[0]!;
        anyComponentSet = true;
      }
      if ('1' in value) {
        this.GeometricZoomY = value[1]!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No GeometricZoom component index values were found.');
      }
      return;
    }

    if (typeof value === 'object') {
      let anyComponentSet = false;
      if ('x' in value) {
        this.GeometricZoomX = value['x']!;
        anyComponentSet = true;
      }
      if ('y' in value) {
        this.GeometricZoomY = value['y']!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No GeometricZoom component key values were found.');
      }
      return;
    }

    this.GeometricZoomX = value;
    this.GeometricZoomY = value;
  }

  set PositionPixel(value: (number[] | {x?: number; y?: number;})) {
    if (Array.isArray(value)) {
      let anyComponentSet = false;
      if ('0' in value) {
        this.PositionPixelX = value[0]!;
        anyComponentSet = true;
      }
      if ('1' in value) {
        this.PositionPixelY = value[1]!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No PositionPixel component index values were found.');
      }
      return;
    }

    if (typeof value === 'object') {
      let anyComponentSet = false;
      if ('x' in value) {
        this.PositionPixelX = value['x']!;
        anyComponentSet = true;
      }
      if ('y' in value) {
        this.PositionPixelY = value['y']!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No PositionPixel component key values were found.');
      }
      return;
    }

    throw new TypeError('Argument must be an array or object.');
  }

  set SizePixel(value: (number[] | {width?: number; height?: number;} | number)) {
    if (Array.isArray(value)) {
      let anyComponentSet = false;
      if ('0' in value) {
        this.SizePixelWidth = value[0]!;
        anyComponentSet = true;
      }
      if ('1' in value) {
        this.SizePixelHeight = value[1]!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No SizePixel component index values were found.');
      }
      return;
    }

    if (typeof value === 'object') {
      let anyComponentSet = false;
      if ('width' in value) {
        this.SizePixelWidth = value['width']!;
        anyComponentSet = true;
      }
      if ('height' in value) {
        this.SizePixelHeight = value['height']!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No SizePixel component key values were found.');
      }
      return;
    }

    this.SizePixelWidth = value;
    this.SizePixelHeight = value;
  }

  set MaxSizePixel(value: (number[] | {width?: number; height?: number;} | number)) {
    if (Array.isArray(value)) {
      let anyComponentSet = false;
      if ('0' in value) {
        this.MaxSizePixelWidth = value[0]!;
        anyComponentSet = true;
      }
      if ('1' in value) {
        this.MaxSizePixelHeight = value[1]!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No MaxSizePixel component index values were found.');
      }
      return;
    }

    if (typeof value === 'object') {
      let anyComponentSet = false;
      if ('width' in value) {
        this.MaxSizePixelWidth = value['width']!;
        anyComponentSet = true;
      }
      if ('height' in value) {
        this.MaxSizePixelHeight = value['height']!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No MaxSizePixel component key values were found.');
      }
      return;
    }

    this.MaxSizePixelWidth = value;
    this.MaxSizePixelHeight = value;
  }

  set MinSizePixel(value: (number[] | {width?: number; height?: number;} | number)) {
    if (Array.isArray(value)) {
      let anyComponentSet = false;
      if ('0' in value) {
        this.MinSizePixelWidth = value[0]!;
        anyComponentSet = true;
      }
      if ('1' in value) {
        this.MinSizePixelHeight = value[1]!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No MinSizePixel component index values were found.');
      }
      return;
    }

    if (typeof value === 'object') {
      let anyComponentSet = false;
      if ('width' in value) {
        this.MinSizePixelWidth = value['width']!;
        anyComponentSet = true;
      }
      if ('height' in value) {
        this.MinSizePixelHeight = value['height']!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No MinSizePixel component key values were found.');
      }
      return;
    }

    this.MinSizePixelWidth = value;
    this.MinSizePixelHeight = value;
  }

  set PositionRelative(value: (number[] | {x?: number; y?: number;})) {
    if (Array.isArray(value)) {
      let anyComponentSet = false;
      if ('0' in value) {
        this.PositionRelativeX = value[0]!;
        anyComponentSet = true;
      }
      if ('1' in value) {
        this.PositionRelativeY = value[1]!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No PositionRelative component index values were found.');
      }
      return;
    }

    if (typeof value === 'object') {
      let anyComponentSet = false;
      if ('x' in value) {
        this.PositionRelativeX = value['x']!;
        anyComponentSet = true;
      }
      if ('y' in value) {
        this.PositionRelativeY = value['y']!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No PositionRelative component key values were found.');
      }
      return;
    }

    throw new TypeError('Argument must be an array or object.');
  }

  set ShapeTexture(value: (number[] | {u?: number; v?: number; width?: number; height?: number;})) {
    if (Array.isArray(value)) {
      let anyComponentSet = false;
      if ('0' in value) {
        this.ShapeTextureU = value[0]!;
        anyComponentSet = true;
      }
      if ('1' in value) {
        this.ShapeTextureV = value[1]!;
        anyComponentSet = true;
      }
      if ('2' in value) {
        this.ShapeTextureWidth = value[2]!;
        anyComponentSet = true;
      }
      if ('3' in value) {
        this.ShapeTextureHeight = value[3]!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No ShapeTexture component index values were found.');
      }
      return;
    }

    if (typeof value === 'object') {
      let anyComponentSet = false;
      if ('u' in value) {
        this.ShapeTextureU = value['u']!;
        anyComponentSet = true;
      }
      if ('v' in value) {
        this.ShapeTextureV = value['v']!;
        anyComponentSet = true;
      }
      if ('width' in value) {
        this.ShapeTextureWidth = value['width']!;
        anyComponentSet = true;
      }
      if ('height' in value) {
        this.ShapeTextureHeight = value['height']!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No ShapeTexture component key values were found.');
      }
      return;
    }

    throw new TypeError('Argument must be an array or object.');
  }

  set BorderColor(value: (number[] | {r?: number; g?: number; b?: number; opacity?: number;})) {
    if (Array.isArray(value)) {
      let anyComponentSet = false;
      if ('0' in value) {
        this.BorderColorR = value[0]!;
        anyComponentSet = true;
      }
      if ('1' in value) {
        this.BorderColorG = value[1]!;
        anyComponentSet = true;
      }
      if ('2' in value) {
        this.BorderColorB = value[2]!;
        anyComponentSet = true;
      }
      if ('3' in value) {
        this.BorderColorOpacity = value[3]!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No BorderColor component index values were found.');
      }
      return;
    }

    if (typeof value === 'object') {
      let anyComponentSet = false;
      if ('r' in value) {
        this.BorderColorR = value['r']!;
        anyComponentSet = true;
      }
      if ('g' in value) {
        this.BorderColorG = value['g']!;
        anyComponentSet = true;
      }
      if ('b' in value) {
        this.BorderColorB = value['b']!;
        anyComponentSet = true;
      }
      if ('opacity' in value) {
        this.BorderColorOpacity = value['opacity']!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No BorderColor component key values were found.');
      }
      return;
    }

    throw new TypeError('Argument must be an array or object.');
  }

  set FillColor(value: (number[] | {r?: number; g?: number; b?: number; opacity?: number;})) {
    if (Array.isArray(value)) {
      let anyComponentSet = false;
      if ('0' in value) {
        this.FillColorR = value[0]!;
        anyComponentSet = true;
      }
      if ('1' in value) {
        this.FillColorG = value[1]!;
        anyComponentSet = true;
      }
      if ('2' in value) {
        this.FillColorB = value[2]!;
        anyComponentSet = true;
      }
      if ('3' in value) {
        this.FillColorOpacity = value[3]!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No FillColor component index values were found.');
      }
      return;
    }

    if (typeof value === 'object') {
      let anyComponentSet = false;
      if ('r' in value) {
        this.FillColorR = value['r']!;
        anyComponentSet = true;
      }
      if ('g' in value) {
        this.FillColorG = value['g']!;
        anyComponentSet = true;
      }
      if ('b' in value) {
        this.FillColorB = value['b']!;
        anyComponentSet = true;
      }
      if ('opacity' in value) {
        this.FillColorOpacity = value['opacity']!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No FillColor component key values were found.');
      }
      return;
    }

    throw new TypeError('Argument must be an array or object.');
  }

  set FillTexture(value: (number[] | {u?: number; v?: number; width?: number; height?: number;})) {
    if (Array.isArray(value)) {
      let anyComponentSet = false;
      if ('0' in value) {
        this.FillTextureU = value[0]!;
        anyComponentSet = true;
      }
      if ('1' in value) {
        this.FillTextureV = value[1]!;
        anyComponentSet = true;
      }
      if ('2' in value) {
        this.FillTextureWidth = value[2]!;
        anyComponentSet = true;
      }
      if ('3' in value) {
        this.FillTextureHeight = value[3]!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No FillTexture component index values were found.');
      }
      return;
    }

    if (typeof value === 'object') {
      let anyComponentSet = false;
      if ('u' in value) {
        this.FillTextureU = value['u']!;
        anyComponentSet = true;
      }
      if ('v' in value) {
        this.FillTextureV = value['v']!;
        anyComponentSet = true;
      }
      if ('width' in value) {
        this.FillTextureWidth = value['width']!;
        anyComponentSet = true;
      }
      if ('height' in value) {
        this.FillTextureHeight = value['height']!;
        anyComponentSet = true;
      }
      if (!anyComponentSet) {
        throw new TypeError(
            'No FillTexture component key values were found.');
      }
      return;
    }

    throw new TypeError('Argument must be an array or object.');
  }
}