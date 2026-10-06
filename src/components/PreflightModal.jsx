import React, { useState } from 'react';
import { X, Printer, AlertTriangle, CheckCircle2, FileText, Info, HelpCircle, ArrowRight, ShieldAlert, Sliders } from 'lucide-react';
import { useBooklet } from '../context/BookletContext.jsx';
import { runPreflight } from '../utils/preflight.js';

export default function PreflightModal({ isOpen, onClose, onPrintBooklet, onPrintTestSheet, onNavigateToPage }) {
  const { booklet, setSelectedElement } = useBooklet();
  const [filterSeverity, setFilterSeverity] = useState('ALL'); // 'ALL' | 'ERROR' | 'WARNING' | 'INFO'
  const [filterCategory, setFilterCategory] = useState('ALL');

  if (!isOpen) return null;

  const preflight = runPreflight(booklet, { document });
  const { status, isReady, counts, specs, issues, errors, warnings, info } = preflight;

  const categories = ['ALL', 'Page Structure', 'Content', 'Layout', 'Typography', 'Imposition'];

  const filteredIssues = issues.filter((item) => {
    if (filterSeverity !== 'ALL' && item.severity !== filterSeverity) return false;
    if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
    return true;
  });

  const handleIssueClick = (issue) => {
    if (issue.pageIndex !== null && issue.pageIndex !== undefined) {
      setSelectedElement({
        pageIndex: issue.pageIndex,
        blockIndex: issue.blockIndex !== undefined ? issue.blockIndex : null,
        elementType: issue.blockIndex !== undefined && issue.blockIndex !== null ? 'block' : 'pageTitle'
      });
      if (onNavigateToPage) {
        onNavigateToPage(issue.pageIndex);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1c1c24] text-gray-100 border border-[#3f3f4e] rounded-xl shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden my-6 max-h-[92vh]">

        {/* Modal Header */}
        <div className="bg-[#111116] border-b border-[#333] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isReady ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-400' : 'bg-red-950/80 border border-red-700 text-red-400'}`}>
              {isReady ? <CheckCircle2 className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">Preflight Inspection Report</h2>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                  isReady
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-red-950 text-red-300 border-red-600'
                }`}>
                  {status}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
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
        <div className="p-6 space-y-6 overflow-y-auto flex-1">

          {/* Status & Technical Specification Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Overall Status Box */}
            <div className={`p-4 rounded-lg border ${
              isReady ? 'bg-emerald-950/40 border-emerald-800/60' : 'bg-red-950/40 border-red-800/60'
            }`}>
              <div className="flex items-center justify-between border-b border-gray-700/50 pb-2 mb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300">
                  FINAL STATUS
                </span>
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                  isReady ? 'bg-emerald-900 text-emerald-200' : 'bg-red-900 text-red-200'
                }`}>
                  {status}
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Errors:</span>
                  <span className={`font-bold ${counts.errors > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {counts.errors} error{counts.errors !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Warnings:</span>
                  <span className={`font-bold ${counts.warnings > 0 ? 'text-amber-400' : 'text-gray-300'}`}>
                    {counts.warnings} warning{counts.warnings !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Raw Page Count:</span>
                  <span className="text-cyan-300 font-bold">{specs.rawPageCount} pages</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Imposed Layout:</span>
                  <span className="text-white font-bold">{specs.paddedPageCount} pages ({specs.paddingAdded} padded blank)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sheet Count:</span>
                  <span className="text-amber-300 font-bold">{specs.totalSheets} sheet{specs.totalSheets !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Layout Specs Box */}
            <div className="bg-[#121217] p-4 rounded-lg border border-[#2e2e38] flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#2e2e38] pb-2 mb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" /> Print & Paper Specs
                </span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                  DUPLEX
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Finished Page Size:</span>
                  <span className="text-white font-semibold">{specs.pageSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Paper Sheet Size:</span>
                  <span className="text-white font-semibold">{specs.paperSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Binding Method:</span>
                  <span className="text-amber-300 font-semibold">{specs.bindingMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duplex Orientation:</span>
                  <span className="text-cyan-300 font-semibold">Short-Edge Flip</span>
                </div>
              </div>
            </div>

          </div>

          {/* Filter Bar & Findings List */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#333] pb-2">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider font-mono">
                  Inspection Findings ({filteredIssues.length} of {issues.length})
                </h3>
              </div>

              {/* Filter Badges */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setFilterSeverity('ALL')}
                  className={`px-2.5 py-1 rounded font-mono text-[11px] font-semibold transition-colors ${
                    filterSeverity === 'ALL'
                      ? 'bg-[#005f73] text-white'
                      : 'bg-[#252530] text-gray-400 hover:text-white'
                  }`}
                >
                  ALL ({issues.length})
                </button>
                <button
                  onClick={() => setFilterSeverity('ERROR')}
                  className={`px-2.5 py-1 rounded font-mono text-[11px] font-semibold transition-colors ${
                    filterSeverity === 'ERROR'
                      ? 'bg-red-700 text-white'
                      : 'bg-red-950/60 text-red-300 hover:bg-red-900/60'
                  }`}
                >
                  ERROR ({counts.errors})
                </button>
                <button
                  onClick={() => setFilterSeverity('WARNING')}
                  className={`px-2.5 py-1 rounded font-mono text-[11px] font-semibold transition-colors ${
                    filterSeverity === 'WARNING'
                      ? 'bg-amber-700 text-white'
                      : 'bg-amber-950/60 text-amber-300 hover:bg-amber-900/60'
                  }`}
                >
                  WARNING ({counts.warnings})
                </button>
                <button
                  onClick={() => setFilterSeverity('INFO')}
                  className={`px-2.5 py-1 rounded font-mono text-[11px] font-semibold transition-colors ${
                    filterSeverity === 'INFO'
                      ? 'bg-cyan-700 text-white'
                      : 'bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60'
                  }`}
                >
                  INFO ({counts.info})
                </button>
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
              <span>Filter by Inspection Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-[#252530] text-gray-200 border border-[#444] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-400"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Issues List Container */}
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {filteredIssues.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 italic bg-[#15151c] rounded-lg border border-[#2a2a36]">
                  No issues found matching the selected filters.
                </div>
              ) : (
                filteredIssues.map((issue) => {
                  let badgeStyle = 'bg-cyan-950 text-cyan-300 border-cyan-700';
                  let icon = <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />;
                  let bgContainer = 'bg-[#1e1e28] border-[#363646] hover:border-cyan-500/60';

                  if (issue.severity === 'ERROR') {
                    badgeStyle = 'bg-red-950 text-red-300 border-red-700';
                    icon = <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />;
                    bgContainer = 'bg-red-950/30 border-red-800/60 hover:border-red-500';
                  } else if (issue.severity === 'WARNING') {
                    badgeStyle = 'bg-amber-950 text-amber-300 border-amber-700';
                    icon = <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />;
                    bgContainer = 'bg-amber-950/30 border-amber-800/60 hover:border-amber-500';
                  }

                  const hasNavigation = issue.pageIndex !== null && issue.pageIndex !== undefined;

                  return (
                    <div
                      key={issue.id}
                      onClick={() => hasNavigation && handleIssueClick(issue)}
                      className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 transition-all ${bgContainer} ${
                        hasNavigation ? 'cursor-pointer group' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {icon}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${badgeStyle}`}>
                              {issue.severity}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 bg-[#121218] px-2 py-0.5 rounded border border-[#2c2c38]">
                              {issue.category}
                            </span>
                            {issue.pageNum && (
                              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                                Page {issue.pageNum}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-200 leading-relaxed font-sans">
                            {issue.message}
                          </p>
                        </div>
                      </div>

                      {hasNavigation && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 group-hover:text-cyan-300 whitespace-nowrap shrink-0 mt-0.5">
                          Inspect Page <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Required Printer Setup Callout */}
          <div className="bg-gradient-to-br from-[#122230] to-[#182838] border border-[#005f73] rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-[#005f73]/50 pb-2">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" /> Mandatory System Printer Setup
              </h4>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/50">
                RECOMMENDED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-[#0b1620]/80 p-2 rounded border border-[#1e3c50]">
                <div className="text-gray-400 text-[10px] font-mono uppercase">Paper Size</div>
                <div className="text-xs font-bold text-white mt-0.5">Letter (8.5 × 11 in)</div>
              </div>
              <div className="bg-[#0b1620]/80 p-2 rounded border border-[#1e3c50]">
                <div className="text-gray-400 text-[10px] font-mono uppercase">Orientation</div>
                <div className="text-xs font-bold text-white mt-0.5">Landscape</div>
              </div>
              <div className="bg-[#0b1620]/80 p-2 rounded border border-[#1e3c50]">
                <div className="text-gray-400 text-[10px] font-mono uppercase">Duplex Setting</div>
                <div className="text-xs font-bold text-amber-300 mt-0.5">Flip on Short Edge</div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-[#111116] border-t border-[#333] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
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
              Close
            </button>
            <button
              onClick={onPrintBooklet}
              disabled={!isReady}
              className={`flex-1 md:flex-initial text-xs font-bold px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                !isReady
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
