
import * as vscode from 'vscode';
import * as assert from 'assert';
import * as fs from 'fs';
import { getDocUri, activate, activateAndPreview, getDocPath, sleep, testDiagnostics } from './helper';


suite('Should have failures with a bad template', () => {
	const docUri = getDocUri('bad.yaml');

	test('Diagnose bad template', async () => {
		await activate(docUri);
        await sleep(2000); // Wait for the diagnostics to compute on this file

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
});

suite('Should not have failures on a good template', () => {
	const docUri = getDocUri('good.yaml');

	test('Diagnose good template', async () => {
		await activate(docUri);
        await sleep(2000); // Wait for the diagnostics to compute on this file
		await testDiagnostics(docUri, []);
	});
});

suite('Should not have failures a non CloudFormation Template', () => {
	const docUri = getDocUri('not_template.yaml');

	test('Diagnose good template', async () => {
		await activate(docUri);
        await sleep(2000); // Wait for the diagnostics to compute on this file
		await testDiagnostics(docUri, []);
	});
});

suite('Should have failures even though AWSTemplateFormatVersion isn\'t in the file', () => {
	const docUri = getDocUri('still_a_template.yaml');

	test('Diagnoses a bad template without AWSTemplateFormatVersion', async () => {
		await activate(docUri);
        await sleep(2000); // Wait for the diagnostics to compute on this file
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
		await activate(docUri);
        await sleep(2000); // Wait for the diagnostics to compute on this file
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
		await activate(docUri);
        await sleep(2000); // Wait for the diagnostics to compute on this file
		await testDiagnostics(docUri, [
			{
				severity: vscode.DiagnosticSeverity.Error,
				message: '[cfn-lint] E3002: Invalid Property Resources/RootRole/Properties/BadKey',
				range: toRange(5, 6, 5, 12)
			}
		]);
	});
});

suite('Previews should work', () => {
	const docUri = 'preview.yaml';
	const dotUri = 'preview.yaml.dot';

	test('Does NOT create .dot file if a preview was not requested', async () => {
		await activate(getDocUri(docUri));

		assert.strictEqual(! fs.existsSync(getDocPath(dotUri)), true);
	});

	test('Does create .dot file if a preview was requested', async () => {
		await activateAndPreview(getDocUri(docUri));

		assert.strictEqual(fs.existsSync(getDocPath(dotUri)), true);

		// cleanup
		fs.unlinkSync(getDocPath(dotUri));
	});
});

function toRange(sLine: number, sChar: number, eLine: number, eChar: number) {
	const start = new vscode.Position(sLine, sChar);
	const end = new vscode.Position(eLine, eChar);
	return new vscode.Range(start, end);
}

