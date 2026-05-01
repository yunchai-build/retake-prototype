import { useRef, useState, useCallback, useEffect } from 'react';

export const EMOJIS = [
  '😊','😍','🥳','🤩','😎','😘','😜','🤪','😏','🥺',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','💕','💫',
  '🌟','✨','⚡','🔥','🌈','🌙','☀️','⭐','🌸','🍀',
  '🎉','🎊','🎈','🎁','🏆','👑','💎','🦋','🌺','🌻',
  '🦄','🐣','🐶','🐱','🐰','🦊','🐻','🐼','🐨','🐯',
  '🍓','🍒','🍑','🥭','🍋','🍊','🍇','🫐','🍭','🧁',
  '✌️','👏','🙌','👋','🫶','💯','🔑','🪄','✦','🫧',
];

/**
 * useStickerSystem — manages all sticker state, refs, and logic.
 *
 * @param {object}   opts
 * @param {React.RefObject} opts.ctxRef          - canvas 2D context (for commitStickersToCanvas)
 * @param {function} opts.setScrimVisible         - page-level scrim setter
 * @param {function} [opts.onBeforeOpen]          - called before panel opens (e.g. exitToolMode)
 */
export function useStickerSystem({ ctxRef, setScrimVisible, onBeforeOpen }) {
  // ── DOM refs (created here; consumed by StickerPanel) ──
  const stickerOverlayRef = useRef(null);
  const spGridRef = useRef(null);
  const spEmojiGridRef = useRef(null);
  const nsPreviewRef = useRef(null);
  const stickerPhotoInputRef = useRef(null);

  // ── Data refs ──
  const stickerLibraryRef = useRef([]);
  const placedStickersRef = useRef([]);
  const selectedStickerRef = useRef(null);
  const pendingStickerSrcRef = useRef(null);
  const stickerTabRef = useRef('recents');

  // ── React state ──
  const [stickerTab, setStickerTab] = useState('recents');
  const [stickerLibrary, setStickerLibrary] = useState([]);
  const [stickerPanelVisible, setStickerPanelVisible] = useState(false);
  const [newStickerVisible, setNewStickerVisible] = useState(false);

  // ── Transform ──
  const applyStickerTransform = useCallback((stk) => {
    stk.el.style.left = stk.x + 'px';
    stk.el.style.top = stk.y + 'px';
    stk.el.style.transform = `scale(${stk.scale}) rotate(${stk.rotation}deg)`;
  }, []);

  // ── Selection ──
  const deselectAllStickers = useCallback(() => {
    if (selectedStickerRef.current) selectedStickerRef.current.el.classList.remove('stk-selected');
    selectedStickerRef.current = null;
  }, []);

  const selectSticker = useCallback((stk) => {
    deselectAllStickers();
    selectedStickerRef.current = stk;
    stk.el.classList.add('stk-selected');
  }, [deselectAllStickers]);

  // ── Remove ──
  const removeSticker = useCallback((stk) => {
    stk.el.remove();
    placedStickersRef.current = placedStickersRef.current.filter(s => s !== stk);
    if (selectedStickerRef.current === stk) selectedStickerRef.current = null;
    if (placedStickersRef.current.length === 0 && stickerOverlayRef.current) {
      stickerOverlayRef.current.classList.remove('stk-active');
    }
  }, []);

  // ── Drag / pinch ──
  const setupStickerDrag = useCallback((stk) => {
    const el = stk.el;
    let t1x=0, t1y=0, t2x=0, t2y=0;
    let startX=0, startY=0, startSX=0, startSY=0;
    let startDist=0, startScale=1, startAngle=0, startRot=0;
    let dragging=false, pinching=false;
    function dist(ax,ay,bx,by){ return Math.sqrt((bx-ax)**2+(by-ay)**2); }
    function angle(ax,ay,bx,by){ return Math.atan2(by-ay, bx-ax); }

    el.addEventListener('mousedown', e => {
      e.stopPropagation(); e.preventDefault();
      selectSticker(stk);
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      startSX = stk.x; startSY = stk.y;
      const onMove = e => {
        if (!dragging) return;
        stk.x = startSX + (e.clientX - startX);
        stk.y = startSY + (e.clientY - startY);
        applyStickerTransform(stk);
      };
      const onUp = () => { dragging=false; document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp); };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
    el.addEventListener('touchstart', e => {
      e.stopPropagation(); e.preventDefault();
      selectSticker(stk);
      if (e.touches.length === 1) {
        dragging=true; pinching=false;
        t1x=e.touches[0].clientX; t1y=e.touches[0].clientY;
        startSX=stk.x; startSY=stk.y;
      } else if (e.touches.length === 2) {
        dragging=false; pinching=true;
        const a=e.touches[0], b=e.touches[1];
        t1x=a.clientX; t1y=a.clientY; t2x=b.clientX; t2y=b.clientY;
        startDist=dist(t1x,t1y,t2x,t2y);
        startScale=stk.scale; startAngle=angle(t1x,t1y,t2x,t2y); startRot=stk.rotation;
      }
    }, { passive:false });
    el.addEventListener('touchmove', e => {
      e.stopPropagation(); e.preventDefault();
      if (dragging && e.touches.length===1) {
        stk.x = startSX+(e.touches[0].clientX-t1x);
        stk.y = startSY+(e.touches[0].clientY-t1y);
      } else if (pinching && e.touches.length===2) {
        const a=e.touches[0], b=e.touches[1];
        const d=dist(a.clientX,a.clientY,b.clientX,b.clientY);
        stk.scale=Math.max(0.2,startScale*(d/startDist));
        stk.rotation=startRot+(angle(a.clientX,a.clientY,b.clientX,b.clientY)-startAngle)*(180/Math.PI);
      }
      applyStickerTransform(stk);
    }, { passive:false });
    el.addEventListener('touchend', e => {
      if (e.touches.length < 2) pinching=false;
      if (e.touches.length === 0) dragging=false;
    }, { passive:true });
  }, [selectSticker, applyStickerTransform]);

  // ── Place ──
  const placeSticker = useCallback((src) => {
    const el = document.createElement('div');
    el.className = 'placed-sticker';
    const img = document.createElement('img');
    img.src = src;
    el.appendChild(img);
    const delBtn = document.createElement('button');
    delBtn.className = 'stk-del';
    delBtn.innerHTML = '×';
    el.appendChild(delBtn);
    const size = 120;
    const x = (414 - size) / 2;
    const y = (750 - size) / 2;
    const stk = { id: Date.now(), el, src, x, y, scale: 1, rotation: 0, baseW: size };
    placedStickersRef.current.push(stk);
    el.style.left = x + 'px'; el.style.top = y + 'px';
    el.style.width = size + 'px';
    el.style.transform = 'scale(1) rotate(0deg)';
    if (stickerOverlayRef.current) {
      stickerOverlayRef.current.appendChild(el);
      stickerOverlayRef.current.classList.add('stk-active');
    }
    selectSticker(stk);
    delBtn.addEventListener('click', ev => { ev.stopPropagation(); removeSticker(stk); });
    el.addEventListener('click', ev => { ev.stopPropagation(); selectSticker(stk); });
    setupStickerDrag(stk);
  }, [selectSticker, removeSticker, setupStickerDrag]);

  /**
   * Bake placed stickers onto ctxRef.current (destructive — removes DOM elements).
   * Used by InviterPage's download: canvas IS the final export.
   */
  const commitStickersToCanvas = useCallback(() => {
    const stickers = placedStickersRef.current;
    if (stickers.length === 0) return;
    const ctx = ctxRef.current;
    stickers.forEach(stk => {
      const img = new Image();
      img.src = stk.src;
      const eff = stk.baseW * stk.scale;
      const cx = stk.x + stk.baseW / 2;
      const cy = stk.y + stk.baseW / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(stk.rotation * Math.PI / 180);
      ctx.drawImage(img, -eff/2, -eff/2, eff, eff);
      ctx.restore();
    });
    stickers.forEach(s => s.el.remove());
    placedStickersRef.current = [];
    selectedStickerRef.current = null;
    if (stickerOverlayRef.current) stickerOverlayRef.current.classList.remove('stk-active');
  }, [ctxRef]);

  /**
   * Draw placed stickers onto a given offscreen context (non-destructive, async).
   * Used by InviteePage's buildCompositeBlob.
   */
  const drawStickersToContext = useCallback(async (offCtx) => {
    for (const stk of placedStickersRef.current) {
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const eff = stk.baseW * stk.scale;
          const cx = stk.x + stk.baseW / 2;
          const cy = stk.y + stk.baseW / 2;
          offCtx.save();
          offCtx.translate(cx, cy);
          offCtx.rotate(stk.rotation * Math.PI / 180);
          offCtx.drawImage(img, -eff/2, -eff/2, eff, eff);
          offCtx.restore();
          resolve();
        };
        img.onerror = resolve; // skip broken sticker, don't abort composite
        img.src = stk.src;
      });
    }
  }, []);

  /** Remove all placed stickers from the DOM without committing to canvas. */
  const clearStickers = useCallback(() => {
    placedStickersRef.current.forEach(s => s.el.remove());
    placedStickersRef.current = [];
    selectedStickerRef.current = null;
    if (stickerOverlayRef.current) stickerOverlayRef.current.classList.remove('stk-active');
  }, []);

  // ── Panel content ──
  const renderStickerContent = useCallback(() => {
    const grid = spGridRef.current;
    const emojiGrid = spEmojiGridRef.current;
    if (!grid || !emojiGrid) return;
    // Read from ref — avoids stale closure when called right after setStickerTab
    const tab = stickerTabRef.current;
    if (tab === 'emoji') {
      grid.style.display = 'none';
      emojiGrid.style.display = 'grid';
      return;
    }
    emojiGrid.style.display = 'none';
    if (stickerLibraryRef.current.length === 0) { grid.style.display = 'none'; return; }
    grid.style.display = 'grid';
    grid.innerHTML = '';
    const addCell = document.createElement('button');
    addCell.className = 'sp-add-cell';
    addCell.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    addCell.addEventListener('click', () => stickerPhotoInputRef.current && stickerPhotoInputRef.current.click());
    grid.appendChild(addCell);
    const list = tab === 'recents'
      ? [...stickerLibraryRef.current].reverse().slice(0, 12)
      : stickerLibraryRef.current;
    list.forEach(stk => {
      const cell = document.createElement('button');
      cell.className = 'sp-sticker-cell';
      const img = document.createElement('img');
      img.src = stk.src;
      cell.appendChild(img);
      cell.addEventListener('click', () => { placeSticker(stk.src); closePanel(); });
      grid.appendChild(cell);
    });
  }, [placeSticker]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Panel open / close ──
  const closePanel = useCallback(() => {
    setStickerPanelVisible(false);
    setScrimVisible(false);
  }, [setScrimVisible]);

  const openPanel = useCallback(() => {
    if (onBeforeOpen) onBeforeOpen();
    renderStickerContent();
    setStickerPanelVisible(true);
    setScrimVisible(true);
  }, [onBeforeOpen, renderStickerContent, setScrimVisible]);

  const handleTabClick = useCallback((tab) => {
    stickerTabRef.current = tab;
    setStickerTab(tab);
    renderStickerContent();
  }, [renderStickerContent]);

  // ── New sticker flow ──
  const handleStickerPhotoChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    pendingStickerSrcRef.current = url;
    const preview = nsPreviewRef.current;
    if (preview) {
      preview.innerHTML = '';
      const img = document.createElement('img');
      img.src = url;
      preview.appendChild(img);
    }
    closePanel();
    setNewStickerVisible(true);
    e.target.value = '';
  }, [closePanel]);

  const closeNewStickerScreen = useCallback(() => {
    setNewStickerVisible(false);
    pendingStickerSrcRef.current = null;
    setTimeout(() => setStickerPanelVisible(true), 200);
  }, []);

  const handleNewStickerAdd = useCallback(() => {
    if (!pendingStickerSrcRef.current) return;
    const src = pendingStickerSrcRef.current;
    stickerLibraryRef.current.push({ id: Date.now(), src });
    setStickerLibrary([...stickerLibraryRef.current]);
    pendingStickerSrcRef.current = null;
    setNewStickerVisible(false);
    placeSticker(src);
  }, [placeSticker]);

  // ── Build emoji grid once on mount ──
  useEffect(() => {
    const emojiGrid = spEmojiGridRef.current;
    if (!emojiGrid) return;
    emojiGrid.innerHTML = '';
    EMOJIS.forEach(em => {
      const btn = document.createElement('button');
      btn.className = 'sp-emoji-btn';
      btn.textContent = em;
      btn.addEventListener('click', () => {
        const c = document.createElement('canvas');
        c.width = 120; c.height = 120;
        const x = c.getContext('2d');
        x.font = '90px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(em, 60, 66);
        placeSticker(c.toDataURL());
        closePanel();
      });
      emojiGrid.appendChild(btn);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Refs consumed by StickerPanel JSX
    stickerOverlayRef,
    spGridRef,
    spEmojiGridRef,
    nsPreviewRef,
    stickerPhotoInputRef,
    // Data ref exposed so pages can read placed stickers
    placedStickersRef,
    // State
    stickerTab,
    stickerLibrary,
    stickerPanelVisible,
    newStickerVisible,
    // Panel control
    openPanel,
    closePanel,
    handleTabClick,
    // Sticker ops
    placeSticker,
    deselectAllStickers,      // exposed so pages can wire overlay click → deselect
    commitStickersToCanvas,   // destructive — used by InviterPage download
    drawStickersToContext,    // non-destructive async — used by InviteePage composite
    clearStickers,
    // New-sticker flow
    handleStickerPhotoChange,
    closeNewStickerScreen,
    handleNewStickerAdd,
  };
}
