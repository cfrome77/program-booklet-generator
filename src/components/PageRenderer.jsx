import React from 'react';
import { ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Trash2, Move, Maximize2 } from 'lucide-react';
import { useBooklet } from '../context/BookletContext.jsx';
import { isLeftPage } from '../utils/imposition.js';

export default function PageRenderer({ page, pageNum, pageIndex }) {
  const {
    pages,
    theme,
    selectedElement,
    setSelectedElement,
    updateContentBlock,
    updatePageField,
    reorderContentBlockLayer,
    deleteContentBlock
  } = useBooklet();

  if (!page) {
    return (
      <div className="booklet-page flex items-center justify-center text-gray-400 italic text-xs">
        [ Empty Page ]
      </div>
    );
  }

  const actualPageIndex = pageIndex !== undefined && pageIndex >= 0
    ? pageIndex
    : pages.findIndex(p => p === page);

  const isLeft = pageNum ? isLeftPage(pageNum) : true;
  const bgImgUrl = page.bgImage || theme.bgImage;
  const rawOpacity = page.bgImage
    ? (page.bgImageOpacity !== undefined ? page.bgImageOpacity : 100)
    : (theme.bgImageOpacity !== undefined ? theme.bgImageOpacity : 100);
  const opacityVal = rawOpacity / 100;
  const alignClass = page.vAlign ? `align-${page.vAlign}` : '';

  const handlePointerDownDrag = (e, targetType, targetBlockIndex = null, initialX = 0, initialY = 0) => {
    // Only handle primary mouse/touch button
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();

    setSelectedElement({
      pageIndex: actualPageIndex,
      blockIndex: targetBlockIndex,
      elementType: targetType
    });

    const startX = e.clientX;
    const startY = e.clientY;

    const onPointerMove = (moveEvent) => {
      const deltaX = Math.round(moveEvent.clientX - startX);
      const deltaY = Math.round(moveEvent.clientY - startY);
      const newX = initialX + deltaX;
      const newY = initialY + deltaY;

      if (targetType === 'block' && targetBlockIndex !== null) {
        updateContentBlock(actualPageIndex, targetBlockIndex, 'offsetX', newX);
        updateContentBlock(actualPageIndex, targetBlockIndex, 'offsetY', newY);
      } else if (targetType === 'emblem') {
        updatePageField(actualPageIndex, 'emblemOffsetX', newX);
        updatePageField(actualPageIndex, 'emblemOffsetY', newY);
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handlePointerDownResize = (e, handleType, targetType, targetBlockIndex = null, initialW = 100, initialH = 120) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;

    const onPointerMove = (moveEvent) => {
      const deltaX = Math.round(moveEvent.clientX - startX);
      const deltaY = Math.round(moveEvent.clientY - startY);

      if (targetType === 'block' && targetBlockIndex !== null) {
        // Change width percentage (20% - 100%)
        const widthChange = Math.round(deltaX / 2.2);
        const isRight = handleType.includes('r');
        const nextW = Math.min(100, Math.max(20, initialW + (isRight ? widthChange : -widthChange)));
        updateContentBlock(actualPageIndex, targetBlockIndex, 'width', nextW);
      } else if (targetType === 'emblem') {
        const isRight = handleType.includes('r');
        const isBottom = handleType.includes('b');
        const nextW = Math.min(280, Math.max(40, initialW + (isRight ? deltaX : -deltaX)));
        const nextH = Math.min(280, Math.max(40, initialH + (isBottom ? deltaY : -deltaY)));
        updatePageField(actualPageIndex, 'emblemWidth', nextW);
        updatePageField(actualPageIndex, 'emblemHeight', nextH);
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const renderBgLayer = () => {
    if (!bgImgUrl) return null;
    return (
      <div
        className="page-bg-layer"
        style={{
          backgroundImage: `url('${bgImgUrl}')`,
          opacity: opacityVal
        }}
      />
    );
  };

  const renderBottomBanner = () => {
    if (!page.bottomBannerText || page.bottomBannerStyle === 'none') return null;
    const style = page.bottomBannerStyle || 'torn';
    let className = 'bottom-banner-torn';
    if (style === 'gold') className = 'bottom-banner-gold';
    if (style === 'simple') className = 'bottom-banner-simple';

    return <div className={className}>{page.bottomBannerText}</div>;
  };

  const renderCanvaToolbar = (targetType, blockIndex = null, currentX = 0, currentY = 0, currentW = null, currentH = null) => {
    return (
      <div
        className="absolute -top-9 left-1/2 -translate-x-1/2 z-[999] bg-[#122230] text-white px-2 py-1 rounded-md shadow-2xl border border-[#70c0d0] flex items-center gap-1.5 text-[10px] select-none cursor-default whitespace-nowrap"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="flex items-center gap-0.5 text-cyan-300 font-mono font-bold pr-1 border-r border-[#3a3a44]">
          <Move className="w-3 h-3 text-amber-400" />
          {currentX >= 0 ? `+${currentX}` : currentX}x, {currentY >= 0 ? `+${currentY}` : currentY}y
        </span>

        {currentW !== null && (
          <span className="flex items-center gap-0.5 text-amber-300 font-mono text-[9px] pr-1 border-r border-[#3a3a44]">
            <Maximize2 className="w-2.5 h-2.5" />
            {currentW}{typeof currentW === 'number' && targetType === 'block' ? '%' : 'px'}
            {currentH !== null ? ` × ${currentH}px` : ''}
          </span>
        )}

        {targetType === 'block' && blockIndex !== null && (
          <>
            <button
              onClick={() => reorderContentBlockLayer(actualPageIndex, blockIndex, 'forward')}
              className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
              title="Bring Layer Forward"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => reorderContentBlockLayer(actualPageIndex, blockIndex, 'backward')}
              className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
              title="Send Layer Backward"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => reorderContentBlockLayer(actualPageIndex, blockIndex, 'front')}
              className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
              title="Bring to Front"
            >
              <ChevronsUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => reorderContentBlockLayer(actualPageIndex, blockIndex, 'back')}
              className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
              title="Send to Back"
            >
              <ChevronsDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => deleteContentBlock(actualPageIndex, blockIndex)}
              className="p-1 hover:bg-red-700 rounded text-red-300 hover:text-white pl-1 border-l border-[#3a3a44]"
              title="Delete Block"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        )}

        {targetType === 'emblem' && (
          <>
            <button
              onClick={() => updatePageField(actualPageIndex, 'emblemZIndex', (page.emblemZIndex || 100) + 10)}
              className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
              title="Bring Emblem Forward"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => updatePageField(actualPageIndex, 'emblemZIndex', Math.max(1, (page.emblemZIndex || 100) - 10))}
              className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
              title="Send Emblem Backward"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    );
  };

  const renderResizeHandles = (targetType, blockIndex = null, currentW = 100, currentH = 120) => {
    return (
      <>
        {/* Corner Handles */}
        <div
          onPointerDown={(e) => handlePointerDownResize(e, 'tl', targetType, blockIndex, currentW, currentH)}
          className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#005f73] rounded-full z-[1000] cursor-nwse-resize shadow hover:scale-125 transition-transform"
          title="Drag to resize"
        />
        <div
          onPointerDown={(e) => handlePointerDownResize(e, 'tr', targetType, blockIndex, currentW, currentH)}
          className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#005f73] rounded-full z-[1000] cursor-nesw-resize shadow hover:scale-125 transition-transform"
          title="Drag to resize"
        />
        <div
          onPointerDown={(e) => handlePointerDownResize(e, 'bl', targetType, blockIndex, currentW, currentH)}
          className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#005f73] rounded-full z-[1000] cursor-nesw-resize shadow hover:scale-125 transition-transform"
          title="Drag to resize"
        />
        <div
          onPointerDown={(e) => handlePointerDownResize(e, 'br', targetType, blockIndex, currentW, currentH)}
          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#005f73] rounded-full z-[1000] cursor-nwse-resize shadow hover:scale-125 transition-transform"
          title="Drag to resize"
        />

        {/* Edge Handles */}
        <div
          onPointerDown={(e) => handlePointerDownResize(e, 'r', targetType, blockIndex, currentW, currentH)}
          className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-4 bg-[#005f73] border border-white rounded z-[1000] cursor-ew-resize shadow hover:scale-125 transition-transform"
          title="Drag to adjust width"
        />
        {targetType === 'emblem' && (
          <div
            onPointerDown={(e) => handlePointerDownResize(e, 'b', targetType, blockIndex, currentW, currentH)}
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-[#005f73] border border-white rounded z-[1000] cursor-ns-resize shadow hover:scale-125 transition-transform"
            title="Drag to adjust height"
          />
        )}
      </>
    );
  };

  const renderContentBlocks = (blocks) => {
    if (!blocks || blocks.length === 0) return null;
    return (
      <div className="space-y-1 mt-1 w-full">
        {blocks.map((b, idx) => {
          const isSelected = selectedElement?.pageIndex === actualPageIndex &&
            selectedElement?.elementType === 'block' &&
            selectedElement?.blockIndex === idx;

          const align = b.align || (b.type === 'image' ? 'center' : 'left');
          const zIndexVal = b.zIndex !== undefined ? b.zIndex : (idx + 1) * 10;
          const currentW = b.width !== undefined ? b.width : 100;

          const blockContainerStyle = {
            width: `${currentW}%`,
            opacity: b.opacity !== undefined ? b.opacity / 100 : 1,
            transform: (b.offsetX || b.offsetY) ? `translate(${b.offsetX || 0}px, ${b.offsetY || 0}px)` : undefined,
            textAlign: align,
            marginLeft: align === 'center' || align === 'right' ? 'auto' : undefined,
            marginRight: align === 'center' || align === 'left' ? 'auto' : undefined,
            zIndex: zIndexVal,
            position: 'relative'
          };

          let innerBlockContent = null;
          if (b.type === 'heading') {
            innerBlockContent = (
              <h4
                style={{
                  fontFamily: 'var(--font-title)',
                  color: 'var(--navy-dark)'
                }}
                className="text-xs font-bold mt-1.5"
              >
                {b.text || ''}
              </h4>
            );
          } else if (b.type === 'paragraph') {
            innerBlockContent = (
              <p
                style={{
                  color: 'var(--charcoal)'
                }}
                className="text-[0.7rem] leading-relaxed"
              >
                {b.text || ''}
              </p>
            );
          } else if (b.type === 'image') {
            if (!b.url) {
              innerBlockContent = (
                <div className="p-2 border border-dashed border-gray-400 text-gray-500 text-[10px] text-center rounded">
                  [ Image Block: Select or Upload in Sidebar ]
                </div>
              );
            } else {
              let borderRadius = '4px';
              if (b.shape === 'circle') borderRadius = '50%';
              if (b.shape === 'square' || b.shape === 'natural') borderRadius = '0px';

              innerBlockContent = (
                <div className="my-1">
                  <img
                    src={b.url}
                    alt="Block Content"
                    className="image-block inline-block"
                    style={{
                      borderRadius,
                      maxHeight: '220px',
                      objectFit: b.shape === 'circle' ? 'cover' : 'contain'
                    }}
                  />
                </div>
              );
            }
          } else if (b.type === 'divider') {
            innerBlockContent = (
              <hr
                style={{
                  borderColor: 'var(--teal-accent)'
                }}
                className="my-1 border-t"
              />
            );
          }

          return (
            <div
              key={b.id || idx}
              style={blockContainerStyle}
              onPointerDown={(e) => handlePointerDownDrag(e, 'block', idx, b.offsetX || 0, b.offsetY || 0)}
              className={`group relative cursor-grab active:cursor-grabbing transition-shadow rounded p-0.5 ${
                isSelected
                  ? 'ring-2 ring-[#005f73] outline outline-1 outline-[#70c0d0] shadow-md bg-[#005f73]/10'
                  : 'hover:outline hover:outline-1 hover:outline-amber-500/50'
              }`}
            >
              {isSelected && renderCanvaToolbar('block', idx, b.offsetX || 0, b.offsetY || 0, currentW, null)}
              {isSelected && renderResizeHandles('block', idx, currentW, null)}
              {innerBlockContent}
            </div>
          );
        })}
      </div>
    );
  };

  const pageType = page.type || 'custom';
  let contentHTML = null;

  if (pageType === 'cover') {
    const frameStyle = page.titleFrameStyle || (page.scrollworkFrame !== false ? 'scrollwork' : 'none');
    let frameClassName = '';
    if (frameStyle === 'scrollwork') frameClassName = 'scrollwork-frame';
    if (frameStyle === 'badge') frameClassName = 'title-badge-frame';
    if (frameStyle === 'bordered') frameClassName = 'title-bordered-frame';

    const isEmblemSelected = selectedElement?.pageIndex === actualPageIndex &&
      selectedElement?.elementType === 'emblem';

    const currentEmblemW = page.emblemWidth || 120;
    const currentEmblemH = page.emblemHeight || 120;

    const titleGroup = (
      <div className={frameClassName}>
        <div className="scroll-title-group">
          <h2>{page.title || ''}</h2>
          <h3>{page.subtitle || ''}</h3>
          <p>{page.dateLocation || ''}</p>
        </div>
      </div>
    );

    contentHTML = (
      <>
        <div
          className="top-banner-bar"
          style={{ background: page.topBarColor || theme.tealAccent || 'var(--teal-accent)' }}
        />
        <div
          className={`patch-emblem-box relative cursor-grab active:cursor-grabbing transition-shadow ${
            isEmblemSelected ? 'ring-2 ring-[#005f73] outline outline-1 outline-[#70c0d0]' : 'hover:outline hover:outline-1 hover:outline-amber-500/50'
          }`}
          onPointerDown={(e) => handlePointerDownDrag(e, 'emblem', null, page.emblemOffsetX || 0, page.emblemOffsetY || 0)}
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
        >
          {isEmblemSelected && renderCanvaToolbar('emblem', null, page.emblemOffsetX || 0, page.emblemOffsetY || 0, currentEmblemW, currentEmblemH)}
          {isEmblemSelected && renderResizeHandles('emblem', null, currentEmblemW, currentEmblemH)}

          {page.emblemImg ? (
            <img src={page.emblemImg} alt="Emblem" />
          ) : (
            <span
              style={{ color: 'var(--navy-dark)' }}
              className="font-bold text-[0.7rem] text-center"
            >
              {page.emblemText || '[ Emblem ]'}
            </span>
          )}
        </div>
        {titleGroup}
        <div
          style={{ color: 'var(--charcoal)' }}
          className="text-[0.78rem] italic font-semibold text-center"
        >
          {page.tagline || ''}
        </div>
        {renderContentBlocks(page.blocks)}
        {renderBottomBanner()}
      </>
    );

    return (
      <div
        className={`booklet-page cover-page ${alignClass}`}
        onClick={() => setSelectedElement(null)}
      >
        {renderBgLayer()}
        {contentHTML}
        {pageNum && (
          <span className={`page-number-tag ${isLeft ? 'left' : 'right'}`}>
            Page {pageNum}
          </span>
        )}
      </div>
    );
  }

  if (pageType === 'backCover') {
    const sponsorsList = page.sponsors || [];
    contentHTML = (
      <>
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
        <div className="w-[70px] h-[70px] bg-white border border-gray-300 flex items-center justify-center text-[0.58rem] text-gray-500 my-2 mx-auto overflow-hidden">
          {page.qrImg ? (
            <img src={page.qrImg} alt="QR Code" className="w-full h-full object-cover" />
          ) : (
            '[ QR CODE ]'
          )}
        </div>
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
        {renderContentBlocks(page.blocks)}
        {renderBottomBanner()}
      </>
    );

    return (
      <div
        className={`booklet-page cover-page ${alignClass}`}
        style={{ justifyContent: 'center', textAlign: 'center' }}
        onClick={() => setSelectedElement(null)}
      >
        {renderBgLayer()}
        {contentHTML}
        {pageNum && (
          <span className={`page-number-tag ${isLeft ? 'left' : 'right'}`}>
            Page {pageNum}
          </span>
        )}
      </div>
    );
  }

  if (pageType === 'schedule') {
    const items = page.items || [];
    contentHTML = (
      <div>
        <div className="page-title">{page.title || 'Schedule'}</div>
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
        {renderContentBlocks(page.blocks)}
      </div>
    );
  } else if (pageType === 'leadership') {
    const leaders = page.leaders || [];
    contentHTML = (
      <div>
        <div className="page-title">{page.title || 'Leadership'}</div>
        <div className="page-content-area">
          {leaders.map((l, idx) => (
            <div key={idx} className="leader-container">
              <div className="leader-photo">
                {l.img ? <img src={l.img} alt={l.title} /> : '[ Photo ]'}
              </div>
              <div className="leader-content">
                <h4>{l.title}</h4>
                <div className="leader-role">{l.role}</div>
                <p>{l.text}</p>
              </div>
            </div>
          ))}
          {renderContentBlocks(page.blocks)}
        </div>
      </div>
    );
  } else if (pageType === 'keynote') {
    contentHTML = (
      <div>
        <div className="page-title">{page.title || 'Keynote Speaker'}</div>
        <div className="page-content-area">
          <div className="leader-container">
            <div className="speaker-photo">
              {page.speakerImg ? (
                <img src={page.speakerImg} alt={page.speakerName} />
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
          {renderContentBlocks(page.blocks)}
        </div>
      </div>
    );
  } else if (pageType === 'awards') {
    const awards = page.awards || [];
    const featured = page.featuredAwards || [];
    contentHTML = (
      <div>
        <div className="page-title">{page.title || 'Awards'}</div>
        <div className="award-grid-compact">
          {awards.map((a, idx) => (
            <div key={idx} className="award-card-compact">
              <h4>{a.name}</h4>
              <p>{a.desc}</p>
            </div>
          ))}
          {featured.map((f, idx) => (
            <div key={idx} className="award-card-featured">
              <div className="award-medallion-placeholder">
                {f.medallionImg ? (
                  <img src={f.medallionImg} alt={f.name} />
                ) : (
                  f.medallion || '[Medallion]'
                )}
              </div>
              <div>
                <h4>{f.name}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        {renderContentBlocks(page.blocks)}
      </div>
    );
  } else if (pageType === 'vigilIntro') {
    contentHTML = (
      <div>
        <div className="page-title">{page.title || 'Vigil Honor'}</div>
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
            {page.honoreePhoto ? (
              <img
                src={page.honoreePhoto}
                alt="Honoree"
                className="w-full h-full object-cover"
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
        {renderContentBlocks(page.blocks)}
      </div>
    );
  } else if (pageType === 'roster') {
    const members = page.members || [];
    contentHTML = (
      <div>
        <div className="page-title">{page.title || 'Roster'}</div>
        <div className="vigil-grid">
          {members.map((m, idx) => (
            <div key={idx} className="vigil-card">
              <div className="vigil-photo">
                {m.photo ? (
                  <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  'PHOTO'
                )}
              </div>
              <div className="vigil-name">{m.name}</div>
              <div className="vigil-totem">{m.totem || ''}</div>
            </div>
          ))}
        </div>
        {renderContentBlocks(page.blocks)}
      </div>
    );
  } else {
    // Custom / Default HTML
    contentHTML = (
      <div>
        <div className="page-title">{page.title || ''}</div>
        <div
          className="page-content-area text-[0.75rem] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: page.content || '' }}
        />
        {renderContentBlocks(page.blocks)}
      </div>
    );
  }

  return (
    <div
      className={`booklet-page ${alignClass}`}
      onClick={() => setSelectedElement(null)}
    >
      {renderBgLayer()}
      {contentHTML}
      {pageNum && (
        <span className={`page-number-tag ${isLeft ? 'left' : 'right'}`}>
          Page {pageNum}
        </span>
      )}
    </div>
  );
}
