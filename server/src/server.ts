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

import {
	createConnection, Connection, ProposedFeatures
} from 'vscode-languageserver/node';
import { SettingsState } from './cfnSettings';
import { CfnServerInit } from './cfnServerInit';
import { workspaceContext, schemaRequestHandler } from "yaml-language-server/out/server/src/languageservice/services/schemaRequestHandler";
import { Telemetry } from 'yaml-language-server/out/server/src/languageserver/telemetry';
import { promises as fs } from 'fs';

// Create a connection for the server.
let connection: Connection = null;

if (process.argv.indexOf('--stdio') === -1) {
	connection = createConnection(ProposedFeatures.all);
} else {
	connection = createConnection();
}

process.on('uncaughtException', (err: Error) => {
	// send all uncaught exception to telemetry with stack traces
	connection.console.error(err.message);
});

const fileSystem = {
	readFile: (fsPath: string, encoding?: null) => {
		return fs.readFile(fsPath, encoding).then((b) => b.toString());
	},
};

/**
 * Handles schema content requests given the schema URI
 * @param uri can be a local file, vscode request, http(s) request or a custom request
 */
const schemaRequestHandlerWrapper = (connection: Connection, uri: string): Promise<string> => {
	return schemaRequestHandler(
		connection,
		uri,
		cfnSettings.workspaceFolders,
		cfnSettings.workspaceRoot,
		cfnSettings.useVSCodeContentRequest,
		fileSystem
	);
};

const schemaRequestService = schemaRequestHandlerWrapper.bind(this, connection);

const cfnSettings = new SettingsState();
const telemetry = new Telemetry(connection);

new CfnServerInit(connection, cfnSettings, workspaceContext, schemaRequestService, telemetry).start();
