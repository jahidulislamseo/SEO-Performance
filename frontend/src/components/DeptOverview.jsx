import React from 'react';

const DeptOverview = ({ total = 35000, delivered = 0, wip = 0, cancelled = 0, members = 0, dept = 'GEO Rankers', month = 'April 2026' }) => {
  const pct = Math.min(100, Math.round((delivered / total) * 100));
  const dashArray = 263.9;
  const dashOffset = dashArray - (dashArray * pct / 100);

  return (
    <div className="dept-card" style={{ background: 'var(--card)', backdropFilter: 'blur(16px)', border: 'var(--border)', boxShadow: 'var(--shadow)', borderRadius: '24px', overflow: 'hidden', padding: '32px' }}>
      <div className="dept-inner" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div className="dept-tag" style={{ color: '#3b82f6', fontWeight: 800 }}>Performance Milestone</div>
          <div className="dept-heading" style={{ fontSize: '32px', marginTop: '8px' }}>
            ${delivered.toLocaleString()} <span style={{ fontSize: '18px', fontWeight: 600, color: '#64748b' }}>Achieved</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px', fontWeight: 600 }}>
            {dept} Department is at {pct}% of the monthly target.
          </p>
          
          <div className="dept-stats-grid" style={{ display: 'flex', gap: '32px', marginTop: '24px' }}>
            <div className="ds-item">
              <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#64748b', letterSpacing: '1px' }}>Monthly Target</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#f8fafc', marginTop: '2px' }}>${total.toLocaleString()}</div>
            </div>
            <div className="ds-item">
              <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#64748b', letterSpacing: '1px' }}>Pending WIP</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#f59e0b', marginTop: '2px' }}>${wip.toLocaleString()}</div>
            </div>
            <div className="ds-item">
              <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#64748b', letterSpacing: '1px' }}>Team Strength</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#10b981', marginTop: '2px' }}>{members} Active</div>
            </div>
          </div>

          <div className="dept-progress-section" style={{ marginTop: '24px', maxWidth: '400px' }}>
            <div className="dept-track" style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px' }}>
              <div className="dept-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #10b981, #3b82f6)', boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', fontWeight: 800, color: '#64748b' }}>
              <span>CURRENT: ${delivered.toLocaleString()}</span>
              <span>GOAL: ${total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="dept-viz" style={{ paddingLeft: '40px', borderLeft: '1px solid rgba(148,163,184,0.1)' }}>
          <div className="dept-ring-container" style={{ width: '120px', height: '120px' }}>
            <svg width={120} height={120} viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={42} stroke="rgba(255,255,255,.03)" strokeWidth={10} fill="none" />
              <circle
                fill="none" cx={50} cy={50} r={42}
                stroke="#3b82f6" strokeWidth={10}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>
            <div className="dept-ring-inner">
              <div className="dept-ring-pct" style={{ fontSize: '24px', color: '#f8fafc' }}>{pct}%</div>
              <div className="dept-ring-lbl" style={{ textTransform: 'uppercase', fontSize: '9px', letterSpacing: '1px' }}>Efficiency</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeptOverview;
