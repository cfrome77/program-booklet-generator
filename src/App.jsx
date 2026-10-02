import React from 'react';
import { BookletProvider, useBooklet } from './context/BookletContext.jsx';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';

function BookletAppContent() {
  const {
    activePresetKey,
    booklet,
    theme,
    pages,
    jsonState
  } = useBooklet();

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

        {/* Preview Workspace Placeholder */}
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
