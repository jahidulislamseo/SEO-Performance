import React from 'react';

const TEAM_COLORS = {
  'Geo Rankers':  { from: '#6366f1', to: '#8b5cf6', accent: '#a78bfa', glow: 'rgba(99, 102, 241, 0.2)', leader: 'Md. Jahidul Islam' },
  'Rank Riser':   { from: '#10b981', to: '#059669', accent: '#34d399', glow: 'rgba(16, 185, 129, 0.2)', leader: 'Gazi Fahim Hasan' },
  'Search Apex':  { from: '#f59e0b', to: '#d97706', accent: '#fbbf24', glow: 'rgba(245, 158, 11, 0.2)', leader: 'Shihadul Islam Tihim' },
  'Dark Rankers': { from: '#ec4899', to: '#db2777', accent: '#f472b6', glow: 'rgba(236, 72, 153, 0.2)', leader: 'Istiak' },
};

const TeamCard = ({ team, teamData = {}, members = [], target = 1100 }) => {
  const colors = TEAM_COLORS[team] || TEAM_COLORS['Geo Rankers'];
  
  // Use backend teamData as the source of truth if available
  const totalDelivered = teamData.deliveredAmt || members.reduce((s, m) => s + (m.deliveredAmt || 0), 0);
  const totalTarget = teamData.target || members.length * target;
  const totalWip = teamData.wipAmt || members.reduce((s, m) => s + (m.wipAmt || 0), 0);
  
  const deliveredCount = teamData.delivered !== undefined ? teamData.delivered : members.reduce((s,m)=>s+(m.delivered||0),0);
  const wipCount = teamData.wip !== undefined ? teamData.wip : members.reduce((s,m)=>s+(m.wip||0),0);
  const revisionCount = teamData.revision !== undefined ? teamData.revision : members.reduce((s,m)=>s+(m.revision||0),0);
  const cancelledCount = teamData.cancelled !== undefined ? teamData.cancelled : members.reduce((s,m)=>s+(m.cancelled||0),0);
  const totalCount = teamData.projects !== undefined ? teamData.projects : deliveredCount + wipCount;

  const remaining = Math.max(0, totalTarget - totalDelivered);
  const pct = totalTarget > 0 ? Math.min(100, Math.round((totalDelivered / totalTarget) * 100)) : 0;

  // Derive status
  let status = "On Track";
  let statusColor = colors.accent;
  if (pct < 40) { status = "At Risk"; statusColor = "#ef4444"; }
  else if (pct < 70) { status = "Needs Push"; statusColor = "#f59e0b"; }
  else if (pct >= 90) { status = "Top Team"; statusColor = "#10b981"; }

  const k = (val) => (val / 1000).toFixed(1) + 'K';

  return (
    <div className="tc" style={{ 
      background: 'rgba(15, 23, 42, 0.8)', 
      backdropFilter: 'blur(16px)', 
      border: `1px solid ${colors.glow}`, 
      boxShadow: `0 0 30px ${colors.glow}`,
      borderRadius: '24px', 
      padding: '28px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Glow Border Effect */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)` }}></div>

      <div className="tc-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ 
            width: '44px', height: '44px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', border: '1px solid rgba(255,255,255,0.05)' 
          }}>
            {team === 'Geo Rankers' ? '🌍' : team === 'Rank Riser' ? '📈' : team === 'Search Apex' ? '🔍' : '📱'}
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px' }}>{team}</div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
               👤 {colors.leader}
            </div>
          </div>
        </div>
        <div style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '99px', fontSize: '9px', fontWeight: 800, color: '#64748b', height: 'fit-content' }}>
          {members.length} members
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ padding: '4px 12px', background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}33`, borderRadius: '6px', fontSize: '10px', fontWeight: 900, display: 'inline-block', marginBottom: '12px' }}>
          {status.toUpperCase()}
        </div>
        <div style={{ fontSize: '32px', fontWeight: 900, color: colors.accent, marginBottom: '4px' }}>${k(totalDelivered)}</div>
        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800 }}>
          Achieved <span style={{color: '#f1f5f9'}}>${k(totalDelivered)}</span> · 
          Target <span style={{color: '#f1f5f9'}}>${k(totalTarget)}</span> · 
          WIP <span style={{color: '#f1f5f9'}}>${k(totalWip)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <MiniBox label="ACHIEVED" value={`$${k(totalDelivered)}`} />
        <MiniBox label="TARGET" value={`$${k(totalTarget)}`} />
        <MiniBox label="REMAINING" value={`$${k(remaining)}`} />
      </div>

      <div className="tc-track" style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginBottom: '24px' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`, borderRadius: '10px', boxShadow: `0 0 10px ${colors.from}88` }}></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        <GridItem icon="✅" label="Delivery" value={deliveredCount} color="#10b981" />
        <GridItem icon="⏳" label="WIP" value={wipCount} color="#3b82f6" />
        <GridItem icon="🔄" label="Revision" value={revisionCount} color="#8b5cf6" />
        <GridItem icon="❌" label="Cancel" value={cancelledCount} color="#ef4444" />
        <GridItem icon="📦" label="Total" value={totalCount} color="#f59e0b" />
        <GridItem icon="🎯" label="Complete" value={`${pct}%`} color={colors.accent} />
      </div>
    </div>
  );
};

const MiniBox = ({ label, value }) => (
  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
    <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '13px', fontWeight: 900, color: '#f1f5f9' }}>{value}</div>
  </div>
);

const GridItem = ({ icon, label, value, color }) => (
  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
    <div style={{ fontSize: '14px', fontWeight: 900, color: color, marginBottom: '2px' }}>{value}</div>
    <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
      <span style={{ fontSize: '10px' }}>{icon}</span> {label}
    </div>
  </div>
);

export default TeamCard;
