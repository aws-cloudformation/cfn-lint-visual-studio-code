#!/usr/bin/env node
/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License").
You may not use this file except in compliance with the License.
A copy of the License is located at

	http://www.apache.org/licenses/LICENSE-2.0

or in the "license" file accompanying this file. This file is distributed
on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied. See the License for the specific language governing
permissions and limitations under the License.
*/

import { TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CustomFormatterOptions } from 'yaml-language-server';
import { SettingsState as YamlSettingsState } from 'yaml-language-server/out/server/src/yamlSettings';

// code adopted from https://github.com/redhat-developer/yaml-language-server/blob/main/src/yamlSettings.ts

// Client settings interface to grab settings relevant for the language server
export interface Settings {
	cfnLint: {
		path: string;
		appendRules: Array<string>;
		ignoreRules: Array<string>;
		overrideSpecPath: string;
		hover: boolean;
		completion: boolean;
		validate: boolean;
		format: CustomFormatterOptions;
	};

	vscodeEditor: {
		detectIndentation: boolean;
	};
	files: {
		associations: Map<string, string>;
	};
}

// This class is responsible for handling all the settings
export class SettingsState extends YamlSettingsState {

	cfnLintPath: string = "cfn-lint";
	cfnLintAppendRules: Array<string> = [];
	cfnLintIgnoreRules: Array<string> = [];
	cfnLintOverrideSpecPath: string = "";

	pendingValidationRequests: { [uri: string]: NodeJS.Timer } = {};
	validationDelayMs = 200;

	isPreviewing: { [index: string]: boolean } = {};

	constructor() {
		super();
		this.customTags = [
			"!And",
			"!And sequence",
			"!If",
			"!If sequence",
			"!Not",
			"!Not sequence",
			"!Equals",
			"!Equals sequence",
			"!Or",
			"!Or sequence",
			"!FindInMap",
			"!FindInMap sequence",
			"!Base64",
			"!Join",
			"!Join sequence",
			"!Cidr",
			"!Ref",
			"!Sub",
			"!Sub sequence",
			"!GetAtt",
			"!GetAZs",
			"!ImportValue",
			"!ImportValue sequence",
			"!Select",
			"!Select sequence",
			"!Split",
			"!Split sequence"
		];
		this.schemaStoreEnabled = false;
	}
}

export class TextDocumentTestManager extends TextDocuments<TextDocument> {
	testTextDocuments = new Map<string, TextDocument>();

	constructor() {
		super(TextDocument);
	}

	get(uri: string): TextDocument | undefined {
		return this.testTextDocuments.get(uri);
	}

	set(textDocument: TextDocument): void {
		this.testTextDocuments.set(textDocument.uri, textDocument);
	}
}
