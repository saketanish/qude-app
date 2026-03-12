import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Layout from '../components/layout/Layout';
import StatCard from '../components/common/StatCard';
import { useQueueStore, useAuthStore } from '../store';
import { socketService } from '../services/socket';
import api from '../services/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '8px 12px' }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}:00</p>
      {payload.map((p) => (
        <p key={p.name} style={{ fontSize: 13, fontWeight: 600, color: p.color }}>
          {p.value} {p.name}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { temples, queues, selectedTemple, loadTemples, selectTemple, liveUpdate } = useQueueStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);

  useEffect(() => {
    loadTemples().then(() => {
      const store = useQueueStore.getState();
      if (store.temples[0] && !store.selectedTemple) {
        selectTemple(store.temples[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedTemple) return;
    loadDashboardData();
    const socket = socketService.connect();
    socketService.joinTemple(selectedTemple.id);
    const off = socketService.on('token:entered', (data) => {
      setRecentEntries((prev) => [data, ...prev].slice(0, 10));
    });
    return off;
  }, [selectedTemple]);

  const loadDashboardData = async () => {
    if (!queues.length) return;
    try {
      const [analyticsRes, entriesRes] = await Promise.all([
        api.get(`/admin/queues/${queues[0]?.id}/analytics`).catch(() => null),
        api.get(`/gate/logs?limit=8`).catch(() => null),
      ]);
      if (analyticsRes) setAnalytics(analyticsRes.data.analytics);
      if (entriesRes) setRecentEntries(entriesRes.data.logs || []);
    } catch {}
  };

  // Aggregate stats across all queues
  const totalWaiting  = queues.reduce((s, q) => s + (parseInt(q.waiting_count)  || 0), 0);
  const totalEntered  = queues.reduce((s, q) => s + (parseInt(q.entered_count)  || 0), 0);
  const totalIssued   = queues.reduce((s, q) => s + (parseInt(q.total_issued)   || 0), 0);
  const activeQueues  = queues.filter((q) => q.status === 'active').length;

  const hourlyData = analytics?.hourlyBreakdown?.map((h) => ({
    hour: `${h.hour}`, tokens: parseInt(h.count),
  })) || [];

  const queueCompare = queues.map((q) => ({
    name: q.name.length > 12 ? q.name.slice(0, 12) + '…' : q.name,
    waiting: parseInt(q.waiting_count) || 0,
    entered: parseInt(q.entered_count) || 0,
  }));

  return (
    <Layout
      title={selectedTemple ? `${selectedTemple.name}` : 'Dashboard'}
      subtitle={selectedTemple?.city ? `📍 ${selectedTemple.city}` : 'Select a temple to view data'}
      actions={
        <button className="btn-primary" onClick={() => navigate('/queues')}>
          + Manage Queues
        </button>
      }
    >
      {/* Stats row */}
      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon="👥" label="Currently Waiting"    value={totalWaiting} accent="var(--blue)"   sub="Across all queues" />
        <StatCard icon="✅" label="Entered Today"        value={totalEntered} accent="var(--green)"  sub="Successful entries" />
        <StatCard icon="🎫" label="Tokens Issued Today"  value={totalIssued}  accent="var(--amber)"  sub="Total tokens" />
        <StatCard icon="⟳" label="Active Queues"        value={activeQueues} accent="var(--gold)"   sub={`of ${queues.length} total`} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Hourly tokens chart */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Hourly Token Flow</h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Tokens issued by hour today</p>
            </div>
            <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, background: 'var(--green-bg)', padding: '3px 8px', borderRadius: 99 }}>
              <span className="live-dot" style={{ marginRight: 5 }} />LIVE
            </span>
          </div>
          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--amber)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--amber)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="tokens" name="tokens" stroke="var(--amber)" strokeWidth={2} fill="url(#amberGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No data for today yet
            </div>
          )}
        </div>

        {/* Queue comparison */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Queue Comparison</h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Waiting vs entered per queue</p>
          </div>
          {queueCompare.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={queueCompare} barGap={4}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="waiting" name="waiting" fill="var(--blue)"  radius={[3, 3, 0, 0]} />
                <Bar dataKey="entered" name="entered" fill="var(--green)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No queues configured
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: queue status + recent entries */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Queue status cards */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Queue Status</h3>
          {queues.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              No queues yet.{' '}
              <span style={{ color: 'var(--amber)', cursor: 'pointer' }} onClick={() => navigate('/queues')}>Create one →</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {queues.map((q) => (
                <div key={q.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`badge badge-${q.status}`}>
                      {q.status === 'active' ? '● ' : q.status === 'paused' ? '⏸ ' : '■ '}
                      {q.status}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{q.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--blue)' }}>⬤ {q.waiting_count || 0} waiting</span>
                    <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-display)', fontSize: 14 }}>
                      #{q.current_serving || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent gate entries */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>Recent Gate Entries</h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Live feed</span>
          </div>
          {recentEntries.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              No entries yet today
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentEntries.map((entry, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                  <span style={{ fontSize: 16 }}>{entry.result === 'success' ? '✅' : '❌'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {entry.user_name || 'Devotee'} · Token #{entry.token_number}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{entry.queue_name}</p>
                  </div>
                  <span style={{
                    fontSize: 11, color: entry.result === 'success' ? 'var(--green)' : 'var(--red)',
                    fontWeight: 600,
                  }}>{entry.result === 'success' ? 'Entered' : entry.result}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
