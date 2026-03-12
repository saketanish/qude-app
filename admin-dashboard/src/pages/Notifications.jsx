import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { useQueueStore } from '../store';
import api from '../services/api';

export default function Notifications() {
  const { queues } = useQueueStore();
  const [form, setForm] = useState({ queueId: '', message: '', channel: 'both' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const templates = [
    { label: '🕐 Queue Delayed', text: 'There is a slight delay in the queue. We apologize for the inconvenience. Please wait — your token is still valid.' },
    { label: '⏸ Temporary Pause', text: 'The queue has been temporarily paused for maintenance. It will resume shortly. Please stay close to the entrance area.' },
    { label: '📢 Gate Change', text: 'Attention: Queue entry is now being processed at Gate B. Please proceed to Gate B with your QR token.' },
    { label: '🔔 Rush Hour Alert', text: 'We are experiencing high footfall. Your wait time may be slightly longer than estimated. We appreciate your patience. 🙏' },
  ];

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.message || !form.queueId) return;
    setLoading(true);
    try {
      await api.post('/admin/notify', form);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      setForm((f) => ({ ...f, message: '' }));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to send notification');
    } finally { setLoading(false); }
  };

  return (
    <Layout title="Notifications" subtitle="Send alerts to devotees in queue">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        {/* Compose form */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 20 }}>
            Broadcast Message
          </h3>
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Target Queue</label>
              <select className="input" value={form.queueId} onChange={(e) => setForm({ ...form, queueId: e.target.value })} required>
                <option value="">Select a queue…</option>
                {queues.map((q) => <option key={q.id} value={q.id}>{q.name} ({q.waiting_count || 0} waiting)</option>)}
              </select>
            </div>

            <div>
              <label className="label">Channel</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { val: 'sms', label: '📱 SMS Only' },
                  { val: 'whatsapp', label: '💬 WhatsApp Only' },
                  { val: 'both', label: '📲 Both' },
                ].map((c) => (
                  <button
                    key={c.val} type="button"
                    onClick={() => setForm({ ...form, channel: c.val })}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid', fontSize: 12,
                      cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s',
                      borderColor: form.channel === c.val ? 'var(--amber)' : 'var(--border)',
                      background: form.channel === c.val ? 'var(--amber-ghost)' : 'var(--bg-input)',
                      color: form.channel === c.val ? 'var(--amber)' : 'var(--text-secondary)',
                    }}
                  >{c.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Message</label>
              <textarea
                className="input"
                rows={4}
                placeholder="Type your message to devotees…"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                style={{ resize: 'vertical', fontFamily: 'var(--font-body)' }}
                required
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {form.message.length}/160 characters
              </p>
            </div>

            <button
              type="submit" className="btn-primary"
              disabled={loading || !form.queueId || !form.message}
              style={{ padding: '11px', fontSize: 14 }}
            >
              {loading ? 'Sending…' : sent ? '✓ Sent!' : '📤 Send to All Waiting Devotees'}
            </button>
          </form>
        </div>

        {/* Message templates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginBottom: 4 }}>Quick Templates</h3>
          {templates.map((t, i) => (
            <button
              key={i}
              onClick={() => setForm((f) => ({ ...f, message: t.text }))}
              className="card"
              style={{
                padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                border: '1px solid var(--border)', background: 'var(--bg-surface)',
                transition: 'all 0.15s', display: 'block', width: '100%',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--amber)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5 }}>{t.label}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t.text}</p>
            </button>
          ))}

          {/* Notification history note */}
          <div style={{ marginTop: 10, padding: '14px 16px', background: 'var(--amber-ghost)', borderRadius: 10, border: '1px solid var(--amber-dim)' }}>
            <p style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600, marginBottom: 4 }}>💡 Automatic Notifications</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              QueuePass automatically sends SMS & WhatsApp to devotees when:
              their token is issued, they are 10 positions away, and when they are called to the gate.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
