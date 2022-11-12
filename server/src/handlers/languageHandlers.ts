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
import { yamlDocumentsCache } from "yaml-language-server/out/server/src/languageservice/parser/yaml-documents";
import { matchOffsetToDocument } from "yaml-language-server/out/server/src/languageservice/utils/arrUtils";
import { isNode, isPair, isScalar, isMap } from "yaml";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ASTNode } from "yaml-language-server/out/server/src/languageservice/jsonASTTypes";
import { MarkdownString } from "../utils/markdownString";

interface CfnTypes {
  parameters: Map<string, string>;
  resources: Map<string, string>;
}

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

    let [node, template] = this.getNode(textDocument, textDocumentPosition);

    function addResources(prefix: string) {
      template.resources.forEach((value: string, key: string) => {
        const markedDownString = new MarkdownString();
        markedDownString.appendCodeblock("", `(Resource): ${value}`);
        results.items.push({
          kind: 12,
          insertTextFormat: 2,
          insertText: `${prefix}${key}`,
          label: `${prefix}${key}`,
          documentation: markedDownString.toMarkupContent(),
        });
      });
    }

    function addParameters(prefix: string) {
      template.parameters.forEach((value: string, key: string) => {
        const markedDownString = new MarkdownString();
        markedDownString.appendCodeblock("", `(Parameter): ${value}`);
        results.items.push({
          kind: 12,
          insertTextFormat: 2,
          insertText: `${prefix}${key}`,
          label: `${prefix}${key}`,
          documentation: markedDownString.toMarkupContent(),
        });
      });
    }

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

    const results = await this.cfnLanguageService.doHover(
      document,
      textDocumentPositionParams.position
    );

    let [node, template] = this.getNode(document, textDocumentPositionParams);

    const markedDownString = new MarkdownString();

    function updateHover(
      map: Map<string, string>,
      type: string,
      nodeValue: string | number | boolean
    ) {
      map.forEach((value: string, key: string) => {
        if (key === nodeValue) {
          markedDownString.appendCodeblock("", `(${type}) ${key}: ${value}`);
          results.contents = markedDownString.toMarkupContent();
        }
      });
    }

    if (node !== null && template !== null) {
      if (isNode(node.internalNode)) {
        if (node.internalNode.tag === undefined) {
          if (node.parent !== undefined) {
            if (isPair(node.parent.internalNode)) {
              if (isScalar(node.parent.internalNode.key)) {
                if (node.parent.internalNode.key.value === "Ref") {
                  updateHover(template.resources, "Resource", node.value);
                  updateHover(template.parameters, "Parameter", node.value);
                }
              }
            }
          }
        } else if (node.internalNode.tag !== undefined) {
          if (node.internalNode.tag === "!Ref") {
            updateHover(template.resources, "Resource", node.value);
            updateHover(template.parameters, "Parameter", node.value);
          }
        }
      }
    }

    return results;
  }

  private getNode(
    document: TextDocument,
    position: TextDocumentPositionParams
  ): [ASTNode, CfnTypes] | null {
    let cfnTypes: CfnTypes = {
      parameters: new Map<string, string>(),
      resources: new Map<string, string>(),
    };

    const doc = yamlDocumentsCache.getYamlDocument(document);

    // Build resource types
    try {
      const offset = document.offsetAt(position.position);
      const currentDoc = matchOffsetToDocument(offset, doc);
      const currentDocIndex = doc.documents.indexOf(currentDoc);
      currentDoc.currentDocIndex = currentDocIndex;

      Object.entries(doc.documents[0].root.children).forEach(([_, value]) => {
        if (isPair(value.internalNode)) {
          if (isScalar(value.internalNode.key)) {
            switch (value.internalNode.key.value) {
              case "Resources": {
                if (isMap(value.internalNode.value)) {
                  for (let idx in value.internalNode.value.items) {
                    const resource = value.internalNode.value.items[idx];
                    if (isPair(resource)) {
                      if (isMap(resource.value)) {
                        const type = resource.value.items.filter((item) => {
                          if (isScalar(item.key)) {
                            return item.key.value === "Type";
                          }
                          return false;
                        });
                        if (type.length === 1) {
                          if (isScalar(resource.key) && isPair(type[0])) {
                            if (typeof resource.key.value === "string") {
                              if (isScalar(type[0].value)) {
                                if (typeof type[0].value.value === "string") {
                                  cfnTypes.resources.set(
                                    resource.key.value,
                                    type[0].value.value
                                  );
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
                break;
              }
              case "Parameters": {
                if (isMap(value.internalNode.value)) {
                  for (let idx in value.internalNode.value.items) {
                    const parameter = value.internalNode.value.items[idx];
                    if (isPair(parameter)) {
                      if (isMap(parameter.value)) {
                        const type = parameter.value.items.filter((item) => {
                          if (isScalar(item.key)) {
                            return item.key.value === "Type";
                          }
                          return false;
                        });
                        if (type.length === 1) {
                          if (isScalar(parameter.key) && isPair(type[0])) {
                            if (typeof parameter.key.value === "string") {
                              if (isScalar(type[0].value)) {
                                if (typeof type[0].value.value === "string") {
                                  cfnTypes.parameters.set(
                                    parameter.key.value,
                                    type[0].value.value
                                  );
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
                break;
              }
            }
          }
        }
      });

      return [currentDoc.getNodeFromOffset(offset), cfnTypes];
    } catch (error) {
      console.debug(error);
    }

    return [null, null];
  }
}
