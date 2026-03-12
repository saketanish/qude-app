import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

const NAV = [
  { to: '/',          icon: '⬡',  label: 'Overview' },
  { to: '/queues',    icon: '⟳',  label: 'Live Queues' },
  { to: '/tokens',    icon: '◈',  label: 'Tokens' },
  { to: '/entries',   icon: '⊞',  label: 'Entry Log' },
  { to: '/notify',    icon: '◉',  label: 'Notifications' },
  { to: '/settings',  icon: '◎',  label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)', display: 'flex',
      flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'var(--amber)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>🛕</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              QueuePass
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Admin Console</div>
          </div>
        </div>
      </div>

      {/* Temple selector */}
      <TempleSelector />

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', padding: '6px 10px', marginBottom: 4 }}>
          Management
        </div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 8, marginBottom: 2,
              textDecoration: 'none', transition: 'all 0.15s',
              background: isActive ? 'var(--amber-ghost)' : 'transparent',
              color: isActive ? 'var(--amber)' : 'var(--text-secondary)',
              fontWeight: isActive ? 600 : 400,
              borderLeft: isActive ? '2px solid var(--amber)' : '2px solid transparent',
            })}
          >
            <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
            <span style={{ fontSize: 13 }}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div style={{
        padding: '12px 14px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--amber-ghost)', border: '1px solid var(--amber-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600, color: 'var(--amber)',
          flexShrink: 0,
        }}>
          {user?.name ? user.name[0].toUpperCase() : 'A'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || 'Admin'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.phone}</div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, padding: 4, borderRadius: 4, transition: 'color 0.15s' }}
          onMouseEnter={(e) => e.target.style.color = 'var(--red)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
        >⎋</button>
      </div>
    </aside>
  );
}

function TempleSelector() {
  const { temples, selectedTemple, selectTemple } = require('../../store').useQueueStore();
  if (!temples.length) return null;
  return (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
      <label className="label" style={{ marginBottom: 5 }}>Active Temple</label>
      <select
        className="input"
        style={{ fontSize: 12, padding: '7px 10px' }}
        value={selectedTemple?.id || ''}
        onChange={(e) => {
          const t = temples.find((t) => t.id === e.target.value);
          if (t) selectTemple(t);
        }}
      >
        {temples.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  );
}
