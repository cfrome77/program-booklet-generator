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

export default function CoverPage({ page, theme, resolveAssetUrl, canvaProps }) {
  const frameStyle = page.titleFrameStyle || (page.scrollworkFrame !== false ? 'scrollwork' : 'none');
  let frameClassName = '';
  if (frameStyle === 'scrollwork') frameClassName = 'scrollwork-frame';
  if (frameStyle === 'badge') frameClassName = 'title-badge-frame';
  if (frameStyle === 'bordered') frameClassName = 'title-bordered-frame';

  const currentEmblemW = page.emblemWidth || 120;
  const currentEmblemH = page.emblemHeight || 120;
  const emblemSrc = resolveAssetUrl(page.emblemImg);

  const emblemElement = (
    <SelectionOverlay
      targetType="emblem"
      currentX={page.emblemOffsetX || 0}
      currentY={page.emblemOffsetY || 0}
      currentW={currentEmblemW}
      currentH={currentEmblemH}
      className="patch-emblem-box"
      style={{
        width: `${currentEmblemW}px`,
        height: `${currentEmblemH}px`,
        transform: (page.emblemOffsetX || page.emblemOffsetY) ? `translate(${page.emblemOffsetX || 0}px, ${page.emblemOffsetY || 0}px)` : undefined,
        opacity: page.emblemOpacity !== undefined ? page.emblemOpacity / 100 : undefined,
        borderRadius: page.emblemShape === 'square' ? '0px' : page.emblemShape === 'rounded' ? '12px' : page.emblemShape === 'none' ? '0px' : undefined,
        border: page.emblemShape === 'none' ? 'none' : undefined,
        background: page.emblemShape === 'none' ? 'transparent' : undefined,
        boxShadow: page.emblemShape === 'none' ? 'none' : undefined,
        zIndex: page.emblemZIndex !== undefined ? page.emblemZIndex : 100,
        position: 'relative'
      }}
      {...canvaProps}
    >
      {emblemSrc ? (
        <img src={emblemSrc} alt="Emblem" draggable={false} className="w-full h-full object-contain select-none" />
      ) : (
        <span
          style={{ color: 'var(--navy-dark)' }}
          className="font-bold text-[0.7rem] text-center"
        >
          {page.emblemText || '[ Emblem ]'}
        </span>
      )}
    </SelectionOverlay>
  );

  const titleGroup = (
    <SelectionOverlay
      targetType="titleGroup"
      currentX={page.titleGroupOffsetX || 0}
      currentY={page.titleGroupOffsetY || 0}
      currentW={page.titleGroupWidth || null}
      currentH={page.titleGroupHeight || null}
      style={{
        transform: (page.titleGroupOffsetX || page.titleGroupOffsetY) ? `translate(${page.titleGroupOffsetX || 0}px, ${page.titleGroupOffsetY || 0}px)` : undefined,
        width: page.titleGroupWidth ? `${page.titleGroupWidth}px` : undefined,
        height: page.titleGroupHeight ? `${page.titleGroupHeight}px` : undefined,
        zIndex: page.titleGroupZIndex !== undefined ? page.titleGroupZIndex : 90,
        position: 'relative'
      }}
      {...canvaProps}
    >
      <div className={frameClassName}>
        <div className="scroll-title-group">
          <h2>{page.title || ''}</h2>
          <h3>{page.subtitle || ''}</h3>
          <p>{page.dateLocation || ''}</p>
        </div>
      </div>
    </SelectionOverlay>
  );

  const taglineElement = (
    <SelectionOverlay
      targetType="tagline"
      currentX={page.taglineOffsetX || 0}
      currentY={page.taglineOffsetY || 0}
      currentW={page.taglineWidth || null}
      currentH={page.taglineHeight || null}
      style={{
        transform: (page.taglineOffsetX || page.taglineOffsetY) ? `translate(${page.taglineOffsetX || 0}px, ${page.taglineOffsetY || 0}px)` : undefined,
        width: page.taglineWidth ? `${page.taglineWidth}px` : undefined,
        height: page.taglineHeight ? `${page.taglineHeight}px` : undefined,
        zIndex: page.taglineZIndex !== undefined ? page.taglineZIndex : 80,
        position: 'relative'
      }}
      {...canvaProps}
    >
      <div
        style={{ color: 'var(--charcoal)' }}
        className="text-[0.78rem] italic font-semibold text-center"
      >
        {page.tagline || ''}
      </div>
    </SelectionOverlay>
  );

  return (
    <>
      <div
        className="top-banner-bar"
        style={{ background: page.topBarColor || theme.tealAccent || 'var(--teal-accent)' }}
      />
      {emblemElement}
      {titleGroup}
      {taglineElement}
      <ContentBlocks blocks={page.blocks} resolveAssetUrl={resolveAssetUrl} canvaProps={canvaProps} />
      <BottomBanner page={page} />
    </>
  );
}
