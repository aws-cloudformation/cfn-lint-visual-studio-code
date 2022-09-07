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
import {
  TextDocumentPositionParams,
  DocumentFormattingParams,
} from 'vscode-languageserver-protocol';
import {
  CompletionList,
  TextEdit,
} from 'vscode-languageserver-types';
import { LanguageService } from 'yaml-language-server';
import { SettingsState } from '../cfnSettings';
import { ValidationHandler } from './validationHandler';
import { LanguageHandlers as YamlLanguageHandlers } from 'yaml-language-server/out/server/src/languageserver/handlers/languageHandlers';
import { isYaml } from './helpers';

// code adopted from https://github.com/redhat-developer/yaml-language-server/blob/main/src/languageserver/handlers/languageHandlers.ts
export class LanguageHandlers extends YamlLanguageHandlers{
  private cfnLanguageService: LanguageService;
  private cfnSettings: SettingsState;

  pendingLimitExceededWarnings: { [uri: string]: { features: { [name: string]: string }; timeout?: NodeJS.Timeout } };

  constructor(
    connection: Connection,
    languageService: LanguageService,
    cfnSettings: SettingsState,
    validationHandler: ValidationHandler
  ) {
    super(connection, languageService, cfnSettings, validationHandler);
    this.cfnSettings = cfnSettings;
    this.cfnLanguageService = languageService;
  }

  /**
   * Called when auto-complete is triggered in an editor
   * Returns a list of valid completion items
   */
  completionHandler(textDocumentPosition: TextDocumentPositionParams): Promise<CompletionList> {
    const textDocument = this.cfnSettings.documents.get(textDocumentPosition.textDocument.uri);

    const result: CompletionList = {
      items: [],
      isIncomplete: false,
    };

    if (!textDocument) {
      return Promise.resolve(result);
    }

    return this.cfnLanguageService.doComplete(
      textDocument,
      textDocumentPosition.position,
      false,
    );
  }

  /**
   * Called when the formatter is invoked
   * Returns the formatted document content using prettier
   */
   formatterHandler(formatParams: DocumentFormattingParams): TextEdit[] {
    const uri = formatParams.textDocument.uri;
    const document = this.cfnSettings.documents.get(uri);

    if (!document) {
      // @ts-ignore
      return;
    }

    let fileIsYaml = isYaml(uri.toString());

    if (!fileIsYaml) {
      // @ts-ignore
      return;
    }

    const customFormatterSettings = {
      tabWidth: formatParams.options.tabSize,
      ...this.cfnSettings.yamlFormatterSettings,
    };

    return this.cfnLanguageService.doFormat(document, customFormatterSettings);
  }

}
