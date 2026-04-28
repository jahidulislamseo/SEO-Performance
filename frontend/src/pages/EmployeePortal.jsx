import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [deptSummary, setDeptSummary] = useState(null);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [empId, setEmpId] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [navItem, setNavItem] = useState('overview');
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => { setMembers(data.data || []); setDeptSummary(data.summary || null); setMembersLoaded(true); })
      .catch(() => setMembersLoaded(true));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const doLogin = (member = null) => {
    if (member) {
      setUser(member);
      localStorage.setItem('user', JSON.stringify(member));
      setScreen('dashboard');
      return;
    }

    if (!membersLoaded) { setErr('Connecting to server...'); return; }
    if (members.length === 0) { setErr('Cannot reach server. Make sure the backend is running.'); return; }
    const found = members.find(m => m.id === empId || m.name.toLowerCase() === empId.toLowerCase());
    if (!found) { setErr('Employee not found. Try clicking a demo card below.'); return; }
    if (pass !== 'pass123') { setErr('Wrong password. Default password: pass123'); return; }
    setUser(found);
    localStorage.setItem('user', JSON.stringify(found));
    setScreen('dashboard');
    setErr('');
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
                <input className="lf-input" type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLogin()} />
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

  const hour = clock.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const pct = user ? Math.min(100, Math.round(((user.deliveredAmt || 0) / (user.target || 1100)) * 100)) : 0;
  const da = 263.9, ds = da - (da * pct / 100);

  const isAdmin = user.isAdmin === true;

  const NAV = [
    {
      id: 'overview', label: 'Overview',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    },
    {
      id: 'attendance', label: 'Attendance',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    },
    {
      id: 'projects', label: 'My Projects',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    },
    {
      id: 'performance', label: 'Performance',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    },
    ...(isAdmin ? [{
      id: 'admin', label: 'Admin Panel',
      admin: true,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    }] : []),
  ];

  return (
    <div className="emp-app">
      <aside className="emp-sidebar">
        <div className="sb-top">
          <div className="sb-brand">
            <div className="sb-brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </div>
            <div>
              <div className="sb-brand-name">GEO Rankers</div>
              <div className="sb-brand-sub">HR Portal</div>
            </div>
          </div>
        </div>

        <nav className="sb-nav">
          <div className="sb-section-label">MAIN MENU</div>
          {NAV.map(n => (
            <button
              key={n.id}
              className={`sb-item ${navItem === n.id ? 'active' : ''} ${n.admin ? 'sb-admin-item' : ''}`}
              onClick={() => setNavItem(n.id)}
            >
              <span className="sb-icon">{n.icon}</span>
              <span className="sb-label">{n.label}</span>
              {navItem === n.id && <span className="sb-active-dot" />}
            </button>
          ))}

          <div className="sb-divider" />

          <Link to="/" className="sb-item sb-back">
            <span className="sb-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </span>
            <span className="sb-label">Main Dashboard</span>
          </Link>
        </nav>

        <div className="sb-bottom">
          <div className="sb-user-mini">
            <div className="sb-user-av" style={{ background: avatarGradient(user.name) }}>{getInitials(user.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div className="sb-user-name">{user.name}</div>
                {isAdmin && <span className="sb-admin-badge">ADMIN</span>}
              </div>
              <div className="sb-user-id">{user.id}</div>
            </div>
            <button className="sb-logout" onClick={logout} title="Logout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="emp-main">
        <header className="emp-topbar">
          <div className="tb-left">
            <div className="emp-greeting">{greeting}, <span>{user.name.split(' ')[0]}</span> 👋</div>
          </div>
          <div className="tb-right">
            <div className="tb-datetime">
              <div className="tb-clock">{clock.toLocaleTimeString()}</div>
              <div className="tb-date">{clock.toLocaleDateString()}</div>
            </div>
          </div>
        </header>

        <div className="emp-content">
          {/* Stat cards — always visible */}
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

          {/* OVERVIEW TAB */}
          {navItem === 'overview' && (
            <OverviewDashboard
              user={user} members={members} deptSummary={deptSummary}
              pct={pct} da={da} ds={ds}
              clock={clock} checkedIn={checkedIn} setCheckedIn={setCheckedIn}
            />
          )}

          {/* ATTENDANCE TAB */}
          {navItem === 'attendance' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Present', value: ATT_DATA.filter(v => v === 1).length, color: '#10b981' },
                  { label: 'Absent',  value: ATT_DATA.filter(v => v === 0).length, color: '#ef4444' },
                  { label: 'Today',   value: ATT_DATA.filter(v => v === 't').length, color: '#3b82f6' },
                  { label: 'Future',  value: ATT_DATA.filter(v => v === 'f').length, color: '#64748b' },
                ].map(s => (
                  <div key={s.label} className="emp-card" style={{ padding: '18px 20px' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <AttendanceCard clock={clock} checkedIn={checkedIn} setCheckedIn={setCheckedIn} fullPage />
            </div>
          )}

          {/* PROJECTS TAB */}
          {navItem === 'projects' && (
            <ProjectsPage user={user} />
          )}

          {/* PERFORMANCE TAB */}
          {navItem === 'performance' && (
            <div className="overview-grid">
              <PerformanceRing pct={pct} da={da} ds={ds} user={user} large />
              <div className="emp-card">
                <div className="emp-card-header">
                  <div className="emp-card-title">📊 Monthly Target</div>
                </div>
                <div style={{ padding: 24 }}>
                  {[
                    { label: 'Target',    value: `$${(user.target || 1100).toLocaleString()}`, color: '#64748b' },
                    { label: 'Delivered', value: `$${(user.deliveredAmt || 0).toLocaleString()}`, color: '#10b981' },
                    { label: 'WIP',       value: `$${(user.wipAmt || 0).toLocaleString()}`, color: '#f59e0b' },
                    { label: 'Remaining', value: `$${Math.max(0, (user.target || 1100) - (user.deliveredAmt || 0)).toLocaleString()}`, color: '#3b82f6' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{row.label}</span>
                      <span style={{ fontSize: 16, fontWeight: 900, color: row.color }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ADMIN TAB */}
          {navItem === 'admin' && isAdmin && (
            <AdminPanel members={members} deptSummary={deptSummary} />
          )}
        </div>
      </main>
    </div>
  );
}

const AttendanceCard = ({ clock, checkedIn, setCheckedIn, fullPage }) => (
  <div className="emp-card" style={fullPage ? {} : {}}>
    <div className="emp-card-header">
      <div className="emp-card-title">📅 Attendance — {clock.toLocaleString('default', { month: 'long' })}</div>
    </div>
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="lpl-live-dot" style={{ opacity: checkedIn ? 1 : 0.3 }}></div>
          <span style={{ color: checkedIn ? '#10b981' : '#64748b', fontWeight: 700 }}>
            {checkedIn ? 'Checked In — 9:02 AM' : 'Not Checked In'}
          </span>
        </div>
        <button
          className={`wb-checkin-btn ${checkedIn ? 'check-out' : 'check-in'}`}
          onClick={() => setCheckedIn(!checkedIn)}
        >
          {checkedIn ? '⬛ Check Out' : '✅ Check In'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
        {DAYS.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 800, color: '#64748b' }}>{d}</div>)}
        {ATT_DATA.map((v, i) => (
          <div key={i} style={{
            aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
            background: v === 1 ? 'rgba(16,185,129,0.1)' : v === 0 ? 'rgba(239,68,68,0.1)' : v === 't' ? 'rgba(59,130,246,0.15)' : 'transparent',
            color: v === 1 ? '#10b981' : v === 0 ? '#ef4444' : v === 't' ? '#3b82f6' : '#475569',
            border: v === 't' ? '1px solid #3b82f6' : 'none',
          }}>
            {i + 1 <= 28 ? i + 1 : ''}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PerformanceRing = ({ pct, da, ds, user }) => (
  <div className="emp-card">
    <div className="emp-card-header">
      <div className="emp-card-title">🏆 Performance Ring</div>
    </div>
    <div style={{ padding: 24, textAlign: 'center' }}>
      <div style={{ margin: '0 auto', width: 120, height: 120, position: 'relative' }}>
        <svg width="120" height="120" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,.06)" strokeWidth="8" fill="none" />
          <circle
            cx="50" cy="50" r="42"
            stroke={pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'}
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
);

const STATUS_COLORS = {
  Delivered: '#10b981',
  WIP:       '#f59e0b',
  Revision:  '#a78bfa',
  Cancelled: '#ef4444',
};

const ProjectsList = ({ user, title, limit }) => {
  const projects = (user.projects || PROJECTS).slice(0, limit);
  return (
    <div className="emp-card">
      <div className="emp-card-header">
        <div className="emp-card-title">{title}</div>
        <span style={{ fontSize: 11, color: '#334155', fontWeight: 700 }}>{projects.length} orders</span>
      </div>
      <div style={{ padding: '6px 0 10px' }}>
        {projects.map((p, i) => {
          const color = STATUS_COLORS[p.status] || '#64748b';
          return (
            <div key={i} className="plist-row">
              <div className="plist-bar" style={{ background: color }} />
              <div className="plist-left">
                <div className="plist-order">{p.order || p.title || p.client}</div>
                <div className="plist-meta">
                  <span className="plist-tag">{p.service || '—'}</span>
                  <span className="plist-dot-sep">·</span>
                  <span>{p.date || '—'}</span>
                </div>
              </div>
              <div className="plist-mid">
                <div className="plist-mid-label">CLIENT</div>
                <div className="plist-mid-val">{p.client || '—'}</div>
              </div>
              <div className="plist-mid">
                <div className="plist-mid-label">ASSIGNED</div>
                <div className="plist-mid-val">{p.assign || p.deliveredBy || '—'}</div>
              </div>
              <div className="plist-right">
                <div className="plist-amt">${(p.share || p.amtX || 0).toLocaleString()}</div>
                <div className="plist-status" style={{ color, background: `${color}18`, border: `1px solid ${color}40` }}>
                  {p.status || 'WIP'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const STATUS_CONFIG = {
  Delivered: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', dot: '#10b981' },
  WIP:       { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  dot: '#f59e0b' },
  Revision:  { color: '#a78bfa', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)', dot: '#a78bfa' },
  Cancelled: { color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  dot: '#ef4444' },
};

const ProjectCard = ({ p }) => {
  const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.WIP;
  const persons = (p.amtX && p.share && p.amtX !== p.share)
    ? Math.round(p.amtX / p.share)
    : null;

  return (
    <div className="pcard">
      {/* Header row */}
      <div className="pcard-header">
        <span className="pcard-order">{p.order || p.title || '—'}</span>
        <span className="pcard-status" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
          <span className="pcard-dot" style={{ background: cfg.dot }} />
          {(p.status || 'WIP').toUpperCase()}
        </span>
      </div>

      {/* Meta grid */}
      <div className="pcard-meta">
        <div className="pcard-field">
          <div className="pcard-field-label">CLIENT</div>
          <div className="pcard-field-value">{p.client || '—'}</div>
        </div>
        <div className="pcard-field">
          <div className="pcard-field-label">SERVICE</div>
          <div className="pcard-field-value">{p.service || '—'}</div>
        </div>
        <div className="pcard-field">
          <div className="pcard-field-label">ASSIGNED</div>
          <div className="pcard-field-value">{p.assign || p.deliveredBy || '—'}</div>
        </div>
        <div className="pcard-field">
          <div className="pcard-field-label">ORDER DATE</div>
          <div className="pcard-field-value">{p.date || '—'}</div>
        </div>
        <div className="pcard-field">
          <div className="pcard-field-label">DELIVERED</div>
          <div className="pcard-field-value">{p.deliveredDate || (p.status === 'Delivered' ? '—' : <span style={{ color: '#475569' }}>Pending</span>)}</div>
        </div>
        <div className="pcard-field">
          <div className="pcard-field-label">ORDER LINK</div>
          <div className="pcard-field-value">
            {p.link
              ? <a href={p.link} target="_blank" rel="noreferrer" className="pcard-link">Open Order ↗</a>
              : <span style={{ color: '#334155' }}>—</span>
            }
          </div>
        </div>
      </div>

      {/* Amount footer */}
      <div className="pcard-footer">
        <div>
          <div className="pcard-footer-label">Amount Share</div>
          {persons && <div className="pcard-footer-sub">${(p.amtX || 0).toLocaleString()} ÷ {persons} persons</div>}
        </div>
        <div className="pcard-amount" style={{ color: cfg.color }}>
          ${(p.share || p.amtX || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
};

const ProjectsPage = ({ user }) => {
  const [filter, setFilter] = React.useState('All');
  const allProjects = user.projects || PROJECTS;
  const statuses = ['All', 'Delivered', 'WIP', 'Revision', 'Cancelled'];
  const counts = statuses.reduce((acc, s) => {
    acc[s] = s === 'All' ? allProjects.length : allProjects.filter(p => p.status === s).length;
    return acc;
  }, {});
  const visible = filter === 'All' ? allProjects : allProjects.filter(p => p.status === filter);

  return (
    <div>
      {/* Filter tabs */}
      <div className="pfilter-bar">
        {statuses.map(s => (
          <button
            key={s}
            className={`pfilter-btn ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s}
            <span className="pfilter-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="pcard-list">
        {visible.length === 0
          ? <div className="pcard-empty">No projects found</div>
          : visible.map((p, i) => <ProjectCard key={i} p={p} />)
        }
      </div>
    </div>
  );
};

// ─── Admin Panel ───────────────────────────────────────────────
// ── shared admin UI helpers ─────────────────────────────────────
const TEAMS = ['GEO Rankers', 'Rank Riser', 'Search Apex', 'SMM'];
const ROLES = ['SEO Executive', 'Team Leader', 'Team Member', 'Manager', 'SMM Executive'];
const TEAM_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a78bfa'];

const Btn = ({ children, onClick, color = '#3b82f6', sm, danger, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: sm ? '5px 12px' : '9px 18px',
    borderRadius: 9, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    background: danger ? 'rgba(239,68,68,0.12)' : `${color}22`,
    color: danger ? '#f87171' : color,
    fontSize: sm ? 11 : 13, fontWeight: 800,
    fontFamily: 'Manrope, sans-serif',
    border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : color + '44'}`,
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s',
  }}>{children}</button>
);

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', marginBottom: 5, letterSpacing: 0.5 }}>{label}</div>
    {children}
  </div>
);

const Input = ({ value, onChange, placeholder, type = 'text' }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#f1f5f9', fontSize: 13, fontFamily: 'Manrope, sans-serif', boxSizing: 'border-box' }} />
);

const Select = ({ value, onChange, options }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '9px 12px', background: '#0c1424', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#f1f5f9', fontSize: 13, fontFamily: 'Manrope, sans-serif' }}>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const Modal = ({ title, onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
    onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{ background: '#0c1424', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 28, width: 480, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#f1f5f9' }}>{title}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const Toast = ({ msg, type }) => msg ? (
  <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, padding: '12px 20px', borderRadius: 12, background: type === 'error' ? '#7f1d1d' : '#064e3b', border: `1px solid ${type === 'error' ? '#ef4444' : '#10b981'}`, color: type === 'error' ? '#fca5a5' : '#6ee7b7', fontSize: 13, fontWeight: 700 }}>{msg}</div>
) : null;

// ── Sub-panels ─────────────────────────────────────────────────
const AdminOverview = ({ members, deptSummary }) => {
  const dept = deptSummary?.dept || {};
  const teamMap = {};
  members.forEach(m => {
    const t = m.team || 'Unknown';
    if (!teamMap[t]) teamMap[t] = { delivered: 0, wip: 0, target: 0, count: 0 };
    teamMap[t].delivered += m.deliveredAmt || 0;
    teamMap[t].wip       += m.wipAmt || 0;
    teamMap[t].target    += m.target || 0;
    teamMap[t].count     += 1;
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'TOTAL TARGET', value: '$'+(dept.target||0).toLocaleString(), color: '#64748b' },
          { label: 'ACHIEVED',     value: '$'+Math.round(dept.achieved||0).toLocaleString(), color: '#10b981' },
          { label: 'WIP',          value: '$'+Math.round(dept.wipAmt||0).toLocaleString(), color: '#f59e0b' },
          { label: 'TOTAL ORDERS', value: dept.uniqueProjects||0, color: '#3b82f6' },
        ].map(k => (
          <div key={k.label} className="emp-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: '#334155', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>
      <div className="emp-card">
        <div className="emp-card-header"><div className="emp-card-title">Team Overview</div></div>
        <div style={{ padding: '4px 0 8px' }}>
          {Object.entries(teamMap).map(([name, t], i) => {
            const p = t.target > 0 ? Math.min(100, Math.round(t.delivered / t.target * 100)) : 0;
            const c = TEAM_COLORS[i % 4];
            return (
              <div key={name} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 60px', gap: 16, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{name}</span>
                    <span style={{ fontSize: 10, color: '#334155' }}>{t.count} members</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${p}%`, background: c, borderRadius: 99 }} />
                  </div>
                </div>
                <div><div style={{ fontSize: 9, color: '#334155', marginBottom: 3 }}>DELIVERED</div><div style={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>${Math.round(t.delivered).toLocaleString()}</div></div>
                <div><div style={{ fontSize: 9, color: '#334155', marginBottom: 3 }}>WIP</div><div style={{ fontSize: 14, fontWeight: 900, color: '#f59e0b' }}>${Math.round(t.wip).toLocaleString()}</div></div>
                <div style={{ fontSize: 16, fontWeight: 900, color: p>=70?'#10b981':p>=40?'#f59e0b':'#ef4444', textAlign: 'right' }}>{p}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AdminMembers = ({ members }) => {
  const [list, setList] = React.useState([]);
  const [modal, setModal] = React.useState(null); // null | 'edit' | 'add'
  const [form, setForm] = React.useState({});
  const [toast, setToast] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [confirmDel, setConfirmDel] = React.useState(null);

  React.useEffect(() => {
    fetch('/api/admin/members').then(r => r.json()).then(setList);
  }, []);

  const showToast = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const openEdit = (m) => { setForm({ ...m, isAdmin: m.isAdmin || false }); setModal('edit'); };
  const openAdd  = () => { setForm({ id: '', name: '', fullName: '', team: TEAMS[0], role: ROLES[0], target: 1100, email: '', phone: '', password: 'pass123', isAdmin: false }); setModal('add'); };

  const save = async () => {
    const url = modal === 'add' ? '/api/admin/members/add' : '/api/admin/members/update';
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json();
    if (d.ok) { showToast(modal === 'add' ? 'Member added!' : 'Member updated!'); setModal(null); fetch('/api/admin/members').then(r => r.json()).then(setList); }
    else showToast(d.error || 'Error', 'error');
  };

  const deleteMember = async (id) => {
    const r = await fetch('/api/admin/members/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    const d = await r.json();
    if (d.ok) { showToast('Member deleted'); setConfirmDel(null); setList(l => l.filter(m => m.id !== id)); }
    else showToast(d.error || 'Error', 'error');
  };

  const visible = list.filter(m => !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.id?.includes(search));

  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirmDel && (
        <Modal title="Confirm Delete" onClose={() => setConfirmDel(null)}>
          <p style={{ color: '#94a3b8', marginBottom: 20 }}>Delete <strong style={{ color: '#f1f5f9' }}>{confirmDel.name}</strong>? This cannot be undone.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn danger onClick={() => deleteMember(confirmDel.id)}>Delete</Btn>
            <Btn onClick={() => setConfirmDel(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
      {(modal === 'edit' || modal === 'add') && (
        <Modal title={modal === 'add' ? 'Add Member' : `Edit — ${form.name}`} onClose={() => setModal(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Employee ID"><Input value={form.id||''} onChange={f('id')} placeholder="17XXX" /></Field>
            <Field label="Display Name"><Input value={form.name||''} onChange={f('name')} placeholder="Alamin" /></Field>
            <Field label="Full Name"><Input value={form.fullName||''} onChange={f('fullName')} placeholder="Alamin Sheikh" /></Field>
            <Field label="Target ($)"><Input type="number" value={form.target||''} onChange={v => f('target')(Number(v))} placeholder="1100" /></Field>
            <Field label="Team"><Select value={form.team||TEAMS[0]} onChange={f('team')} options={TEAMS} /></Field>
            <Field label="Role"><Select value={form.role||ROLES[0]} onChange={f('role')} options={ROLES} /></Field>
            <Field label="Email"><Input value={form.email||''} onChange={f('email')} placeholder="email@example.com" /></Field>
            <Field label="Phone"><Input value={form.phone||''} onChange={f('phone')} placeholder="+880..." /></Field>
            <Field label="Password"><Input value={form.password||''} onChange={f('password')} placeholder="pass123" /></Field>
            <Field label="Admin Access">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <button onClick={() => f('isAdmin')(!form.isAdmin)} style={{ width: 40, height: 22, borderRadius: 99, border: 'none', cursor: 'pointer', background: form.isAdmin ? '#f59e0b' : 'rgba(255,255,255,0.08)', transition: 'background 0.2s', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 3, left: form.isAdmin ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                </button>
                <span style={{ fontSize: 12, color: form.isAdmin ? '#f59e0b' : '#475569' }}>{form.isAdmin ? 'Admin' : 'Regular'}</span>
              </div>
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <Btn onClick={save} color="#10b981">{modal === 'add' ? 'Add Member' : 'Save Changes'}</Btn>
            <Btn onClick={() => setModal(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
      <div className="emp-card">
        <div className="emp-card-header">
          <div className="emp-card-title">Members ({visible.length})</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / ID..." style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f1f5f9', fontSize: 12, fontFamily: 'Manrope,sans-serif', width: 180 }} />
            <Btn onClick={openAdd} color="#10b981" sm>+ Add Member</Btn>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {['ID','Name','Team','Role','Target','Email','Admin','Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', fontSize: 9, fontWeight: 800, color: '#334155', textAlign: 'left', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {visible.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>{m.id}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: '#334155' }}>{m.fullName}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: '#64748b' }}>{m.team}</td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: '#475569' }}>{m.role}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 800, color: '#3b82f6' }}>${(m.target||0).toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: '#475569' }}>{m.email||'—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {m.isAdmin ? <span style={{ fontSize: 9, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 8px', borderRadius: 99, border: '1px solid rgba(245,158,11,0.25)' }}>ADMIN</span>
                      : <span style={{ fontSize: 9, color: '#334155' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn sm onClick={() => openEdit(m)}>Edit</Btn>
                      <Btn sm danger onClick={() => setConfirmDel(m)}>Delete</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminAttendance = () => {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = React.useState(today);
  const [records, setRecords] = React.useState([]);
  const [editing, setEditing] = React.useState(null);
  const [toast, setToast] = React.useState(null);

  const load = (d) => fetch(`/api/admin/attendance?date=${d}`).then(r => r.json()).then(setRecords);
  React.useEffect(() => { load(date); }, [date]);

  const showToast = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const saveEdit = async () => {
    const r = await fetch('/api/admin/attendance/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emp_id: editing.emp_id, date, ...editing }) });
    const d = await r.json();
    if (d.ok) { showToast('Updated!'); setEditing(null); load(date); }
    else showToast(d.error || 'Error', 'error');
  };

  const statusColor = { Present: '#10b981', Late: '#f59e0b', Absent: '#ef4444', Leave: '#a78bfa' };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {editing && (
        <Modal title={`Edit Attendance — ${editing.emp_id}`} onClose={() => setEditing(null)}>
          <Field label="Status"><Select value={editing.status||'Present'} onChange={v => setEditing(p=>({...p, status: v}))} options={['Present','Late','Absent','Leave']} /></Field>
          <Field label="Check In"><Input value={editing.in||''} onChange={v => setEditing(p=>({...p, in: v}))} placeholder="09:00 AM" /></Field>
          <Field label="Check Out"><Input value={editing.out||''} onChange={v => setEditing(p=>({...p, out: v}))} placeholder="06:00 PM" /></Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <Btn onClick={saveEdit} color="#10b981">Save</Btn>
            <Btn onClick={() => setEditing(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
      <div className="emp-card">
        <div className="emp-card-header">
          <div className="emp-card-title">Attendance Records</div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f1f5f9', fontSize: 12, fontFamily: 'Manrope,sans-serif' }} />
        </div>
        {records.length === 0
          ? <div style={{ padding: 40, textAlign: 'center', color: '#334155', fontSize: 13 }}>No records for {date}</div>
          : <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Employee ID','Status','Check In','Check Out','Duration','Action'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: 9, fontWeight: 800, color: '#334155', textAlign: 'left', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.emp_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace' }}>{r.emp_id}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: statusColor[r.status]||'#64748b', background: `${statusColor[r.status]||'#64748b'}18`, padding: '3px 10px', borderRadius: 99, border: `1px solid ${statusColor[r.status]||'#64748b'}40` }}>{r.status||'—'}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8' }}>{r.in||'—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8' }}>{r.out||'—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b' }}>{r.duration||'—'}</td>
                      <td style={{ padding: '10px 14px' }}><Btn sm onClick={() => setEditing({...r})}>Edit</Btn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>
    </div>
  );
};

const AdminAnnouncements = ({ members }) => {
  const [title, setTitle] = React.useState('');
  const [msg, setMsg] = React.useState('');
  const [target, setTarget] = React.useState('all');
  const [toast, setToast] = React.useState(null);

  const showToast = (m, type='ok') => { setToast({msg:m,type}); setTimeout(()=>setToast(null),3000); };

  const send = async () => {
    if (!msg.trim()) return showToast('Message required', 'error');
    const r = await fetch('/api/admin/announcements', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ title, message: msg, target }) });
    const d = await r.json();
    if (d.ok) { showToast('Announcement sent!'); setTitle(''); setMsg(''); }
    else showToast(d.error||'Error','error');
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="emp-card" style={{ maxWidth: 600 }}>
        <div className="emp-card-header"><div className="emp-card-title">Send Announcement</div></div>
        <div style={{ padding: 20 }}>
          <Field label="TITLE"><Input value={title} onChange={setTitle} placeholder="Monthly update..." /></Field>
          <Field label="SEND TO">
            <Select value={target} onChange={setTarget} options={['all', ...TEAMS]} />
          </Field>
          <Field label="MESSAGE">
            <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={5} placeholder="Write your message here..."
              style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#f1f5f9', fontSize: 13, fontFamily: 'Manrope,sans-serif', resize: 'vertical', boxSizing: 'border-box' }} />
          </Field>
          <Btn onClick={send} color="#10b981">Send to {target === 'all' ? `All (${members.length})` : target}</Btn>
        </div>
      </div>
    </div>
  );
};

const AdminLeaveRequests = () => {
  const [requests, setRequests] = React.useState([]);
  const [filter, setFilter] = React.useState('Pending');
  const [toast, setToast] = React.useState(null);

  const load = (s) => fetch(`/api/admin/leave-requests?status=${s}`).then(r => r.json()).then(d => setRequests(Array.isArray(d) ? d : []));
  React.useEffect(() => { load(filter); }, [filter]);

  const showToast = (m, type='ok') => { setToast({msg:m,type}); setTimeout(()=>setToast(null),3000); };

  const update = async (key, status) => {
    const r = await fetch('/api/admin/leave-requests/update', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ key, status }) });
    const d = await r.json();
    if (d.ok) { showToast(`${status}!`); load(filter); }
    else showToast(d.error||'Error','error');
  };

  const statusColor = { Pending: '#f59e0b', Approved: '#10b981', Rejected: '#ef4444' };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="emp-card">
        <div className="emp-card-header">
          <div className="emp-card-title">Leave Requests</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Pending','Approved','Rejected'].map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 14px', borderRadius: 99, border: '1px solid', borderColor: filter===s ? statusColor[s]+'66' : 'rgba(255,255,255,0.07)', background: filter===s ? statusColor[s]+'18' : 'transparent', color: filter===s ? statusColor[s] : '#475569', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'Manrope,sans-serif' }}>{s}</button>
            ))}
          </div>
        </div>
        {requests.length === 0
          ? <div style={{ padding: 40, textAlign: 'center', color: '#334155', fontSize: 13 }}>No {filter.toLowerCase()} requests</div>
          : <div>
              {requests.map(r => (
                <div key={r.key} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{r.emp_id}</div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{r.from} → {r.to} · {r.reason}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: statusColor[r.status], background: statusColor[r.status]+'18', padding: '3px 10px', borderRadius: 99 }}>{r.status}</span>
                  {filter === 'Pending' && <>
                    <Btn sm color="#10b981" onClick={() => update(r.key, 'Approved')}>Approve</Btn>
                    <Btn sm danger onClick={() => update(r.key, 'Rejected')}>Reject</Btn>
                  </>}
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const [syncing, setSyncing] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const showToast = (m, type='ok') => { setToast({msg:m,type}); setTimeout(()=>setToast(null),3000); };

  const sync = async () => {
    setSyncing(true);
    const r = await fetch('/api/sync');
    const d = await r.json();
    setSyncing(false);
    showToast(d.message || (d.status === 'ok' ? 'Sync complete!' : 'Error'), d.status === 'ok' ? 'ok' : 'error');
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="emp-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#e2e8f0', marginBottom: 8 }}>Data Sync</div>
          <div style={{ fontSize: 12, color: '#475569', marginBottom: 20, lineHeight: 1.6 }}>Manually trigger a full data recalculation from Google Sheets → MongoDB. This updates all member summaries, team stats, and department totals.</div>
          <Btn onClick={sync} color="#3b82f6" disabled={syncing}>{syncing ? 'Syncing...' : 'Sync Now'}</Btn>
        </div>
        <div className="emp-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#e2e8f0', marginBottom: 8 }}>Admin IDs</div>
          <div style={{ fontSize: 12, color: '#475569', marginBottom: 12, lineHeight: 1.6 }}>These IDs have full admin access to the panel:</div>
          {['17149 — Gazi Fahim','17137 — Jahidul','17248 — Tihim','17238 — Istiak ishq'].map(s => (
            <div key={s} style={{ padding: '7px 12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, marginBottom: 6, fontSize: 12, fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>{s}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main AdminPanel ─────────────────────────────────────────────
const AdminPanel = ({ members, deptSummary }) => {
  const [section, setSection] = React.useState('overview');
  const SECTIONS = [
    { id: 'overview',      label: 'Overview' },
    { id: 'members',       label: 'Members' },
    { id: 'attendance',    label: 'Attendance' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'leave',         label: 'Leave Requests' },
    { id: 'settings',      label: 'Settings' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 4, alignSelf: 'flex-start' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{ padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', background: section===s.id ? 'rgba(245,158,11,0.15)' : 'transparent', color: section===s.id ? '#fbbf24' : '#475569', fontSize: 12, fontWeight: 800, fontFamily: 'Manrope,sans-serif', transition: 'all 0.15s' }}>{s.label}</button>
        ))}
      </div>
      {section === 'overview'      && <AdminOverview members={members} deptSummary={deptSummary} />}
      {section === 'members'       && <AdminMembers members={members} />}
      {section === 'attendance'    && <AdminAttendance />}
      {section === 'announcements' && <AdminAnnouncements members={members} />}
      {section === 'leave'         && <AdminLeaveRequests />}
      {section === 'settings'      && <AdminSettings />}
    </div>
  );
};

// ─── helpers ───────────────────────────────────────────────────
const fmt = (v) => '$' + Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
const pctOf = (a, b) => b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0;

const MiniBar = ({ value, color }) => (
  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginTop: 8 }}>
    <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 99, transition: 'width 1s ease' }} />
  </div>
);

// ─── OverviewDashboard ──────────────────────────────────────────
const OverviewDashboard = ({ user, members, deptSummary, pct, da, ds, clock, checkedIn, setCheckedIn }) => {
  const dept = deptSummary?.dept || {};
  const deptTarget    = dept.target || 35000;
  const deptAchieved  = dept.achieved || 0;
  const deptWip       = dept.wipAmt || 0;
  const deptPct       = pctOf(deptAchieved, deptTarget);
  const platforms     = dept.platformStats || {};

  // team stats computed from members
  const teamMap = {};
  members.forEach(m => {
    const t = m.team || 'Unknown';
    if (!teamMap[t]) teamMap[t] = { delivered: 0, wip: 0, target: 0, count: 0, members: [] };
    teamMap[t].delivered += m.deliveredAmt || 0;
    teamMap[t].wip       += m.wipAmt || 0;
    teamMap[t].target    += m.target || 0;
    teamMap[t].count     += 1;
    teamMap[t].members.push(m);
  });
  const teams = Object.entries(teamMap)
    .map(([name, s]) => ({ name, ...s, pct: pctOf(s.delivered, s.target) }))
    .sort((a, b) => b.pct - a.pct);

  // leaderboard (top 5 by deliveredAmt)
  const leaderboard = [...members].sort((a, b) => (b.deliveredAmt || 0) - (a.deliveredAmt || 0)).slice(0, 5);
  const myRank = [...members].sort((a, b) => (b.deliveredAmt || 0) - (a.deliveredAmt || 0)).findIndex(m => m.id === user.id) + 1;

  const TEAM_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a78bfa', '#ec4899'];

  return (
    <div className="ovd-root">

      {/* ── Row 1: Dept KPI strip ── */}
      <div className="ovd-kpi-strip">
        {[
          { label: 'DEPT TARGET',   value: fmt(deptTarget),  color: '#64748b' },
          { label: 'ACHIEVED',      value: fmt(deptAchieved), color: '#10b981' },
          { label: 'IN PROGRESS',   value: fmt(deptWip),     color: '#f59e0b' },
          { label: 'TOTAL ORDERS',  value: dept.uniqueProjects || 0, color: '#3b82f6' },
          { label: 'DEPT PROGRESS', value: `${deptPct}%`,    color: deptPct >= 70 ? '#10b981' : deptPct >= 40 ? '#f59e0b' : '#ef4444' },
        ].map(k => (
          <div key={k.label} className="ovd-kpi-card">
            <div className="ovd-kpi-label">{k.label}</div>
            <div className="ovd-kpi-value" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Row 2: My Stats + Team Breakdown ── */}
      <div className="ovd-row2">

        {/* My Performance card */}
        <div className="emp-card ovd-my-perf">
          <div className="emp-card-header">
            <div className="emp-card-title">My Performance</div>
            {myRank > 0 && <span className="ovd-rank-badge">#{myRank} of {members.length}</span>}
          </div>
          <div className="ovd-my-body">
            <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,.06)" strokeWidth="8" fill="none" />
                <circle cx="50" cy="50" r="42"
                  stroke={pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="8" fill="none"
                  strokeDasharray={da} strokeDashoffset={ds} strokeLinecap="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1.5s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{pct}%</div>
                <div style={{ fontSize: 9, color: '#64748b' }}>Target</div>
              </div>
            </div>
            <div className="ovd-my-stats">
              {[
                { label: 'Delivered', value: fmt(user.deliveredAmt), color: '#10b981' },
                { label: 'WIP',       value: fmt(user.wipAmt),       color: '#f59e0b' },
                { label: 'Target',    value: fmt(user.target),        color: '#64748b' },
                { label: 'Orders',    value: user.delivered || 0,     color: '#3b82f6' },
              ].map(s => (
                <div key={s.label} className="ovd-my-stat">
                  <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platform breakdown */}
        <div className="emp-card">
          <div className="emp-card-header">
            <div className="emp-card-title">Platform Breakdown</div>
          </div>
          <div style={{ padding: '12px 20px 16px' }}>
            {Object.entries(platforms).filter(([,v]) => v > 0).map(([name, val], i) => {
              const pf = pctOf(val, deptAchieved);
              const colors = ['#3b82f6','#10b981','#f59e0b','#a78bfa'];
              return (
                <div key={name} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>{name}</span>
                    <span style={{ fontSize: 12, fontWeight: 900, color: colors[i % 4] }}>{fmt(val)}</span>
                  </div>
                  <MiniBar value={pf} color={colors[i % 4]} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 3: Team leaderboard + Top performers ── */}
      <div className="ovd-row3">

        {/* Team table */}
        <div className="emp-card">
          <div className="emp-card-header">
            <div className="emp-card-title">Team Breakdown</div>
          </div>
          <div style={{ padding: '4px 0 8px' }}>
            {teams.map((t, i) => (
              <div key={t.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 16, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: TEAM_COLORS[i % 5], flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{t.name}</span>
                    <span style={{ fontSize: 10, color: '#334155', fontWeight: 600 }}>{t.count} members</span>
                  </div>
                  <MiniBar value={t.pct} color={TEAM_COLORS[i % 5]} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: TEAM_COLORS[i % 5] }}>{fmt(t.delivered)}</div>
                  <div style={{ fontSize: 10, color: '#334155' }}>of {fmt(t.target)}</div>
                </div>
                <div style={{ minWidth: 44, textAlign: 'right' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: t.pct >= 70 ? '#10b981' : t.pct >= 40 ? '#f59e0b' : '#ef4444' }}>{t.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top performers */}
        <div className="emp-card">
          <div className="emp-card-header">
            <div className="emp-card-title">Top Performers</div>
          </div>
          <div style={{ padding: '4px 0 8px' }}>
            {leaderboard.map((m, i) => {
              const isMe = m.id === user.id;
              const mp = pctOf(m.deliveredAmt, m.target);
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: isMe ? 'rgba(37,99,235,0.06)' : 'transparent' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 8, background: i === 0 ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: i === 0 ? '#fbbf24' : '#475569', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isMe ? '#93c5fd' : '#e2e8f0' }}>{m.name}</span>
                      {isMe && <span style={{ fontSize: 9, fontWeight: 800, color: '#3b82f6', background: 'rgba(37,99,235,0.15)', padding: '1px 6px', borderRadius: 99 }}>YOU</span>}
                    </div>
                    <div style={{ fontSize: 10, color: '#334155' }}>{m.team}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>{fmt(m.deliveredAmt)}</div>
                    <div style={{ fontSize: 10, color: '#334155' }}>{mp}% target</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 4: Recent Projects + Attendance ── */}
      <div className="ovd-row4">
        <ProjectsList user={user} title="📁 My Projects — Recent" limit={5} />
        <AttendanceCard clock={clock} checkedIn={checkedIn} setCheckedIn={setCheckedIn} />
      </div>

    </div>
  );
};

export default EmployeePortal;
