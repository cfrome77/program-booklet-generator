import React from 'react';

export default function PageBackground({ bgImgUrl, opacityVal }) {
  if (!bgImgUrl) return null;
  return (
    <div
      className="page-bg-layer"
      style={{
        backgroundImage: `url('${bgImgUrl}')`,
        opacity: opacityVal
      }}
    />
  );
}
