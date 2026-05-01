import React from 'react';

export default function ExitButton({ visible, out, onClick }) {
  return (
    <button
      className={`s6-exit-btn${visible ? ' visible' : ''}${out ? ' out' : ''}`}
      id="btnExit"
      aria-label="Back"
      onClick={onClick}
    >
      <svg width="26" height="26" viewBox="0 0 22 22" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <line x1="4" y1="4" x2="18" y2="18" />
        <line x1="18" y1="4" x2="4" y2="18" />
      </svg>
    </button>
  );
}
