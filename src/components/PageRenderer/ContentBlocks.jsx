import React from 'react';
import SelectionOverlay from './SelectionOverlay.jsx';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { generateQrSvg, validateQrContent } from '../../utils/qrcode.js';

export default function ContentBlocks({ blocks, resolveAssetUrl, canvaProps }) {
  if (!blocks || blocks.length === 0) return null;
  return (
    <div className="space-y-1 mt-1 w-full">
      {blocks.map((b, idx) => {
        const align = b.align || (b.type === 'image' || b.type === 'logo' || b.type === 'qrCode' ? 'center' : 'left');
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
        } else if (b.type === 'richText') {
          innerBlockContent = (
            <div
              className="text-[0.7rem] leading-relaxed select-text"
              style={{ color: 'var(--charcoal)' }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(b.text || b.content || '') }}
            />
          );
        } else if (b.type === 'list') {
          const items = Array.isArray(b.items) ? b.items : [];
          const isOrdered = b.listType === 'number' || b.listType === 'ordered';
          const ListTag = isOrdered ? 'ol' : 'ul';
          innerBlockContent = (
            <ListTag className={`text-[0.7rem] leading-relaxed pl-4 text-[var(--charcoal)] ${isOrdered ? 'list-decimal' : 'list-disc'}`}>
              {items.map((it, iIdx) => (
                <li key={iIdx}>{it}</li>
              ))}
            </ListTag>
          );
        } else if (b.type === 'table') {
          const headers = Array.isArray(b.headers) ? b.headers : [];
          const rows = Array.isArray(b.rows) ? b.rows : [];
          innerBlockContent = (
            <div className="my-1 overflow-x-auto w-full">
              <table className="w-full text-[0.65rem] border-collapse border border-[#ddd]">
                {headers.length > 0 && (
                  <thead>
                    <tr className="bg-[var(--navy-dark)] text-white">
                      {headers.map((h, hIdx) => (
                        <th key={hIdx} className="p-1 border border-[#ccc] font-bold text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {Array.isArray(row) &&
                        row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-1 border border-[#eee] text-[var(--charcoal)]">
                            {cell}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        } else if (b.type === 'quote') {
          innerBlockContent = (
            <blockquote className="my-1 pl-3 border-l-2 border-[var(--teal-accent)] italic text-[0.7rem] text-[var(--charcoal)] bg-teal-50/30 p-1.5 rounded-r">
              <p>"{b.text || ''}"</p>
              {b.author && <cite className="block text-[0.6rem] font-semibold text-[var(--navy-dark)] not-italic mt-1">— {b.author}</cite>}
            </blockquote>
          );
        } else if (b.type === 'image' || b.type === 'logo') {
          const blockImgSrc = resolveAssetUrl(b.url);
          if (!blockImgSrc) {
            innerBlockContent = (
              <div className="p-2 border border-dashed border-gray-400 text-gray-500 text-[10px] text-center rounded h-full flex items-center justify-center">
                [{b.type === 'logo' ? 'Logo Block' : 'Image Block'}: Select or Upload in Sidebar]
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
        } else if (b.type === 'imageText') {
          const blockImgSrc = resolveAssetUrl(b.url);
          const isRight = b.imagePosition === 'right';
          innerBlockContent = (
            <div className={`my-1 flex items-center gap-2 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
              {blockImgSrc ? (
                <img
                  src={blockImgSrc}
                  alt="Image side"
                  draggable={false}
                  className="w-1/3 max-h-28 object-contain rounded"
                />
              ) : (
                <div className="w-1/3 p-2 border border-dashed border-gray-400 text-gray-500 text-[9px] text-center rounded">
                  [Image]
                </div>
              )}
              <div className="w-2/3 text-[0.7rem] text-[var(--charcoal)] leading-relaxed">
                {b.text || ''}
              </div>
            </div>
          );
        } else if (b.type === 'twoColumn') {
          const cols = Array.isArray(b.columns) ? b.columns : ['', ''];
          innerBlockContent = (
            <div className="my-1 grid grid-cols-2 gap-2 text-[0.7rem] text-[var(--charcoal)] leading-relaxed">
              <div>{cols[0] || ''}</div>
              <div>{cols[1] || ''}</div>
            </div>
          );
        } else if (b.type === 'threeColumn') {
          const cols = Array.isArray(b.columns) ? b.columns : ['', '', ''];
          innerBlockContent = (
            <div className="my-1 grid grid-cols-3 gap-1.5 text-[0.65rem] text-[var(--charcoal)] leading-relaxed">
              <div>{cols[0] || ''}</div>
              <div>{cols[1] || ''}</div>
              <div>{cols[2] || ''}</div>
            </div>
          );
        } else if (b.type === 'divider') {
          innerBlockContent = (
            <hr
              style={{
                borderColor: 'var(--teal-accent)'
              }}
              className="my-1 border-t"
            />
          );
        } else if (b.type === 'spacer') {
          innerBlockContent = <div style={{ height: `${b.height || 20}px` }} className="w-full" />;
        } else if (b.type === 'qrCode') {
          const qrContent = b.qrUrl || b.content || '';
          const validation = validateQrContent(qrContent);

          if (!validation.valid) {
            innerBlockContent = (
              <div className="my-1 p-2 border border-dashed border-red-400 bg-red-50 text-red-600 text-[10px] text-center rounded flex flex-col items-center justify-center">
                <span className="font-bold mb-0.5">⚠️ QR Code Content Required</span>
                <span>{validation.error}</span>
              </div>
            );
          } else {
            const qrResult = generateQrSvg(qrContent, {
              errorCorrectionLevel: b.errorCorrection || 'M',
              size: b.qrSize || b.height || 100,
              label: b.label
            });

            if (!qrResult.valid) {
              innerBlockContent = (
                <div className="my-1 p-2 border border-dashed border-red-400 bg-red-50 text-red-600 text-[10px] text-center rounded">
                  ⚠️ Error generating QR code: {qrResult.error}
                </div>
              );
            } else {
              innerBlockContent = (
                <div className="my-1 flex flex-col items-center justify-center">
                  <div
                    className="p-1 rounded bg-white border border-gray-200 shadow-sm inline-block"
                    dangerouslySetInnerHTML={{ __html: qrResult.svg }}
                  />
                  {b.label && (
                    <span className="text-[0.6rem] text-gray-600 mt-1 text-center font-medium">
                      {b.label}
                    </span>
                  )}
                </div>
              );
            }
          }
        } else if (b.type === 'photoGrid') {
          const imgs = Array.isArray(b.images) ? b.images : [];
          const gridCols = b.columns === 3 ? 'grid-cols-3' : b.columns === 4 ? 'grid-cols-4' : 'grid-cols-2';
          innerBlockContent = (
            <div className={`my-1 grid ${gridCols} gap-1.5 w-full`}>
              {imgs.map((imgRef, iIdx) => {
                const resolved = resolveAssetUrl(imgRef);
                return (
                  <div key={iIdx} className="aspect-square bg-gray-100 rounded overflow-hidden border border-gray-200 flex items-center justify-center">
                    {resolved ? (
                      <img src={resolved} alt={`Grid ${iIdx}`} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[8px] text-gray-400">Photo {iIdx + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        } else if (b.type === 'caption') {
          innerBlockContent = (
            <p className="text-[0.6rem] text-gray-500 italic text-center my-0.5">
              {b.text || ''}
            </p>
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
