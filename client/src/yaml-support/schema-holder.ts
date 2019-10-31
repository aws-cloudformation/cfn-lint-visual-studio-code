import { CLOUDFORMATION_SCHEMA_FILE } from "./yaml-constant";
import * as util from "./yaml-util";

export class CloudFormationSchemaHolder {
	public schema: {};

	public loadSchemaFromRaw(): void {
		this.schema = util.loadJson(CLOUDFORMATION_SCHEMA_FILE);
	}
}
