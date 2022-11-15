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
import { Connection } from "vscode-languageserver";
import {
  TextDocumentPositionParams,
  DocumentFormattingParams,
} from "vscode-languageserver-protocol";
import { CompletionList, TextEdit, Hover } from "vscode-languageserver-types";
import { LanguageService } from "yaml-language-server";
import { SettingsState } from "../cfnSettings";
import { ValidationHandler } from "./validationHandler";
import { LanguageHandlers as YamlLanguageHandlers } from "yaml-language-server/out/server/src/languageserver/handlers/languageHandlers";
import { isYaml } from "./helpers";
import { isNode, isPair, isScalar } from "yaml";
import { CfnType, getNode, TypeInfoImpl } from "../utils/cfnParser";
import {
  PropertyASTNodeImpl,
  StringASTNodeImpl,
} from "yaml-language-server/out/server/src/languageservice/parser/jsonParser07";
import { MarkdownString } from "../utils/markdownString";

// code adopted from https://github.com/redhat-developer/yaml-language-server/blob/main/src/languageserver/handlers/languageHandlers.ts
export class LanguageHandlers extends YamlLanguageHandlers {
  private cfnLanguageService: LanguageService;
  private cfnSettings: SettingsState;

  pendingLimitExceededWarnings: {
    [uri: string]: {
      features: { [name: string]: string };
      timeout?: NodeJS.Timeout;
    };
  };

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
  async completionHandler(
    textDocumentPosition: TextDocumentPositionParams
  ): Promise<CompletionList> {
    const textDocument = this.cfnSettings.documents.get(
      textDocumentPosition.textDocument.uri
    );

    const result: CompletionList = {
      items: [],
      isIncomplete: false,
    };

    if (!textDocument) {
      return Promise.resolve(result);
    }

    const results = await this.cfnLanguageService.doComplete(
      textDocument,
      textDocumentPosition.position,
      false
    );

    let [node, template] = getNode(textDocument, textDocumentPosition);

    function addResources(prefix: string) {
      template.resources.forEach((value: TypeInfoImpl, key: string) => {
        results.items.push({
          kind: 12,
          insertTextFormat: 2,
          insertText: `${prefix}${key}`,
          label: `${prefix}${key}`,
          documentation: value.toMarkupContent("Resource", "key"),
        });
      });
    }

    function addParameters(prefix: string) {
      template.parameters.forEach((value: TypeInfoImpl, key: string) => {
        results.items.push({
          kind: 12,
          insertTextFormat: 2,
          insertText: `${prefix}${key}`,
          label: `${prefix}${key}`,
          documentation: value.toMarkupContent("Parameter", "key"),
        });
      });
    }

    try {
      if (node !== null && template !== null) {
        if (isNode(node.internalNode)) {
          if (node.internalNode.tag === undefined) {
            if (node.parent !== undefined) {
              if (isPair(node.parent.internalNode)) {
                if (isScalar(node.parent.internalNode.key)) {
                  if (node.parent.internalNode.key.value === "Ref") {
                    addResources("");
                    addParameters("");
                  }
                }
              }
            }
          } else if (node.internalNode.tag !== undefined) {
            if (node.internalNode.tag === "!Ref") {
              results.items = results.items.filter(
                (item) => item.insertText !== "!Ref "
              );
              addResources("");
              addParameters("");
            } else if ("!Ref".startsWith(node.internalNode.tag)) {
              results.items = results.items.filter(
                (item) => item.insertText !== "!Ref "
              );
              addResources("!Ref ");
              addParameters("!Ref ");
            }
          }
        }
      }
    } catch (error) {
      console.debug(error);
    }

    return results;
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

  /**
   * Called when the user hovers with their mouse over a keyword
   * Returns an informational tooltip
   */
  async hoverHandler(
    textDocumentPositionParams: TextDocumentPositionParams
  ): Promise<Hover> {
    const document = this.cfnSettings.documents.get(
      textDocumentPositionParams.textDocument.uri
    );

    if (!document) {
      return Promise.resolve(undefined);
    }

    let hover: Hover = {
      contents: new MarkdownString().toMarkupContent(),
    };

    let results = await this.cfnLanguageService.doHover(
      document,
      textDocumentPositionParams.position
    );

    if (results !== null) {
      hover = results;
    }

    let [node, template] = getNode(document, textDocumentPositionParams);

    function updateHover(map: CfnType, nodeValue: string) {
      if (map.has(nodeValue)) {
        hover.contents = map.getKeyMarkupContent(nodeValue);
      }
    }

    try {
      if (node !== null && template !== null) {
        if (node instanceof StringASTNodeImpl) {
          const parent = node.parent;
          if (parent instanceof PropertyASTNodeImpl) {
            if (parent.keyNode.value === "Ref") {
              updateHover(template.resources, node.value);
              updateHover(template.parameters, node.value);
            }
          }
          if (isNode(node.internalNode)) {
            if (node.internalNode.tag !== undefined) {
              if (node.internalNode.tag === "!Ref") {
                updateHover(template.resources, node.value);
                updateHover(template.parameters, node.value);
              }
            }
          }
        }
      }
    } catch (error) {
      console.debug(error);
    }

    return hover;
  }
}
