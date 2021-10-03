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
'use strict';

import { Command } from 'commander';

import {
	IPCMessageReader, IPCMessageWriter, createConnection, IConnection, TextDocuments, TextDocument,
	Diagnostic, DiagnosticSeverity, InitializeResult
} from 'vscode-languageserver';

import { URI } from 'vscode-uri';

import { spawn } from "child_process";

const program = new Command('cfn-lsp')
	.allowUnknownOption()
	.version(require('../../package.json').version)
	.option('--stdio', 'use stdio')
	.option('--node-ipc', 'use node-ipc')
	.parse(process.argv);

var connection: IConnection;
if (program.stdio) {
	connection = createConnection(process.stdin, process.stdout);
} else {
	connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
}

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities.
let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
	workspaceRoot = params.rootPath;
	return {
		capabilities: {
			// Tell the client that the server works in FULL text document sync mode
			textDocumentSync: documents.syncKind
		}
	};
});

// The content of a CloudFormation document has saved. This event is emitted
// when the document get saved
documents.onDidSave((event) => {
	runLinter(event.document);
});

documents.onDidOpen((event) => {
	runLinter(event.document);
});

documents.onDidClose((event) => {
	connection.sendNotification('cfn/fileclosed', event.document.uri);
});

connection.onNotification('cfn/requestPreview', (uri: string) => {
	connection.console.log('preview requested: ' + uri);
	isPreviewing[uri] = true;
	runLinter(documents.get(uri));
});

connection.onNotification('cfn/previewClosed', (uri: string) => {
	connection.console.log('preview closed: ' + uri);
	isPreviewing[uri] = false;
});

// The settings interface describe the server relevant settings part
interface Settings {
	cfnLint: CloudFormationLintSettings;
}

// These are the example settings we defined in the client's package.json
// file
interface CloudFormationLintSettings {
	path: string;
	appendRules: Array<string>;
	ignoreRules: Array<string>;
	overrideSpecPath: string;
}

// hold the Settings
let Path: string;
let AppendRules: Array<string>;
let IgnoreRules: Array<string>;
let OverrideSpecPath: string;

// The settings have changed. Is send on server activation as well.
connection.onDidChangeConfiguration((change) => {
	connection.console.log('Settings have been updated...');
	let settings = <Settings>change.settings;
	connection.console.log('Settings: ' + JSON.stringify(settings));

	Path = settings.cfnLint.path || 'cfn-lint';
	IgnoreRules = settings.cfnLint.ignoreRules;
	OverrideSpecPath = settings.cfnLint.overrideSpecPath;
	AppendRules = settings.cfnLint.appendRules;

	// Revalidate any open text documents
	documents.all().forEach(runLinter);
});

let isRunningLinterOn: { [index: string]: boolean } = {};
let isPreviewing: { [index: string]: boolean } = {};


function convertSeverity(mistakeType: string): DiagnosticSeverity {

	switch (mistakeType) {
		case "Warning":
			return DiagnosticSeverity.Warning;
		case "Informational":
			return DiagnosticSeverity.Information;
		case "Hint":
			return DiagnosticSeverity.Hint;
	}
	return DiagnosticSeverity.Error;
}

function isCloudFormation(template: string, filename: string): Boolean {

	if (/"?AWSTemplateFormatVersion"?\s*/.exec(template)) {
		connection.console.log("Determined this file is a CloudFormation Template. " + filename +
			". Found the string AWSTemplateFormatVersion");
		return true;
	}
	if (/\n?"?Resources"?\s*:/.exec(template)) {
		if (/"?Type"?\s*:\s*"?'?[a-zA-Z0-9]{2,64}::[a-zA-Z0-9]{2,64}/.exec(template)) {
			// filter out serverless.io templates
			if (!(/\nresources:/.exec(template) && /\nprovider:/.exec(template))) {
				connection.console.log("Determined this file is a CloudFormation Template. " + filename +
					". Found 'Resources' and 'Type: [a-zA-Z0-9]{2,64}::[a-zA-Z0-9]{2,64}'");
				return true;
			}
		}
	}
	return false;
}

function runLinter(document: TextDocument): void {
	let uri = document.uri;

	if (isRunningLinterOn[uri]) {
		connection.sendNotification('cfn/busy');
		return;
	}

	let file_to_lint = URI.parse(uri).fsPath;

	let is_cfn = isCloudFormation(document.getText(), uri.toString());

	connection.sendNotification('cfn/isPreviewable', is_cfn);

	let build_graph = isPreviewing[uri];

	if (is_cfn) {
		let args = ['--format', 'json'];
		if (build_graph) {
			args.push('--build-graph');
		}

		if (IgnoreRules.length > 0) {
			for (var ignoreRule of IgnoreRules) {
				args.push('--ignore-checks');
				args.push(ignoreRule);
			}
		}

		if (AppendRules.length > 0) {
			for (var appendRule of AppendRules) {
				args.push('--append-rules');
				args.push(appendRule);
			}
		}

		if (OverrideSpecPath !== "") {
			args.push('--override-spec', OverrideSpecPath);
		}

		args.push('--', `"${file_to_lint}"`);

		connection.console.log(`Running... ${Path} ${args}`);

		isRunningLinterOn[uri] = true;
		let child = spawn(
			Path,
			args,
			{
				cwd: workspaceRoot,
				shell: true
			}
		);

		let diagnostics: Diagnostic[] = [];
		let filename = uri.toString();
		let start = 0;
		let end = Number.MAX_VALUE;

		child.on('error', function (err) {
			let errorMessage = `Unable to start cfn-lint (${err}). Is cfn-lint installed correctly?`;
			connection.console.log(errorMessage);
			let lineNumber = 0;
			let diagnostic: Diagnostic = {
				range: {
					start: { line: lineNumber, character: start },
					end: { line: lineNumber, character: end }
				},
				severity: DiagnosticSeverity.Error,
				message: '[cfn-lint] ' + errorMessage
			};
			diagnostics.push(diagnostic);
			return;
		});

		child.stderr.on("data", (data: Buffer) => {
			let err = data.toString();
			connection.console.log(err);
			let lineNumber = 0;
			let diagnostic: Diagnostic = {
				range: {
					start: { line: lineNumber, character: start },
					end: { line: lineNumber, character: end }
				},
				severity: DiagnosticSeverity.Warning,
				message: '[cfn-lint] ' + err + '\nGo to https://github.com/aws-cloudformation/cfn-python-lint/#install for more help'
			};
			diagnostics.push(diagnostic);
			return;
		});

		let stdout = "";
		child.stdout.on("data", (data: Buffer) => {
			stdout = stdout.concat(data.toString());
		});

		child.on('exit', function (code, signal) {
			connection.console.log('child process exited with ' +
				`code ${code} and signal ${signal}`);
			let tmp = stdout.toString();
			let obj;
			try {
				obj = JSON.parse(tmp);
			} catch (err) {
				let lineNumber = 0;
				let diagnostic: Diagnostic = {
					range: {
						start: { line: lineNumber, character: start },
						end: { line: lineNumber, character: end }
					},
					severity: DiagnosticSeverity.Warning,
					message: '[cfn-lint] ' + err + '\nGo to https://github.com/aws-cloudformation/cfn-python-lint/#install for more help'
				};
				diagnostics.push(diagnostic);
				return;
			}
			for (let element of obj) {
				let lineNumber = (Number.parseInt(element.Location.Start.LineNumber) - 1);
				let columnNumber = (Number.parseInt(element.Location.Start.ColumnNumber) - 1);
				let lineNumberEnd = (Number.parseInt(element.Location.End.LineNumber) - 1);
				let columnNumberEnd = (Number.parseInt(element.Location.End.ColumnNumber) - 1);
				let diagnostic: Diagnostic = {
					range: {
						start: { line: lineNumber, character: columnNumber },
						end: { line: lineNumberEnd, character: columnNumberEnd }
					},
					severity: convertSeverity(element.Level),
					message: '[cfn-lint] ' + element.Rule.Id + ': ' + element.Message
				};

				diagnostics.push(diagnostic);
			};
		});

		child.on("close", () => {
			//connection.console.log(`Validation finished for(code:${code}): ${Files.uriToFilePath(uri)}`);
			connection.sendDiagnostics({ uri: filename, diagnostics });
			isRunningLinterOn[uri] = false;

			if (build_graph) {
				connection.console.log('preview file is available');
				connection.sendNotification('cfn/previewIsAvailable', uri);
			}
		});
	} else {
		connection.console.log("Don't believe this is a CloudFormation template. " + uri.toString() +
			". If it is please add AWSTemplateFormatVersion: '2010-09-09' (YAML) or " +
			" \"AWSTemplateFormatVersion\": \"2010-09-09\" (JSON) into the root level of the document.");
	}
}

// Listen on the connection
connection.listen();
