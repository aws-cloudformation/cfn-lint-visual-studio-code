
import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate } from './helper';

suite('Should have failures with a bad template', () => {
	const docUri = getDocUri('bad.yaml');

	test('Diagnoses bad template', async () => {
		await testDiagnostics(docUri, [
			{
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E1001: Top level item Errors isn\'t valid',
				range: toRange(2, 0, 2, 6)
			},
			{
				severity: vscode.DiagnosticSeverity.Warning,
				message: '[cfn-lint] W2001: Parameter myParam not used.',
				range: toRange(5, 2, 5, 9)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3001: Invalid or unsupported Type AWS::EC2::Instance1 for resource MyEC2Instance1 in us-east-1',
				range: toRange(12, 4, 12, 8)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3012: Property Resources/MyEC2Instance/Properties/KeyName should be of type String',
				range: toRange(20, 6, 20, 13)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3002: Invalid Property Resources/MyEC2Instance/Properties/FakeKey',
				range: toRange(21, 6, 21, 13)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E1012: Ref pIops not found as a resource or parameter',
				range: toRange(26, 12, 26, 16)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3002: Invalid Property Resources/MyEC2Instance/Properties/BlockDeviceMappings/0/Ebs/BadSubX2Key',
				range: toRange(29, 12, 29, 23)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3002: Invalid Property Resources/MyEC2Instance/Properties/NetworkInterfaces/0/BadKey',
				range: toRange(32, 10, 32, 16)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3003: Property PolicyDocument missing at Resources/RootRole/Properties/Policies/0',
				range: toRange(48, 10, 55, 2)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3002: Invalid Property Resources/RootRole/Properties/Policies/0/PolicyDocument1',
				range: toRange(49, 10, 49, 25)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E1012: Ref WebServerPort not found as a resource or parameter',
				range: toRange(84, 10, 84, 22)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3002: Invalid Property Resources/ElasticLoadBalancer/Properties/HealthCheck/FakeKey',
				range: toRange(88, 8, 88, 15)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E1012: Ref WebServerPort not found as a resource or parameter',
				range: toRange(93, 16, 94, 14)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3012: Property Resources/ElasticLoadBalancer/Properties/HealthCheck/UnhealthyThreshold should be of type String',
				range: toRange(97, 8, 97, 26)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3012: Property Resources/ElasticLoadBalancer/Properties/HealthCheck/Interval should be of type String',
				range: toRange(99, 8, 99, 16)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E1010: Invalid GetAtt ElasticLoadBalancer.DNE for resource myErrorOutput',
				range: toRange(105, 4, 105, 9)
			}
		]);
	});
});

suite('Should not have failures on a goodtemplate', () => {
	const docUri = getDocUri('good.yaml');

	test('Diagnose good template', async () => {
		await testDiagnostics(docUri, []);
	});
});

suite('Should not have failures a non CloudFormation Template', () => {
	const docUri = getDocUri('not_template.yaml');

	test('Diagnose good template', async () => {
		await testDiagnostics(docUri, []);
	});
});

suite('Should have failures even though AWSTemplateFormatVersion isn\'t in the file', () => {
	const docUri = getDocUri('still_a_template.yaml');

	test('Diagnoses a bad template without AWSTemplateFormatVersion', async () => {
		await testDiagnostics(docUri, [
			{
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3002: Invalid Property Resources/RootRole/Properties/BadKey',
				range: toRange(5, 6, 5, 12)
			}
		]);
	});
});

suite('Should have failures even though AWSTemplateFormatVersion isn\'t in the file', () => {
	const docUri = getDocUri('still_a_template_2.yaml');

	test('Diagnoses a bad template without AWSTemplateFormatVersion', async () => {
		await testDiagnostics(docUri, [
			{
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3002: Invalid Property Resources/RootRole/Properties/BadKey',
				range: toRange(4, 6, 4, 12)
			}
		]);
	});
});

suite('Should have failures even with a space in the filename', () => {
	const docUri = getDocUri('a template.yaml');

	test('Diagnoses a bad template with spaces in the name', async () => {
		await testDiagnostics(docUri, [
			{
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3002: Invalid Property Resources/RootRole/Properties/BadKey',
				range: toRange(5, 6, 5, 12)
			}
		]);
	});
});

function toRange(sLine: number, sChar: number, eLine: number, eChar: number) {
	const start = new vscode.Position(sLine, sChar);
	const end = new vscode.Position(eLine, eChar);
	return new vscode.Range(start, end);
}

async function testDiagnostics(docUri: vscode.Uri, expectedDiagnostics: vscode.Diagnostic[]) {
	await activate(docUri);

	const actualDiagnostics = vscode.languages.getDiagnostics(docUri);
	assert.equal(actualDiagnostics.length, expectedDiagnostics.length);

	expectedDiagnostics.forEach((expectedDiagnostic, i) => {
		const actualDiagnostic = actualDiagnostics[i];
		assert.equal(actualDiagnostic.message, expectedDiagnostic.message);
		assert.deepEqual(actualDiagnostic.range, expectedDiagnostic.range);
		assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity);
	});
}
