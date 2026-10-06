import React from 'react';
import PageTitle from './PageTitle.jsx';
import ContentBlocks from './ContentBlocks.jsx';

export default function AwardsPage({ page, resolveAssetUrl, canvaProps }) {
  const awards = page.awards || [];
  const featured = page.featuredAwards || [];
  return (
    <div>
      <PageTitle page={page} fallbackTitle="Awards" canvaProps={canvaProps} />
      <div className="award-grid-compact">
        {awards.map((a, idx) => (
          <div key={idx} className="award-card-compact">
            <h4>{a.name}</h4>
            <p>{a.desc}</p>
          </div>
        ))}
        {featured.map((f, idx) => {
          const medallionSrc = resolveAssetUrl(f.medallionImg);
          return (
            <div key={idx} className="award-card-featured">
              <div className="award-medallion-placeholder">
                {medallionSrc ? (
                  <img src={medallionSrc} alt={f.name} draggable={false} className="select-none" />
                ) : (
                  f.medallion || '[Medallion]'
                )}
              </div>
              <div>
                <h4>{f.name}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
      <ContentBlocks blocks={page.blocks} resolveAssetUrl={resolveAssetUrl} canvaProps={canvaProps} />
    </div>
  );
}
