import React from 'react';

export default function VerticalToolbar({
  visible,
  out,
  collapsed,
  labelsExpanded,
  activeTool,
  orderedToolIds,
  onToolText,
  onToolStickers,
  onToolGallery,
  onToolDoodle,
  onToolEraser,
  onToolDownload,
  onToggle,
  onToolMouseEnter,
  onToolMouseLeave,
}) {
  return (
    <div
      className={`s6-tools${visible ? ' visible' : ''}${out ? ' out' : ''}${collapsed ? ' tools-collapsed' : ''}${labelsExpanded ? ' labels-expanded' : ''}`}
      id="s6Tools"
    >
      {orderedToolIds.map((toolId, index) => {
        const hidden = collapsed && index >= 3;
        const cls = `s6-tool-btn${hidden ? ' btn-hidden' : ''}`;
        switch (toolId) {
          case 'text': return (
            <button key="text" className={`${cls}${activeTool === 'text' ? ' active' : ''}`}
              id="btnToolText" aria-label="Text"
              onClick={onToolText}
              onMouseEnter={onToolMouseEnter} onMouseLeave={onToolMouseLeave}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="5" x2="20" y2="5" />
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="9" y1="19" x2="15" y2="19" />
              </svg>
              <span className="tool-label">Text</span>
            </button>
          );
          case 'stickers': return (
            <button key="stickers" className={cls} id="btnToolStickers" aria-label="Stickers"
              onClick={onToolStickers}
              onMouseEnter={onToolMouseEnter} onMouseLeave={onToolMouseLeave}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <defs>
                  <mask id="smileyMask">
                    <rect width="24" height="24" fill="white" />
                    <circle cx="10" cy="10" r="1.5" fill="black" />
                    <circle cx="16" cy="10" r="1.5" fill="black" />
                    <path d="M9 14.5 Q13 18 17 14.5" stroke="black" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </mask>
                </defs>
                <circle cx="13" cy="13" r="9.5" fill="white" mask="url(#smileyMask)" />
              </svg>
              <span className="tool-label">Stickers</span>
            </button>
          );
          case 'gallery': return (
            <button key="gallery" className={cls} id="btnToolGallery" aria-label="Photo"
              onClick={onToolGallery}
              onMouseEnter={onToolMouseEnter} onMouseLeave={onToolMouseLeave}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <defs><clipPath id="photoClip"><rect x="3" y="4" width="18" height="16" rx="2" /></clipPath></defs>
                <g clipPath="url(#photoClip)" fill="white">
                  <circle cx="8.5" cy="9" r="1.8" />
                  <path d="M3 20 L9 13 L12 16.5 L15.5 12 L21 20 Z" />
                </g>
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="white" strokeWidth="1.5" fill="none" />
              </svg>
              <span className="tool-label">Photo</span>
            </button>
          );
          case 'doodle': return (
            <button key="doodle" className={`${cls}${activeTool === 'doodle' ? ' active' : ''}`}
              id="btnToolDoodle" aria-label="Draw"
              onClick={onToolDoodle}
              onMouseEnter={onToolMouseEnter} onMouseLeave={onToolMouseLeave}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                <line x1="15" y1="5" x2="19" y2="9" />
              </svg>
              <span className="tool-label">Draw</span>
            </button>
          );
          case 'eraser': return (
            <button key="eraser" className={`${cls}${activeTool === 'eraser' ? ' active' : ''}`}
              id="btnToolEraser" aria-label="Eraser"
              onClick={onToolEraser}
              onMouseEnter={onToolMouseEnter} onMouseLeave={onToolMouseLeave}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <defs><clipPath id="circleClip"><circle cx="12" cy="12" r="10" /></clipPath></defs>
                <rect x="2" y="2" width="5" height="5" fill="#c0c0c0" clipPath="url(#circleClip)" />
                <rect x="7" y="2" width="5" height="5" fill="white" clipPath="url(#circleClip)" />
                <rect x="12" y="2" width="5" height="5" fill="#c0c0c0" clipPath="url(#circleClip)" />
                <rect x="17" y="2" width="5" height="5" fill="white" clipPath="url(#circleClip)" />
                <rect x="2" y="7" width="5" height="5" fill="white" clipPath="url(#circleClip)" />
                <rect x="7" y="7" width="5" height="5" fill="#c0c0c0" clipPath="url(#circleClip)" />
                <rect x="12" y="7" width="5" height="5" fill="white" clipPath="url(#circleClip)" />
                <rect x="17" y="7" width="5" height="5" fill="#c0c0c0" clipPath="url(#circleClip)" />
                <rect x="2" y="12" width="5" height="5" fill="#c0c0c0" clipPath="url(#circleClip)" />
                <rect x="7" y="12" width="5" height="5" fill="white" clipPath="url(#circleClip)" />
                <rect x="12" y="12" width="5" height="5" fill="#c0c0c0" clipPath="url(#circleClip)" />
                <rect x="17" y="12" width="5" height="5" fill="white" clipPath="url(#circleClip)" />
                <rect x="2" y="17" width="5" height="5" fill="white" clipPath="url(#circleClip)" />
                <rect x="7" y="17" width="5" height="5" fill="#c0c0c0" clipPath="url(#circleClip)" />
                <rect x="12" y="17" width="5" height="5" fill="white" clipPath="url(#circleClip)" />
                <rect x="17" y="17" width="5" height="5" fill="#c0c0c0" clipPath="url(#circleClip)" />
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
              </svg>
              <span className="tool-label">Eraser</span>
            </button>
          );
          case 'download': return (
            <button key="download" className={cls} id="btnToolDownload" aria-label="Download"
              onClick={onToolDownload}
              onMouseEnter={onToolMouseEnter} onMouseLeave={onToolMouseLeave}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v11" />
                <polyline points="8 10 12 14 16 10" />
                <line x1="5" y1="19" x2="19" y2="19" />
              </svg>
              <span className="tool-label">Save</span>
            </button>
          );
          default: return null;
        }
      })}

      <button className="s6-tools-chevron" aria-label="Toggle toolbar" onClick={onToggle}>
        <svg width="14" height="8" viewBox="0 0 14 8" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 1 7 7 13 1" />
        </svg>
      </button>
    </div>
  );
}
