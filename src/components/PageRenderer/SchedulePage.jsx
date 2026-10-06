import React from 'react';
import PageTitle from './PageTitle.jsx';
import ContentBlocks from './ContentBlocks.jsx';

export default function SchedulePage({ page, resolveAssetUrl, canvaProps }) {
  const items = page.items || [];
  return (
    <div>
      <PageTitle page={page} fallbackTitle="Schedule" canvaProps={canvaProps} />
      <div className="schedule-list">
        {items.map((item, idx) => (
          <div key={idx} className="schedule-row">
            <div className="schedule-time">{item.time}</div>
            <div className="schedule-details">
              <h4>{item.title}</h4>
              <p>{item.details}</p>
            </div>
          </div>
        ))}
      </div>
      <ContentBlocks blocks={page.blocks} resolveAssetUrl={resolveAssetUrl} canvaProps={canvaProps} />
    </div>
  );
}
