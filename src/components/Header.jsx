import React from 'react';
import { BookOpen, Download, Upload, Printer } from 'lucide-react';
import { useBooklet } from '../context/BookletContext.jsx';

export default function Header() {
  const {
    activePresetKey,
    booklet,
    loadPreset,
    updateGlobalField,
    importJSON,
    exportJSONData
  } = useBooklet();

  const handleExport = () => {
    const jsonString = exportJSONData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${(booklet.title || 'booklet').toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result;
          importJSON(content);
        } catch (err) {
          console.error("Failed to import JSON", err);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <header className="bg-[#111116] border-b border-[#333] px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-[#005f73]" />
        <div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={booklet.title || ''}
              onChange={(e) => updateGlobalField('title', e.target.value)}
              placeholder="Booklet Title / Project Name"
              className="bg-transparent font-title text-xl font-bold text-[#f0e6d2] border-b border-transparent hover:border-[#555] focus:border-[#005f73] focus:outline-none px-1 transition-colors"
            />
          </div>
          <p className="text-xs text-[#a0a0a0]">Dynamic 5.5 × 8.5 in Folded Booklet & Imposition Generator</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <select
          value={activePresetKey}
          onChange={(e) => loadPreset(e.target.value)}
          className="bg-[#282830] text-white border border-[#555] px-3 py-2 rounded text-xs focus:outline-none focus:border-[#005f73]"
        >
          <option value="blank">Blank Booklet (New)</option>
          <option value="oa75">75th OA Lodge Banquet Program</option>
          <option value="generic">Generic Conference / Event Booklet</option>
        </select>

        <button
          onClick={handleExport}
          className="bg-[#005f73] hover:bg-[#00424f] text-white text-xs font-semibold px-3.5 py-2 rounded flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-4 h-4" /> Export JSON
        </button>

        <label className="bg-[#005f73] hover:bg-[#00424f] text-white text-xs font-semibold px-3.5 py-2 rounded flex items-center gap-1.5 transition-colors cursor-pointer">
          <Upload className="w-4 h-4" /> Import JSON
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>

        <button
          onClick={() => window.print()}
          className="bg-[#3a3a42] hover:bg-[#4a4a54] text-[#e0e0e0] text-xs font-semibold px-3.5 py-2 rounded flex items-center gap-1.5 transition-colors"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>
    </header>
  );
}
