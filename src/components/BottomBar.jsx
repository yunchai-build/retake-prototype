import React from 'react';

export default function BottomBar({
  visible,
  out,
  frameName,
  galleryInputRef,
  onGalleryChange,
  onGalleryClick,
  onEditName,
  onProceed,
}) {
  return (
    <>
      <input type="file" id="galleryInput" ref={galleryInputRef} accept="image/*"
        style={{ display: 'none' }} onChange={onGalleryChange} />
      <div className={`s6-bottom-bar${visible ? ' visible' : ''}${out ? ' out' : ''}`} id="s6BottomBar">
        <button className="s6-circle-btn" id="btnGallery" aria-label="Change photo"
          onClick={onGalleryClick}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <defs><clipPath id="bbGalleryClip"><rect x="3" y="4" width="18" height="16" rx="2" /></clipPath></defs>
            <g clipPath="url(#bbGalleryClip)" fill="rgba(255,255,255,0.9)">
              <circle cx="8.5" cy="9" r="1.8" />
              <path d="M3 20 L9 13 L12 16.5 L15.5 12 L21 20 Z" />
            </g>
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" fill="none" />
          </svg>
        </button>

        <button
          type="button"
          className="s6-frame-title-btn"
          id="frameNameDisplay"
          aria-label="Name your frame"
          onClick={onEditName}
        >
          <span className="s6-frame-title-text">{frameName}</span>
        </button>

        <button className="s6-send-btn" id="btnProceed" aria-label="Proceed" onClick={onProceed}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </>
  );
}
