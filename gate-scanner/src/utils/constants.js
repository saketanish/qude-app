export const C = {
  // Base — near-black, industrial
  base:      '#0a0a0a',
  surface:   '#111111',
  elevated:  '#1a1a1a',
  border:    '#2a2a2a',
  borderHi:  '#3a3a3a',

  // Result colors — BIG, high-contrast
  allow:     '#00e676',   // bright green — ENTER
  allowDim:  '#00c853',
  allowBg:   'rgba(0,230,118,0.08)',
  allowGlow: 'rgba(0,230,118,0.25)',

  reject:    '#ff1744',   // vivid red — STOP
  rejectDim: '#d50000',
  rejectBg:  'rgba(255,23,68,0.08)',
  rejectGlow:'rgba(255,23,68,0.25)',

  warn:      '#ff9100',   // orange — wait
  warnBg:    'rgba(255,145,0,0.08)',

  amber:     '#ffab40',   // accent
  amberDim:  'rgba(255,171,64,0.15)',

  text:      '#f0f0f0',
  textSec:   '#888888',
  textMuted: '#444444',
};

export const API_BASE   = import.meta.env.VITE_API_URL    || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// How long to show result before resetting (ms)
export const RESULT_DISPLAY_MS = 3500;
export const SCAN_COOLDOWN_MS  = 1200;
