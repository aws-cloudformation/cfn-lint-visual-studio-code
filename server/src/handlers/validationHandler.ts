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
import { Connection } from 'vscode-languageserver';
import { SettingsState } from '../cfnSettings';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { applyPatch } from 'fast-json-patch';
import { CfnLint } from '../services/cfnlint';
import { Diagnostic } from 'vscode-languageserver-types';
import { LanguageService } from 'yaml-language-server';
import { ValidationHandler as YamlValidationHandler } from 'yaml-language-server/out/server/src/languageserver/handlers/validationHandlers';
import { isCloudFormation } from './helpers';

// code adopted from https://github.com/redhat-developer/yaml-language-server/blob/main/src/languageserver/handlers/validationHandlers.ts
export class ValidationHandler extends YamlValidationHandler {
  cfnSettings: SettingsState;
  cfnConnection: Connection;

  constructor(connection: Connection, languageService: LanguageService, cfnSettings: SettingsState) {
    super(connection, languageService, cfnSettings);
    this.cfnSettings = cfnSettings;
    this.cfnConnection = connection;

    this.cfnSettings.documents.onDidSave((event) => {
      this.validate(event.document);
    });
    this.cfnSettings.documents.onDidOpen((event) => {
      this.validate(event.document);
    });
  }

  private patchTemplateSchema(registrySchemaDirectory: string) {
    const stub = readFileSync(__dirname + '/../../schema/resource-patch-stub.json', 'utf8');
    let templateSchema = JSON.parse(readFileSync(__dirname + '/../../schema/all-spec.json', 'utf8'));
    for (const schemaFile of readdirSync(registrySchemaDirectory)) {
      const registrySchema = readFileSync(registrySchemaDirectory + schemaFile, 'utf8');
      const patch = JSON.parse(stub.replace(/RESOURCE_TYPE/g, JSON.parse(registrySchema)['typeName']).replace(/"RESOURCE_SCHEMA"/g, registrySchema));
      templateSchema = applyPatch(templateSchema, patch).newDocument;
    }
    writeFileSync(__dirname + '/../../schema/all-spec.json', JSON.stringify(templateSchema));
  }

  validateTextDocument(document: TextDocument): Promise<Diagnostic[]> {
    if (!document) {
      return new Promise<Diagnostic[]>((resolve, _) => {
        resolve([]);
      });
    }

    let uri = document.uri;

    let fileToLint = URI.parse(uri).fsPath;

    let isCfn = isCloudFormation(document.getText(), uri.toString(), this.cfnConnection);

    this.cfnConnection.sendNotification('cfn/isPreviewable', isCfn);

    let buildGraph = this.cfnSettings.isPreviewing[uri];

    return new Promise<Diagnostic[]>((resolve, reject) => {
      if (isCfn) {
        if (this.cfnSettings.cfnLintPath.includes(' --registry-schemas ') || this.cfnSettings.cfnLintPath.includes(' -s ')) {
          for (const segment of this.cfnSettings.cfnLintPath.split('-')) {
            if (segment.startsWith('schemas ') || segment.startsWith('s ')) {
              this.patchTemplateSchema(segment.split(' ')[1] + "/");
            }
          }
        }

        let args = ['--format', 'json'];
        if (!(this.cfnSettings.cfnLintPath.includes(' --include-checks ') || this.cfnSettings.cfnLintPath.includes(' -c '))) {
          args.push('--include-checks');
          args.push('I'); // informational
        }

        if (buildGraph) {
          args.push('--build-graph');
        }

        if (this.cfnSettings.cfnLintIgnoreRules.length > 0) {
          for (var ignoreRule of this.cfnSettings.cfnLintIgnoreRules) {
            args.push('--ignore-checks');
            args.push(ignoreRule);
          }
        }

        if (this.cfnSettings.cfnLintAppendRules.length > 0) {
          for (var appendRule of this.cfnSettings.cfnLintAppendRules) {
            args.push('--append-rules');
            args.push(appendRule);
          }
        }

        if (this.cfnSettings.cfnLintOverrideSpecPath !== "") {
          args.push('--override-spec', this.cfnSettings.cfnLintOverrideSpecPath);
        }

        args.push('--', `"${fileToLint}"`);

        this.cfnConnection.console.log(`Running... ${this.cfnSettings.cfnLintPath} ${args}`);

        const cfnLint = new CfnLint(this.cfnSettings.cfnLintPath, args);
        const cfnLintExec = cfnLint.exec();
        cfnLintExec.then(value => {
          this.cfnConnection.sendDiagnostics({ uri: uri.toString(), diagnostics: value });
          resolve(value);
        });
        cfnLintExec.catch(value => {
          this.cfnConnection.sendDiagnostics({ uri: uri.toString(), diagnostics: value });
          if (this.cfnSettings.isPreviewing[uri]) {
            this.cfnConnection.console.log('preview file is available');
            this.cfnConnection.sendNotification('cfn/previewIsAvailable', uri);
          }
          resolve(value);
        });

      }
      else {
        const message = `Don't believe this is a CloudFormation template. ${uri.toString()}. If it is please add AWSTemplateFormatVersion: '2010-09-09' (YAML) or "AWSTemplateFormatVersion": "2010-09-09" (JSON) into the root level of the document.`;
        this.cfnConnection.console.log(message);
        reject(message);
      }
    });
  }
}
