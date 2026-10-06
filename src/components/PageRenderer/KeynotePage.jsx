import React from 'react';
import PageTitle from './PageTitle.jsx';
import ContentBlocks from './ContentBlocks.jsx';

export default function KeynotePage({ page, resolveAssetUrl, canvaProps }) {
  const speakerSrc = resolveAssetUrl(page.speakerImg);
  return (
    <div>
      <PageTitle page={page} fallbackTitle="Keynote Speaker" canvaProps={canvaProps} />
      <div className="page-content-area">
        <div className="leader-container">
          <div className="speaker-photo">
            {speakerSrc ? (
              <img src={speakerSrc} alt={page.speakerName} draggable={false} className="select-none" />
            ) : (
              '[ Speaker ]'
            )}
          </div>
          <div>
            <h4
              style={{ fontFamily: 'var(--font-title)', color: 'var(--navy-dark)' }}
              className="text-[0.82rem] font-bold"
            >
              {page.speakerName || ''}
            </h4>
            <p
              style={{ color: 'var(--teal-accent)' }}
              className="text-[0.68rem] font-semibold mb-1"
            >
              {page.speakerRole || ''}
            </p>
            <p
              style={{ color: 'var(--charcoal)' }}
              className="text-[0.68rem] leading-relaxed"
            >
              {page.bioText || ''}
            </p>
          </div>
        </div>
        <ContentBlocks blocks={page.blocks} resolveAssetUrl={resolveAssetUrl} canvaProps={canvaProps} />
      </div>
    </div>
  );
}
