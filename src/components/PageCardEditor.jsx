import React from 'react';
import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { useBooklet } from '../context/BookletContext.jsx';
import BlockLayerEditor from './BlockLayerEditor.jsx';

export default function PageCardEditor({ page, pageIndex, isFirst, isLast }) {
  const {
    updatePageField,
    changePageType,
    movePage,
    deletePage
  } = useBooklet();

  const handleImageUpload = (field, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result;
        if (typeof dataUrl === 'string') {
          updatePageField(pageIndex, field, dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSponsorsChange = (e) => {
    const sponsorsList = e.target.value.split(',').map((s) => s.trim());
    updatePageField(pageIndex, 'sponsors', sponsorsList);
  };

  const pageType = page.type || 'custom';

  return (
    <div className="bg-[#1e1e24] border border-[#444] rounded p-3 text-xs space-y-2.5">
      <div className="flex justify-between items-center font-bold text-[#70c0d0]">
        <span>Page {pageIndex + 1}: {pageType.toUpperCase()}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => movePage(pageIndex, -1)}
            disabled={isFirst}
            className="p-1 bg-[#333] hover:bg-[#555] rounded disabled:opacity-30 text-white"
            title="Move Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => movePage(pageIndex, 1)}
            disabled={isLast}
            className="p-1 bg-[#333] hover:bg-[#555] rounded disabled:opacity-30 text-white"
            title="Move Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete Page ${pageIndex + 1}?`)) {
                deletePage(pageIndex);
              }
            }}
            className="p-1 bg-[#333] hover:bg-red-700 rounded text-red-300 hover:text-white"
            title="Delete Page"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-[11px] text-gray-400 mb-0.5">Page Type</label>
        <select
          value={pageType}
          onChange={(e) => changePageType(pageIndex, e.target.value)}
          className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73]"
        >
          <option value="cover">Front Cover</option>
          <option value="schedule">Schedule / Agenda</option>
          <option value="leadership">Leadership Remarks</option>
          <option value="keynote">Keynote Speaker</option>
          <option value="awards">Awards & Honors</option>
          <option value="vigilIntro">Class Honoree / Vigil</option>
          <option value="roster">Roster Grid</option>
          <option value="custom">Custom Content</option>
          <option value="backCover">Back Cover</option>
        </select>
      </div>

      {pageType === 'cover' && (
        <>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Main Title</label>
            <input
              type="text"
              value={page.title || ''}
              onChange={(e) => updatePageField(pageIndex, 'title', e.target.value)}
              className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Subtitle</label>
            <input
              type="text"
              value={page.subtitle || ''}
              onChange={(e) => updatePageField(pageIndex, 'subtitle', e.target.value)}
              className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Date & Location</label>
            <input
              type="text"
              value={page.dateLocation || ''}
              onChange={(e) => updatePageField(pageIndex, 'dateLocation', e.target.value)}
              className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Tagline</label>
            <input
              type="text"
              value={page.tagline || ''}
              onChange={(e) => updatePageField(pageIndex, 'tagline', e.target.value)}
              className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Emblem Image URL or Text</label>
            <input
              type="text"
              value={page.emblemImg || page.emblemText || ''}
              placeholder="URL or text"
              onChange={(e) => updatePageField(pageIndex, 'emblemImg', e.target.value)}
              className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73]"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload('emblemImg', e)}
              className="mt-1 text-[10px] text-gray-400 file:mr-2 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:bg-[#3a3a42] file:text-white hover:file:bg-[#4a4a54] cursor-pointer"
            />
          </div>

          <div className="bg-[#24242e] p-2 rounded border border-[#3b3b48] space-y-2">
            <span className="text-[10px] font-bold text-[#70c0d0] block">Emblem Shape, Size & Positioning</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-400">Shape</label>
                <select
                  value={page.emblemShape || 'circle'}
                  onChange={(e) => updatePageField(pageIndex, 'emblemShape', e.target.value)}
                  className="w-full bg-[#1e1e24] border border-[#444] text-white text-[10px] p-1 rounded"
                >
                  <option value="circle">Circular Patch</option>
                  <option value="rounded">Rounded Square</option>
                  <option value="square">Square</option>
                  <option value="none">Natural / No Border</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400">Opacity ({page.emblemOpacity !== undefined ? page.emblemOpacity : 100}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={page.emblemOpacity !== undefined ? page.emblemOpacity : 100}
                  onChange={(e) => updatePageField(pageIndex, 'emblemOpacity', Number(e.target.value))}
                  className="w-full accent-[#005f73]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400">Width ({page.emblemWidth || 120}px)</label>
                <input
                  type="range"
                  min="40"
                  max="280"
                  value={page.emblemWidth || 120}
                  onChange={(e) => updatePageField(pageIndex, 'emblemWidth', Number(e.target.value))}
                  className="w-full accent-[#005f73]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400">Height ({page.emblemHeight || 120}px)</label>
                <input
                  type="range"
                  min="40"
                  max="280"
                  value={page.emblemHeight || 120}
                  onChange={(e) => updatePageField(pageIndex, 'emblemHeight', Number(e.target.value))}
                  className="w-full accent-[#005f73]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400">Shift X ({page.emblemOffsetX || 0}px)</label>
                <input
                  type="range"
                  min="-120"
                  max="120"
                  value={page.emblemOffsetX || 0}
                  onChange={(e) => updatePageField(pageIndex, 'emblemOffsetX', Number(e.target.value))}
                  className="w-full accent-[#005f73]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400">Shift Y ({page.emblemOffsetY || 0}px)</label>
                <input
                  type="range"
                  min="-120"
                  max="120"
                  value={page.emblemOffsetY || 0}
                  onChange={(e) => updatePageField(pageIndex, 'emblemOffsetY', Number(e.target.value))}
                  className="w-full accent-[#005f73]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400">Layer Level (Z-Index: {page.emblemZIndex !== undefined ? page.emblemZIndex : 100})</label>
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={page.emblemZIndex !== undefined ? page.emblemZIndex : 100}
                  onChange={(e) => updatePageField(pageIndex, 'emblemZIndex', Number(e.target.value))}
                  className="w-full accent-[#005f73]"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Title Frame Style</label>
            <select
              value={page.titleFrameStyle || (page.scrollworkFrame === false ? 'none' : 'scrollwork')}
              onChange={(e) => {
                updatePageField(pageIndex, 'titleFrameStyle', e.target.value);
                updatePageField(pageIndex, 'scrollworkFrame', e.target.value === 'scrollwork');
              }}
              className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73]"
            >
              <option value="scrollwork">Scrollwork Frame (Ornamental)</option>
              <option value="badge">Parchment Badge / Card</option>
              <option value="bordered">Simple Bordered Frame</option>
              <option value="none">None (Direct Text)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Bottom Banner / Overlay Style</label>
            <select
              value={page.bottomBannerStyle || 'torn'}
              onChange={(e) => updatePageField(pageIndex, 'bottomBannerStyle', e.target.value)}
              className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73]"
            >
              <option value="torn">Torn Parchment Ribbon Scroll</option>
              <option value="gold">Gold Foil Frame</option>
              <option value="simple">Simple Parchment Strip</option>
              <option value="none">None</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Bottom Parchment Banner Text</label>
            <input
              type="text"
              value={page.bottomBannerText || ''}
              onChange={(e) => updatePageField(pageIndex, 'bottomBannerText', e.target.value)}
              className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73]"
            />
          </div>
        </>
      )}

      {pageType === 'backCover' && (
        <>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Organization Name</label>
            <input
              type="text"
              value={page.organization || ''}
              onChange={(e) => updatePageField(pageIndex, 'organization', e.target.value)}
              className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Sub Organization / Council</label>
            <input
              type="text"
              value={page.subOrganization || ''}
              onChange={(e) => updatePageField(pageIndex, 'subOrganization', e.target.value)}
              className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">QR Code Image URL / Placeholder</label>
            <input
              type="text"
              value={page.qrImg || ''}
              placeholder="Image URL"
              onChange={(e) => updatePageField(pageIndex, 'qrImg', e.target.value)}
              className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73]"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload('qrImg', e)}
              className="mt-1 text-[10px] text-gray-400 file:mr-2 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:bg-[#3a3a42] file:text-white hover:file:bg-[#4a4a54] cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Bottom Banner / Overlay Style</label>
            <select
              value={page.bottomBannerStyle || 'torn'}
              onChange={(e) => updatePageField(pageIndex, 'bottomBannerStyle', e.target.value)}
              className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73]"
            >
              <option value="torn">Torn Parchment Ribbon Scroll</option>
              <option value="gold">Gold Foil Frame</option>
              <option value="simple">Simple Parchment Strip</option>
              <option value="none">None</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Sponsors / Partners (Comma separated)</label>
            <input
              type="text"
              value={(page.sponsors || []).join(', ')}
              onChange={handleSponsorsChange}
              className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73]"
            />
          </div>
        </>
      )}

      {pageType === 'custom' && (
        <>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Page Title</label>
            <input
              type="text"
              value={page.title || ''}
              onChange={(e) => updatePageField(pageIndex, 'title', e.target.value)}
              className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73]"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Content (Supports HTML/Text)</label>
            <textarea
              value={page.content || ''}
              onChange={(e) => updatePageField(pageIndex, 'content', e.target.value)}
              rows={3}
              className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73] resize-y"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-400 mb-0.5">Vertical Alignment</label>
            <select
              value={page.vAlign || 'space-between'}
              onChange={(e) => updatePageField(pageIndex, 'vAlign', e.target.value)}
              className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73]"
            >
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
              <option value="space-between">Spread Out (Space-Between)</option>
            </select>
          </div>
        </>
      )}

      {pageType !== 'cover' && pageType !== 'backCover' && pageType !== 'custom' && (
        <div>
          <label className="block text-[11px] text-gray-400 mb-0.5">Page Title</label>
          <input
            type="text"
            value={page.title || ''}
            onChange={(e) => updatePageField(pageIndex, 'title', e.target.value)}
            className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73]"
          />
        </div>
      )}

      {/* Per-Page Background Image Override */}
      <div>
        <label className="block text-[11px] text-gray-400 mb-0.5">Page Background Image (Per-Page Override)</label>
        <input
          type="text"
          value={page.bgImage || ''}
          placeholder="Image URL"
          onChange={(e) => updatePageField(pageIndex, 'bgImage', e.target.value)}
          className="w-full bg-[#282830] border border-[#444] text-white p-1 rounded focus:outline-none focus:border-[#005f73]"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload('bgImage', e)}
          className="mt-1 text-[10px] text-gray-400 file:mr-2 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:bg-[#3a3a42] file:text-white hover:file:bg-[#4a4a54] cursor-pointer"
        />
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <label className="text-[10px] text-gray-400">BG Image Opacity</label>
          <div className="flex items-center gap-1.5">
            <input
              type="range"
              min="0"
              max="100"
              value={page.bgImageOpacity !== undefined ? page.bgImageOpacity : 100}
              onChange={(e) => updatePageField(pageIndex, 'bgImageOpacity', Number(e.target.value))}
              className="w-20 accent-[#005f73]"
            />
            <span className="text-[10px] text-gray-300 min-w-[28px] text-right">
              {page.bgImageOpacity !== undefined ? page.bgImageOpacity : 100}%
            </span>
          </div>
        </div>
      </div>

      <BlockLayerEditor pageIndex={pageIndex} blocks={page.blocks || []} />
    </div>
  );
}
