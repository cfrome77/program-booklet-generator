import React from 'react';
import { useBooklet } from '../context/BookletContext.jsx';
import { isLeftPage } from '../utils/imposition.js';

export default function PageRenderer({ page, pageNum }) {
  const { theme } = useBooklet();

  if (!page) {
    return (
      <div className="booklet-page flex items-center justify-center text-gray-400 italic text-xs">
        [ Empty Page ]
      </div>
    );
  }

  const isLeft = pageNum ? isLeftPage(pageNum) : true;
  const bgImgUrl = page.bgImage || theme.bgImage;
  const bgStyle = bgImgUrl ? { backgroundImage: `url('${bgImgUrl}')` } : {};
  const alignClass = page.vAlign ? `align-${page.vAlign}` : '';

  const renderBottomBanner = () => {
    if (!page.bottomBannerText || page.bottomBannerStyle === 'none') return null;
    const style = page.bottomBannerStyle || 'torn';
    let className = 'bottom-banner-torn';
    if (style === 'gold') className = 'bottom-banner-gold';
    if (style === 'simple') className = 'bottom-banner-simple';

    return <div className={className}>{page.bottomBannerText}</div>;
  };

  const renderContentBlocks = (blocks) => {
    if (!blocks || blocks.length === 0) return null;
    return (
      <div className="space-y-1 mt-1">
        {blocks.map((b, idx) => {
          if (b.type === 'heading') {
            return (
              <h4
                key={b.id || idx}
                style={{ fontFamily: 'var(--font-title)', color: 'var(--navy-dark)' }}
                className="text-xs font-bold mt-1.5"
              >
                {b.text || ''}
              </h4>
            );
          }
          if (b.type === 'paragraph') {
            return (
              <p
                key={b.id || idx}
                style={{ color: 'var(--charcoal)' }}
                className="text-[0.7rem] leading-relaxed"
              >
                {b.text || ''}
              </p>
            );
          }
          if (b.type === 'image') {
            return b.url ? (
              <img
                key={b.id || idx}
                src={b.url}
                alt="Block Content"
                className="image-block"
              />
            ) : null;
          }
          if (b.type === 'divider') {
            return (
              <hr
                key={b.id || idx}
                style={{ borderColor: 'var(--teal-accent)' }}
                className="my-1 border-t"
              />
            );
          }
          return null;
        })}
      </div>
    );
  };

  const pageType = page.type || 'custom';

  let contentHTML = null;

  if (pageType === 'cover') {
    const titleGroup = (
      <div className={page.scrollworkFrame !== false ? 'scrollwork-frame' : ''}>
        <div className="scroll-title-group">
          <h2>{page.title || ''}</h2>
          <h3>{page.subtitle || ''}</h3>
          <p>{page.dateLocation || ''}</p>
        </div>
      </div>
    );

    contentHTML = (
      <>
        <div
          className="top-banner-bar"
          style={{ background: page.topBarColor || theme.tealAccent || 'var(--teal-accent)' }}
        />
        <div className="patch-emblem-box">
          {page.emblemImg ? (
            <img src={page.emblemImg} alt="Emblem" />
          ) : (
            <span
              style={{ color: 'var(--navy-dark)' }}
              className="font-bold text-[0.7rem] text-center"
            >
              {page.emblemText || '[ Emblem ]'}
            </span>
          )}
        </div>
        {titleGroup}
        <div
          style={{ color: 'var(--charcoal)' }}
          className="text-[0.78rem] italic font-semibold text-center"
        >
          {page.tagline || ''}
        </div>
        {renderContentBlocks(page.blocks)}
        {renderBottomBanner()}
      </>
    );

    return (
      <div
        className={`booklet-page cover-page ${alignClass}`}
        style={bgStyle}
      >
        {contentHTML}
        {pageNum && (
          <span className={`page-number-tag ${isLeft ? 'left' : 'right'}`}>
            Page {pageNum}
          </span>
        )}
      </div>
    );
  }

  if (pageType === 'backCover') {
    const sponsorsList = page.sponsors || [];
    contentHTML = (
      <>
        <div
          style={{ fontFamily: 'var(--font-title)', color: 'var(--navy-dark)' }}
          className="text-[1.1rem] font-bold text-center"
        >
          {page.organization || ''}
        </div>
        <div
          style={{ color: 'var(--teal-accent)' }}
          className="text-[0.76rem] font-semibold my-1 text-center"
        >
          {page.subOrganization || ''}
        </div>
        <div className="w-[70px] h-[70px] bg-white border border-gray-300 flex items-center justify-center text-[0.58rem] text-gray-500 my-2 mx-auto overflow-hidden">
          {page.qrImg ? (
            <img src={page.qrImg} alt="QR Code" className="w-full h-full object-cover" />
          ) : (
            '[ QR CODE ]'
          )}
        </div>
        <div className="text-[0.7rem] text-gray-600 mb-2.5 text-center">
          {page.qrText || ''}
        </div>
        {sponsorsList.length > 0 && (
          <div className="w-full">
            <div
              style={{ color: 'var(--navy-dark)' }}
              className="text-[0.72rem] font-bold mb-1 text-center"
            >
              {page.sponsorsText || 'Sponsors:'}
            </div>
            <div className="sponsors-grid">
              {sponsorsList.map((s, idx) => (
                <div key={idx} className="sponsor-item">
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}
        {renderContentBlocks(page.blocks)}
        {renderBottomBanner()}
      </>
    );

    return (
      <div
        className={`booklet-page cover-page ${alignClass}`}
        style={{ justifyContent: 'center', textAlign: 'center', ...bgStyle }}
      >
        {contentHTML}
        {pageNum && (
          <span className={`page-number-tag ${isLeft ? 'left' : 'right'}`}>
            Page {pageNum}
          </span>
        )}
      </div>
    );
  }

  if (pageType === 'schedule') {
    const items = page.items || [];
    contentHTML = (
      <div>
        <div className="page-title">{page.title || 'Schedule'}</div>
        <div className="schedule-list">
          {items.map((item, idx) => (
            <div key={idx} className="schedule-row">
              <div className="schedule-time">{item.time}</div>
              <div className="schedule-details">
                <h4>{item.title}</h4>
                <p>{item.details}</p>
              </div>
            </div>
          ))}
        </div>
        {renderContentBlocks(page.blocks)}
      </div>
    );
  } else if (pageType === 'leadership') {
    const leaders = page.leaders || [];
    contentHTML = (
      <div>
        <div className="page-title">{page.title || 'Leadership'}</div>
        <div className="page-content-area">
          {leaders.map((l, idx) => (
            <div key={idx} className="leader-container">
              <div className="leader-photo">
                {l.img ? <img src={l.img} alt={l.title} /> : '[ Photo ]'}
              </div>
              <div className="leader-content">
                <h4>{l.title}</h4>
                <div className="leader-role">{l.role}</div>
                <p>{l.text}</p>
              </div>
            </div>
          ))}
          {renderContentBlocks(page.blocks)}
        </div>
      </div>
    );
  } else if (pageType === 'keynote') {
    contentHTML = (
      <div>
        <div className="page-title">{page.title || 'Keynote Speaker'}</div>
        <div className="page-content-area">
          <div className="leader-container">
            <div className="speaker-photo">
              {page.speakerImg ? (
                <img src={page.speakerImg} alt={page.speakerName} />
              ) : (
                '[ Speaker ]'
              )}
            </div>
            <div>
              <h4
                style={{ fontFamily: 'var(--font-title)', color: 'var(--navy-dark)' }}
                className="text-[0.82rem] font-bold"
              >
                {page.speakerName || ''}
              </h4>
              <p
                style={{ color: 'var(--teal-accent)' }}
                className="text-[0.68rem] font-semibold mb-1"
              >
                {page.speakerRole || ''}
              </p>
              <p
                style={{ color: 'var(--charcoal)' }}
                className="text-[0.68rem] leading-relaxed"
              >
                {page.bioText || ''}
              </p>
            </div>
          </div>
          {renderContentBlocks(page.blocks)}
        </div>
      </div>
    );
  } else if (pageType === 'awards') {
    const awards = page.awards || [];
    const featured = page.featuredAwards || [];
    contentHTML = (
      <div>
        <div className="page-title">{page.title || 'Awards'}</div>
        <div className="award-grid-compact">
          {awards.map((a, idx) => (
            <div key={idx} className="award-card-compact">
              <h4>{a.name}</h4>
              <p>{a.desc}</p>
            </div>
          ))}
          {featured.map((f, idx) => (
            <div key={idx} className="award-card-featured">
              <div className="award-medallion-placeholder">
                {f.medallionImg ? (
                  <img src={f.medallionImg} alt={f.name} />
                ) : (
                  f.medallion || '[Medallion]'
                )}
              </div>
              <div>
                <h4>{f.name}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        {renderContentBlocks(page.blocks)}
      </div>
    );
  } else if (pageType === 'vigilIntro') {
    contentHTML = (
      <div>
        <div className="page-title">{page.title || 'Vigil Honor'}</div>
        <div className="award-card-compact mb-2.5">
          <h4>The Highest Brotherhood</h4>
          <p>
            Recognizing Arrowmen inducted into the highest brotherhood of unselfish service across our lodge's history.
          </p>
        </div>
        <div className="border border-[#c8bda8] bg-[#fbf8f0] p-2.5 text-center">
          <div
            style={{ fontFamily: 'var(--font-title)', color: 'var(--navy-dark)' }}
            className="text-[10pt] font-bold uppercase"
          >
            {page.honoreeName || 'Class Honoree'}
          </div>
          <div className="w-[1in] h-[1in] my-1.5 mx-auto border border-gray-400 bg-white flex items-center justify-center text-[7pt] text-gray-500 overflow-hidden">
            {page.honoreePhoto ? (
              <img
                src={page.honoreePhoto}
                alt="Honoree"
                className="w-full h-full object-cover"
              />
            ) : (
              'PHOTO'
            )}
          </div>
          <div
            style={{ fontFamily: 'var(--font-title)', color: 'var(--navy-dark)' }}
            className="text-[12pt] font-bold"
          >
            {page.honoreeTitle || ''}
          </div>
          <div className="text-[8pt] leading-normal text-gray-600 mt-1">
            {page.honoreeBio || ''}
          </div>
        </div>
        {renderContentBlocks(page.blocks)}
      </div>
    );
  } else if (pageType === 'roster') {
    const members = page.members || [];
    contentHTML = (
      <div>
        <div className="page-title">{page.title || 'Roster'}</div>
        <div className="vigil-grid">
          {members.map((m, idx) => (
            <div key={idx} className="vigil-card">
              <div className="vigil-photo">
                {m.photo ? (
                  <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  'PHOTO'
                )}
              </div>
              <div className="vigil-name">{m.name}</div>
              <div className="vigil-totem">{m.totem || ''}</div>
            </div>
          ))}
        </div>
        {renderContentBlocks(page.blocks)}
      </div>
    );
  } else {
    // Custom / Default HTML
    contentHTML = (
      <div>
        <div className="page-title">{page.title || ''}</div>
        <div
          className="page-content-area text-[0.75rem] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: page.content || '' }}
        />
        {renderContentBlocks(page.blocks)}
      </div>
    );
  }

  return (
    <div className={`booklet-page ${alignClass}`} style={bgStyle}>
      {contentHTML}
      {pageNum && (
        <span className={`page-number-tag ${isLeft ? 'left' : 'right'}`}>
          Page {pageNum}
        </span>
      )}
    </div>
  );
}
