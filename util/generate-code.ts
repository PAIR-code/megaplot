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
 * @fileoverview This script generates TypeScript code for setting attributes of
 * sprites based on the sprite-attributes definition.
 */

import * as fs from 'fs';
import * as path from 'path';

import {AttributeMapper} from '../src/lib/attribute-mapper';
import {SpriteAttribute} from '../src/lib/sprite-attributes';

/**
 * Utility function for whitespace formatting an array of lines of code.
 */
function codeFormat(lines: string[], joiner = '') {
  return lines.join(joiner).replace(/^\s+/, '');
}

const attributeMapper = new AttributeMapper({
  maxTextureSize: Infinity,
  desiredSwatchCapacity: 1,
});

const outputDir = path.resolve(__dirname, '../src/lib/generated');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const LICENSE = `/**
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
 */`;

const AS_NUM = ' as unknown as number';

/**
 * For an attribute that has components, generate the compound type for
 * destructuring assignment in setters. For example, the SizeWorld attribute
 * has X and Y components and is broadcastable. Its generated setter type would
 * be "(number[] | {x?: number; y?: number;} | number)".
 */
function generateSetterType(attribute: SpriteAttribute) {
  if (!attribute.components) {
    throw new TypeError('Attribute must have components for compound setter');
  }

  const componentTypes = attribute.components.map((component) => {
    return `${component.toLowerCase()}?: number;`;
  });

  const valueTypes = ['number[]', `{${componentTypes.join(' ')}}`];

  if (attribute.isBroadcastable) {
    valueTypes.push('number');
  }

  return `(${valueTypes.join(' | ')})`;
}

/**
 * Generate the SpriteView interface and return the code contents.
 */
function generateSpriteViewCode() {
  const outputHeader = `${LICENSE}
/**
 * @fileoverview GENERATED CODE FOR DEFINING A SPRITE VIEW.
 */

export interface SpriteView {
`;

  const output: string[] = [];

  const accessibleComponents = attributeMapper.attributeComponentNames.filter(
      attributeComponentName => !attributeComponentName.endsWith('Delta'));
  output.push(...accessibleComponents.map(
      (attributeComponentName) => `  ${attributeComponentName}: number;`));

  for (const attribute of attributeMapper.attributes) {
    if (!attribute.components) {
      continue;
    }
    const setterType = generateSetterType(attribute);
    output.push(`  ${attribute.attributeName}: ${setterType};`);
  }

  const outputFooter = `
}`;

  // Combine output lines and trim trailing whitespace.
  const outputBody = output.join('\n').replace(/^\s+$/gm, '');

  return `${outputHeader}${outputBody}${outputFooter}`;
}

/**
 * Generate the SpriteViewImpl class and return the code contents.
 */
function generateSpriteViewImplCode() {
  const outputHeader = `${LICENSE}
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
`;

  const output: string[] = [];

  // Generate a getter and setter for each accessible attribute component.
  for (let i = 0; i < attributeMapper.attributeComponentNames.length; i++) {
    const attributeComponentName = attributeMapper.attributeComponentNames[i];

    // Do not generate getters and setters for *Delta components, which ought to
    // be only accessible internally by the Rebase shader.
    if (attributeComponentName.endsWith('Delta')) {
      continue;
    }

    output.push(`
  get ${attributeComponentName}(): number {
    return this[DataViewSymbol][${i}];
  }

  set ${attributeComponentName}(attributeValue: number) {
    if (isNaN(attributeValue)) {
      throw new RangeError('${attributeComponentName} cannot be NaN');
    }
    this[DataViewSymbol][${i}] = attributeValue;
  }`);
  }

  // Generate destructuring setters for attributes with components.
  for (const attribute of attributeMapper.attributes) {
    if (!attribute.components) {
      continue;
    }

    const {attributeName} = attribute;

    const components = attribute.components.map((component, i) => {
      return {component, lower: component.toLowerCase(), i};
    });

    const setComponentsByIndex = codeFormat(components.map(({component, i}) => `
      if ('${i}' in value) {
        this.${attributeName}${component} = value[${i}]${AS_NUM};
        anyComponentSet = true;
      }`));

    const setComponentsByName =
        codeFormat(components.map(({component, lower}) => `
      if ('${lower}' in value) {
        this.${attributeName}${component} = value['${lower}']${AS_NUM};
        anyComponentSet = true;
      }`));

    const broadcastClause = codeFormat(components.map(({component}) => `
    this.${attributeName}${component} = value;`));

    const typeErrorClause = `throw new TypeError('${
        attributeName} setter argument must be an array or object');`;

    const broadcastOrTypeError =
        attribute.isBroadcastable ? broadcastClause : typeErrorClause;

    output.push(`
  set ${attributeName}(value: ${generateSetterType(attribute)}) {
    if (Array.isArray(value)) {
      let anyComponentSet = false;
      ${setComponentsByIndex}
      if (!anyComponentSet) {
        throw new TypeError(
            'No ${attributeName} component index values were found');
      }
      return;
    }

    if (typeof value === 'object') {
      let anyComponentSet = false;
      ${setComponentsByName}
      if (!anyComponentSet) {
        throw new TypeError(
            'No ${attributeName} component key values were found');
      }
      return;
    }

    ${broadcastOrTypeError}
  }`);
  }

  const outputFooter = `
}`;

  // Combine output lines and trim trailing whitespace.
  const outputBody = output.join('\n').replace(/^\s+$/gm, '');

  return `${outputHeader}${outputBody}${outputFooter}`;
}

// Generate SpriteView.
fs.writeFileSync(
    path.join(outputDir, 'sprite-view.d.ts'),
    generateSpriteViewCode(),
);

// Generate SpriteViewImpl.
fs.writeFileSync(
    path.join(outputDir, 'sprite-view-impl.ts'),
    generateSpriteViewImplCode(),
);
