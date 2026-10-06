import React from 'react';
import PageTitle from './PageTitle.jsx';
import ContentBlocks from './ContentBlocks.jsx';

export default function RosterPage({ page, resolveAssetUrl, canvaProps }) {
  const members = page.members || [];
  return (
    <div>
      <PageTitle page={page} fallbackTitle="Roster" canvaProps={canvaProps} />
      <div className="vigil-grid">
        {members.map((m, idx) => {
          const memberPhoto = resolveAssetUrl(m.photo);
          return (
            <div key={idx} className="vigil-card">
              <div className="vigil-photo">
                {memberPhoto ? (
                  <img src={memberPhoto} alt={m.name} draggable={false} className="w-full h-full object-cover select-none" />
                ) : (
                  'PHOTO'
                )}
              </div>
              <div className="vigil-name">{m.name}</div>
              <div className="vigil-totem">{m.totem || ''}</div>
            </div>
          );
        })}
      </div>
      <ContentBlocks blocks={page.blocks} resolveAssetUrl={resolveAssetUrl} canvaProps={canvaProps} />
    </div>
  );
}
