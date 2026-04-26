// MemberCard.jsx — Individual member stat card
// Exports: MemberCard, avatarGradient

const GRADIENTS = [
  'linear-gradient(135deg,#2f5d8a,#5f85a2)',
  'linear-gradient(135deg,#0f766e,#10b981)',
  'linear-gradient(135deg,#7c3aed,#a78bfa)',
  'linear-gradient(135deg,#b45309,#f59e0b)',
  'linear-gradient(135deg,#be123c,#f43f5e)',
  'linear-gradient(135deg,#1d4ed8,#60a5fa)',
  'linear-gradient(135deg,#065f46,#34d399)',
  'linear-gradient(135deg,#6d28d9,#ec4899)',
];

const avatarGradient = (name) => GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];

const getInitials = (name) => name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

const progressColor = (pct) => {
  if (pct >= 80) return 'linear-gradient(90deg,#059669,#10b981)';
  if (pct >= 50) return 'linear-gradient(90deg,#d97706,#f59e0b)';
  return 'linear-gradient(90deg,#dc2626,#ef4444)';
};

const progressTextColor = (pct) => {
  if (pct >= 80) return '#10b981';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
};

const MemberCard = ({ member, rank, onClick }) => {
  const { name, team, deliveredAmt = 0, wipAmt = 0, delivered = 0, wip = 0, cancelled = 0, target = 1100 } = member;
  const pct = Math.min(100, Math.round((deliveredAmt / target) * 100));
  const initials = getInitials(name);

  return React.createElement('div', {
    className: 'mc',
    onClick: () => onClick && onClick(member),
    style: { cursor: 'pointer' }
  },
    // Top row: avatar + rank
    React.createElement('div', { className: 'mc-top' },
      React.createElement('div', {
        className: 'mc-av',
        style: { background: avatarGradient(name) }
      }, initials),
      React.createElement('div', { className: 'mc-rank' }, `#${rank}`)
    ),
    // Name + team
    React.createElement('div', { className: 'mc-name' }, name),
    React.createElement('div', { className: 'mc-team' }, team),
    // Progress
    React.createElement('div', { className: 'mc-prog' },
      React.createElement('div', { className: 'prog-labels' },
        React.createElement('span', { style: { color: progressTextColor(pct), fontWeight: 800, fontSize: 11 } }, `${pct}%`),
        React.createElement('span', { style: { color: '#94a3b8', fontSize: 10 } }, 'Target')
      ),
      React.createElement('div', { className: 'mc-track' },
        React.createElement('div', {
          className: 'mc-fill',
          style: { width: `${pct}%`, background: progressColor(pct) }
        })
      )
    ),
    // Stats grid
    React.createElement('div', { className: 'mc-stats' },
      React.createElement('div', { className: 'stat' },
        React.createElement('div', { className: 'stat-val', style: { color: '#10b981' } },
          `$${deliveredAmt.toLocaleString()}`
        ),
        React.createElement('div', { className: 'stat-lbl' }, 'Delivered')
      ),
      React.createElement('div', { className: 'stat' },
        React.createElement('div', { className: 'stat-val', style: { color: '#f59e0b' } },
          `$${wipAmt.toLocaleString()}`
        ),
        React.createElement('div', { className: 'stat-lbl' }, 'WIP')
      ),
      React.createElement('div', { className: 'stat' },
        React.createElement('div', { className: 'stat-val', style: { color: '#cbd5e1' } }, delivered),
        React.createElement('div', { className: 'stat-lbl' }, 'Done')
      ),
      React.createElement('div', { className: 'stat' },
        React.createElement('div', { className: 'stat-val', style: { color: cancelled > 0 ? '#ef4444' : '#64748b' } }, cancelled),
        React.createElement('div', { className: 'stat-lbl' }, 'Cancel')
      )
    )
  );
};

Object.assign(window, { MemberCard, avatarGradient, getInitials });
