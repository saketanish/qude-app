import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import { useQueueStore } from '../store';
import { socketService } from '../services/socket';
import api from '../services/api';

function QRModal({ open, onClose, queue }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  useEffect(() => {
    if (!open || !queue) return;
    import('qrcode').then((QRCode) => {
      const data = queue.entrance_qr || JSON.stringify({ type: 'entrance', queueId: queue.id, temple: queue.temple_name });
      QRCode.toDataURL(data, { width: 280, margin: 2, color: { dark: '#1a1208', light: '#ffffff' } })
        .then(setQrDataUrl);
    });
  }, [open, queue]);

  return (
    <Modal open={open} onClose={onClose} title="Entrance QR Code" width={380}>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
        Display this QR code at the <strong style={{ color: 'var(--text-primary)' }}>{queue?.name}</strong> entrance.
        Devotees scan this to join the queue.
      </p>
      {qrDataUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#fff', padding: 16, borderRadius: 12, display: 'inline-block' }}>
            <img src={qrDataUrl} alt="Entrance QR" style={{ width: 200, height: 200, display: 'block' }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Queue ID: <code style={{ color: 'var(--amber)', fontSize: 11 }}>{queue?.id?.slice(0, 8)}…</code>
          </p>
          <a
            href={qrDataUrl}
            download={`entrance-qr-${queue?.name}.png`}
            className="btn-primary"
            style={{ textDecoration: 'none', display: 'inline-block', padding: '9px 20px' }}
          >
            ⬇ Download QR
          </a>
        </div>
      )}
    </Modal>
  );
}

function CreateQueueModal({ open, onClose, templeId, onCreated }) {
  const [form, setForm] = useState({ name: 'General Darshan', slotSize: 10, avgWaitMinutes: 5, maxCapacity: 1000 });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/admin/queues', { templeId, ...form });
      onCreated(res.data.queue, res.data.entranceQRImage);
      onClose();
      setForm({ name: 'General Darshan', slotSize: 10, avgWaitMinutes: 5, maxCapacity: 1000 });
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to create queue');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Queue">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="label">Queue Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. General Darshan" required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="label">Slot Size</label>
            <input className="input" type="number" value={form.slotSize} onChange={(e) => setForm({ ...form, slotSize: parseInt(e.target.value) })} min={1} />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>People called at once</p>
          </div>
          <div>
            <label className="label">Avg Wait (min/person)</label>
            <input className="input" type="number" value={form.avgWaitMinutes} onChange={(e) => setForm({ ...form, avgWaitMinutes: parseInt(e.target.value) })} min={1} />
          </div>
        </div>
        <div>
          <label className="label">Max Capacity</label>
          <input className="input" type="number" value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: parseInt(e.target.value) })} min={1} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create Queue'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CreateTempleModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', location: '', city: '', state: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await api.post('/admin/temples', form);
      onCreated(res.data.temple); onClose();
    } catch (err) { alert(err?.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Register New Temple">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[['Temple Name', 'name', 'e.g. Tirupati Balaji Temple'],
          ['Address / Location', 'location', 'Full address'],
          ['City', 'city', 'e.g. Tirupati'],
          ['State', 'state', 'e.g. Andhra Pradesh'],
        ].map(([label, key, ph]) => (
          <div key={key}>
            <label className="label">{label}</label>
            <input className="input" placeholder={ph} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={key === 'name'} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Register Temple'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Queues() {
  const { temples, queues, selectedTemple, loadTemples, selectTemple, updateQueueStatus, advanceQueue, addQueue, addTemple, liveUpdate } = useQueueStore();
  const [showQR, setShowQR] = useState(null);
  const [showCreateQueue, setShowCreateQueue] = useState(false);
  const [showCreateTemple, setShowCreateTemple] = useState(false);
  const [advancing, setAdvancing] = useState({});

  useEffect(() => {
    loadTemples().then(() => {
      const s = useQueueStore.getState();
      if (s.temples[0] && !s.selectedTemple) selectTemple(s.temples[0]);
    });
    const socket = socketService.connect();
    const off = socketService.on('queue:update', (data) => liveUpdate(data.queueId, data));
    return off;
  }, []);

  const handleAdvance = async (queueId) => {
    setAdvancing((a) => ({ ...a, [queueId]: true }));
    try { await advanceQueue(queueId); }
    catch (err) { alert(err?.response?.data?.message || 'Failed'); }
    finally { setAdvancing((a) => ({ ...a, [queueId]: false })); }
  };

  const statusColor = { active: 'var(--green)', paused: 'var(--yellow)', closed: 'var(--red)' };

  return (
    <Layout
      title="Live Queue Control"
      subtitle="Manage and monitor temple queues in real-time"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => setShowCreateTemple(true)}>+ Register Temple</button>
          <button className="btn-primary" onClick={() => setShowCreateQueue(true)} disabled={!selectedTemple}>+ New Queue</button>
        </div>
      }
    >
      {/* Temple tabs */}
      {temples.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
          {temples.map((t) => (
            <button
              key={t.id}
              onClick={() => selectTemple(t)}
              style={{
                padding: '7px 14px', borderRadius: 8, border: '1px solid',
                borderColor: selectedTemple?.id === t.id ? 'var(--amber)' : 'var(--border)',
                background: selectedTemple?.id === t.id ? 'var(--amber-ghost)' : 'transparent',
                color: selectedTemple?.id === t.id ? 'var(--amber)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >🛕 {t.name}</button>
          ))}
        </div>
      )}

      {/* Queue cards */}
      {queues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⟳</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>No Queues Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            {selectedTemple ? `Create your first queue for ${selectedTemple.name}` : 'Register a temple first'}
          </p>
          <button className="btn-primary" onClick={() => selectedTemple ? setShowCreateQueue(true) : setShowCreateTemple(true)}>
            {selectedTemple ? '+ Create Queue' : '+ Register Temple'}
          </button>
        </div>
      ) : (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {queues.map((q) => {
            const waiting = parseInt(q.waiting_count) || 0;
            const entered = parseInt(q.entered_count) || 0;
            const total   = parseInt(q.total_issued) || 0;
            const progress = total > 0 ? Math.round(((q.current_serving || 0) / total) * 100) : 0;

            return (
              <div key={q.id} className="card" style={{ padding: 20 }}>
                {/* Queue header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: statusColor[q.status],
                      boxShadow: `0 0 0 3px ${statusColor[q.status]}22`,
                      flexShrink: 0, marginTop: 3,
                    }} />
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                        {q.name}
                      </h3>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        Slot size: {q.slot_size} · ~{q.avg_wait_minutes} min/person
                      </p>
                    </div>
                  </div>
                  <span className={`badge badge-${q.status}`}>{q.status}</span>
                </div>

                {/* Live stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Now Serving', val: `#${q.current_serving || 0}`, color: 'var(--amber)' },
                    { label: 'Tokens Issued', val: total, color: 'var(--text-primary)' },
                    { label: 'Waiting', val: waiting, color: 'var(--blue)' },
                    { label: 'Entered', val: entered, color: 'var(--green)' },
                    { label: 'Est. Queue', val: `~${Math.round(waiting * (q.avg_wait_minutes || 5))} min`, color: 'var(--text-secondary)' },
                  ].map((s) => (
                    <div key={s.label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>Queue Progress</span><span>{progress}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'var(--amber)', borderRadius: 3, transition: 'width 0.5s' }} />
                  </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {/* Advance */}
                  <button
                    className="btn-primary"
                    onClick={() => handleAdvance(q.id)}
                    disabled={advancing[q.id] || q.status !== 'active'}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {advancing[q.id] ? '…' : '▶'} Advance Queue
                  </button>

                  {/* Pause / Resume */}
                  {q.status === 'active' ? (
                    <button className="btn-ghost" onClick={() => updateQueueStatus(q.id, 'paused')}>
                      ⏸ Pause
                    </button>
                  ) : q.status === 'paused' ? (
                    <button className="btn-ghost" onClick={() => updateQueueStatus(q.id, 'active')}
                      style={{ color: 'var(--green)', borderColor: 'rgba(76,175,125,0.3)' }}>
                      ▶ Resume
                    </button>
                  ) : null}

                  {/* Close */}
                  {q.status !== 'closed' && (
                    <button className="btn-danger" onClick={() => { if (confirm('Close this queue?')) updateQueueStatus(q.id, 'closed'); }}>
                      ■ Close Queue
                    </button>
                  )}
                  {q.status === 'closed' && (
                    <button className="btn-ghost" onClick={() => updateQueueStatus(q.id, 'active')}
                      style={{ color: 'var(--amber)', borderColor: 'var(--amber-dim)' }}>
                      ↺ Reopen
                    </button>
                  )}

                  {/* QR Code */}
                  <button
                    className="btn-ghost"
                    onClick={() => setShowQR(q)}
                    style={{ marginLeft: 'auto' }}
                  >
                    ⬡ Entrance QR
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <QRModal open={!!showQR} onClose={() => setShowQR(null)} queue={showQR} />
      <CreateQueueModal
        open={showCreateQueue}
        onClose={() => setShowCreateQueue(false)}
        templeId={selectedTemple?.id}
        onCreated={(q) => addQueue(q)}
      />
      <CreateTempleModal
        open={showCreateTemple}
        onClose={() => setShowCreateTemple(false)}
        onCreated={(t) => { addTemple(t); selectTemple(t); }}
      />
    </Layout>
  );
}
