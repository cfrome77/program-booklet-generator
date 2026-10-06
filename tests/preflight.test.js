import test from 'node:test';
import assert from 'node:assert/strict';
import { runPreflight } from '../src/utils/preflight.js';
import { oa75thPreset } from '../src/presets/oa75th.js';
import { bookletReducer, INITIAL_STATE } from '../src/context/bookletReducer.js';

test('Preflight Engine Tests', async (t) => {
  await t.test('returns READY TO PRINT for a valid preset booklet', () => {
    const result = runPreflight(oa75thPreset);
    assert.equal(result.status, 'READY TO PRINT');
    assert.equal(result.isReady, true);
    assert.equal(result.counts.errors, 0);
    assert.equal(result.specs.rawPageCount, 11);
    assert.equal(result.specs.paddedPageCount, 12);
    assert.equal(result.specs.totalSheets, 3);
    assert.equal(result.specs.pageSize, '5.5 × 8.5 inch pages');
    assert.equal(result.specs.paperSize, '8.5 × 11 inch paper');
    assert.equal(result.specs.bindingMethod, 'Saddle stitch');
    assert.ok(result.summaryText.includes('READY TO PRINT'));
  });

  await t.test('detects empty booklet as ERROR', () => {
    const emptyBooklet = { title: 'Empty', pages: [] };
    const result = runPreflight(emptyBooklet);

    assert.equal(result.status, 'PRINT BLOCKED');
    assert.equal(result.isReady, false);
    assert.ok(result.counts.errors >= 1);
    const emptyErr = result.errors.find((e) => e.category === 'Page Structure' && e.message.includes('contains no pages'));
    assert.ok(emptyErr);
  });

  await t.test('detects duplicate page IDs as ERROR', () => {
    const booklet = {
      title: 'Dup ID',
      pages: [
        { id: 'p1', type: 'cover', title: 'Cover' },
        { id: 'p1', type: 'custom', content: 'Test' }
      ]
    };
    const result = runPreflight(booklet);
    assert.equal(result.status, 'PRINT BLOCKED');
    const dupErr = result.errors.find((e) => e.message.includes('Duplicate page ID "p1"'));
    assert.ok(dupErr);
  });

  await t.test('detects invalid page type as ERROR', () => {
    const booklet = {
      title: 'Bad Type',
      pages: [
        { id: 'p1', type: 'invalid_type_xyz', title: 'Bad' }
      ]
    };
    const result = runPreflight(booklet);
    assert.equal(result.status, 'PRINT BLOCKED');
    const typeErr = result.errors.find((e) => e.message.includes('unrecognized or invalid page type'));
    assert.ok(typeErr);
  });

  await t.test('detects missing block image URL and empty block text as WARNING', () => {
    const booklet = {
      title: 'Block Test',
      pages: [
        {
          id: 'p1',
          type: 'custom',
          content: 'Some text',
          blocks: [
            { type: 'image', url: '' },
            { type: 'heading', text: '   ' }
          ]
        }
      ]
    };
    const result = runPreflight(booklet);
    assert.equal(result.status, 'READY TO PRINT'); // Warnings do not block print
    const imgWarn = result.warnings.find((w) => w.message.includes('has no image URL'));
    const headWarn = result.warnings.find((w) => w.message.includes('heading) is empty'));
    assert.ok(imgWarn);
    assert.ok(headWarn);
  });

  await t.test('detects invalid coordinates and dimensions as ERROR / WARNING', () => {
    const booklet = {
      title: 'Bad Coords',
      pages: [
        {
          id: 'p1',
          type: 'custom',
          mainContentOffsetX: NaN,
          mainContentWidth: -50,
          blocks: [
            { type: 'paragraph', text: 'Test', offsetX: 300, height: 5 }
          ]
        }
      ]
    };
    const result = runPreflight(booklet);
    assert.equal(result.status, 'PRINT BLOCKED');
    const nanErr = result.errors.find((e) => e.message.includes('invalid non-numeric X offset'));
    const widthErr = result.errors.find((e) => e.message.includes('invalid width dimension'));
    const shiftWarn = result.warnings.find((w) => w.message.includes('shifted far horizontally'));
    const clipWarn = result.warnings.find((w) => w.message.includes('potential text clipping'));
    assert.ok(nanErr);
    assert.ok(widthErr);
    assert.ok(shiftWarn);
    assert.ok(clipWarn);
  });

  await t.test('detects suspiciously small font size in custom HTML', () => {
    const booklet = {
      title: 'Small Text',
      pages: [
        {
          id: 'p1',
          type: 'custom',
          content: '<span style="font-size: 4pt;">Tiny Text</span>'
        }
      ]
    };
    const result = runPreflight(booklet);
    const smallTextWarn = result.warnings.find((w) => w.category === 'Typography' && w.message.includes('suspiciously small font-size'));
    assert.ok(smallTextWarn);
  });

  await t.test('correctly calculates saddle stitch imposition and padding info', () => {
    const booklet = {
      title: '3 Pages',
      pages: [
        { id: 'p1', type: 'cover', title: 'Cover' },
        { id: 'p2', type: 'custom', content: 'Page 2' },
        { id: 'p3', type: 'backCover', organization: 'Org' }
      ]
    };
    const result = runPreflight(booklet);
    assert.equal(result.status, 'READY TO PRINT');
    assert.equal(result.specs.rawPageCount, 3);
    assert.equal(result.specs.paddedPageCount, 4);
    assert.equal(result.specs.paddingAdded, 1);
    assert.equal(result.specs.totalSheets, 1);
    const infoMsg = result.info.find((i) => i.category === 'Page Structure' && i.message.includes('Page count (3) is not divisible by 4'));
    assert.ok(infoMsg);
  });

  await t.test('detects content overflow extending beyond physical page bounds', () => {
    // 1. Static estimation overflow check
    const booklet = {
      title: 'Overflow Test',
      pages: Array.from({ length: 7 }, (_, i) => ({
        id: `p${i + 1}`,
        type: i === 6 ? 'custom' : 'custom',
        title: `Page ${i + 1}`,
        content: i === 6 ? 'A'.repeat(3000) : 'Short content'
      }))
    };

    const result = runPreflight(booklet);
    assert.equal(result.status, 'PRINT BLOCKED');
    const overflowErr = result.errors.find((e) => e.category === 'Layout' && e.pageNum === 7 && e.message.includes('Content extends'));
    assert.ok(overflowErr, 'Should report overflow on Page 7');
    assert.ok(overflowErr.message.includes('Page 7: Content extends'), `Message should include page number and overflow distance: ${overflowErr.message}`);

    // 2. DOM-based overflow measurement simulation
    const mockDoc = {
      querySelector: (selector) => {
        if (selector.includes('data-page-index="6"') || selector.includes('spread-page-6')) {
          return {
            getAttribute: (attr) => {
              if (attr === 'data-has-overflow') return 'true';
              if (attr === 'data-overflow-inches') return '0.18';
              return null;
            },
            scrollHeight: 850,
            clientHeight: 816,
            getBoundingClientRect: () => ({ height: 816, bottom: 816 }),
            querySelectorAll: () => []
          };
        }
        return null;
      }
    };

    const domResult = runPreflight(booklet, { document: mockDoc });
    const domErr = domResult.errors.find((e) => e.pageNum === 7 && e.message.includes('0.18 inches below the page'));
    assert.ok(domErr, 'DOM simulation should detect 0.18 inches overflow below the page');
    assert.equal(domErr.message, 'Page 7: Content extends 0.18 inches below the page.');
  });

  await t.test('bookletReducer correctly handles TOGGLE_GUIDE and SET_GUIDE actions', () => {
    let state = INITIAL_STATE;
    assert.equal(state.guides.showGrid, false);
    assert.equal(state.guides.showPageBoundary, true);

    state = bookletReducer(state, { type: 'TOGGLE_GUIDE', guideKey: 'showGrid' });
    assert.equal(state.guides.showGrid, true);

    state = bookletReducer(state, { type: 'TOGGLE_GUIDE', guideKey: 'showPageBoundary' });
    assert.equal(state.guides.showPageBoundary, false);

    state = bookletReducer(state, { type: 'SET_GUIDE', guideKey: 'showBleed', value: true });
    assert.equal(state.guides.showBleed, true);
  });
});
