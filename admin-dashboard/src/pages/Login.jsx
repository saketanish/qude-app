import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import api from '../services/api';

export default function Login() {
  const [step, setStep] = useState('phone'); // phone | otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const sendOTP = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { phone });
      if (res.data.otp) setOtp(res.data.otp); // dev mode
      setStep('otp');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { phone, otp });
      if (!['admin'].includes(res.data.user?.role)) {
        setError('Access denied. Admin accounts only.');
        return;
      }
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      {/* Background texture */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.03,
        backgroundImage: 'radial-gradient(var(--amber) 1px, transparent 1px)',
        backgroundSize: '32px 32px', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 400, animation: 'fadeIn 0.4s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--amber)', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 28,
            marginBottom: 16, boxShadow: '0 8px 32px rgba(201,123,42,0.3)',
          }}>🛕</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--text-primary)' }}>
            <Qude></Qude>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Admin Console</p>
        </div>

        {/* Card */}
        <div className="card-elevated" style={{ padding: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 6 }}>
            {step === 'phone' ? 'Sign In' : 'Verify OTP'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
            {step === 'phone'
              ? 'Enter your admin phone number to continue'
              : `Enter the 6-digit code sent to +91 ${phone}`}
          </p>

          <form onSubmit={step === 'phone' ? sendOTP : verifyOTP}>
            {step === 'phone' ? (
              <div style={{ marginBottom: 20 }}>
                <label className="label">Phone Number</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{
                    background: 'var(--bg-input)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '9px 12px', color: 'var(--text-secondary)',
                    fontSize: 13, whiteSpace: 'nowrap',
                  }}>🇮🇳 +91</div>
                  <input
                    className="input"
                    type="tel" placeholder="98765 43210"
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                    maxLength={10} autoFocus required
                  />
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <label className="label">One-Time Password</label>
                <input
                  className="input"
                  type="text" placeholder="— — — — — —"
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  maxLength={6} autoFocus required
                  style={{ fontSize: 22, letterSpacing: 8, textAlign: 'center' }}
                />
              </div>
            )}

            {error && (
              <div style={{
                background: 'var(--red-bg)', border: '1px solid rgba(224,82,82,0.2)',
                borderRadius: 8, padding: '10px 12px', marginBottom: 16,
                fontSize: 13, color: 'var(--red)',
              }}>{error}</div>
            )}

            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '11px 16px', fontSize: 14 }}>
              {loading ? 'Please wait…' : step === 'phone' ? 'Send OTP →' : 'Verify & Sign In →'}
            </button>
          </form>

          {step === 'otp' && (
            <button
              onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              style={{ width: '100%', textAlign: 'center', marginTop: 14, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
            >← Change number</button>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          Only admin accounts can access this console
        </p>
      </div>
    </div>
  );
}
