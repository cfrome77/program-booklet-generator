import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, Trash2, ShieldCheck, AlertCircle, Layers, RefreshCw } from 'lucide-react';
import { useBooklet } from '../context/BookletContext.jsx';
import { processImageFile, getAllReferencedImageRefs, getUnusedAssets, getBrokenImageReferences } from '../utils/assets.js';

export default function AssetLibrary() {
  const { booklet, assets, addAsset, removeAsset, purgeUnusedAssets } = useBooklet();
  const fileInputRef = useRef(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'used' | 'unused'

  const referencedRefs = getAllReferencedImageRefs(booklet);
  const unusedList = getUnusedAssets(booklet);
  const brokenList = getBrokenImageReferences(booklet);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const assetObj = await processImageFile(file);
        addAsset(assetObj);
      } catch (err) {
        console.error('Failed to process uploaded file asset:', err);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isAssetUsed = (asset) => {
    if (!asset || !asset.id) return false;
    return referencedRefs.has(asset.id) || referencedRefs.has(`asset:${asset.id}`);
  };

  const filteredAssets = assets.filter((asset) => {
    if (filter === 'used') return isAssetUsed(asset);
    if (filter === 'unused') return !isAssetUsed(asset);
    return true;
  });

  return (
    <div className="space-y-3 text-xs bg-[#1e1e24] border border-[#3a3a44] p-3 rounded-md">
      <div className="flex items-center justify-between border-b border-[#3a3a44] pb-2">
        <h3 className="font-title text-sm text-[#f0e6d2] font-bold flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-cyan-400" />
          Asset Library ({assets.length})
        </h3>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#005f73] hover:bg-[#00424f] text-white text-[11px] px-2.5 py-1 rounded flex items-center gap-1 font-semibold transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Asset
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Filter & Actions Bar */}
      <div className="flex items-center justify-between text-[11px] gap-2">
        <div className="flex items-center gap-1 bg-[#282830] p-0.5 rounded border border-[#444]">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              filter === 'all' ? 'bg-[#005f73] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            All ({assets.length})
          </button>
          <button
            onClick={() => setFilter('used')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              filter === 'used' ? 'bg-[#005f73] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Used ({assets.length - unusedList.length})
          </button>
          <button
            onClick={() => setFilter('unused')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              filter === 'unused' ? 'bg-[#005f73] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Unused ({unusedList.length})
          </button>
        </div>

        {unusedList.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm(`Purge ${unusedList.length} unused image assets?`)) {
                purgeUnusedAssets();
              }
            }}
            className="bg-amber-900/80 hover:bg-amber-800 border border-amber-600/60 text-amber-200 text-[10px] px-2 py-1 rounded flex items-center gap-1 font-semibold transition-colors"
            title="Remove all unused assets from library"
          >
            <Trash2 className="w-3 h-3 text-amber-400" /> Purge Unused ({unusedList.length})
          </button>
        )}
      </div>

      {/* Broken Images Warning Alert */}
      {brokenList.length > 0 && (
        <div className="bg-red-950/80 border border-red-600 text-red-200 p-2 rounded text-[10px] font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{brokenList.length} broken or missing image reference{brokenList.length > 1 ? 's' : ''} detected.</span>
        </div>
      )}

      {/* Assets Grid / List */}
      {filteredAssets.length === 0 ? (
        <div className="p-4 text-center text-gray-400 italic text-[11px] border border-dashed border-[#444] rounded">
          {assets.length === 0
            ? 'No image assets stored yet. Click "Upload Asset" or add images to pages.'
            : 'No image assets match the selected filter.'}
        </div>
      ) : (
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
          {filteredAssets.map((asset) => {
            const used = isAssetUsed(asset);
            return (
              <div
                key={asset.id}
                className="bg-[#282830] border border-[#444] hover:border-gray-400 p-2 rounded flex items-center gap-2.5 transition-all"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 bg-black/60 border border-[#555] rounded overflow-hidden shrink-0 flex items-center justify-center">
                  {asset.src ? (
                    <img
                      src={asset.src}
                      alt={asset.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>

                {/* Metadata */}
                <div className="min-w-0 flex-1 space-y-0.5 text-[10px]">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-gray-200 truncate" title={asset.name}>
                      {asset.name || asset.filename || asset.id}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase shrink-0 ${
                        used
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                          : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                      }`}
                    >
                      {used ? 'Used' : 'Unused'}
                    </span>
                  </div>

                  <div className="text-gray-400 font-mono text-[9px] flex items-center gap-2">
                    <span>{asset.mimeType || 'image/png'}</span>
                    <span>{asset.width && asset.height ? `${asset.width}×${asset.height}px` : 'Image'}</span>
                    <span>{formatSize(asset.size)}</span>
                  </div>

                  <div className="text-[9px] font-mono text-cyan-400/80 truncate">
                    ID: {asset.id}
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => {
                    if (!used || window.confirm(`Asset "${asset.name}" is currently used in the booklet. Are you sure you want to delete it?`)) {
                      removeAsset(asset.id);
                    }
                  }}
                  className="p-1.5 bg-[#3a3a42] hover:bg-red-700 text-gray-300 hover:text-white rounded shrink-0 transition-colors"
                  title="Remove Asset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
