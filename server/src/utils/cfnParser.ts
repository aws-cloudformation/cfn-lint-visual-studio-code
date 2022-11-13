import { TextDocumentPositionParams } from "vscode-languageserver-protocol";
import { yamlDocumentsCache } from "yaml-language-server/out/server/src/languageservice/parser/yaml-documents";
import { matchOffsetToDocument } from "yaml-language-server/out/server/src/languageservice/utils/arrUtils";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ASTNode } from "yaml-language-server/out/server/src/languageservice/jsonASTTypes";
import {
  ObjectASTNodeImpl,
  PropertyASTNodeImpl,
  StringASTNodeImpl,
} from "yaml-language-server/out/server/src/languageservice/parser/jsonParser07";
import { MarkupContent } from "vscode-languageserver-types";
import { MarkdownString } from "./markdownString";

export interface TypeInfoImpl {
  toMarkupContent(from: string, key: string): MarkupContent;
  description: string;
  type: string;
}

class TypeInfo implements TypeInfoImpl {
  constructor(public type: string, public description = "") {}

  toMarkupContent(from: string, key: string): MarkupContent {
    const markedownString = new MarkdownString();
    markedownString.appendCodeblock("", `(${from}) ${key}: ${this.type}`);
    return markedownString.toMarkupContent();
  }
}

export class CfnType extends Map<string, TypeInfo> {
  constructor(public type: string) {
    super();
  }
  getKeyMarkupContent(key: string): MarkupContent {
    return this.get(key).toMarkupContent(this.type, key);
  }
}

export interface CfnTypes {
  isValidTemplate: boolean; // stores if this a CFN template
  formatVersion: string | undefined;
  parameters: CfnType;
  resources: CfnType;
}

function getTypeFromObject(item: ObjectASTNodeImpl): string | undefined {
  let type: string | undefined = undefined;
  item.children.forEach((visit: PropertyASTNodeImpl) => {
    if (visit.keyNode.value === "Type") {
      if (visit.valueNode instanceof StringASTNodeImpl) {
        type = visit.valueNode.value;
      }
    }
  });
  return type;
}

export function getNode(
  document: TextDocument,
  position: TextDocumentPositionParams
): [ASTNode, CfnTypes] | null {
  let cfnTypes: CfnTypes = {
    isValidTemplate: false,
    formatVersion: undefined,
    parameters: new CfnType("Parameter"),
    resources: new CfnType("Resource"),
  };

  const doc = yamlDocumentsCache.getYamlDocument(document);

  // Build resource types
  try {
    const offset = document.offsetAt(position.position);
    const currentDoc = matchOffsetToDocument(offset, doc);
    const currentDocIndex = doc.documents.indexOf(currentDoc);
    currentDoc.currentDocIndex = currentDocIndex;

    const filteredSections = new Map<string, ObjectASTNodeImpl>();

    if (currentDoc.root instanceof ObjectASTNodeImpl) {
      currentDoc.root.children.forEach((visit: PropertyASTNodeImpl) => {
        if (["Resources", "Parameters"].indexOf(visit.keyNode.value) > -1) {
          if (visit.valueNode instanceof ObjectASTNodeImpl) {
            filteredSections.set(visit.keyNode.value, visit.valueNode);
          }
        } else if (["AWSTemplateFormatVersion"].indexOf(visit.keyNode.value) > -1) {
          if (visit.valueNode instanceof StringASTNodeImpl) {
            cfnTypes.formatVersion = visit.valueNode.value;
          }
        }
      });
    }

    if (filteredSections.has("Resources")) {
      const value = filteredSections.get("Resources");
      value.children.forEach((resource: PropertyASTNodeImpl) => {
        if (resource.valueNode instanceof ObjectASTNodeImpl) {
          const type = getTypeFromObject(resource.valueNode);
          cfnTypes.resources.set(resource.keyNode.value, new TypeInfo(type));
        }
      });
    }
    if (filteredSections.has("Parameters")) {
      const value = filteredSections.get("Parameters");
      value.children.forEach((parameter: PropertyASTNodeImpl) => {
        if (parameter.valueNode instanceof ObjectASTNodeImpl) {
          const type = getTypeFromObject(parameter.valueNode);
          cfnTypes.parameters.set(parameter.keyNode.value, new TypeInfo(type));
        }
      });
    }

    if (cfnTypes.resources.size > 0 || cfnTypes.formatVersion !== undefined) {
      cfnTypes.isValidTemplate = true;
    }
    return [currentDoc.getNodeFromOffset(offset), cfnTypes];
  } catch (error) {
    console.debug(error);
  }

  return [null, null];
}
