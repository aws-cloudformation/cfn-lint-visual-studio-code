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
import { Connection, DidChangeConfigurationNotification } from 'vscode-languageserver';
import { Settings, SettingsState } from '../cfnSettings';
import { ValidationHandler } from './validationHandler';
import { LanguageSettings, LanguageService, SchemaPriority } from 'yaml-language-server';
import { SchemaSelectionRequests } from 'yaml-language-server/out/server/src/requestTypes';
import { Telemetry } from 'yaml-language-server/out/server/src/languageserver/telemetry';
import { checkSchemaURI } from 'yaml-language-server/out/server/src/languageservice/utils/schemaUrls';
import { isRelativePath, relativeToAbsolutePath } from 'yaml-language-server/out/server/src/languageservice/utils/paths';
import * as path from 'path';


// code adopted from https://github.com/redhat-developer/yaml-language-server/blob/main/src/languageserver/handlers/settingsHandlers.ts
export class SettingsHandler {
  constructor(
    private readonly connection: Connection,
    private readonly languageService: LanguageService,
    private readonly cfnSettings: SettingsState,
    private readonly validationHandler: ValidationHandler,
    private readonly telemetry: Telemetry,
  ) {
  }

  async registerHandlers(): Promise<void> {
    if (this.cfnSettings.hasConfigurationCapability && this.cfnSettings.clientDynamicRegisterSupport) {
      try {
        // Register for all configuration changes.
        await this.connection.client.register(DidChangeConfigurationNotification.type);
      } catch (err) { }
    }
    this.connection.onDidChangeConfiguration(() => this.pullConfiguration());
  }

  /**
   *  The server pull the 'cfnLint', 'editor', 'files' settings sections
   */
  async pullConfiguration(): Promise<void> {
    const config = await this.connection.workspace.getConfiguration([
      { section: 'cfnLint' },
      { section: 'editor' },
      { section: 'files' },
    ]);

    const settings: Settings = {
      cfnLint: config[0],
      vscodeEditor: config[1],
      files: config[2],
    };
    await this.setConfiguration(settings);
  }

  private async setConfiguration(settings: Settings): Promise<void> {

    this.cfnSettings.schemaConfigurationSettings = [];
    const yamlSchemas: { [name: string]: Array<string> } = {};
    const filename = path.join(__dirname, "../../../schema/all-spec.json");
    yamlSchemas[filename] = ["*.yaml", "*.yml"];

    for (const uri in yamlSchemas) {
      const globPattern = yamlSchemas[uri];

      const schemaObj = {
        fileMatch: Array.isArray(globPattern) ? globPattern : [globPattern],
        uri: checkSchemaURI(this.cfnSettings.workspaceFolders, this.cfnSettings.workspaceRoot, uri, this.telemetry),
      };
      this.cfnSettings.schemaConfigurationSettings.push(schemaObj);
    }

    if (settings.cfnLint.format) {
      this.cfnSettings.yamlFormatterSettings = {
        proseWrap: settings.cfnLint.format.proseWrap || 'preserve',
        printWidth: settings.cfnLint.format.printWidth || 80,
      };

      if (settings.cfnLint.format.singleQuote !== undefined) {
        this.cfnSettings.yamlFormatterSettings.singleQuote = settings.cfnLint.format.singleQuote;
      }

      if (settings.cfnLint.format.bracketSpacing !== undefined) {
        this.cfnSettings.yamlFormatterSettings.bracketSpacing = settings.cfnLint.format.bracketSpacing;
      }

      if (settings.cfnLint.format.enable !== undefined) {
        this.cfnSettings.yamlFormatterSettings.enable = settings.cfnLint.format.enable;
      }
    }


    if (settings.cfnLint) {
      this.cfnSettings.cfnLintPath = settings.cfnLint.path ? settings.cfnLint.path : "cfn-lint";
      this.cfnSettings.cfnLintAppendRules = settings.cfnLint.appendRules ? settings.cfnLint.appendRules : [];
      this.cfnSettings.cfnLintIgnoreRules = settings.cfnLint.ignoreRules ? settings.cfnLint.ignoreRules : [];
      this.cfnSettings.cfnLintOverrideSpecPath = settings.cfnLint.overrideSpecPath ? settings.cfnLint.overrideSpecPath : "";
    }

    this.updateConfiguration();
    if (this.cfnSettings.useSchemaSelectionRequests) {
      this.connection.sendNotification(SchemaSelectionRequests.schemaStoreInitialized, {});
    }
  }


  /**
   * Called when server settings or schema associations are changed
   * Re-creates schema associations and re-validates any open YAML files
   */
  private updateConfiguration(): void {
    let languageSettings: LanguageSettings = {
      validate: this.cfnSettings.yamlShouldValidate,
      hover: this.cfnSettings.yamlShouldHover,
      completion: this.cfnSettings.yamlShouldCompletion,
      schemas: [],
      customTags: this.cfnSettings.customTags,
      format: this.cfnSettings.yamlFormatterSettings.enable,
      indentation: this.cfnSettings.indentation,
      disableAdditionalProperties: this.cfnSettings.disableAdditionalProperties,
      disableDefaultProperties: this.cfnSettings.disableDefaultProperties,
      parentSkeletonSelectedFirst: this.cfnSettings.suggest.parentSkeletonSelectedFirst,
      yamlVersion: this.cfnSettings.yamlVersion,
    };

    if (this.cfnSettings.schemaConfigurationSettings) {
      this.cfnSettings.schemaConfigurationSettings.forEach((schema: any) => {
        let uri = schema.uri;
        if (!uri && schema.schema) {
          uri = schema.schema.id;
        }
        if (!uri && schema.fileMatch) {
          uri = 'vscode://schemas/custom/' + encodeURIComponent(schema.fileMatch.join('&'));
        }
        if (uri) {
          if (isRelativePath(uri)) {
            console.log('Is relative');
            uri = relativeToAbsolutePath(this.cfnSettings.workspaceFolders, this.cfnSettings.workspaceRoot, uri);
          }

          languageSettings = this.configureSchemas(
            uri,
            schema.fileMatch,
            schema.schema,
            languageSettings,
            SchemaPriority.Settings
          );
        }
      });
    }

    console.log(languageSettings.schemas[0].fileMatch[0]);
    this.languageService.configure(languageSettings);

    // Revalidate any open text documents
    this.cfnSettings.documents.all().forEach((document) => this.validationHandler.validate(document));
  }

  /**
   * Stores schema associations in server settings, handling kubernetes
   * @param uri string path to schema (whether local or online)
   * @param fileMatch file pattern to apply the schema to
   * @param schema schema id
   * @param languageSettings current server settings
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private configureSchemas(
    uri: string,
    fileMatch: string[],
    schema: unknown,
    languageSettings: LanguageSettings,
    priorityLevel: number
  ): LanguageSettings {
    uri = checkSchemaURI(this.cfnSettings.workspaceFolders, this.cfnSettings.workspaceRoot, uri, this.telemetry);

    if (schema === null) {
      languageSettings.schemas.push({ uri, fileMatch: fileMatch, priority: priorityLevel });
    } else {
      languageSettings.schemas.push({ uri, fileMatch: fileMatch, schema: schema, priority: priorityLevel });
    }

    return languageSettings;
  }

}
