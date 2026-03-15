import React, { useCallback, useEffect, useRef, useState } from 'react';
import QRScanner from '../components/QRScanner';
import ResultDisplay from '../components/ResultDisplay';
import SessionStats from '../components/SessionStats';
import ManualEntry from '../components/ManualEntry';
import { useStore } from '../store';
import { gateService } from '../services/api';
import { C, RESULT_DISPLAY_MS } from '../utils/constants';
import { format } from 'date-fns';

export default function Scanner() {
  const { user, logout, scanResult, setScanResult, clearResult, scanCount, entryCount, rejectCount, logs } = useStore();
  const [scanning, setScanning]     = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const dismissTimer = useRef(null);

  // Auto-dismiss result and re-enable scanner
  useEffect(() => {
    if (!scanResult) return;
    setScanning(false);
    clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => {
      clearResult();
      setScanning(true);
    }, RESULT_DISPLAY_MS);
    return () => clearTimeout(dismissTimer.current);
  }, [scanResult]);

  const handleScan = useCallback(async (qrData) => {
    if (processing || !scanning) return;
    setProcessing(true);
    setScanning(false);
    try {
      const result = await gateService.scanQR(qrData);
      setScanResult(result);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Network error. Check connection.';
      setScanResult({ result: 'invalid', allowed: false, message: msg, token: null });
    } finally {
      setProcessing(false);
    }
  }, [processing, scanning]);

  const handleDismiss = () => {
    clearTimeout(dismissTimer.current);
    clearResult();
    setScanning(true);
  };

  const now = new Date();

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: C.base, overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', background: C.surface,
        borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      }}>
        {/* Left: brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🚪</span>
          <div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 18, fontWeight: 800, letterSpacing: 1,
              textTransform: 'uppercase', color: C.text,
            }}>Gate Scanner</div>
            <div style={{ fontSize: 11, color: C.textSec }}>Qude Access Control</div>
          </div>
        </div>

        {/* Centre: live status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: scanning ? C.allow : processing ? C.warn : C.reject,
            boxShadow: `0 0 8px ${scanning ? C.allow : processing ? C.warn : C.reject}`,
            animation: scanning ? 'pulse 2s ease-in-out infinite' : 'none',
          }} />
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 14, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            color: scanning ? C.allow : processing ? C.warn : C.textSec,
          }}>
            {scanning ? 'SCANNING' : processing ? 'PROCESSING…' : 'STANDBY'}
          </span>
        </div>

        {/* Right: time */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: 1,
          }}>{format(now, 'HH:mm')}</div>
          <div style={{ fontSize: 11, color: C.textSec }}>{format(now, 'dd MMM yyyy')}</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Scanner panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, gap: 16, overflow: 'hidden' }}>

          {/* Camera area */}
          <div style={{ flex: 1, position: 'relative', borderRadius: 16, overflow: 'hidden', minHeight: 0 }}>
            <QRScanner onScan={handleScan} active={scanning} />

            {/* Processing overlay */}
            {processing && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.75)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 16,
                backdropFilter: 'blur(4px)',
              }}>
                <Spinner />
                <p style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 22, fontWeight: 700, color: C.amber,
                  letterSpacing: 2, textTransform: 'uppercase',
                }}>VERIFYING…</p>
              </div>
            )}

            {/* Result overlay */}
            {scanResult && !processing && (
              <ResultDisplay result={scanResult} onDismiss={handleDismiss} />
            )}
          </div>

          {/* Bottom controls */}
          <div style={{ flexShrink: 0 }}>
            {/* Instruction bar */}
            {!scanResult && !processing && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '10px 20px', background: C.elevated,
                borderRadius: 12, border: `1px solid ${C.border}`,
                marginBottom: 12,
              }}>
                <span style={{ fontSize: 20 }}>📱</span>
                <p style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 16, fontWeight: 600, color: C.textSec,
                  letterSpacing: 0.5,
                }}>
                  {scanning
                    ? 'HOLD DEVOTEE\'S QR CODE IN FRONT OF CAMERA'
                    : 'READY FOR NEXT SCAN'}
                </p>
              </div>
            )}

            {/* Manual entry toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setShowManual(!showManual)}
                style={{
                  background: 'none', border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
                  color: C.textSec, fontSize: 12,
                  fontFamily: "'Barlow', sans-serif", fontWeight: 500,
                  transition: 'all .15s', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >⌨ Manual</button>
              {showManual && (
                <div style={{ flex: 1 }}>
                  <ManualEntry onSubmit={(code) => { setShowManual(false); handleScan(code); }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats sidebar */}
        <SessionStats
          scanCount={scanCount}
          entryCount={entryCount}
          rejectCount={rejectCount}
          logs={logs}
          user={user}
          onLogout={logout}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 4px ${C.allow}; }
          50%      { box-shadow: 0 0 12px ${C.allow}; }
        }
      `}</style>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 48, height: 48, borderRadius: '50%',
      border: `3px solid ${C.amberDim}`,
      borderTopColor: C.amber,
      animation: 'spin .7s linear infinite',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
