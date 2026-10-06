import React from 'react';
import { RefreshCw, Clock, AlertTriangle, FileText, Trash2, RotateCcw } from 'lucide-react';

export default function RecoveryPromptModal({ isOpen, session, onRestore, onDiscard }) {
  if (!isOpen || !session) return null;

  const formattedTime = session.timestamp
    ? new Date(session.timestamp).toLocaleString()
    : 'Unknown time';

  const pageCount = session.booklet?.pages?.length || 0;
  const title = session.booklet?.title || 'Untitled Booklet';

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#18181c] border border-[#333] text-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-[#22222a] border-b border-[#333] px-6 py-4 flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-title text-lg font-bold text-amber-200">Recoverable Session Found</h3>
            <p className="text-xs text-gray-400">An unsaved session was restored from local storage.</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-300 leading-relaxed">
            Would you like to restore your previous work or discard it and start fresh with the default preset?
          </p>

          <div className="bg-[#111116] border border-[#2e2e38] rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#f0e6d2]">
              <FileText className="w-4 h-4 text-[#005f73]" />
              <span>{title}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-[#222]">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                {formattedTime}
              </span>
              <span className="bg-[#222] px-2 py-0.5 rounded text-[11px] text-gray-300">
                {pageCount} page{pageCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#111116] border-t border-[#2e2e38] px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onDiscard}
            className="px-4 py-2 text-xs font-semibold text-red-300 hover:text-red-100 hover:bg-red-950/40 border border-red-900/50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Discard Session
          </button>
          <button
            onClick={onRestore}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#005f73] hover:bg-[#00424f] border border-cyan-600 rounded-lg transition-colors flex items-center gap-1.5 shadow"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restore Previous Work
          </button>
        </div>
      </div>
    </div>
  );
}
