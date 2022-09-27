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
 * @fileoverview Integration test for rendering glyphs of text.
 */

import {Scene} from '../src/lib/scene';
import {SceneInternalSymbol} from '../src/lib/symbols';
import {TimingFunctionsShim} from '../src/lib/timing-functions-shim';

import {blobToImage, compareColorArrays, copyCanvasAndContainer, createArticle, createSection, filledColorArray} from './utils';

/**
 * Tests produce visible artifacts for debugging.
 */
const article = createArticle();
document.body.appendChild(article);

describe('glyph', () => {
  it('should render a glyph of text', async () => {
    // Create a <section> for storing visible artifacts.
    const {section, content} = createSection('glyph');
    article.appendChild(section);

    // Create a container <div> of fixed size for the Scene to render into.
    const container = document.createElement('div');
    container.style.width = '40px';
    container.style.height = '40px';
    content.appendChild(container);

    const timingFunctionsShim = new TimingFunctionsShim();
    timingFunctionsShim.totalElapsedTimeMs = 1000;

    // For testing purposes, the glyph we render is a solid square character,
    // Unicode code point U+25A0.
    const scene = new Scene({
      container,
      defaultTransitionTimeMs: 0,
      desiredSpriteCapacity: 1,
      glyphs: `\u25a0`,  // Black Square.
      timingFunctions: timingFunctionsShim,
    });

    const glyphMapper = scene[SceneInternalSymbol].glyphMapper;
    const glyphs = glyphMapper.glyphs;

    const glyph = glyphs[0];
    const coords = glyphMapper.getGlyph(glyph);

    if (!coords) {
      throw new Error('Coordinates for glyph could not be found');
    }

    const sprite = scene.createSprite();

    // Give the Sprite an enter() callback to invoke.
    sprite.enter((s) => {
      s.PositionWorld = [.15, 0];
      s.SizeWorld = 1;

      // Shape should sample from SDF.
      s.Sides = 0;
      s.ShapeTexture = coords;

      // Border should be equal to size of sprite, entirely outside.
      s.BorderPlacement = 1;
      s.BorderRadiusRelative = 1;

      // Blue border, yellow fill.
      s.BorderColor = [0, 0, 255, 1];
      s.FillColor = [255, 255, 0, 1];
    });

    timingFunctionsShim.runAnimationFrameCallbacks(4);

    // Now, if we inspect the canvas, its pixels should show that the sprite
    // has been rendered. Start my making a copy of the canvas and for
    // inspection.
    const {canvas} = scene;
    const [copy, ctx, copyContainer] = copyCanvasAndContainer(canvas);
    content.appendChild(copyContainer);

    // Grab a snapshot of the Scene's rendered pixels and draw them to
    // the canvas copy.
    const blob = await scene[SceneInternalSymbol].snapshot();
    const img = await blobToImage(blob);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // For integration testing, we'll sample an area of the output that's 10%
    // the width and height of the canvas size. This patch is a middle-ground
    // between testing the whole image for pixel-perfect rendering and testing
    // a single pixel.
    const sampleWidth = Math.ceil(copy.width * .1);
    const sampleHeight = Math.ceil(copy.width * .1);
    const pixelCount = sampleWidth * sampleHeight;

    // Generate patches of solid green and magenta to compare to the rendered
    // pixels for correctness.
    const solidBlue = filledColorArray(pixelCount, [0, 0, 255, 255]);
    const solidYellow = filledColorArray(pixelCount, [255, 255, 0, 255]);

    // Take a sample of the top left corner and compare it to the expected
    // solid green patch.
    const topLeftSample = ctx.getImageData(
        0,
        0,
        sampleWidth,
        sampleHeight,
    );
    expect(compareColorArrays(topLeftSample.data, solidBlue)).toEqual(1);

    // Take a sample of the bottom right corner and compare it to the expected
    // solid green patch.
    const bottomRightSample = ctx.getImageData(
        Math.floor(copy.width - sampleWidth),
        Math.floor(copy.height - sampleHeight),
        sampleWidth,
        sampleHeight,
    );
    expect(compareColorArrays(bottomRightSample.data, solidBlue)).toEqual(1);

    // Lastly, sample a chunk of the middle of the image and compare it to the
    // solid magenta patch.
    const centerSample = ctx.getImageData(
        Math.floor(copy.width * .5 - sampleWidth * .5),
        Math.floor(copy.height * .5 - sampleHeight * .5),
        sampleWidth,
        sampleHeight,
    );
    expect(compareColorArrays(centerSample.data, solidYellow)).toEqual(1);

    scene[SceneInternalSymbol].regl.destroy();
  });
});
