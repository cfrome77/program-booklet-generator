import React, { useRef, useState, useEffect } from 'react';
import { useBooklet } from '../context/BookletContext.jsx';

export default function RulerWrapper({ children, widthIn = 11, heightIn = 8.5 }) {
  const { guides, zoomLevel } = useBooklet();
  const showRulers = guides?.showRulers !== false;
  const containerRef = useRef(null);
  const [computedScale, setComputedScale] = useState(1.0);

  const widthPx = widthIn * 96; // 1056px for 11in
  const heightPx = heightIn * 96; // 816px for 8.5in
  const rulerThickness = showRulers ? 22 : 0;

  // Calculate dynamic scale if zoomLevel is 'fit-page' or 'fit-width'
  useEffect(() => {
    const updateScale = () => {
      if (zoomLevel === '50%') { setComputedScale(0.5); return; }
      if (zoomLevel === '75%') { setComputedScale(0.75); return; }
      if (zoomLevel === '100%') { setComputedScale(1.0); return; }
      if (zoomLevel === '125%') { setComputedScale(1.25); return; }
      if (zoomLevel === '150%') { setComputedScale(1.5); return; }

      const parent = containerRef.current?.parentElement;
      if (!parent) { setComputedScale(1.0); return; }

      const availableWidth = parent.clientWidth - 40; // padding buffer
      const totalWidth = widthPx + rulerThickness;
      const totalHeight = heightPx + rulerThickness;

      if (zoomLevel === 'fit-width') {
        const scale = Math.min(1.5, Math.max(0.3, availableWidth / totalWidth));
        setComputedScale(scale);
      } else if (zoomLevel === 'fit-page') {
        const availableHeight = window.innerHeight - 220; // header/controls buffer
        const scaleX = availableWidth / totalWidth;
        const scaleY = availableHeight / totalHeight;
        const scale = Math.min(1.5, Math.max(0.3, Math.min(scaleX, scaleY)));
        setComputedScale(scale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [zoomLevel, showRulers, widthPx, heightPx, rulerThickness]);

  const renderTopRuler = () => {
    const ticks = [];
    const labels = [];
    const totalEighths = widthIn * 8; // 88 eighths in 11in

    for (let i = 0; i <= totalEighths; i++) {
      const x = i * 12; // 12px per 1/8 inch
      let tickHeight = 4;
      let isInch = i % 8 === 0;
      let isHalf = i % 4 === 0 && !isInch;
      let isQuarter = i % 2 === 0 && !isInch && !isHalf;

      if (isInch) tickHeight = 14;
      else if (isHalf) tickHeight = 10;
      else if (isQuarter) tickHeight = 7;

      const isCenter = i === 44; // 5.5 inches

      ticks.push(
        <line
          key={`t-top-${i}`}
          x1={x}
          y1={22}
          x2={x}
          y2={22 - tickHeight}
          stroke={isCenter ? '#10b981' : isInch ? '#70c0d0' : '#666675'}
          strokeWidth={isCenter ? 2 : isInch ? 1.5 : 1}
        />
      );

      if (isInch) {
        const inchVal = i / 8;
        labels.push(
          <text
            key={`l-top-${i}`}
            x={x + (inchVal === 0 ? 3 : inchVal === widthIn ? -3 : 0)}
            y={8}
            textAnchor={inchVal === 0 ? 'start' : inchVal === widthIn ? 'end' : 'middle'}
            fill={isCenter ? '#34d399' : '#e0e0e0'}
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {inchVal}"
          </text>
        );
      }
    }

    return (
      <div className="relative border-b border-[#3f3f4e] bg-[#141418] select-none" style={{ width: `${widthIn}in`, height: '22px' }}>
        <svg width="100%" height="22" viewBox={`0 0 ${widthPx} 22`} className="overflow-visible block">
          {ticks}
          {labels}
        </svg>
      </div>
    );
  };

  const renderLeftRuler = () => {
    const ticks = [];
    const labels = [];
    const totalEighths = Math.floor(heightIn * 8); // 68 eighths in 8.5in

    for (let i = 0; i <= totalEighths; i++) {
      const y = i * 12; // 12px per 1/8 inch
      let tickWidth = 4;
      let isInch = i % 8 === 0;
      let isHalf = i % 4 === 0 && !isInch;
      let isQuarter = i % 2 === 0 && !isInch && !isHalf;

      if (isInch) tickWidth = 14;
      else if (isHalf) tickWidth = 10;
      else if (isQuarter) tickWidth = 7;

      ticks.push(
        <line
          key={`t-left-${i}`}
          x1={22}
          y1={y}
          x2={22 - tickWidth}
          y2={y}
          stroke={isInch ? '#70c0d0' : '#666675'}
          strokeWidth={isInch ? 1.5 : 1}
        />
      );

      if (isInch) {
        const inchVal = i / 8;
        labels.push(
          <text
            key={`l-left-${i}`}
            x={10}
            y={y === 0 ? 9 : y === heightPx ? y - 2 : y + 3}
            textAnchor="middle"
            fill="#e0e0e0"
            fontSize="8"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {inchVal}"
          </text>
        );
      }
    }

    // Add 8.5" label at the end
    const lastY = 8.5 * 96;
    ticks.push(
      <line
        key="t-left-8.5"
        x1={22}
        y1={lastY}
        x2={8}
        y2={lastY}
        stroke="#70c0d0"
        strokeWidth={1.5}
      />
    );
    labels.push(
      <text
        key="l-left-8.5"
        x={10}
        y={lastY - 2}
        textAnchor="middle"
        fill="#e0e0e0"
        fontSize="7.5"
        fontFamily="monospace"
        fontWeight="bold"
      >
        8.5"
      </text>
    );

    return (
      <div className="relative border-r border-[#3f3f4e] bg-[#141418] select-none" style={{ height: `${heightIn}in`, width: '22px' }}>
        <svg width="22" height="100%" viewBox={`0 0 22 ${heightPx}`} className="overflow-visible block">
          {ticks}
          {labels}
        </svg>
      </div>
    );
  };

  // Outer dimension including scale for CSS transform wrapper
  const outerWidthPx = Math.round((widthPx + rulerThickness) * computedScale);
  const outerHeightPx = Math.round((heightPx + rulerThickness) * computedScale);

  return (
    <div
      ref={containerRef}
      className="ruler-outer-container flex flex-col items-center justify-center my-3 transition-all duration-200"
      style={{
        width: `${outerWidthPx}px`,
        height: `${outerHeightPx}px`
      }}
    >
      <div
        className="ruler-scaled-content flex flex-col shadow-2xl rounded-md overflow-hidden bg-[#181820] border border-[#3a3a46]"
        style={{
          transform: `scale(${computedScale})`,
          transformOrigin: 'top left',
          width: `${widthPx + rulerThickness}px`,
          height: `${heightPx + rulerThickness}px`
        }}
      >
        {showRulers ? (
          <>
            <div className="flex items-center">
              {/* Top-Left Corner Box */}
              <div className="w-[22px] h-[22px] bg-[#101014] border-b border-r border-[#3f3f4e] flex items-center justify-center text-[9px] font-mono font-bold text-amber-400 select-none">
                in
              </div>
              {renderTopRuler()}
            </div>

            <div className="flex items-start">
              {renderLeftRuler()}
              <div className="relative" style={{ width: `${widthIn}in`, height: `${heightIn}in` }}>
                {children}
              </div>
            </div>
          </>
        ) : (
          <div className="relative" style={{ width: `${widthIn}in`, height: `${heightIn}in` }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
