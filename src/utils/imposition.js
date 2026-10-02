/**
 * Pads an array of pages so that the total page count is a multiple of 4 (min 4).
 * Appends standard blank notes pages as implemented in prgram_generator.html.
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
      content: "<div style='color:#888; font-style:italic; padding-top:20px;'>This page intentionally left blank for notes.</div>",
      blocks: []
    });
  }
  return padded;
}

/**
 * Determines whether a 1-based page number is on the left side of a spread.
 * Page 1 is on the right side of a spread (pageNum % 2 !== 0 is left tag in original engine).
 *
 * @param {number} pageNum - 1-based page number
 * @returns {boolean} True if left page tag applies
 */
export function isLeftPage(pageNum) {
  return pageNum % 2 !== 0;
}

/**
 * Returns pair-wise page index reader spreads for a given list of pages.
 *
 * @param {Array} pages - Array of page objects
 * @returns {Array<{ leftPage: Object, rightPage: Object, leftPageNum: number, rightPageNum: number }>}
 */
export function getPageSpreadPairs(pages = []) {
  const padded = getPaddedPages(pages);
  const spreads = [];

  for (let i = 0; i < padded.length; i += 2) {
    spreads.push({
      leftPage: padded[i],
      rightPage: padded[i + 1] || null,
      leftPageNum: i + 1,
      rightPageNum: i + 2 <= padded.length ? i + 2 : null
    });
  }

  return spreads;
}

/**
 * Calculates saddle-stitch print imposition layout for 11 x 8.5 in landscape folded sheets.
 * Preserves exact front/back sheet logic and page assignments from prgram_generator.html.
 *
 * @param {Array} pages - Array of page objects
 * @returns {{ totalPages: number, totalSheets: number, sheets: Array }}
 */
export function calculateImpositionSheets(pages = []) {
  const padded = getPaddedPages(pages);
  const N = padded.length; // Multiple of 4
  const totalSheets = N / 4;
  const sheets = [];

  for (let s = 1; s <= totalSheets; s++) {
    const frontLeftNum = N - 2 * (s - 1);
    const frontRightNum = 1 + 2 * (s - 1);
    const backLeftNum = 2 * s;
    const backRightNum = N - 2 * s + 1;

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
    totalPages: N,
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
