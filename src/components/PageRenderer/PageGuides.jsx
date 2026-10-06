import React from 'react';

export default function PageGuides({ guides, isLeft }) {
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
}
