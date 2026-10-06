import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getPaddedPages,
  isLeftPage,
  getPageSpreadPairs,
  calculateImpositionSheets
} from '../src/utils/imposition.js';

describe('Imposition & Page-Side Semantics', () => {

  describe('Page-Side Semantics (isLeftPage)', () => {
    it('identifies page 1 as right page', () => {
      assert.equal(isLeftPage(1), false, 'Page 1 must be on the right side');
    });

    it('identifies even-numbered pages as left pages', () => {
      assert.equal(isLeftPage(2), true, 'Page 2 must be a left page');
      assert.equal(isLeftPage(4), true, 'Page 4 must be a left page');
      assert.equal(isLeftPage(6), true, 'Page 6 must be a left page');
      assert.equal(isLeftPage(8), true, 'Page 8 must be a left page');
      assert.equal(isLeftPage(24), true, 'Page 24 must be a left page');
    });

    it('identifies odd-numbered pages as right pages', () => {
      assert.equal(isLeftPage(1), false, 'Page 1 must be a right page');
      assert.equal(isLeftPage(3), false, 'Page 3 must be a right page');
      assert.equal(isLeftPage(5), false, 'Page 5 must be a right page');
      assert.equal(isLeftPage(7), false, 'Page 7 must be a right page');
      assert.equal(isLeftPage(23), false, 'Page 23 must be a right page');
    });
  });

  describe('Reader Spreads (getPageSpreadPairs)', () => {
    it('places Page 1 on the right side of Cover spread', () => {
      const mockPages = [
        { id: 'p1', title: 'Cover' },
        { id: 'p2', title: 'Page 2' },
        { id: 'p3', title: 'Page 3' },
        { id: 'p4', title: 'Back Cover' }
      ];
      const spreads = getPageSpreadPairs(mockPages);

      assert.equal(spreads[0].leftPage, null, 'Cover spread left page should be null');
      assert.equal(spreads[0].rightPageNum, 1, 'Cover spread right page should be Page 1');
      assert.equal(spreads[0].rightPage.title, 'Cover');
    });

    it('places even pages on left and odd pages on right in inner spreads', () => {
      const mockPages = Array.from({ length: 8 }, (_, i) => ({ id: `p${i + 1}`, title: `Page ${i + 1}` }));
      const spreads = getPageSpreadPairs(mockPages);

      // Inner spread 1 should be Page 2 (left) and Page 3 (right)
      assert.equal(spreads[1].leftPageNum, 2);
      assert.equal(spreads[1].rightPageNum, 3);
      assert.equal(isLeftPage(spreads[1].leftPageNum), true);
      assert.equal(isLeftPage(spreads[1].rightPageNum), false);

      // Inner spread 2 should be Page 4 (left) and Page 5 (right)
      assert.equal(spreads[2].leftPageNum, 4);
      assert.equal(spreads[2].rightPageNum, 5);
      assert.equal(isLeftPage(spreads[2].leftPageNum), true);
      assert.equal(isLeftPage(spreads[2].rightPageNum), false);
    });
  });

  describe('Padded Pages Calculation (getPaddedPages)', () => {
    it('pads unaligned page counts to the next multiple of 4 (min 4)', () => {
      const createPages = (count) => Array.from({ length: count }, (_, i) => ({ id: `p${i + 1}` }));

      assert.equal(getPaddedPages(createPages(1)).length, 4);
      assert.equal(getPaddedPages(createPages(2)).length, 4);
      assert.equal(getPaddedPages(createPages(3)).length, 4);
      assert.equal(getPaddedPages(createPages(4)).length, 4);
      assert.equal(getPaddedPages(createPages(5)).length, 8);
      assert.equal(getPaddedPages(createPages(7)).length, 8);
      assert.equal(getPaddedPages(createPages(9)).length, 12);
      assert.equal(getPaddedPages(createPages(15)).length, 16);
      assert.equal(getPaddedPages(createPages(21)).length, 24);
    });

    it('marks padded pages as isPaddedBlank', () => {
      const pages = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }];
      const padded = getPaddedPages(pages);
      assert.equal(padded.length, 4);
      assert.equal(padded[0].isPaddedBlank, undefined);
      assert.equal(padded[3].isPaddedBlank, true);
    });
  });

  describe('Saddle-Stitch Booklet Imposition (calculateImpositionSheets)', () => {
    const testCases = [4, 8, 12, 16, 20, 24, 28, 32, 64];

    testCases.forEach((pageCount) => {
      it(`correctly imposes standard valid page count: ${pageCount} pages`, () => {
        const mockPages = Array.from({ length: pageCount }, (_, i) => ({
          id: `page-${i + 1}`,
          title: `Page ${i + 1}`
        }));

        const result = calculateImpositionSheets(mockPages);

        assert.equal(result.rawPageCount, pageCount);
        assert.equal(result.totalPages, pageCount);
        assert.equal(result.paddingAdded, 0);
        assert.equal(result.totalSheets, pageCount / 4);

        // Verify page coverage
        const seenPages = new Set();
        result.sheets.forEach((sheet) => {
          [
            sheet.front.leftPageNum,
            sheet.front.rightPageNum,
            sheet.back.leftPageNum,
            sheet.back.rightPageNum
          ].forEach((pageNum) => {
            assert.ok(pageNum >= 1 && pageNum <= pageCount, `Page ${pageNum} out of range`);
            assert.ok(!seenPages.has(pageNum), `Duplicate page found: Page ${pageNum}`);
            seenPages.add(pageNum);
          });
        });

        assert.equal(seenPages.size, pageCount, `Every logical page 1..${pageCount} must appear exactly once`);

        // Verify first / last page pairing on Sheet 1 Front (Outer cover)
        const sheet1 = result.sheets[0];
        assert.equal(sheet1.front.leftPageNum, pageCount, 'Sheet 1 Front Left must be last page');
        assert.equal(sheet1.front.rightPageNum, 1, 'Sheet 1 Front Right must be Page 1');

        // Verify inner center spread pairing on Sheet S Back
        const lastSheet = result.sheets[result.sheets.length - 1];
        const centerLeft = pageCount / 2;
        const centerRight = pageCount / 2 + 1;
        assert.equal(lastSheet.back.leftPageNum, centerLeft, 'Last Sheet Back Left must be center left page');
        assert.equal(lastSheet.back.rightPageNum, centerRight, 'Last Sheet Back Right must be center right page');
      });
    });

    const unalignedCounts = [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15, 17, 18, 19, 21, 22, 23];
    unalignedCounts.forEach((pageCount) => {
      it(`automatically handles unaligned page count ${pageCount} without losing or duplicating pages`, () => {
        const mockPages = Array.from({ length: pageCount }, (_, i) => ({
          id: `page-${i + 1}`,
          title: `Original Page ${i + 1}`
        }));

        const result = calculateImpositionSheets(mockPages);
        const expectedPadded = Math.max(4, Math.ceil(pageCount / 4) * 4);
        const expectedPaddingAdded = expectedPadded - pageCount;

        assert.equal(result.rawPageCount, pageCount);
        assert.equal(result.totalPages, expectedPadded);
        assert.equal(result.paddingAdded, expectedPaddingAdded);
        assert.equal(result.totalSheets, expectedPadded / 4);

        // Check that every original page appears exactly once
        const seenPageNums = new Set();
        result.sheets.forEach((sheet) => {
          [
            sheet.front.leftPageNum,
            sheet.front.rightPageNum,
            sheet.back.leftPageNum,
            sheet.back.rightPageNum
          ].forEach((pageNum) => {
            assert.ok(!seenPageNums.has(pageNum), `Page ${pageNum} duplicated in imposition`);
            seenPageNums.add(pageNum);
          });
        });

        assert.equal(seenPageNums.size, expectedPadded);

        // Verify original pages 1..pageCount are preserved and padded pages are at the end
        for (let i = 1; i <= pageCount; i++) {
          assert.ok(seenPageNums.has(i), `Original Page ${i} was lost in imposition`);
        }
      });
    });
  });
});
