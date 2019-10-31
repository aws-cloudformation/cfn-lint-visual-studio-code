import * as path from 'path';

export const CLOUDFORMATION_SCHEMA = 'cloudformation';

export const CLOUDFORMATION_SCHEMA_PREFIX = CLOUDFORMATION_SCHEMA + '://schema/';

export const VSCODE_YAML_EXTENSION_ID = 'redhat.vscode-yaml';

export const CLOUDFORMATION_SCHEMA_VERSION = '2.15.0';

export const CLOUDFORMATION_SCHEMA_FILE = path.join(__dirname, `../../../schema/spec-${CLOUDFORMATION_SCHEMA_VERSION}.json`);
