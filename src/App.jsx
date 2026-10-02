import React, { useState, useEffect } from 'react';
import { BookletProvider, useBooklet } from './context/BookletContext.jsx';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import SpreadViewer from './components/SpreadViewer.jsx';
import ImpositionViewer from './components/ImpositionViewer.jsx';

function BookletAppContent() {
  const { theme, jsonState } = useBooklet();
  const [viewMode, setViewMode] = useState('spreads'); // 'spreads' | 'imposition'

  // Dynamic CSS variable application based on theme context state
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-cream', theme.bgCream || '#f4eedb');
    root.style.setProperty('--navy-dark', theme.navyDark || '#122230');
    root.style.setProperty('--teal-accent', theme.tealAccent || '#005f73');
    root.style.setProperty('--charcoal', theme.charcoal || '#2b2b2b');
    root.style.setProperty('--font-title', theme.titleFont || "'Cinzel', serif");
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col bg-[#1e1e24] text-white">
      <Header />

      {jsonState.importError && (
        <div className="bg-red-900/80 border-b border-red-700 px-6 py-2 text-xs text-red-200">
          <strong>Import Error:</strong> {jsonState.importError}
        </div>
      )}

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        <Sidebar />

        {/* Preview Workspace */}
        <section className="preview-workspace flex-1 bg-[#18181c] p-5 overflow-y-auto flex flex-col items-center">
          {/* Controls Bar */}
          <div className="controls-bar mb-5 flex gap-3 bg-[#282830] px-4 py-2 rounded-lg shadow-md">
            <button
              onClick={() => setViewMode('spreads')}
              className={`text-xs font-semibold px-4 py-2 rounded transition-colors ${
                viewMode === 'spreads'
                  ? 'bg-[#122230] text-white border border-[#d9d9d9]'
                  : 'bg-[#005f73] hover:bg-[#00424f] text-white'
              }`}
            >
              Booklet Reader (Page Spreads)
            </button>
            <button
              onClick={() => setViewMode('imposition')}
              className={`text-xs font-semibold px-4 py-2 rounded transition-colors ${
                viewMode === 'imposition'
                  ? 'bg-[#122230] text-white border border-[#d9d9d9]'
                  : 'bg-[#005f73] hover:bg-[#00424f] text-white'
              }`}
            >
              Print Imposition (11 × 8.5 in Folded Sheets)
            </button>
          </div>

          {/* Active Viewer */}
          {viewMode === 'spreads' ? <SpreadViewer /> : <ImpositionViewer />}
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
