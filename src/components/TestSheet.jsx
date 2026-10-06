import React from 'react';
import { Printer, AlertTriangle, ArrowUp, ArrowDown, Scissors, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function TestSheet() {
  return (
    <div id="test-sheet-container" className="flex flex-col items-center gap-8 w-full py-4 text-slate-800">
      {/* Front (Outer) Test Sheet */}
      <div className="test-sheet-wrapper relative w-[11in] h-[8.5in] bg-[#fdfcf7] border-2 border-slate-800 shadow-2xl flex flex-col justify-between p-6 overflow-hidden select-none box-border">
        {/* Top Orientation Bar */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 bg-amber-100/60 -mx-6 -mt-6 px-6 pt-4">
          <div className="flex items-center gap-2 font-mono font-bold text-xs text-amber-900 uppercase">
            <ArrowUp className="w-4 h-4 text-emerald-700 animate-bounce" />
            <span>TOP EDGE ▲ (FEED DIRECTION)</span>
          </div>
          <div className="font-mono font-black text-sm text-slate-900 tracking-wider">
            PRINTER DUPLEX TEST SHEET — SHEET 1 FRONT (OUTER)
          </div>
          <div className="flex items-center gap-2 font-mono font-bold text-xs text-amber-900 uppercase">
            <span>TOP EDGE ▲</span>
            <ArrowUp className="w-4 h-4 text-emerald-700 animate-bounce" />
          </div>
        </div>

        {/* Center Vertical Fold Line Indicator */}
        <div className="absolute left-1/2 top-12 bottom-12 -translate-x-1/2 w-0 border-l-2 border-dashed border-red-500 z-30 flex flex-col items-center justify-between pointer-events-none">
          <span className="bg-red-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow -mt-2">
            CENTER FOLD & STAPLE LINE
          </span>
          <Scissors className="w-5 h-5 text-red-600 my-auto bg-[#fdfcf7] p-0.5 rounded-full border border-red-400" />
          <span className="bg-red-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow -mb-2">
            FOLD HERE (5.5 in)
          </span>
        </div>

        {/* Main Content Area Split Left & Right */}
        <div className="grid grid-cols-2 gap-8 flex-1 my-4 relative z-10">
          {/* Left Side (Outer Back Page) */}
          <div className="border-2 border-dashed border-slate-400 rounded-lg p-4 flex flex-col justify-between bg-white/70 relative">
            <div className="absolute top-2 left-2 right-2 bottom-2 border border-dotted border-emerald-500/60 rounded pointer-events-none flex items-start justify-end p-1">
              <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 rounded">SAFE MARGIN AREA (0.35 in)</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-300 pb-2">
              <span className="bg-slate-800 text-white font-mono text-xs font-bold px-2 py-1 rounded">
                LEFT SIDE — PAGE 4 / OUTER BACK
              </span>
              <span className="font-mono text-xs font-bold text-slate-500">5.5" × 8.5" HALF</span>
            </div>

            <div className="space-y-3 my-auto text-center px-2">
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-900 px-3 py-1.5 rounded-full text-xs font-bold font-mono">
                <Printer className="w-4 h-4 text-indigo-600" />
                OUTER BACK COVER PANEL
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                Printer Alignment & Duplex Test
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                This panel verifies physical sheet boundary, margin alignment, and double-sided flipping orientation.
              </p>
            </div>

            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>TRIM BOUNDARY: 5.5" × 8.5"</span>
              <span>ORIENTATION: UP-RIGHT</span>
            </div>
          </div>

          {/* Right Side (Outer Front Page) */}
          <div className="border-2 border-dashed border-slate-400 rounded-lg p-4 flex flex-col justify-between bg-white/70 relative">
            <div className="absolute top-2 left-2 right-2 bottom-2 border border-dotted border-emerald-500/60 rounded pointer-events-none flex items-start justify-end p-1">
              <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 rounded">SAFE MARGIN AREA (0.35 in)</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-300 pb-2">
              <span className="bg-slate-800 text-white font-mono text-xs font-bold px-2 py-1 rounded">
                RIGHT SIDE — PAGE 1 / OUTER FRONT
              </span>
              <span className="font-mono text-xs font-bold text-slate-500">5.5" × 8.5" HALF</span>
            </div>

            <div className="space-y-3 my-auto text-center px-2">
              <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 text-emerald-900 px-3 py-1.5 rounded-full text-xs font-bold font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                OUTER FRONT COVER PANEL
              </div>
              <div className="bg-amber-50 border border-amber-300 rounded p-3 text-left text-xs space-y-1.5">
                <div className="font-bold text-amber-900 font-mono text-[11px] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  DUPLEX ORIENTATION INSTRUCTIONS:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[11px] leading-snug">
                  <li>Print this test sheet double-sided on 8.5" × 11" Letter paper in <strong>Landscape</strong> orientation.</li>
                  <li>Fold sheet down the center red fold line.</li>
                  <li>Inspect inside (Back) panel orientation relative to Front panel.</li>
                </ol>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>TRIM BOUNDARY: 5.5" × 8.5"</span>
              <span>ORIENTATION: UP-RIGHT</span>
            </div>
          </div>
        </div>

        {/* Bottom Orientation Bar */}
        <div className="flex items-center justify-between border-t-2 border-slate-800 pt-2 bg-amber-100/60 -mx-6 -mb-6 px-6 pb-4">
          <div className="flex items-center gap-2 font-mono font-bold text-xs text-amber-900 uppercase">
            <ArrowDown className="w-4 h-4 text-amber-700" />
            <span>BOTTOM EDGE ▼</span>
          </div>
          <div className="font-mono text-xs font-bold text-slate-700">
            DUPLEX SETTING REQUIRED: <span className="bg-slate-900 text-amber-300 px-2 py-0.5 rounded">FLIP ON SHORT EDGE</span>
          </div>
          <div className="flex items-center gap-2 font-mono font-bold text-xs text-amber-900 uppercase">
            <span>BOTTOM EDGE ▼</span>
            <ArrowDown className="w-4 h-4 text-amber-700" />
          </div>
        </div>
      </div>

      {/* Back (Inner) Test Sheet */}
      <div className="test-sheet-wrapper relative w-[11in] h-[8.5in] bg-[#fdfcf7] border-2 border-slate-800 shadow-2xl flex flex-col justify-between p-6 overflow-hidden select-none box-border">
        {/* Top Orientation Bar */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 bg-indigo-100/60 -mx-6 -mt-6 px-6 pt-4">
          <div className="flex items-center gap-2 font-mono font-bold text-xs text-indigo-900 uppercase">
            <ArrowUp className="w-4 h-4 text-indigo-700" />
            <span>TOP EDGE ▲</span>
          </div>
          <div className="font-mono font-black text-sm text-slate-900 tracking-wider">
            PRINTER DUPLEX TEST SHEET — SHEET 1 BACK (INNER)
          </div>
          <div className="flex items-center gap-2 font-mono font-bold text-xs text-indigo-900 uppercase">
            <span>TOP EDGE ▲</span>
            <ArrowUp className="w-4 h-4 text-indigo-700" />
          </div>
        </div>

        {/* Center Vertical Fold Line Indicator */}
        <div className="absolute left-1/2 top-12 bottom-12 -translate-x-1/2 w-0 border-l-2 border-dashed border-indigo-500 z-30 flex flex-col items-center justify-between pointer-events-none">
          <span className="bg-indigo-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow -mt-2">
            INNER SPINE CENTER FOLD
          </span>
          <Scissors className="w-5 h-5 text-indigo-600 my-auto bg-[#fdfcf7] p-0.5 rounded-full border border-indigo-400" />
          <span className="bg-indigo-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow -mb-2">
            CENTER FOLD
          </span>
        </div>

        {/* Main Content Area Split Left & Right */}
        <div className="grid grid-cols-2 gap-8 flex-1 my-4 relative z-10">
          {/* Left Side (Inner Left Page 2) */}
          <div className="border-2 border-dashed border-slate-400 rounded-lg p-4 flex flex-col justify-between bg-white/70 relative">
            <div className="absolute top-2 left-2 right-2 bottom-2 border border-dotted border-indigo-500/60 rounded pointer-events-none flex items-start justify-end p-1">
              <span className="text-[9px] font-mono text-indigo-700 bg-indigo-50 px-1 rounded">SAFE MARGIN AREA (0.35 in)</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-300 pb-2">
              <span className="bg-slate-800 text-white font-mono text-xs font-bold px-2 py-1 rounded">
                LEFT SIDE — PAGE 2 / INSIDE LEFT
              </span>
              <span className="font-mono text-xs font-bold text-slate-500">5.5" × 8.5" HALF</span>
            </div>

            <div className="space-y-3 my-auto text-center px-2">
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-900 border border-indigo-300 px-3 py-1.5 rounded-full text-xs font-bold font-mono">
                <ShieldCheck className="w-4 h-4 text-indigo-700" />
                VERIFICATION CHECK
              </div>
              <div className="bg-slate-50 border border-slate-300 rounded p-3 text-left text-xs space-y-1">
                <div className="font-bold text-slate-900 font-mono text-[11px]">
                  ✓ DUPLEX SETTING CHECK:
                </div>
                <p className="text-slate-700 text-[11px] leading-snug">
                  If this panel is right-side up with "TOP EDGE ▲" at the top when sheet is folded, your printer duplex setting is <strong>CORRECT</strong> ("Flip on Short Edge").
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>TRIM BOUNDARY: 5.5" × 8.5"</span>
              <span>INSIDE COVER LEFT</span>
            </div>
          </div>

          {/* Right Side (Inner Right Page 3) */}
          <div className="border-2 border-dashed border-slate-400 rounded-lg p-4 flex flex-col justify-between bg-white/70 relative">
            <div className="absolute top-2 left-2 right-2 bottom-2 border border-dotted border-indigo-500/60 rounded pointer-events-none flex items-start justify-end p-1">
              <span className="text-[9px] font-mono text-indigo-700 bg-indigo-50 px-1 rounded">SAFE MARGIN AREA (0.35 in)</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-300 pb-2">
              <span className="bg-slate-800 text-white font-mono text-xs font-bold px-2 py-1 rounded">
                RIGHT SIDE — PAGE 3 / INSIDE RIGHT
              </span>
              <span className="font-mono text-xs font-bold text-slate-500">5.5" × 8.5" HALF</span>
            </div>

            <div className="space-y-3 my-auto text-center px-2">
              <div className="inline-flex items-center gap-2 bg-red-50 text-red-900 border border-red-200 px-3 py-1.5 rounded-full text-xs font-bold font-mono">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                IF UPSIDE DOWN:
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-3 text-left text-xs space-y-1">
                <div className="font-bold text-red-900 font-mono text-[11px]">
                  ✗ INCORRECT DUPLEX FIX:
                </div>
                <p className="text-red-800 text-[11px] leading-snug">
                  If this side is upside down, your printer is currently set to "Flip on Long Edge". Open printer dialog and switch to <strong>"Flip on Short Edge"</strong>.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>TRIM BOUNDARY: 5.5" × 8.5"</span>
              <span>PAGE 3 RIGHT PANEL</span>
            </div>
          </div>
        </div>

        {/* Bottom Orientation Bar */}
        <div className="flex items-center justify-between border-t-2 border-slate-800 pt-2 bg-indigo-100/60 -mx-6 -mb-6 px-6 pb-4">
          <div className="flex items-center gap-2 font-mono font-bold text-xs text-indigo-900 uppercase">
            <ArrowDown className="w-4 h-4 text-indigo-700" />
            <span>BOTTOM EDGE ▼</span>
          </div>
          <div className="font-mono text-xs font-bold text-slate-700">
            PAPER: <span className="bg-slate-800 text-white px-2 py-0.5 rounded">LETTER 8.5" × 11"</span> | ORIENTATION: <span className="bg-slate-800 text-white px-2 py-0.5 rounded">LANDSCAPE</span>
          </div>
          <div className="flex items-center gap-2 font-mono font-bold text-xs text-indigo-900 uppercase">
            <span>BOTTOM EDGE ▼</span>
            <ArrowDown className="w-4 h-4 text-indigo-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
