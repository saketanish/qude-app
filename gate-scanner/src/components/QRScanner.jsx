import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { C, SCAN_COOLDOWN_MS } from '../utils/constants';

export default function QRScanner({ onScan, active }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const rafRef     = useRef(null);
  const lastScan   = useRef(0);
  const streamRef  = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError]             = useState('');
  const [torchOn, setTorchOn]         = useState(false);

  // Start camera
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Pause/resume scanning
  useEffect(() => {
    if (active) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraReady(true);
        rafRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions and reload.');
    }
  };

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const newVal = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: newVal }] });
      setTorchOn(newVal);
    } catch { /* torch not supported */ }
  };

  const tick = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const now  = Date.now();
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(data.data, data.width, data.height, { inversionAttempts: 'dontInvert' });

    if (code && code.data && now - lastScan.current > SCAN_COOLDOWN_MS) {
      lastScan.current = now;
      onScan(code.data);
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [onScan]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', borderRadius: 16, overflow: 'hidden' }}>
      {/* Video feed */}
      <video
        ref={videoRef}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraReady ? 'block' : 'none' }}
        playsInline muted
      />
      {/* Hidden canvas for QR decode */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Loading state */}
      {!cameraReady && !error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: C.elevated }}>
          <div style={{ fontSize: 48 }}>📷</div>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: 1 }}>
            Initialising Camera…
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: C.elevated, padding: 32 }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: C.reject, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>
            Camera Error
          </p>
          <p style={{ fontSize: 14, color: C.textSec, textAlign: 'center', lineHeight: 1.6 }}>{error}</p>
          <button onClick={startCamera} style={{
            background: C.allow, color: '#000', border: 'none', borderRadius: 8,
            padding: '10px 24px', cursor: 'pointer',
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, textTransform: 'uppercase',
          }}>RETRY</button>
        </div>
      )}

      {/* Scan overlay — only shown when active & ready */}
      {cameraReady && active && (
        <>
          {/* Dark vignette corners */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 60% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)',
            pointerEvents: 'none',
          }} />

          {/* Scan frame */}
          <ScanFrame />

          {/* Torch button */}
          <button
            onClick={toggleTorch}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: torchOn ? C.amber : 'rgba(0,0,0,0.5)',
              border: `1px solid ${torchOn ? C.amber : 'rgba(255,255,255,0.2)'}`,
              borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
              color: torchOn ? '#000' : '#fff', fontSize: 13, fontWeight: 600,
              fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 0.5,
              transition: 'all .2s',
            }}
          >{torchOn ? '🔦 ON' : '💡 TORCH'}</button>
        </>
      )}
    </div>
  );
}

// Animated scan frame with corner brackets + sweeping line
function ScanFrame() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{ position: 'relative', width: 260, height: 260 }}>
        {/* Corners */}
        {[
          { top: 0, left: 0,   borderTop: true,  borderLeft: true  },
          { top: 0, right: 0,  borderTop: true,  borderRight: true },
          { bottom: 0, left: 0,  borderBottom: true, borderLeft: true  },
          { bottom: 0, right: 0, borderBottom: true, borderRight: true },
        ].map((c, i) => {
          const style = {
            position: 'absolute', width: 36, height: 36,
            borderColor: C.allow, borderStyle: 'solid', borderWidth: 0,
          };
          if (c.top !== undefined)    { style.top    = c.top;    }
          if (c.bottom !== undefined) { style.bottom = c.bottom; }
          if (c.left !== undefined)   { style.left   = c.left;   }
          if (c.right !== undefined)  { style.right  = c.right;  }
          if (c.borderTop)    style.borderTopWidth    = 3;
          if (c.borderBottom) style.borderBottomWidth = 3;
          if (c.borderLeft)   style.borderLeftWidth   = 3;
          if (c.borderRight)  style.borderRightWidth  = 3;
          return <div key={i} style={style} />;
        })}

        {/* Sweeping scan line */}
        <div style={{
          position: 'absolute', left: 8, right: 8, height: 2,
          background: `linear-gradient(90deg, transparent, ${C.allow}, transparent)`,
          borderRadius: 1,
          animation: 'scanLine 2s ease-in-out infinite',
          boxShadow: `0 0 8px ${C.allowGlow}`,
        }} />

        {/* Corner glow dots */}
        {[
          { top: -2, left: -2 }, { top: -2, right: -2 },
          { bottom: -2, left: -2 }, { bottom: -2, right: -2 },
        ].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute', width: 7, height: 7, borderRadius: '50%',
            background: C.allow, ...pos,
            boxShadow: `0 0 8px ${C.allow}`,
            animation: `glowPulse 2s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes scanLine {
          0%   { top: 8px;  opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 244px; opacity: 0; }
        }
        @keyframes glowPulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
