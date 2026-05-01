import React, { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';

const PC_SHAPES = {
  circle:   { W: 280, H: 280 },
  square:   { W: 280, H: 280 },
  rounded:  { W: 280, H: 280 },
  portrait: { W: 220, H: 300 },
  wide:     { W: 300, H: 180 },
  heart:    { W: 280, H: 260 },
};

const SHAPE_CHIPS = [
  { shape: 'circle',   label: 'Circle',
    svg: <svg width="24" height="24" viewBox="0 0 26 26"><circle cx="13" cy="13" r="11" fill="rgba(255,255,255,0.7)"/></svg> },
  { shape: 'square',   label: 'Square',
    svg: <svg width="24" height="24" viewBox="0 0 26 26"><rect x="2" y="2" width="22" height="22" rx="2" fill="rgba(255,255,255,0.7)"/></svg> },
  { shape: 'rounded',  label: 'Soft',
    svg: <svg width="24" height="24" viewBox="0 0 26 26"><rect x="2" y="2" width="22" height="22" rx="8" fill="rgba(255,255,255,0.7)"/></svg> },
  { shape: 'portrait', label: 'Portrait',
    svg: <svg width="24" height="24" viewBox="0 0 26 26"><rect x="6" y="1" width="14" height="24" rx="3" fill="rgba(255,255,255,0.7)"/></svg> },
  { shape: 'wide',     label: 'Wide',
    svg: <svg width="24" height="24" viewBox="0 0 26 26"><rect x="1" y="7" width="24" height="12" rx="3" fill="rgba(255,255,255,0.7)"/></svg> },
  { shape: 'heart',    label: 'Heart',
    svg: <svg width="24" height="24" viewBox="0 0 26 26"><path d="M13 22C13 22 3 15.5 3 9c0-3.3 2.7-6 6-6 1.8 0 3.5.9 4 2 .5-1.1 2.2-2 4-2 3.3 0 6 2.7 6 6 0 6.5-10 13-10 13Z" fill="rgba(255,255,255,0.7)"/></svg> },
];

function pcClipPath(ctx, shape, W, H) {
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(W/2, H/2, Math.min(W,H)/2, 0, Math.PI*2);
  } else if (shape === 'square') {
    ctx.rect(0, 0, W, H);
  } else if (shape === 'rounded') {
    const r = Math.min(W, H) * 0.22;
    ctx.moveTo(r, 0);
    ctx.arcTo(W, 0, W, H, r); ctx.arcTo(W, H, 0, H, r);
    ctx.arcTo(0, H, 0, 0, r); ctx.arcTo(0, 0, W, 0, r);
    ctx.closePath();
  } else if (shape === 'portrait') {
    const r = 24;
    ctx.moveTo(r, 0);
    ctx.arcTo(W, 0, W, H, r); ctx.arcTo(W, H, 0, H, r);
    ctx.arcTo(0, H, 0, 0, r); ctx.arcTo(0, 0, W, 0, r);
    ctx.closePath();
  } else if (shape === 'wide') {
    const r = 20;
    ctx.moveTo(r, 0);
    ctx.arcTo(W, 0, W, H, r); ctx.arcTo(W, H, 0, H, r);
    ctx.arcTo(0, H, 0, 0, r); ctx.arcTo(0, 0, W, 0, r);
    ctx.closePath();
  } else if (shape === 'heart') {
    const cx = W/2, top = H*0.28, bot = H*0.98;
    const lx = W*0.02;
    ctx.moveTo(cx, bot);
    ctx.bezierCurveTo(lx, H*0.62, lx, H*0.44, W*0.22, top);
    ctx.bezierCurveTo(W*0.36, H*0.08, cx, H*0.18, cx, H*0.32);
    ctx.bezierCurveTo(cx, H*0.18, W*0.64, H*0.08, W*0.78, top);
    ctx.bezierCurveTo(W*0.98, H*0.44, W*0.98, H*0.62, cx, bot);
    ctx.closePath();
  }
}

/**
 * PhotoCropScreen — pan/zoom photo crop with 6 shape chips.
 * Props:
 *   visible: bool
 *   onClose: () => void
 *   onApply: (dataUrl, W, H) => void  — called with cropped PNG data URL
 * Ref: { open(url) } — load a new image and show the screen
 */
const PhotoCropScreen = forwardRef(function PhotoCropScreen({ visible, onClose, onApply }, ref) {
  const canvasRef      = useRef(null);
  const wrapRef        = useRef(null);
  const imgRef         = useRef(null);
  const offXRef        = useRef(0);
  const offYRef        = useRef(0);
  const zoomRef        = useRef(1);
  const opacityRef     = useRef(1);
  const opacitySliderRef = useRef(null);
  const opacityValRef  = useRef(null);
  const touchesRef     = useRef({});
  const lastDistRef    = useRef(0);
  const lastMidRef     = useRef(null);

  const [shape, setShape] = useState('circle');
  const [opacity, setOpacity] = useState(100);

  const shapeRef = useRef('circle');

  const pcMinZoom = useCallback(() => {
    const img = imgRef.current;
    const sh  = PC_SHAPES[shapeRef.current];
    if (!img) return 1;
    return Math.max(sh.W / img.naturalWidth, sh.H / img.naturalHeight);
  }, []);

  const pcClampOffset = useCallback(() => {
    const img = imgRef.current;
    const sh  = PC_SHAPES[shapeRef.current];
    if (!img) return;
    const iw = img.naturalWidth  * zoomRef.current;
    const ih = img.naturalHeight * zoomRef.current;
    offXRef.current = Math.min(0, Math.max(sh.W - iw, offXRef.current));
    offYRef.current = Math.min(0, Math.max(sh.H - ih, offYRef.current));
  }, []);

  const pcRender = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    const sh  = PC_SHAPES[shapeRef.current];
    const W   = sh.W, H = sh.H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    pcClipPath(ctx, shapeRef.current, W, H);
    ctx.clip();
    ctx.globalAlpha = opacityRef.current;
    ctx.drawImage(img, offXRef.current, offYRef.current, img.naturalWidth * zoomRef.current, img.naturalHeight * zoomRef.current);
    ctx.globalAlpha = 1;
    ctx.restore();
    // Vignette
    ctx.save();
    pcClipPath(ctx, shapeRef.current, W, H);
    ctx.clip();
    const grad = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.3, W/2, H/2, Math.max(W,H)*0.7);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${0.12 * opacityRef.current})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }, []);

  const pcSizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;
    const sh    = PC_SHAPES[shapeRef.current];
    const aw    = (wrap.clientWidth  || 430) - 64;
    const ah    = (wrap.clientHeight || 480) - 64;
    const scale = Math.min(aw / sh.W, ah / sh.H);
    canvas.width  = sh.W;
    canvas.height = sh.H;
    canvas.style.width  = Math.round(sh.W * scale) + 'px';
    canvas.style.height = Math.round(sh.H * scale) + 'px';
    canvas.style.borderRadius = shapeRef.current === 'circle' ? '50%' :
      shapeRef.current === 'rounded' ? Math.round(sh.W * 0.22 * scale) + 'px' :
      (shapeRef.current === 'portrait' || shapeRef.current === 'wide') ? Math.round(20 * scale) + 'px' : '0';
    canvas.style.boxShadow = '0 12px 48px rgba(0,0,0,0.6)';
  }, []);

  const pcResetView = useCallback(() => {
    const img = imgRef.current;
    const sh  = PC_SHAPES[shapeRef.current];
    if (!img) return;
    zoomRef.current = pcMinZoom();
    offXRef.current = (sh.W - img.naturalWidth  * zoomRef.current) / 2;
    offYRef.current = (sh.H - img.naturalHeight * zoomRef.current) / 2;
    pcClampOffset();
  }, [pcMinZoom, pcClampOffset]);

  // Pointer events for pan + pinch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onDown = (e) => {
      e.preventDefault();
      touchesRef.current[e.pointerId] = { x: e.clientX, y: e.clientY };
      const ids = Object.keys(touchesRef.current);
      if (ids.length === 2) {
        const a = touchesRef.current[ids[0]], b = touchesRef.current[ids[1]];
        lastDistRef.current = Math.hypot(b.x-a.x, b.y-a.y);
        lastMidRef.current  = { x:(a.x+b.x)/2, y:(a.y+b.y)/2 };
      }
    };
    const onMove = (e) => {
      e.preventDefault();
      if (!touchesRef.current[e.pointerId]) return;
      const prev = touchesRef.current[e.pointerId];
      const cur  = { x: e.clientX, y: e.clientY };
      touchesRef.current[e.pointerId] = cur;

      const ids = Object.keys(touchesRef.current);
      const sh  = PC_SHAPES[shapeRef.current];
      const rect = canvas.getBoundingClientRect();
      const cssScale = sh.W / rect.width;

      if (ids.length === 1) {
        offXRef.current += (cur.x - prev.x) * cssScale;
        offYRef.current += (cur.y - prev.y) * cssScale;
        pcClampOffset();
        pcRender();
      } else if (ids.length === 2) {
        const a = touchesRef.current[ids[0]], b = touchesRef.current[ids[1]];
        const d   = Math.hypot(b.x-a.x, b.y-a.y);
        const mid = { x:(a.x+b.x)/2, y:(a.y+b.y)/2 };
        if (lastDistRef.current > 0) {
          const factor  = d / lastDistRef.current;
          const newZoom = Math.max(pcMinZoom(), zoomRef.current * factor);
          const midCvPrev = { x:(lastMidRef.current.x - rect.left)*cssScale, y:(lastMidRef.current.y-rect.top)*cssScale };
          const midCvCur  = { x:(mid.x - rect.left)*cssScale,                y:(mid.y-rect.top)*cssScale };
          const imgX = (midCvPrev.x - offXRef.current) / zoomRef.current;
          const imgY = (midCvPrev.y - offYRef.current) / zoomRef.current;
          zoomRef.current = newZoom;
          offXRef.current = midCvCur.x - imgX * zoomRef.current;
          offYRef.current = midCvCur.y - imgY * zoomRef.current;
          pcClampOffset();
          pcRender();
        }
        lastDistRef.current = d;
        lastMidRef.current  = mid;
      }
    };
    const onUp = (e) => {
      delete touchesRef.current[e.pointerId];
      lastDistRef.current = 0;
      lastMidRef.current  = null;
    };

    canvas.addEventListener('pointerdown',   onDown,  { passive: false });
    canvas.addEventListener('pointermove',   onMove,  { passive: false });
    canvas.addEventListener('pointerup',     onUp);
    canvas.addEventListener('pointercancel', onUp);
    return () => {
      canvas.removeEventListener('pointerdown',   onDown);
      canvas.removeEventListener('pointermove',   onMove);
      canvas.removeEventListener('pointerup',     onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, [pcClampOffset, pcRender, pcMinZoom]);

  const handleShapeChange = useCallback((newShape) => {
    shapeRef.current = newShape;
    setShape(newShape);
    pcSizeCanvas();
    pcResetView();
    pcRender();
  }, [pcSizeCanvas, pcResetView, pcRender]);

  const handleOpacityInput = useCallback((e) => {
    const pct = +e.target.value;
    opacityRef.current = pct / 100;
    setOpacity(pct);
    pcRender();
  }, [pcRender]);

  const handleApply = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const sh  = PC_SHAPES[shapeRef.current];
    const out = Object.assign(document.createElement('canvas'), { width: sh.W, height: sh.H });
    const octx = out.getContext('2d');
    octx.save();
    pcClipPath(octx, shapeRef.current, sh.W, sh.H);
    octx.clip();
    octx.globalAlpha = opacityRef.current;
    octx.drawImage(img, offXRef.current, offYRef.current, img.naturalWidth * zoomRef.current, img.naturalHeight * zoomRef.current);
    octx.globalAlpha = 1;
    octx.restore();
    const dataUrl = out.toDataURL('image/png');
    onApply(dataUrl, sh.W, sh.H);
  }, [onApply]);

  useImperativeHandle(ref, () => ({
    open(url) {
      opacityRef.current = 1;
      setOpacity(100);
      shapeRef.current = 'circle';
      setShape('circle');
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        requestAnimationFrame(() => { pcSizeCanvas(); pcResetView(); pcRender(); });
      };
      img.src = url;
    },
  }), [pcSizeCanvas, pcResetView, pcRender]);

  // Size canvas whenever shape or visible changes
  useEffect(() => {
    if (visible && imgRef.current) {
      requestAnimationFrame(() => { pcSizeCanvas(); pcResetView(); pcRender(); });
    }
  }, [visible, shape, pcSizeCanvas, pcResetView, pcRender]);

  const pct = ((opacity - 10) / (100 - 10) * 100).toFixed(1) + '%';

  return (
    <div id="photoCropScreen" className={`photo-crop-screen${visible ? ' pc-visible' : ''}`}>
      <div className="pc-header">
        <button className="pc-close-btn" id="btnPcClose" aria-label="Close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 22 22" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="4" y1="4" x2="18" y2="18"/><line x1="18" y1="4" x2="4" y2="18"/>
          </svg>
        </button>
        <p className="pc-title">Add Photo</p>
        <div style={{ width: '34px' }} />
      </div>

      <div id="pcPreviewWrap" ref={wrapRef}>
        <canvas id="pcCanvas" ref={canvasRef} style={{ touchAction: 'none', display: 'block' }} />
      </div>

      <div id="pcBottomCard">
        <div id="pcShapeRow">
          {SHAPE_CHIPS.map(({ shape: s, label, svg }) => (
            <button
              key={s}
              className={`pc-shape-chip${shape === s ? ' active' : ''}`}
              data-shape={s}
              aria-label={label}
              onClick={() => handleShapeChange(s)}
            >
              {svg}
            </button>
          ))}
        </div>

        <div className="magic-opacity-row">
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path d="M12 2a10 10 0 1 0 0 20V2z" fill="rgba(255,255,255,0.55)"/>
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
          </svg>
          <input
            type="range"
            id="pcOpacitySlider"
            ref={opacitySliderRef}
            min="10" max="100"
            value={opacity}
            style={{ flex: 1, '--fill': pct }}
            onChange={handleOpacityInput}
          />
          <span className="magic-tol-val" ref={opacityValRef}>{opacity}%</span>
        </div>

        <button id="pcAddBtn" onClick={handleApply}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0a16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add to Frame
        </button>
      </div>
    </div>
  );
});

export default PhotoCropScreen;
