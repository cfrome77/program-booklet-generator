import React, { useState, useEffect } from 'react';
import { BookletProvider, useBooklet } from './context/BookletContext.jsx';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import SpreadViewer from './components/SpreadViewer.jsx';
import ImpositionViewer from './components/ImpositionViewer.jsx';
import PreflightModal from './components/PreflightModal.jsx';
import PrintMount from './components/PrintMount.jsx';
import { Printer, Loader2 } from 'lucide-react';

function BookletAppContent() {
  const { theme, jsonState } = useBooklet();
  const [viewMode, setViewMode] = useState('spreads'); // 'spreads' | 'imposition'
  const [isPreflightOpen, setIsPreflightOpen] = useState(false);
  const [printMode, setPrintMode] = useState(null); // 'booklet' | 'test-sheet' | null
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  // Dynamic CSS variable application based on theme context state
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-cream', theme.bgCream || '#f4eedb');
    root.style.setProperty('--navy-dark', theme.navyDark || '#122230');
    root.style.setProperty('--teal-accent', theme.tealAccent || '#005f73');
    root.style.setProperty('--charcoal', theme.charcoal || '#2b2b2b');
    root.style.setProperty('--font-title', theme.titleFont || "'Cinzel', serif");
  }, [theme]);

  const handleStartPrint = async (mode) => {
    setIsPreflightOpen(false);
    setPrintMode(mode);
    setIsPreparingPrint(true);

    // Allow DOM to update and render #print-mount
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Wait for fonts
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {
        console.warn('Font loading wait warning:', e);
      }
    }

    // Wait for images inside #print-mount
    const printMount = document.getElementById('print-mount');
    if (printMount) {
      const images = Array.from(printMount.querySelectorAll('img'));
      const imagePromises = images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });

      await Promise.race([
        Promise.all(imagePromises),
        new Promise((resolve) => setTimeout(resolve, 1500))
      ]);
    }

    // Extra tick for CSS layout reflow
    await new Promise((resolve) => setTimeout(resolve, 200));

    setIsPreparingPrint(false);

    // Invoke browser print
    window.print();

    // Clean up print mode state after print dialog closes
    setTimeout(() => {
      setPrintMode(null);
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#1e1e24] text-white">
      <Header onOpenPreflight={() => setIsPreflightOpen(true)} />

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
          <div className="controls-bar mb-5 flex flex-wrap items-center justify-between gap-3 bg-[#282830] px-4 py-2 rounded-lg shadow-md w-full max-w-4xl">
            <div className="flex items-center gap-2">
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

            <button
              onClick={() => setIsPreflightOpen(true)}
              className="text-xs font-bold px-3.5 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 transition-colors shadow"
            >
              <Printer className="w-4 h-4" /> Print Setup & Preflight
            </button>
          </div>

          {/* Active Viewer */}
          {viewMode === 'spreads' ? <SpreadViewer /> : <ImpositionViewer />}
        </section>
      </main>

      {/* Preflight Modal */}
      <PreflightModal
        isOpen={isPreflightOpen}
        onClose={() => setIsPreflightOpen(false)}
        onPrintBooklet={() => handleStartPrint('booklet')}
        onPrintTestSheet={() => handleStartPrint('test-sheet')}
      />

      {/* Print Mount Container for window.print() */}
      <PrintMount printMode={printMode} />

      {/* Print Preparation Overlay */}
      {isPreparingPrint && (
        <div className="fixed inset-0 z-[10000] bg-black/90 flex flex-col items-center justify-center p-6 text-center select-none">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Preparing Print Layout & Assets...</h3>
          <p className="text-xs text-cyan-300 max-w-sm">
            Validating fonts, layout dimensions, and images before invoking browser print dialog.
          </p>
        </div>
      )}
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
