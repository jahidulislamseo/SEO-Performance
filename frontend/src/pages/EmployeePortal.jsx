import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/css/employee.css';

const PROJECTS = [
  { title: 'Local SEO — Dhaka Restaurant', service: 'Local SEO', amtX: 120, status: 'Delivered', date: 'Apr 18' },
  { title: 'GMB Optimization × 3 Locations', service: 'GMB', amtX: 90, status: 'Delivered', date: 'Apr 15' },
  { title: 'National SEO — E-commerce', service: 'National SEO', amtX: 250, status: 'WIP', date: 'Apr 22' },
  { title: 'Citation Building Package', service: 'Citations', amtX: 75, status: 'Delivered', date: 'Apr 10' },
  { title: 'Press Release Distribution', service: 'PR', amtX: 80, status: 'Revision', date: 'Apr 20' },
  { title: 'Competitor Analysis Report', service: 'Research', amtX: 60, status: 'Cancelled', date: 'Apr 8' },
];

const ATT_DATA = [1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 't', 'f', 'f', 'f', 'f', 'f'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const avatarGradient = (name) => {
  const GRADIENTS = [
    'linear-gradient(135deg,#2f5d8a,#5f85a2)',
    'linear-gradient(135deg,#0f766e,#10b981)',
    'linear-gradient(135deg,#7c3aed,#a78bfa)',
    'linear-gradient(135deg,#b45309,#f59e0b)',
    'linear-gradient(135deg,#be123c,#f43f5e)',
    'linear-gradient(135deg,#1d4ed8,#60a5fa)',
  ];
  return GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];
};

const getInitials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const statusBadge = (s) => {
  const map = {
    Delivered: { bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.3)', color: '#34d399', icon: '✅' },
    WIP: { bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.3)', color: '#fbbf24', icon: '⏳' },
    Revision: { bg: 'rgba(99,102,241,.12)', border: 'rgba(99,102,241,.3)', color: '#a5b4fc', icon: '🔄' },
    Cancelled: { bg: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.3)', color: '#f87171', icon: '❌' },
  };
  const c = map[s] || map.WIP;
  return <span className="sbadge" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>{c.icon} {s}</span>;
};

function EmployeePortal() {
  const [screen, setScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [empId, setEmpId] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [checkedIn, setCheckedIn] = useState(true);
  const [navItem, setNavItem] = useState('overview');

  useEffect(() => {
    fetch('http://localhost:5000/api/data')
      .then(res => res.json())
      .then(data => setMembers(data.data || []))
      .catch(console.error);
  }, []);

  const doLogin = (member = null) => {
    if (member) {
      setUser(member);
      setScreen('dashboard');
      return;
    }

    const found = members.find(m => m.id === empId || m.name.toLowerCase() === empId.toLowerCase());
    if (found && pass === 'pass123') {
      setUser(found);
      setScreen('dashboard');
      setErr('');
    } else {
      setErr('Invalid ID or password. Use pass123');
    }
  };

  const logout = () => {
    setScreen('login');
    setUser(null);
    setEmpId('');
    setPass('');
  };

  if (screen === 'login') {
    return (
      <div className="login-screen">
        <div className="lp-left">
          <div className="lpl-inner">
            <div className="lpl-logo">
              <div className="lpl-logo-icon">🌍</div>
              <span className="lpl-logo-text">GEO Rankers</span>
            </div>
            <h1 className="lpl-headline">Your work,<br />all in one place.</h1>
            <p className="lpl-sub">Attendance, projects, performance — everything you need, one dashboard.</p>
            <div className="lpl-features">
              {[
                ['📊', 'Real-time Attendance', 'One-click check-in / check-out'],
                ['📁', 'Project Tracking', 'Progress and deadlines at a glance'],
                ['🏆', 'Performance KPIs', 'Monthly metrics and leave balance']
              ].map(([icon, title, sub]) => (
                <div className="lpl-feat" key={title}>
                  <div className="lpl-feat-icon">{icon}</div>
                  <div>
                    <div className="lpl-feat-title">{title}</div>
                    <div className="lpl-feat-sub">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="lpl-live"><div className="lpl-live-dot"></div><span>Live system · April 2026</span></div>
          </div>
        </div>
        <div className="lp-right">
          <div className="lc-card">
            <div className="lc-brand">
              <div className="lc-logo-icon">🌍</div>
              <div><div className="lc-brand-name">GEO Rankers</div><div className="lc-brand-sub">Employee Portal</div></div>
            </div>
            <h2 className="lc-title">Welcome back</h2>
            <p className="lc-desc">Sign in to access your dashboard</p>
            <div className="lf-group">
              <label className="lf-label">Employee ID or Name</label>
              <div className="lf-input-wrap">
                <span className="lf-icon">🪪</span>
                <input className="lf-input" placeholder="e.g. Alamin" value={empId} onChange={e => setEmpId(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLogin()} />
              </div>
            </div>
            <div className="lf-group">
              <label className="lf-label">Password</label>
              <div className="lf-input-wrap">
                <span className="lf-icon">🔒</span>
                <input className="lf-input" type="password" placeholder="pass123" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLogin()} />
              </div>
            </div>
            {err && <div className="lf-err">{err}</div>}
            <button className="lf-submit" onClick={() => doLogin()}>Sign In to Portal</button>
            <div className="lc-divider">Quick demo access</div>
            <div className="lc-demos">
              {members.slice(0, 3).map(m => (
                <button key={m.id} className="demo-card" onClick={() => doLogin(m)}>
                  <span className="demo-av" style={{ background: avatarGradient(m.name) }}>{getInitials(m.name)}</span>
                  <div><div className="demo-name">{m.name}</div><div className="demo-role">{m.role || 'Team Member'}</div></div>
                  <span className="demo-id">{m.id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pct = user ? Math.min(100, Math.round(((user.deliveredAmt || 0) / (user.target || 1100)) * 100)) : 0;
  const da = 263.9, ds = da - (da * pct / 100);

  return (
    <div className="emp-app">
      <aside className="emp-sidebar">
        <div className="sb-top">
          <div className="sb-brand">
            <div className="sb-brand-icon">🌍</div>
            <div><div className="sb-brand-name">GEO Rankers</div><div className="sb-brand-sub">HR Portal</div></div>
          </div>
        </div>
        <nav className="sb-nav">
          {[
            { id: 'overview', icon: '📊', label: 'Overview' },
            { id: 'attendance', icon: '📅', label: 'Attendance' },
            { id: 'projects', icon: '📁', label: 'My Projects' },
            { id: 'performance', icon: '🏆', label: 'Performance' },
          ].map(n => (
            <button key={n.id} className={`sb-item ${navItem === n.id ? 'active' : ''}`} onClick={() => setNavItem(n.id)}>
              <span className="sb-icon">{n.icon}</span>
              <span className="sb-label">{n.label}</span>
            </button>
          ))}
          <div className="sb-divider"></div>
          <Link to="/" className="sb-item">
            <span className="sb-icon">←</span>
            <span className="sb-label">Main Dashboard</span>
          </Link>
        </nav>
        <div className="sb-bottom">
          <div className="sb-user-mini">
            <div className="sb-user-av" style={{ background: avatarGradient(user.name) }}>{getInitials(user.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sb-user-name">{user.name}</div>
              <div className="sb-user-id">{user.id}</div>
            </div>
            <button className="sb-logout" onClick={logout} title="Logout">↩</button>
          </div>
        </div>
      </aside>

      <main className="emp-main">
        <header className="emp-topbar">
          <div className="tb-left">
            <div className="emp-greeting">Good morning, <span>{user.name.split(' ')[0]}</span> 👋</div>
          </div>
          <div className="tb-right">
            <div className="tb-datetime">
              <div className="tb-clock">{new Date().toLocaleTimeString()}</div>
              <div className="tb-date">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </header>

        <div className="emp-content">
          <div className="stat-cards">
            <div className="stat-card" style={{ '--sc-color': '#10b981' }}>
              <div className="sc-value">${(user.deliveredAmt || 0).toLocaleString()}</div>
              <div className="sc-label">Delivered</div>
            </div>
            <div className="stat-card" style={{ '--sc-color': '#f59e0b' }}>
              <div className="sc-value">${(user.wipAmt || 0).toLocaleString()}</div>
              <div className="sc-label">WIP</div>
            </div>
            <div className="stat-card" style={{ '--sc-color': '#3b82f6' }}>
              <div className="sc-value">{pct}%</div>
              <div className="sc-label">Target Hit</div>
            </div>
            <div className="stat-card" style={{ '--sc-color': '#6366f1' }}>
              <div className="sc-value">{user.delivered || 0}</div>
              <div className="sc-label">Orders Done</div>
            </div>
          </div>

          <div className="overview-grid">
            <div className="emp-card">
              <div className="emp-card-header">
                <div className="emp-card-title">📅 Attendance — {new Date().toLocaleString('default', { month: 'long' })}</div>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="lpl-live-dot"></div>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>{checkedIn ? 'Checked In — 9:02 AM' : 'Not Checked In'}</span>
                  </div>
                  <button 
                    className={`wb-checkin-btn ${checkedIn ? 'check-out' : 'check-in'}`}
                    onClick={() => setCheckedIn(!checkedIn)}
                  >
                    {checkedIn ? '⬛ Check Out' : '✅ Check In'}
                  </button>
                </div>
                <div className="att-calendar" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                  {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#64748b' }}>{d}</div>)}
                  {ATT_DATA.map((v, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                        background: v === 1 ? 'rgba(16,185,129,0.1)' : v === 0 ? 'rgba(239,68,68,0.1)' : v === 't' ? 'rgba(59,130,246,0.15)' : 'transparent',
                        color: v === 1 ? '#10b981' : v === 0 ? '#ef4444' : v === 't' ? '#3b82f6' : '#475569',
                        border: v === 't' ? '1px solid #3b82f6' : 'none'
                      }}
                    >
                      {i + 1 <= 28 ? i + 1 : ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="emp-card">
              <div className="emp-card-header">
                <div className="emp-card-title">🏆 Performance Ring</div>
              </div>
              <div style={{ padding: 24, textAlign: 'center' }}>
                <div className="perf-ring" style={{ margin: '0 auto', width: 120, height: 120, position: 'relative' }}>
                  <svg width="120" height="120" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,.06)" strokeWidth="8" fill="none" />
                    <circle 
                      cx="50" cy="50" r="42" stroke={pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'} 
                      strokeWidth="8" fill="none"
                      strokeDasharray={da} strokeDashoffset={ds} strokeLinecap="round"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1.8s ease' }} 
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 900 }}>{pct}%</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>Target</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 24 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#10b981' }}>{user.delivered || 0}</div>
                    <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' }}>Done</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#f59e0b' }}>{user.wip || 0}</div>
                    <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase' }}>WIP</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="emp-card">
            <div className="emp-card-header">
              <div className="emp-card-title">📁 My Projects — Recent</div>
            </div>
            <div style={{ padding: '8px 18px' }}>
              {(user.projects || PROJECTS).slice(0, 6).map((p, i) => (
                <div key={i} className="proj-item" style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', borderRadius: 0, padding: '14px 0' }}>
                  <div>
                    <div className="proj-name">{p.order || p.title || p.client}</div>
                    <div className="proj-sub">{p.service} · {p.date}</div>
                  </div>
                  <div className="proj-right">
                    <span className="proj-amt">${(p.share || p.amtX || 0).toLocaleString()}</span>
                    {statusBadge(p.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EmployeePortal;
