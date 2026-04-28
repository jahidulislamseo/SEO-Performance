import React from 'react';

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

export const avatarGradient = (name) => GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];

export const getInitials = (name) => name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

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

  return (
    <div
      className="mc"
      onClick={() => onClick && onClick(member)}
      style={{ cursor: 'pointer' }}
    >
      {/* Top row: avatar + rank */}
      <div className="mc-top">
        <div
          className="mc-av"
          style={{ background: avatarGradient(name) }}
        >{initials}</div>
        <div className="mc-rank">#{rank}</div>
      </div>
      {/* Name + team */}
      <div className="mc-name">{name}</div>
      <div className="mc-team">{team}</div>
      {/* Progress */}
      <div className="mc-prog">
        <div className="prog-labels">
          <span style={{ color: progressTextColor(pct), fontWeight: 800, fontSize: 11 }}>{pct}%</span>
          <span style={{ color: '#94a3b8', fontSize: 10 }}>Target</span>
        </div>
        <div className="mc-track">
          <div
            className="mc-fill"
            style={{ width: `${pct}%`, background: progressColor(pct) }}
          ></div>
        </div>
      </div>
      {/* Stats grid */}
      <div className="mc-stats">
        <div className="stat">
          <div className="stat-val" style={{ color: '#10b981' }}>
            ${deliveredAmt.toLocaleString()}
          </div>
          <div className="stat-lbl">Delivered</div>
        </div>
        <div className="stat">
          <div className="stat-val" style={{ color: '#f59e0b' }}>
            ${wipAmt.toLocaleString()}
          </div>
          <div className="stat-lbl">WIP</div>
        </div>
        <div className="stat">
          <div className="stat-val" style={{ color: '#cbd5e1' }}>{delivered}</div>
          <div className="stat-lbl">Done</div>
        </div>
        <div className="stat">
          <div className="stat-val" style={{ color: cancelled > 0 ? '#ef4444' : '#64748b' }}>{cancelled}</div>
          <div className="stat-lbl">Cancel</div>
        </div>
      </div>
    </div>
  );
};

export default MemberCard;
