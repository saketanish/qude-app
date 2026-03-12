import React from 'react';
import { C } from '../utils/constants';
import { format } from 'date-fns';

export default function SessionStats({ scanCount, entryCount, rejectCount, logs, user, onLogout }) {
  const successRate = scanCount > 0 ? Math.round((entryCount / scanCount) * 100) : 0;

  return (
    <div style={{
      width: 260, height: '100%', background: C.surface,
      borderLeft: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 20px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 16, fontWeight: 700, letterSpacing: 0.5,
            textTransform: 'uppercase', color: C.text,
          }}>Session Stats</div>
          <div style={{ fontSize: 11, color: C.textSec, marginTop: 1 }}>{user?.name || 'Gate Operator'}</div>
        </div>
        <button onClick={onLogout} style={{
          background: 'none', border: `1px solid ${C.border}`,
          borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
          color: C.textSec, fontSize: 12, fontFamily: "'Barlow', sans-serif",
          transition: 'all .15s',
        }}
          onMouseEnter={(e) => { e.target.style.color = C.reject; e.target.style.borderColor = C.reject; }}
          onMouseLeave={(e) => { e.target.style.color = C.textSec; e.target.style.borderColor = C.border; }}
        >⎋ Exit</button>
      </div>

      {/* Live stats */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          {[
            { label: 'Entered', val: entryCount, color: C.allow },
            { label: 'Rejected', val: rejectCount, color: C.reject },
          ].map((s) => (
            <div key={s.label} style={{
              background: C.elevated, borderRadius: 10, padding: '12px',
              textAlign: 'center', border: `1px solid ${C.border}`,
            }}>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1,
              }}>{s.val}</div>
              <div style={{ fontSize: 11, color: C.textSec, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Success rate bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.textSec, marginBottom: 5 }}>
            <span>Success Rate</span>
            <span style={{ color: successRate > 70 ? C.allow : C.warn, fontWeight: 600 }}>{successRate}%</span>
          </div>
          <div style={{ height: 5, background: C.elevated, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${successRate}%`,
              background: successRate > 70 ? C.allow : C.warn,
              borderRadius: 3, transition: 'width .5s',
            }} />
          </div>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: C.textMuted, textAlign: 'center' }}>
          {scanCount} total scans this session
        </div>
      </div>

      {/* Recent log */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 20px 8px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', color: C.textMuted }}>
          Recent Activity
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 16px' }}>
          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.textMuted, fontSize: 13, marginTop: 24 }}>
              No scans yet
            </div>
          ) : (
            logs.map((log, i) => {
              const allowed = log.result === 'success';
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8, marginBottom: 4,
                  background: i === 0 ? (allowed ? C.allowBg : C.rejectBg) : 'transparent',
                  border: `1px solid ${i === 0 ? (allowed ? `${C.allow}30` : `${C.reject}30`) : 'transparent'}`,
                  transition: 'all .3s',
                  animation: i === 0 ? 'slideDown .3s ease' : 'none',
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>
                    {allowed ? '✅' :
                     log.result === 'not_called' ? '⏳' :
                     log.result === 'expired' ? '⚠️' : '❌'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.token?.tokenNumber ? `#${String(log.token.tokenNumber).padStart(3,'0')}` : 'Unknown'}
                      {log.token?.userName ? ` · ${log.token.userName}` : ''}
                    </div>
                    <div style={{ fontSize: 11, color: C.textSec }}>
                      {log.time ? format(log.time, 'HH:mm:ss') : ''}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: allowed ? C.allow : C.reject,
                    textTransform: 'uppercase', letterSpacing: '0.4px',
                  }}>
                    {allowed ? 'IN' : 'NO'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
