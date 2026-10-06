import test from 'node:test';
import assert from 'node:assert/strict';
import { saveAutosaveSession, getAutosaveSession, clearAutosaveSession } from '../src/utils/storage.js';
import { bookletReducer, INITIAL_STATE } from '../src/context/bookletReducer.js';

test('Storage Utils - Fallback to localStorage in Node/non-browser env', async () => {
  // Mock global localStorage in Node env
  const storage = new Map();
  globalThis.localStorage = {
    setItem: (k, v) => storage.set(k, v),
    getItem: (k) => storage.get(k) || null,
    removeItem: (k) => storage.delete(k)
  };

  const sampleData = {
    booklet: { title: 'Test Booklet', pages: [{ id: 'p1', title: 'Page 1' }] },
    activePresetKey: 'custom',
    timestamp: 1700000000000
  };

  const saved = await saveAutosaveSession(sampleData);
  assert.equal(saved.booklet.title, 'Test Booklet');
  assert.equal(saved.activePresetKey, 'custom');
  assert.equal(saved.timestamp, 1700000000000);

  const retrieved = await getAutosaveSession();
  assert.notEqual(retrieved, null);
  assert.equal(retrieved.booklet.title, 'Test Booklet');
  assert.equal(retrieved.activePresetKey, 'custom');

  const cleared = await clearAutosaveSession();
  assert.equal(cleared, true);

  const retrievedAfterClear = await getAutosaveSession();
  assert.equal(retrievedAfterClear, null);

  delete globalThis.localStorage;
});

test('Booklet Reducer - RESTORE_SESSION Action', () => {
  const initial = INITIAL_STATE;
  const restoredBooklet = {
    title: 'Restored Project',
    pages: [{ id: 'p1', type: 'custom', title: 'Restored Page' }]
  };

  const nextState = bookletReducer(initial, {
    type: 'RESTORE_SESSION',
    booklet: restoredBooklet,
    activePresetKey: 'custom'
  });

  assert.equal(nextState.booklet.title, 'Restored Project');
  assert.equal(nextState.activePresetKey, 'custom');
  assert.equal(nextState.booklet.pages.length, 1);
  assert.equal(nextState.history.past.length, 0);
});
