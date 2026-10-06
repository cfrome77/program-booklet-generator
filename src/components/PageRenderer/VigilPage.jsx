import React from 'react';
import PageTitle from './PageTitle.jsx';
import ContentBlocks from './ContentBlocks.jsx';

export default function VigilPage({ page, resolveAssetUrl, canvaProps }) {
  const honoreeSrc = resolveAssetUrl(page.honoreePhoto);
  return (
    <div>
      <PageTitle page={page} fallbackTitle="Vigil Honor" canvaProps={canvaProps} />
      <div className="award-card-compact mb-2.5">
        <h4>The Highest Brotherhood</h4>
        <p>
          Recognizing Arrowmen inducted into the highest brotherhood of unselfish service across our lodge's history.
        </p>
      </div>
      <div className="border border-[#c8bda8] bg-[#fbf8f0] p-2.5 text-center">
        <div
          style={{ fontFamily: 'var(--font-title)', color: 'var(--navy-dark)' }}
          className="text-[10pt] font-bold uppercase"
        >
          {page.honoreeName || 'Class Honoree'}
        </div>
        <div className="w-[1in] h-[1in] my-1.5 mx-auto border border-gray-400 bg-white flex items-center justify-center text-[7pt] text-gray-500 overflow-hidden">
          {honoreeSrc ? (
            <img
              src={honoreeSrc}
              alt="Honoree"
              draggable={false}
              className="w-full h-full object-cover select-none"
            />
          ) : (
            'PHOTO'
          )}
        </div>
        <div
          style={{ fontFamily: 'var(--font-title)', color: 'var(--navy-dark)' }}
          className="text-[12pt] font-bold"
        >
          {page.honoreeTitle || ''}
        </div>
        <div className="text-[8pt] leading-normal text-gray-600 mt-1">
          {page.honoreeBio || ''}
        </div>
      </div>
      <ContentBlocks blocks={page.blocks} resolveAssetUrl={resolveAssetUrl} canvaProps={canvaProps} />
    </div>
  );
}
