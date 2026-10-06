import React, { useState, useRef, useLayoutEffect } from 'react';
import { ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Trash2, Move, Maximize2, Grid, Copy, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useBooklet } from '../context/BookletContext.jsx';
import { isLeftPage } from '../utils/imposition.js';

export default function PageRenderer({ page, pageNum, pageIndex }) {
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [activeSnapGuides, setActiveSnapGuides] = useState({ snapX: false, snapY: false });
  const [overflowState, setOverflowState] = useState({ hasOverflow: false, distanceInches: '0', direction: 'below', overflowPx: 0 });
  const pageRef = useRef(null);
  const {
    pages,
    theme,
    selectedElement,
    setSelectedElement,
    duplicateContentBlock,
    updateContentBlock,
    updatePageField,
    reorderContentBlockLayer,
    deleteContentBlock,
    duplicatePage,
    deletePage,
    guides,
    resolveAssetUrl
  } = useBooklet();

  if (!page) {
    return (
      <div className="booklet-page flex items-center justify-center text-gray-400 italic text-xs relative">
        {guides && (
          <div className="editor-guide pointer-events-none absolute inset-0 z-[800] select-none">
            {guides.showGrid && (
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#005f7318_1px,transparent_1px),linear-gradient(to_bottom,#005f7318_1px,transparent_1px)] bg-[size:0.25in_0.25in]" />
            )}
            {guides.showPageBoundary && (
              <div className="absolute inset-0 border-2 border-[#005f73] pointer-events-none">
                <span className={`absolute top-0 text-[8px] font-mono font-bold text-cyan-300 bg-[#122230]/90 px-1.5 py-0.5 rounded-b border-b border-x border-[#005f73] ${
                  isLeft ? 'left-1' : 'right-1'
                }`}>
                  5.5" × 8.5" BOUNDARY
                </span>
              </div>
            )}
            {guides.showSafeArea && (
              <div
                className="absolute border border-dashed border-amber-500/70 pointer-events-none"
                style={{
                  top: '0.42in',
                  right: '0.48in',
                  bottom: '0.4in',
                  left: '0.48in'
                }}
              >
                <span className="absolute top-0.5 left-1.5 text-[8px] font-mono font-bold text-amber-400 bg-amber-950/80 px-1 rounded border border-amber-600/50">
                  SAFE AREA
                </span>
              </div>
            )}
            {guides.showCenterFold && (
              <div
                className={`absolute top-0 bottom-0 w-0 border-r-2 border-dashed border-emerald-500/80 pointer-events-none ${
                  isLeft ? 'right-0' : 'left-0'
                }`}
              >
                <span className={`absolute top-2 text-[8px] font-mono font-bold text-emerald-300 bg-emerald-950/90 border border-emerald-600 px-1 py-0.5 rounded shadow-sm whitespace-nowrap ${
                  isLeft ? '-translate-x-full -mr-1' : 'left-0 ml-1'
                }`}>
                  CENTER FOLD
                </span>
              </div>
            )}
          </div>
        )}
        <span>[ Empty Page ]</span>
      </div>
    );
  }

  const actualPageIndex = pageIndex !== undefined && pageIndex >= 0
    ? pageIndex
    : pages.findIndex(p => p === page);

  const isLeft = pageNum ? isLeftPage(pageNum) : true;

  useLayoutEffect(() => {
    const el = pageRef.current;
    if (!el) return;

    const measureOverflow = () => {
      let maxOverflowPx = Math.max(0, el.scrollHeight - el.clientHeight);
      let overflowDirection = 'below';

      const pageRect = el.getBoundingClientRect();
      if (pageRect.height > 0) {
        const children = el.querySelectorAll('*');
        children.forEach((child) => {
          if (
            child.classList.contains('editor-guide') ||
            child.classList.contains('overflow-warning-banner') ||
            child.classList.contains('overflow-indicator') ||
            child.closest('.editor-guide') ||
            child.closest('.overflow-warning-banner')
          ) {
            return;
          }
          const rect = child.getBoundingClientRect();
          if (rect.height === 0 && rect.width === 0) return;

          const bottomDiff = rect.bottom - pageRect.bottom;
          if (bottomDiff > maxOverflowPx) {
            maxOverflowPx = bottomDiff;
            overflowDirection = 'below';
          }

          const rightDiff = rect.right - pageRect.right;
          if (rightDiff > maxOverflowPx && rightDiff > bottomDiff) {
            maxOverflowPx = rightDiff;
            overflowDirection = 'right';
          }
        });
      }

      if (maxOverflowPx > 2) {
        const inches = (maxOverflowPx / 96).toFixed(2);
        setOverflowState({
          hasOverflow: true,
          distanceInches: inches,
          direction: overflowDirection,
          overflowPx: Math.round(maxOverflowPx)
        });
      } else {
        setOverflowState({
          hasOverflow: false,
          distanceInches: '0',
          direction: 'below',
          overflowPx: 0
        });
      }
    };

    measureOverflow();

    const resizeObserver = new ResizeObserver(measureOverflow);
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, [page, actualPageIndex, page.type, page.blocks, page.content, page.items, page.leaders, page.sponsors]);

  const bgImgRaw = page.bgImage || theme.bgImage;
  const bgImgUrl = resolveAssetUrl(bgImgRaw);
  const rawOpacity = page.bgImage
    ? (page.bgImageOpacity !== undefined ? page.bgImageOpacity : 100)
    : (theme.bgImageOpacity !== undefined ? theme.bgImageOpacity : 100);
  const opacityVal = rawOpacity / 100;
  const alignClass = page.vAlign ? `align-${page.vAlign}` : '';

  const handlePointerDownDrag = (e, targetType, targetBlockIndex = null, initialX = 0, initialY = 0) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    setSelectedElement({
      pageIndex: actualPageIndex,
      blockIndex: targetBlockIndex,
      elementType: targetType
    });

    const startX = e.clientX;
    const startY = e.clientY;

    const SNAP_THRESHOLD = 8;

    const onPointerMove = (moveEvent) => {
      const deltaX = Math.round(moveEvent.clientX - startX);
      const deltaY = Math.round(moveEvent.clientY - startY);
      let newX = initialX + deltaX;
      let newY = initialY + deltaY;

      let snapX = false;
      let snapY = false;

      if (snapEnabled) {
        if (Math.abs(newX) <= SNAP_THRESHOLD) {
          newX = 0;
          snapX = true;
        }
        if (Math.abs(newY) <= SNAP_THRESHOLD) {
          newY = 0;
          snapY = true;
        }
      }

      setActiveSnapGuides({ snapX, snapY });

      if (targetType === 'block' && targetBlockIndex !== null) {
        updateContentBlock(actualPageIndex, targetBlockIndex, 'offsetX', newX, true);
        updateContentBlock(actualPageIndex, targetBlockIndex, 'offsetY', newY, true);
      } else {
        updatePageField(actualPageIndex, `${targetType}OffsetX`, newX, true);
        updatePageField(actualPageIndex, `${targetType}OffsetY`, newY, true);
      }
    };

    const onPointerUp = () => {
      setActiveSnapGuides({ snapX: false, snapY: false });
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handlePointerDownResize = (e, handleType, targetType, targetBlockIndex = null, initialW = 100, initialH = null, isPercent = false) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;

    const onPointerMove = (moveEvent) => {
      const deltaX = Math.round(moveEvent.clientX - startX);
      const deltaY = Math.round(moveEvent.clientY - startY);

      let dW = 0;
      let dH = 0;

      if (handleType.includes('r')) dW += deltaX;
      if (handleType.includes('l')) dW -= deltaX;
      if (handleType.includes('b')) dH += deltaY;
      if (handleType.includes('t')) dH -= deltaY;

      if (targetType === 'block' && targetBlockIndex !== null) {
        if (isPercent) {
          const percentChange = Math.round(dW / 2.5);
          const nextW = Math.min(100, Math.max(15, (initialW || 100) + percentChange));
          updateContentBlock(actualPageIndex, targetBlockIndex, 'width', nextW, true);
        } else {
          const nextW = Math.max(30, (initialW || 100) + dW);
          updateContentBlock(actualPageIndex, targetBlockIndex, 'width', nextW, true);
        }

        if (dH !== 0) {
          const baseH = initialH || 60;
          const nextH = Math.max(20, baseH + dH);
          updateContentBlock(actualPageIndex, targetBlockIndex, 'height', nextH, true);
        }
      } else {
        const fieldPrefix = targetType;
        const nextW = Math.min(500, Math.max(30, (initialW || 120) + dW));
        updatePageField(actualPageIndex, `${fieldPrefix}Width`, nextW, true);

        if (dH !== 0 || handleType.includes('b') || handleType.includes('t')) {
          const nextH = Math.min(500, Math.max(20, (initialH || 100) + dH));
          updatePageField(actualPageIndex, `${fieldPrefix}Height`, nextH, true);
        }
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
    const isBlock = targetType === 'block' && blockIndex !== null;
    const currentZ = isBlock
      ? (page.blocks?.[blockIndex]?.zIndex || (blockIndex + 1) * 10)
      : (page[`${targetType}ZIndex`] !== undefined ? page[`${targetType}ZIndex`] : 100);

    return (
      <div
        className="absolute -top-9 left-1/2 -translate-x-1/2 z-[999] bg-[#122230] text-white px-2 py-1 rounded-md shadow-2xl border border-[#70c0d0] flex items-center gap-1.5 text-[10px] select-none cursor-default whitespace-nowrap"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setSnapEnabled(!snapEnabled)}
          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold flex items-center gap-1 transition-colors ${
            snapEnabled
              ? 'bg-[#005f73] text-cyan-300 border border-[#70c0d0]'
              : 'bg-[#2a2a34] text-gray-400 border border-[#444] hover:text-white'
          }`}
          title={snapEnabled ? 'Smart Alignment Guides Active (Click to Disable)' : 'Smart Alignment Guides Disabled (Click to Enable)'}
        >
          <Grid className="w-2.5 h-2.5" />
          {snapEnabled ? 'SNAP ON' : 'SNAP OFF'}
        </button>

        <span className="flex items-center gap-0.5 text-cyan-300 font-mono font-bold pr-1 border-r border-[#3a3a44]">
          <Move className="w-3 h-3 text-amber-400" />
          {currentX >= 0 ? `+${currentX}` : currentX}x, {currentY >= 0 ? `+${currentY}` : currentY}y
        </span>

        {currentW !== null && (
          <span className="flex items-center gap-0.5 text-amber-300 font-mono text-[9px] pr-1 border-r border-[#3a3a44]">
            <Maximize2 className="w-2.5 h-2.5" />
            {currentW}{typeof currentW === 'number' && isBlock ? '%' : 'px'}
            {currentH !== null ? ` × ${currentH}px` : ''}
          </span>
        )}

        <span className="text-gray-400 font-mono text-[9px] pr-1 border-r border-[#3a3a44]">
          Z:{currentZ}
        </span>

        {isBlock ? (
          <>
            <div className="flex items-center gap-0.5 border-r border-[#3a3a44] pr-1">
              <button
                onClick={() => updateContentBlock(actualPageIndex, blockIndex, 'align', 'left')}
                className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
                title="Align Left"
              >
                <AlignLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => updateContentBlock(actualPageIndex, blockIndex, 'align', 'center')}
                className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
                title="Align Center"
              >
                <AlignCenter className="w-3 h-3" />
              </button>
              <button
                onClick={() => updateContentBlock(actualPageIndex, blockIndex, 'align', 'right')}
                className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
                title="Align Right"
              >
                <AlignRight className="w-3 h-3" />
              </button>
            </div>
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
              onClick={() => duplicateContentBlock(actualPageIndex, blockIndex)}
              className="p-1 hover:bg-[#005f73] rounded text-cyan-300 hover:text-white pl-1 border-l border-[#3a3a44]"
              title="Duplicate Block (Ctrl+D)"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={() => deleteContentBlock(actualPageIndex, blockIndex)}
              className="p-1 hover:bg-red-700 rounded text-red-300 hover:text-white"
              title="Delete Block (Delete)"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => updatePageField(actualPageIndex, `${targetType}ZIndex`, currentZ + 10)}
              className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
              title="Bring Element Forward"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => updatePageField(actualPageIndex, `${targetType}ZIndex`, Math.max(1, currentZ - 10))}
              className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
              title="Send Element Backward"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    );
  };

  const renderOverflowIndication = () => {
    if (!overflowState.hasOverflow) return null;

    const displayPageNum = pageNum ? `Page ${pageNum}` : `Page ${actualPageIndex + 1}`;

    return (
      <>
        {/* Top Floating Warning Banner */}
        <div className="overflow-warning-banner absolute top-1 left-1 right-1 bg-red-950/95 text-red-100 border-2 border-red-500 rounded p-1.5 shadow-2xl z-[950] font-mono text-[9.5px] font-bold flex items-center justify-between gap-1 border-dashed">
          <div className="flex items-center gap-1">
            <span className="text-red-400 text-xs font-black">⚠️</span>
            <span>{displayPageNum}: Content extends {overflowState.distanceInches} inches {overflowState.direction} the page.</span>
          </div>
        </div>

        {/* Hatched Overflow Zone Indicator */}
        <div className="overflow-indicator absolute -bottom-1 left-0 right-0 bg-[repeating-linear-gradient(45deg,rgba(220,38,38,0.35),rgba(220,38,38,0.35)_10px,rgba(0,0,0,0.5)_10px,rgba(0,0,0,0.5)_20px)] border-t-2 border-dashed border-red-500 z-[850] pointer-events-none flex items-center justify-center text-[9px] font-mono font-bold text-red-200 shadow-md min-h-[22px]">
          ⚠️ OVERFLOW (+{overflowState.distanceInches} in)
        </div>
      </>
    );
  };

  const renderGuidesOverlay = () => {
    if (!guides) return null;
    const { showPageBoundary, showSafeArea, showCenterFold, showBleed, showGrid } = guides;

    return (
      <div className="editor-guide pointer-events-none absolute inset-0 z-[800] select-none">
        {showGrid && (
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#005f7318_1px,transparent_1px),linear-gradient(to_bottom,#005f7318_1px,transparent_1px)] bg-[size:0.25in_0.25in]" />
        )}

        {showBleed && (
          <div className="absolute -inset-[0.125in] border-2 border-dashed border-rose-500/60 pointer-events-none">
            <span className={`absolute -top-2.5 text-[8px] font-mono font-bold text-rose-400 bg-black/90 px-1 rounded border border-rose-700/50 ${
              isLeft ? 'left-2' : 'right-2'
            }`}>
              BLEED 0.125"
            </span>
          </div>
        )}

        {showPageBoundary && (
          <div className="absolute inset-0 border-2 border-[#005f73] pointer-events-none">
            <span className={`absolute top-0 text-[8px] font-mono font-bold text-cyan-300 bg-[#122230]/90 px-1.5 py-0.5 rounded-b border-b border-x border-[#005f73] ${
              isLeft ? 'left-1' : 'right-1'
            }`}>
              5.5" × 8.5" BOUNDARY
            </span>
          </div>
        )}

        {showSafeArea && (
          <div
            className="absolute border border-dashed border-amber-500/70 pointer-events-none"
            style={{
              top: '0.42in',
              right: '0.48in',
              bottom: '0.4in',
              left: '0.48in'
            }}
          >
            <span className="absolute top-0.5 left-1.5 text-[8px] font-mono font-bold text-amber-400 bg-amber-950/80 px-1 rounded border border-amber-600/50">
              SAFE AREA
            </span>
          </div>
        )}

        {showCenterFold && (
          <div
            className={`absolute top-0 bottom-0 w-0 border-r-2 border-dashed border-emerald-500/80 pointer-events-none ${
              isLeft ? 'right-0' : 'left-0'
            }`}
          >
            <span className={`absolute top-2 text-[8px] font-mono font-bold text-emerald-300 bg-emerald-950/90 border border-emerald-600 px-1 py-0.5 rounded shadow-sm whitespace-nowrap ${
              isLeft ? '-translate-x-full -mr-1' : 'left-0 ml-1'
            }`}>
              CENTER FOLD
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderSmartGuides = () => {
    if (!snapEnabled) return null;
    return (
      <>
        {activeSnapGuides.snapX && (
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 border-l-2 border-dashed border-cyan-400 z-[900] pointer-events-none shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
        )}
        {activeSnapGuides.snapY && (
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 border-t-2 border-dashed border-amber-400 z-[900] pointer-events-none shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
        )}
        {(activeSnapGuides.snapX || activeSnapGuides.snapY) && (
          <div className="absolute top-2 right-2 bg-black/80 text-cyan-300 text-[9px] font-mono px-2 py-0.5 rounded border border-cyan-500/50 z-[950] pointer-events-none flex items-center gap-1 shadow-lg backdrop-blur-sm">
            <Grid className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
            Snapped to {activeSnapGuides.snapX && activeSnapGuides.snapY ? 'Center X & Y' : activeSnapGuides.snapX ? 'Center X' : 'Center Y'}
          </div>
        )}
      </>
    );
  };

  const renderResizeHandles = (targetType, blockIndex = null, currentW = 100, currentH = null, isPercent = false) => {
    return (
      <>
        <div
          onPointerDown={(e) => handlePointerDownResize(e, 'tl', targetType, blockIndex, currentW, currentH, isPercent)}
          className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#005f73] rounded-full z-[1000] cursor-nwse-resize shadow hover:scale-125 transition-transform"
          title="Drag corner to resize"
        />
        <div
          onPointerDown={(e) => handlePointerDownResize(e, 'tr', targetType, blockIndex, currentW, currentH, isPercent)}
          className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#005f73] rounded-full z-[1000] cursor-nesw-resize shadow hover:scale-125 transition-transform"
          title="Drag corner to resize"
        />
        <div
          onPointerDown={(e) => handlePointerDownResize(e, 'bl', targetType, blockIndex, currentW, currentH, isPercent)}
          className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#005f73] rounded-full z-[1000] cursor-nesw-resize shadow hover:scale-125 transition-transform"
          title="Drag corner to resize"
        />
        <div
          onPointerDown={(e) => handlePointerDownResize(e, 'br', targetType, blockIndex, currentW, currentH, isPercent)}
          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#005f73] rounded-full z-[1000] cursor-nwse-resize shadow hover:scale-125 transition-transform"
          title="Drag corner to resize"
        />

        <div
          onPointerDown={(e) => handlePointerDownResize(e, 'r', targetType, blockIndex, currentW, currentH, isPercent)}
          className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-4 bg-[#005f73] border border-white rounded z-[1000] cursor-ew-resize shadow hover:scale-125 transition-transform"
          title="Drag edge to adjust width"
        />
        <div
          onPointerDown={(e) => handlePointerDownResize(e, 'l', targetType, blockIndex, currentW, currentH, isPercent)}
          className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-4 bg-[#005f73] border border-white rounded z-[1000] cursor-ew-resize shadow hover:scale-125 transition-transform"
          title="Drag edge to adjust width"
        />
        <div
          onPointerDown={(e) => handlePointerDownResize(e, 'b', targetType, blockIndex, currentW, currentH, isPercent)}
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-[#005f73] border border-white rounded z-[1000] cursor-ns-resize shadow hover:scale-125 transition-transform"
          title="Drag edge to adjust height"
        />
        <div
          onPointerDown={(e) => handlePointerDownResize(e, 't', targetType, blockIndex, currentW, currentH, isPercent)}
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-[#005f73] border border-white rounded z-[1000] cursor-ns-resize shadow hover:scale-125 transition-transform"
          title="Drag edge to adjust height"
        />
      </>
    );
  };

  const renderCanvaWrapper = ({ targetType, blockIndex = null, currentX = 0, currentY = 0, currentW = null, currentH = null, isPercent = false, className = '', style = {}, children }) => {
    const isSelected = selectedElement?.pageIndex === actualPageIndex &&
      selectedElement?.elementType === targetType &&
      (blockIndex === null || selectedElement?.blockIndex === blockIndex);

    return (
      <div
        className={`group relative cursor-grab active:cursor-grabbing transition-shadow rounded p-0.5 ${
          isSelected
            ? 'ring-2 ring-[#005f73] outline outline-1 outline-[#70c0d0] shadow-md bg-[#005f73]/10 z-[200]'
            : 'hover:outline hover:outline-1 hover:outline-amber-500/50'
        } ${className}`}
        style={style}
        onPointerDown={(e) => handlePointerDownDrag(e, targetType, blockIndex, currentX, currentY)}
      >
        {isSelected && renderCanvaToolbar(targetType, blockIndex, currentX, currentY, currentW, currentH)}
        {isSelected && renderResizeHandles(targetType, blockIndex, currentW, currentH, isPercent)}
        {children}
      </div>
    );
  };

  const renderContentBlocks = (blocks) => {
    if (!blocks || blocks.length === 0) return null;
    return (
      <div className="space-y-1 mt-1 w-full">
        {blocks.map((b, idx) => {
          const align = b.align || (b.type === 'image' ? 'center' : 'left');
          const zIndexVal = b.zIndex !== undefined ? b.zIndex : (idx + 1) * 10;
          const currentW = b.width !== undefined ? b.width : 100;
          const currentH = b.height !== undefined ? b.height : null;

          const blockContainerStyle = {
            width: `${currentW}%`,
            height: currentH ? `${currentH}px` : undefined,
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
            const blockImgSrc = resolveAssetUrl(b.url);
            if (!blockImgSrc) {
              innerBlockContent = (
                <div className="p-2 border border-dashed border-gray-400 text-gray-500 text-[10px] text-center rounded h-full flex items-center justify-center">
                  [ Image Block: Select or Upload in Sidebar ]
                </div>
              );
            } else {
              let borderRadius = '4px';
              if (b.shape === 'circle') borderRadius = '50%';
              if (b.shape === 'square' || b.shape === 'natural') borderRadius = '0px';

              innerBlockContent = (
                <div className="my-1 h-full w-full flex items-center justify-center">
                  <img
                    src={blockImgSrc}
                    alt="Block Content"
                    draggable={false}
                    className="image-block inline-block max-w-full select-none"
                    style={{
                      borderRadius,
                      maxHeight: currentH ? `${currentH}px` : '220px',
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
            <React.Fragment key={b.id || idx}>
              {renderCanvaWrapper({
                targetType: 'block',
                blockIndex: idx,
                currentX: b.offsetX || 0,
                currentY: b.offsetY || 0,
                currentW,
                currentH,
                isPercent: true,
                style: blockContainerStyle,
                children: innerBlockContent
              })}
            </React.Fragment>
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

    const currentEmblemW = page.emblemWidth || 120;
    const currentEmblemH = page.emblemHeight || 120;
    const emblemSrc = resolveAssetUrl(page.emblemImg);

    const emblemElement = renderCanvaWrapper({
      targetType: 'emblem',
      currentX: page.emblemOffsetX || 0,
      currentY: page.emblemOffsetY || 0,
      currentW: currentEmblemW,
      currentH: currentEmblemH,
      className: 'patch-emblem-box',
      style: {
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
      },
      children: emblemSrc ? (
        <img src={emblemSrc} alt="Emblem" draggable={false} className="w-full h-full object-contain select-none" />
      ) : (
        <span
          style={{ color: 'var(--navy-dark)' }}
          className="font-bold text-[0.7rem] text-center"
        >
          {page.emblemText || '[ Emblem ]'}
        </span>
      )
    });

    const titleGroup = renderCanvaWrapper({
      targetType: 'titleGroup',
      currentX: page.titleGroupOffsetX || 0,
      currentY: page.titleGroupOffsetY || 0,
      currentW: page.titleGroupWidth || null,
      currentH: page.titleGroupHeight || null,
      style: {
        transform: (page.titleGroupOffsetX || page.titleGroupOffsetY) ? `translate(${page.titleGroupOffsetX || 0}px, ${page.titleGroupOffsetY || 0}px)` : undefined,
        width: page.titleGroupWidth ? `${page.titleGroupWidth}px` : undefined,
        height: page.titleGroupHeight ? `${page.titleGroupHeight}px` : undefined,
        zIndex: page.titleGroupZIndex !== undefined ? page.titleGroupZIndex : 90,
        position: 'relative'
      },
      children: (
        <div className={frameClassName}>
          <div className="scroll-title-group">
            <h2>{page.title || ''}</h2>
            <h3>{page.subtitle || ''}</h3>
            <p>{page.dateLocation || ''}</p>
          </div>
        </div>
      )
    });

    const taglineElement = renderCanvaWrapper({
      targetType: 'tagline',
      currentX: page.taglineOffsetX || 0,
      currentY: page.taglineOffsetY || 0,
      currentW: page.taglineWidth || null,
      currentH: page.taglineHeight || null,
      style: {
        transform: (page.taglineOffsetX || page.taglineOffsetY) ? `translate(${page.taglineOffsetX || 0}px, ${page.taglineOffsetY || 0}px)` : undefined,
        width: page.taglineWidth ? `${page.taglineWidth}px` : undefined,
        height: page.taglineHeight ? `${page.taglineHeight}px` : undefined,
        zIndex: page.taglineZIndex !== undefined ? page.taglineZIndex : 80,
        position: 'relative'
      },
      children: (
        <div
          style={{ color: 'var(--charcoal)' }}
          className="text-[0.78rem] italic font-semibold text-center"
        >
          {page.tagline || ''}
        </div>
      )
    });

    contentHTML = (
      <>
        <div
          className="top-banner-bar"
          style={{ background: page.topBarColor || theme.tealAccent || 'var(--teal-accent)' }}
        />
        {emblemElement}
        {titleGroup}
        {taglineElement}
        {renderContentBlocks(page.blocks)}
        {renderBottomBanner()}
      </>
    );

    return (
      <div
        ref={pageRef}
        id={`spread-page-${actualPageIndex}`}
        data-page-index={actualPageIndex}
        data-page-num={pageNum || actualPageIndex + 1}
        data-has-overflow={overflowState.hasOverflow}
        data-overflow-inches={overflowState.distanceInches}
        className={`booklet-page cover-page ${alignClass} relative ${overflowState.hasOverflow ? 'has-overflow ring-2 ring-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''}`}
        onClick={() => setSelectedElement(null)}
      >
        {renderBgLayer()}
        {renderGuidesOverlay()}
        {renderSmartGuides()}
        {renderOverflowIndication()}
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
    const qrSrc = resolveAssetUrl(page.qrImg);

    const headerElement = renderCanvaWrapper({
      targetType: 'headerGroup',
      currentX: page.headerGroupOffsetX || 0,
      currentY: page.headerGroupOffsetY || 0,
      currentW: page.headerGroupWidth || null,
      currentH: page.headerGroupHeight || null,
      style: {
        transform: (page.headerGroupOffsetX || page.headerGroupOffsetY) ? `translate(${page.headerGroupOffsetX || 0}px, ${page.headerGroupOffsetY || 0}px)` : undefined,
        width: page.headerGroupWidth ? `${page.headerGroupWidth}px` : undefined,
        height: page.headerGroupHeight ? `${page.headerGroupHeight}px` : undefined,
        zIndex: page.headerGroupZIndex !== undefined ? page.headerGroupZIndex : 100,
        position: 'relative'
      },
      children: (
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
      )
    });

    const qrElement = renderCanvaWrapper({
      targetType: 'qrGroup',
      currentX: page.qrGroupOffsetX || 0,
      currentY: page.qrGroupOffsetY || 0,
      currentW: page.qrGroupWidth || 70,
      currentH: page.qrGroupHeight || 70,
      style: {
        transform: (page.qrGroupOffsetX || page.qrGroupOffsetY) ? `translate(${page.qrGroupOffsetX || 0}px, ${page.qrGroupOffsetY || 0}px)` : undefined,
        width: page.qrGroupWidth ? `${page.qrGroupWidth}px` : '70px',
        height: page.qrGroupHeight ? `${page.qrGroupHeight}px` : '70px',
        zIndex: page.qrGroupZIndex !== undefined ? page.qrGroupZIndex : 90,
        position: 'relative',
        margin: '8px auto'
      },
      children: (
        <div className="w-full h-full bg-white border border-gray-300 flex items-center justify-center text-[0.58rem] text-gray-500 overflow-hidden">
          {qrSrc ? (
            <img src={qrSrc} alt="QR Code" draggable={false} className="w-full h-full object-cover select-none" />
          ) : (
            '[ QR CODE ]'
          )}
        </div>
      )
    });

    contentHTML = (
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
        {renderContentBlocks(page.blocks)}
        {renderBottomBanner()}
      </>
    );

    return (
      <div
        ref={pageRef}
        id={`spread-page-${actualPageIndex}`}
        data-page-index={actualPageIndex}
        data-page-num={pageNum || actualPageIndex + 1}
        data-has-overflow={overflowState.hasOverflow}
        data-overflow-inches={overflowState.distanceInches}
        className={`booklet-page cover-page ${alignClass} relative ${overflowState.hasOverflow ? 'has-overflow ring-2 ring-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''}`}
        style={{ justifyContent: 'center', textAlign: 'center' }}
        onClick={() => setSelectedElement(null)}
      >
        {renderBgLayer()}
        {renderGuidesOverlay()}
        {renderSmartGuides()}
        {renderOverflowIndication()}
        {contentHTML}
        {pageNum && (
          <span className={`page-number-tag ${isLeft ? 'left' : 'right'}`}>
            Page {pageNum}
          </span>
        )}
      </div>
    );
  }

  const renderPageTitle = (fallbackTitle) => {
    return renderCanvaWrapper({
      targetType: 'pageTitle',
      currentX: page.pageTitleOffsetX || 0,
      currentY: page.pageTitleOffsetY || 0,
      currentW: page.pageTitleWidth || null,
      currentH: page.pageTitleHeight || null,
      style: {
        transform: (page.pageTitleOffsetX || page.pageTitleOffsetY) ? `translate(${page.pageTitleOffsetX || 0}px, ${page.pageTitleOffsetY || 0}px)` : undefined,
        width: page.pageTitleWidth ? `${page.pageTitleWidth}px` : undefined,
        height: page.pageTitleHeight ? `${page.pageTitleHeight}px` : undefined,
        zIndex: page.pageTitleZIndex !== undefined ? page.pageTitleZIndex : 110,
        position: 'relative'
      },
      children: (
        <div className="page-title">{page.title || fallbackTitle}</div>
      )
    });
  };

  if (pageType === 'schedule') {
    const items = page.items || [];
    contentHTML = (
      <div>
        {renderPageTitle('Schedule')}
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
        {renderPageTitle('Leadership')}
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
          {renderContentBlocks(page.blocks)}
        </div>
      </div>
    );
  } else if (pageType === 'keynote') {
    const speakerSrc = resolveAssetUrl(page.speakerImg);
    contentHTML = (
      <div>
        {renderPageTitle('Keynote Speaker')}
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
          {renderContentBlocks(page.blocks)}
        </div>
      </div>
    );
  } else if (pageType === 'awards') {
    const awards = page.awards || [];
    const featured = page.featuredAwards || [];
    contentHTML = (
      <div>
        {renderPageTitle('Awards')}
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
        {renderContentBlocks(page.blocks)}
      </div>
    );
  } else if (pageType === 'vigilIntro') {
    const honoreeSrc = resolveAssetUrl(page.honoreePhoto);
    contentHTML = (
      <div>
        {renderPageTitle('Vigil Honor')}
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
        {renderContentBlocks(page.blocks)}
      </div>
    );
  } else if (pageType === 'roster') {
    const members = page.members || [];
    contentHTML = (
      <div>
        {renderPageTitle('Roster')}
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
        {renderContentBlocks(page.blocks)}
      </div>
    );
  } else {
    const mainContentElement = renderCanvaWrapper({
      targetType: 'mainContent',
      currentX: page.mainContentOffsetX || 0,
      currentY: page.mainContentOffsetY || 0,
      currentW: page.mainContentWidth || null,
      currentH: page.mainContentHeight || null,
      style: {
        transform: (page.mainContentOffsetX || page.mainContentOffsetY) ? `translate(${page.mainContentOffsetX || 0}px, ${page.mainContentOffsetY || 0}px)` : undefined,
        width: page.mainContentWidth ? `${page.mainContentWidth}px` : undefined,
        height: page.mainContentHeight ? `${page.mainContentHeight}px` : undefined,
        zIndex: page.mainContentZIndex !== undefined ? page.mainContentZIndex : 50,
        position: 'relative'
      },
      children: (
        <div
          className="page-content-area text-[0.75rem] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: page.content || '' }}
        />
      )
    });

    contentHTML = (
      <div>
        {renderPageTitle('Title')}
        {mainContentElement}
        {renderContentBlocks(page.blocks)}
      </div>
    );
  }

  return (
    <div
      ref={pageRef}
      id={`spread-page-${actualPageIndex}`}
      data-page-index={actualPageIndex}
      data-page-num={pageNum || actualPageIndex + 1}
      data-has-overflow={overflowState.hasOverflow}
      data-overflow-inches={overflowState.distanceInches}
      className={`booklet-page ${alignClass} relative ${overflowState.hasOverflow ? 'has-overflow ring-2 ring-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''}`}
      onClick={() => setSelectedElement(null)}
    >
      {renderBgLayer()}
      {renderGuidesOverlay()}
      {renderSmartGuides()}
      {renderOverflowIndication()}
      {contentHTML}
      {pageNum && (
        <span className={`page-number-tag ${isLeft ? 'left' : 'right'}`}>
          Page {pageNum}
        </span>
      )}
    </div>
  );
}
