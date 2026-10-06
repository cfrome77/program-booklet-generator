/**
 * Pads an array of pages so that the total page count is a multiple of 4 (min 4).
 * Appends standard blank notes pages as implemented in program generator.
 *
 * @param {Array} pages - Array of page objects
 * @returns {Array} Padded array of page objects
 */
export function getPaddedPages(pages = []) {
  const padded = [...pages];
  let totalNeeded = Math.ceil(padded.length / 4) * 4;
  if (totalNeeded < 4) totalNeeded = 4;

  while (padded.length < totalNeeded) {
    padded.push({
      id: `pad-page-${padded.length + 1}`,
      type: "custom",
      title: "Notes",
      isPaddedBlank: true,
      content: "<div style='color:#888; font-style:italic; padding-top:20px;'>This page intentionally left blank for notes.</div>",
      blocks: []
    });
  }
  return padded;
}

/**
 * Determines whether a 1-based page number is on the left side of a spread.
 * In standard page-side semantics:
 * - Even-numbered pages (2, 4, 6, ...) are LEFT pages.
 * - Odd-numbered pages (1, 3, 5, ...) are RIGHT pages.
 *
 * @param {number} pageNum - 1-based page number
 * @returns {boolean} True if left page
 */
export function isLeftPage(pageNum) {
  if (!pageNum || typeof pageNum !== 'number' || pageNum < 1) return false;
  return pageNum % 2 === 0;
}

/**
 * Returns pair-wise page index reader spreads for a given list of pages.
 * Page 1 is on the right side of the cover spread (leftPage is null).
 * Subsequent inner spreads pair even pages on left and odd pages on right.
 *
 * @param {Array} pages - Array of page objects
 * @returns {Array<{ leftPage: Object|null, rightPage: Object|null, leftPageNum: number|null, rightPageNum: number|null }>}
 */
export function getPageSpreadPairs(pages = []) {
  const padded = getPaddedPages(pages);
  const spreads = [];

  // Spread 1: Cover (Left page is null, Right page is Page 1)
  spreads.push({
    leftPage: null,
    rightPage: padded[0] || null,
    leftPageNum: null,
    rightPageNum: 1
  });

  // Inner Spreads: Page 2 (left) & Page 3 (right), Page 4 (left) & Page 5 (right)...
  for (let i = 1; i < padded.length - 1; i += 2) {
    spreads.push({
      leftPage: padded[i],
      rightPage: padded[i + 1] || null,
      leftPageNum: i + 1,
      rightPageNum: i + 2 <= padded.length ? i + 2 : null
    });
  }

  // Final Back Cover Spread (Page N on left, right page is null)
  if (padded.length > 1) {
    spreads.push({
      leftPage: padded[padded.length - 1],
      rightPage: null,
      leftPageNum: padded.length,
      rightPageNum: null
    });
  }

  return spreads;
}

/**
 * Calculates saddle-stitch print imposition layout for 11 x 8.5 in landscape folded sheets.
 * Preserves exact front/back sheet logic and page assignments.
 *
 * @param {Array} pages - Array of page objects
 * @returns {{
 *   rawPageCount: number,
 *   totalPages: number,
 *   paddingAdded: number,
 *   totalSheets: number,
 *   sheets: Array
 * }}
 */
export function calculateImpositionSheets(pages = []) {
  const rawPageCount = pages ? pages.length : 0;
  const padded = getPaddedPages(pages);
  const totalPages = padded.length; // Multiple of 4
  const paddingAdded = totalPages - rawPageCount;
  const totalSheets = totalPages / 4;
  const sheets = [];

  for (let s = 1; s <= totalSheets; s++) {
    const frontLeftNum = totalPages - 2 * (s - 1);
    const frontRightNum = 1 + 2 * (s - 1);
    const backLeftNum = 2 * s;
    const backRightNum = totalPages - 2 * s + 1;

    sheets.push({
      sheetNumber: s,
      front: {
        label: `Sheet ${s} Front (Outer) — Page ${frontLeftNum} | Page ${frontRightNum}`,
        leftPageNum: frontLeftNum,
        rightPageNum: frontRightNum,
        leftPage: padded[frontLeftNum - 1],
        rightPage: padded[frontRightNum - 1]
      },
      back: {
        label: `Sheet ${s} Back (Inner) — Page ${backLeftNum} | Page ${backRightNum}`,
        leftPageNum: backLeftNum,
        rightPageNum: backRightNum,
        leftPage: padded[backLeftNum - 1],
        rightPage: padded[backRightNum - 1]
      }
    });
  }

  return {
    rawPageCount,
    totalPages,
    paddingAdded,
    totalSheets,
    sheets
  };
}

export default {
  getPaddedPages,
  isLeftPage,
  getPageSpreadPairs,
  calculateImpositionSheets
};
