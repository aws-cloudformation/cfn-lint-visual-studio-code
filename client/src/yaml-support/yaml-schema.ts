import * as semver from 'semver';
import Uri from 'vscode-uri';
import * as vscode from 'vscode';
import { yamlLocator, YamlMap } from "./yaml-locator";
import { VSCODE_YAML_EXTENSION_ID, CLOUDFORMATION_SCHEMA } from "./yaml-constant";
import * as util from "./yaml-util";
import { CLOUDFORMATION_SCHEMA_PREFIX } from './yaml-constant';
import { CloudFormationSchemaHolder } from './schema-holder';

// The function signature exposed by vscode-yaml:
// 1. the requestSchema api will be called by vscode-yaml extension to decide whether the schema can be handled by this
// contributor, if it returns undefined, means it doesn't support this yaml file, vscode-yaml will ask other contributors
// 2. the requestSchemaContent api  will give the parameter uri returned by the first api, and ask for the json content(after stringify) of
// the schema
declare type YamlSchemaContributor = (schema: string,
	requestSchema: (resource: string) => string | undefined,
	requestSchemaContent: (uri: string) => string) => void;

let schema = new CloudFormationSchemaHolder();

export async function registerYamlSchemaSupport(): Promise<void> {
	schema.loadSchemaFromRaw();
	const yamlPlugin: any = await activateYamlExtension();
	if (!yamlPlugin || !yamlPlugin.registerContributor) {
		// activateYamlExtension has already alerted to users for errors.
		return;
	}
	// register for cloudformation schema provider
	yamlPlugin.registerContributor(CLOUDFORMATION_SCHEMA, requestYamlSchemaUriCallback, requestYamlSchemaContentCallback);
}

// see docs from YamlSchemaContributor
function requestYamlSchemaUriCallback(resource: string): string | undefined {
	const textEditor = vscode.window.visibleTextEditors.find((editor) => editor.document.uri.toString() === resource);
	if (textEditor) {
		const yamlDocs = yamlLocator.getYamlDocuments(textEditor.document);
		var found: boolean = false;

		yamlDocs.forEach((doc: any) => {
			// if the yaml document contains AWSTemplateFormatVersion or Resources at the main level it will
			// register as CloudFormation
			const topLevelMapping = <YamlMap>doc.nodes.find((node: any) => node.kind === 'MAPPING');
			if (topLevelMapping) {
				// if the overall yaml is an map, find the apiVersion and kind properties in yaml
				const cfnTemplateVersion = util.getYamlMappingValue(topLevelMapping, 'AWSTemplateFormatVersion');
				const cfnResources = util.getYamlMappingNode(topLevelMapping, 'Resources');
				if (cfnTemplateVersion || cfnResources) {
					found = true;
				}
			}
		});
		if (found) {
			return CLOUDFORMATION_SCHEMA_PREFIX + 'cloudformation';
		}
	}
	return undefined;
}

// see docs from YamlSchemaContributor
function requestYamlSchemaContentCallback(uri: string): string | undefined {
	const parsedUri = Uri.parse(uri);
	if (parsedUri.scheme !== CLOUDFORMATION_SCHEMA) {
		return undefined;
	}
	if (!parsedUri.path || !parsedUri.path.startsWith('/')) {
		return undefined;
	}

	return JSON.stringify(schema.schema);

}

// find redhat.vscode-yaml extension and try to activate it to get the yaml contributor
async function activateYamlExtension(): Promise<{ registerContributor: YamlSchemaContributor } | undefined> {
	const ext = vscode.extensions.getExtension(VSCODE_YAML_EXTENSION_ID);
	if (!ext) {
		vscode.window.showWarningMessage('Please install \'YAML Support by Red Hat\' via the Extensions pane.');
		return undefined;
	}
	const yamlPlugin = await ext.activate();

	if (!yamlPlugin || !yamlPlugin.registerContributor) {
		vscode.window.showWarningMessage('The installed Red Hat YAML extension doesn\'t support Registering Contributers. Please upgrade \'YAML Support by Red Hat\' via the Extensions pane.');
		return undefined;
	}

	if (ext.packageJSON.version && !semver.gte(ext.packageJSON.version, '0.0.15')) {
		vscode.window.showWarningMessage('The installed Red Hat YAML extension doesn\'t support multiple schemas. Please upgrade \'YAML Support by Red Hat\' via the Extensions pane.');
	}
	return yamlPlugin;
}
