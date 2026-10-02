import React from 'react';
import { BookOpen, Printer, Download, Upload } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#1e1e24] text-white">
      <header className="bg-[#111116] border-b border-[#333] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-[#005f73]" />
          <div>
            <h1 className="font-title text-xl font-bold text-[#f0e6d2]">Booklet Generation Engine</h1>
            <p className="text-xs text-[#a0a0a0]">Dynamic 5.5 × 8.5 in Folded Booklet & Imposition Generator</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="bg-[#005f73] hover:bg-[#00424f] text-white text-xs font-semibold px-3.5 py-2 rounded flex items-center gap-1.5 transition-colors">
            <Download className="w-4 h-4" /> Export JSON
          </button>
          <button className="bg-[#005f73] hover:bg-[#00424f] text-white text-xs font-semibold px-3.5 py-2 rounded flex items-center gap-1.5 transition-colors">
            <Upload className="w-4 h-4" /> Import JSON
          </button>
          <button className="bg-[#3a3a42] hover:bg-[#4a4a54] text-[#e0e0e0] text-xs font-semibold px-3.5 py-2 rounded flex items-center gap-1.5 transition-colors">
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-[410px] bg-[#282830] border-r border-[#3a3a44] p-4 flex flex-col gap-4">
          <h2 className="font-title text-base text-[#f0e6d2]">Control Panel</h2>
          <p className="text-xs text-gray-400">React & Vite foundation active.</p>
        </aside>

        <section className="flex-1 bg-[#18181c] p-6 flex flex-col items-center justify-center">
          <p className="text-gray-400 text-sm">Preview Workspace Foundation Ready</p>
        </section>
      </main>
    </div>
  );
}
