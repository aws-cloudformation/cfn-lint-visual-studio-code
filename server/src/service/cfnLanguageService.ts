import { YAMLSchemaService } from "yaml-language-server/out/server/src/languageservice/services/yamlSchemaService";
import { ClientCapabilities, Connection } from "vscode-languageserver";
import { TelemetryImpl } from "yaml-language-server/out/server/src/languageserver/telemetry";
import { SettingsState } from "yaml-language-server/out/server/src/yamlSettings";
import {
  LanguageService as YamlLanguageService,
  SchemaRequestService,
  WorkspaceContextService,
} from "yaml-language-server";
import { getLanguageService as getYamlLanguageService } from "yaml-language-server";

export interface LanguageService extends YamlLanguageService {
  schemaService: YAMLSchemaService;
}

export function getLanguageService(
  schemaRequestService: SchemaRequestService,
  workspaceContext: WorkspaceContextService,
  connection: Connection,
  telemetry: TelemetryImpl,
  yamlSettings: SettingsState,
  clientCapabilities?: ClientCapabilities
): LanguageService {
  const schemaService = new YAMLSchemaService(
    schemaRequestService,
    workspaceContext
  );

  const service = getYamlLanguageService(
    schemaRequestService,
    workspaceContext,
    connection,
    telemetry,
    yamlSettings,
    clientCapabilities
  );

  return {
    ...service,
    schemaService: schemaService,
  };
}
