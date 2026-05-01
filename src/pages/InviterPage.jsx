import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

// Fixed tool order — used to derive orderedToolIds from recentTools
const ALL_TOOL_IDS = ['text', 'stickers', 'gallery', 'doodle', 'eraser', 'download'];
import '../styles/inviter.css';
import { useToast } from '../hooks/useToast';
import { useStickerSystem } from '../hooks/useStickerSystem';
import StickerPanel from '../components/StickerPanel';
import DrawingToolOverlays from '../components/DrawingToolOverlays';
import ConfirmDialog from '../components/ConfirmDialog';

export default function InviterPage() {
  // ── Canvas / ctx refs ──
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const scratchCanvasRef = useRef(null);
  const scratchCtxRef = useRef(null);
  const frameElRef = useRef(null);

  // ── Tool state refs ──
  const activeToolRef = useRef(null);
  const toolRadiusRef = useRef(32);
  const eraserOpacityRef = useRef(1.0);
  const eraserModeRef = useRef('freehand');
  const doodleColorRef = useRef('#FFFFFF');
  const penTypeRef = useRef('pen');
  const isDrawingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const shapeDraggingRef = useRef(false);
  const shapeStartXRef = useRef(0);
  const shapeStartYRef = useRef(0);
  const shapePreviewDataRef = useRef(null);
  const strokeBaseDataRef = useRef(null);

  // ── History refs ──
  const mainUndoStackRef = useRef([]);
  const mainRedoStackRef = useRef([]);
  const toolUndoStackRef = useRef([]);
  const toolRedoStackRef = useRef([]);
  const sessionEntrySnapRef = useRef(null);

  // ── Timer refs ──
  const lpCollapseTimerRef = useRef(null);
  const toolsHideTimerRef = useRef(null);
  const toolsCollapseTimerRef = useRef(null);
  const labelPressTimerRef = useRef(null);
  const labelCollapseTimerRef = useRef(null);
  const trackDraggingRef = useRef(false);

  // ── Element refs ──
  const brushCursorRef = useRef(null);
  const brushCursorSvgRef = useRef(null);
  const brushCursorCircleRef = useRef(null);
  const tmSizeHandleRef = useRef(null);
  const tmLeftPanelRef = useRef(null);
  const eraserOpacitySliderRef = useRef(null);
  const galleryInputRef = useRef(null);

  // ── Misc refs ──
  const confirmResolveRef = useRef(null);
  const introPhotoFlowRef = useRef(false);

  // ── React state ──
  const [activeTool, setActiveTool] = useState(null);
  const [eraserMode, setEraserMode] = useState('freehand');
  const [doodleColor, setDoodleColor] = useState('#FFFFFF');
  const [penType, setPenType] = useState('pen');
  const [frameName, setFrameName] = useState('my frame');
  const [editorVisible, setEditorVisible] = useState(false);
  const [introCardVisible, setIntroCardVisible] = useState(false);
  const [scrimVisible, setScrimVisible] = useState(false);
  const [frameScrimVisible, setFrameScrimVisible] = useState(false);
  const [exitBtnVisible, setExitBtnVisible] = useState(false);
  const [undoRedoVisible, setUndoRedoVisible] = useState(false);
  const [toolsVisible, setToolsVisible] = useState(false);
  const [toolsOut, setToolsOut] = useState(false);
  const [toolsCollapsed, setToolsCollapsed] = useState(false);
  const toolsCollapsedRef = useRef(false);
  // recentTools: IDs in most-recent-first order; first 3 shown when collapsed
  const [recentTools, setRecentTools] = useState(['text', 'doodle', 'eraser']);
  // orderedToolIds: recent 3 first, then the rest in default order
  const orderedToolIds = useMemo(() => {
    const recentSet = new Set(recentTools);
    const rest = ALL_TOOL_IDS.filter(id => !recentSet.has(id));
    return [...recentTools, ...rest];
  }, [recentTools]);
  const [bottomBarVisible, setBottomBarVisible] = useState(false);
  const [bottomBarOut, setBottomBarOut] = useState(false);
  const [exitBtnOut, setExitBtnOut] = useState(false);
  const [undoRedoOut, setUndoRedoOut] = useState(false);
  const [tmIn, setTmIn] = useState(false);
  const [tmBarMode, setTmBarMode] = useState(null); // 'pen' | 'eraser' | null
  const [tmLeftIn, setTmLeftIn] = useState(false);
  const [undoBtnDisabled, setUndoBtnDisabled] = useState(true);
  const [redoBtnDisabled, setRedoBtnDisabled] = useState(true);
  const [tmUndoBtnDisabled, setTmUndoBtnDisabled] = useState(true);
  const [tmRedoBtnDisabled, setTmRedoBtnDisabled] = useState(true);
  const [sharePanelVisible, setSharePanelVisible] = useState(false);
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmScrimVisible, setConfirmScrimVisible] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');
  const [confirmOkLabel, setConfirmOkLabel] = useState('');
  const [confirmDanger, setConfirmDanger] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [labelsExpanded, setLabelsExpanded] = useState(false);
  const [editNameInputValue, setEditNameInputValue] = useState('');

  // ── Shared hooks ──
  const { toastMsg, toastVisible, showToast } = useToast(1800);
  const stickerSys = useStickerSystem({ ctxRef, setScrimVisible });

  const TRACK_H = 240, PANEL_W = 56;
  const HANDLE_MIN = 6, HANDLE_MAX = 38;
  const TRACK_TOP_Y = 38, TRACK_BOT_Y = 210;

  // ── Helpers ──
  const snapshot = useCallback(() => {
    try { return canvasRef.current.toDataURL(); } catch(e) { return null; }
  }, []);

  const syncHistoryBtns = useCallback(() => {
    if (activeToolRef.current) {
      setTmUndoBtnDisabled(toolUndoStackRef.current.length <= 1);
      setTmRedoBtnDisabled(toolRedoStackRef.current.length === 0);
      setUndoBtnDisabled(true);
      setRedoBtnDisabled(true);
    } else {
      setUndoBtnDisabled(mainUndoStackRef.current.length <= 1);
      setRedoBtnDisabled(mainRedoStackRef.current.length === 0);
      setTmUndoBtnDisabled(true);
      setTmRedoBtnDisabled(true);
    }
  }, []);

  const restoreSnapshot = useCallback((url) => {
    if (!url) return Promise.resolve();
    return new Promise(res => {
      const i = new Image();
      i.onload = () => {
        const ctx = ctxRef.current;
        ctx.clearRect(0, 0, 414, 750);
        ctx.drawImage(i, 0, 0);
        res();
      };
      i.src = url;
    });
  }, []);

  const setHandlePos = useCallback((norm) => {
    const size = Math.round(HANDLE_MIN + norm * (HANDLE_MAX - HANDLE_MIN));
    const trackY = TRACK_TOP_Y + (1 - norm) * (TRACK_BOT_Y - TRACK_TOP_Y);
    const h = tmSizeHandleRef.current;
    if (!h) return;
    h.style.width = size + 'px';
    h.style.height = size + 'px';
    h.style.top = (trackY - size / 2) + 'px';
    h.style.left = ((PANEL_W - size) / 2) + 'px';
  }, []);

  const syncCursor = useCallback(() => {
    const r = toolRadiusRef.current;
    const d = r * 2 + 8;
    const svg = brushCursorSvgRef.current;
    const circle = brushCursorCircleRef.current;
    if (!svg || !circle) return;
    svg.setAttribute('width', d);
    svg.setAttribute('height', d);
    svg.setAttribute('viewBox', `${-d/2} ${-d/2} ${d} ${d}`);
    circle.setAttribute('r', r);
    if (activeToolRef.current === 'doodle') {
      const alpha = doodleColorRef.current === '#FFFFFF' ? '44' : '55';
      circle.setAttribute('fill', doodleColorRef.current + alpha);
      circle.setAttribute('stroke', doodleColorRef.current);
      circle.setAttribute('stroke-dasharray', '');
      circle.setAttribute('stroke-width', '2');
    } else {
      circle.setAttribute('fill', 'rgba(255,255,255,0.06)');
      circle.setAttribute('stroke', 'rgba(255,255,255,0.8)');
      circle.setAttribute('stroke-dasharray', '4 3');
      circle.setAttribute('stroke-width', '1.5');
    }
  }, []);

  const expandLeftPanel = useCallback(() => {
    if (tmLeftPanelRef.current) tmLeftPanelRef.current.style.transform = 'translateX(0)';
    clearTimeout(lpCollapseTimerRef.current);
    lpCollapseTimerRef.current = setTimeout(() => {
      if (activeToolRef.current && tmLeftPanelRef.current) {
        tmLeftPanelRef.current.style.transform = 'translateX(-28px)';
      }
    }, 1800);
  }, []);

  const applyTrackNorm = useCallback((norm) => {
    norm = Math.max(0, Math.min(1, norm));
    toolRadiusRef.current = Math.round(4 + norm * (60 - 4));
    setHandlePos(norm);
    syncCursor();
    expandLeftPanel();
  }, [setHandlePos, syncCursor, expandLeftPanel]);

  const normFromClientY = useCallback((clientY) => {
    const rect = tmLeftPanelRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1,
      1 - (clientY - rect.top - TRACK_TOP_Y) / (TRACK_BOT_Y - TRACK_TOP_Y)));
  }, []);

  // ── Drawing ──
  const getXY = useCallback((e) => {
    const canvas = canvasRef.current;
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {
      x: (t.clientX - r.left) * (canvas.width / r.width),
      y: (t.clientY - r.top) * (canvas.height / r.height),
    };
  }, []);

  const getXYFromClient = useCallback((cx, cy) => {
    const canvas = canvasRef.current;
    const r = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(canvas.width, (cx - r.left) * (canvas.width / r.width))),
      y: Math.max(0, Math.min(canvas.height, (cy - r.top) * (canvas.height / r.height))),
    };
  }, []);

  const paintAt = useCallback((x, y, fx, fy) => {
    const ctx = ctxRef.current;
    const scratchCtx = scratchCtxRef.current;
    const scratchCanvas = scratchCanvasRef.current;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(x, y);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (activeToolRef.current === 'eraser') {
      scratchCtx.save();
      scratchCtx.beginPath(); scratchCtx.moveTo(fx, fy); scratchCtx.lineTo(x, y);
      scratchCtx.lineCap = 'round'; scratchCtx.lineJoin = 'round';
      scratchCtx.globalCompositeOperation = 'source-over';
      scratchCtx.globalAlpha = 1;
      scratchCtx.strokeStyle = 'rgba(0,0,0,1)';
      scratchCtx.lineWidth = toolRadiusRef.current * 2;
      scratchCtx.stroke();
      scratchCtx.restore();
      if (strokeBaseDataRef.current) ctx.putImageData(strokeBaseDataRef.current, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = eraserOpacityRef.current;
      ctx.drawImage(scratchCanvas, 0, 0);
    } else if (penTypeRef.current === 'pencil') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = doodleColorRef.current;
      ctx.lineWidth = Math.max(1, toolRadiusRef.current * 0.8);
      ctx.globalAlpha = 0.55; ctx.stroke();
      ctx.lineWidth = toolRadiusRef.current * 1.6; ctx.globalAlpha = 0.08; ctx.stroke();
    } else if (penTypeRef.current === 'marker') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = doodleColorRef.current;
      ctx.lineWidth = toolRadiusRef.current * 3.5;
      ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
      ctx.globalAlpha = 0.38; ctx.stroke();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = doodleColorRef.current;
      const _n = (toolRadiusRef.current - 4) / 56;
      ctx.lineWidth = Math.max(1, 1 - 11 * _n + 58 * _n * _n);
      ctx.stroke();
    }
    ctx.restore();
  }, []);

  const drawShapePreview = useCallback((x1, y1, x2, y2) => {
    const ctx = ctxRef.current;
    if (!shapePreviewDataRef.current) return;
    ctx.putImageData(shapePreviewDataRef.current, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.38;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    if (eraserModeRef.current === 'circle') {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      const rx = Math.max(1, Math.abs(x2 - x1) / 2), ry = Math.max(1, Math.abs(y2 - y1) / 2);
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
    } else {
      const x = Math.min(x1, x2), y = Math.min(y1, y2);
      const w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
      ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1; ctx.strokeRect(x, y, w, h);
    }
    ctx.restore();
  }, []);

  const commitShape = useCallback((x1, y1, x2, y2) => {
    const ctx = ctxRef.current;
    if (shapePreviewDataRef.current) ctx.putImageData(shapePreviewDataRef.current, 0, 0);
    shapePreviewDataRef.current = null;
    const minSize = 4;
    if (Math.abs(x2 - x1) < minSize && Math.abs(y2 - y1) < minSize) return;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = eraserOpacityRef.current;
    if (eraserModeRef.current === 'circle') {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      const rx = Math.max(1, Math.abs(x2 - x1) / 2), ry = Math.max(1, Math.abs(y2 - y1) / 2);
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      const x = Math.min(x1, x2), y = Math.min(y1, y2);
      ctx.fillRect(x, y, Math.abs(x2 - x1), Math.abs(y2 - y1));
    }
    ctx.restore();
  }, []);

  const pushHistory = useCallback(() => {
    if (activeToolRef.current) {
      if (toolUndoStackRef.current.length >= 30) toolUndoStackRef.current.shift();
      toolUndoStackRef.current.push(snapshot());
      toolRedoStackRef.current = [];
    } else {
      mainUndoStackRef.current.push(snapshot());
      mainRedoStackRef.current = [];
    }
    syncHistoryBtns();
  }, [snapshot, syncHistoryBtns]);

  const moveCursor = useCallback((cx, cy) => {
    const r = frameElRef.current.getBoundingClientRect();
    const el = brushCursorRef.current;
    if (!el) return;
    el.style.left = (cx - r.left) + 'px';
    el.style.top = (cy - r.top) + 'px';
  }, []);

  // ── Configure left panel per tool ──
  const configureLeftPanel = useCallback((tool) => {
    if (tool === 'eraser') {
      eraserOpacityRef.current = 0.5;
      if (eraserOpacitySliderRef.current) {
        eraserOpacitySliderRef.current.value = 50;
        eraserOpacitySliderRef.current.style.setProperty('--fill', '50%');
      }
      toolRadiusRef.current = Math.round(4 + 0.5 * (60 - 4));
      setHandlePos(0.5);
      eraserModeRef.current = 'freehand';
      setEraserMode('freehand');
      if (canvasRef.current) canvasRef.current.style.cursor = 'none';
    } else {
      toolRadiusRef.current = Math.round(4 + 0.5 * (60 - 4));
      setHandlePos(0.5);
    }
    syncCursor();
  }, [setHandlePos, syncCursor]);

  // ── Tool mode enter/exit ──
  const enterToolMode = useCallback((tool) => {
    activeToolRef.current = tool;
    setActiveTool(tool);

    const snap = snapshot();
    mainUndoStackRef.current.push(snap);
    mainRedoStackRef.current = [];
    sessionEntrySnapRef.current = snap;
    toolUndoStackRef.current = [snap];
    toolRedoStackRef.current = [];
    configureLeftPanel(tool);
    syncHistoryBtns();

    setExitBtnOut(true);
    setUndoRedoOut(true);
    setToolsOut(true);
    setBottomBarOut(true);

    clearTimeout(toolsHideTimerRef.current);
    toolsHideTimerRef.current = setTimeout(() => {
      setToolsVisible(false);
      setToolsOut(false);
    }, 400);

    setTimeout(() => {
      setTmIn(true);
      setTmLeftIn(true);
      setTmBarMode(tool);
      expandLeftPanel();
    }, 120);

    if (canvasRef.current) canvasRef.current.classList.remove('no-tool');
    /* Disable sticker overlay + individual sticker elements so they never block canvas drawing */
    if (stickerSys.stickerOverlayRef.current) stickerSys.stickerOverlayRef.current.style.pointerEvents = 'none';
    stickerSys.placedStickersRef.current.forEach(stk => { stk.el.style.pointerEvents = 'none'; });
    syncCursor();
    if (brushCursorRef.current) brushCursorRef.current.style.display = 'none';
  }, [snapshot, configureLeftPanel, syncHistoryBtns, expandLeftPanel, syncCursor, stickerSys]);

  const exitToolMode = useCallback(() => {
    const didChange = toolUndoStackRef.current.length > 1;
    if (!didChange && mainUndoStackRef.current.length > 0) {
      mainUndoStackRef.current.pop();
    } else if (didChange) {
      mainUndoStackRef.current.push(snapshot());
      mainRedoStackRef.current = [];
    }
    toolUndoStackRef.current = [];
    toolRedoStackRef.current = [];
    sessionEntrySnapRef.current = null;

    if (shapeDraggingRef.current && shapePreviewDataRef.current) {
      ctxRef.current.putImageData(shapePreviewDataRef.current, 0, 0);
    }
    shapeDraggingRef.current = false;
    shapePreviewDataRef.current = null;
    strokeBaseDataRef.current = null;
    if (scratchCtxRef.current && scratchCanvasRef.current) {
      scratchCtxRef.current.clearRect(0, 0, scratchCanvasRef.current.width, scratchCanvasRef.current.height);
    }
    if (canvasRef.current) canvasRef.current.style.cursor = '';

    activeToolRef.current = null;
    setActiveTool(null);
    clearTimeout(lpCollapseTimerRef.current);
    clearTimeout(toolsHideTimerRef.current);
    syncHistoryBtns();

    setTmIn(false);
    setTmLeftIn(false);
    setTmBarMode(null);
    if (tmLeftPanelRef.current) {
      tmLeftPanelRef.current.style.transform = '';
    }

    setToolsOut(false);
    setToolsCollapsed(false);
    toolsCollapsedRef.current = false;
    setToolsVisible(true);
    clearTimeout(toolsCollapseTimerRef.current);
    toolsCollapseTimerRef.current = setTimeout(() => {
      setToolsCollapsed(true);
      toolsCollapsedRef.current = true;
    }, 2000);
    setTimeout(() => {
      setExitBtnOut(false);
      setUndoRedoOut(false);
      setBottomBarOut(false);
    }, 100);

    if (canvasRef.current) canvasRef.current.classList.add('no-tool');
    /* Restore sticker overlay + individual sticker pointer events */
    if (stickerSys.stickerOverlayRef.current) stickerSys.stickerOverlayRef.current.style.pointerEvents = '';
    stickerSys.placedStickersRef.current.forEach(stk => { stk.el.style.pointerEvents = ''; });
    if (brushCursorRef.current) brushCursorRef.current.style.display = 'none';
  }, [snapshot, syncHistoryBtns, stickerSys]);

  // ── Undo/Redo ──
  const toolUndo = useCallback(async () => {
    if (toolUndoStackRef.current.length <= 1) { showToast('Nothing to undo'); return; }
    toolRedoStackRef.current.push(toolUndoStackRef.current.pop());
    await restoreSnapshot(toolUndoStackRef.current[toolUndoStackRef.current.length - 1]);
    syncHistoryBtns();
  }, [showToast, restoreSnapshot, syncHistoryBtns]);

  const toolRedo = useCallback(async () => {
    if (!toolRedoStackRef.current.length) { showToast('Nothing to redo'); return; }
    const snap = toolRedoStackRef.current.pop();
    toolUndoStackRef.current.push(snap);
    await restoreSnapshot(snap);
    syncHistoryBtns();
  }, [showToast, restoreSnapshot, syncHistoryBtns]);

  const mainUndo = useCallback(async () => {
    if (mainUndoStackRef.current.length <= 1) { showToast('Nothing to undo'); return; }
    const current = mainUndoStackRef.current.pop();
    mainRedoStackRef.current.push(current);
    await restoreSnapshot(mainUndoStackRef.current[mainUndoStackRef.current.length - 1]);
    syncHistoryBtns();
  }, [showToast, restoreSnapshot, syncHistoryBtns]);

  const mainRedo = useCallback(async () => {
    if (!mainRedoStackRef.current.length) { showToast('Nothing to redo'); return; }
    const snap = mainRedoStackRef.current.pop();
    mainUndoStackRef.current.push(snap);
    await restoreSnapshot(snap);
    syncHistoryBtns();
  }, [showToast, restoreSnapshot, syncHistoryBtns]);

  // ── Confirm dialog ──
  const showConfirm = useCallback((message, okLabel, isDanger, cancelLabel = 'Cancel') => {
    return new Promise(resolve => {
      setConfirmMsg(message);
      setConfirmOkLabel(okLabel);
      setConfirmDanger(isDanger);
      setConfirmScrimVisible(true);
      setConfirmVisible(true);
      confirmResolveRef.current = resolve;
    });
  }, []);

  const dismissConfirm = useCallback((val) => {
    setConfirmScrimVisible(false);
    setConfirmVisible(false);
    if (confirmResolveRef.current) {
      confirmResolveRef.current(val);
      confirmResolveRef.current = null;
    }
  }, []);

  // ── Editor enter/exit ──
  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  const enterEditor = useCallback(async () => {
    setIntroCardVisible(false);
    setScrimVisible(false);
    await delay(260);
    setFrameScrimVisible(true);
    setExitBtnVisible(true);
    setExitBtnOut(false);
    await delay(50);
    setUndoRedoVisible(true);
    setUndoRedoOut(false);
    await delay(40);
    setToolsCollapsed(false);
    toolsCollapsedRef.current = false;
    setToolsVisible(true);
    setToolsOut(false);
    clearTimeout(toolsCollapseTimerRef.current);
    toolsCollapseTimerRef.current = setTimeout(() => {
      setToolsCollapsed(true);
      toolsCollapsedRef.current = true;
    }, 2000);
    await delay(60);
    setBottomBarVisible(true);
    setBottomBarOut(false);
    setEditorVisible(true);
    if (canvasRef.current) canvasRef.current.classList.add('no-tool');
  }, []);

  const exitToIntro = useCallback(async () => {
    if (activeToolRef.current) exitToolMode();
    clearTimeout(toolsCollapseTimerRef.current);
    setToolsCollapsed(false);
    toolsCollapsedRef.current = false;
    await delay(180);
    setExitBtnVisible(false);
    setUndoRedoVisible(false);
    setToolsVisible(false);
    setBottomBarVisible(false);
    setFrameScrimVisible(false);
    await delay(280);
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height); /* transparent — checkerboard shows */
    mainUndoStackRef.current = [];
    mainRedoStackRef.current = [];
    toolUndoStackRef.current = [];
    toolRedoStackRef.current = [];
    mainUndoStackRef.current.push(canvas.toDataURL());
    syncHistoryBtns();
    await delay(100);
    setScrimVisible(true);
    setIntroCardVisible(true);
    setEditorVisible(false);
  }, [exitToolMode, syncHistoryBtns]);

  // ── Scope body layout to this page ──
  useEffect(() => {
    document.documentElement.style.cssText = 'height:100%;overflow:hidden;';
    document.body.classList.add('inviter-mode');
    // Prevent .screen from being scrolled (Blink can scroll overflow:clip parents
    // via focus events; this is defense-in-depth)
    const onScreenScroll = () => {
      const s = document.querySelector('.screen');
      if (s && s.scrollTop !== 0) s.scrollTop = 0;
    };
    document.querySelector('.screen')?.addEventListener('scroll', onScreenScroll, { passive: true });
    return () => {
      document.body.classList.remove('inviter-mode');
      document.documentElement.style.cssText = '';
      document.querySelector('.screen')?.removeEventListener('scroll', onScreenScroll);
    };
  }, []);

  // ── Main useEffect: canvas init + all event listeners ──
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;

    const sc = document.createElement('canvas');
    sc.width = canvas.width;
    sc.height = canvas.height;
    scratchCanvasRef.current = sc;
    scratchCtxRef.current = sc.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height); /* transparent — checkerboard shows through */
    mainUndoStackRef.current = [canvas.toDataURL()];
    syncHistoryBtns();

    setHandlePos(0.5);
    syncCursor();

    // Canvas mouse events
    const onMouseDown = (e) => {
      if (!activeToolRef.current) return;
      const p = getXY(e);
      if (activeToolRef.current === 'eraser' && eraserModeRef.current !== 'freehand') {
        shapeDraggingRef.current = true;
        shapeStartXRef.current = p.x; shapeStartYRef.current = p.y;
        shapePreviewDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } else {
        isDrawingRef.current = true; lastXRef.current = p.x; lastYRef.current = p.y;
        if (activeToolRef.current === 'eraser') {
          strokeBaseDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
          scratchCtxRef.current.clearRect(0, 0, sc.width, sc.height);
        }
        paintAt(p.x, p.y, p.x, p.y);
      }
    };

    const onMouseMove = (e) => {
      if (!activeToolRef.current) return;
      moveCursor(e.clientX, e.clientY);
      if (shapeDraggingRef.current) {
        const p = getXYFromClient(e.clientX, e.clientY);
        drawShapePreview(shapeStartXRef.current, shapeStartYRef.current, p.x, p.y);
      } else if (isDrawingRef.current) {
        const p = getXY(e);
        paintAt(p.x, p.y, lastXRef.current, lastYRef.current);
        lastXRef.current = p.x; lastYRef.current = p.y;
      }
    };

    const onMouseUp = (e) => {
      if (shapeDraggingRef.current) {
        const p = getXYFromClient(e.clientX, e.clientY);
        commitShape(shapeStartXRef.current, shapeStartYRef.current, p.x, p.y);
        shapeDraggingRef.current = false; pushHistory();
      } else if (isDrawingRef.current) {
        strokeBaseDataRef.current = null; pushHistory(); isDrawingRef.current = false;
      }
    };

    const onMouseLeave = () => {
      if (isDrawingRef.current) {
        strokeBaseDataRef.current = null; pushHistory(); isDrawingRef.current = false;
      }
      if (brushCursorRef.current) brushCursorRef.current.style.display = 'none';
    };

    const onMouseEnter = () => {
      if (activeToolRef.current && eraserModeRef.current === 'freehand' && brushCursorRef.current) {
        brushCursorRef.current.style.display = 'block';
      }
    };

    const onTouchStart = (e) => {
      if (!activeToolRef.current) return; e.preventDefault();
      const p = getXY(e);
      if (activeToolRef.current === 'eraser' && eraserModeRef.current !== 'freehand') {
        shapeDraggingRef.current = true;
        shapeStartXRef.current = p.x; shapeStartYRef.current = p.y;
        shapePreviewDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } else {
        isDrawingRef.current = true; lastXRef.current = p.x; lastYRef.current = p.y;
        if (activeToolRef.current === 'eraser') {
          strokeBaseDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
          scratchCtxRef.current.clearRect(0, 0, sc.width, sc.height);
        }
        paintAt(p.x, p.y, p.x, p.y);
      }
    };

    const onTouchMove = (e) => {
      if (!activeToolRef.current) return; e.preventDefault();
      if (shapeDraggingRef.current) {
        const t = e.touches[0], r = canvas.getBoundingClientRect();
        drawShapePreview(shapeStartXRef.current, shapeStartYRef.current,
          Math.max(0, Math.min(canvas.width, (t.clientX - r.left) * (canvas.width / r.width))),
          Math.max(0, Math.min(canvas.height, (t.clientY - r.top) * (canvas.height / r.height))));
      } else if (isDrawingRef.current) {
        const p = getXY(e);
        paintAt(p.x, p.y, lastXRef.current, lastYRef.current);
        lastXRef.current = p.x; lastYRef.current = p.y;
      }
    };

    const onTouchEnd = (e) => {
      if (shapeDraggingRef.current) {
        const t = e.changedTouches[0], r = canvas.getBoundingClientRect();
        commitShape(shapeStartXRef.current, shapeStartYRef.current,
          Math.max(0, Math.min(canvas.width, (t.clientX - r.left) * (canvas.width / r.width))),
          Math.max(0, Math.min(canvas.height, (t.clientY - r.top) * (canvas.height / r.height))));
        shapeDraggingRef.current = false; pushHistory();
      } else if (isDrawingRef.current) {
        strokeBaseDataRef.current = null; pushHistory(); isDrawingRef.current = false;
      }
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('mouseenter', onMouseEnter);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    // Global mouse events for shape dragging outside canvas
    const onDocMouseUp = (e) => {
      if (!shapeDraggingRef.current) return;
      const p = getXYFromClient(e.clientX, e.clientY);
      commitShape(shapeStartXRef.current, shapeStartYRef.current, p.x, p.y);
      shapeDraggingRef.current = false; pushHistory();
    };
    const onDocMouseMove = (e) => {
      if (!shapeDraggingRef.current) return;
      const p = getXYFromClient(e.clientX, e.clientY);
      drawShapePreview(shapeStartXRef.current, shapeStartYRef.current, p.x, p.y);
    };
    document.addEventListener('mouseup', onDocMouseUp);
    document.addEventListener('mousemove', onDocMouseMove);

    // Left panel track drag
    const panel = tmLeftPanelRef.current;
    const onPanelMouseEnter = () => expandLeftPanel();
    const onPanelMouseDown = (e) => {
      trackDraggingRef.current = true;
      applyTrackNorm(normFromClientY(e.clientY));
    };
    const onDocTrackMouseMove = (e) => {
      if (trackDraggingRef.current) applyTrackNorm(normFromClientY(e.clientY));
    };
    const onDocTrackMouseUp = () => { trackDraggingRef.current = false; };
    const onPanelTouchStart = (e) => {
      expandLeftPanel();
      trackDraggingRef.current = true;
      applyTrackNorm(normFromClientY(e.touches[0].clientY));
    };
    const onDocTouchMove = (e) => {
      if (trackDraggingRef.current) applyTrackNorm(normFromClientY(e.touches[0].clientY));
    };
    const onDocTouchEnd = () => { trackDraggingRef.current = false; };

    if (panel) {
      panel.addEventListener('mouseenter', onPanelMouseEnter);
      panel.addEventListener('mousedown', onPanelMouseDown);
      panel.addEventListener('touchstart', onPanelTouchStart, { passive: true });
    }
    document.addEventListener('mousemove', onDocTrackMouseMove);
    document.addEventListener('mouseup', onDocTrackMouseUp);
    document.addEventListener('touchmove', onDocTouchMove, { passive: true });
    document.addEventListener('touchend', onDocTouchEnd, { passive: true });

    // Sticker overlay click → deselect
    const overlay = stickerSys.stickerOverlayRef.current;
    if (overlay) {
      overlay.addEventListener('click', stickerSys.deselectAllStickers);
    }

    // Show intro card on mount
    setTimeout(() => {
      setScrimVisible(true);
      setIntroCardVisible(true);
    }, 400);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('mouseenter', onMouseEnter);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('mouseup', onDocMouseUp);
      document.removeEventListener('mousemove', onDocMouseMove);
      if (panel) {
        panel.removeEventListener('mouseenter', onPanelMouseEnter);
        panel.removeEventListener('mousedown', onPanelMouseDown);
        panel.removeEventListener('touchstart', onPanelTouchStart);
      }
      document.removeEventListener('mousemove', onDocTrackMouseMove);
      document.removeEventListener('mouseup', onDocTrackMouseUp);
      document.removeEventListener('touchmove', onDocTouchMove);
      document.removeEventListener('touchend', onDocTouchEnd);
      if (overlay) overlay.removeEventListener('click', stickerSys.deselectAllStickers);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recent tools tracking — must be defined before handlers that use it ──
  const addRecentTool = useCallback((toolId) => {
    setRecentTools(prev => {
      const filtered = prev.filter(id => id !== toolId);
      return [toolId, ...filtered].slice(0, 3);
    });
  }, []);

  // ── Handlers ──
  const handleToolDoodle = useCallback(() => {
    addRecentTool('doodle');
    if (activeToolRef.current === 'doodle') { exitToolMode(); return; }
    if (activeToolRef.current) exitToolMode();
    setTimeout(() => {
      enterToolMode('doodle');
    }, activeToolRef.current ? 120 : 0);
  }, [exitToolMode, enterToolMode, addRecentTool]);

  const handleToolEraser = useCallback(() => {
    addRecentTool('eraser');
    if (activeToolRef.current === 'eraser') { exitToolMode(); return; }
    if (activeToolRef.current) exitToolMode();
    setTimeout(() => {
      enterToolMode('eraser');
    }, activeToolRef.current ? 120 : 0);
  }, [exitToolMode, enterToolMode, addRecentTool]);

  const handleToolStickers = useCallback(() => {
    addRecentTool('stickers');
    if (activeToolRef.current) exitToolMode();
    setTimeout(stickerSys.openPanel, activeToolRef.current ? 120 : 0);
  }, [exitToolMode, stickerSys, addRecentTool]);

  const handleToolText = useCallback(() => {
    addRecentTool('text');
    if (activeToolRef.current) exitToolMode();
  }, [exitToolMode, addRecentTool]);

  const handleToolGallery = useCallback(() => {
    addRecentTool('gallery');
    if (activeToolRef.current) exitToolMode();
    setTimeout(() => {
      if (galleryInputRef.current) galleryInputRef.current.click();
    }, 50);
  }, [exitToolMode, addRecentTool]);

  const handleToolDownload = useCallback(() => {
    if (activeToolRef.current) exitToolMode();
    if (stickerSys.placedStickersRef.current.length > 0) {
      stickerSys.commitStickersToCanvas();
      pushHistory();
    }
    try {
      const dataURL = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      const name = (frameName.trim() || 'retake-frame').replace(/[^a-z0-9\-_]/gi, '-').toLowerCase();
      a.download = name + '.png';
      a.href = dataURL;
      a.click();
      showToast('Saved!');
    } catch(e) {
      showToast('Unable to save — try from a server');
    }
  }, [stickerSys, pushHistory, frameName, showToast]);

  // ── Chevron toggle (collapse ↔ expand) ──
  const handleToggleTools = useCallback((e) => {
    e.stopPropagation();
    if (toolsCollapsedRef.current) {
      // Expand
      setToolsCollapsed(false);
      toolsCollapsedRef.current = false;
      clearTimeout(toolsCollapseTimerRef.current);
      toolsCollapseTimerRef.current = setTimeout(() => {
        setToolsCollapsed(true);
        toolsCollapsedRef.current = true;
      }, 4000);
    } else {
      // Collapse
      clearTimeout(toolsCollapseTimerRef.current);
      setToolsCollapsed(true);
      toolsCollapsedRef.current = true;
    }
  }, []);

  const handleGalleryChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) { introPhotoFlowRef.current = false; return; }
    const url = URL.createObjectURL(file);
    const newImg = new Image();
    newImg.onload = async () => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      const W = canvas.width, H = canvas.height;
      const scale = Math.max(W / newImg.width, H / newImg.height);
      const sw = W / scale, sh = H / scale;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(newImg, (newImg.width-sw)/2, (newImg.height-sh)/2, sw, sh, 0, 0, W, H);
      mainUndoStackRef.current = [canvas.toDataURL()];
      mainRedoStackRef.current = [];
      syncHistoryBtns();
      URL.revokeObjectURL(url);
      if (introPhotoFlowRef.current) {
        introPhotoFlowRef.current = false;
        await enterEditor();
      }
    };
    newImg.src = url;
    e.target.value = '';
  }, [syncHistoryBtns, enterEditor]);

  const handleChoosePhoto = useCallback(() => {
    introPhotoFlowRef.current = true;
    if (galleryInputRef.current) galleryInputRef.current.click();
  }, []);

  const handleStartBlank = useCallback(async () => {
    introPhotoFlowRef.current = false;
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height); /* transparent — checkerboard shows */
    mainUndoStackRef.current = [canvas.toDataURL()];
    mainRedoStackRef.current = [];
    syncHistoryBtns();
    await enterEditor();
  }, [syncHistoryBtns, enterEditor]);

  const handleExitBtn = useCallback(async () => {
    if (mainUndoStackRef.current.length > 1) {
      const ok = await showConfirm('Discard this frame?', 'Discard', true, 'Keep editing');
      if (!ok) return;
    }
    await exitToIntro();
  }, [showConfirm, exitToIntro]);

  const handleShare = useCallback(async () => {
    const name = frameName || 'My frame';
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: `Join my Retake frame: ${name}`, url: location.href });
      } catch(e) { /* cancelled */ }
    } else {
      showToast('Sharing not supported on this device');
    }
  }, [frameName, showToast]);

  const handleCopyLink = useCallback(() => {
    const code = 'RTKE-' + Math.floor(1000 + Math.random() * 9000);
    setShareCode(code);
    setSharePanelVisible(true);
    setScrimVisible(true);
  }, []);

  const handleCopyCode = useCallback(() => {
    const link = `https://retake.app/join/${shareCode}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    showToast('Invite link copied!');
  }, [shareCode, showToast]);

  const openEditName = useCallback(() => {
    setEditNameInputValue(frameName);
    setEditNameVisible(true);
    setScrimVisible(true);
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => {
      const inp = document.getElementById('editNameInput');
      if (inp) { inp.focus({ preventScroll: true }); window.scrollTo(0, 0); }
    }, 60);
  }, [frameName]);

  const saveEditName = useCallback(() => {
    if (editNameInputValue.trim()) setFrameName(editNameInputValue.trim());
    setEditNameVisible(false);
    setScrimVisible(false);
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    window.scrollTo(0, 0);
  }, [editNameInputValue]);

  const handleScrimClick = useCallback(() => {
    if (editNameVisible) { saveEditName(); return; }
    if (sharePanelVisible) { setSharePanelVisible(false); setScrimVisible(false); }
    if (stickerSys.stickerPanelVisible) { stickerSys.closePanel(); }
  }, [editNameVisible, saveEditName, sharePanelVisible, stickerSys]);

  const handleEraserOpacityInput = useCallback((e) => {
    eraserOpacityRef.current = parseInt(e.target.value) / 100;
    const val = e.target.value;
    e.target.style.setProperty('--fill', val + '%');
    document.getElementById('eraserOpacityVal').textContent = val + '%';
  }, []);

  const handleSwatchClick = useCallback((color) => {
    doodleColorRef.current = color;
    setDoodleColor(color);
    syncCursor();
  }, [syncCursor]);

  const handlePenTypeClick = useCallback((type) => {
    penTypeRef.current = type;
    setPenType(type);
  }, []);

  const handleEraserShapeClick = useCallback((shape) => {
    eraserModeRef.current = shape;
    setEraserMode(shape);
    if (shape === 'freehand') {
      if (canvasRef.current) canvasRef.current.style.cursor = 'none';
    } else {
      if (canvasRef.current) canvasRef.current.style.cursor = 'crosshair';
      if (brushCursorRef.current) brushCursorRef.current.style.display = 'none';
    }
  }, []);

  const handleToolMouseEnter = useCallback(() => {
    clearTimeout(labelPressTimerRef.current);
    labelPressTimerRef.current = setTimeout(() => setLabelsExpanded(true), 800);
  }, []);

  const handleToolMouseLeave = useCallback(() => {
    clearTimeout(labelPressTimerRef.current);
    clearTimeout(labelCollapseTimerRef.current);
    labelCollapseTimerRef.current = setTimeout(() => setLabelsExpanded(false), 500);
  }, []);

  return (
    <div className="screen" id="screen">

      {/* Frame canvas */}
      <div id="frameContainer" ref={frameElRef}>
        <div id="checkerBg"></div>
        <canvas id="editCanvas" ref={canvasRef} width="414" height="750"
          className="no-tool" />
        {/* Brush cursor — must be inside frameContainer so absolute positioning is relative to it */}
        <div id="brushCursor" ref={brushCursorRef}>
          <svg id="brushCursorSvg" ref={brushCursorSvgRef} viewBox="-20 -20 40 40" fill="none">
            <circle id="brushCursorCircle" ref={brushCursorCircleRef} cx="0" cy="0" r="14"
              fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.8)"
              strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
        </div>
      </div>

      <div id="frameScrim" className={frameScrimVisible ? 'visible' : ''}></div>

      {/* × Exit */}
      <button
        className={`s6-exit-btn${exitBtnVisible ? ' visible' : ''}${exitBtnOut ? ' out' : ''}`}
        id="btnExit" aria-label="Back"
        onClick={handleExitBtn}
      >
        <svg width="26" height="26" viewBox="0 0 22 22" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="4" y1="4" x2="18" y2="18" /><line x1="18" y1="4" x2="4" y2="18" />
        </svg>
      </button>

      {/* Undo/Redo cluster */}
      <div id="undoRedoCluster"
        className={`${undoRedoVisible ? 'visible' : ''}${undoRedoOut ? ' out' : ''}`}>
        <button className="history-btn" id="btnUndo" aria-label="Undo"
          disabled={undoBtnDisabled} onClick={mainUndo}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" /><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
          </svg>
        </button>
        <button className="history-btn" id="btnRedo" aria-label="Redo"
          disabled={redoBtnDisabled} onClick={mainRedo}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13" />
          </svg>
        </button>
      </div>

      {/* Right vertical toolbar — dynamic order, recent tools first */}
      <div
        className={`s6-tools${toolsVisible ? ' visible' : ''}${toolsOut ? ' out' : ''}${toolsCollapsed ? ' tools-collapsed' : ''}${labelsExpanded ? ' labels-expanded' : ''}`}
        id="s6Tools"
      >
        {orderedToolIds.map((toolId, index) => {
          const hidden = toolsCollapsed && index >= 3;
          const cls = `s6-tool-btn${hidden ? ' btn-hidden' : ''}`;
          switch (toolId) {
            case 'text': return (
              <button key="text" className={`${cls}${activeTool === 'text' ? ' active' : ''}`}
                id="btnToolText" aria-label="Text"
                onClick={handleToolText}
                onMouseEnter={handleToolMouseEnter} onMouseLeave={handleToolMouseLeave}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="5" x2="20" y2="5" /><line x1="12" y1="5" x2="12" y2="19" /><line x1="9" y1="19" x2="15" y2="19" />
                </svg>
                <span className="tool-label">Text</span>
              </button>
            );
            case 'stickers': return (
              <button key="stickers" className={cls} id="btnToolStickers" aria-label="Stickers"
                onClick={handleToolStickers}
                onMouseEnter={handleToolMouseEnter} onMouseLeave={handleToolMouseLeave}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <defs><mask id="smileyMask"><rect width="24" height="24" fill="white" /><circle cx="10" cy="10" r="1.5" fill="black" /><circle cx="16" cy="10" r="1.5" fill="black" /><path d="M9 14.5 Q13 18 17 14.5" stroke="black" strokeWidth="2" strokeLinecap="round" fill="none" /></mask></defs>
                  <circle cx="13" cy="13" r="9.5" fill="white" mask="url(#smileyMask)" />
                </svg>
                <span className="tool-label">Stickers</span>
              </button>
            );
            case 'gallery': return (
              <button key="gallery" className={cls} id="btnToolGallery" aria-label="Photo"
                onClick={handleToolGallery}
                onMouseEnter={handleToolMouseEnter} onMouseLeave={handleToolMouseLeave}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <defs><clipPath id="photoClip"><rect x="3" y="4" width="18" height="16" rx="2" /></clipPath></defs>
                  <g clipPath="url(#photoClip)" fill="white"><circle cx="8.5" cy="9" r="1.8" /><path d="M3 20 L9 13 L12 16.5 L15.5 12 L21 20 Z" /></g>
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="white" strokeWidth="1.5" fill="none" />
                </svg>
                <span className="tool-label">Photo</span>
              </button>
            );
            case 'doodle': return (
              <button key="doodle" className={`${cls}${activeTool === 'doodle' ? ' active' : ''}`}
                id="btnToolDoodle" aria-label="Draw"
                onClick={handleToolDoodle}
                onMouseEnter={handleToolMouseEnter} onMouseLeave={handleToolMouseLeave}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" /><line x1="15" y1="5" x2="19" y2="9" />
                </svg>
                <span className="tool-label">Draw</span>
              </button>
            );
            case 'eraser': return (
              <button key="eraser" className={`${cls}${activeTool === 'eraser' ? ' active' : ''}`}
                id="btnToolEraser" aria-label="Eraser"
                onClick={handleToolEraser}
                onMouseEnter={handleToolMouseEnter} onMouseLeave={handleToolMouseLeave}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <defs><clipPath id="circleClip"><circle cx="12" cy="12" r="10" /></clipPath></defs>
                  <rect x="2" y="2" width="5" height="5" fill="#c0c0c0" clipPath="url(#circleClip)" /><rect x="7" y="2" width="5" height="5" fill="white" clipPath="url(#circleClip)" /><rect x="12" y="2" width="5" height="5" fill="#c0c0c0" clipPath="url(#circleClip)" /><rect x="17" y="2" width="5" height="5" fill="white" clipPath="url(#circleClip)" />
                  <rect x="2" y="7" width="5" height="5" fill="white" clipPath="url(#circleClip)" /><rect x="7" y="7" width="5" height="5" fill="#c0c0c0" clipPath="url(#circleClip)" /><rect x="12" y="7" width="5" height="5" fill="white" clipPath="url(#circleClip)" /><rect x="17" y="7" width="5" height="5" fill="#c0c0c0" clipPath="url(#circleClip)" />
                  <rect x="2" y="12" width="5" height="5" fill="#c0c0c0" clipPath="url(#circleClip)" /><rect x="7" y="12" width="5" height="5" fill="white" clipPath="url(#circleClip)" /><rect x="12" y="12" width="5" height="5" fill="#c0c0c0" clipPath="url(#circleClip)" /><rect x="17" y="12" width="5" height="5" fill="white" clipPath="url(#circleClip)" />
                  <rect x="2" y="17" width="5" height="5" fill="white" clipPath="url(#circleClip)" /><rect x="7" y="17" width="5" height="5" fill="#c0c0c0" clipPath="url(#circleClip)" /><rect x="12" y="17" width="5" height="5" fill="white" clipPath="url(#circleClip)" /><rect x="17" y="17" width="5" height="5" fill="#c0c0c0" clipPath="url(#circleClip)" />
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                </svg>
                <span className="tool-label">Eraser</span>
              </button>
            );
            case 'download': return (
              <button key="download" className={cls} id="btnToolDownload" aria-label="Download"
                onClick={handleToolDownload}
                onMouseEnter={handleToolMouseEnter} onMouseLeave={handleToolMouseLeave}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v11" /><polyline points="8 10 12 14 16 10" /><line x1="5" y1="19" x2="19" y2="19" />
                </svg>
                <span className="tool-label">Save</span>
              </button>
            );
            default: return null;
          }
        })}

        {/* Flat chevron — collapses/expands the pill */}
        <button className="s6-tools-chevron" aria-label="Toggle toolbar" onClick={handleToggleTools}>
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 1 7 7 13 1" />
          </svg>
        </button>
      </div>

      {/* Main bottom bar */}
      <input type="file" id="galleryInput" ref={galleryInputRef} accept="image/*"
        style={{ display: 'none' }} onChange={handleGalleryChange} />
      <div className={`s6-bottom-bar${bottomBarVisible ? ' visible' : ''}${bottomBarOut ? ' out' : ''}`}
        id="s6BottomBar">
        <button className="s6-circle-btn" id="btnGallery" aria-label="Change photo"
          onClick={handleToolGallery}></button>
        <button className="s6-frame-title-btn" id="btnFrameName" aria-label="Edit frame name"
          onClick={openEditName}>
          <span id="frameNameDisplay">{frameName}</span>
        </button>
        <button className="s6-send-btn" id="btnShare" aria-label="Share"
          onClick={handleShare}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <polygon points="22 2 15 22 11 13 2 9 22 2" fill="#1A1A2E" />
          </svg>
        </button>
        <button className="s6-circle-btn" id="btnCopyLink" aria-label="Copy invite link"
          onClick={handleCopyLink}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        </button>
      </div>

      {/* ── Tool-mode shared UI (undo/redo, Done, left size panel, pen bar) ── */}
      <DrawingToolOverlays
        tmLeftPanelRef={tmLeftPanelRef}
        tmSizeHandleRef={tmSizeHandleRef}
        tmIn={tmIn}
        tmLeftIn={tmLeftIn}
        tmPenBarIn={tmBarMode === 'doodle'}
        doodleColor={doodleColor}
        penType={penType}
        tmUndoBtnDisabled={tmUndoBtnDisabled}
        tmRedoBtnDisabled={tmRedoBtnDisabled}
        onDone={exitToolMode}
        onUndo={toolUndo}
        onRedo={toolRedo}
        onSwatchClick={handleSwatchClick}
        onPenTypeClick={handlePenTypeClick}
      />

      {/* Eraser bar — InviterPage-specific (InviteePage doesn't have an eraser tool) */}
      <div id="tmEraserBar" className={tmBarMode === 'eraser' ? 'tm-in' : ''}>
        <div className="eraser-shapes">
          <button className={`eraser-shape-btn${eraserMode === 'freehand' ? ' active' : ''}`}
            data-shape="freehand" title="Freehand"
            onClick={() => handleEraserShapeClick('freehand')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20 Q8 8 12 14 Q16 20 20 6" />
            </svg>
          </button>
          <button className={`eraser-shape-btn${eraserMode === 'circle' ? ' active' : ''}`}
            data-shape="circle" title="Circle"
            onClick={() => handleEraserShapeClick('circle')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <circle cx="12" cy="12" r="8" />
            </svg>
          </button>
          <button className={`eraser-shape-btn${eraserMode === 'rect' ? ' active' : ''}`}
            data-shape="rect" title="Rectangle"
            onClick={() => handleEraserShapeClick('rect')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinejoin="round">
              <rect x="4" y="5" width="16" height="14" rx="2" />
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
          onInput={handleEraserOpacityInput} />
        <span className="tm-val" id="eraserOpacityVal">100%</span>
      </div>

      {/* Watermark */}
      <p className="watermark">Made with Retake!</p>

      {/* Toast */}
      <div className={`s6-toast${toastVisible ? ' visible' : ''}`} id="toast">{toastMsg}</div>

      {/* Edit frame name popup */}
      <div className={`share-pop${editNameVisible ? ' visible' : ''}`} id="editNamePop">
        <p className="s7-pop-title">Name your frame</p>
        <div className="edit-name-field">
          <input className="edit-name-input" id="editNameInput" type="text"
            placeholder="what's this frame called?" maxLength="32"
            autoComplete="off" autoCorrect="off" spellCheck="false"
            value={editNameInputValue}
            onChange={e => setEditNameInputValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveEditName(); }} />
        </div>
        <button className="edit-name-save" id="btnEditNameDone" onClick={saveEditName}>Save</button>
      </div>

      {/* Share popup */}
      <div className={`share-pop${sharePanelVisible ? ' visible' : ''}`} id="sharePop">
        <div>
          <p className="s7-pop-title">Share your frame!</p>
          <p className="s7-pop-dim">Invite a friend</p>
        </div>
        <p className="s7-pop-subtitle">Send them this code — they'll step right into your frame and take a photo</p>
        <div className="s7-pop-code-row">
          <span className="s7-pop-code" id="shareCode">{shareCode}</span>
          <button className="s7-pop-copy-btn" id="btnCopyCode" aria-label="Copy link"
            onClick={handleCopyCode}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrim */}
      <div className={`scrim${scrimVisible ? ' visible' : ''}`} id="scrim"
        onClick={handleScrimClick}></div>

      {/* Intro card */}
      <div className={`invite-card${introCardVisible ? ' visible' : ''}`} id="introCard">
        <div className="app-icon">R!</div>
        <div className="card-content">
          <div className="card-text">
            <span className="card-username">Make a frame,</span>
            <span className="card-subtitle">share it.</span>
          </div>
          <p className="card-body">Leave spaces — your friend fills them with their camera.</p>
          <div className="card-buttons" style={{ flexDirection: 'column', gap: '8px' }}>
            <button className="btn btn-primary btn-photo" id="btnChoosePhoto"
              onClick={handleChoosePhoto}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#F0E84A' }}>
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Pick a photo
            </button>
            <button className="btn btn-secondary btn-blank" id="btnStartBlank"
              onClick={handleStartBlank}>Start with blank canvas</button>
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        confirmScrimVisible={confirmScrimVisible}
        confirmVisible={confirmVisible}
        confirmMsg={confirmMsg}
        confirmOkLabel={confirmOkLabel}
        confirmDanger={confirmDanger}
        cancelLabel="Cancel"
        onConfirm={() => dismissConfirm(true)}
        onCancel={() => dismissConfirm(false)}
      />

      {/* Sticker panel + new sticker screen + overlay + file input */}
      <StickerPanel sys={stickerSys} />

    </div>
  );
}
