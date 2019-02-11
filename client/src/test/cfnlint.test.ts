
import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate } from './helper';

describe('Should have failuers with a bad template', () => {
	const docUri = getDocUri('bad.yaml');

	it('Diagnoses bad template', async () => {
		await testDiagnostics(docUri, [
			{
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E1001:Top level item Errors isn\'t valid',
				range: toRange(2, 0, 2, 6)
			},
			{
				severity: vscode.DiagnosticSeverity.Warning,
				message: '[cfn-lint] W2001:Parameter myParam not used.',
				range: toRange(5, 2, 5, 9)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3001:Invalid or unsupported Type AWS::EC2::Instance1 for resource MyEC2Instance1 in us-east-1',
				range: toRange(12, 4, 12, 8)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3012:Property Resources/MyEC2Instance/Properties/KeyName should be of type String',
				range: toRange(20, 6, 20, 13)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3002:Invalid Property Resources/MyEC2Instance/Properties/FakeKey',
				range: toRange(21, 6, 21, 13)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E1012:Ref pIops not found as a resource or parameter',
				range: toRange(27, 12, 27, 16)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3002:Invalid Property Resources/MyEC2Instance/Properties/BlockDeviceMappings/0/Ebs/BadSubX2Key',
				range: toRange(30, 12, 30, 23)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3002:Invalid Property Resources/MyEC2Instance/Properties/NetworkInterfaces/0/BadKey',
				range: toRange(33, 10, 33, 16)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3003:Property PolicyDocument missing at Resources/RootRole/Properties/Policies/0',
				range: toRange(49, 6, 49, 14)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3002:Invalid Property Resources/RootRole/Properties/Policies/0/PolicyDocument1',
				range: toRange(52, 10, 52, 25)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E1012:Ref WebServerPort not found as a resource or parameter',
				range: toRange(91, 8, 91, 20)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3002:Invalid Property Resources/ElasticLoadBalancer/Properties/HealthCheck/FakeKey',
				range: toRange(95, 8, 95, 15)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E1012:Ref WebServerPort not found as a resource or parameter',
				range: toRange(97, 10, 97, 18)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3012:Property Resources/ElasticLoadBalancer/Properties/HealthCheck/UnhealthyThreshold should be of type String',
				range: toRange(104, 8, 104, 26)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3012:Property Resources/ElasticLoadBalancer/Properties/HealthCheck/Interval should be of type String',
				range: toRange(106, 8, 106, 16)
			}, {
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E1010:Invalid GetAtt ElasticLoadBalancer.DNE for resource myErrorOutput',
				range: toRange(112, 4, 112, 9)
			}
		]);
	});
});

describe('Should not have failures on a goodtemplate', () => {
	const docUri = getDocUri('good.yaml');

	it('Diagnose good template', async () => {
		await testDiagnostics(docUri, []);
	});
});

describe('Should not have failures a non CloudFormation Template', () => {
	const docUri = getDocUri('not_template.yaml');

	it('Diagnose good template', async () => {
		await testDiagnostics(docUri, []);
	});
});

describe('Should have failuers even though AWSTemplateFormatVersion isn\'t in the file', () => {
	const docUri = getDocUri('still_a_template.yaml');

	it('Diagnoses a bad template without AWSTemplateFormatVersion', async () => {
		await testDiagnostics(docUri, [
			{
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3002:Invalid Property Resources/RootRole/Properties/BadKey',
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
