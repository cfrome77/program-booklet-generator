import React from 'react';
import SelectionOverlay from './SelectionOverlay.jsx';
import ContentBlocks from './ContentBlocks.jsx';

function BottomBanner({ page }) {
  if (!page.bottomBannerText || page.bottomBannerStyle === 'none') return null;
  const style = page.bottomBannerStyle || 'torn';
  let className = 'bottom-banner-torn';
  if (style === 'gold') className = 'bottom-banner-gold';
  if (style === 'simple') className = 'bottom-banner-simple';

  return <div className={className}>{page.bottomBannerText}</div>;
}

export default function BackCoverPage({ page, resolveAssetUrl, canvaProps }) {
  const sponsorsList = page.sponsors || [];
  const qrSrc = resolveAssetUrl(page.qrImg);

  const headerElement = (
    <SelectionOverlay
      targetType="headerGroup"
      currentX={page.headerGroupOffsetX || 0}
      currentY={page.headerGroupOffsetY || 0}
      currentW={page.headerGroupWidth || null}
      currentH={page.headerGroupHeight || null}
      style={{
        transform: (page.headerGroupOffsetX || page.headerGroupOffsetY) ? `translate(${page.headerGroupOffsetX || 0}px, ${page.headerGroupOffsetY || 0}px)` : undefined,
        width: page.headerGroupWidth ? `${page.headerGroupWidth}px` : undefined,
        height: page.headerGroupHeight ? `${page.headerGroupHeight}px` : undefined,
        zIndex: page.headerGroupZIndex !== undefined ? page.headerGroupZIndex : 100,
        position: 'relative'
      }}
      {...canvaProps}
    >
      <div>
        <div
          style={{ fontFamily: 'var(--font-title)', color: 'var(--navy-dark)' }}
          className="text-[1.1rem] font-bold text-center"
        >
          {page.organization || ''}
        </div>
        <div
          style={{ color: 'var(--teal-accent)' }}
          className="text-[0.76rem] font-semibold my-1 text-center"
        >
          {page.subOrganization || ''}
        </div>
      </div>
    </SelectionOverlay>
  );

  const qrElement = (
    <SelectionOverlay
      targetType="qrGroup"
      currentX={page.qrGroupOffsetX || 0}
      currentY={page.qrGroupOffsetY || 0}
      currentW={page.qrGroupWidth || 70}
      currentH={page.qrGroupHeight || 70}
      style={{
        transform: (page.qrGroupOffsetX || page.qrGroupOffsetY) ? `translate(${page.qrGroupOffsetX || 0}px, ${page.qrGroupOffsetY || 0}px)` : undefined,
        width: page.qrGroupWidth ? `${page.qrGroupWidth}px` : '70px',
        height: page.qrGroupHeight ? `${page.qrGroupHeight}px` : '70px',
        zIndex: page.qrGroupZIndex !== undefined ? page.qrGroupZIndex : 90,
        position: 'relative',
        margin: '8px auto'
      }}
      {...canvaProps}
    >
      <div className="w-full h-full bg-white border border-gray-300 flex items-center justify-center text-[0.58rem] text-gray-500 overflow-hidden">
        {qrSrc ? (
          <img src={qrSrc} alt="QR Code" draggable={false} className="w-full h-full object-cover select-none" />
        ) : (
          '[ QR CODE ]'
        )}
      </div>
    </SelectionOverlay>
  );

  return (
    <>
      {headerElement}
      {qrElement}
      <div className="text-[0.7rem] text-gray-600 mb-2.5 text-center">
        {page.qrText || ''}
      </div>
      {sponsorsList.length > 0 && (
        <div className="w-full">
          <div
            style={{ color: 'var(--navy-dark)' }}
            className="text-[0.72rem] font-bold mb-1 text-center"
          >
            {page.sponsorsText || 'Sponsors:'}
          </div>
          <div className="sponsors-grid">
            {sponsorsList.map((s, idx) => (
              <div key={idx} className="sponsor-item">
                {s}
              </div>
            ))}
          </div>
        </div>
      )}
      <ContentBlocks blocks={page.blocks} resolveAssetUrl={resolveAssetUrl} canvaProps={canvaProps} />
      <BottomBanner page={page} />
    </>
  );
}
