import test from 'node:test';
import assert from 'node:assert/strict';
import { bookletReducer, INITIAL_STATE } from '../src/context/bookletReducer.js';
import { validateProject } from '../src/utils/schemaValidator.js';
import { runPreflight } from '../src/utils/preflight.js';

test('Block Types - bookletReducer initializes and manages all block types', async (t) => {
  const blockTypes = [
    'richText',
    'list',
    'table',
    'quote',
    'image',
    'imageText',
    'twoColumn',
    'threeColumn',
    'divider',
    'spacer',
    'qrCode',
    'logo',
    'photoGrid',
    'caption'
  ];

  let state = bookletReducer(INITIAL_STATE, { type: 'LOAD_PRESET', presetKey: 'blank' });

  await t.test('adds content block for each supported type', () => {
    blockTypes.forEach((bType) => {
      state = bookletReducer(state, { type: 'ADD_CONTENT_BLOCK', pageIndex: 0, blockType: bType });
    });

    const pageBlocks = state.booklet.pages[0].blocks;
    assert.equal(pageBlocks.length, blockTypes.length);

    blockTypes.forEach((bType, idx) => {
      assert.equal(pageBlocks[idx].type, bType);
    });
  });

  await t.test('project passes schema validation with all block types present', () => {
    const validation = validateProject(state.booklet);
    assert.equal(validation.valid, true, `Validation errors: ${JSON.stringify(validation.errors)}`);
  });

  await t.test('preflight inspection passes without fatal errors for configured blocks', () => {
    const preflight = runPreflight(state.booklet);
    assert.equal(preflight.counts.errors, 0, `Preflight errors: ${JSON.stringify(preflight.errors)}`);
  });

  await t.test('validates qrCode block with errorCorrection and size properties', () => {
    let qrState = bookletReducer(INITIAL_STATE, { type: 'LOAD_PRESET', presetKey: 'blank' });
    qrState = bookletReducer(qrState, { type: 'ADD_CONTENT_BLOCK', pageIndex: 0, blockType: 'qrCode' });
    const blockIndex = qrState.booklet.pages[0].blocks.length - 1;

    qrState = bookletReducer(qrState, {
      type: 'UPDATE_CONTENT_BLOCK',
      pageIndex: 0,
      blockIndex,
      field: 'qrUrl',
      value: 'https://example.com/live-schedule'
    });
    qrState = bookletReducer(qrState, {
      type: 'UPDATE_CONTENT_BLOCK',
      pageIndex: 0,
      blockIndex,
      field: 'errorCorrection',
      value: 'H'
    });
    qrState = bookletReducer(qrState, {
      type: 'UPDATE_CONTENT_BLOCK',
      pageIndex: 0,
      blockIndex,
      field: 'qrSize',
      value: 120
    });

    const validation = validateProject(qrState.booklet);
    assert.equal(validation.valid, true, `Validation errors: ${JSON.stringify(validation.errors)}`);

    const preflight = runPreflight(qrState.booklet);
    assert.equal(preflight.counts.errors, 0);
  });

  await t.test('preflight detects invalid QR code content with a warning', () => {
    let qrState = bookletReducer(INITIAL_STATE, { type: 'LOAD_PRESET', presetKey: 'blank' });
    qrState = bookletReducer(qrState, { type: 'ADD_CONTENT_BLOCK', pageIndex: 0, blockType: 'qrCode' });
    const blockIndex = qrState.booklet.pages[0].blocks.length - 1;

    qrState = bookletReducer(qrState, {
      type: 'UPDATE_CONTENT_BLOCK',
      pageIndex: 0,
      blockIndex,
      field: 'qrUrl',
      value: ''
    });

    const preflight = runPreflight(qrState.booklet);
    const qrWarning = preflight.issues.find((i) => i.message.includes('QR Code') && i.severity === 'WARNING');
    assert.ok(qrWarning, 'Expected preflight warning for empty QR code block');
  });
});
