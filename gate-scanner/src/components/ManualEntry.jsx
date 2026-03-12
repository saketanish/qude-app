import React, { useState } from 'react';
import { C } from '../utils/constants';

export default function ManualEntry({ onSubmit }) {
  const [code, setCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.trim()) { onSubmit(code.trim()); setCode(''); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter QR code manually…"
        style={{
          flex: 1, background: C.elevated, border: `1.5px solid ${C.border}`,
          borderRadius: 10, color: C.text, fontFamily: "'Barlow', sans-serif",
          fontSize: 13, padding: '10px 14px', outline: 'none',
        }}
        onFocus={(e) => e.target.style.borderColor = C.amber}
        onBlur={(e)  => e.target.style.borderColor = C.border}
      />
      <button type="submit" style={{
        background: C.amberDim, border: `1px solid ${C.amber}40`,
        borderRadius: 10, padding: '10px 18px', cursor: 'pointer',
        color: C.amber, fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 14, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
        transition: 'all .15s', whiteSpace: 'nowrap',
      }}>VERIFY</button>
    </form>
  );
}
