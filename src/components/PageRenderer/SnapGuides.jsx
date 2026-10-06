import React from 'react';
import { Grid } from 'lucide-react';

export default function SnapGuides({ snapEnabled, activeSnapGuides }) {
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
          Snapped to {activeSnapGuides.label || (activeSnapGuides.snapX && activeSnapGuides.snapY ? 'Center X & Y' : activeSnapGuides.snapX ? 'Center X' : 'Center Y')}
        </div>
      )}
    </>
  );
}
