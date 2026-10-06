import React from 'react';
import SelectionOverlay from './SelectionOverlay.jsx';

export default function ContentBlocks({ blocks, resolveAssetUrl, canvaProps }) {
  if (!blocks || blocks.length === 0) return null;
  return (
    <div className="space-y-1 mt-1 w-full">
      {blocks.map((b, idx) => {
        const align = b.align || (b.type === 'image' ? 'center' : 'left');
        const zIndexVal = b.zIndex !== undefined ? b.zIndex : (idx + 1) * 10;
        const currentW = b.width !== undefined ? b.width : 100;
        const currentH = b.height !== undefined ? b.height : null;

        const blockContainerStyle = {
          width: `${currentW}%`,
          height: currentH ? `${currentH}px` : undefined,
          opacity: b.opacity !== undefined ? b.opacity / 100 : 1,
          transform: (b.offsetX || b.offsetY) ? `translate(${b.offsetX || 0}px, ${b.offsetY || 0}px)` : undefined,
          textAlign: align,
          marginLeft: align === 'center' || align === 'right' ? 'auto' : undefined,
          marginRight: align === 'center' || align === 'left' ? 'auto' : undefined,
          zIndex: zIndexVal,
          position: 'relative'
        };

        let innerBlockContent = null;
        if (b.type === 'heading') {
          innerBlockContent = (
            <h4
              style={{
                fontFamily: 'var(--font-title)',
                color: 'var(--navy-dark)'
              }}
              className="text-xs font-bold mt-1.5"
            >
              {b.text || ''}
            </h4>
          );
        } else if (b.type === 'paragraph') {
          innerBlockContent = (
            <p
              style={{
                color: 'var(--charcoal)'
              }}
              className="text-[0.7rem] leading-relaxed"
            >
              {b.text || ''}
            </p>
          );
        } else if (b.type === 'image') {
          const blockImgSrc = resolveAssetUrl(b.url);
          if (!blockImgSrc) {
            innerBlockContent = (
              <div className="p-2 border border-dashed border-gray-400 text-gray-500 text-[10px] text-center rounded h-full flex items-center justify-center">
                [ Image Block: Select or Upload in Sidebar ]
              </div>
            );
          } else {
            let borderRadius = '4px';
            if (b.shape === 'circle') borderRadius = '50%';
            if (b.shape === 'square' || b.shape === 'natural') borderRadius = '0px';

            innerBlockContent = (
              <div className="my-1 h-full w-full flex items-center justify-center">
                <img
                  src={blockImgSrc}
                  alt="Block Content"
                  draggable={false}
                  className="image-block inline-block max-w-full select-none"
                  style={{
                    borderRadius,
                    maxHeight: currentH ? `${currentH}px` : '220px',
                    objectFit: b.shape === 'circle' ? 'cover' : 'contain'
                  }}
                />
              </div>
            );
          }
        } else if (b.type === 'divider') {
          innerBlockContent = (
            <hr
              style={{
                borderColor: 'var(--teal-accent)'
              }}
              className="my-1 border-t"
            />
          );
        }

        return (
          <SelectionOverlay
            key={b.id || idx}
            targetType="block"
            blockIndex={idx}
            currentX={b.offsetX || 0}
            currentY={b.offsetY || 0}
            currentW={currentW}
            currentH={currentH}
            isPercent={true}
            style={blockContainerStyle}
            {...canvaProps}
          >
            {innerBlockContent}
          </SelectionOverlay>
        );
      })}
    </div>
  );
}
