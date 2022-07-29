import * as path from 'path';
import * as os from "os";
import { downloadAndUnzipVSCode,
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

		// Download VS Code, unzip it and run the integration test
		await runTests({
			vscodeExecutablePath,
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: ['--disable-extensions', '--user-data-dir', `${os.tmpdir()}`],
		});
	} catch (err) {
		console.error(`Failed to run tests: ${err}`);
		process.exit(1);
	}
}

main();