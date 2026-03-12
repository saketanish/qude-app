import React, { useEffect } from 'react';
import { useStore } from './store';
import Login from './pages/Login';
import Scanner from './pages/Scanner';

function LoadingScreen() {
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', gap: 20,
    }}>
      <div style={{ fontSize: 52 }}>🚪</div>
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 24, fontWeight: 800, color: '#00e676',
        letterSpacing: 3, textTransform: 'uppercase',
      }}>GATE SCANNER</div>
      <div style={{
        width: 200, height: 3, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', background: '#00e676', borderRadius: 2,
          animation: 'loadBar 1.5s ease-in-out infinite',
        }} />
      </div>
      <style>{`
        @keyframes loadBar {
          0%   { width: 0%;   margin-left: 0; }
          50%  { width: 100%; margin-left: 0; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, init } = useStore();

  useEffect(() => { init(); }, []);

  if (isLoading) return <LoadingScreen />;
  return isAuthenticated ? <Scanner /> : <Login />;
}
