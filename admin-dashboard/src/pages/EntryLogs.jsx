import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { format } from 'date-fns';

const RESULT_STYLE = {
  success:      { bg: 'var(--green-bg)',  color: 'var(--green)',  icon: '✅', label: 'Entered' },
  already_used: { bg: 'var(--yellow-bg)', color: 'var(--yellow)', icon: '⚠️', label: 'Already Used' },
  expired:      { bg: 'var(--red-bg)',    color: 'var(--red)',    icon: '❌', label: 'Expired' },
  invalid:      { bg: 'var(--red-bg)',    color: 'var(--red)',    icon: '✕',  label: 'Invalid QR' },
  not_called:   { bg: 'var(--blue-bg)',   color: 'var(--blue)',   icon: '⏳', label: 'Not Called Yet' },
};

export default function EntryLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/gate/logs?limit=100');
      setLogs(res.data.logs || []);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  };

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.result === filter);
  const successCount = logs.filter((l) => l.result === 'success').length;
  const failCount = logs.filter((l) => l.result !== 'success').length;

  return (
    <Layout
      title="Gate Entry Log"
      subtitle="All gate scan events — successful and failed"
      actions={<button className="btn-ghost" onClick={loadLogs} style={{ fontSize: 12 }}>↺ Refresh</button>}
    >
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Scans', val: logs.length, color: 'var(--amber)' },
          { label: 'Successful', val: successCount, color: 'var(--green)' },
          { label: 'Rejected',   val: failCount, color: 'var(--red)' },
          { label: 'Success Rate', val: logs.length ? `${Math.round((successCount/logs.length)*100)}%` : '—', color: 'var(--text-primary)' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['all', 'success', 'not_called', 'already_used', 'expired', 'invalid'].map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            style={{
              padding: '5px 11px', borderRadius: 6, border: '1px solid', fontSize: 12,
              cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s',
              borderColor: filter === r ? 'var(--amber)' : 'var(--border)',
              background: filter === r ? 'var(--amber-ghost)' : 'transparent',
              color: filter === r ? 'var(--amber)' : 'var(--text-secondary)',
              textTransform: 'capitalize',
            }}
          >
            {r === 'all' ? 'All' : RESULT_STYLE[r]?.label || r}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Token #</th>
                  <th>Devotee</th>
                  <th>Queue</th>
                  <th>Result</th>
                  <th>Gate Operator</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => {
                  const r = RESULT_STYLE[log.result] || RESULT_STYLE.invalid;
                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>
                        {log.scanned_at ? format(new Date(log.scanned_at), 'HH:mm:ss') : '—'}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--amber)' }}>
                          #{log.token_number?.toString().padStart(3, '0')}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {log.user_name || '—'}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{log.phone}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{log.queue_name || '—'}</td>
                      <td>
                        <span style={{ background: r.bg, color: r.color, padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                          {r.icon} {r.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gate Operator</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No entries found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
