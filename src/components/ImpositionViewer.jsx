import React from 'react';
import { useBooklet } from '../context/BookletContext.jsx';
import { calculateImpositionSheets } from '../utils/imposition.js';
import PageRenderer from './PageRenderer.jsx';

export default function ImpositionViewer() {
  const { pages } = useBooklet();
  const { totalPages, totalSheets, sheets } = calculateImpositionSheets(pages);

  return (
    <div id="view-imposition" className="view-section flex flex-col items-center gap-[30px] w-full">
      <div className="imposition-note">
        <strong>Print Imposition Info:</strong> Total {totalPages} finished 5.5 × 8.5 in booklet pages arranged onto {totalSheets} double-sided 11 × 8.5 in landscape sheets. Stack and fold in center.
      </div>

      {sheets.map((sheet) => (
        <React.Fragment key={`sheet-${sheet.sheetNumber}`}>
          {/* Front (Outer) Sheet */}
          <div className="imposition-sheet">
            <div className="sheet-label">{sheet.front.label}</div>
            <div className="spread-row">
              <PageRenderer
                page={sheet.front.leftPage}
                pageNum={sheet.front.leftPageNum}
              />
              <PageRenderer
                page={sheet.front.rightPage}
                pageNum={sheet.front.rightPageNum}
              />
            </div>
          </div>

          {/* Back (Inner) Sheet */}
          <div className="imposition-sheet">
            <div className="sheet-label">{sheet.back.label}</div>
            <div className="spread-row">
              <PageRenderer
                page={sheet.back.leftPage}
                pageNum={sheet.back.leftPageNum}
              />
              <PageRenderer
                page={sheet.back.rightPage}
                pageNum={sheet.back.rightPageNum}
              />
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
