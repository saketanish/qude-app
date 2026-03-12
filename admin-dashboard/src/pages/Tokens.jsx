import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { useQueueStore } from '../store';
import api from '../services/api';
import { format } from 'date-fns';

const STATUS_STYLE = {
  waiting:   { bg: 'var(--blue-bg)',   color: 'var(--blue)',   label: '⏳ Waiting' },
  called:    { bg: 'var(--yellow-bg)', color: 'var(--yellow)', label: '🔔 Called' },
  entered:   { bg: 'var(--green-bg)',  color: 'var(--green)',  label: '✅ Entered' },
  expired:   { bg: 'var(--red-bg)',    color: 'var(--red)',    label: '⚠️ Expired' },
  cancelled: { bg: 'rgba(90,82,72,0.2)', color: 'var(--text-muted)', label: '✕ Cancelled' },
};

export default function Tokens() {
  const { queues, selectedTemple, loadTemples, selectTemple } = useQueueStore();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedQueue, setSelectedQueue] = useState('all');

  useEffect(() => {
    loadTemples().then(() => {
      const s = useQueueStore.getState();
      if (s.temples[0] && !s.selectedTemple) selectTemple(s.temples[0]);
    });
  }, []);

  useEffect(() => {
    if (queues.length) loadTokens();
  }, [queues, selectedQueue, filter]);

  const loadTokens = async () => {
    setLoading(true);
    try {
      const queueIds = selectedQueue === 'all' ? queues.map((q) => q.id) : [selectedQueue];
      const results = await Promise.all(
        queueIds.map((qid) => api.get(`/admin/queues/${qid}/tokens`).catch(() => ({ data: { tokens: [] } })))
      );
      let all = results.flatMap((r) => r.data?.tokens || []);
      if (filter !== 'all') all = all.filter((t) => t.status === filter);
      all.sort((a, b) => new Date(b.issued_at) - new Date(a.issued_at));
      setTokens(all);
    } catch { setTokens([]); }
    finally { setLoading(false); }
  };

  const stats = {
    total: tokens.length,
    waiting: tokens.filter((t) => t.status === 'waiting').length,
    called: tokens.filter((t) => t.status === 'called').length,
    entered: tokens.filter((t) => t.status === 'entered').length,
  };

  return (
    <Layout title="Token Management" subtitle="All issued tokens and their current status">
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          className="input" style={{ width: 'auto', fontSize: 13 }}
          value={selectedQueue} onChange={(e) => setSelectedQueue(e.target.value)}
        >
          <option value="all">All Queues</option>
          {queues.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
        </select>

        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'waiting', 'called', 'entered', 'expired'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '6px 12px', borderRadius: 6, border: '1px solid',
                fontSize: 12, cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s',
                borderColor: filter === s ? 'var(--amber)' : 'var(--border)',
                background: filter === s ? 'var(--amber-ghost)' : 'transparent',
                color: filter === s ? 'var(--amber)' : 'var(--text-secondary)',
                textTransform: 'capitalize',
              }}
            >
              {s === 'all' ? `All (${stats.total})` :
               s === 'waiting' ? `Waiting (${stats.waiting})` :
               s === 'called'  ? `Called (${stats.called})` :
               s === 'entered' ? `Entered (${stats.entered})` : s}
            </button>
          ))}
        </div>

        <button className="btn-ghost" onClick={loadTokens} style={{ marginLeft: 'auto', fontSize: 12 }}>
          ↺ Refresh
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading tokens…</div>
        ) : tokens.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No tokens found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Token #</th>
                  <th>Devotee</th>
                  <th>Queue</th>
                  <th>Status</th>
                  <th>Issued At</th>
                  <th>Entered At</th>
                  <th>Wait</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => {
                  const st = STATUS_STYLE[t.status] || STATUS_STYLE.cancelled;
                  const waitMins = t.entered_at && t.issued_at
                    ? Math.round((new Date(t.entered_at) - new Date(t.issued_at)) / 60000)
                    : null;
                  return (
                    <tr key={t.id}>
                      <td>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--amber)' }}>
                          #{t.token_number?.toString().padStart(3, '0')}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {t.user_name || '—'}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{t.phone}</div>
                      </td>
                      <td>{t.queue_name || '—'}</td>
                      <td>
                        <span style={{ background: st.bg, color: st.color, padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {t.issued_at ? format(new Date(t.issued_at), 'HH:mm:ss') : '—'}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {t.entered_at ? format(new Date(t.entered_at), 'HH:mm:ss') : '—'}
                      </td>
                      <td style={{ color: 'var(--green)', fontWeight: 600 }}>
                        {waitMins != null ? `${waitMins}m` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
