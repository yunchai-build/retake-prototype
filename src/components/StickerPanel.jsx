import React from 'react';

const SP_TABS = [
  {
    tab: 'recents', label: 'Recents',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" />
      </svg>
    ),
  },
  {
    tab: 'mystickers', label: 'My Stickers',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.85 0 3-.5 3-.5v-3.5s-1 .5-3 .5c-3.58 0-6.5-2.92-6.5-6.5S8.42 5.5 12 5.5c2.38 0 4.47 1.28 5.62 3.19" />
        <path d="M19 3v6h-6" />
      </svg>
    ),
  },
  {
    tab: 'emoji', label: 'Emoji',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
  },
];

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 22 22" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
    <line x1="4" y1="4" x2="18" y2="18" /><line x1="18" y1="4" x2="4" y2="18" />
  </svg>
);

/**
 * StickerPanel — renders the sticker picker sheet, new-sticker screen,
 * the sticker overlay div, and the hidden file input.
 *
 * Pass the full return value of `useStickerSystem()` as the `sys` prop.
 */
export default function StickerPanel({ sys }) {
  const {
    stickerPanelVisible,
    newStickerVisible,
    stickerTab,
    stickerLibrary,
    spGridRef,
    spEmojiGridRef,
    nsPreviewRef,
    stickerPhotoInputRef,
    stickerOverlayRef,
    closePanel,
    handleTabClick,
    handleStickerPhotoChange,
    closeNewStickerScreen,
    handleNewStickerAdd,
  } = sys;

  return (
    <>
      {/* ── Sticker picker panel (bottom sheet) ── */}
      <div className={`sticker-panel${stickerPanelVisible ? ' sp-visible' : ''}`} id="stickerPanel">
        <div className="sp-header">
          <p className="sp-title">Stickers</p>
          <button className="sp-close" id="btnStickerPanelClose" aria-label="Close" onClick={closePanel}>
            <CloseIcon />
          </button>
        </div>

        <div className="sp-tabs">
          {SP_TABS.map(({ tab, label, icon }) => (
            <button
              key={tab}
              className={`sp-tab${stickerTab === tab ? ' active' : ''}`}
              data-sptab={tab}
              aria-label={label}
              onClick={() => handleTabClick(tab)}
            >
              {icon}
            </button>
          ))}
        </div>

        <div className="sp-content">
          {/* Empty state — shown when not on emoji tab and library is empty */}
          <div
            className="sp-empty"
            id="spEmpty"
            style={{ display: stickerTab !== 'emoji' && stickerLibrary.length === 0 ? 'flex' : 'none' }}
          >
            <div className="sp-empty-blob">✦</div>
            <p className="sp-empty-title">Turn any photo into a sticker.</p>
            <p className="sp-empty-sub">Or paste one you copied — here, or right on the canvas.</p>
            <button
              className="sp-get-started"
              id="btnStickerGetStarted"
              onClick={() => stickerPhotoInputRef.current && stickerPhotoInputRef.current.click()}
            >
              Get Started
            </button>
          </div>

          {/* Library grid (recents / my stickers) — display managed imperatively by renderStickerContent */}
          <div className="sp-grid" id="spGrid" ref={spGridRef}></div>
          {/* Emoji grid — display managed imperatively by renderStickerContent */}
          <div className="sp-emoji-grid" id="spEmojiGrid" ref={spEmojiGridRef}></div>
        </div>
      </div>

      {/* ── New sticker screen ── */}
      <div className={`new-sticker-screen${newStickerVisible ? ' ns-visible' : ''}`} id="newStickerScreen">
        <div className="ns-header">
          <button className="sp-close" id="btnNewStickerBack" aria-label="Back" onClick={closeNewStickerScreen}>
            <CloseIcon />
          </button>
          <p className="ns-title">New Sticker</p>
          <div style={{ width: '34px' }}></div>
        </div>
        <div className="ns-preview" id="nsPreview" ref={nsPreviewRef}></div>
        <div className="ns-actions">
          <button className="ns-btn" id="btnNewStickerCancel" aria-label="Cancel" onClick={closeNewStickerScreen}>
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round">
              <line x1="4" y1="4" x2="18" y2="18" /><line x1="18" y1="4" x2="4" y2="18" />
            </svg>
          </button>
          <button className="ns-btn" id="btnNewStickerAdd" aria-label="Add sticker" onClick={handleNewStickerAdd}>
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round">
              <line x1="11" y1="3" x2="11" y2="19" /><line x1="3" y1="11" x2="19" y2="11" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Sticker overlay (DOM container for placed stickers) ── */}
      <div id="stickerOverlay" ref={stickerOverlayRef}></div>

      {/* ── Hidden file input for sticker photos ── */}
      <input
        type="file"
        id="stickerPhotoInput"
        ref={stickerPhotoInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleStickerPhotoChange}
      />
    </>
  );
}
