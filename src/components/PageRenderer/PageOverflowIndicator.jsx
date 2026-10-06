import React from 'react';

export default function PageOverflowIndicator({ overflowState, pageNum, actualPageIndex }) {
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
}
