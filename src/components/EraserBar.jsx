import React from 'react';

export default function EraserBar({
  active,
  eraserMode,
  eraserOpacitySliderRef,
  magicPhase,
  magicConfirmDisabled,
  magicDetecting,
  magicRefMode,
  magicOpacity,
  onShapeClick,
  onOpacityInput,
  onMagicBack,
  onMagicConfirm,
  onMagicRefMode,
  onMagicOpacityInput,
  onMagicApply,
}) {
  const magicActive = eraserMode === 'magic';
  return (
    <div id="tmEraserBar" className={`${active ? 'tm-in' : ''}${magicActive ? ' magic-mode' : ''}`}>
      {!magicActive && (
        <>
          <div className="eraser-shapes">
            <button className={`eraser-shape-btn${eraserMode === 'freehand' ? ' active' : ''}`}
              data-shape="freehand" title="Freehand"
              onClick={() => onShapeClick('freehand')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20 Q8 8 12 14 Q16 20 20 6" />
              </svg>
            </button>
            <button className={`eraser-shape-btn${eraserMode === 'circle' ? ' active' : ''}`}
              data-shape="circle" title="Circle"
              onClick={() => onShapeClick('circle')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <circle cx="12" cy="12" r="8" />
              </svg>
            </button>
            <button className={`eraser-shape-btn${eraserMode === 'rect' ? ' active' : ''}`}
              data-shape="rect" title="Rectangle"
              onClick={() => onShapeClick('rect')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinejoin="round">
                <rect x="4" y="5" width="16" height="14" rx="2" />
              </svg>
            </button>
            <button className="eraser-shape-btn" data-shape="magic" title="Smart select"
              onClick={() => onShapeClick('magic')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 4V2" />
                <path d="M15 16v-2" />
                <path d="M8 9h2" />
                <path d="M20 9h2" />
                <path d="M17.8 11.8L19 13" />
                <path d="M15 9h0.01" />
                <path d="M17.8 6.2L19 5" />
                <path d="M3 21l9-9" />
                <path d="M12.2 6.2L11 5" />
              </svg>
            </button>
          </div>
          <div className="tm-divider"></div>
          <div className="tm-icon">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 1 0 0 20V2z" fill="rgba(255,255,255,0.65)" />
              <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            </svg>
          </div>
          <input type="range" id="eraserOpacitySlider" ref={eraserOpacitySliderRef}
            min="5" max="100" defaultValue="100"
            onInput={onOpacityInput} />
          <span className="tm-val" id="eraserOpacityVal">100%</span>
        </>
      )}

      {magicActive && (
        <div id="eraserMagicUI">
          {magicPhase === 'lasso' ? (
            <div className="magic-step">
              <p className="magic-hint">Draw a boundary around your subject</p>
              <div className="magic-actions-row">
                <button className="magic-back-btn" onClick={onMagicBack}>Back</button>
                <button className="magic-confirm-btn" disabled={magicConfirmDisabled || magicDetecting} onClick={onMagicConfirm}>
                  {magicDetecting ? 'Detecting...' : 'Confirm'}
                </button>
              </div>
            </div>
          ) : (
            <div className="magic-step">
              <div className="magic-toggle">
                <button className={`magic-toggle-btn${magicRefMode === 'pen' ? ' on' : ''}`} onClick={() => onMagicRefMode('pen')}>Mark</button>
                <button className={`magic-toggle-btn${magicRefMode === 'erase' ? ' on' : ''}`} onClick={() => onMagicRefMode('erase')}>Clear</button>
              </div>
              <div className="magic-opacity-row">
                <span className="magic-opacity-lbl">Opacity</span>
                <input type="range" min="10" max="100" value={magicOpacity} onInput={onMagicOpacityInput} onChange={onMagicOpacityInput} />
                <span className="magic-tol-val">{magicOpacity}%</span>
              </div>
              <button className="magic-apply-btn" onClick={onMagicApply}>Apply</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
