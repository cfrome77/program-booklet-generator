import React, { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBooklet } from '../context/BookletContext.jsx';
import ThemeEditor from './ThemeEditor.jsx';
import PageCardEditor from './PageCardEditor.jsx';
import AssetLibrary from './AssetLibrary.jsx';

export default function Sidebar() {
  const { pages, addPage } = useBooklet();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-[#282830] border-r border-[#3a3a44] p-2 flex flex-col items-center transition-all">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 bg-[#3a3a42] hover:bg-[#4a4a54] text-white rounded transition-colors"
          title="Expand Sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-[410px] bg-[#282830] border-r border-[#3a3a44] p-4 flex flex-col gap-4 overflow-y-auto shrink-0 transition-all">
      <div className="flex items-center justify-between border-b border-[#3a3a44] pb-3">
        <h2 className="font-title text-base text-[#f0e6d2] font-bold">Editor Panel</h2>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 bg-[#3a3a42] hover:bg-[#4a4a54] text-white rounded transition-colors"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="border-b border-[#3a3a44] pb-4">
        <h3 className="font-title text-sm text-[#f0e6d2] mb-3">Global Styling</h3>
        <ThemeEditor />
      </div>

      <div className="border-b border-[#3a3a44] pb-4">
        <AssetLibrary />
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-title text-sm text-[#f0e6d2]">
            Pages Management ({pages.length})
          </h3>
          <button
            onClick={() => addPage()}
            className="bg-[#005f73] hover:bg-[#00424f] text-white text-xs px-2.5 py-1 rounded flex items-center gap-1 transition-colors font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Add Page
          </button>
        </div>

        <div className="space-y-3">
          {pages.map((page, pageIndex) => (
            <PageCardEditor
              key={page.id || `p-${pageIndex}`}
              page={page}
              pageIndex={pageIndex}
              isFirst={pageIndex === 0}
              isLast={pageIndex === pages.length - 1}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
