import React from 'react';
import SelectionOverlay from './SelectionOverlay.jsx';

export default function PageTitle({ page, fallbackTitle, canvaProps }) {
  return (
    <SelectionOverlay
      targetType="pageTitle"
      currentX={page.pageTitleOffsetX || 0}
      currentY={page.pageTitleOffsetY || 0}
      currentW={page.pageTitleWidth || null}
      currentH={page.pageTitleHeight || null}
      style={{
        transform: (page.pageTitleOffsetX || page.pageTitleOffsetY) ? `translate(${page.pageTitleOffsetX || 0}px, ${page.pageTitleOffsetY || 0}px)` : undefined,
        width: page.pageTitleWidth ? `${page.pageTitleWidth}px` : undefined,
        height: page.pageTitleHeight ? `${page.pageTitleHeight}px` : undefined,
        zIndex: page.pageTitleZIndex !== undefined ? page.pageTitleZIndex : 110,
        position: 'relative'
      }}
      {...canvaProps}
    >
      <div className="page-title">{page.title || fallbackTitle}</div>
    </SelectionOverlay>
  );
}
