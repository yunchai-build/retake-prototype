import React, { useCallback } from 'react';

const SP_TABS = [
  {
    tab: 'recents', label: 'Recents',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 15" />
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
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
  },
];

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 22 22" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
    <line x1="4" y1="4" x2="18" y2="18" />
    <line x1="18" y1="4" x2="4" y2="18" />
  </svg>
);

export default function StickerPanel({ sys }) {
  const {
    stickerPanelVisible,
    newStickerVisible,
    stickerTab,
    stickerLibrary,
    spGridRef,
    spEmojiWrapRef,
    spEmojiGridRef,
    spEmojiCatsRef,
    spEmojiSearchRef,
    nsImageCanvasRef,
    nsMaskCanvasRef,
    nsLassoCanvasRef,
    nsLoadingRef,
    nsBarLassoRef,
    nsBarRefineRef,
    nsBtnConfirmRef,
    nsBtnRefineBackRef,
    nsBrushPanelRef,
    nsTrackTopRef,
    nsTrackBottomRef,
    nsBrushHandleRef,
    nsHeaderRef,
    nsOpacitySliderRef,
    nsOpacityValRef,
    nsRefModeRef,
    stickerPhotoInputRef,
    stickerOverlayRef,
    stkTrashBinRef,
    closePanel,
    handleTabClick,
    handleStickerPhotoChange,
    closeNewStickerScreen,
    nsConfirmLasso,
    nsBackToLasso,
    nsApply,
  } = sys;

  const handleNsOpacity = useCallback((e) => {
    const val = +e.target.value;
    if (sys.nsOpacityRef) sys.nsOpacityRef.current = val;
    if (nsOpacityValRef?.current) nsOpacityValRef.current.textContent = val + '%';
    if (nsMaskCanvasRef?.current) nsMaskCanvasRef.current.style.opacity = String(val / 100);
  }, [sys.nsOpacityRef, nsOpacityValRef, nsMaskCanvasRef]);

  const handleMarkClick = useCallback(() => {
    if (sys.nsRefModeRef) sys.nsRefModeRef.current = 'pen';
    document.getElementById('btnNsMark')?.classList.add('on');
    document.getElementById('btnNsClear')?.classList.remove('on');
  }, [sys.nsRefModeRef]);

  const handleClearClick = useCallback(() => {
    if (sys.nsRefModeRef) sys.nsRefModeRef.current = 'erase';
    document.getElementById('btnNsClear')?.classList.add('on');
    document.getElementById('btnNsMark')?.classList.remove('on');
  }, [sys.nsRefModeRef]);

  return (
    <>
      {/* Sticker Panel */}
      <div className={`sticker-panel${stickerPanelVisible ? ' sp-visible' : ''}`} id="stickerPanel">
        <div className="sp-header">
          <p className="sp-title">Stickers</p>
          <button className="sp-close" onClick={closePanel}>
            <CloseIcon />
          </button>
        </div>

        <div className="sp-tabs">
          {SP_TABS.map(({ tab, label, icon }) => (
            <button
              key={tab}
              className={`sp-tab${stickerTab === tab ? ' active' : ''}`}
              onClick={() => handleTabClick(tab)}
              aria-label={label}
            >
              {icon}
            </button>
          ))}
        </div>

        <div className="sp-content">
          {/* Empty */}
          <div
            className="sp-empty"
            style={{ display: stickerTab !== 'emoji' && stickerLibrary.length === 0 ? 'flex' : 'none' }}
          >
            <div className="sp-empty-blob">✦</div>
            <p className="sp-empty-title">Turn any photo into a sticker.</p>
            <p className="sp-empty-sub">Or paste one you copied.</p>
            <button onClick={() => stickerPhotoInputRef.current?.click()}>
              Get Started
            </button>
          </div>

          {/* Grid */}
          <div
            className="sp-grid"
            ref={spGridRef}
            style={{ display: stickerTab !== 'emoji' && stickerLibrary.length > 0 ? 'grid' : 'none' }}
          />

          {/* Emoji */}
          <div
            className="sp-emoji-wrap"
            ref={spEmojiWrapRef}
            style={{ display: stickerTab === 'emoji' ? 'flex' : 'none' }}
          >
            <div className="sp-emoji-sticky">
              <input
                ref={spEmojiSearchRef}
                className="sp-emoji-search"
                type="text"
                placeholder="Search emoji..."
              />
            </div>
            <div ref={spEmojiCatsRef} className="sp-emoji-cats" />
            <div ref={spEmojiGridRef} className="sp-emoji-grid" />
          </div>
        </div>
      </div>

      {/* New Sticker Screen */}
      <div className={`new-sticker-screen${newStickerVisible ? ' ns-visible' : ''}`}>
        <div className="ns-header" ref={nsHeaderRef}>
          <button onClick={() => closeNewStickerScreen(true)}>
            <CloseIcon />
          </button>
          <p>New Sticker</p>
        </div>

        <div className="ns-preview-wrap">
          <div ref={nsLoadingRef}>Detecting…</div>
          <canvas ref={nsImageCanvasRef} />
          <canvas ref={nsMaskCanvasRef} />
          <canvas ref={nsLassoCanvasRef} />
        </div>

        <div ref={nsBarLassoRef}>
          <button onClick={nsConfirmLasso}>Confirm</button>
        </div>

        <div ref={nsBarRefineRef}>
          <button onClick={nsApply}>Add Sticker</button>
        </div>
      </div>

      {/* Overlay */}
      <div id="stickerOverlay" ref={stickerOverlayRef}>
        <div id="stkTrashBin" ref={stkTrashBinRef}>🗑</div>
      </div>

      {/* File input */}
      <input
        type="file"
        ref={stickerPhotoInputRef}
        onChange={handleStickerPhotoChange}
        style={{ display: 'none' }}
      />
    </>
  );
}
