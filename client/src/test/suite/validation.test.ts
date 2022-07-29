
import * as vscode from 'vscode';
import { getDocUri, activate, testDiagnostics } from './helper';

suite('Should validate a template against cfn-lint', () => {
	const fixtureFolder = 'validation';

	suite('Should have failures with a bad template', () => {

		test('Diagnose bad YAML template', async () => {
			const docUri = getDocUri(fixtureFolder, 'bad.yaml');
			await activate(docUri);

			await testDiagnostics(docUri, [
				{
					severity: vscode.DiagnosticSeverity.Error,
					message: '[cfn-lint] E1001: Top level template section Errors is not valid',
					range: toRange(2, 0, 2, 6)
				},
				{
					severity: vscode.DiagnosticSeverity.Warning,
					message: '[cfn-lint] W2001: Parameter myParam not used.',
					range: toRange(5, 2, 5, 9)
				},
				{
					severity: vscode.DiagnosticSeverity.Error,
					message: '[cfn-lint] E3001: Invalid or unsupported Type AWS::EC2::Instance1 for resource MyEC2Instance1 in us-east-1',
					range: toRange(12, 4, 12, 8)
				}
			]);
		});

		test('Diagnose bad JSON template', async () => {
			const docUri = getDocUri(fixtureFolder, 'bad.json');
			await activate(docUri);

			await testDiagnostics(docUri, [
				{
					severity: vscode.DiagnosticSeverity.Error,
					message: '[cfn-lint] E1001: Top level template section Errors is not valid',
					range: toRange(3, 2, 3, 10)
				},
				{
					severity: vscode.DiagnosticSeverity.Warning,
					message: '[cfn-lint] W2001: Parameter myParam not used.',
					range: toRange(5, 4, 5, 13)
				},
				{
					severity: vscode.DiagnosticSeverity.Error,
					message: '[cfn-lint] E3001: Invalid or unsupported Type AWS::EC2::Instance1 for resource MyEC2Instance1 in us-east-1',
					range: toRange(13, 6, 13, 12)
				}
			]);
		});

		test('Diagnoses a bad template without AWSTemplateFormatVersion', async () => {
			const docUri = getDocUri(fixtureFolder, 'still_a_template.yaml');
			await activate(docUri);
			await testDiagnostics(docUri, [
				{
					severity: vscode.DiagnosticSeverity.Error,
					message: '[cfn-lint] E3002: Invalid Property Resources/RootRole/Properties/BadKey',
					range: toRange(5, 6, 5, 12)
				}
			]);
		});

		test('Diagnoses a bad template without AWSTemplateFormatVersion 2', async () => {
			const docUri = getDocUri(fixtureFolder, 'still_a_template_2.yaml');
			await activate(docUri);
			await testDiagnostics(docUri, [
				{
					severity: vscode.DiagnosticSeverity.Error,
					message: '[cfn-lint] E3002: Invalid Property Resources/RootRole/Properties/BadKey',
					range: toRange(4, 6, 4, 12)
				}
			]);
		});

		test('Diagnoses a bad template with spaces in the name', async () => {
			const docUri = getDocUri(fixtureFolder, 'a template.yaml');
			await activate(docUri);
			await testDiagnostics(docUri, [
				{
					severity: vscode.DiagnosticSeverity.Error,
					message: '[cfn-lint] E3002: Invalid Property Resources/RootRole/Properties/BadKey',
					range: toRange(5, 6, 5, 12)
				}
			]);
		});
	});

	suite('Should not have false positives', () => {
		test('Diagnose good template', async () => {
			const docUri = getDocUri(fixtureFolder, 'good.yaml');
			await activate(docUri);
			await testDiagnostics(docUri, []);
		});

		test('Diagnose a yaml file that isn\'t CloudFormation', async () => {
			const docUri = getDocUri(fixtureFolder, 'not_template.yaml');
			await activate(docUri);
			await testDiagnostics(docUri, []);
		});
	});

});

function toRange(sLine: number, sChar: number, eLine: number, eChar: number) {
	const start = new vscode.Position(sLine, sChar);
	const end = new vscode.Position(eLine, eChar);
	return new vscode.Range(start, end);
}
