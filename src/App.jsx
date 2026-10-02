import React from 'react';
import { BookOpen, Printer, Download, Upload, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { BookletProvider, useBooklet } from './context/BookletContext.jsx';
import { PRESETS } from './presets/index.js';

function BookletAppContent() {
  const {
    activePresetKey,
    booklet,
    theme,
    pages,
    jsonState,
    loadPreset,
    updateGlobalField,
    updateThemeField,
    addPage,
    updatePageField,
    changePageType,
    movePage,
    deletePage,
    addContentBlock,
    updateContentBlock,
    moveContentBlock,
    deleteContentBlock,
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
    <div className="min-h-screen flex flex-col bg-[#1e1e24] text-white">
      {/* Header */}
      <header className="bg-[#111116] border-b border-[#333] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-[#005f73]" />
          <div>
            <h1 className="font-title text-xl font-bold text-[#f0e6d2]">Booklet Generation Engine</h1>
            <p className="text-xs text-[#a0a0a0]">Dynamic 5.5 × 8.5 in Folded Booklet & Imposition Generator</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <select
            value={activePresetKey}
            onChange={(e) => loadPreset(e.target.value)}
            className="bg-[#282830] text-white border border-[#555] px-3 py-1.5 rounded text-xs"
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

      {jsonState.importError && (
        <div className="bg-red-900/80 border-b border-red-700 px-6 py-2 text-xs text-red-200">
          <strong>Import Error:</strong> {jsonState.importError}
        </div>
      )}

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-[410px] bg-[#282830] border-r border-[#3a3a44] p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="border-b border-[#3a3a44] pb-4">
            <h2 className="font-title text-base text-[#f0e6d2] mb-3">Global Styling</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Booklet Title / Project Name</label>
                <input
                  type="text"
                  value={booklet.title || ''}
                  onChange={(e) => updateGlobalField('title', e.target.value)}
                  className="w-full bg-[#1e1e24] border border-[#444] text-white text-xs px-2.5 py-1.5 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Color Theme (Page BG / Primary / Accent)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={theme.bgCream || '#f4eedb'}
                    onChange={(e) => updateThemeField('bgCream', e.target.value)}
                    className="w-8 h-8 rounded border-0 cursor-pointer bg-none"
                    title="Page BG"
                  />
                  <input
                    type="color"
                    value={theme.navyDark || '#122230'}
                    onChange={(e) => updateThemeField('navyDark', e.target.value)}
                    className="w-8 h-8 rounded border-0 cursor-pointer bg-none"
                    title="Primary"
                  />
                  <input
                    type="color"
                    value={theme.tealAccent || '#005f73'}
                    onChange={(e) => updateThemeField('tealAccent', e.target.value)}
                    className="w-8 h-8 rounded border-0 cursor-pointer bg-none"
                    title="Accent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Title Font Style</label>
                <select
                  value={theme.titleFont || "'Cinzel', serif"}
                  onChange={(e) => updateThemeField('titleFont', e.target.value)}
                  className="w-full bg-[#1e1e24] border border-[#444] text-white text-xs px-2.5 py-1.5 rounded"
                >
                  <option value="'Cinzel', serif">Cinzel (Classic / Serpentine)</option>
                  <option value="'Merriweather', serif">Merriweather (Traditional Serif)</option>
                  <option value="'Open Sans', sans-serif">Open Sans (Modern Clean)</option>
                  <option value="'Roboto', sans-serif">Roboto (Bold Contemporary)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-title text-base text-[#f0e6d2]">Pages Management ({pages.length})</h2>
              <button
                onClick={() => addPage()}
                className="bg-[#005f73] hover:bg-[#00424f] text-white text-xs px-2.5 py-1 rounded flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Page
              </button>
            </div>

            <div className="space-y-3">
              {pages.map((page, pageIndex) => (
                <div key={page.id || `p-${pageIndex}`} className="bg-[#1e1e24] border border-[#444] rounded p-3 text-xs">
                  <div className="flex justify-between items-center mb-2 font-bold text-[#70c0d0]">
                    <span>Page {pageIndex + 1}: {(page.type || 'custom').toUpperCase()}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => movePage(pageIndex, -1)}
                        disabled={pageIndex === 0}
                        className="p-1 bg-[#333] hover:bg-[#555] rounded disabled:opacity-30"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => movePage(pageIndex, 1)}
                        disabled={pageIndex === pages.length - 1}
                        className="p-1 bg-[#333] hover:bg-[#555] rounded disabled:opacity-30"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deletePage(pageIndex)}
                        className="p-1 bg-[#333] hover:bg-red-700 rounded text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-0.5">Page Type</label>
                      <select
                        value={page.type || 'custom'}
                        onChange={(e) => changePageType(pageIndex, e.target.value)}
                        className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded"
                      >
                        <option value="cover">Front Cover</option>
                        <option value="schedule">Schedule / Agenda</option>
                        <option value="leadership">Leadership Remarks</option>
                        <option value="keynote">Keynote Speaker</option>
                        <option value="awards">Awards & Honors</option>
                        <option value="vigilIntro">Class Honoree / Vigil</option>
                        <option value="roster">Roster Grid</option>
                        <option value="custom">Custom Content</option>
                        <option value="backCover">Back Cover</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-400 mb-0.5">Title</label>
                      <input
                        type="text"
                        value={page.title || ''}
                        onChange={(e) => updatePageField(pageIndex, 'title', e.target.value)}
                        className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded"
                      />
                    </div>

                    {/* Content Blocks summary in State Editor */}
                    <div className="border-t border-[#333] pt-2 mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-bold text-[#f0c070]">Content Blocks ({page.blocks?.length || 0})</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => addContentBlock(pageIndex, 'heading')}
                            className="bg-[#005f73] px-1.5 py-0.5 rounded text-[10px]"
                          >
                            + Head
                          </button>
                          <button
                            onClick={() => addContentBlock(pageIndex, 'paragraph')}
                            className="bg-[#005f73] px-1.5 py-0.5 rounded text-[10px]"
                          >
                            + Para
                          </button>
                        </div>
                      </div>

                      {(page.blocks || []).map((block, blockIndex) => (
                        <div key={block.id || `b-${blockIndex}`} className="bg-[#2a2a34] p-1.5 rounded my-1 text-[11px] border border-dashed border-[#555]">
                          <div className="flex justify-between items-center text-[10px] text-[#f0c070] mb-1">
                            <span>{block.type?.toUpperCase()}</span>
                            <div className="flex gap-1">
                              <button onClick={() => moveContentBlock(pageIndex, blockIndex, -1)} className="hover:text-white">↑</button>
                              <button onClick={() => moveContentBlock(pageIndex, blockIndex, 1)} className="hover:text-white">↓</button>
                              <button onClick={() => deleteContentBlock(pageIndex, blockIndex)} className="text-red-400 hover:text-red-200">×</button>
                            </div>
                          </div>
                          {(block.type === 'heading' || block.type === 'paragraph') && (
                            <input
                              type="text"
                              value={block.text || ''}
                              onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'text', e.target.value)}
                              className="w-full bg-[#1e1e24] text-white p-1 rounded border border-[#444] text-[10px]"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Preview Workspace */}
        <section className="flex-1 bg-[#18181c] p-6 flex flex-col items-center justify-start overflow-y-auto">
          <div className="bg-[#282830] p-4 rounded-lg border border-[#3a3a44] max-w-xl w-full text-center">
            <h3 className="font-title text-lg text-[#f0e6d2] mb-2">Central State Model Active</h3>
            <p className="text-xs text-gray-300 mb-3">
              Booklet Title: <span className="text-[#70c0d0] font-semibold">{booklet.title}</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-left text-xs bg-[#1e1e24] p-3 rounded border border-[#444]">
              <div><strong className="text-gray-400">Total Pages:</strong> {pages.length}</div>
              <div><strong className="text-gray-400">Preset:</strong> {activePresetKey}</div>
              <div><strong className="text-gray-400">Theme Primary:</strong> {theme.navyDark}</div>
              <div><strong className="text-gray-400">Theme Accent:</strong> {theme.tealAccent}</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BookletProvider>
      <BookletAppContent />
    </BookletProvider>
  );
}
