import React, { useState, useRef, useLayoutEffect } from 'react';
import { useBooklet } from '../context/BookletContext.jsx';
import { isLeftPage } from '../utils/imposition.js';
import EmptyPage from './PageRenderer/EmptyPage.jsx';
import PageBackground from './PageRenderer/PageBackground.jsx';
import PageGuides from './PageRenderer/PageGuides.jsx';
import SnapGuides from './PageRenderer/SnapGuides.jsx';
import PageOverflowIndicator from './PageRenderer/PageOverflowIndicator.jsx';
import CoverPage from './PageRenderer/CoverPage.jsx';
import BackCoverPage from './PageRenderer/BackCoverPage.jsx';
import SchedulePage from './PageRenderer/SchedulePage.jsx';
import LeadershipPage from './PageRenderer/LeadershipPage.jsx';
import KeynotePage from './PageRenderer/KeynotePage.jsx';
import AwardsPage from './PageRenderer/AwardsPage.jsx';
import VigilPage from './PageRenderer/VigilPage.jsx';
import RosterPage from './PageRenderer/RosterPage.jsx';
import CustomPage from './PageRenderer/CustomPage.jsx';

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
    guides,
    resolveAssetUrl
  } = useBooklet();

  const isLeft = pageNum ? isLeftPage(pageNum) : true;

  if (!page) {
    return <EmptyPage guides={guides} isLeft={isLeft} />;
  }

  const actualPageIndex = pageIndex !== undefined && pageIndex >= 0
    ? pageIndex
    : pages.findIndex(p => p === page);

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
    const GRID_STEP_PX = 24; // 0.25 inch = 24px

    const onPointerMove = (moveEvent) => {
      const deltaX = Math.round(moveEvent.clientX - startX);
      const deltaY = Math.round(moveEvent.clientY - startY);
      let newX = initialX + deltaX;
      let newY = initialY + deltaY;

      let snapX = false;
      let snapY = false;
      let snapLabel = 'Center';

      if (snapEnabled) {
        // Snap to center (X=0, Y=0)
        if (Math.abs(newX) <= SNAP_THRESHOLD) {
          newX = 0;
          snapX = true;
          snapLabel = 'Center X';
        }
        if (Math.abs(newY) <= SNAP_THRESHOLD) {
          newY = 0;
          snapY = true;
          snapLabel = snapX ? 'Center X & Y' : 'Center Y';
        }

        // Snap to 0.25" Grid if grid is enabled or if near grid intervals
        if (!snapX && guides?.showGrid) {
          const nearestGridX = Math.round(newX / GRID_STEP_PX) * GRID_STEP_PX;
          if (Math.abs(newX - nearestGridX) <= SNAP_THRESHOLD) {
            newX = nearestGridX;
            snapX = true;
            snapLabel = `Grid X (${(newX / 96).toFixed(2)}")`;
          }
        }
        if (!snapY && guides?.showGrid) {
          const nearestGridY = Math.round(newY / GRID_STEP_PX) * GRID_STEP_PX;
          if (Math.abs(newY - nearestGridY) <= SNAP_THRESHOLD) {
            newY = nearestGridY;
            snapY = true;
            snapLabel = snapX ? `Grid` : `Grid Y (${(newY / 96).toFixed(2)}")`;
          }
        }
      }

      setActiveSnapGuides({ snapX, snapY, label: snapLabel });

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

  const canvaProps = {
    actualPageIndex,
    page,
    selectedElement,
    snapEnabled,
    setSnapEnabled,
    handlePointerDownDrag,
    handlePointerDownResize,
    updateContentBlock,
    updatePageField,
    reorderContentBlockLayer,
    deleteContentBlock,
    duplicateContentBlock
  };

  const pageType = page.type || 'custom';
  const isCoverType = pageType === 'cover' || pageType === 'backCover';
  const pageClassName = `booklet-page ${isCoverType ? 'cover-page' : ''} ${alignClass} relative ${
    overflowState.hasOverflow ? 'has-overflow ring-2 ring-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''
  }`.trim();

  const pageContainerStyle = pageType === 'backCover' ? { justifyContent: 'center', textAlign: 'center' } : undefined;

  let pageContent = null;
  if (pageType === 'cover') {
    pageContent = <CoverPage page={page} theme={theme} resolveAssetUrl={resolveAssetUrl} canvaProps={canvaProps} />;
  } else if (pageType === 'backCover') {
    pageContent = <BackCoverPage page={page} resolveAssetUrl={resolveAssetUrl} canvaProps={canvaProps} />;
  } else if (pageType === 'schedule') {
    pageContent = <SchedulePage page={page} resolveAssetUrl={resolveAssetUrl} canvaProps={canvaProps} />;
  } else if (pageType === 'leadership') {
    pageContent = <LeadershipPage page={page} resolveAssetUrl={resolveAssetUrl} canvaProps={canvaProps} />;
  } else if (pageType === 'keynote') {
    pageContent = <KeynotePage page={page} resolveAssetUrl={resolveAssetUrl} canvaProps={canvaProps} />;
  } else if (pageType === 'awards') {
    pageContent = <AwardsPage page={page} resolveAssetUrl={resolveAssetUrl} canvaProps={canvaProps} />;
  } else if (pageType === 'vigilIntro') {
    pageContent = <VigilPage page={page} resolveAssetUrl={resolveAssetUrl} canvaProps={canvaProps} />;
  } else if (pageType === 'roster') {
    pageContent = <RosterPage page={page} resolveAssetUrl={resolveAssetUrl} canvaProps={canvaProps} />;
  } else {
    pageContent = <CustomPage page={page} resolveAssetUrl={resolveAssetUrl} canvaProps={canvaProps} />;
  }

  return (
    <div
      ref={pageRef}
      id={`spread-page-${actualPageIndex}`}
      data-page-index={actualPageIndex}
      data-page-num={pageNum || actualPageIndex + 1}
      data-has-overflow={overflowState.hasOverflow}
      data-overflow-inches={overflowState.distanceInches}
      className={pageClassName}
      style={pageContainerStyle}
      onClick={() => setSelectedElement(null)}
    >
      <PageBackground bgImgUrl={bgImgUrl} opacityVal={opacityVal} />
      <PageGuides guides={guides} isLeft={isLeft} />
      <SnapGuides snapEnabled={snapEnabled} activeSnapGuides={activeSnapGuides} />
      <PageOverflowIndicator overflowState={overflowState} pageNum={pageNum} actualPageIndex={actualPageIndex} />
      {pageContent}
      {pageNum && (
        <span className={`page-number-tag ${isLeft ? 'left' : 'right'}`}>
          Page {pageNum}
        </span>
      )}
    </div>
  );
}
