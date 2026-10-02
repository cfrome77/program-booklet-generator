import React from 'react';
import { useBooklet } from '../context/BookletContext.jsx';

export default function ThemeEditor() {
  const { theme, updateThemeField } = useBooklet();

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result;
        if (typeof dataUrl === 'string') {
          updateThemeField('bgImage', dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-300 mb-1">Global Background Image / Pattern URL</label>
        <input
          type="text"
          value={theme.bgImage || ''}
          placeholder="https://... or upload file"
          onChange={(e) => updateThemeField('bgImage', e.target.value)}
          className="w-full bg-[#1e1e24] border border-[#444] text-white text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-[#005f73]"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="mt-1 text-[11px] text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#3a3a42] file:text-white hover:file:bg-[#4a4a54] cursor-pointer"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-300 mb-1">Color Theme</label>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={theme.bgCream || '#f4eedb'}
              onChange={(e) => updateThemeField('bgCream', e.target.value)}
              className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
              title="Page Background"
            />
            <span className="text-[11px] text-gray-300">Page BG</span>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={theme.navyDark || '#122230'}
              onChange={(e) => updateThemeField('navyDark', e.target.value)}
              className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
              title="Primary Color"
            />
            <span className="text-[11px] text-gray-300">Primary</span>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={theme.tealAccent || '#005f73'}
              onChange={(e) => updateThemeField('tealAccent', e.target.value)}
              className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
              title="Accent Color"
            />
            <span className="text-[11px] text-gray-300">Accent</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-300 mb-1">Title Font Style</label>
        <select
          value={theme.titleFont || "'Cinzel', serif"}
          onChange={(e) => updateThemeField('titleFont', e.target.value)}
          className="w-full bg-[#1e1e24] border border-[#444] text-white text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-[#005f73]"
        >
          <option value="'Cinzel', serif">Cinzel (Classic / Serpentine)</option>
          <option value="'Merriweather', serif">Merriweather (Traditional Serif)</option>
          <option value="'Open Sans', sans-serif">Open Sans (Modern Clean)</option>
          <option value="'Roboto', sans-serif">Roboto (Bold Contemporary)</option>
        </select>
      </div>
    </div>
  );
}
