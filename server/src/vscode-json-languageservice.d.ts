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

declare module 'vscode-json-languageservice/lib/umd/services/jsonSchemaService' {
	type JSONSchema = import('vscode-json-languageservice').JSONSchema;
	type SchemaRequestService = import('vscode-json-languageservice').SchemaRequestService;
	type WorkspaceContextService = import('vscode-json-languageservice').WorkspaceContextService;
	type MatchingSchema = import('vscode-json-languageservice').MatchingSchema;
	type TextDocument = import('vscode-json-languageservice').TextDocument;
	type JSONDocument = import('vscode-json-languageservice').JSONDocument;
	type SchemaDependencies = Set<string>;

	interface ISchemaHandle {
		uri: string;
		getUnresolvedSchema(): Thenable<UnresolvedSchema>;
		getResolvedSchema(): Thenable<ResolvedSchema>;
	}

	interface SchemaAssociation {
		pattern: string[];
		uris: string[];
	}

	interface ISchemaContributions {
		schemas?: { [id: string]: JSONSchema };
		schemaAssociations?: SchemaAssociation[];
	}


	class UnresolvedSchema {
		constructor(schema: JSONSchema, errors: string[]);
	}

	class ResolvedSchema {
		schema: JSONSchema;
		errors: string[];
		warnings: string[];
		schemaDraft: string | undefined;
		constructor(schema: JSONSchema, errors: string[], warnings: string[], schemaDraft: string | undefined);
		getSection(path: string[]): JSONSchema | undefined;
	}

	class SchemaHandle {
		uri: string;
		constructor(service: JSONSchemaService, uri: string, unresolvedSchemaContent?: JSONSchema);
		getUnresolvedSchema(): Thenable<UnresolvedSchema>;
		getResolvedSchema(): Thenable<ResolvedSchema>;
		clearSchema(): boolean;
	}

	class JSONSchemaService {
		constructor(requestService?: SchemaRequestService, contextService?: WorkspaceContextService, promiseConstructor?: PromiseConstructor);
		getRegisteredSchemaIds(filter?: (scheme: string) => boolean): string[];
		dispose(): void;
		onResourceChange(uri: string): boolean;
		setSchemaContributions(schemaContributions: ISchemaContributions): void;
		registerExternalSchema(uri: string, filePatterns?: string[], unresolvedSchemaContent?: JSONSchema): ISchemaHandle;
		clearExternalSchemas(): void;
		getResolvedSchema(schemaId: string): Thenable<ResolvedSchema | undefined>;
		loadSchema(url: string): Thenable<UnresolvedSchema>;
		resolveSchemaContent(schemaToResolve: UnresolvedSchema, schemaURL: string, dependencies: SchemaDependencies): Thenable<ResolvedSchema>;
		getSchemaURIsForResource(resource: string, document?: JSONDocument): string[];
		getSchemaForResource(resource: string, document?: JSONDocument): Thenable<ResolvedSchema | undefined>;
		getMatchingSchemas(document: TextDocument, jsonDocument: JSONDocument, schema?: JSONSchema): Thenable<MatchingSchema[]>;
	}

	export {UnresolvedSchema, ResolvedSchema, SchemaHandle, JSONSchemaService, ISchemaContributions, SchemaDependencies};
}
