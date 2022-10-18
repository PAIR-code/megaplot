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
 * @fileoverview GENERATED CODE FOR DEFINING A SPRITE VIEW.
 */

export interface SpriteView {
  TransitionTimeMs: number;
  PositionWorldX: number;
  PositionWorldY: number;
  SizeWorldWidth: number;
  SizeWorldHeight: number;
  OrderZ: number;
  GeometricZoomX: number;
  GeometricZoomY: number;
  PositionPixelX: number;
  PositionPixelY: number;
  SizePixelWidth: number;
  SizePixelHeight: number;
  MaxSizePixelWidth: number;
  MaxSizePixelHeight: number;
  MinSizePixelWidth: number;
  MinSizePixelHeight: number;
  PositionRelativeX: number;
  PositionRelativeY: number;
  Sides: number;
  ShapeTextureU: number;
  ShapeTextureV: number;
  ShapeTextureWidth: number;
  ShapeTextureHeight: number;
  BorderRadiusPixel: number;
  BorderRadiusRelative: number;
  BorderPlacement: number;
  BorderColorR: number;
  BorderColorG: number;
  BorderColorB: number;
  BorderColorOpacity: number;
  FillColorR: number;
  FillColorG: number;
  FillColorB: number;
  FillColorOpacity: number;
  PositionWorld: (number[] | {x?: number; y?: number;});
  SizeWorld: (number[] | {width?: number; height?: number;} | number);
  GeometricZoom: (number[] | {x?: number; y?: number;} | number);
  PositionPixel: (number[] | {x?: number; y?: number;});
  SizePixel: (number[] | {width?: number; height?: number;} | number);
  MaxSizePixel: (number[] | {width?: number; height?: number;} | number);
  MinSizePixel: (number[] | {width?: number; height?: number;} | number);
  PositionRelative: (number[] | {x?: number; y?: number;});
  ShapeTexture: (number[] | {u?: number; v?: number; width?: number; height?: number;});
  BorderColor: (number[] | {r?: number; g?: number; b?: number; opacity?: number;});
  FillColor: (number[] | {r?: number; g?: number; b?: number; opacity?: number;});
}