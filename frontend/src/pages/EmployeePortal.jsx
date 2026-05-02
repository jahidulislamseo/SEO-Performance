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

const calcDuration = (inStr, outStr) => {
  if (!inStr || !outStr || inStr === '--:--' || outStr === '--:--') return '--';
  try {
    const parse = (s) => {
      const [time, amp] = s.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (amp === 'PM' && h < 12) h += 12;
      if (amp === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };
    const diff = parse(outStr) - parse(inStr);
    if (diff <= 0) return '--';
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hrs}H ${mins}M`;
  } catch { return '--'; }
};

function EmployeePortal() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    try {
      const u = saved ? JSON.parse(saved) : null;
      // If old structure (nested profile), clear it to force re-login
      if (u && u.profile && !u.id) {
        localStorage.removeItem('user');
        return null;
      }
      return u;
    } catch {
      return null;
    }
  });
  const [screen, setScreen] = useState(user ? 'dashboard' : 'login');
  const [members, setMembers] = useState([]);
  const [deptSummary, setDeptSummary] = useState(null);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [empId, setEmpId] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [navItem, setNavItem] = useState('overview');
  const [clock, setClock] = useState(new Date());
  const [logs, setLogs] = useState([]);

  const fetchMembers = () => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => { setMembers(data.data || []); setDeptSummary(data.summary || null); setMembersLoaded(true); })
      .catch(() => setMembersLoaded(true));
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchLogs = (id) => {
    fetch(`/api/attendance?id=${id}`)
      .then(res => res.json())
      .then(d => setLogs(Array.isArray(d) ? d : []))
      .catch(e => console.error(e));
  };

  useEffect(() => {
    if (user && user.id) {
      // Re-fetch full user profile to get REAL projects and latest amounts
      fetch(`/api/user/profile?id=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'ok' && data.user) {
            const u = data.user;
            const flatUser = {
              ...u.profile, ...u.stats,
              projects: u.projects || [],
              performance: u.performance || [],
              id: u.profile.id, name: u.profile.name,
              fullName: u.profile.fullName, team: u.profile.department,
              isAdmin: u.profile.isAdmin, target: u.profile.target,
              deliveredAmt: u.stats?.deliveredAmt || 0,
              wipAmt: u.stats?.wipAmt || 0,
              delivered: u.stats?.present || 0,
            };
            setUser(flatUser);
            localStorage.setItem('user', JSON.stringify(flatUser));
          }
        })
        .catch(err => console.error('Failed to sync user data:', err));

      fetch(`/api/attendance/status?memberId=${user.id}`)
        .then(res => res.json())
        .then(d => {
          setCheckedIn(d.checkedIn || false);
          setHasCheckedInToday(d.hasCheckedInToday || false);
          setCheckedOut(d.checkedOut || false);
        })
        .catch(err => console.error('Status check failed:', err));

      fetchLogs(user.id);
    }
  }, [user?.id]); // Re-run if ID changes

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const doLogin = async (member = null) => {
    if (member) {
      setUser(member);
      localStorage.setItem('user', JSON.stringify(member));
      setScreen('dashboard');
      return;
    }

    if (!empId.trim()) { setErr('Please enter your Employee ID or Name'); return; }
    if (!pass.trim()) { setErr('Please enter your password'); return; }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: empId.trim(), password: pass })
      });
      const data = await res.json();

      if (data.status === 'ok' && data.user) {
        // Flatten the user object for easy access throughout the app
        const u = data.user;
        const flatUser = {
          ...u.profile,
          ...u.stats,
          projects: u.projects || [],
          performance: u.performance || [],
          // Ensure key fields are at root level
          id: u.profile.id,
          name: u.profile.name,
          fullName: u.profile.fullName,
          team: u.profile.department,
          isAdmin: u.profile.isAdmin,
          target: u.profile.target,
          deliveredAmt: u.stats?.deliveredAmt || 0,
          wipAmt: u.stats?.wipAmt || 0,
          delivered: u.stats?.present || 0,
        };
        setUser(flatUser);
        localStorage.setItem('user', JSON.stringify(flatUser));
        setScreen('dashboard');
        setErr('');
      } else {
        setErr(data.message || 'Invalid credentials. Check your ID and password.');
      }
    } catch (e) {
      // Fallback to local check if backend is down
      if (!membersLoaded || members.length === 0) { setErr('Cannot reach server.'); return; }
      const found = members.find(m => m.id === empId || m.name?.toLowerCase() === empId.toLowerCase());
      if (!found) { setErr('Employee not found.'); return; }
      if (pass !== (found.password || 'pass123')) { setErr('Wrong password.'); return; }
      setUser(found);
      localStorage.setItem('user', JSON.stringify(found));
      setScreen('dashboard');
      setErr('');
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
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
            {/* Demo access section removed */}
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
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
    },
    {
      id: 'attendance', label: 'Attendance',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    },
    {
      id: 'projects', label: 'My Projects',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>,
    },
    {
      id: 'performance', label: 'Performance',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
    },
    {
      id: 'history', label: 'Work History',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      id: 'settings', label: 'Settings',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
    },
    ...(isAdmin ? [{
      id: 'admin', label: 'Admin Panel',
      admin: true,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    }] : []),
  ];

  return (
    <div className="emp-app">
      {/* Force Check-In Overlay */}
      {!hasCheckedInToday && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)',
          zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>👋</div>
          <h2 style={{ fontSize: 36, color: '#f8fafc', marginBottom: 12, fontWeight: 900, textAlign: 'center' }}>
            {greeting}, {user?.name?.split(' ')[0]}!
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 18, marginBottom: 40, fontWeight: 500, textAlign: 'center' }}>
            Please check in to start your day and access your portal.
          </p>

          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/attendance/checkin', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ memberId: user.id })
                });
                const data = await res.json();
                if (res.ok && data.ok) {
                  setCheckedIn(true);
                  setHasCheckedInToday(true);
                } else {
                  alert(`Error: ${data.error || 'Check-in failed'}`);
                }
              } catch (err) {
                alert('Network error during check-in');
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: 24, fontWeight: 900,
              padding: '20px 60px', borderRadius: 100, border: 'none', cursor: 'pointer',
              boxShadow: '0 0 40px rgba(16,185,129,0.5)', transition: 'all 0.3s ease',
              display: 'flex', alignItems: 'center', gap: 12
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(16,185,129,0.7)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(16,185,129,0.5)'; }}
          >
            <span>✅</span> Check In Now
          </button>
        </div>
      )}

      <aside className="emp-sidebar">
        <div className="sb-top">
          <div className="sb-brand">
            <div className="sb-brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </span>
            <span className="sb-label">Main Dashboard</span>
          </Link>
        </nav>

        <div className="sb-bottom">
          <div className="sb-user-mini">
            <div className="sb-user-av" style={{ background: avatarGradient(user.name), overflow: 'hidden' }}>
              {user.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : getInitials(user.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div className="sb-user-name">{user.name}</div>
                {isAdmin && <span className="sb-admin-badge">ADMIN</span>}
              </div>
              <div className="sb-user-id">{user.id}</div>
            </div>
            <button className="sb-logout" onClick={logout} title="Logout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
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
          {/* Stat cards — visible everywhere except history, admin and settings */}
          {navItem !== 'history' && navItem !== 'admin' && navItem !== 'settings' && (
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
          )}

          {/* OVERVIEW TAB */}
          {navItem === 'overview' && (
            <OverviewDashboard
              user={user} members={members} deptSummary={deptSummary}
              pct={pct} da={da} ds={ds}
              clock={clock} checkedIn={checkedIn} setCheckedIn={setCheckedIn}
              checkedOut={checkedOut} setCheckedOut={setCheckedOut}
              logs={logs} fetchLogs={() => fetchLogs(user.id)}
            />
          )}

          {/* ATTENDANCE TAB */}
          {navItem === 'attendance' && (() => {
            const currentMonth = `${clock.getFullYear()}-${String(clock.getMonth() + 1).padStart(2, '0')}`;
            const monthlyLogs = logs.filter(l => l.date.startsWith(currentMonth));
            const present = monthlyLogs.filter(l => l.status === 'Present' || l.status === 'Late').length;
            const absent = clock.getDate() - present;
            return (
              <div>
                <AttendanceCard clock={clock} checkedIn={checkedIn} setCheckedIn={setCheckedIn} checkedOut={checkedOut} setCheckedOut={setCheckedOut} user={user} logs={logs} fetchLogs={() => fetchLogs(user.id)} />
              </div>
            );
          })()}

          {/* PROJECTS TAB */}
          {navItem === 'projects' && (
            <ProjectsPage user={user} />
          )}

          {/* HISTORY TAB */}
          {navItem === 'history' && (
            <WorkHistoryPage user={user} />
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
                    { label: 'Target', value: `$${(user.target || 1100).toLocaleString()}`, color: '#64748b' },
                    { label: 'Delivered', value: `$${(user.deliveredAmt || 0).toLocaleString()}`, color: '#10b981' },
                    { label: 'WIP', value: `$${(user.wipAmt || 0).toLocaleString()}`, color: '#f59e0b' },
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

          {/* SETTINGS TAB */}
          {navItem === 'settings' && (
            <UserSettingsPage user={user} setUser={setUser} />
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

const AttendanceCard = ({ clock, checkedIn, setCheckedIn, checkedOut, setCheckedOut, user, logs = [], fetchLogs = () => { } }) => {
  const [viewDate, setViewDate] = React.useState(new Date());

  const handleAttendance = async () => {
    try {
      const action = checkedIn ? 'checkout' : 'checkin';
      const res = await fetch(`/api/attendance/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: user.id })
      });
      const data = await res.json();
      if (!res.ok) { alert(`Error: ${data.error || 'Request failed'}`); return; }
      if (data.ok) {
        if (checkedIn) { setCheckedOut(true); setCheckedIn(false); }
        else { setCheckedIn(true); }
        fetchLogs();
      }
    } catch (err) { console.error(err); alert('Network error'); }
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const grid = [];
  for (let i = 0; i < firstDay; i++) grid.push({ empty: true });

  let presentCount = 0, lateCount = 0, absentCount = 0, leaveCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const log = logs.find(l => l.date === dateStr);

    let status = 'future';
    const isPast = new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();

    if (log) {
      status = log.status;
      if (status === 'Present') presentCount++;
      else if (status === 'Late') lateCount++;
      else if (status === 'Leave') leaveCount++;
    } else if (isPast) {
      status = 'Absent';
      absentCount++;
    }

    grid.push({ day: d, status, isToday });
  }

  const changeMonth = (offset) => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + offset);
    setViewDate(d);
  };

  return (
    <div className="att-page-layout">
      {/* LEFT: Calendar */}
      <div className="att-card-main">
        <div className="att-header-row">
          <div className="att-title-wrap">
            <span>📅</span> Attendance Calendar
          </div>
          <div className="att-summary-row">
            {[
              { label: 'Payable Days', val: presentCount + lateCount, color: '#64748b' },
              { label: 'Present', val: presentCount, color: '#10b981' },
              { label: 'Late', val: lateCount, color: '#f59e0b' },
              { label: 'Movement', val: 0, color: '#3b82f6' },
              { label: 'Leave', val: leaveCount, color: '#a78bfa' },
              { label: 'Absent', val: absentCount, color: '#ef4444' },
            ].map(s => (
              <div key={s.label} className="att-sum-item">
                <div className="att-sum-bar" style={{ background: s.color }} />
                <div>
                  <div className="att-sum-val">{s.val}</div>
                  <div className="att-sum-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="att-controls">
          <button className="att-nav-btn" onClick={() => changeMonth(-1)}>❮</button>
          <select className="att-selector" value={month} onChange={e => {
            const d = new Date(viewDate);
            d.setMonth(parseInt(e.target.value));
            setViewDate(d);
          }}>
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <select className="att-selector" value={year} onChange={e => {
            const d = new Date(viewDate);
            d.setFullYear(parseInt(e.target.value));
            setViewDate(d);
          }}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="att-nav-btn" onClick={() => changeMonth(1)}>❯</button>

          <button
            className={`wb-checkin-btn ${checkedIn ? 'check-out' : 'check-in'}`}
            onClick={handleAttendance}
            style={{ marginLeft: 'auto', padding: '8px 20px', borderRadius: 10 }}
          >
            {checkedIn ? '⬛ Check Out' : '✅ Check In'}
          </button>
        </div>

        <div className="att-grid-7">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
            <div key={d} className="att-weekday">{d}</div>
          ))}
          {grid.map((c, i) => (
            <div key={i} className={`att-day-box ${c.isToday ? 'today' : ''} ${c.empty ? 'empty' : ''}`} style={{ visibility: c.empty ? 'hidden' : 'visible' }}>
              {!c.empty && (
                <>
                  <div className="att-day-num">{c.day}</div>
                  <div className={`att-status-pill att-pill-${c.status.toLowerCase()}`}>
                    {c.status}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Sidebar */}
      <div className="att-sidebar-card">
        <div className="att-side-head">
          <span>🕒</span> Recent Check-ins
        </div>
        <div className="att-side-body">
          {logs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#475569', fontSize: 13 }}>No check-in history found.</div>
          ) : (
            logs.slice(0, 10).map((l, i) => (
              <div key={i} className="att-log-row">
                <div className="att-log-top">
                  <div className="att-log-date">{l.date}</div>
                  <div className="att-log-dur">{calcDuration(l.in, l.out)}</div>
                </div>
                <div className="att-log-actions">
                  <div className="att-log-act in">
                    <span>⬆️</span> Check In <span style={{ marginLeft: 4, opacity: 0.5 }}>{l.in || '--:--'}</span>
                  </div>
                  <div className="att-log-act out">
                    <span>⬇️</span> Check Out <span style={{ marginLeft: 4, opacity: 0.5 }}>{l.out || '--:--'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

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
  WIP: '#f59e0b',
  Revision: '#a78bfa',
  Cancelled: '#ef4444',
};

const ProjectsList = ({ user, title, limit }) => {
  const projects = (user.projects || []).slice(0, limit);
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
  WIP: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', dot: '#f59e0b' },
  Revision: { color: '#a78bfa', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)', dot: '#a78bfa' },
  Cancelled: { color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', dot: '#ef4444' },
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
  const [searchQ, setSearchQ] = React.useState('');
  const [viewMonth, setViewMonth] = React.useState(new Date().getMonth());
  const [viewYear, setViewYear] = React.useState(new Date().getFullYear());
  const [historyFetched, setHistoryFetched] = React.useState(false);
  const [allHistory, setAllHistory] = React.useState([]);

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  React.useEffect(() => {
    const isCurrentMonth = viewMonth === new Date().getMonth() && viewYear === new Date().getFullYear();
    if (!isCurrentMonth && !historyFetched) {
      fetch(`/api/user/work-history?memberId=${user.id}`)
        .then(r => r.json())
        .then(data => {
          setAllHistory(Array.isArray(data) ? data : []);
          setHistoryFetched(true);
        })
        .catch(err => console.error("History fetch failed", err));
    }
  }, [viewMonth, viewYear, historyFetched, user.id]);

  const isCurrentMonth = viewMonth === new Date().getMonth() && viewYear === new Date().getFullYear();
  const baseProjects = isCurrentMonth ? (user.projects || []) : allHistory;

  // Filter projects by selected month
  const monthlyProjects = baseProjects.filter(p => {
    // Current month is already pre-filtered correctly by the backend in user.projects
    if (isCurrentMonth) return true;

    // For historical months, use the exact month bucket generated by the backend archive
    const targetMonthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    if (p.month && p.month !== 'Unknown') {
      return p.month === targetMonthStr;
    }

    // Fallback if no month bucket exists
    if (!p.date) return false;
    const dateLower = p.date.toLowerCase();
    const monthShort = MONTHS[viewMonth].slice(0, 3).toLowerCase();
    return dateLower.includes(monthShort) || dateLower.includes(MONTHS[viewMonth].toLowerCase());
  });

  const statuses = ['All', 'Delivered', 'WIP', 'Revision', 'Cancelled'];
  const counts = statuses.reduce((acc, s) => {
    acc[s] = s === 'All' ? monthlyProjects.length : monthlyProjects.filter(p => p.status === s).length;
    return acc;
  }, {});

  const visible = monthlyProjects
    .filter(p => filter === 'All' || p.status === filter)
    .filter(p => {
      if (!searchQ.trim()) return true;
      const q = searchQ.toLowerCase();
      return (
        (p.order || '').toLowerCase().includes(q) ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.client || '').toLowerCase().includes(q) ||
        (p.service || '').toLowerCase().includes(q) ||
        (p.assign || '').toLowerCase().includes(q)
      );
    });

  // Calculate monthly stats
  const monthlyStats = {
    delivered: monthlyProjects.filter(p => p.status === 'Delivered').reduce((sum, p) => sum + (p.share || p.amtX || 0), 0),
    wip: monthlyProjects.filter(p => p.status === 'WIP').reduce((sum, p) => sum + (p.share || p.amtX || 0), 0),
    count: monthlyProjects.length,
    doneCount: monthlyProjects.filter(p => p.status === 'Delivered').length
  };

  return (
    <div className="projects-page">
      {/* Monthly Stats Row */}
      <div className="ovd-kpi-strip" style={{ marginBottom: 24 }}>
        {[
          { label: 'MONTHLY DELIVERED', value: fmt(monthlyStats.delivered), color: '#10b981' },
          { label: 'MONTHLY WIP', value: fmt(monthlyStats.wip), color: '#f59e0b' },
          { label: 'TOTAL ORDERS', value: monthlyStats.count, color: '#3b82f6' },
          { label: 'COMPLETED', value: monthlyStats.doneCount, color: '#6366f1' },
        ].map(k => (
          <div key={k.label} className="ovd-kpi-card">
            <div className="ovd-kpi-label">{k.label}</div>
            <div className="ovd-kpi-value" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter bar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }}>
          <button className="att-nav-btn" onClick={() => setViewMonth(m => m === 0 ? 11 : m - 1)}>❮</button>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#f1f5f9', width: 110, textAlign: 'center' }}>
            {MONTHS[viewMonth]} {viewYear}
          </div>
          <button className="att-nav-btn" onClick={() => setViewMonth(m => m === 11 ? 0 : m + 1)}>❯</button>
        </div>
        <div style={{ position: 'relative', flex: '1', minWidth: 260 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, opacity: 0.5 }}>🔍</span>
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search by client, order, service..."
            style={{
              width: '100%', padding: '12px 14px 12px 42px', background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: '#f1f5f9',
              fontSize: 14, fontFamily: 'Manrope,sans-serif', boxSizing: 'border-box'
            }}
          />
        </div>
        <div className="pfilter-bar" style={{ marginBottom: 0, padding: 4, background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
          {statuses.map(s => (
            <button
              key={s}
              className={`pfilter-btn ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
              style={{ padding: '8px 16px', borderRadius: 11 }}
            >
              {s}
              <span className="pfilter-count" style={{ marginLeft: 8, background: filter === s ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)' }}>{counts[s]}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Cards */}
      <div className="pcard-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
        {visible.length === 0
          ? <div className="pcard-empty" style={{ gridColumn: '1/-1', padding: 100, background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center', color: '#475569' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📂</div>
              {searchQ ? `No results for "${searchQ}"` : `No projects found for ${MONTHS[viewMonth]} ${viewYear}`}
            </div>
          : visible.map((p, i) => <ProjectCard key={i} p={p} />)
        }
      </div>
    </div>
  );
};

const WorkHistoryPage = ({ user }) => {
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQ, setSearchQ] = React.useState('');

  React.useEffect(() => {
    if (!user.id) return;
    setLoading(true);
    fetch(`/api/user/work-history?memberId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        setHistory(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user.id]);

  // Group by month
  const monthlyGroups = {};
  history
    .filter(p => {
      if (!searchQ.trim()) return true;
      const q = searchQ.toLowerCase();
      return (
        (p.order || '').toLowerCase().includes(q) ||
        (p.client || '').toLowerCase().includes(q) ||
        (p.service || '').toLowerCase().includes(q) ||
        (p.assign || '').toLowerCase().includes(q)
      );
    })
    .forEach(p => {
    let monthKey = p.month && p.month !== 'Unknown' ? p.month : (p.date || p.deliveredDate || '').slice(0, 7);
    if (!monthKey || monthKey.length < 7) monthKey = 'Archive / Legacy';

    if (!monthlyGroups[monthKey]) {
      monthlyGroups[monthKey] = {
        month: monthKey,
        projects: [],
        totalEarned: 0,
        deliveredCount: 0
      };
    }
    monthlyGroups[monthKey].projects.push(p);
    if (p.status === 'Delivered') {
      monthlyGroups[monthKey].totalEarned += Number(p.amtX || 0);
      monthlyGroups[monthKey].deliveredCount += 1;
    }
  });

  const sortedMonths = Object.values(monthlyGroups).sort((a, b) => b.month.localeCompare(a.month));

  const lifetimeDelivered = history.filter(p => p.status === 'Delivered').length;
  const lifetimeEarned = history.filter(p => p.status === 'Delivered').reduce((sum, p) => sum + Number(p.amtX || 0), 0);
  const tenureMonths = sortedMonths.length;

  const fmt = (v) => '$' + Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

  return (
    <div className="work-history-container">
      {/* Search Bar */}
      <div style={{ marginBottom: 24, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
        <input
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="Search all historical projects (Order, Client, Service)..."
          style={{
            width: '100%', padding: '12px 14px 12px 42px', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, color: '#f1f5f9',
            fontSize: 14, fontFamily: 'Manrope,sans-serif', boxSizing: 'border-box'
          }}
        />
      </div>

      {/* LIFETIME KPI STRIP */}
      <div className="ovd-kpi-strip" style={{ marginBottom: 30 }}>
        {[
          { label: 'LIFETIME DELIVERED', value: lifetimeDelivered, color: '#10b981' },
          { label: 'TOTAL PROJECTS', value: history.length, color: '#3b82f6' },
          { label: 'TENURE (MONTHS)', value: tenureMonths, color: '#a78bfa' },
          { label: 'LIFETIME EARNINGS', value: fmt(lifetimeEarned), color: '#f59e0b' },
        ].map(k => (
          <div key={k.label} className="ovd-kpi-card" style={{ flex: 1 }}>
            <div className="ovd-kpi-label">{k.label}</div>
            <div className="ovd-kpi-value" style={{ color: k.color, fontSize: 22 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 100, textAlign: 'center', color: '#475569', fontWeight: 800 }}>Loading Work History...</div>
      ) : sortedMonths.length === 0 ? (
        <div className="emp-card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📁</div>
          <div className="emp-card-title" style={{ marginBottom: 8 }}>No History Found</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>Your historical project data will appear here once archived.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {sortedMonths.map((group) => (
            <div key={group.month} className="emp-card history-month-card">
              <div className="emp-card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ padding: '8px 12px', background: 'rgba(59,130,246,0.1)', borderRadius: 10, color: '#3b82f6', fontWeight: 900, fontSize: 13 }}>
                    {new Date(group.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>
                    {group.projects.length} PROJECTS
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9, color: '#475569', fontWeight: 800, marginBottom: 2 }}>DELIVERED</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>{group.deliveredCount}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9, color: '#475569', fontWeight: 800, marginBottom: 2 }}>EARNED</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#f59e0b' }}>{fmt(group.totalEarned)}</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '0 20px' }}>
                <div style={{ maxHeight: 500, overflowY: 'auto', padding: '10px 0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <th style={{ padding: '10px 0', color: '#475569', fontWeight: 800 }}>DATE</th>
                        <th style={{ padding: '10px 0', color: '#475569', fontWeight: 800 }}>PROJECT NAME</th>
                        <th style={{ padding: '10px 0', color: '#475569', fontWeight: 800 }}>CLIENT</th>
                        <th style={{ padding: '10px 0', color: '#475569', fontWeight: 800 }}>SERVICE</th>
                        <th style={{ padding: '10px 0', color: '#475569', fontWeight: 800 }}>ASSIGNED</th>
                        <th style={{ padding: '10px 0', color: '#475569', fontWeight: 800, textAlign: 'right' }}>STATUS</th>
                        <th style={{ padding: '10px 0', color: '#475569', fontWeight: 800, textAlign: 'right' }}>EARNED</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.projects.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '12px 0', color: '#64748b' }}>{p.date || p.deliveredDate || '—'}</td>
                          <td style={{ padding: '12px 0', fontWeight: 700, color: '#e2e8f0' }}>{p.order}</td>
                          <td style={{ padding: '12px 0', color: '#94a3b8' }}>{p.client || '—'}</td>
                          <td style={{ padding: '12px 0', color: '#94a3b8' }}>{p.service}</td>
                          <td style={{ padding: '12px 0', color: '#94a3b8' }}>{p.assign || '—'}</td>
                          <td style={{ padding: '12px 0', textAlign: 'right' }}>
                            <span style={{ 
                              fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 6,
                              background: p.status === 'Delivered' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                              color: p.status === 'Delivered' ? '#10b981' : '#f59e0b'
                            }}>{p.status.toUpperCase()}</span>
                          </td>
                          <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 800, color: p.status === 'Delivered' ? '#10b981' : '#475569' }}>
                            {fmt(p.amtX)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Admin Panel ───────────────────────────────────────────────
// ── shared admin UI helpers ─────────────────────────────────────
const TEAMS = ['GEO Rankers', 'Rank Riser', 'Search Apex', 'Dark Rankers'];
const ROLES = ['SEO Executive', 'Team Leader', 'Team Member', 'Manager', 'Dark Rankers Executive'];
const TEAM_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a78bfa', '#ec4899'];

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
    teamMap[t].wip += m.wipAmt || 0;
    teamMap[t].target += m.target || 0;
    teamMap[t].count += 1;
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'TOTAL TARGET', value: '$' + (dept.target || 0).toLocaleString(), color: '#64748b' },
          { label: 'ACHIEVED', value: '$' + Math.round(dept.achieved || 0).toLocaleString(), color: '#10b981' },
          { label: 'WIP', value: '$' + Math.round(dept.wipAmt || 0).toLocaleString(), color: '#f59e0b' },
          { label: 'TOTAL ORDERS', value: dept.uniqueProjects || 0, color: '#3b82f6' },
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
                <div style={{ fontSize: 16, fontWeight: 900, color: p >= 70 ? '#10b981' : p >= 40 ? '#f59e0b' : '#ef4444', textAlign: 'right' }}>{p}%</div>
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

  const OFF_DAYS = [
    { label: 'Friday', value: 4 },
    { label: 'Saturday', value: 5 },
    { label: 'Sunday', value: 6 },
    { label: 'Monday', value: 0 },
  ];

  const openEdit = (m) => { setForm({ ...m, isAdmin: m.isAdmin || false, offDay: m.offDay ?? 4 }); setModal('edit'); };
  const openAdd = () => { setForm({ id: '', name: '', fullName: '', team: TEAMS[0], role: ROLES[0], target: 1100, email: '', phone: '', password: 'pass123', isAdmin: false, offDay: 4 }); setModal('add'); };

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
            <Field label="Employee ID"><Input value={form.id || ''} onChange={f('id')} placeholder="17XXX" /></Field>
            <Field label="Display Name"><Input value={form.name || ''} onChange={f('name')} placeholder="Alamin" /></Field>
            <Field label="Full Name"><Input value={form.fullName || ''} onChange={f('fullName')} placeholder="Alamin Sheikh" /></Field>
            <Field label="Target ($)"><Input type="number" value={form.target || ''} onChange={v => f('target')(Number(v))} placeholder="1100" /></Field>
            <Field label="Team"><Select value={form.team || TEAMS[0]} onChange={f('team')} options={TEAMS} /></Field>
            <Field label="Role"><Select value={form.role || ROLES[0]} onChange={f('role')} options={ROLES} /></Field>
            <Field label="Email"><Input value={form.email || ''} onChange={f('email')} placeholder="email@example.com" /></Field>
            <Field label="Phone"><Input value={form.phone || ''} onChange={f('phone')} placeholder="+880..." /></Field>
            <Field label="Password"><Input value={form.password || ''} onChange={f('password')} placeholder="pass123" /></Field>
            <Field label="Weekly Off Day">
              <select
                value={form.offDay ?? 4}
                onChange={e => f('offDay')(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f1f5f9', fontSize: 13, fontFamily: 'Manrope,sans-serif' }}
              >
                {OFF_DAYS.map(d => <option key={d.value} value={d.value} style={{ background: '#0f172a' }}>{d.label}</option>)}
              </select>
            </Field>
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
              {['ID', 'Name', 'Team', 'Role', 'Target', 'Off Day', 'Email', 'Admin', 'Actions'].map(h => (
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
                  <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 800, color: '#3b82f6' }}>${(m.target || 0).toLocaleString()}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', padding: '2px 8px', borderRadius: 99, border: '1px solid rgba(167,139,250,0.2)' }}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][m.offDay ?? 4]}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: '#475569' }}>{m.email || '—'}</td>
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
          <Field label="Status"><Select value={editing.status || 'Present'} onChange={v => setEditing(p => ({ ...p, status: v }))} options={['Present', 'Late', 'Absent', 'Leave']} /></Field>
          <Field label="Check In"><Input value={editing.in || ''} onChange={v => setEditing(p => ({ ...p, in: v }))} placeholder="09:00 AM" /></Field>
          <Field label="Check Out"><Input value={editing.out || ''} onChange={v => setEditing(p => ({ ...p, out: v }))} placeholder="06:00 PM" /></Field>
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
                {['Employee ID', 'Status', 'Check In', 'Check Out', 'Duration', 'Device', 'IP', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 9, fontWeight: 800, color: '#334155', textAlign: 'left', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.emp_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace' }}>{r.emp_id}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: statusColor[r.status] || '#64748b', background: `${statusColor[r.status] || '#64748b'}18`, padding: '3px 10px', borderRadius: 99, border: `1px solid ${statusColor[r.status] || '#64748b'}40` }}>{r.status || '—'}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8' }}>{r.in || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8' }}>{r.out || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b' }}>{r.duration || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: '#64748b' }}>{r.device_out || r.device_in || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>{r.ip_out || r.ip_in || '—'}</td>
                    <td style={{ padding: '10px 14px' }}><Btn sm onClick={() => setEditing({ ...r })}>Edit</Btn></td>
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
  const [history, setHistory] = React.useState([]);

  const showToast = (m, type = 'ok') => { setToast({ msg: m, type }); setTimeout(() => setToast(null), 3000); };

  const fetchHistory = () => fetch('/api/admin/announcements/history').then(r => r.json()).then(d => setHistory(Array.isArray(d) ? d : []));
  React.useEffect(() => { fetchHistory(); }, []);

  const send = async () => {
    if (!msg.trim()) return showToast('Please enter a message', 'error');
    const r = await fetch('/api/admin/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, message: msg, target }) });
    const d = await r.json();
    if (d.ok) {
      showToast('Announcement sent!');
      setTitle('');
      setMsg('');
      fetchHistory();
    }
    else showToast(d.error || 'Error', 'error');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Sender Form */}
      <div className="emp-card">
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

      {/* History List */}
      <div className="emp-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="emp-card-header"><div className="emp-card-title">Announcement History</div></div>
        <div style={{ padding: '0 20px 20px', flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
          {history.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#475569', fontSize: 13 }}>No announcements sent yet.</div>
          ) : history.map((h, i) => (
            <div key={i} style={{ padding: '14px 0', borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9' }}>{h.title}</div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{new Date(h.timestamp * 1000).toLocaleString()}</div>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginBottom: 8 }}>{h.text}</div>
              <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20, background: h.target === 'all' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)', color: h.target === 'all' ? '#60a5fa' : '#f59e0b', border: `1px solid ${h.target === 'all' ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                Sent to: {h.target}
              </div>
            </div>
          ))}
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

  const showToast = (m, type = 'ok') => { setToast({ msg: m, type }); setTimeout(() => setToast(null), 3000); };

  const update = async (key, status) => {
    const r = await fetch('/api/admin/leave-requests/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, status }) });
    const d = await r.json();
    if (d.ok) { showToast(`${status}!`); load(filter); }
    else showToast(d.error || 'Error', 'error');
  };

  const statusColor = { Pending: '#f59e0b', Approved: '#10b981', Rejected: '#ef4444' };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="emp-card">
        <div className="emp-card-header">
          <div className="emp-card-title">Leave Requests</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Pending', 'Approved', 'Rejected'].map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 14px', borderRadius: 99, border: '1px solid', borderColor: filter === s ? statusColor[s] + '66' : 'rgba(255,255,255,0.07)', background: filter === s ? statusColor[s] + '18' : 'transparent', color: filter === s ? statusColor[s] : '#475569', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'Manrope,sans-serif' }}>{s}</button>
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
                <span style={{ fontSize: 11, fontWeight: 800, color: statusColor[r.status], background: statusColor[r.status] + '18', padding: '3px 10px', borderRadius: 99 }}>{r.status}</span>
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
  const [config, setConfig] = React.useState({ dept_target: 36000, team_targets: {} });
  const [shifts, setShifts] = React.useState({ "GEO Rankers": "08:00", "Rank Riser": "07:00", "Dark Rankers": "15:00", "Search Apex": "22:00" });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/admin/config').then(r => r.json()).then(d => {
      if (!d.error) setConfig({ dept_target: d.dept_target || 36000, team_targets: d.team_targets || {} });
    }).catch(e => console.error(e));

    fetch('/api/admin/shifts').then(r => r.json()).then(d => {
      if (!d.error && Object.keys(d).length > 0) setShifts(d);
    }).catch(e => console.error(e));
  }, []);

  const showToast = (m, type = 'ok') => { setToast({ msg: m, type }); setTimeout(() => setToast(null), 3000); };

  const sync = async () => {
    setSyncing(true);
    const r = await fetch('/api/sync');
    const d = await r.json();
    setSyncing(false);
    showToast(d.message || (d.status === 'ok' ? 'Sync complete!' : 'Error'), d.status === 'ok' ? 'ok' : 'error');
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      // Save Targets
      const r1 = await fetch('/api/admin/config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      // Save Shifts
      const r2 = await fetch('/api/admin/shifts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shifts)
      });

      const d1 = await r1.json();
      const d2 = await r2.json();

      if (d1.ok && d2.ok) {
        showToast('Settings saved! Triggering dashboard sync...', 'ok');
        // Auto-sync after save so dashboard reflects changes
        await sync();
        showToast('Dashboard updated with new targets!', 'ok');
      } else {
        showToast('Error saving settings', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateTeamTarget = (team, val) => {
    setConfig(c => ({ ...c, team_targets: { ...c.team_targets, [team]: Number(val) || 0 } }));
  };

  const updateTeamShift = (team, val) => {
    setShifts(s => ({ ...s, [team]: val }));
  };

  return (
    <div className="settings-container">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="settings-header">
        <div className="settings-icon">🎯</div>
        <div>
          <div className="settings-title">Financial Targets & Shifts</div>
          <div className="settings-subtitle">Configure departmental revenue goals and employee attendance rules</div>
        </div>
      </div>

      <div className="settings-grid">
        {/* Dept Target Card */}
        <div className="settings-card">
          <div className="card-tag">DEPARTMENT</div>
          <div className="card-title">Monthly Revenue Target</div>
          <div className="input-group">
            <span className="input-prefix">$</span>
            <input
              type="number"
              value={config.dept_target}
              onChange={e => setConfig({ ...config, dept_target: Number(e.target.value) || 0 })}
              className="settings-input"
            />
          </div>
          <div className="card-info">This sets the overall progress goal for the GEO Rankers department.</div>
        </div>

        {/* Sync Card */}
        <div className="settings-card sync-card">
          <div className="card-tag">DATA INTEGRITY</div>
          <div className="card-title">Database Sync</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20, lineHeight: 1.6, fontWeight: 600 }}>
            Updates all metrics from Google Sheets. Run this manually if you suspect data discrepancies.
          </div>
          <button className="save-btn sync-btn" onClick={sync} disabled={syncing}>
            {syncing ? 'Syncing...' : '🔄 Sync Now'}
          </button>
        </div>

        {/* Team Targets Card */}
        <div className="settings-card full-width">
          <div className="card-tag">TEAMS</div>
          <div className="card-title">Individual Team Revenue Goals</div>
          <div className="teams-grid">
            {['GEO Rankers', 'Rank Riser', 'Search Apex', 'Dark Rankers'].map((team, i) => (
              <div key={team} className="team-input-card">
                <div className="team-name">
                  <div className="team-dot" style={{ background: TEAM_COLORS[i % 5] }}></div>
                  {team}
                </div>
                <div className="input-group">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    value={config.team_targets[team] || 0}
                    onChange={e => updateTeamTarget(team, e.target.value)}
                    className="settings-input"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shift Timings Card */}
        <div className="settings-card full-width">
          <div className="card-tag">ATTENDANCE</div>
          <div className="card-title">Shift Schedules (15 min grace period)</div>
          <div className="shifts-grid">
            {['GEO Rankers', 'Rank Riser', 'Search Apex', 'Dark Rankers'].map((team, i) => (
              <div key={team} className="team-input-card">
                <div className="team-name">
                  <div className="team-dot" style={{ background: TEAM_COLORS[i % 5] }}></div>
                  {team}
                </div>
                <input
                  type="time"
                  value={shifts[team] || ''}
                  onChange={e => updateTeamShift(team, e.target.value)}
                  className="settings-input no-prefix"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-footer">
        <button className="save-btn" onClick={handleSaveConfig} disabled={saving}>
          {saving ? 'Processing...' : '✅ Save All Changes'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="emp-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#e2e8f0', marginBottom: 8 }}>Admin IDs</div>
          <div style={{ fontSize: 12, color: '#475569', marginBottom: 12, lineHeight: 1.6 }}>These IDs have full admin access to the panel:</div>
          {['17149 — Gazi Fahim', '17137 — Jahidul', '17248 — Tihim', '17238 — Istiak ishq'].map(s => (
            <div key={s} style={{ padding: '7px 12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, marginBottom: 6, fontSize: 12, fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>{s}</div>
          ))}
        </div>
        <div className="emp-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#e2e8f0', marginBottom: 8 }}>System Health</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <div className="lpl-live-dot"></div>
            <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>MongoDB Connected</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <div className="lpl-live-dot" style={{ background: '#3b82f6', boxShadow: '0 0 6px #3b82f6' }}></div>
            <span style={{ fontSize: 12, color: '#3b82f6', fontWeight: 700 }}>Google Sheets API Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};


// ── Main AdminPanel ─────────────────────────────────────────────
const AdminPanel = ({ members, deptSummary }) => {
  const [section, setSection] = React.useState('overview');
  const SECTIONS = [
    { id: 'overview', label: 'Overview' },
    { id: 'members', label: 'Members' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'projects', label: 'All Projects' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'leave', label: 'Leave Requests' },
    { id: 'settings', label: 'Settings' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 4, alignSelf: 'flex-start' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{ padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', background: section === s.id ? 'rgba(245,158,11,0.15)' : 'transparent', color: section === s.id ? '#fbbf24' : '#475569', fontSize: 12, fontWeight: 800, fontFamily: 'Manrope,sans-serif', transition: 'all 0.15s' }}>{s.label}</button>
        ))}
      </div>
      {section === 'overview' && <AdminOverview members={members} deptSummary={deptSummary} />}
      {section === 'members' && <AdminMembers members={members} />}
      {section === 'attendance' && <AdminAttendance />}
      {section === 'projects' && <AdminProjects />}
      {section === 'announcements' && <AdminAnnouncements members={members} />}
      {section === 'leave' && <AdminLeaveRequests />}
      {section === 'settings' && <AdminSettings />}
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

// ─── CheckInWidget (for Dashboard) ──────────────────────────────
const CheckInWidget = ({ checkedIn, setCheckedIn, checkedOut, setCheckedOut, user, logs = [], fetchLogs = () => { } }) => {
  const handleAttendance = async () => {
    try {
      const action = checkedIn ? 'checkout' : 'checkin';
      const res = await fetch(`/api/attendance/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: user.id })
      });
      const data = await res.json();
      if (!res.ok) { alert(`Error: ${data.error || 'Request failed'}`); return; }
      if (data.ok) {
        if (checkedIn) { setCheckedOut(true); setCheckedIn(false); }
        else { setCheckedIn(true); }
        fetchLogs();
      }
    } catch (err) { console.error(err); alert('Network error'); }
  };

  return (
    <div className="att-sidebar-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="att-side-head" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>🕒</span> Recent Check-ins
        </div>
        <button
          className={`wb-checkin-btn ${checkedIn ? 'check-out' : 'check-in'}`}
          onClick={handleAttendance}
          style={{ padding: '6px 16px', borderRadius: 8, fontSize: 11 }}
        >
          {checkedIn ? '⬛ Check Out' : '✅ Check In'}
        </button>
      </div>
      <div className="att-side-body" style={{ flex: 1 }}>
        {logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#475569', fontSize: 13 }}>No check-in history found.</div>
        ) : (
          logs.slice(0, 5).map((l, i) => (
            <div key={i} className="att-log-row">
              <div className="att-log-top">
                <div className="att-log-date">{l.date}</div>
                <div className="att-log-dur">{calcDuration(l.in, l.out)}</div>
              </div>
              <div className="att-log-actions">
                <div className="att-log-act in">
                  <span>⬆️</span> {l.in || '--:--'}
                </div>
                <div className="att-log-act out">
                  <span>⬇️</span> {l.out || '--:--'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const UserSettingsPage = ({ user, setUser }) => {
  const [form, setForm] = React.useState({
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
    avatar: user.avatar || ''
  });
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 200 * 1024) {
      setMsg({ text: 'Image too large (Max 200KB)', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, avatar: reader.result });
      setMsg({ text: 'Image ready to save', type: 'success' });
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, ...form })
      });
      const data = await res.json();
      if (data.ok) {
        setMsg({ text: 'Profile updated successfully!', type: 'success' });
        const newUser = { ...user, ...form };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        if (typeof fetchMembers === 'function') fetchMembers();
      } else {
        setMsg({ text: data.error || 'Failed to update profile', type: 'error' });
      }
    } catch (e) {
      setMsg({ text: 'Network error', type: 'error' });
    }
    setLoading(false);
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="emp-card" style={{ padding: 32 }}>
        <div className="emp-card-header" style={{ marginBottom: 32 }}>
          <div className="emp-card-title">Profile Settings</div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Avatar Preview & Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 8 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, overflow: 'hidden' }}>
              {form.avatar ? <img src={form.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" /> : user.name?.[0]}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>Profile Picture</div>
              <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} id="avatar-upload" />
              <label htmlFor="avatar-upload" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', border: '1px solid rgba(59,130,246,0.2)' }}>
                Upload New Image
              </label>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>Max size: 200KB</div>
            </div>
          </div>

          <Field label="Full Name">
            <Input value={form.fullName} onChange={v => setForm({ ...form, fullName: v })} placeholder="Enter your full name" />
          </Field>

          <Field label="Email Address">
            <Input value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="email@example.com" />
          </Field>

          <Field label="Phone Number">
            <Input value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="+880 1XXX-XXXXXX" />
          </Field>

          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
            <Btn onClick={save} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Btn>
            {msg && <span style={{ fontSize: 13, fontWeight: 700, color: msg.type === 'success' ? '#10b981' : '#ef4444' }}>{msg.text}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── OverviewDashboard ──────────────────────────────────────────
const TeamReportCard = ({ teamData }) => {
  if (!teamData) return null;
  const { name, leader, deliveredAmt, target, wipAmt, remaining, progress, delivered, wip, revision, cancelled, projects } = teamData;
  const fmtK = (val) => '$' + (val / 1000).toFixed(1) + 'K';
  
  return (
    <div className="team-report-card">
      <div className="trc-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="trc-icon">📱</div>
          <div>
            <div className="trc-team-name">{name}</div>
            <div className="trc-leader">👤 {leader || 'N/A'}</div>
          </div>
        </div>
        <div className="trc-badge">7 members</div>
      </div>

      <div className="trc-status-row">
        <span className="trc-status-pill">ON TRACK</span>
      </div>

      <div className="trc-hero-amt">
        <div className="trc-main-val">${(deliveredAmt / 1000).toFixed(1)}K</div>
        <div className="trc-hero-sub">
          Achieved <b>${(deliveredAmt / 1000).toFixed(1)}K</b> · Target <b>${(target / 1000).toFixed(1)}K</b> · WIP <b>${(wipAmt / 1000).toFixed(1)}K</b>
        </div>
      </div>

      <div className="trc-main-stats">
        <div className="trc-stat-box">
          <div className="trc-stat-label">ACHIEVED</div>
          <div className="trc-stat-val">${(deliveredAmt / 1000).toFixed(1)}K</div>
        </div>
        <div className="trc-stat-box">
          <div className="trc-stat-label">TARGET</div>
          <div className="trc-stat-val">${(target / 1000).toFixed(1)}K</div>
        </div>
        <div className="trc-stat-box">
          <div className="trc-stat-label">REMAINING</div>
          <div className="trc-stat-val">${(remaining / 1000).toFixed(1)}K</div>
        </div>
      </div>

      <div className="trc-progress-wrap">
        <div className="trc-progress-bg">
          <div className="trc-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="trc-grid-stats">
        {[
          { label: 'Delivery', val: delivered, icon: '✅', color: '#10b981' },
          { label: 'WIP', val: wip, icon: '⏳', color: '#3b82f6' },
          { label: 'Revision', val: revision, icon: '🔄', color: '#6366f1' },
          { label: 'Cancel', val: cancelled, icon: '❌', color: '#ef4444' },
          { label: 'Total', val: projects, icon: '📦', color: '#f59e0b' },
          { label: 'Complete', val: `${Math.round(progress)}%`, icon: '🎯', color: '#a78bfa' },
        ].map(s => (
          <div key={s.label} className="trc-grid-item">
            <div className="trc-grid-val" style={{ color: s.color }}>{s.val}</div>
            <div className="trc-grid-label">{s.icon} {s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};


const OverviewDashboard = ({ user, members: rawMembers, deptSummary, pct, da, ds, clock, checkedIn, setCheckedIn, checkedOut, setCheckedOut, logs, fetchLogs }) => {
  // Deduplicate members by ID on the frontend (safety net)
  const seenIds = new Set();
  const members = rawMembers.filter(m => {
    if (!m.id || seenIds.has(m.id)) return false;
    seenIds.add(m.id);
    return true;
  });

  const dept = deptSummary?.dept || {};
  const deptTarget = dept.target || 35000;
  const deptAchieved = dept.achieved || 0;
  const deptWip = dept.wipAmt || 0;
  const deptPct = pctOf(deptAchieved, deptTarget);
  const platforms = dept.platformStats || {};
  const teamSummaries = deptSummary?.teams || {};

  // team stats computed from members
  const teamMap = {};
  members.forEach(m => {
    const t = m.team || 'Unknown';
    if (!teamMap[t]) teamMap[t] = { delivered: 0, wip: 0, target: 0, count: 0, members: [] };
    teamMap[t].delivered += m.deliveredAmt || 0;
    teamMap[t].wip += m.wipAmt || 0;
    teamMap[t].target += m.target || 0;
    teamMap[t].count += 1;
    teamMap[t].members.push(m);
  });
  const teams = Object.entries(teamMap)
    .map(([name, s]) => ({ name, ...s, pct: pctOf(s.delivered, s.target) }))
    .sort((a, b) => b.pct - a.pct);

  // leaderboard (top 5 by deliveredAmt)
  const leaderboard = [...members].sort((a, b) => (b.deliveredAmt || 0) - (a.deliveredAmt || 0)).slice(0, 5);
  const myRank = [...members].sort((a, b) => (b.deliveredAmt || 0) - (a.deliveredAmt || 0)).findIndex(m => m.id === user.id) + 1;

  const myTeamName = user.team || 'GEO Rankers';
  const myTeamData = teamSummaries[myTeamName];

  return (
    <div className="ovd-root">
      {/* ── NEW: Team Report Card (Requested View) ── */}
      <TeamReportCard teamData={myTeamData} />


      {/* ── Row 1: Dept KPI strip (Admins Only) ── */}
      {user.isAdmin && (
        <div className="ovd-kpi-strip">
          {[
            { label: 'DEPT TARGET', value: fmt(deptTarget), color: '#64748b' },
            { label: 'ACHIEVED', value: fmt(deptAchieved), color: '#10b981' },
            { label: 'IN PROGRESS', value: fmt(deptWip), color: '#f59e0b' },
            { label: 'TOTAL ORDERS', value: dept.uniqueProjects || 0, color: '#3b82f6' },
            { label: 'DEPT PROGRESS', value: `${deptPct}%`, color: deptPct >= 70 ? '#10b981' : deptPct >= 40 ? '#f59e0b' : '#ef4444' },
          ].map(k => (
            <div key={k.label} className="ovd-kpi-card">
              <div className="ovd-kpi-label">{k.label}</div>
              <div className="ovd-kpi-value" style={{ color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Row 2: My Stats + Platform Breakdown (Platform for Admins Only) ── */}
      <div className="ovd-row2" style={{ gridTemplateColumns: user.isAdmin ? '1.5fr 1fr' : '1fr' }}>

        {/* My Performance card */}
        <div className="emp-card ovd-my-perf">
          <div className="emp-card-header">
            <div className="emp-card-title">My Performance Overview</div>
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
                { label: 'WIP', value: fmt(user.wipAmt), color: '#f59e0b' },
                { label: 'Target', value: fmt(user.target), color: '#64748b' },
                { label: 'Orders', value: user.delivered || 0, color: '#3b82f6' },
              ].map(s => (
                <div key={s.label} className="ovd-my-stat">
                  <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platform breakdown (Admins Only) */}
        {user.isAdmin && (
          <div className="emp-card">
            <div className="emp-card-header">
              <div className="emp-card-title">Platform Breakdown</div>
            </div>
            <div style={{ padding: '12px 20px 16px' }}>
              {Object.entries(platforms).filter(([, v]) => v > 0).map(([name, val], i) => {
                const pf = pctOf(val, deptAchieved);
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#a78bfa'];
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
        )}
      </div>

      {/* ── Row 3: Team Breakdown (Admin) / My Team Performance (Everyone) ── */}
      <div className="ovd-row3" style={{ gridTemplateColumns: user.isAdmin ? '1fr 1fr' : '1fr' }}>
        {/* Team table (Admins Only) */}
        {user.isAdmin && (
          <div className="emp-card">
            <div className="emp-card-header">
              <div className="emp-card-title">All Teams Breakdown</div>
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
        )}

        {/* My Team Performance */}
        <div className="emp-card">
          <div className="emp-card-header">
            <div className="emp-card-title">My Team: {user.team || 'GEO Rankers'}</div>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '4px 8px', borderRadius: 6 }}>TEAM VIEW</span>
          </div>
          <div style={{ padding: '4px 0 8px' }}>
            {members.filter(m => m.team === (user.team || 'GEO Rankers')).sort((a,b) => (b.deliveredAmt||0) - (a.deliveredAmt||0)).map((m, i) => {
              const mp = pctOf(m.deliveredAmt, m.target);
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: m.id === user.id ? 'rgba(59,130,246,0.05)' : 'transparent' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: avatarGradient(m.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                    {m.avatar ? <img src={m.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : getInitials(m.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: m.id === user.id ? '#3b82f6' : '#e2e8f0' }}>{m.name} {m.id === user.id && '(Me)'}</span>
                      <span style={{ fontSize: 12, fontWeight: 900, color: mp >= 70 ? '#10b981' : mp >= 40 ? '#f59e0b' : '#ef4444' }}>{fmt(m.deliveredAmt)}</span>
                    </div>
                    <MiniBar value={mp} color={mp >= 70 ? '#10b981' : mp >= 40 ? '#f59e0b' : '#ef4444'} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 4: Top performers ── */}
      <div className="ovd-row3" style={{ marginTop: 20, gridTemplateColumns: '1fr' }}>
        <div className="emp-card">
          <div className="emp-card-header">
            <div className="emp-card-title">Global Top Performers</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, padding: '12px 20px 20px' }}>
            {leaderboard.map((m, i) => {
              const isMe = m.id === user.id;
              const mp = pctOf(m.deliveredAmt, m.target);
              return (
                <div key={m.id} style={{ textAlign: 'center', padding: '16px 12px', background: isMe ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)', borderRadius: 12, border: isMe ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', fontSize: 20 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''}</div>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: avatarGradient(m.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 auto 12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}>
                    {m.avatar ? <img src={m.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : getInitials(m.name)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{m.team}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>{fmt(m.deliveredAmt)}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: mp >= 70 ? '#10b981' : mp >= 40 ? '#f59e0b' : '#ef4444', marginTop: 4 }}>{mp}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* ── Row 4: Recent Projects + Quick Attendance ── */}
      <div className="ovd-row4">
        <ProjectsList user={user} title="📁 My Projects — Recent" limit={5} />
        <CheckInWidget
          checkedIn={checkedIn} setCheckedIn={setCheckedIn}
          checkedOut={checkedOut} setCheckedOut={setCheckedOut}
          user={user} logs={logs} fetchLogs={fetchLogs}
        />
      </div>

    </div>
  );
};

const AdminProjects = () => {
  const [projects, setProjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [month, setMonth] = React.useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [availableMonths, setAvailableMonths] = React.useState([]);

  React.useEffect(() => {
    fetch('/api/months').then(r => r.json()).then(d => setAvailableMonths(Array.isArray(d) ? d : []));
  }, []);

  React.useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/all-projects?month=${month}&q=${search}`)
      .then(r => r.json())
      .then(data => {
        setProjects(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month, search]);

  const fmt = (v) => '$' + Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

  return (
    <div className="admin-projects">
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 300 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
          <input
            placeholder="Search all projects (Order, Client, Team, Member...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px 12px 42px', background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff',
              fontSize: 13, fontFamily: 'Manrope, sans-serif'
            }}
          />
        </div>
        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          style={{
            padding: '12px 20px', background: '#0c1424', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'Manrope, sans-serif'
          }}
        >
          <option value="">All Time</option>
          {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="emp-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="emp-card-title">📦 Master Project Archive</div>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '6px 14px', borderRadius: 10 }}>
            {projects.length} RECORDS
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>DATE</th>
                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>ORDER & INSTRUCTION</th>
                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>CLIENT</th>
                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>ASSIGNED TO</th>
                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>STATUS</th>
                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'right' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ padding: 100, textAlign: 'center', color: '#475569', fontWeight: 700 }}>Loading archives...</td></tr>
              ) : projects.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: 100, textAlign: 'center', color: '#475569', fontWeight: 700 }}>No archived projects found for this period.</td></tr>
              ) : projects.map((p, i) => (
                <tr key={i} style={{ 
                  borderBottom: '1px solid rgba(255,255,255,0.03)', 
                  transition: 'background 0.2s, transform 0.1s',
                  cursor: 'default'
                }} 
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '16px 24px', color: '#94a3b8', fontWeight: 600 }}>{p.date}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#f1f5f9' }}>{p.order}</div>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{p.service}</div>
                      </div>
                      {(p.instruction || p.link) && (
                        <a href={p.instruction || p.link} target="_blank" rel="noreferrer" style={{ 
                          width: 28, height: 28, borderRadius: 8, background: 'rgba(59,130,246,0.1)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          textDecoration: 'none', color: '#3b82f6', fontSize: 12, border: '1px solid rgba(59,130,246,0.2)',
                          transition: 'all 0.2s'
                        }} 
                        onMouseEnter={e => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.color = '#3b82f6'; }}
                        title={p.instruction ? "Open Instruction Sheet" : "Open Order Link"}>📄</a>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', color: '#e2e8f0', fontWeight: 800 }}>{p.client}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ color: '#f1f5f9', fontWeight: 700 }}>{p.assign}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900,
                      background: p.status === 'Delivered' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      color: p.status === 'Delivered' ? '#10b981' : '#f59e0b',
                      border: `1px solid ${p.status === 'Delivered' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`
                    }}>{p.status}</span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 900, color: p.status === 'Delivered' ? '#10b981' : '#f1f5f9' }}>
                    {fmt(p.amtX)}
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

export default EmployeePortal;
