import React from 'react';
import { useBooklet } from '../context/BookletContext.jsx';
import { calculateImpositionSheets } from '../utils/imposition.js';
import PageRenderer from './PageRenderer.jsx';
import TestSheet from './TestSheet.jsx';

export default function PrintMount({ printMode }) {
  const { pages } = useBooklet();

  if (!printMode) return null;

  if (printMode === 'test-sheet') {
    return (
      <div id="print-mount" className="print-only-container">
        <TestSheet />
      </div>
    );
  }

  const { sheets } = calculateImpositionSheets(pages);

  return (
    <div id="print-mount" className="print-only-container">
      {sheets.map((sheet) => (
        <React.Fragment key={`print-sheet-group-${sheet.sheetNumber}`}>
          {/* Front (Outer) Side */}
          <div className="spread-row print-sheet-side">
            <PageRenderer
              page={sheet.front.leftPage}
              pageNum={sheet.front.leftPageNum}
            />
            <PageRenderer
              page={sheet.front.rightPage}
              pageNum={sheet.front.rightPageNum}
            />
          </div>

          {/* Back (Inner) Side */}
          <div className="spread-row print-sheet-side">
            <PageRenderer
              page={sheet.back.leftPage}
              pageNum={sheet.back.leftPageNum}
            />
            <PageRenderer
              page={sheet.back.rightPage}
              pageNum={sheet.back.rightPageNum}
            />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
