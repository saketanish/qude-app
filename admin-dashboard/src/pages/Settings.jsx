import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import { useQueueStore } from '../store';
import api from '../services/api';

export default function Settings() {
  const { selectedTemple, temples } = useQueueStore();
  const [showAddOperator, setShowAddOperator] = useState(false);
  const [opForm, setOpForm] = useState({ phone: '', name: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleAddOperator = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/admin/gate-operators', opForm);
      setSaved(true);
      setTimeout(() => { setSaved(false); setShowAddOperator(false); setOpForm({ phone: '', name: '' }); }, 2000);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to add operator');
    } finally { setSaving(false); }
  };

  return (
    <Layout title="Settings" subtitle="Configure temples, operators, and system settings">
      <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Temple info */}
        {selectedTemple && (
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginBottom: 18, color: 'var(--amber)' }}>
              🛕 Temple Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                ['Name', selectedTemple.name],
                ['City', selectedTemple.city || '—'],
                ['State', selectedTemple.state || '—'],
                ['Location', selectedTemple.location || '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <label className="label">{k}</label>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', padding: '9px 12px', background: 'var(--bg-elevated)', borderRadius: 8 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gate operators */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>Gate Operators</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Staff who scan QR codes at the gate</p>
            </div>
            <button className="btn-primary" onClick={() => setShowAddOperator(true)}>+ Add Operator</button>
          </div>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
              Add gate operator accounts using their phone number.{'\n'}
              They can log in to the Gate Scanner app and scan devotee QR codes.
            </p>
          </div>
        </div>

        {/* Notification settings */}
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginBottom: 4 }}>Notification Triggers</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>When devotees receive automatic alerts</p>
          {[
            { event: 'Token Issued', channels: 'SMS + WhatsApp', auto: true },
            { event: 'Near Turn (10 ahead)', channels: 'SMS + WhatsApp', auto: true },
            { event: 'Called to Gate', channels: 'SMS + WhatsApp', auto: true },
            { event: 'Token Expired', channels: 'SMS only', auto: true },
          ].map((n) => (
            <div key={n.event} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: '1px solid var(--border)',
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{n.event}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.channels}</p>
              </div>
              <span className="badge badge-active">● Auto</span>
            </div>
          ))}
        </div>

        {/* System info */}
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginBottom: 16 }}>System</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            {[
              ['Backend API', 'http://localhost:5000', 'var(--green)'],
              ['Socket.io', 'Connected', 'var(--green)'],
              ['Redis', 'Connected', 'var(--green)'],
              ['SMS Provider', 'Twilio', 'var(--text-secondary)'],
            ].map(([k, v, c]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>{k}</span>
                <span style={{ color: c, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add operator modal */}
      <Modal open={showAddOperator} onClose={() => setShowAddOperator(false)} title="Add Gate Operator">
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          The operator will be able to log in to the Gate Scanner app with their phone number.
        </p>
        <form onSubmit={handleAddOperator} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Full Name</label>
            <input className="input" placeholder="e.g. Rajan Kumar" value={opForm.name} onChange={(e) => setOpForm({ ...opForm, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input className="input" type="tel" placeholder="98765 43210" value={opForm.phone} onChange={(e) => setOpForm({ ...opForm, phone: e.target.value })} required />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn-ghost" onClick={() => setShowAddOperator(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Adding…' : saved ? '✓ Added!' : 'Add Operator'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
