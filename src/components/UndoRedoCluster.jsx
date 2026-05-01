import React from 'react';

export default function UndoRedoCluster({ visible, out, undoDisabled, redoDisabled, onUndo, onRedo }) {
  return (
    <div id="undoRedoCluster" className={`${visible ? 'visible' : ''}${out ? ' out' : ''}`}>
      <button className="history-btn" id="btnUndo" aria-label="Undo"
        disabled={undoDisabled} onClick={onUndo}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
        </svg>
      </button>
      <button className="history-btn" id="btnRedo" aria-label="Redo"
        disabled={redoDisabled} onClick={onRedo}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13" />
        </svg>
      </button>
    </div>
  );
}
