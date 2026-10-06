import React, { useRef } from 'react';
import { Image as ImageIcon, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import { useBooklet } from '../context/BookletContext.jsx';
import { processImageFile, resolveAssetMeta } from '../utils/assets.js';

export default function AssetPicker({
  value = '',
  onChange,
  label = 'Image Asset',
  placeholder = 'Select asset or enter URL...'
}) {
  const { assets, addAsset, resolveAssetUrl, booklet } = useBooklet();
  const fileInputRef = useRef(null);

  const resolvedUrl = resolveAssetUrl(value);
  const selectedMeta = resolveAssetMeta(booklet, value);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const assetObj = await processImageFile(file);
      addAsset(assetObj);
      if (typeof onChange === 'function') {
        onChange(assetObj.id);
      }
    } catch (err) {
      console.error('Failed to process uploaded image asset:', err);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-1.5 text-xs">
      {label && <label className="block text-[11px] text-gray-400 font-medium">{label}</label>}

      {/* Asset Library Dropdown Picker */}
      {assets.length > 0 && (
        <div>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73] text-xs"
          >
            <option value="">-- Choose from Asset Library ({assets.length}) --</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                🖼️ {a.name || a.filename || a.id} ({a.width && a.height ? `${a.width}×${a.height}px, ` : ''}{formatSize(a.size)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Manual Input or Upload Row */}
      <div className="flex gap-1.5 items-center">
        <input
          type="text"
          value={value || ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73] text-xs"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-[#3a3a42] hover:bg-[#005f73] text-white px-2 py-1 rounded text-[11px] flex items-center gap-1 shrink-0 font-semibold transition-colors"
          title="Upload New Image to Asset Library"
        >
          <Upload className="w-3 h-3 text-cyan-300" />
          Upload
        </button>

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 bg-[#3a3a42] hover:bg-red-700 text-gray-300 hover:text-white rounded shrink-0"
            title="Clear Image Reference"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Selected Image Thumbnail & Metadata Preview Card */}
      {resolvedUrl && (
        <div className="flex items-center gap-2 bg-[#1a1a20] border border-[#3a3a44] p-1.5 rounded shadow-inner">
          <div className="w-10 h-10 rounded border border-[#555] bg-black/40 overflow-hidden shrink-0 flex items-center justify-center">
            <img
              src={resolvedUrl}
              alt="Asset Preview"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="min-w-0 flex-1 text-[10px] space-y-0.5">
            <div className="flex items-center gap-1 font-semibold text-cyan-300 truncate">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">{selectedMeta?.name || 'Selected Image'}</span>
            </div>
            {selectedMeta ? (
              <div className="text-gray-400 font-mono text-[9px] flex gap-2">
                <span>{selectedMeta.mimeType}</span>
                <span>{selectedMeta.width && selectedMeta.height ? `${selectedMeta.width}×${selectedMeta.height}px` : 'Image'}</span>
                <span>{formatSize(selectedMeta.size)}</span>
              </div>
            ) : (
              <div className="text-gray-400 font-mono text-[9px] truncate">
                Direct URL / Data URI
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
