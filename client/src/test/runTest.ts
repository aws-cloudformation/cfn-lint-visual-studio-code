import * as path from 'path';
import { runTests } from 'vscode-test';

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../../');

		// The path to the extension test runner script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		const cp = require('child_process');
		const { downloadAndUnzipVSCode, resolveCliPathFromVSCodeExecutablePath } = require('vscode-test');
		const vscodeExecutablePath = await downloadAndUnzipVSCode('1.61.0');
		const cliPath = resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath);

		// Use cp.spawn / cp.exec for custom setup
		cp.spawnSync(cliPath, ['--install-extension', 'redhat.vscode-yaml'], {
			encoding: 'utf-8',
			stdio: 'inherit'
		});

		// Download VS Code, unzip it and run the integration test
		await runTests({
			vscodeExecutablePath,
			extensionDevelopmentPath,
			extensionTestsPath,
		});
	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();