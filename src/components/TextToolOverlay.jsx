import React, { useEffect, useRef, useCallback } from 'react';
import { TXT_FONTS, TXT_PALETTE } from '../hooks/useTextTool';

export default function TextToolOverlay({
  active,
  textPreviewRef,
  txtFont, setTxtFont,
  txtColor, setTxtColor,
  txtSize, setTxtSize,
  txtAlign, setTxtAlign,
  onConfirm,
}) {
  const sizeSliderRef = useRef(null);

  // Apply live font/color/size/align to preview element
  useEffect(() => {
    if (!textPreviewRef.current) return;
    const f = TXT_FONTS[txtFont];
    const p = textPreviewRef.current;
    p.style.fontFamily = f.family;
    p.style.fontWeight = f.weight;
    p.style.fontStyle  = f.style;
    p.style.fontSize   = txtSize + 'px';
    p.style.color      = txtColor;
    p.style.textAlign  = txtAlign;
  }, [textPreviewRef, txtFont, txtSize, txtColor, txtAlign]);

  // Sync size slider gradient fill
  useEffect(() => {
    if (sizeSliderRef.current) {
      const pct = ((txtSize - 18) / (96 - 18) * 100).toFixed(1) + '%';
      sizeSliderRef.current.style.setProperty('--fill', pct);
    }
  }, [txtSize]);

  const handleOverlayPointerDown = useCallback((e) => {
    if (e.target === e.currentTarget) onConfirm();
  }, [onConfirm]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onConfirm();
    }
  }, [onConfirm]);

  return (
    <>
      <div
        className={`text-tool-overlay${active ? ' txt-active' : ''}`}
        onPointerDown={handleOverlayPointerDown}
      >
        <div
          ref={textPreviewRef}
          className="text-preview"
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          data-placeholder="Type something…"
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className={`tm-text-bar${active ? ' txt-active' : ''}`}>
        {/* Row 1: font chips + size slider */}
        <div className="txt-row">
          <div className="txt-fonts">
            <button
              className={`txt-font-btn${txtFont === 'mono' ? ' active' : ''}`}
              style={{ fontFamily: "'Bedstead', monospace", letterSpacing: '0.02em' }}
              onClick={() => { setTxtFont('mono'); textPreviewRef.current?.focus(); }}
            >Aa</button>
            <button
              className={`txt-font-btn${txtFont === 'bold' ? ' active' : ''}`}
              style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontWeight: 900, letterSpacing: '-0.01em' }}
              onClick={() => { setTxtFont('bold'); textPreviewRef.current?.focus(); }}
            >B</button>
            <button
              className={`txt-font-btn${txtFont === 'serif' ? ' active' : ''}`}
              style={{ fontFamily: "Georgia,serif", fontStyle: 'italic' }}
              onClick={() => { setTxtFont('serif'); textPreviewRef.current?.focus(); }}
            >S</button>
          </div>
          <div className="tm-divider" />
          <span className="txt-size-lbl">Size</span>
          <input
            ref={sizeSliderRef}
            type="range"
            id="txtSizeSlider"
            min="18" max="96"
            value={txtSize}
            style={{ flex: 1 }}
            onChange={e => setTxtSize(Number(e.target.value))}
          />
          <span className="tm-val">{txtSize}</span>
        </div>

        {/* Row 2: color swatches + alignment */}
        <div className="txt-row">
          <div className="txt-colors">
            {TXT_PALETTE.map(hex => (
              <button
                key={hex}
                className={`txt-color-btn${txtColor === hex ? ' active' : ''}`}
                style={{
                  background: hex,
                  ...(hex === '#1A1A2E' && {
                    boxShadow: '0 1px 5px rgba(0,0,0,0.7), inset 0 0 0 1.5px rgba(255,255,255,0.22)',
                  }),
                }}
                onClick={() => setTxtColor(hex)}
              />
            ))}
          </div>
          <div className="tm-divider" />
          <div className="txt-aligns">
            <button
              className={`txt-align-btn${txtAlign === 'left' ? ' active' : ''}`}
              onClick={() => { setTxtAlign('left'); textPreviewRef.current?.focus(); }}
            >
              <svg width="16" height="13" viewBox="0 0 16 13" fill="none" strokeWidth="1.8" strokeLinecap="round">
                <line x1="1" y1="2" x2="15" y2="2"/><line x1="1" y1="6.5" x2="10" y2="6.5"/><line x1="1" y1="11" x2="13" y2="11"/>
              </svg>
            </button>
            <button
              className={`txt-align-btn${txtAlign === 'center' ? ' active' : ''}`}
              onClick={() => { setTxtAlign('center'); textPreviewRef.current?.focus(); }}
            >
              <svg width="16" height="13" viewBox="0 0 16 13" fill="none" strokeWidth="1.8" strokeLinecap="round">
                <line x1="1" y1="2" x2="15" y2="2"/><line x1="3.5" y1="6.5" x2="12.5" y2="6.5"/><line x1="2" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <button
              className={`txt-align-btn${txtAlign === 'right' ? ' active' : ''}`}
              onClick={() => { setTxtAlign('right'); textPreviewRef.current?.focus(); }}
            >
              <svg width="16" height="13" viewBox="0 0 16 13" fill="none" strokeWidth="1.8" strokeLinecap="round">
                <line x1="1" y1="2" x2="15" y2="2"/><line x1="6" y1="6.5" x2="15" y2="6.5"/><line x1="3" y1="11" x2="15" y2="11"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
