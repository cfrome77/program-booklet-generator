import React from 'react';
import { Eye, Square, Shield, Columns, Expand, Grid, Ruler, ZoomIn } from 'lucide-react';
import { useBooklet } from '../context/BookletContext.jsx';

export default function GuideTogglesToolbar() {
  const { guides, toggleGuide, zoomLevel, setZoomLevel } = useBooklet();

  const zoomOptions = [
    { value: 'fit-page', label: 'Fit Page' },
    { value: 'fit-width', label: 'Fit Width' },
    { value: '50%', label: '50%' },
    { value: '75%', label: '75%' },
    { value: '100%', label: '100%' },
    { value: '125%', label: '125%' },
    { value: '150%', label: '150%' }
  ];

  const toggleItems = [
    {
      key: 'showRulers',
      label: 'Rulers',
      icon: Ruler,
      title: 'Physical Inch Rulers (Top and Left rulers with fractional divisions)'
    },
    {
      key: 'showPageBoundary',
      label: 'Boundary',
      icon: Square,
      title: 'Page Boundary (5.5 × 8.5 in physical page edge)'
    },
    {
      key: 'showSafeArea',
      label: 'Safe Area',
      icon: Shield,
      title: 'Safe Area (0.4 in printable safety margin)'
    },
    {
      key: 'showCenterFold',
      label: 'Center Fold',
      icon: Columns,
      title: 'Center Fold / Spine Guide'
    },
    {
      key: 'showBleed',
      label: 'Bleed (0.125")',
      icon: Expand,
      title: 'Optional Bleed Zone (0.125 in outer margin)'
    },
    {
      key: 'showGrid',
      label: 'Grid',
      icon: Grid,
      title: 'Optional Alignment Grid Mesh'
    }
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 bg-[#181820] border border-[#3f3f4e] px-2.5 py-1.5 rounded-lg text-xs">
      {/* Zoom Selector */}
      <div className="flex items-center gap-1 pr-2 border-r border-[#3a3a46]">
        <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 mr-0.5">Zoom:</span>
        <select
          value={zoomLevel}
          onChange={(e) => setZoomLevel(e.target.value)}
          className="bg-[#282830] text-amber-300 font-mono font-bold border border-[#444] rounded text-[11px] px-1.5 py-0.5 focus:outline-none focus:border-[#005f73] cursor-pointer"
        >
          {zoomOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1 pr-1.5 border-r border-[#3a3a46]">
        <Eye className="w-3.5 h-3.5 text-cyan-400" /> Guides:
      </span>
      {toggleItems.map((item) => {
        const Icon = item.icon;
        const isActive = guides?.[item.key];
        return (
          <button
            key={item.key}
            onClick={() => toggleGuide(item.key)}
            className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
              isActive
                ? 'bg-[#005f73] text-white border border-[#70c0d0] shadow-sm'
                : 'bg-[#282830] text-gray-400 hover:text-white border border-transparent hover:border-[#444]'
            }`}
            title={item.title}
          >
            <Icon className={`w-3 h-3 ${isActive ? 'text-amber-300' : 'text-gray-400'}`} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
