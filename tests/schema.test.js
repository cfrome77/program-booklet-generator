import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProject, CURRENT_SCHEMA_VERSION, CURRENT_GENERATOR_VERSION } from '../src/utils/schemaValidator.js';
import { migrateProject } from '../src/utils/migrations.js';
import { PRESETS } from '../src/presets/index.js';
import { bookletReducer, INITIAL_STATE } from '../src/context/bookletReducer.js';

test('Project Metadata - Default presets contain required metadata', () => {
  ['blank', 'generic', 'oa75th'].forEach((presetKey) => {
    const preset = PRESETS[presetKey];
    assert.ok(preset, `Preset ${presetKey} should exist`);
    assert.equal(preset.schemaVersion, CURRENT_SCHEMA_VERSION);
    assert.equal(preset.generatorVersion, CURRENT_GENERATOR_VERSION);
    assert.ok(preset.createdAt, `Preset ${presetKey} missing createdAt`);
    assert.ok(preset.updatedAt, `Preset ${presetKey} missing updatedAt`);
    assert.ok(preset.title, `Preset ${presetKey} missing title`);
  });
});

test('Schema Validation - Validates default presets as valid', () => {
  ['blank', 'generic', 'oa75th'].forEach((presetKey) => {
    const preset = PRESETS[presetKey];
    const res = validateProject(preset);
    assert.equal(res.valid, true, `Preset ${presetKey} failed schema validation: ${JSON.stringify(res.errors)}`);
    assert.equal(res.errors.length, 0);
  });
});

test('Schema Validation - Rejects invalid project structures', () => {
  const nonObject = "not an object";
  assert.equal(validateProject(nonObject).valid, false);

  const arrayObj = [{ title: "Array instead of object" }];
  assert.equal(validateProject(arrayObj).valid, false);

  const missingTitle = {
    schemaVersion: "1.0.0",
    pages: [{ id: "p1", type: "custom", title: "Page 1" }]
  };
  const titleRes = validateProject(missingTitle);
  assert.equal(titleRes.valid, false);
  assert.ok(titleRes.errors.some(e => e.path === 'title'));
});

test('Schema Validation - Rejects project merely for having Array.isArray(pages)', () => {
  // Fake object that passes simple Array.isArray(pages) check
  const fakeProject = {
    pages: [
      { type: "invalid_page_type", blocks: "not_an_array" },
      { id: "p2", type: "custom", emblemOffsetX: NaN }
    ]
  };

  const res = validateProject(fakeProject);
  assert.equal(res.valid, false, "Should reject fake project despite Array.isArray(pages)");
  assert.ok(res.errors.length > 0);
  assert.ok(res.errors.some(e => e.path === 'schemaVersion'));
  assert.ok(res.errors.some(e => e.path === 'title'));
  assert.ok(res.errors.some(e => e.path.includes('type')));
});

test('Schema Validation - Rejects invalid page types and block types', () => {
  const project = {
    schemaVersion: "1.0.0",
    generatorVersion: "0.1.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: "Test Booklet",
    pages: [
      {
        id: "p1",
        type: "non_existent_type",
        blocks: [
          { id: "b1", type: "invalid_block_type", text: "Hello" }
        ]
      }
    ]
  };

  const res = validateProject(project);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.path === 'pages[0].type'));
  assert.ok(res.errors.some(e => e.path === 'pages[0].blocks[0].type'));
});

test('Schema Validation - Rejects invalid layout numbers (NaN, Infinity)', () => {
  const project = {
    schemaVersion: "1.0.0",
    generatorVersion: "0.1.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: "Test Booklet",
    pages: [
      {
        id: "p1",
        type: "cover",
        emblemOffsetX: NaN,
        blocks: [
          { id: "b1", type: "heading", text: "Title", width: Infinity }
        ]
      }
    ]
  };

  const res = validateProject(project);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.path === 'pages[0].emblemOffsetX'));
  assert.ok(res.errors.some(e => e.path === 'pages[0].blocks[0].width'));
});

test('Migration Layer - Upgrades legacy unversioned data to 1.0.0', () => {
  const legacyData = {
    title: "Old Legacy Project",
    pages: [
      {
        type: "cover",
        title: "Legacy Cover",
        emblemOffsetX: NaN, // Should be cleaned up
        blocks: [
          { type: "paragraph", text: "Legacy block text" }
        ]
      }
    ]
  };

  const migrated = migrateProject(legacyData);
  assert.equal(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(migrated.generatorVersion, CURRENT_GENERATOR_VERSION);
  assert.ok(migrated.createdAt);
  assert.ok(migrated.updatedAt);
  assert.equal(migrated.title, "Old Legacy Project");
  assert.equal(migrated.pages.length, 1);
  assert.ok(migrated.pages[0].id, "Page ID should be assigned");
  assert.equal(migrated.pages[0].emblemOffsetX, undefined, "NaN layout property should be cleaned up");
  assert.ok(migrated.pages[0].blocks[0].id, "Block ID should be assigned");

  // Verify migrated project is valid
  const val = validateProject(migrated);
  assert.equal(val.valid, true, `Migrated legacy project should pass validation: ${JSON.stringify(val.errors)}`);
});

test('Export & Import Round Trip - Reducer handles JSON import and metadata updating', () => {
  const initial = INITIAL_STATE;

  // Export current booklet
  const exportPayload = {
    ...initial.booklet,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    generatorVersion: CURRENT_GENERATOR_VERSION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: "Roundtrip Test Booklet"
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);

  // Import into reducer
  const parsed = JSON.parse(jsonString);
  const nextState = bookletReducer(initial, {
    type: 'IMPORT_JSON',
    data: parsed
  });

  assert.equal(nextState.jsonState.importError, null);
  assert.equal(nextState.booklet.title, "Roundtrip Test Booklet");
  assert.equal(nextState.booklet.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(nextState.booklet.generatorVersion, CURRENT_GENERATOR_VERSION);
  assert.ok(nextState.jsonState.lastImportedAt);
});

test('Import JSON - Gracefully reports errors on invalid inputs', () => {
  const initial = INITIAL_STATE;

  const invalidJsonObj = {
    title: "Bad Project",
    pages: "this is not an array of pages"
  };

  const nextState = bookletReducer(initial, {
    type: 'IMPORT_JSON',
    data: invalidJsonObj
  });

  assert.ok(nextState.jsonState.importError);
  assert.ok(nextState.jsonState.importError.includes("Project validation failed"));
});
