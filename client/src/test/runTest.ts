import * as path from 'path';
import * as cp from 'child_process';
import * as os from "os";
import { downloadAndUnzipVSCode,
	resolveCliArgsFromVSCodeExecutablePath,
	runTests,
 } from '@vscode/test-electron';

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../../');

		// The path to the extension test runner script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		const vscodeExecutablePath = await downloadAndUnzipVSCode('1.69.1');
		const [cli, ...args] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);

		// Use cp.spawn / cp.exec for custom setup
		cp.spawnSync(cli, [...args, '--install-extension', 'redhat.vscode-yaml'], {
			encoding: 'utf-8',
			stdio: 'inherit'
		});

		// Download VS Code, unzip it and run the integration test
		await runTests({
			vscodeExecutablePath,
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: ['--user-data-dir', `${os.tmpdir()}`],
		});
	} catch (err) {
		console.error(`Failed to run tests: ${err}`);
		process.exit(1);
	}
}

main();