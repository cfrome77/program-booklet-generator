import React from 'react';
import { X, Printer, AlertTriangle, CheckCircle2, FileText, Info, HelpCircle } from 'lucide-react';
import { useBooklet } from '../context/BookletContext.jsx';
import { calculateImpositionSheets } from '../utils/imposition.js';

export default function PreflightModal({ isOpen, onClose, onPrintBooklet, onPrintTestSheet }) {
  const { pages, booklet } = useBooklet();

  if (!isOpen) return null;

  const imposition = calculateImpositionSheets(pages);
  const rawCount = imposition.rawPageCount;
  const paddedCount = imposition.totalPages;
  const paddingAdded = imposition.paddingAdded;
  const totalSheets = imposition.totalSheets;

  // Preflight checks
  const errors = [];
  const warnings = [];
  const info = [];

  if (rawCount === 0) {
    errors.push('Booklet contains no pages. Add at least one page before printing.');
  }

  if (paddingAdded > 0) {
    info.push(
      `Booklet page count (${rawCount}) is not divisible by 4. Automatically adding ${paddingAdded} blank notes page${
        paddingAdded > 1 ? 's' : ''
      } to complete a ${paddedCount}-page (${totalSheets}-sheet) saddle-stitched layout.`
    );
  } else {
    info.push(
      `Booklet has ${rawCount} pages, perfectly matching a ${totalSheets}-sheet (${paddedCount}-page) saddle-stitched layout.`
    );
  }

  // Content audits
  let unconfiguredImages = 0;
  pages.forEach((p, idx) => {
    if (p.type === 'cover' && !p.emblemImg) {
      warnings.push(`Page ${idx + 1} (Cover) uses default/placeholder emblem.`);
    }
    if (p.type === 'backCover' && !p.qrImg) {
      warnings.push(`Page ${idx + 1} (Back Cover) has no custom QR code uploaded.`);
    }
    (p.blocks || []).forEach((b) => {
      if (b.type === 'image' && !b.url) {
        unconfiguredImages++;
      }
    });
  });

  if (unconfiguredImages > 0) {
    warnings.push(`${unconfiguredImages} image block(s) have no image URL or file selected.`);
  }

  const isPrintBlocked = errors.length > 0;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1c1c24] text-gray-100 border border-[#3f3f4e] rounded-xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden my-8">

        {/* Modal Header */}
        <div className="bg-[#111116] border-b border-[#333] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-[#005f73]" />
            <div>
              <h2 className="text-base font-bold text-white">Print Preflight & Duplex Guidance</h2>
              <p className="text-xs text-gray-400">
                Project: <span className="text-cyan-300 font-semibold">{booklet.title || 'Untitled Booklet'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#282830] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

          {/* Preflight Status Banner */}
          {isPrintBlocked ? (
            <div className="bg-red-950/80 border border-red-700 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-red-200">Preflight Error (Print Blocked)</h3>
                <ul className="list-disc list-inside text-xs text-red-300 mt-1 space-y-1">
                  {errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/60 border border-emerald-700/80 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-emerald-200">Preflight Passed — Ready to Print</h3>
                <p className="text-xs text-emerald-300/90 mt-0.5">
                  Booklet layout validated. Standard 5.5 × 8.5 in saddle-stitched imposition prepared across {totalSheets} sheet{totalSheets > 1 ? 's' : ''}.
                </p>
              </div>
            </div>
          )}

          {/* Messages & Warnings */}
          <div className="space-y-2">
            {info.map((msg, idx) => (
              <div key={idx} className="bg-[#252530] border border-[#3b3b4a] rounded-lg p-3 text-xs text-cyan-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>{msg}</span>
              </div>
            ))}

            {warnings.map((warn, idx) => (
              <div key={idx} className="bg-amber-950/50 border border-amber-700/60 rounded-lg p-3 text-xs text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{warn}</span>
              </div>
            ))}
          </div>

          {/* Imposition Summary Specs */}
          <div className="bg-[#121217] border border-[#2e2e38] rounded-lg p-4 space-y-2">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Imposition Specifications
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
              <div className="bg-[#1c1c24] p-2.5 rounded border border-[#2a2a36]">
                <div className="text-gray-400 text-[10px] uppercase font-mono">Raw Pages</div>
                <div className="text-sm font-bold text-white">{rawCount}</div>
              </div>
              <div className="bg-[#1c1c24] p-2.5 rounded border border-[#2a2a36]">
                <div className="text-gray-400 text-[10px] uppercase font-mono">Imposed Pages</div>
                <div className="text-sm font-bold text-cyan-300">{paddedCount} ({paddingAdded} blank)</div>
              </div>
              <div className="bg-[#1c1c24] p-2.5 rounded border border-[#2a2a36]">
                <div className="text-gray-400 text-[10px] uppercase font-mono">Sheets Needed</div>
                <div className="text-sm font-bold text-amber-300">{totalSheets} Sheet{totalSheets > 1 ? 's' : ''}</div>
              </div>
              <div className="bg-[#1c1c24] p-2.5 rounded border border-[#2a2a36]">
                <div className="text-gray-400 text-[10px] uppercase font-mono">Finished Size</div>
                <div className="text-sm font-bold text-white">5.5" × 8.5" Folded</div>
              </div>
            </div>
          </div>

          {/* Required Printer Settings & Duplex Guidance */}
          <div className="bg-gradient-to-br from-[#122230] to-[#182838] border border-[#005f73] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#005f73]/50 pb-2">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                Required System Printer Settings
              </h4>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/50">
                MANDATORY SETUP
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#0b1620]/80 p-2.5 rounded border border-[#1e3c50]">
                <div className="text-gray-400 text-[10px] font-mono uppercase">Paper Size</div>
                <div className="text-xs font-bold text-white mt-0.5">Letter (8.5 × 11 in)</div>
              </div>
              <div className="bg-[#0b1620]/80 p-2.5 rounded border border-[#1e3c50]">
                <div className="text-gray-400 text-[10px] font-mono uppercase">Orientation</div>
                <div className="text-xs font-bold text-white mt-0.5">Landscape</div>
              </div>
              <div className="bg-[#0b1620]/80 p-2.5 rounded border border-[#1e3c50]">
                <div className="text-gray-400 text-[10px] font-mono uppercase">Duplex Setting</div>
                <div className="text-xs font-bold text-amber-300 mt-0.5">Flip on Short Edge</div>
              </div>
            </div>

            <div className="text-xs text-gray-300 space-y-1.5 pt-1">
              <p className="leading-relaxed">
                <strong className="text-amber-300">Why Short-Edge Flip?</strong> Standard double-sided printing flips along the long edge. However, because saddle-stitched booklets print in <em>Landscape</em> mode and fold vertically down the middle, selecting <span className="underline decoration-amber-400 font-bold">Flip on Short Edge</span> (Short-Edge Binding) ensures the back side of each sheet is printed right-side up.
              </p>
              <p className="text-[11px] text-gray-400 italic">
                * Note: Browser web applications cannot override your physical printer driver properties directly. Please verify that your system print dialog is set to Landscape and Double-Sided (Flip on Short Edge) before printing.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="bg-[#111116] border-t border-[#333] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <button
            onClick={onPrintTestSheet}
            className="w-full md:w-auto bg-[#282834] hover:bg-[#343444] text-amber-300 border border-amber-500/40 text-xs font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            Print 1-Sheet Duplex Test
          </button>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={onClose}
              className="flex-1 md:flex-initial bg-[#282830] hover:bg-[#383842] text-gray-300 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onPrintBooklet}
              disabled={isPrintBlocked}
              className={`flex-1 md:flex-initial text-xs font-bold px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                isPrintBlocked
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-[#005f73] hover:bg-[#00424f] text-white shadow-lg'
              }`}
            >
              <Printer className="w-4 h-4" />
              Proceed to Print Booklet
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
