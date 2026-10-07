import React, { useState } from 'react';
import { ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Trash2, Plus, Layers, Copy, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useBooklet } from '../context/BookletContext.jsx';
import AssetPicker from './AssetPicker.jsx';

export default function BlockLayerEditor({ pageIndex, blocks = [] }) {
  const {
    addContentBlock,
    duplicateContentBlock,
    updateContentBlock,
    reorderContentBlockLayer,
    deleteContentBlock,
    selectedElement,
    setSelectedElement
  } = useBooklet();
  const [selectedBlockType, setSelectedBlockType] = useState('heading');

  const handleAdd = () => {
    addContentBlock(pageIndex, selectedBlockType);
  };

  return (
    <div className="border-t border-[#333] pt-2 mt-2">
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="text-[11px] font-bold text-[#f0c070] flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          Content Blocks & Layers ({blocks.length})
        </span>
        <div className="flex items-center gap-1">
          <select
            value={selectedBlockType}
            onChange={(e) => setSelectedBlockType(e.target.value)}
            className="bg-[#1e1e24] text-white border border-[#444] text-[10px] px-1 py-0.5 rounded focus:outline-none focus:border-[#005f73]"
          >
            <option value="heading">Subheading</option>
            <option value="paragraph">Paragraph</option>
            <option value="richText">Rich Text</option>
            <option value="list">List</option>
            <option value="table">Table</option>
            <option value="quote">Quote</option>
            <option value="image">Image</option>
            <option value="imageText">Image + Text</option>
            <option value="twoColumn">2 Columns</option>
            <option value="threeColumn">3 Columns</option>
            <option value="divider">Divider Line</option>
            <option value="spacer">Spacer</option>
            <option value="qrCode">QR Code</option>
            <option value="logo">Logo / Emblem</option>
            <option value="photoGrid">Photo Grid</option>
            <option value="caption">Caption</option>
          </select>
          <button
            onClick={handleAdd}
            className="bg-[#005f73] hover:bg-[#00424f] text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-0.5 font-semibold transition-colors"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {blocks.map((block, blockIndex) => {
          const isSelected = selectedElement?.pageIndex === pageIndex &&
            selectedElement?.elementType === 'block' &&
            selectedElement?.blockIndex === blockIndex;

          const zIndexVal = block.zIndex !== undefined ? block.zIndex : (blockIndex + 1) * 10;

          return (
            <div
              key={block.id || `b-${blockIndex}`}
              onClick={() => setSelectedElement({ pageIndex, blockIndex, elementType: 'block' })}
              className={`p-2 rounded text-xs space-y-1.5 border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#1a3344] border-[#70c0d0] shadow-md ring-1 ring-[#005f73]'
                  : 'bg-[#2a2a34] border-[#555] hover:border-gray-400'
              }`}
            >
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="flex items-center gap-1 text-[#f0c070]">
                  <span className="bg-[#122230] text-cyan-300 font-mono px-1 rounded text-[9px] border border-[#3b3b48]">
                    L{blockIndex + 1} • Z{zIndexVal}
                  </span>
                  {block.type?.toUpperCase()}
                </span>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => reorderContentBlockLayer(pageIndex, blockIndex, 'front')}
                    disabled={blockIndex === blocks.length - 1}
                    className="p-0.5 bg-[#1e1e24] hover:bg-[#005f73] rounded disabled:opacity-30 text-gray-300"
                    title="Bring to Front"
                  >
                    <ChevronsUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => reorderContentBlockLayer(pageIndex, blockIndex, 'forward')}
                    disabled={blockIndex === blocks.length - 1}
                    className="p-0.5 bg-[#1e1e24] hover:bg-[#005f73] rounded disabled:opacity-30 text-gray-300"
                    title="Bring Forward"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => reorderContentBlockLayer(pageIndex, blockIndex, 'backward')}
                    disabled={blockIndex === 0}
                    className="p-0.5 bg-[#1e1e24] hover:bg-[#005f73] rounded disabled:opacity-30 text-gray-300"
                    title="Send Backward"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => reorderContentBlockLayer(pageIndex, blockIndex, 'back')}
                    disabled={blockIndex === 0}
                    className="p-0.5 bg-[#1e1e24] hover:bg-[#005f73] rounded disabled:opacity-30 text-gray-300"
                    title="Send to Back"
                  >
                    <ChevronsDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => duplicateContentBlock(pageIndex, blockIndex)}
                    className="p-0.5 bg-[#1e1e24] hover:bg-[#005f73] rounded text-cyan-300 hover:text-white ml-1 border-l border-[#444]"
                    title="Duplicate Block"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteContentBlock(pageIndex, blockIndex)}
                    className="p-0.5 bg-[#1e1e24] hover:bg-red-700 rounded text-red-400 hover:text-white border-l border-[#444]"
                    title="Delete Block"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {(block.type === 'heading' || block.type === 'paragraph' || block.type === 'caption') && (
                <input
                  type="text"
                  value={block.text || ''}
                  placeholder="Text content..."
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'text', e.target.value)}
                  className="w-full bg-[#1e1e24] border border-[#444] text-white p-1 rounded text-[11px] focus:outline-none focus:border-[#005f73]"
                />
              )}

              {block.type === 'richText' && (
                <textarea
                  rows={3}
                  value={block.text || block.content || ''}
                  placeholder="HTML / Rich Text content..."
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'text', e.target.value)}
                  className="w-full bg-[#1e1e24] border border-[#444] text-white p-1 rounded text-[11px] focus:outline-none focus:border-[#005f73] font-mono"
                />
              )}

              {block.type === 'quote' && (
                <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={block.text || ''}
                    placeholder="Quote text..."
                    onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'text', e.target.value)}
                    className="w-full bg-[#1e1e24] border border-[#444] text-white p-1 rounded text-[11px]"
                  />
                  <input
                    type="text"
                    value={block.author || ''}
                    placeholder="Author attribution..."
                    onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'author', e.target.value)}
                    className="w-full bg-[#1e1e24] border border-[#444] text-white p-1 rounded text-[11px]"
                  />
                </div>
              )}

              {block.type === 'list' && (
                <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={block.listType || 'bullet'}
                    onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'listType', e.target.value)}
                    className="w-full bg-[#1e1e24] text-white border border-[#444] text-[10px] p-1 rounded"
                  >
                    <option value="bullet">Bullet List</option>
                    <option value="number">Numbered List</option>
                  </select>
                  <textarea
                    rows={3}
                    value={Array.isArray(block.items) ? block.items.join('\n') : ''}
                    placeholder="Enter list items (one per line)..."
                    onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'items', e.target.value.split('\n'))}
                    className="w-full bg-[#1e1e24] border border-[#444] text-white p-1 rounded text-[11px]"
                  />
                </div>
              )}

              {(block.type === 'image' || block.type === 'logo') && (
                <div onClick={(e) => e.stopPropagation()}>
                  <AssetPicker
                    value={block.url || ''}
                    onChange={(val) => updateContentBlock(pageIndex, blockIndex, 'url', val)}
                    label={block.type === 'logo' ? 'Logo Asset Source' : 'Image Block Source'}
                  />
                </div>
              )}

              {block.type === 'imageText' && (
                <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                  <AssetPicker
                    value={block.url || ''}
                    onChange={(val) => updateContentBlock(pageIndex, blockIndex, 'url', val)}
                    label="Side Image Source"
                  />
                  <select
                    value={block.imagePosition || 'left'}
                    onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'imagePosition', e.target.value)}
                    className="w-full bg-[#1e1e24] text-white border border-[#444] text-[10px] p-1 rounded"
                  >
                    <option value="left">Image on Left</option>
                    <option value="right">Image on Right</option>
                  </select>
                  <textarea
                    rows={2}
                    value={block.text || ''}
                    placeholder="Accompanying text..."
                    onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'text', e.target.value)}
                    className="w-full bg-[#1e1e24] border border-[#444] text-white p-1 rounded text-[11px]"
                  />
                </div>
              )}

              {block.type === 'twoColumn' && (
                <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                  <textarea
                    rows={2}
                    value={(block.columns || [])[0] || ''}
                    placeholder="Left column content..."
                    onChange={(e) => {
                      const cols = [...(block.columns || ['', ''])];
                      cols[0] = e.target.value;
                      updateContentBlock(pageIndex, blockIndex, 'columns', cols);
                    }}
                    className="w-full bg-[#1e1e24] border border-[#444] text-white p-1 rounded text-[11px]"
                  />
                  <textarea
                    rows={2}
                    value={(block.columns || [])[1] || ''}
                    placeholder="Right column content..."
                    onChange={(e) => {
                      const cols = [...(block.columns || ['', ''])];
                      cols[1] = e.target.value;
                      updateContentBlock(pageIndex, blockIndex, 'columns', cols);
                    }}
                    className="w-full bg-[#1e1e24] border border-[#444] text-white p-1 rounded text-[11px]"
                  />
                </div>
              )}

              {block.type === 'threeColumn' && (
                <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                  <textarea
                    rows={2}
                    value={(block.columns || [])[0] || ''}
                    placeholder="Column 1..."
                    onChange={(e) => {
                      const cols = [...(block.columns || ['', '', ''])];
                      cols[0] = e.target.value;
                      updateContentBlock(pageIndex, blockIndex, 'columns', cols);
                    }}
                    className="w-full bg-[#1e1e24] border border-[#444] text-white p-1 rounded text-[11px]"
                  />
                  <textarea
                    rows={2}
                    value={(block.columns || [])[1] || ''}
                    placeholder="Column 2..."
                    onChange={(e) => {
                      const cols = [...(block.columns || ['', '', ''])];
                      cols[1] = e.target.value;
                      updateContentBlock(pageIndex, blockIndex, 'columns', cols);
                    }}
                    className="w-full bg-[#1e1e24] border border-[#444] text-white p-1 rounded text-[11px]"
                  />
                  <textarea
                    rows={2}
                    value={(block.columns || [])[2] || ''}
                    placeholder="Column 3..."
                    onChange={(e) => {
                      const cols = [...(block.columns || ['', '', ''])];
                      cols[2] = e.target.value;
                      updateContentBlock(pageIndex, blockIndex, 'columns', cols);
                    }}
                    className="w-full bg-[#1e1e24] border border-[#444] text-white p-1 rounded text-[11px]"
                  />
                </div>
              )}

              {block.type === 'qrCode' && (
                <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={block.qrUrl || ''}
                    placeholder="Target URL or text..."
                    onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'qrUrl', e.target.value)}
                    className="w-full bg-[#1e1e24] border border-[#444] text-white p-1 rounded text-[11px]"
                  />
                  <input
                    type="text"
                    value={block.label || ''}
                    placeholder="QR Code caption / label..."
                    onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'label', e.target.value)}
                    className="w-full bg-[#1e1e24] border border-[#444] text-white p-1 rounded text-[11px]"
                  />
                </div>
              )}

              {block.type === 'divider' && (
                <p className="text-[10px] text-gray-400 italic">Horizontal line divider</p>
              )}

              <div className="bg-[#1e1e24] p-1.5 rounded border border-[#444] space-y-1.5 mt-1 text-[10px]" onClick={(e) => e.stopPropagation()}>
                <div className="font-semibold text-gray-300 mb-0.5">Sizing, Alignment & Shift Position</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="text-gray-400 block">Width ({block.width !== undefined ? block.width : 100}%)</label>
                    <input
                      type="range"
                      min="15"
                      max="100"
                      value={block.width !== undefined ? block.width : 100}
                      onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'width', Number(e.target.value), true)}
                      className="w-full accent-[#005f73]"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 block">
                      Height ({block.height ? `${(block.height / 96).toFixed(2)}" (${block.height}px)` : 'Auto'})
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="400"
                      value={block.height || 100}
                      onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'height', Number(e.target.value), true)}
                      className="w-full accent-[#005f73]"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-0.5">Alignment</label>
                    <div className="flex items-center gap-1 bg-[#2a2a34] p-0.5 rounded border border-[#555]">
                      <button
                        onClick={() => updateContentBlock(pageIndex, blockIndex, 'align', 'left')}
                        className={`p-1 rounded flex-1 flex justify-center ${
                          (block.align || (block.type === 'image' ? 'center' : 'left')) === 'left'
                            ? 'bg-[#005f73] text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                        title="Align Left"
                      >
                        <AlignLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => updateContentBlock(pageIndex, blockIndex, 'align', 'center')}
                        className={`p-1 rounded flex-1 flex justify-center ${
                          (block.align || (block.type === 'image' ? 'center' : 'left')) === 'center'
                            ? 'bg-[#005f73] text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                        title="Align Center"
                      >
                        <AlignCenter className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => updateContentBlock(pageIndex, blockIndex, 'align', 'right')}
                        className={`p-1 rounded flex-1 flex justify-center ${
                          (block.align || (block.type === 'image' ? 'center' : 'left')) === 'right'
                            ? 'bg-[#005f73] text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                        title="Align Right"
                      >
                        <AlignRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 block">Layer Level (Z-Index: {zIndexVal})</label>
                    <input
                      type="range"
                      min="1"
                      max="200"
                      value={zIndexVal}
                      onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'zIndex', Number(e.target.value), true)}
                      className="w-full accent-[#005f73]"
                    />
                  </div>

                  {block.type === 'image' && (
                    <div>
                      <label className="text-gray-400 block">Shape</label>
                      <select
                        value={block.shape || 'rounded'}
                        onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'shape', e.target.value)}
                        className="w-full bg-[#2a2a34] border border-[#555] text-white rounded p-0.5"
                      >
                        <option value="rounded">Rounded Box</option>
                        <option value="circle">Circle / Oval</option>
                        <option value="square">Square Corners</option>
                        <option value="natural">Natural Frame</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-gray-400 block">Opacity ({block.opacity !== undefined ? block.opacity : 100}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={block.opacity !== undefined ? block.opacity : 100}
                      onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'opacity', Number(e.target.value), true)}
                      className="w-full accent-[#005f73]"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 block">
                      Shift X ({((block.offsetX || 0) / 96).toFixed(2)}" / {block.offsetX || 0}px)
                    </label>
                    <input
                      type="range"
                      min="-120"
                      max="120"
                      value={block.offsetX || 0}
                      onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'offsetX', Number(e.target.value), true)}
                      className="w-full accent-[#005f73]"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 block">
                      Shift Y ({((block.offsetY || 0) / 96).toFixed(2)}" / {block.offsetY || 0}px)
                    </label>
                    <input
                      type="range"
                      min="-120"
                      max="120"
                      value={block.offsetY || 0}
                      onChange={(e) => updateContentBlock(pageIndex, blockIndex, 'offsetY', Number(e.target.value), true)}
                      className="w-full accent-[#005f73]"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
