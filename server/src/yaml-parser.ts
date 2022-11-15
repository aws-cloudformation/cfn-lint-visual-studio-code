import {
  YAMLDocument,
  SingleYAMLDocument,
} from "yaml-language-server/out/server/src/languageservice/parser/yaml-documents";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  defaultOptions,
  ParserOptions,
} from "yaml-language-server/out/server/src/languageservice/parser/yamlParser07";
import {
  Parser,
  Composer,
  Document,
  LineCounter,
  ParseOptions,
  DocumentOptions,
  SchemaOptions,
} from "yaml";
import { TextBuffer } from "yaml-language-server/out/server/src/languageservice/utils/textBuffer";
import { YAMLMap, YAMLSeq } from "yaml";

class refExp {
  tag: string;
  readonly type: string;
  default: never;
  constructor() {
    this.tag = "Ref";
    this.type = "scalar";
  }
  get collection(): "map" | "seq" | never {
    return "map";
  }
  identify?: (value: unknown) => boolean;
  resolve(value: string | YAMLMap | YAMLSeq): string | YAMLMap | YAMLSeq {
    const map = new YAMLMap();
    map.add({ key: "Ref", value: value });
    return map;
  }
}

declare module "yaml-language-server/out/server/src/languageservice/parser/yamlParser07" {}

module.exports.parse = function (
  text: string,
  parserOptions: ParserOptions = defaultOptions,
  document?: TextDocument
): YAMLDocument {
  const options: ParseOptions & DocumentOptions & SchemaOptions = {
    strict: false,
    customTags: [new refExp()],
    version: parserOptions.yamlVersion ?? defaultOptions.yamlVersion,
    keepSourceTokens: true,
  };
  const composer = new Composer(options);
  const lineCounter = new LineCounter();
  let isLastLineEmpty = false;
  if (document) {
    const textBuffer = new TextBuffer(document);
    const position = textBuffer.getPosition(text.length);
    const lineContent = textBuffer.getLineContent(position.line);
    isLastLineEmpty = lineContent.trim().length === 0;
  }
  const parser = isLastLineEmpty
    ? new Parser()
    : new Parser(lineCounter.addNewLine);
  const tokens = parser.parse(text);
  const tokensArr = Array.from(tokens);
  const docs = composer.compose(tokensArr, true, text.length);
  // Generate the SingleYAMLDocs from the AST nodes
  const yamlDocs: SingleYAMLDocument[] = Array.from(docs, (doc) =>
    parsedDocToSingleYAMLDocument(doc, lineCounter)
  );

  // Consolidate the SingleYAMLDocs
  return new YAMLDocument(yamlDocs, tokensArr);
};

function parsedDocToSingleYAMLDocument(
  parsedDoc: Document,
  lineCounter: LineCounter
): SingleYAMLDocument {
  const syd = new SingleYAMLDocument(lineCounter);
  syd.internalDocument = parsedDoc;
  return syd;
}
