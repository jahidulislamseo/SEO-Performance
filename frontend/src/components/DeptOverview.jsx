import React from 'react';

const DeptOverview = ({ 
  total = 36000, delivered = 0, wip = 0, cancelled = 0, 
  members = 33, dept = 'GEO Rankers', platformStats = {},
  orderCount = 0, wipCount = 0, cancelledCount = 0,
  bestPerformer = null, bestTeam = null,
  deliveredCount = 0, projectCount = 0, projectAmt = 0
}) => {
  
  const pct = Math.round((delivered / total) * 100) || 0;
  const f = (val) => val.toLocaleString(undefined, { minimumFractionDigits: 1 });
  const k = (val) => val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val;

  const platforms = [
    { label: 'B2B REVENUE', val: platformStats.B2B || 0, color: '#f59e0b' },
    { label: 'FIVERR REVENUE', val: platformStats.Fiverr || 0, color: '#10b981' },
    { label: 'PPH REVENUE', val: platformStats.PPH || 0, color: '#8b5cf6' },
    { label: 'UPWORK REVENUE', val: platformStats.Upwork || 0, color: '#3b82f6' },
  ];

  return (
    <div style={{ marginBottom: '40px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Main Department Overview Card */}
      <div style={{ 
        background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.05)', 
        borderRadius: '32px', padding: '40px', position: 'relative', overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', letterSpacing: '1px', marginBottom: '8px' }}>DEPARTMENT OVERVIEW</div>
            <div style={{ fontSize: '40px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
              ${k(delivered)} / <span style={{ color: '#64748b' }}>${k(total)}</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
              Department monthly target — {members} members, 2026-04
            </div>

            <div style={{ marginTop: '32px', position: 'relative' }}>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', width: '100%' }}>
                <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: 'linear-gradient(90deg, #10b981, #3b82f6)', borderRadius: '20px', boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '10px', fontWeight: 800, color: '#475569' }}>
                <span>$0</span>
                <span>Target: ${total.toLocaleString()}.00</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '48px', marginTop: '32px' }}>
              <MiniStat label="ACHIEVED" value={`$${delivered.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color="#10b981" />
              <MiniStat label="REMAINING" value={`$${Math.max(0, total - delivered).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color="#f1f5f9" />
              <MiniStat label="WIP PIPELINE" value={`$${wip.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color="#f59e0b" />
              <MiniStat label="UNIQUE ORDERS" value={orderCount} color="#f1f5f9" />
            </div>
          </div>

          <div style={{ marginLeft: '60px', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
              <svg width="120" height="120" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="none" />
                <circle cx="50" cy="50" r="45" stroke="#3b82f6" strokeWidth="8" strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * pct / 100)} strokeLinecap="round" fill="none" style={{ transition: 'stroke-dashoffset 1.5s ease' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>{pct}%</div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b' }}>DONE</div>
              </div>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', marginTop: '12px' }}>Dept Progress</div>
          </div>
        </div>
      </div>


      {/* 2. Platform Summary Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
        <div style={{ width: '20px', height: '20px', background: 'linear-gradient(45deg, #10b981, #3b82f6)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>📊</div>
        <div style={{ fontSize: '11px', fontWeight: 900, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '1.5px' }}>PLATFORM BREAKDOWN</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
        <StatusCard label="PROJECTS" val={projectCount} sub="Total unique orders" color="#8b5cf6" icon="📊" />
        <StatusCard label="TOTAL DELIVERED" val={`$${k(delivered)}`} sub={`${deliveredCount} delivered`} color="#10b981" icon="✉️" />
        <StatusCard label="WIP PIPELINE" val={`$${k(wip)}`} sub={`${wipCount} active`} color="#f59e0b" icon="⏳" />
        <StatusCard label="CANCELLED" val={`$${k(cancelled)}`} sub={`${cancelledCount} lost`} color="#ef4444" icon="❌" />
        <StatusCard label="MEMBERS" val={members} sub="Across 4 teams" color="#3b82f6" icon="👥" />
        <StatusCard label="TARGET" val={`$${k(total)}`} sub={`${Math.round(pct)}% completed`} color="#6366f1" icon="🎯" active={true} />
      </div>

      {/* 3. Real Platform Stats (Mini) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '8px' }}>
        {platforms.map((p, i) => (
          <div key={i} style={{ 
            background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.03)', 
            borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b' }}>{p.label}</div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>${k(p.val)}</div>
          </div>
        ))}
      </div>

      {/* 4. Accolades Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
        <AccoladeCard 
          label="BEST PERFORMER" 
          name={bestPerformer?.name || "TBA"} 
          sub={`$${(bestPerformer?.deliveredAmt || 0).toLocaleString()} delivered`} 
          icon="🏆" 
          color="#f59e0b" 
        />
        <AccoladeCard 
          label="BEST TEAM" 
          name={bestTeam?.name || "TBA"} 
          sub={`${Math.round((bestTeam?.deliveredAmt / (bestTeam?.target || 1)) * 100) || 0}% of target - $${(bestTeam?.deliveredAmt || 0).toLocaleString()}`} 
          icon="🔥" 
          color="#f97316" 
        />
      </div>
    </div>
  );
};

const StatusCard = ({ label, val, sub, color, icon, active = false }) => (
  <div style={{ 
    background: 'rgba(15, 23, 42, 0.7)', border: active ? `1px solid ${color}44` : '1px solid rgba(255,255,255,0.05)', 
    borderRadius: '24px', padding: '24px', position: 'relative', overflow: 'hidden',
    boxShadow: active ? `0 0 20px ${color}11` : 'none'
  }}>
    <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '48px', opacity: 0.05 }}>{icon}</div>
    <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ fontSize: '24px', fontWeight: 900, color: color }}>{val}</div>
    <div style={{ fontSize: '11px', color: '#475569', fontWeight: 700, marginTop: '4px' }}>{sub}</div>
  </div>
);

const MEM_TARGET = () => 1100;

const MiniStat = ({ label, value, color }) => (
  <div>
    <div style={{ fontSize: '18px', fontWeight: 900, color: color, marginBottom: '4px' }}>{value}</div>
    <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b' }}>{label}</div>
  </div>
);


const AccoladeCard = ({ label, name, sub, icon, color }) => (
  <div style={{ 
    background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.05)', 
    borderRadius: '24px', padding: '24px', display: 'flex', gap: '20px', alignItems: 'center'
  }}>
    <div style={{ fontSize: '32px' }}>{icon}</div>
    <div>
      <div style={{ fontSize: '9px', fontWeight: 800, color: color, marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', marginBottom: '2px' }}>{name}</div>
      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{sub}</div>
    </div>
  </div>
);

export default DeptOverview;
