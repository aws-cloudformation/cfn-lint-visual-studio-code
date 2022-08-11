
import * as vscode from 'vscode';
import assert = require('assert');
import { getDocUri, activate } from './helper';


suite('Should code complete', () => {
	const docUri = getDocUri('completion', 'completion.yaml');

	test('Complete on empty template', async () => {
		await activate(docUri);

		await testCompletion(docUri, new vscode.Position(0, 0), {
			items: [
				{
					label: '!And',
					kind: 11,
				},
				{
					label: '!Base64',
					kind: 11,
				},
				{
					label: '!Cidr',
					kind: 11,
				},
				{
					label: '!Equals',
					kind: 11,
				},
				{
					label: '!FindInMap',
					kind: 11,
				},
				{
					label: '!GetAtt',
					kind: 11,
				},
				{
					label: '!GetAZs',
					kind: 11,
				},
				{
					label: '!If',
					kind: 11,
				},
				{
					label: '!ImportValue',
					kind: 11,
				},
				{
					label: '!Join',
					kind: 11,
				},
				{
					label: '!Not',
					kind: 11,
				},
				{
					label: '!Or',
					kind: 11,
				},
				{
					label: '!Ref',
					kind: 11,
				},
				{
					label: '!Select',
					kind: 11,
				},
				{
					label: '!Split',
					kind: 11,
				},
				{
					label: '!Sub',
					kind: 11,
				},
				{
					label: 'object',
					kind: 6,
				},
				{
					label: 'AWSTemplateFormatVersion',
					kind: 9,
				},
				{
					label: 'Conditions',
					kind: 9,
				},
				{
					label: 'Description',
					kind: 9,
				},
				{
					label: 'Hooks',
					kind: 9,
				},
				{
					label: 'Mappings',
					kind: 9,
				},
				{
					label: 'Metadata',
					kind: 9,
				},
				{
					label: 'Outputs',
					kind: 9,
				},
				{
					label: 'Parameters',
					kind: 9,
				},
				{
					label: 'Resources',
					kind: 9,
				},
				{
					label: 'Rules',
					kind: 9,
				},
				{
					label: 'Transform',
					kind: 9,
				},
			],
		});
	});
});


export async function testCompletion(
	docUri: vscode.Uri,
	position: vscode.Position,
	expectedCompletionList: vscode.CompletionList
): Promise<void> {
	// Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
	const actualCompletionList = (await vscode.commands.executeCommand(
		'vscode.executeCompletionItemProvider',
		docUri,
		position
	)) as vscode.CompletionList;

	const sortedActualCompletionList = actualCompletionList.items.sort((a, b) => (a.label > b.label ? 1 : -1));

	assert.equal(
		actualCompletionList.items.length,
		expectedCompletionList.items.length,
		"Completion List doesn't have expected size"
	);
	expectedCompletionList.items
		.sort((a, b) => (a.label > b.label ? 1 : -1))
		.forEach((expectedItem, i) => {
			const actualItem = sortedActualCompletionList[i];
			assert.equal(actualItem.label, expectedItem.label, `Actual Label: ${actualItem.label} != Expected ${expectedItem.label}`);
			assert.equal(actualItem.kind, expectedItem.kind, `Actual Kind: ${actualItem.kind} != Expected ${expectedItem.kind} for ${actualItem.label}`);
		});
}
