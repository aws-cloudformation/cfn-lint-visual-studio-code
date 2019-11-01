/*
Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License").
You may not use this file except in compliance with the License.
A copy of the License is located at

    http://www.apache.org/licenses/LICENSE-2.0

or in the "license" file accompanying this file. This file is distributed
on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied. See the License for the specific language governing
permissions and limitations under the License.
*/
'use strict';

import * as path from 'path';

import { workspace, ExtensionContext, ConfigurationTarget, window } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';
import { registerYamlSchemaSupport } from './yaml-support/yaml-schema';

export function activate(context: ExtensionContext) {

	// The server is implemented in node
	let serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
	// The debug options for the server
	let debugOptions = { execArgv: ["--nolazy", "--inspect=6010"] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [
			{ scheme: 'file', language: 'yaml' },
			{ scheme: 'file', language: 'json' }
		],
		synchronize: {
			// Synchronize the setting section 'languageServerExample' to the server
			configurationSection: 'cfnLint',
			// Notify the server about file changes to '.clientrc files contain in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	let enableAutocomplete: boolean = workspace.getConfiguration().get('cfnLint.enableAutocomplete');
	if (enableAutocomplete) {
		let currentTags: Array<string> = workspace.getConfiguration().get('yaml.customTags');
		let cloudFormationTags = [
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
		let updateTags = currentTags.concat(cloudFormationTags.filter((item) => currentTags.indexOf(item) < 0));

		workspace.getConfiguration().update('yaml.customTags', updateTags, ConfigurationTarget.Global);

		yamlLangaugeServerValidation();

		registerYamlSchemaSupport();
	}

	// Create the language client and start the client.
	let disposable = new LanguageClient('cfnLint', 'CloudFormation linter Language Server', serverOptions, clientOptions).start();

	// Push the disposable to the context's subscriptions so that the
	// client can be deactivated on extension deactivation
	context.subscriptions.push(disposable);

}

export async function yamlLangaugeServerValidation(): Promise<void> {
	let validateYaml: boolean = workspace.getConfiguration().get('yaml.validate');
	let cfnValidateYamlInspect = workspace.getConfiguration().inspect('cfnLint.validateUsingJsonSchema');
	let cfnValidateYaml: boolean = workspace.getConfiguration().get('cfnLint.validateUsingJsonSchema');

	if (validateYaml) {
		if (cfnValidateYamlInspect.globalValue == null || cfnValidateYamlInspect.workspaceFolderValue == null || cfnValidateYamlInspect.workspaceValue == null) {
			let selection: string = await window
				.showInformationMessage('The installed Red Hat YAML extension is also configured to validate YAML templates. This may result in duplicate lint errors with cfn-lint. Disabling the YAML extensions validation will disable it completely.  Would you like to only use cfn-lint to lint CloudFormation templates?',
					...['yes', 'no']);
			if (selection == 'yes') {
				workspace.getConfiguration().update('cfnLint.validateUsingJsonSchema', false, ConfigurationTarget.Global);
			} else if (selection == 'no') {
				workspace.getConfiguration().update('cfnLint.validateUsingJsonSchema', true, ConfigurationTarget.Global);
				cfnValidateYaml = true
			}

		}
		if (cfnValidateYaml == false) {
			workspace.getConfiguration().update('yaml.validate', false, ConfigurationTarget.Global);
		}
	}
}