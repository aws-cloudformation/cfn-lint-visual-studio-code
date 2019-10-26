import * as fs from 'fs';
import * as _ from 'lodash';

import { YamlMap, YamlNode } from './yaml-locator';

export enum StringComparison {
	Ordinal,
	OrdinalIgnoreCase
}

// test whether two strings are equal ignore case
export function equalIgnoreCase(a: string, b: string): boolean {
	return _.isString(a) && _.isString(b) && a.toLowerCase() === b.toLowerCase();
}

// Get the string value of key in a yaml mapping node(parsed by node-yaml-parser)
// eg: on the following yaml, this method will return 'value1' for key 'key1'
//
//      key1: value1
//      key2: value2
//
export function getYamlMappingValue(mapRootNode: YamlMap, key: string,
	ignoreCase: StringComparison = StringComparison.Ordinal): string | undefined {
	// TODO, unwrap quotes
	if (!key) {
		return undefined;
	}
	const keyValueItem = mapRootNode.mappings.find((mapping) => mapping.key &&
		(ignoreCase === StringComparison.OrdinalIgnoreCase ? key === mapping.key.raw : equalIgnoreCase(key, mapping.key.raw)));
	return keyValueItem ? keyValueItem.value.raw : undefined;
}

// Get the string value of key in a yaml mapping node(parsed by node-yaml-parser)
// eg: on the following yaml, this method will return 'value1' for key 'key1'
//
//      key1: value1
//      key2: value2
//
export function getYamlMappingNode(mapRootNode: YamlMap, key: string,
	ignoreCase: StringComparison = StringComparison.Ordinal): YamlNode | undefined {
	// TODO, unwrap quotes
	if (!key) {
		return undefined;
	}
	const keyValueItem = mapRootNode.mappings.find((mapping) => mapping.key &&
		(ignoreCase === StringComparison.OrdinalIgnoreCase ? key === mapping.key.raw : equalIgnoreCase(key, mapping.key.raw)));
	return keyValueItem ? keyValueItem.value : undefined;
}


/**
 * Load json data from a json file.
 * @param {string} file
 * @returns the parsed data if no error occurs, otherwise undefined is returned
 */
export function loadJson(file: string): any {
	if (fs.existsSync(file)) {
		try {
			return JSON.parse(fs.readFileSync(file, 'utf-8'));
		} catch (err) {
			// ignore
		}
	}
	return undefined;
}