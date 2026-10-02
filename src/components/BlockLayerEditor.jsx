import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import { useBooklet } from '../context/BookletContext.jsx';

export default function BlockLayerEditor({ pageIndex, blocks = [] }) {
  const { addContentBlock, updateContentBlock, moveContentBlock, deleteContentBlock } = useBooklet();
  const [selectedBlockType, setSelectedBlockType] = useState('heading');

  const handleAdd = () => {
    addContentBlock(pageIndex, selectedBlockType);
  };

  const handleImageUpload = (blockIndex, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result;
        if (typeof dataUrl === 'string') {
          updateContentBlock(pageIndex, blockIndex, 'url', dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="border-t border-[#333] pt-2 mt-2">
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="text-[11px] font-bold text-[#f0c070]">Content Blocks Layer</span>
        <div className="flex items-center gap-1">
          <select
            value={selectedBlockType}
            onChange={(e) => setSelectedBlockType(e.target.value)}
            className="bg-[#1e1e24] text-white border border-[#444] text-[10px] px-1 py-0.5 rounded"
          >
            <option value="heading">Subheading</option>
            <option value="paragraph">Paragraph</option>
            <option value="image">Image</option>
            <option value="divider">Divider Line</option>
          </select>
          <button
            onClick={handleAdd}
            className="bg-[#005f73] hover:bg-[#00424f] text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-0.5"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {blocks.map((block, blockIndex) => (
          <div
            key={block.id || `b-${blockIndex}`}
            className="bg-[#2a2a34] p-2 rounded border border-dashed border-[#555] text-xs space-y-1.5"
          >
            <div className="flex justify-between items-center text-[10px] font-bold text-[#f0c070]">
              <span>{block.type?.toUpperCase()}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveContentBlock(pageIndex, blockIndex, -1)}
                  disabled={blockIndex === 0}
                  className="p-0.5 bg-[#1e1e24] hover:bg-[#444] rounded disabled:opacity-30 text-gray-300"
                  title="Move Up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => moveContentBlock(pageIndex, blockIndex, 1)}
                  disabled={blockIndex === blocks.length - 1}
                  className="p-0.5 bg-[#1e1e24] hover:bg-[#444] rounded disabled:opacity-30 text-gray-300"
                  title="Move Down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteContentBlock(pageIndex, blockIndex)}
                  className="p-0.5 bg-[#1e1e24] hover:bg-red-700 rounded text-red-400 hover:text-white"
                  title="Delete Block"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {(block.type === 'heading' || block.type === 'paragraph') && (
              <input
                type="text"
                value={block.text || ''}
                placeholder="Text content..."
                onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'text', e.target.value)}
                className="w-full bg-[#1e1e24] border border-[#444] text-white p-1 rounded text-[11px] focus:outline-none focus:border-[#005f73]"
              />
            )}

            {block.type === 'image' && (
              <div className="space-y-1">
                <input
                  type="text"
                  value={block.url || ''}
                  placeholder="Image URL..."
                  onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'url', e.target.value)}
                  className="w-full bg-[#1e1e24] border border-[#444] text-white p-1 rounded text-[11px] focus:outline-none focus:border-[#005f73]"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(blockIndex, e)}
                  className="text-[10px] text-gray-400 file:mr-2 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:bg-[#3a3a42] file:text-white hover:file:bg-[#4a4a54] cursor-pointer"
                />
              </div>
            )}

            {block.type === 'divider' && (
              <p className="text-[10px] text-gray-400 italic">Horizontal line divider</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
