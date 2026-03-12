import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children, title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          padding: '16px 28px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-surface)', flexShrink: 0,
        }}>
          <div>
            {title && (
              <h1 style={{
                fontFamily: 'var(--font-display)', fontSize: 20,
                fontWeight: 600, color: 'var(--text-primary)',
              }}>{title}</h1>
            )}
            {subtitle && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>
            )}
          </div>
          {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
        </header>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
