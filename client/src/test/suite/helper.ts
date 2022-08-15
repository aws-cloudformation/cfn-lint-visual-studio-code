/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import * as assert from 'assert';
import * as path from 'path';

export let doc: vscode.TextDocument;
export let editor: vscode.TextEditor;
export let documentEol: string;
export let platformEol: string;

/**
 * Activates the kddejong.vscode-cfn-lint extension
 */
export async function activate(docUri: vscode.Uri): Promise<any> {
	const extension = vscode.extensions.getExtension("kddejong.vscode-cfn-lint");
	const activation = await extension?.activate();

	try {
		doc = await vscode.workspace.openTextDocument(docUri);
		editor = await vscode.window.showTextDocument(doc, {
			preview: true,
			preserveFocus: false,
		});

		await sleep(5000);
		return activation;
	} catch (e) {
		console.error("Error from activation -> ", e);
	}
}

export async function activateAndPreview(docUri: vscode.Uri) {
	await activate(docUri);

	await vscode.commands.executeCommand('extension.sidePreview');

	await sleep(4000); // Wait for preview to become available
}

export async function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export const getDocPath = (d: string, p: string) => {
	return path.resolve(__dirname, '../../../src/test/suite/fixtures', d, p);
};

export const getDocUri = (d: string, p: string) => {
	return vscode.Uri.file(getDocPath(d, p));
};

export async function setTestContent(content: string): Promise<boolean> {
	const all = new vscode.Range(
		doc.positionAt(0),
		doc.positionAt(doc.getText().length)
	);
	return editor.edit(eb => eb.replace(all, content));
}

export async function testDiagnostics(docUri: vscode.Uri, expectedDiagnostics: vscode.Diagnostic[]) {
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

