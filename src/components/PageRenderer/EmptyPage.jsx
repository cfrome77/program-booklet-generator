import React from 'react';
import PageGuides from './PageGuides.jsx';

export default function EmptyPage({ guides, isLeft }) {
  return (
    <div className="booklet-page flex items-center justify-center text-gray-400 italic text-xs relative">
      <PageGuides guides={guides} isLeft={isLeft} />
      <span>[ Empty Page ]</span>
    </div>
  );
}
