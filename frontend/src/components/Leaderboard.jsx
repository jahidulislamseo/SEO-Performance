import React from 'react';
import { avatarGradient, getInitials } from './MemberCard';

const Leaderboard = ({ members = [], target = 1100 }) => {
  const sorted = [...members].sort((a, b) => (b.deliveredAmt || 0) - (a.deliveredAmt || 0));

  const rankMedal = (i) => {
    if (i === 0) return { icon: '🥇', color: '#fbbf24', bg: 'rgba(251,191,36,.15)', border: 'rgba(251,191,36,.35)' };
    if (i === 1) return { icon: '🥈', color: '#cbd5e1', bg: 'rgba(148,163,184,.1)', border: 'rgba(148,163,184,.25)' };
    if (i === 2) return { icon: '🥉', color: '#d4a574', bg: 'rgba(180,120,60,.12)', border: 'rgba(180,120,60,.28)' };
    return { icon: `#${i+1}`, color: '#94a3b8', bg: 'rgba(148,163,184,.08)', border: 'rgba(148,163,184,.15)' };
  };

  return (
    <div className="lb-wrap">
      <div className="lb-head">
        <h2>🏆 Full Ranking — Delivered $</h2>
        <div className="lb-acts">
          <span
            style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.25)', color: '#a5b4fc' }}
          >Target: ${target.toLocaleString()}/member</span>
        </div>
      </div>
      <table className="lb-table">
        <thead>
          <tr>
            {['Rank','Member','Team','Delivered $','WIP $','Progress'].map(h => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((m, i) => {
            const pct = Math.min(100, Math.round(((m.deliveredAmt || 0) / target) * 100));
            const medal = rankMedal(i);
            return (
              <tr key={m.id || m.name} className={i < 3 ? 'lb-top' : ''}>
                <td>
                  <span
                    style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: medal.bg, border: `1px solid ${medal.border}`, color: medal.color }}
                  >{medal.icon}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{ width: 28, height: 28, borderRadius: 8, background: avatarGradient(m.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}
                    >{getInitials(m.name)}</div>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{m.name}</span>
                  </div>
                </td>
                <td><span className="team-tag">{m.team}</span></td>
                <td><span style={{ color: '#10b981', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>${(m.deliveredAmt || 0).toLocaleString()}</span></td>
                <td><span style={{ color: '#f59e0b', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>${(m.wipAmt || 0).toLocaleString()}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 5, background: 'rgba(148,163,184,.18)', borderRadius: 50, overflow: 'hidden', minWidth: 60 }}>
                      <div style={{ height: '100%', borderRadius: 50, background: pct >= 80 ? 'linear-gradient(90deg,#059669,#10b981)' : pct >= 50 ? 'linear-gradient(90deg,#d97706,#f59e0b)' : 'linear-gradient(90deg,#dc2626,#ef4444)', width: `${pct}%` }}></div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444', minWidth: 32, textAlign: 'right' }}>{pct}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
