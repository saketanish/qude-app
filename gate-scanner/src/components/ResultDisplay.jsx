import React, { useEffect, useRef } from 'react';
import { C } from '../utils/constants';

const RESULT_CONFIG = {
  success: {
    color: C.allow, bg: C.allowBg, glow: C.allowGlow,
    icon: '✓', headline: 'ENTRY ALLOWED',
    border: C.allow,
  },
  not_called: {
    color: C.warn, bg: C.warnBg, glow: 'rgba(255,145,0,0.2)',
    icon: '⏳', headline: 'NOT YET CALLED',
    subtext: 'Ask devotee to wait for their notification',
    border: C.warn,
  },
  already_used: {
    color: C.warn, bg: C.warnBg, glow: 'rgba(255,145,0,0.2)',
    icon: '⚠', headline: 'ALREADY ENTERED',
    subtext: 'This token has already been used',
    border: C.warn,
  },
  expired: {
    color: C.reject, bg: C.rejectBg, glow: C.rejectGlow,
    icon: '✕', headline: 'TOKEN EXPIRED',
    subtext: 'Ask devotee to rejoin the queue',
    border: C.reject,
  },
  invalid: {
    color: C.reject, bg: C.rejectBg, glow: C.rejectGlow,
    icon: '✕', headline: 'INVALID QR CODE',
    subtext: 'Not a valid QueuePass token',
    border: C.reject,
  },
};

export default function ResultDisplay({ result, onDismiss }) {
  const conf = RESULT_CONFIG[result?.result] || RESULT_CONFIG.invalid;
  const isAllowed = result?.result === 'success';
  const token = result?.token;

  // Play audio feedback
  useEffect(() => {
    if (!result) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (isAllowed) {
        // Pleasant two-tone chime
        [523, 659].forEach((freq, i) => {
          const osc  = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + i * 0.15 + 0.4);
        });
      } else {
        // Low buzz for reject
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 180;
        osc.type = 'square';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(); osc.stop(ctx.currentTime + 0.5);
      }
    } catch { /* audio not available */ }
  }, [result]);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: isAllowed
        ? `radial-gradient(ellipse at 50% 40%, rgba(0,230,118,0.12) 0%, ${C.base} 70%)`
        : `radial-gradient(ellipse at 50% 40%, rgba(255,23,68,0.12) 0%, ${C.base} 70%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, animation: 'resultIn .25s cubic-bezier(0.34,1.56,0.64,1)',
      cursor: 'pointer',
    }} onClick={onDismiss}>
      <style>{`
        @keyframes resultIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes iconPop {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Giant status icon */}
      <div style={{
        width: 140, height: 140, borderRadius: '50%',
        background: conf.bg,
        border: `3px solid ${conf.color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 72, color: conf.color, fontWeight: 900,
        boxShadow: `0 0 60px ${conf.glow}, 0 0 120px ${conf.glow}`,
        animation: 'iconPop .4s cubic-bezier(0.34,1.56,0.64,1) both',
        marginBottom: 28,
        fontFamily: "'Barlow Condensed', sans-serif",
        lineHeight: 1,
      }}>
        {conf.icon}
      </div>

      {/* Headline */}
      <h1 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 52, fontWeight: 900,
        color: conf.color, letterSpacing: 2,
        textTransform: 'uppercase', textAlign: 'center',
        textShadow: `0 0 30px ${conf.glow}`,
        lineHeight: 1.1, marginBottom: 16,
      }}>{conf.headline}</h1>

      {/* Token info */}
      {token && (
        <div style={{
          background: C.elevated, border: `1px solid ${conf.color}30`,
          borderRadius: 14, padding: '18px 28px', marginBottom: 18,
          textAlign: 'center', minWidth: 260,
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 48, fontWeight: 800, color: conf.color, lineHeight: 1,
          }}>
            #{String(token.tokenNumber).padStart(3, '0')}
          </div>
          {token.userName && (
            <div style={{ fontSize: 18, fontWeight: 600, color: C.text, marginTop: 6 }}>
              {token.userName}
            </div>
          )}
          {token.queueName && (
            <div style={{ fontSize: 14, color: C.textSec, marginTop: 3 }}>
              {token.queueName}
            </div>
          )}
        </div>
      )}

      {/* Sub message */}
      {conf.subtext && (
        <p style={{
          fontSize: 16, color: C.textSec, textAlign: 'center',
          maxWidth: 320, lineHeight: 1.5, marginBottom: 16,
        }}>{conf.subtext}</p>
      )}

      {/* Tap to dismiss hint */}
      <p style={{
        fontSize: 13, color: C.textMuted, marginTop: 8,
        animation: 'glowPulse 2s ease-in-out infinite',
      }}>Tap anywhere or wait to scan next</p>
    </div>
  );
}
