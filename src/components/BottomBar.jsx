import React from 'react';

export default function BottomBar({
  visible,
  out,
  frameName,
  galleryInputRef,
  onGalleryChange,
  onGalleryClick,
  onEditName,
  onCopyLink,
  onShare,
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

        <button className="s6-frame-title-btn" id="btnFrameName" aria-label="Edit frame name"
          onClick={onEditName}>
          <span id="frameNameDisplay">{frameName}</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, marginLeft: 5 }}>
            <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        </button>

        <button className="s6-circle-btn" id="btnCopyLink" aria-label="Copy invite link"
          onClick={onCopyLink}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        </button>

        <button className="s6-send-btn" id="btnShare" aria-label="Share" onClick={onShare}>
          <span className="s6-send-label">SEND</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <polygon points="22 2 15 22 11 13 2 9 22 2" fill="#1A1A2E" />
          </svg>
        </button>
      </div>
    </>
  );
}
