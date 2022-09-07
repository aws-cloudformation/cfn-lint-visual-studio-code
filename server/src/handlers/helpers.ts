import { Connection } from 'vscode-languageserver';

export function isCloudFormation(template: string, filename: string, cfnConnection: Connection): Boolean {

	if (/"?AWSTemplateFormatVersion"?\s*/.exec(template)) {
		cfnConnection.console.log("Determined this file is a CloudFormation Template. " + filename +
			". Found the string AWSTemplateFormatVersion");
		return true;
	}
	if (/\n?"?Resources"?\s*:/.exec(template)) {
		if (/"?Type"?\s*:\s*"?'?[a-zA-Z0-9]{2,64}::[a-zA-Z0-9]{2,64}/.exec(template)) {
			// filter out serverless.io templates
			if (!(/\nresources:/.exec(template) && /\nprovider:/.exec(template))) {
				cfnConnection.console.log("Determined this file is a CloudFormation Template. " + filename +
					". Found 'Resources' and 'Type: [a-zA-Z0-9]{2,64}::[a-zA-Z0-9]{2,64}'");
				return true;
			}
		}
	}
	return false;
}

export function isYaml(filename: string): Boolean {

	if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
		return true;
	}
 	return false;
}