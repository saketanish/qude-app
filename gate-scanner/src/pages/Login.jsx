import React, { useState } from 'react';
import { useStore } from '../store';
import { authService } from '../services/api';
import { C } from '../utils/constants';

export default function Login() {
  const [step, setStep]       = useState('phone');
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [devOtp, setDevOtp]   = useState('');
  const { login }             = useStore();

  const sendOTP = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const r = await authService.sendOTP(phone);
      if (r.otp) setDevOtp(r.otp); // dev only
      setStep('otp');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOTP = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const r = await authService.verifyOTP(phone, otp);
      if (!['gate_operator', 'admin'].includes(r.user?.role)) {
        setError('Access denied. Gate operator accounts only.');
        return;
      }
      login(r.token, r.user);
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      height: '100vh', background: C.base,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 32,
    }}>
      {/* Grid texture */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.04,
        backgroundImage: `linear-gradient(${C.borderHi} 1px, transparent 1px), linear-gradient(90deg, ${C.borderHi} 1px, transparent 1px)`,
        backgroundSize: '40px 40px', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeIn .4s ease' }}>
        {/* Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            background: C.elevated, border: `1px solid ${C.borderHi}`,
            borderRadius: 16, padding: '14px 24px',
          }}>
            <span style={{ fontSize: 32 }}>🚪</span>
            <div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 26, fontWeight: 800, color: C.text,
                letterSpacing: 1, textTransform: 'uppercase',
              }}>Gate Scanner</div>
              <div style={{ fontSize: 12, color: C.textSec, marginTop: 1 }}>QueuePass • Temple Access Control</div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: 28,
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 22, fontWeight: 700, letterSpacing: 0.5,
            marginBottom: 4, textTransform: 'uppercase',
          }}>
            {step === 'phone' ? 'Operator Sign In' : 'Enter Verification Code'}
          </h2>
          <p style={{ fontSize: 13, color: C.textSec, marginBottom: 24 }}>
            {step === 'phone'
              ? 'Enter your registered phone number'
              : `Code sent to +91 ${phone}`}
          </p>

          <form onSubmit={step === 'phone' ? sendOTP : verifyOTP}>
            {step === 'phone' ? (
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Phone Number</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ ...inputStyle, width: 'auto', padding: '12px 14px', color: C.textSec, fontSize: 15 }}>
                    🇮🇳 +91
                  </div>
                  <input
                    style={{ ...inputStyle, flex: 1, fontSize: 18, letterSpacing: 1 }}
                    type="tel" placeholder="98765 43210"
                    value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    maxLength={10} autoFocus required
                  />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>6-Digit OTP</label>
                <input
                  style={{ ...inputStyle, fontSize: 32, letterSpacing: 12, textAlign: 'center', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}
                  type="text" placeholder="------"
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6} autoFocus required
                />
                {devOtp && (
                  <div style={{ marginTop: 8, fontSize: 12, color: C.amber, background: C.amberDim, padding: '6px 10px', borderRadius: 6 }}>
                    🛠 Dev OTP: <strong>{devOtp}</strong>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div style={{
                background: C.rejectBg, border: `1px solid ${C.rejectDim}30`,
                borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                fontSize: 14, color: C.reject, fontWeight: 500,
              }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: C.allow, color: '#000',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 18, fontWeight: 800, letterSpacing: 1,
                textTransform: 'uppercase', transition: 'opacity .15s',
                opacity: loading ? 0.6 : 1,
                boxShadow: `0 4px 24px ${C.allowGlow}`,
              }}
            >
              {loading ? 'PLEASE WAIT…' : step === 'phone' ? 'SEND CODE →' : 'VERIFY & ENTER →'}
            </button>
          </form>

          {step === 'otp' && (
            <button
              onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', color: C.textSec, fontSize: 13, cursor: 'pointer', padding: '8px' }}
            >← Change number</button>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: C.textMuted }}>
          Only registered gate operators can access this device
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  background: '#1a1a1a', border: `1.5px solid #2a2a2a`,
  borderRadius: 10, color: '#f0f0f0', fontFamily: "'Barlow', sans-serif",
  fontSize: 16, padding: '12px 14px', outline: 'none', width: '100%',
  transition: 'border-color .15s',
};
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.8px',
  color: '#666', marginBottom: 8,
};
