import React, { useState, useEffect } from 'react';

const Header = ({ dept = "GEO Rankers", month = "April 2026", onRefresh, onExport, onManagerView }) => {
  const [time, setTime] = useState('');
  const [theme, setThemeState] = useState('dark');

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(d.toLocaleTimeString('en-US', { hour12: false }));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <header className="hdr">
      <div className="hl">
        <div className="logo" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)' }}>🌍</div>
        <div className="ht">
          <h1 style={{ fontSize: '20px', letterSpacing: '-0.8px' }}>SEO Performance Hub</h1>
          <p style={{ fontWeight: 600, opacity: 0.8 }}>{dept} · {month}</p>
        </div>
      </div>

      <div className="hr">
        <div className="live-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
          <div className="ldot" style={{ background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
          <span>Systems Active</span>
        </div>
        
        <div className="header-actions" style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.1)' }}>
          <button className="hbtn" style={{ border: 'none', background: 'transparent', fontSize: '14px' }} onClick={onRefresh} title="Refresh Sync">↻</button>
          <button className="hbtn" style={{ border: 'none', background: 'transparent', fontSize: '14px' }} onClick={() => window.print()} title="Print Dashboard">🖨️</button>
          <button className="hbtn" style={{ border: 'none', background: 'transparent', fontSize: '14px' }} onClick={toggleTheme} title="Toggle Theme">{theme === 'dark' ? '☀️' : '🌙'}</button>
        </div>

        <button className="hbtn green" style={{ fontSize: '10px', padding: '6px 12px' }} onClick={onExport}>
          ⬇️ EXPORT CSV
        </button>

        <div className="clock-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '10px', padding: '6px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.1)' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#64748b' }}>Time</span>
          <div className="clock" style={{ fontSize: '14px', fontWeight: 800, color: '#3b82f6' }}>{time}</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
