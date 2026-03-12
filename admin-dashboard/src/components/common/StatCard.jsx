import React from 'react';

export default function StatCard({ icon, label, value, sub, accent, trend }) {
  return (
    <div className="card" style={{
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8,
      borderLeft: `3px solid ${accent || 'var(--border)'}`,
      transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        {trend !== undefined && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
            background: trend >= 0 ? 'var(--green-bg)' : 'var(--red-bg)',
            color: trend >= 0 ? 'var(--green)' : 'var(--red)',
          }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-number" style={{ color: accent || 'var(--text-primary)' }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}
