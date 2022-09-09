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

import { getLanguageService as getCustomLanguageService, LanguageService, SchemaRequestService, WorkspaceContextService } from 'yaml-language-server';
import { Connection, InitializeParams, InitializeResult, TextDocumentSyncKind } from 'vscode-languageserver';
import { SettingsState } from './cfnSettings';
import { ValidationHandler } from './handlers/validationHandler';
import { SettingsHandler } from './handlers/settingsHandler';
import { NotificationHandler } from './handlers/notificationHandler';
import { LanguageHandlers } from './handlers/languageHandlers';
import { Telemetry } from 'yaml-language-server/out/server/src/languageserver/telemetry';
import { readFile } from 'fs';
import { JSONSchema } from 'yaml-language-server/out/server/src/languageservice/jsonSchema';
import { WorkspaceHandlers } from 'yaml-language-server/out/server/src/languageserver/handlers/workspaceHandlers';
import { commandExecutor } from 'yaml-language-server/out/server/src/languageserver/commandExecutor';
import * as path from 'path';


// code adopted from https://github.com/redhat-developer/yaml-language-server/blob/main/src/yamlServerInit.ts
export class CfnServerInit {
	languageService: LanguageService;
	languageHandler: LanguageHandlers;
	validationHandler: ValidationHandler;
	settingsHandler: SettingsHandler;

	constructor(
		private readonly connection: Connection,
		private cfnSettings: SettingsState,
		private workspaceContext: WorkspaceContextService,
		private schemaRequestService: SchemaRequestService,
		private telemetry: Telemetry,
	) {
		this.cfnSettings.documents.listen(this.connection);

		/**
		 * Run when the client connects to the server after it is activated.
		 * The server receives the root path(s) of the workspace and the client capabilities.
		 */
		this.connection.onInitialize(
			(params: InitializeParams): InitializeResult => {
				return this.connectionInitialized(params);
			}
		);
		this.connection.onInitialized(() => {
			//if (this.yamlSettings.hasWsChangeWatchedFileDynamicRegistration) {
			//  this.connection.workspace.onDidChangeWorkspaceFolders((changedFolders) => {
			//    this.yamlSettings.workspaceFolders = workspaceFoldersChanged(this.yamlSettings.workspaceFolders, changedFolders);
			//  });
			//}
			// need to call this after connection initialized


			this.settingsHandler.registerHandlers();
			this.settingsHandler.pullConfiguration();
		});
	}

	// public for test setup
	connectionInitialized(params: InitializeParams): InitializeResult {
		this.cfnSettings.capabilities = params.capabilities;

		this.languageService = getCustomLanguageService(
			this.schemaRequestService,
			this.workspaceContext,
			this.connection,
			this.telemetry,
			this.cfnSettings,
			params.capabilities
		);



		readFile(path.join(__dirname, `../../schema/all-spec.json`), 'utf8', (err, data) => {
			if (err) {
				this.connection.console.log(err.message);
			}
			let schema: JSONSchema;
			schema = data as JSONSchema;
      		this.languageService.addSchema('CLOUDFORMATION', schema);
		});

		this.registerHandlers();

		return {
			capabilities: {
				textDocumentSync: TextDocumentSyncKind.Incremental,
				completionProvider: {},
				hoverProvider: true,
				documentSymbolProvider: true,
				documentFormattingProvider: false,
				documentOnTypeFormattingProvider: {
					firstTriggerCharacter: '\n',
				},
				documentRangeFormattingProvider: false,
				definitionProvider: true,
				documentLinkProvider: {},
				foldingRangeProvider: true,
				codeActionProvider: true,
				workspace: {
					workspaceFolders: {
						changeNotifications: false,
						supported: true,
					},
				},
			},
		};
	}

	private registerHandlers(): void {
		// Register all features that the language server has
		this.validationHandler = new ValidationHandler(this.connection, this.languageService, this.cfnSettings);
		new NotificationHandler(this.connection, this.cfnSettings, this.validationHandler).registerHandlers();
		this.settingsHandler = new SettingsHandler(
			this.connection,
			this.languageService,
			this.cfnSettings,
			this.validationHandler,
			this.telemetry,
		);

		this.languageHandler = new LanguageHandlers(this.connection, this.languageService, this.cfnSettings, this.validationHandler);
		this.languageHandler.registerHandlers();

		new WorkspaceHandlers(this.connection, commandExecutor).registerHandlers();
	}

	start(): void {
		this.connection.listen();
	}
}
