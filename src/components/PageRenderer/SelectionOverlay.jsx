import React from 'react';
import { ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Trash2, Move, Maximize2, Grid, Copy, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

function CanvaToolbar({
  targetType,
  blockIndex = null,
  currentX = 0,
  currentY = 0,
  currentW = null,
  currentH = null,
  actualPageIndex,
  page,
  snapEnabled,
  setSnapEnabled,
  updateContentBlock,
  updatePageField,
  reorderContentBlockLayer,
  deleteContentBlock,
  duplicateContentBlock
}) {
  const isBlock = targetType === 'block' && blockIndex !== null;
  const currentZ = isBlock
    ? (page.blocks?.[blockIndex]?.zIndex || (blockIndex + 1) * 10)
    : (page[`${targetType}ZIndex`] !== undefined ? page[`${targetType}ZIndex`] : 100);

  // Convert pixel values to inches (1 in = 96 px in standard CSS)
  const inX = (currentX / 96).toFixed(2);
  const inY = (currentY / 96).toFixed(2);
  const formattedShiftX = (currentX >= 0 ? `+${inX}"` : `${inX}"`) + ` (${currentX >= 0 ? `+${currentX}` : currentX}px)`;
  const formattedShiftY = (currentY >= 0 ? `+${inY}"` : `${inY}"`) + ` (${currentY >= 0 ? `+${currentY}` : currentY}px)`;

  let dimString = '';
  if (currentW !== null) {
    if (typeof currentW === 'number' && isBlock) {
      dimString = `${currentW}%`;
    } else {
      const inW = (Number(currentW) / 96).toFixed(2);
      dimString = `${inW}" (${currentW}px)`;
    }
    if (currentH !== null) {
      const inH = (Number(currentH) / 96).toFixed(2);
      dimString += ` × ${inH}" (${currentH}px)`;
    }
  }

  return (
    <div
      className="absolute -top-9 left-1/2 -translate-x-1/2 z-[999] bg-[#122230] text-white px-2 py-1 rounded-md shadow-2xl border border-[#70c0d0] flex items-center gap-1.5 text-[10px] select-none cursor-default whitespace-nowrap"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setSnapEnabled(!snapEnabled)}
        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold flex items-center gap-1 transition-colors ${
          snapEnabled
            ? 'bg-[#005f73] text-cyan-300 border border-[#70c0d0]'
            : 'bg-[#2a2a34] text-gray-400 border border-[#444] hover:text-white'
        }`}
        title={snapEnabled ? 'Smart Alignment Guides Active (Click to Disable)' : 'Smart Alignment Guides Disabled (Click to Enable)'}
      >
        <Grid className="w-2.5 h-2.5" />
        {snapEnabled ? 'SNAP ON' : 'SNAP OFF'}
      </button>

      <span className="flex items-center gap-0.5 text-cyan-300 font-mono font-bold pr-1 border-r border-[#3a3a44]">
        <Move className="w-3 h-3 text-amber-400" />
        X:{formattedShiftX}, Y:{formattedShiftY}
      </span>

      {currentW !== null && (
        <span className="flex items-center gap-0.5 text-amber-300 font-mono text-[9px] pr-1 border-r border-[#3a3a44]">
          <Maximize2 className="w-2.5 h-2.5" />
          {dimString}
        </span>
      )}

      <span className="text-gray-400 font-mono text-[9px] pr-1 border-r border-[#3a3a44]">
        Z:{currentZ}
      </span>

      {isBlock ? (
        <>
          <div className="flex items-center gap-0.5 border-r border-[#3a3a44] pr-1">
            <button
              onClick={() => updateContentBlock(actualPageIndex, blockIndex, 'align', 'left')}
              className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
              title="Align Left"
            >
              <AlignLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => updateContentBlock(actualPageIndex, blockIndex, 'align', 'center')}
              className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
              title="Align Center"
            >
              <AlignCenter className="w-3 h-3" />
            </button>
            <button
              onClick={() => updateContentBlock(actualPageIndex, blockIndex, 'align', 'right')}
              className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
              title="Align Right"
            >
              <AlignRight className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={() => reorderContentBlockLayer(actualPageIndex, blockIndex, 'forward')}
            className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
            title="Bring Layer Forward"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => reorderContentBlockLayer(actualPageIndex, blockIndex, 'backward')}
            className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
            title="Send Layer Backward"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => reorderContentBlockLayer(actualPageIndex, blockIndex, 'front')}
            className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
            title="Bring to Front"
          >
            <ChevronsUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => reorderContentBlockLayer(actualPageIndex, blockIndex, 'back')}
            className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
            title="Send to Back"
          >
            <ChevronsDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => duplicateContentBlock(actualPageIndex, blockIndex)}
            className="p-1 hover:bg-[#005f73] rounded text-cyan-300 hover:text-white pl-1 border-l border-[#3a3a44]"
            title="Duplicate Block (Ctrl+D)"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={() => deleteContentBlock(actualPageIndex, blockIndex)}
            className="p-1 hover:bg-red-700 rounded text-red-300 hover:text-white"
            title="Delete Block (Delete)"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => updatePageField(actualPageIndex, `${targetType}ZIndex`, currentZ + 10)}
            className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
            title="Bring Element Forward"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => updatePageField(actualPageIndex, `${targetType}ZIndex`, Math.max(1, currentZ - 10))}
            className="p-1 hover:bg-[#005f73] rounded text-gray-200 hover:text-white"
            title="Send Element Backward"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
}

function ResizeHandles({ handlePointerDownResize, targetType, blockIndex, currentW, currentH, isPercent }) {
  return (
    <>
      <div
        onPointerDown={(e) => handlePointerDownResize(e, 'tl', targetType, blockIndex, currentW, currentH, isPercent)}
        className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#005f73] rounded-full z-[1000] cursor-nwse-resize shadow hover:scale-125 transition-transform"
        title="Drag corner to resize"
      />
      <div
        onPointerDown={(e) => handlePointerDownResize(e, 'tr', targetType, blockIndex, currentW, currentH, isPercent)}
        className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#005f73] rounded-full z-[1000] cursor-nesw-resize shadow hover:scale-125 transition-transform"
        title="Drag corner to resize"
      />
      <div
        onPointerDown={(e) => handlePointerDownResize(e, 'bl', targetType, blockIndex, currentW, currentH, isPercent)}
        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#005f73] rounded-full z-[1000] cursor-nesw-resize shadow hover:scale-125 transition-transform"
        title="Drag corner to resize"
      />
      <div
        onPointerDown={(e) => handlePointerDownResize(e, 'br', targetType, blockIndex, currentW, currentH, isPercent)}
        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#005f73] rounded-full z-[1000] cursor-nwse-resize shadow hover:scale-125 transition-transform"
        title="Drag corner to resize"
      />

      <div
        onPointerDown={(e) => handlePointerDownResize(e, 'r', targetType, blockIndex, currentW, currentH, isPercent)}
        className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-4 bg-[#005f73] border border-white rounded z-[1000] cursor-ew-resize shadow hover:scale-125 transition-transform"
        title="Drag edge to adjust width"
      />
      <div
        onPointerDown={(e) => handlePointerDownResize(e, 'l', targetType, blockIndex, currentW, currentH, isPercent)}
        className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-4 bg-[#005f73] border border-white rounded z-[1000] cursor-ew-resize shadow hover:scale-125 transition-transform"
        title="Drag edge to adjust width"
      />
      <div
        onPointerDown={(e) => handlePointerDownResize(e, 'b', targetType, blockIndex, currentW, currentH, isPercent)}
        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-[#005f73] border border-white rounded z-[1000] cursor-ns-resize shadow hover:scale-125 transition-transform"
        title="Drag edge to adjust height"
      />
      <div
        onPointerDown={(e) => handlePointerDownResize(e, 't', targetType, blockIndex, currentW, currentH, isPercent)}
        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-[#005f73] border border-white rounded z-[1000] cursor-ns-resize shadow hover:scale-125 transition-transform"
        title="Drag edge to adjust height"
      />
    </>
  );
}

export default function SelectionOverlay({
  targetType,
  blockIndex = null,
  currentX = 0,
  currentY = 0,
  currentW = null,
  currentH = null,
  isPercent = false,
  className = '',
  style = {},
  children,
  actualPageIndex,
  page,
  selectedElement,
  snapEnabled,
  setSnapEnabled,
  handlePointerDownDrag,
  handlePointerDownResize,
  updateContentBlock,
  updatePageField,
  reorderContentBlockLayer,
  deleteContentBlock,
  duplicateContentBlock
}) {
  const isSelected = selectedElement?.pageIndex === actualPageIndex &&
    selectedElement?.elementType === targetType &&
    (blockIndex === null || selectedElement?.blockIndex === blockIndex);

  return (
    <div
      className={`group relative cursor-grab active:cursor-grabbing transition-shadow rounded p-0.5 ${
        isSelected
          ? 'ring-2 ring-[#005f73] outline outline-1 outline-[#70c0d0] shadow-md bg-[#005f73]/10 z-[200]'
          : 'hover:outline hover:outline-1 hover:outline-amber-500/50'
      } ${className}`}
      style={style}
      onPointerDown={(e) => handlePointerDownDrag(e, targetType, blockIndex, currentX, currentY)}
    >
      {isSelected && (
        <CanvaToolbar
          targetType={targetType}
          blockIndex={blockIndex}
          currentX={currentX}
          currentY={currentY}
          currentW={currentW}
          currentH={currentH}
          actualPageIndex={actualPageIndex}
          page={page}
          snapEnabled={snapEnabled}
          setSnapEnabled={setSnapEnabled}
          updateContentBlock={updateContentBlock}
          updatePageField={updatePageField}
          reorderContentBlockLayer={reorderContentBlockLayer}
          deleteContentBlock={deleteContentBlock}
          duplicateContentBlock={duplicateContentBlock}
        />
      )}
      {isSelected && (
        <ResizeHandles
          handlePointerDownResize={handlePointerDownResize}
          targetType={targetType}
          blockIndex={blockIndex}
          currentW={currentW}
          currentH={currentH}
          isPercent={isPercent}
        />
      )}
      {children}
    </div>
  );
}
