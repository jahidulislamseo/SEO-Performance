import React from 'react';

const KpiCard = ({ label, value, sub, color = '#f1f5f9', icon }) => {
  return (
    <div className="kpi-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div className="kpi-tag" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 800, color: '#64748b' }}>
          {label}
        </div>
        <div className="kpi-val" style={{ fontSize: '28px', fontWeight: 900, color, marginTop: '8px', letterSpacing: '-0.5px' }}>
          {value}
        </div>
        {sub && <div className="kpi-sub" style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>{sub}</div>}
      </div>
      {icon && (
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '64px', opacity: 0.05, filter: 'grayscale(1)', transform: 'rotate(15deg)' }}>
          {icon}
        </div>
      )}
    </div>
  );
};

export default KpiCard;
