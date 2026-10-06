import React from 'react';
import PageTitle from './PageTitle.jsx';
import ContentBlocks from './ContentBlocks.jsx';

export default function LeadershipPage({ page, resolveAssetUrl, canvaProps }) {
  const leaders = page.leaders || [];
  return (
    <div>
      <PageTitle page={page} fallbackTitle="Leadership" canvaProps={canvaProps} />
      <div className="page-content-area">
        {leaders.map((l, idx) => {
          const lSrc = resolveAssetUrl(l.img);
          return (
            <div key={idx} className="leader-container">
              <div className="leader-photo">
                {lSrc ? <img src={lSrc} alt={l.title} draggable={false} className="select-none" /> : '[ Photo ]'}
              </div>
              <div className="leader-content">
                <h4>{l.title}</h4>
                <div className="leader-role">{l.role}</div>
                <p>{l.text}</p>
              </div>
            </div>
          );
        })}
        <ContentBlocks blocks={page.blocks} resolveAssetUrl={resolveAssetUrl} canvaProps={canvaProps} />
      </div>
    </div>
  );
}
