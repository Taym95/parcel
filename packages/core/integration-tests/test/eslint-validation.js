import assert from 'assert';
import path from 'path';
import {bundle} from '@parcel/test-utils';
import defaultConfigContents from '@parcel/config-default';

const config = {
  ...defaultConfigContents,
  validators: {
    '*.{js,jsx,ts,tsx}': ['@parcel/validator-eslint'],
  },
  reporters: [],
  filePath: require.resolve('@parcel/config-default'),
};

describe('eslint-validator', function() {
  it('should throw validation error with eslint errors', async function() {
    let didThrow = false;
    let entry = path.join(__dirname, '/integration/eslint-error/index.js');
    try {
      await bundle(entry, {
        defaultConfig: config,
      });
    } catch (e) {
      assert.equal(e.name, 'BuildError');
      assert(Array.isArray(e.diagnostics));
      assert(e.diagnostics[0].codeFrame);
      assert.equal(e.diagnostics[0].origin, '@parcel/validator-eslint');
      assert.equal(
        e.diagnostics[0].message,
        'ESLint found **1** __errors__ and **1** __warnings__.',
      );
      assert.equal(e.diagnostics[0].filePath, entry);

      let codeframe = e.diagnostics[0].codeFrame;
      assert(codeframe);
      assert.equal(codeframe.codeHighlights.length, 2);
      codeframe.codeHighlights.sort(
        ({start: {line: a}}, {start: {line: b}}) => a - b,
      );
      assert.equal(
        codeframe.codeHighlights[0].message,
        'Unexpected console statement.',
      );
      assert.equal(
        codeframe.codeHighlights[1].message,
        "'hey' is assigned a value but never used.",
      );
      didThrow = true;
    }

    assert(didThrow);
  });

  it('should throw a correct codeframe for a parse error', async function() {
    let didThrow = false;
    let entry = path.join(
      __dirname,
      '/integration/eslint-parse-error/index.js',
    );
    try {
      await bundle(entry, {
        defaultConfig: config,
      });
    } catch (e) {
      assert.equal(e.name, 'BuildError');
      assert(Array.isArray(e.diagnostics));
      assert.equal(e.diagnostics[0].origin, '@parcel/validator-eslint');
      assert.equal(
        e.diagnostics[0].message,
        'ESLint found **1** __errors__ and **0** __warnings__.',
      );
      assert.equal(e.diagnostics[0].filePath, entry);

      let codeframe = e.diagnostics[0].codeFrame;
      assert(codeframe);
      assert.equal(codeframe.codeHighlights.length, 1);
      assert(codeframe.codeHighlights[0].start.line != null);
      assert(codeframe.codeHighlights[0].start.column != null);
      assert(codeframe.codeHighlights[0].end.line != null);
      assert(codeframe.codeHighlights[0].end.column != null);
      assert(codeframe.codeHighlights[0].message.startsWith('Parsing error'));

      didThrow = true;
    }

    assert(didThrow);
  });
});
