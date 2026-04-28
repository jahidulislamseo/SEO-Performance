import React from 'react';

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

  return (
    <div className="tc" style={{ background: 'var(--card)', backdropFilter: 'blur(10px)', border: 'var(--border)', boxShadow: 'var(--shadow)', borderRadius: '20px', padding: '24px' }}>
      <div className="tc-header" style={{ marginBottom: '20px' }}>
        <div className="tc-icon" style={{ 
          width: '48px', 
          height: '48px', 
          borderRadius: '14px',
          fontSize: '20px',
          background: `linear-gradient(135deg,${colors.from},${colors.to})`,
          boxShadow: `0 8px 15px ${colors.from}44`
        }}>
          {team.charAt(0)}
        </div>
        <div style={{ marginLeft: '14px' }}>
          <div className="tc-name" style={{ fontSize: '18px', fontWeight: 900 }}>{team}</div>
          <div className="tc-meta" style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{members.length} Specialists</div>
        </div>
      </div>

      <div className="tc-kpis" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div className="tc-kpi" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.05)' }}>
          <div className="tc-kval" style={{ color: '#10b981', fontSize: '20px', fontWeight: 900 }}>${totalDelivered.toLocaleString()}</div>
          <div className="tc-klbl" style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Achieved</div>
        </div>
        <div className="tc-kpi" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.05)' }}>
          <div className="tc-kval" style={{ color: '#f59e0b', fontSize: '20px', fontWeight: 900 }}>${totalWip.toLocaleString()}</div>
          <div className="tc-klbl" style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>In Pipeline</div>
        </div>
      </div>

      <div className="tc-prog-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b' }}>TEAM EFFICIENCY</span>
          <span className="tc-pct" style={{ color: colors.accent, fontSize: '13px', fontWeight: 900 }}>{pct}%</span>
        </div>
        <div className="tc-track" style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
          <div
            className="tc-fill"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg,${colors.from},${colors.to})`,
              boxShadow: `0 0 10px ${colors.from}66`
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default TeamCard;
