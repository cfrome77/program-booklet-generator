import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAssetObject,
  resolveAssetUrl,
  resolveAssetMeta,
  getUnusedAssets,
  getBrokenImageReferences,
  getAllReferencedImageRefs,
  calculateBase64Size,
  detectMimeType
} from '../src/utils/assets.js';
import { bookletReducer, INITIAL_STATE } from '../src/context/bookletReducer.js';
import { migrateProject } from '../src/utils/migrations.js';
import { validateProject } from '../src/utils/schemaValidator.js';
import { runPreflight } from '../src/utils/preflight.js';

const SAMPLE_DATA_URI_1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const SAMPLE_DATA_URI_2 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

test('Assets - createAssetObject creates normalized metadata structure', () => {
  const asset = createAssetObject({
    name: 'logo.png',
    mimeType: 'image/png',
    width: 400,
    height: 300,
    size: 2048,
    src: SAMPLE_DATA_URI_1
  });

  assert.ok(asset.id.startsWith('asset-'));
  assert.equal(asset.name, 'logo.png');
  assert.equal(asset.filename, 'logo.png');
  assert.equal(asset.mimeType, 'image/png');
  assert.equal(asset.width, 400);
  assert.equal(asset.height, 300);
  assert.equal(asset.size, 2048);
  assert.equal(asset.fileSize, 2048);
  assert.equal(asset.src, SAMPLE_DATA_URI_1);
  assert.ok(asset.createdAt);
});

test('Assets - resolveAssetUrl and resolveAssetMeta resolve asset IDs and direct URLs', () => {
  const asset1 = createAssetObject({ id: 'asset-001', name: 'img1.png', src: SAMPLE_DATA_URI_1 });
  const booklet = {
    assets: [asset1],
    pages: []
  };

  assert.equal(resolveAssetUrl(booklet, 'asset-001'), SAMPLE_DATA_URI_1);
  assert.equal(resolveAssetUrl(booklet, 'asset:asset-001'), SAMPLE_DATA_URI_1);
  assert.equal(resolveAssetUrl(booklet, 'https://example.com/test.jpg'), 'https://example.com/test.jpg');
  assert.equal(resolveAssetUrl(booklet, ''), '');

  const meta = resolveAssetMeta(booklet, 'asset-001');
  assert.ok(meta);
  assert.equal(meta.id, 'asset-001');
  assert.equal(meta.name, 'img1.png');
});

test('Assets - bookletReducer handles ADD_ASSET, REMOVE_ASSET, and PURGE_UNUSED_ASSETS', () => {
  let state = INITIAL_STATE;

  const asset1 = createAssetObject({ id: 'asset-101', name: 'Header Logo', src: SAMPLE_DATA_URI_1 });
  const asset2 = createAssetObject({ id: 'asset-102', name: 'Unused Background', src: SAMPLE_DATA_URI_2 });

  // 1. ADD_ASSET
  state = bookletReducer(state, { type: 'ADD_ASSET', asset: asset1 });
  state = bookletReducer(state, { type: 'ADD_ASSET', asset: asset2 });
  assert.equal(state.booklet.assets.length, 2);

  // Reference asset1 in a page block
  state = bookletReducer(state, {
    type: 'ADD_CONTENT_BLOCK',
    pageIndex: 0,
    blockType: 'image'
  });
  state = bookletReducer(state, {
    type: 'UPDATE_CONTENT_BLOCK',
    pageIndex: 0,
    blockIndex: 0,
    field: 'url',
    value: 'asset-101'
  });

  // 2. PURGE_UNUSED_ASSETS (asset2 is unused, asset1 is used)
  state = bookletReducer(state, { type: 'PURGE_UNUSED_ASSETS' });
  assert.equal(state.booklet.assets.length, 1);
  assert.equal(state.booklet.assets[0].id, 'asset-101');

  // 3. REMOVE_ASSET
  state = bookletReducer(state, { type: 'REMOVE_ASSET', assetId: 'asset-101' });
  assert.equal(state.booklet.assets.length, 0);
});

test('Assets - Reuse same asset across multiple pages', () => {
  let state = INITIAL_STATE;
  const sharedAsset = createAssetObject({ id: 'asset-shared', name: 'Lodge Emblem', src: SAMPLE_DATA_URI_1 });

  state = bookletReducer(state, { type: 'ADD_ASSET', asset: sharedAsset });

  // Use on Page 1 cover emblem
  state = bookletReducer(state, {
    type: 'UPDATE_PAGE_FIELD',
    pageIndex: 0,
    field: 'emblemImg',
    value: 'asset-shared'
  });

  // Add Page 2 and use in an image block
  state = bookletReducer(state, { type: 'ADD_PAGE' });
  state = bookletReducer(state, { type: 'ADD_CONTENT_BLOCK', pageIndex: 1, blockType: 'image' });
  state = bookletReducer(state, { type: 'UPDATE_CONTENT_BLOCK', pageIndex: 1, blockIndex: 0, field: 'url', value: 'asset-shared' });

  const refs = getAllReferencedImageRefs(state.booklet);
  assert.ok(refs.has('asset-shared'));

  const resolvedPage1 = resolveAssetUrl(state.booklet, state.booklet.pages[0].emblemImg);
  const resolvedPage2 = resolveAssetUrl(state.booklet, state.booklet.pages[1].blocks[0].url);

  assert.equal(resolvedPage1, SAMPLE_DATA_URI_1);
  assert.equal(resolvedPage2, SAMPLE_DATA_URI_1);
});

test('Assets - Migration layer converts embedded data URIs to asset registry', () => {
  const legacyBooklet = {
    title: 'Legacy Image Booklet',
    theme: {
      bgImage: SAMPLE_DATA_URI_1
    },
    pages: [
      {
        id: 'p1',
        type: 'cover',
        emblemImg: SAMPLE_DATA_URI_1, // Same base64 URI
        blocks: [
          { id: 'b1', type: 'image', url: SAMPLE_DATA_URI_2 }
        ]
      }
    ]
  };

  const migrated = migrateProject(legacyBooklet);

  assert.ok(Array.isArray(migrated.assets));
  assert.equal(migrated.assets.length, 2, 'Duplicates should be deduplicated');

  // Verify fields were replaced with asset IDs
  assert.ok(migrated.theme.bgImage.startsWith('asset-'));
  assert.equal(migrated.pages[0].emblemImg, migrated.theme.bgImage, 'Identical base64 URIs should share the same asset ID');
  assert.ok(migrated.pages[0].blocks[0].url.startsWith('asset-'));

  // Validation check
  const val = validateProject(migrated);
  assert.equal(val.valid, true, `Migrated asset booklet should be valid: ${JSON.stringify(val.errors)}`);
});

test('Assets - Preflight engine detects unused assets and broken image references', () => {
  const validAsset = createAssetObject({ id: 'asset-valid', name: 'Valid Banner', src: SAMPLE_DATA_URI_1 });
  const unusedAsset = createAssetObject({ id: 'asset-unused', name: 'Unused Extra Photo', src: SAMPLE_DATA_URI_2 });
  const brokenAsset = createAssetObject({ id: 'asset-empty-src', name: 'Broken Corrupt Asset', src: '' });

  const booklet = {
    schemaVersion: '1.0.0',
    title: 'Preflight Assets Test',
    assets: [validAsset, unusedAsset, brokenAsset],
    theme: { bgImage: 'asset-valid' },
    pages: [
      {
        id: 'p1',
        type: 'cover',
        title: 'Cover Page',
        emblemImg: 'asset-non-existent' // Points to missing asset ID
      }
    ]
  };

  const preflight = runPreflight(booklet);

  assert.equal(preflight.status, 'PRINT BLOCKED');
  assert.ok(preflight.issues.some((i) => i.message.includes('Unused image asset "Unused Extra Photo"')));
  assert.ok(preflight.issues.some((i) => i.message.includes('asset-non-existent')));
  assert.ok(preflight.issues.some((i) => i.message.includes('Broken Corrupt Asset')));
});

test('Assets - Schema validation verifies asset objects structure', () => {
  const invalidAssetProject = {
    schemaVersion: '1.0.0',
    title: 'Invalid Asset Schema',
    assets: [
      { id: 'a1' } // Missing name and src
    ],
    pages: [{ id: 'p1', type: 'custom', title: 'P1' }]
  };

  const val = validateProject(invalidAssetProject);
  assert.equal(val.valid, false);
  assert.ok(val.errors.some((e) => e.path === 'assets[0].name'));
  assert.ok(val.errors.some((e) => e.path === 'assets[0].src'));
});
