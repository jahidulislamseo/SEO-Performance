// TeamCard.jsx — Team summary card
// Exports: TeamCard

const TEAM_COLORS = {
  'Geo Rankers':  { from: '#2f5d8a', to: '#5f85a2', accent: '#7ea8c4' },
  'Rank Riser':   { from: '#0f766e', to: '#10b981', accent: '#34d399' },
  'Search Apex':  { from: '#7c3aed', to: '#a78bfa', accent: '#c4b5fd' },
  'SMM':          { from: '#b45309', to: '#f59e0b', accent: '#fbbf24' },
};

const TeamCard = ({ team, members = [], target = 1100 }) => {
  const colors = TEAM_COLORS[team] || TEAM_COLORS['Geo Rankers'];
  const totalDelivered = members.reduce((s, m) => s + (m.deliveredAmt || 0), 0);
  const totalTarget = members.length * target;
  const pct = totalTarget > 0 ? Math.min(100, Math.round((totalDelivered / totalTarget) * 100)) : 0;
  const totalWip = members.reduce((s, m) => s + (m.wipAmt || 0), 0);

  return React.createElement('div', { className: 'tc' },
    React.createElement('div', { className: 'tc-header' },
      React.createElement('div', { className: 'tc-icon', style: { background: `linear-gradient(135deg,${colors.from},${colors.to})` } },
        team.charAt(0)
      ),
      React.createElement('div', null,
        React.createElement('div', { className: 'tc-name' }, team),
        React.createElement('div', { className: 'tc-meta' }, `${members.length} members`)
      )
    ),
    React.createElement('div', { className: 'tc-kpis' },
      React.createElement('div', { className: 'tc-kpi' },
        React.createElement('div', { className: 'tc-kval', style: { color: '#10b981' } }, `$${totalDelivered.toLocaleString()}`),
        React.createElement('div', { className: 'tc-klbl' }, 'Delivered')
      ),
      React.createElement('div', { className: 'tc-kpi' },
        React.createElement('div', { className: 'tc-kval', style: { color: '#f59e0b' } }, `$${totalWip.toLocaleString()}`),
        React.createElement('div', { className: 'tc-klbl' }, 'WIP')
      )
    ),
    React.createElement('div', { className: 'tc-prog-row' },
      React.createElement('div', { className: 'tc-track' },
        React.createElement('div', {
          className: 'tc-fill',
          style: {
            width: `${pct}%`,
            background: `linear-gradient(90deg,${colors.from},${colors.to})`
          }
        })
      ),
      React.createElement('span', { className: 'tc-pct', style: { color: colors.accent } }, `${pct}%`)
    )
  );
};

Object.assign(window, { TeamCard });
