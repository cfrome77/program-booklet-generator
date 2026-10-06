import React from 'react';
import { useBooklet } from '../context/BookletContext.jsx';
import AssetPicker from './AssetPicker.jsx';

export default function ThemeEditor() {
  const { theme, updateThemeField } = useBooklet();

  return (
    <div className="space-y-3">
      <div>
        <AssetPicker
          value={theme.bgImage || ''}
          onChange={(val) => updateThemeField('bgImage', val)}
          label="Global Background Image / Pattern Asset"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <label className="text-[11px] text-gray-300 font-semibold">Background Opacity</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              value={theme.bgImageOpacity !== undefined ? theme.bgImageOpacity : 100}
              onChange={(e) => updateThemeField('bgImageOpacity', Number(e.target.value), true)}
              className="w-24 accent-[#005f73]"
            />
            <span className="text-[11px] text-gray-300 min-w-[32px] text-right">
              {theme.bgImageOpacity !== undefined ? theme.bgImageOpacity : 100}%
            </span>
          </div>
        </div>
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
