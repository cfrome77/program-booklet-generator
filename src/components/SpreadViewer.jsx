import React from 'react';
import { useBooklet } from '../context/BookletContext.jsx';
import { getPageSpreadPairs } from '../utils/imposition.js';
import PageRenderer from './PageRenderer.jsx';
import RulerWrapper from './RulerWrapper.jsx';

export default function SpreadViewer() {
  const { pages } = useBooklet();
  const spreads = getPageSpreadPairs(pages);

  return (
    <div id="view-spreads" className="view-section flex flex-col items-center gap-[30px] w-full">
      {spreads.map((spread, index) => (
        <RulerWrapper key={`spread-${index}`} widthIn={11} heightIn={8.5}>
          <div className="spread-row !m-0 shadow-none">
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
        </RulerWrapper>
      ))}
    </div>
  );
}
