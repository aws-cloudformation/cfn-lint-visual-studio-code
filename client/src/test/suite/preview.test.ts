
import * as assert from 'assert';
import * as fs from 'fs';
import { getDocUri, activate, activateAndPreview, getDocPath } from './helper';

suite('Previews should work', () => {
	const fixtureFolder = 'validation';
	const docUri = 'preview.yaml';
	const dotUri = 'preview.yaml.dot';

	test('Does NOT create .dot file if a preview was not requested', async () => {
		await activate(getDocUri(fixtureFolder, docUri));

		assert.strictEqual(! fs.existsSync(getDocPath(fixtureFolder, dotUri)), true);
	});

	test('Does create .dot file if a preview was requested', async () => {
		await activateAndPreview(getDocUri(fixtureFolder, docUri));

		assert.strictEqual(fs.existsSync(getDocPath(fixtureFolder, dotUri)), true);

		// cleanup
		fs.unlinkSync(getDocPath(fixtureFolder, dotUri));
	});
});
