import React from 'react';
import { useBooklet } from '../context/BookletContext.jsx';
import { getPageSpreadPairs } from '../utils/imposition.js';
import PageRenderer from './PageRenderer.jsx';

export default function SpreadViewer() {
  const { pages } = useBooklet();
  const spreads = getPageSpreadPairs(pages);

  return (
    <div id="view-spreads" className="view-section flex flex-col items-center gap-[30px] w-full">
      {spreads.map((spread, index) => (
        <div key={`spread-${index}`} className="spread-row">
          <PageRenderer
            page={spread.leftPage}
            pageNum={spread.leftPageNum}
          />
          {spread.rightPage && (
            <PageRenderer
              page={spread.rightPage}
              pageNum={spread.rightPageNum}
            />
          )}
        </div>
      ))}
    </div>
  );
}
