// eslint-disable-next-line no-unused-vars
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


const MemberCard = ({ member, onClick, att }) => {
  const delivered = member.delivered || 0;
  const wip = member.wip || 0;
  const total = delivered + wip + (member.revision || 0);
  const target = member.target || 1100;
  const deliveredAmt = member.deliveredAmt || 0;
  const wipAmt = member.wipAmt || 0;
  const pct = Math.min(100, Math.round((deliveredAmt / target) * 100));
  const surplus = deliveredAmt - target;

  return (
    <div className="mc" style={{ 
      background: 'rgba(15, 23, 42, 0.8)', 
      backdropFilter: 'blur(16px)', 
      border: '1px solid rgba(255,255,255,0.05)', 
      borderRadius: '24px', 
      padding: '24px',
      position: 'relative',
      transition: 'transform 0.2s, border-color 0.2s',
      cursor: 'pointer'
    }} onClick={() => onClick(member)}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ 
            width: '44px', height: '44px', background: avatarGradient(member.name || ''), 
            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '18px', fontWeight: 900, boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)',
            overflow: 'hidden'
          }}>
            {member.avatar ? <img src={member.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : member.name?.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 900, color: '#f1f5f9' }}>{member.name}</div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>{member.team} • #{member.id?.slice(-5)}</div>
          </div>
        </div>
        <div style={{ padding: '3px 10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', fontSize: '9px', fontWeight: 900, color: '#10b981' }}>RANK</div>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="70" height="70" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
            <circle cx="50" cy="50" r="40" fill="none" stroke={pct >= 100 ? '#10b981' : '#3b82f6'} strokeWidth="10" 
              strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * pct / 100)} strokeLinecap="round" transform="rotate(-90 50 50)" />
          </svg>
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 900 }}>{pct}%</div>
            <div style={{ fontSize: '7px', fontWeight: 800, color: '#64748b' }}>DONE</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <StatLine label="Target" value={`$${target}`} />
          <StatLine label="Delivered" value={`$${deliveredAmt}`} color="#10b981" />
          <StatLine label={surplus >= 0 ? "Surplus" : "Remaining"} value={`$${Math.abs(surplus)}`} color={surplus >= 0 ? "#10b981" : "#f59e0b"} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
        <GridStat label="TOTAL" value={total} />
        <GridStat label="WIP" value={wip} color="#3b82f6" />
        <GridStat label="DONE" value={delivered} color="#10b981" />
        <GridStat label="CANCEL" value={member.cancelled || 0} color="#ef4444" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <BoxStat label="DELIVERED $" value={`$${deliveredAmt}`} sub={`${delivered} projects`} />
        <BoxStat label="WIP PIPELINE" value={`$${wipAmt}`} sub={`${wip} active`} />
      </div>

      {/* Attendance strip — PRESENT = total checked-in days (on-time + late) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        <AttStat label="PRESENT" value={member.presentCount ?? ((member.inTimeCount ?? 0) + (member.lateCount ?? 0))} color="#10b981" />
        <AttStat label="LATE"    value={member.lateCount ?? 0}   color="#f59e0b" />
        <AttStat label="ABSENT"  value={member.absentCount ?? 0} color="#ef4444" />
      </div>

      {/* Today's In / Out times — always visible */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: '8px', fontWeight: 800, color: '#334155', letterSpacing: '0.8px', marginBottom: '3px' }}>IN TIME</div>
          <div style={{ fontSize: '13px', fontWeight: 900, color: att?.today_in ? '#10b981' : '#334155' }}>
            {att?.today_in || '—'}
          </div>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: '8px', fontWeight: 800, color: '#334155', letterSpacing: '0.8px', marginBottom: '3px' }}>OUT TIME</div>
          <div style={{ fontSize: '13px', fontWeight: 900, color: att?.today_out ? '#ef4444' : '#334155' }}>
            {att?.today_out || '—'}
          </div>
        </div>
      </div>

      <button style={{ 
        width: '100%', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', 
        borderRadius: '12px', color: '#64748b', fontSize: '11px', fontWeight: 800, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
      }}>
        📊 View Projects ({total})
      </button>
    </div>
  );
};

const StatLine = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '2px' }}>
    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>{label}</span>
    <span style={{ fontSize: '11px', fontWeight: 900, color: color || '#f1f5f9' }}>{value}</span>
  </div>
);

const GridStat = ({ label, value, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '16px', fontWeight: 900, color: color || '#f1f5f9' }}>{value}</div>
    <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b' }}>{label}</div>
  </div>
);

const BoxStat = ({ label, value, sub }) => (
  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
    <div style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '15px', fontWeight: 900, color: '#f1f5f9' }}>{value}</div>
    <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>
  </div>
);

const AttStat = ({ label, value, color }) => (
  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${color}22`, textAlign: 'center' }}>
    <div style={{ fontSize: '9px', fontWeight: 800, color: '#334155', letterSpacing: '0.8px', marginBottom: '5px' }}>{label}</div>
    <div style={{ fontSize: '14px', fontWeight: 900, color }}>{value}</div>
  </div>
);

export default MemberCard;
