import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { bookletReducer, INITIAL_STATE } from '../src/context/bookletReducer.js';

describe('Document History, Undo/Redo & Coalescing Tests', () => {
  test('Page creation, duplication, reorder, and deletion can be undone and redone', () => {
    let state = INITIAL_STATE;
    const initialPageCount = state.booklet.pages.length;

    // 1. Page creation
    state = bookletReducer(state, { type: 'ADD_PAGE' });
    assert.equal(state.booklet.pages.length, initialPageCount + 1);
    assert.equal(state.history.past.length, 1);

    // 2. Page duplication
    state = bookletReducer(state, { type: 'DUPLICATE_PAGE', pageIndex: 0 });
    assert.equal(state.booklet.pages.length, initialPageCount + 2);
    assert.equal(state.history.past.length, 2);

    // 3. Page reorder
    state = bookletReducer(state, { type: 'MOVE_PAGE', pageIndex: 0, delta: 1 });
    assert.equal(state.history.past.length, 3);

    // 4. Page deletion
    state = bookletReducer(state, { type: 'DELETE_PAGE', pageIndex: 0 });
    assert.equal(state.booklet.pages.length, initialPageCount + 1);
    assert.equal(state.history.past.length, 4);

    // Undo Page Deletion
    state = bookletReducer(state, { type: 'UNDO' });
    assert.equal(state.booklet.pages.length, initialPageCount + 2);
    assert.equal(state.history.past.length, 3);
    assert.equal(state.history.future.length, 1);

    // Undo Page Reorder
    state = bookletReducer(state, { type: 'UNDO' });
    assert.equal(state.history.past.length, 2);
    assert.equal(state.history.future.length, 2);

    // Undo Page Duplication
    state = bookletReducer(state, { type: 'UNDO' });
    assert.equal(state.booklet.pages.length, initialPageCount + 1);

    // Undo Page Creation
    state = bookletReducer(state, { type: 'UNDO' });
    assert.equal(state.booklet.pages.length, initialPageCount);
    assert.equal(state.history.past.length, 0);

    // Redo all
    state = bookletReducer(state, { type: 'REDO' });
    assert.equal(state.booklet.pages.length, initialPageCount + 1);

    state = bookletReducer(state, { type: 'REDO' });
    assert.equal(state.booklet.pages.length, initialPageCount + 2);
  });

  test('Block creation, deletion, reorder, and editing can be undone and redone', () => {
    let state = INITIAL_STATE;
    const pageIndex = 0;

    // Add block
    state = bookletReducer(state, { type: 'ADD_CONTENT_BLOCK', pageIndex, blockType: 'heading' });
    const blockCountAfterAdd = state.booklet.pages[pageIndex].blocks.length;
    assert.ok(blockCountAfterAdd > 0);
    const initialBlockText = state.booklet.pages[pageIndex].blocks[blockCountAfterAdd - 1].text;

    // Edit block text
    state = bookletReducer(state, {
      type: 'UPDATE_CONTENT_BLOCK',
      pageIndex,
      blockIndex: blockCountAfterAdd - 1,
      field: 'text',
      value: 'Updated Heading Text'
    });
    assert.equal(state.booklet.pages[pageIndex].blocks[blockCountAfterAdd - 1].text, 'Updated Heading Text');

    // Undo block edit
    state = bookletReducer(state, { type: 'UNDO' });
    assert.equal(state.booklet.pages[pageIndex].blocks[blockCountAfterAdd - 1].text, initialBlockText);

    // Redo block edit
    state = bookletReducer(state, { type: 'REDO' });
    assert.equal(state.booklet.pages[pageIndex].blocks[blockCountAfterAdd - 1].text, 'Updated Heading Text');

    // Duplicate block
    state = bookletReducer(state, {
      type: 'DUPLICATE_CONTENT_BLOCK',
      pageIndex,
      blockIndex: blockCountAfterAdd - 1
    });
    assert.equal(state.booklet.pages[pageIndex].blocks.length, blockCountAfterAdd + 1);
    assert.equal(state.booklet.pages[pageIndex].blocks[blockCountAfterAdd].text, 'Updated Heading Text');

    // Undo block duplication
    state = bookletReducer(state, { type: 'UNDO' });
    assert.equal(state.booklet.pages[pageIndex].blocks.length, blockCountAfterAdd);

    // Redo block duplication
    state = bookletReducer(state, { type: 'REDO' });
    assert.equal(state.booklet.pages[pageIndex].blocks.length, blockCountAfterAdd + 1);

    // Delete block
    state = bookletReducer(state, {
      type: 'DELETE_CONTENT_BLOCK',
      pageIndex,
      blockIndex: blockCountAfterAdd
    });
    assert.equal(state.booklet.pages[pageIndex].blocks.length, blockCountAfterAdd);

    // Undo block deletion
    state = bookletReducer(state, { type: 'UNDO' });
    assert.equal(state.booklet.pages[pageIndex].blocks.length, blockCountAfterAdd + 1);
    assert.equal(state.booklet.pages[pageIndex].blocks[blockCountAfterAdd].text, 'Updated Heading Text');
  });

  test('Continuous edits (slider / drag) are coalesced into a single history entry', () => {
    let state = INITIAL_STATE;
    const initialPastLength = state.history.past.length;

    // Simulate 50 continuous slider movements during a single drag operation
    for (let i = 1; i <= 50; i++) {
      state = bookletReducer(state, {
        type: 'UPDATE_THEME_FIELD',
        field: 'bgImageOpacity',
        value: i,
        isContinuous: true
      });
    }

    // Instead of 50 new entries, coalescing results in exactly 1 new history entry!
    assert.equal(state.history.past.length, initialPastLength + 1);
    assert.equal(state.booklet.theme.bgImageOpacity, 50);

    // Performing Undo reverts back to the state BEFORE the slider drag began
    state = bookletReducer(state, { type: 'UNDO' });
    assert.equal(state.booklet.theme.bgImageOpacity, INITIAL_STATE.booklet.theme.bgImageOpacity || undefined);
    assert.equal(state.history.past.length, initialPastLength);
  });

  test('Layout, theme changes, preset loading and JSON imports are tracked in history', () => {
    let state = INITIAL_STATE;

    // Theme change
    state = bookletReducer(state, {
      type: 'UPDATE_THEME_FIELD',
      field: 'navyDark',
      value: '#ff0000'
    });
    assert.equal(state.booklet.theme.navyDark, '#ff0000');

    // Global field change
    state = bookletReducer(state, {
      type: 'UPDATE_GLOBAL_FIELD',
      field: 'title',
      value: 'My Custom Booklet Title'
    });
    assert.equal(state.booklet.title, 'My Custom Booklet Title');

    // Preset load
    state = bookletReducer(state, {
      type: 'LOAD_PRESET',
      presetKey: 'generic'
    });
    assert.equal(state.activePresetKey, 'generic');

    // Undo preset load
    state = bookletReducer(state, { type: 'UNDO' });
    assert.equal(state.booklet.title, 'My Custom Booklet Title');

    // Undo global title change
    state = bookletReducer(state, { type: 'UNDO' });
    assert.equal(state.booklet.theme.navyDark, '#ff0000');

    // Undo theme change
    state = bookletReducer(state, { type: 'UNDO' });
    assert.equal(state.booklet.theme.navyDark, INITIAL_STATE.booklet.theme.navyDark);
  });

  test('Transient UI state (guides, selectedElement, jsonState) is NOT recorded in document history', () => {
    let state = INITIAL_STATE;

    // Toggle guide
    const guideStateBefore = state.guides.showBleed;
    state = bookletReducer(state, { type: 'TOGGLE_GUIDE', guideKey: 'showBleed' });
    assert.equal(state.guides.showBleed, !guideStateBefore);
    assert.equal(state.history.past.length, 0); // No history entry created!

    // Select element
    state = bookletReducer(state, {
      type: 'SET_SELECTED_ELEMENT',
      selectedElement: { pageIndex: 0, blockIndex: 0, elementType: 'block' }
    });
    assert.equal(state.history.past.length, 0); // No history entry created!

    // Mark exported
    state = bookletReducer(state, { type: 'MARK_EXPORTED' });
    assert.equal(state.history.past.length, 0); // No history entry created!

    // Clear import error
    state = bookletReducer(state, { type: 'CLEAR_IMPORT_ERROR' });
    assert.equal(state.history.past.length, 0); // No history entry created!
  });
});
