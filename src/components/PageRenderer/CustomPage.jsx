import React from 'react';
import SelectionOverlay from './SelectionOverlay.jsx';
import PageTitle from './PageTitle.jsx';
import ContentBlocks from './ContentBlocks.jsx';
import { sanitizeHtml } from '../../utils/sanitize.js';

export default function CustomPage({ page, resolveAssetUrl, canvaProps }) {
  const mainContentElement = (
    <SelectionOverlay
      targetType="mainContent"
      currentX={page.mainContentOffsetX || 0}
      currentY={page.mainContentOffsetY || 0}
      currentW={page.mainContentWidth || null}
      currentH={page.mainContentHeight || null}
      style={{
        transform: (page.mainContentOffsetX || page.mainContentOffsetY) ? `translate(${page.mainContentOffsetX || 0}px, ${page.mainContentOffsetY || 0}px)` : undefined,
        width: page.mainContentWidth ? `${page.mainContentWidth}px` : undefined,
        height: page.mainContentHeight ? `${page.mainContentHeight}px` : undefined,
        zIndex: page.mainContentZIndex !== undefined ? page.mainContentZIndex : 50,
        position: 'relative'
      }}
      {...canvaProps}
    >
      <div
        className="page-content-area text-[0.75rem] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content || '') }}
      />
    </SelectionOverlay>
  );

  return (
    <div>
      <PageTitle page={page} fallbackTitle="Title" canvaProps={canvaProps} />
      {mainContentElement}
      <ContentBlocks blocks={page.blocks} resolveAssetUrl={resolveAssetUrl} canvaProps={canvaProps} />
    </div>
  );
}
