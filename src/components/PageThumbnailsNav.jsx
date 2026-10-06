import React, { useState } from 'react';
import { useBooklet } from '../context/BookletContext.jsx';
import { ArrowUp, ArrowDown, Copy, Trash2, LayoutGrid, ChevronRight, ChevronLeft } from 'lucide-react';

export default function PageThumbnailsNav({ onSelectPage }) {
  const { pages, movePage, duplicatePage, deletePage, selectedElement, setSelectedElement } = useBooklet();
  const [isExpanded, setIsExpanded] = useState(true);

  const handlePageClick = (pageIndex) => {
    setSelectedElement({ pageIndex, elementType: 'page' });
    if (onSelectPage) {
      onSelectPage(pageIndex);
    } else {
      const el = document.getElementById(`spread-page-${pageIndex}`) || document.getElementById(`editor-page-${pageIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  if (!isExpanded) {
    return (
      <div className="w-full max-w-4xl bg-[#282830] border border-[#3a3a44] rounded-lg px-3 py-1.5 flex items-center justify-between text-xs text-gray-300 mb-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-white">Page Strip ({pages.length} Pages)</span>
        </div>
        <button
          onClick={() => setIsExpanded(true)}
          className="text-xs bg-[#005f73] hover:bg-[#00424f] text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" /> Show Thumbnails
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-[#282830] border border-[#3a3a44] rounded-lg p-3 mb-4 shadow-md space-y-2">
      <div className="flex items-center justify-between border-b border-[#3a3a44] pb-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#f0e6d2]">
          <LayoutGrid className="w-4 h-4 text-cyan-400" />
          <span>Page Navigator & Quick Actions ({pages.length} Pages)</span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-[11px] text-gray-400 hover:text-white flex items-center gap-0.5 bg-[#3a3a44] px-2 py-0.5 rounded transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Collapse
        </button>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-600">
        {pages.map((page, pageIndex) => {
          const isSelected = selectedElement?.pageIndex === pageIndex;
          const pageType = page.type || 'custom';

          return (
            <div
              key={page.id || `thumb-${pageIndex}`}
              onClick={() => handlePageClick(pageIndex)}
              className={`shrink-0 w-28 bg-[#1e1e24] border rounded p-1.5 cursor-pointer transition-all flex flex-col justify-between group ${
                isSelected
                  ? 'border-[#70c0d0] ring-2 ring-[#005f73] bg-[#1a3344] shadow-lg'
                  : 'border-[#444] hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                <span className="text-[#70c0d0] font-mono">P.{pageIndex + 1}</span>
                <span className="text-[9px] uppercase px-1 rounded bg-[#2a2a34] text-gray-300 truncate max-w-[50px]">
                  {pageType}
                </span>
              </div>

              {/* Thumbnail Mini Box */}
              <div className="w-full h-16 bg-[#f4eedb] rounded border border-gray-400 p-1 flex flex-col items-center justify-center text-center overflow-hidden relative shadow-inner my-0.5">
                <div className="text-[9px] font-bold text-[#122230] leading-tight line-clamp-2">
                  {page.title || (pageType === 'cover' ? 'Front Cover' : pageType === 'backCover' ? 'Back Cover' : `Page ${pageIndex + 1}`)}
                </div>
                {page.subtitle && (
                  <div className="text-[7.5px] text-[#005f73] line-clamp-1 italic mt-0.5">
                    {page.subtitle}
                  </div>
                )}
                {Array.isArray(page.blocks) && page.blocks.length > 0 && (
                  <span className="absolute bottom-0.5 right-1 text-[8px] font-mono bg-black/60 text-cyan-300 px-1 rounded">
                    {page.blocks.length}b
                  </span>
                )}
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center justify-between gap-0.5 mt-1 pt-1 border-t border-[#333]" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => movePage(pageIndex, -1)}
                  disabled={pageIndex === 0}
                  className="p-1 bg-[#282830] hover:bg-[#005f73] disabled:opacity-30 text-white rounded"
                  title="Move Page Up/Left"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => movePage(pageIndex, 1)}
                  disabled={pageIndex === pages.length - 1}
                  className="p-1 bg-[#282830] hover:bg-[#005f73] disabled:opacity-30 text-white rounded"
                  title="Move Page Down/Right"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  onClick={() => duplicatePage(pageIndex)}
                  className="p-1 bg-[#282830] hover:bg-cyan-700 text-cyan-300 hover:text-white rounded"
                  title="Duplicate Page"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete Page ${pageIndex + 1}?`)) {
                      deletePage(pageIndex);
                    }
                  }}
                  className="p-1 bg-[#282830] hover:bg-red-700 text-red-300 hover:text-white rounded"
                  title="Delete Page"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
