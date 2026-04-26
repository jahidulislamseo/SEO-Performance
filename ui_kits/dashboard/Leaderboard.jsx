// Leaderboard.jsx — Full ranking table
// Exports: Leaderboard

const Leaderboard = ({ members = [], target = 1100 }) => {
  const sorted = [...members].sort((a, b) => (b.deliveredAmt || 0) - (a.deliveredAmt || 0));

  const rankMedal = (i) => {
    if (i === 0) return { icon: '🥇', color: '#fbbf24', bg: 'rgba(251,191,36,.15)', border: 'rgba(251,191,36,.35)' };
    if (i === 1) return { icon: '🥈', color: '#cbd5e1', bg: 'rgba(148,163,184,.1)', border: 'rgba(148,163,184,.25)' };
    if (i === 2) return { icon: '🥉', color: '#d4a574', bg: 'rgba(180,120,60,.12)', border: 'rgba(180,120,60,.28)' };
    return { icon: `#${i+1}`, color: '#94a3b8', bg: 'rgba(148,163,184,.08)', border: 'rgba(148,163,184,.15)' };
  };

  return React.createElement('div', { className: 'lb-wrap' },
    React.createElement('div', { className: 'lb-head' },
      React.createElement('h2', null, '🏆 Full Ranking — Delivered $'),
      React.createElement('div', { className: 'lb-acts' },
        React.createElement('span', {
          style: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.25)', color: '#a5b4fc' }
        }, `Target: $${target.toLocaleString()}/member`)
      )
    ),
    React.createElement('table', { className: 'lb-table' },
      React.createElement('thead', null,
        React.createElement('tr', null,
          ['Rank','Member','Team','Delivered $','WIP $','Progress'].map(h =>
            React.createElement('th', { key: h }, h)
          )
        )
      ),
      React.createElement('tbody', null,
        sorted.map((m, i) => {
          const pct = Math.min(100, Math.round(((m.deliveredAmt || 0) / target) * 100));
          const medal = rankMedal(i);
          return React.createElement('tr', { key: m.name, className: i < 3 ? 'lb-top' : '' },
            React.createElement('td', null,
              React.createElement('span', {
                style: { padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: medal.bg, border: `1px solid ${medal.border}`, color: medal.color }
              }, medal.icon)
            ),
            React.createElement('td', null,
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                React.createElement('div', {
                  style: { width: 28, height: 28, borderRadius: 8, background: avatarGradient(m.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }
                }, getInitials(m.name)),
                React.createElement('span', { style: { fontWeight: 700, fontSize: 13 } }, m.name)
              )
            ),
            React.createElement('td', null, React.createElement('span', { className: 'team-tag' }, m.team)),
            React.createElement('td', null, React.createElement('span', { style: { color: '#10b981', fontWeight: 800, fontVariantNumeric: 'tabular-nums' } }, `$${(m.deliveredAmt || 0).toLocaleString()}`)),
            React.createElement('td', null, React.createElement('span', { style: { color: '#f59e0b', fontWeight: 700, fontVariantNumeric: 'tabular-nums' } }, `$${(m.wipAmt || 0).toLocaleString()}`)),
            React.createElement('td', null,
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                React.createElement('div', { style: { flex: 1, height: 5, background: 'rgba(148,163,184,.18)', borderRadius: 50, overflow: 'hidden', minWidth: 60 } },
                  React.createElement('div', { style: { height: '100%', borderRadius: 50, background: pct >= 80 ? 'linear-gradient(90deg,#059669,#10b981)' : pct >= 50 ? 'linear-gradient(90deg,#d97706,#f59e0b)' : 'linear-gradient(90deg,#dc2626,#ef4444)', width: `${pct}%` } })
                ),
                React.createElement('span', { style: { fontSize: 11, fontWeight: 800, color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444', minWidth: 32, textAlign: 'right' } }, `${pct}%`)
              )
            )
          );
        })
      )
    )
  );
};

Object.assign(window, { Leaderboard });
