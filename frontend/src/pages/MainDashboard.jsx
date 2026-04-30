import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import DeptOverview from '../components/DeptOverview';
import KpiCard from '../components/KpiCard';
import TeamCard from '../components/TeamCard';
import MemberCard from '../components/MemberCard';
import Leaderboard from '../components/Leaderboard';
import MemberModal from '../components/MemberModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import '../assets/css/dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Dynamic teams will be extracted from data

function MainDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [teamFilter, setTeamFilter] = useState('All');
  const [searchQ, setSearchQ] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [finStats, setFinStats] = useState(null);
  const [attStats, setAttStats] = useState({});
  const [userName, setUserName] = useState('Admin');
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();

    fetch('/api/finance-stats')
      .then(res => res.json())
      .then(d => setFinStats(d))
      .catch(err => console.error("FinStats fetch error:", err));

    fetch('/api/attendance-stats')
      .then(res => res.json())
      .then(d => setAttStats(d || {}))
      .catch(() => {});

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u && u.name) setUserName(u.name.split(' ')[0]);
      } catch (e) { console.error("Error parsing user from localStorage", e); }
    }

    fetch('/api/notifications?id=all')
      .then(r => r.json())
      .then(d => setNotifs(d || []))
      .catch(() => {});

    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading Dashboard...</div>;
  if (error) return <div className="error" style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>Error: {error}</div>;

  try {
    const { data: members = [], summary = {}, audit = {} } = data || {};
    const deptSummary = summary.dept || {};
    const teamSummaries = summary.teams || {};
    const TEAMS = Object.keys(teamSummaries);

    const filteredMembers = members.filter(m => 
      (teamFilter === 'All' || m.team === teamFilter) &&
      (m.name?.toLowerCase().includes(searchQ.toLowerCase()) || m.fullName?.toLowerCase().includes(searchQ.toLowerCase()))
    );

    // Select one best performer per team based on performanceScore
    const topPerformers = [];
    const teamBest = {};
    members.forEach(m => {
      const t = m.team || 'Others';
      if (!teamBest[t] || (m.performanceScore || 0) > (teamBest[t].performanceScore || 0)) {
        teamBest[t] = m;
      }
    });
    Object.values(teamBest)
      .sort((a, b) => {
        const scoreDiff = (b.performanceScore || 0) - (a.performanceScore || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (b.deliveredAmt || 0) - (a.deliveredAmt || 0);
      })
      .slice(0, 4)
      .forEach(m => topPerformers.push(m));

    // Countdown logic
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();
    const elapsedPct = Math.round((now.getDate() / daysInMonth) * 100);

    const attSummary = Object.values(attStats || {}).reduce((acc, curr) => {
      if (curr.status === 'Late') acc.late += 1;
      if (curr.status === 'Absent') acc.absent += 1;
      if (curr.status === 'Present') acc.present += 1;
      return acc;
    }, { late: 0, absent: 0, present: 0 });

    const handleExport = () => {
      let csv = 'ID,Name,Team,Role,Delivered,WIP,Target\n';
      members.forEach(m => {
        csv += `${m.id},"${m.name}","${m.team}","${m.role || 'Member'}",${m.deliveredAmt || 0},${m.wipAmt || 0},${m.target || 1100}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Performance_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
    <div className="dashboard-root">
      <div className="g1"></div>
      <div className="g2"></div>
      <div className="g3"></div>
      <Header 
        dept={deptSummary.name || "GEO Rankers"} 
        month={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        onRefresh={() => window.location.reload()}
        onExport={handleExport}
      />

      {/* Announcements Marquee */}
      {notifs.length > 0 && (
        <div className="announcement-bar" style={{ background: 'rgba(59,130,246,0.06)', borderBottom: '1px solid rgba(59,130,246,0.1)', padding: '10px 32px', display: 'flex', alignItems: 'center', gap: '16px', overflow: 'hidden' }}>
          <div style={{ background: '#3b82f6', color: '#fff', fontSize: '9px', fontWeight: 900, padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap', boxShadow: '0 0 10px rgba(59,130,246,0.3)' }}>ANNOUNCEMENT</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div className="marquee-content" style={{ display: 'flex', gap: '60px', animation: 'marquee 40s linear infinite', whiteSpace: 'nowrap' }}>
              {[...notifs, ...notifs].map((n, i) => (
                <div key={i} style={{ fontSize: '13px', color: '#93c5fd', fontWeight: 500 }}>
                  <strong style={{ color: '#fff', marginRight: '6px' }}>{n.title || 'Update'}:</strong> {n.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      <div className="welcome-strip" style={{ padding: '24px 32px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 10 }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px', color: '#f8fafc' }}>
            Welcome back, <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 20px rgba(139, 92, 246, 0.3)' }}>{userName}</span> 👋
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px', fontWeight: 500 }}>Here's what's happening in the <strong style={{ color: '#cbd5e1' }}>{deptSummary.name || "GEO Rankers"}</strong> department today.</p>
        </div>
        <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.1)' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px' }}>Last Live Sync</div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#10b981', textShadow: '0 0 10px rgba(16,185,129,0.4)' }}>{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Countdown Bar */}
      <div className="countdown-bar" style={{ margin: '10px 32px', borderRadius: '16px', border: '1px solid rgba(148,163,184,0.1)', background: 'rgba(59, 130, 246, 0.03)' }}>
        <div className="cd-left">
          <div className="cd-item">
            <span style={{ fontSize: '18px' }}>📅</span>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#64748b' }}>Current Month</div>
              <b>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</b>
            </div>
          </div>
          <div className="cd-item">
            <span style={{ fontSize: '18px' }}>⏳</span>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#64748b' }}>Deadline</div>
              <b>{daysLeft} Days Remaining</b>
            </div>
          </div>
          <div className="month-progress-wrap" style={{ flex: 1, minWidth: '200px', marginLeft: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b' }}>MONTH PROGRESS</span>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#3b82f6' }}>{elapsedPct}%</span>
            </div>
            <div className="cd-month-track" style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)' }}>
              <div className="cd-month-fill" style={{ width: `${elapsedPct}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)' }}></div>
            </div>
          </div>
        </div>
      </div>
      {/* Attendance Summary Strip */}
      <div className="att-summary-strip" style={{ margin: '0 32px 10px', display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981' }}>PRESENT TODAY</span>
          <span style={{ fontSize: '16px', fontWeight: 900, color: '#10b981' }}>{deptSummary.presentToday || 0}</span>
        </div>
        <div style={{ flex: 1, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '12px', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#f59e0b' }}>LATE</span>
          <span style={{ fontSize: '16px', fontWeight: 900, color: '#f59e0b' }}>{deptSummary.lateToday || 0}</span>
        </div>
        <div style={{ flex: 1, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444' }}>ABSENT</span>
          <span style={{ fontSize: '16px', fontWeight: 900, color: '#ef4444' }}>{deptSummary.absentToday || 0}</span>
        </div>
      </div>

      {/* Page Nav */}
      <div className="page-nav">
        <div className="page-nav-inner">
          {[
            ['overview', 'Overview'],
            ['performers', 'Top Performers'],
            ['teams', 'Teams'],
            ['members', 'Members'],
            ['leaderboard', 'Leaderboard']
          ].map(([id, label]) => (
            <button
              key={id}
              className={`page-nav-btn ${activeSection === id ? 'active' : ''}`}
              onClick={() => setActiveSection(id)}
            >
              {label}
            </button>
          ))}
          <Link to="/delivery-tracker" className="page-nav-btn" style={{ background: 'rgba(16,185,129,.12)', borderColor: 'rgba(16,185,129,.3)', color: '#7ed2c7' }}>📦 Repeat Order ↗</Link>
          <Link to="/query-tracker" className="page-nav-btn" style={{ background: 'rgba(99,102,241,.12)', borderColor: 'rgba(99,102,241,.3)', color: '#a5b4fc' }}>🚀 Query Tracker ↗</Link>
          <Link to="/finance" className="page-nav-btn" style={{ background: 'rgba(245,158,11,.12)', borderColor: 'rgba(245,158,11,.3)', color: '#fbbf24' }}>💰 Finance Hub ↗</Link>
          <Link to="/employee" className="page-nav-btn" style={{ background: 'rgba(37,99,235,.12)', borderColor: 'rgba(37,99,235,.3)', color: '#93c5fd' }}>👤 Employee Portal ↗</Link>
          <Link to="/work-examples" className="page-nav-btn" style={{ background: 'rgba(139,92,246,.12)', borderColor: 'rgba(139,92,246,.3)', color: '#c4b5fd' }}>📂 Work Examples ↗</Link>
        </div>
      </div>

      <main className="main" style={{ position: 'relative', zIndex: 10 }}>
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <section className="dash-section">
            
            {/* Quick Insights Highlights */}
            <div className="quick-insights" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div className="tc" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: '1px solid rgba(59,130,246,0.3)', boxShadow: '0 0 15px rgba(59,130,246,0.2)' }}>🚀</div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Top Performer</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#f1f5f9', marginTop: '2px' }}>{topPerformers[0]?.name || 'N/A'}</div>
                  <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 700 }}>${topPerformers[0]?.deliveredAmt || 0} Delivered</div>
                </div>
              </div>
              <div className="tc" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(52,211,153,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 0 15px rgba(16,185,129,0.2)' }}>📈</div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Dept Progress</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#f1f5f9', marginTop: '2px' }}>{Math.round(((summary.totalAchieved || 0) / (summary.dept?.target || 35000)) * 100)}% to Goal</div>
                  <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>${summary.totalAchieved || 0} Total</div>
                </div>
              </div>
              <div className="tc" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,191,36,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 0 15px rgba(245,158,11,0.2)' }}>⚡</div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Projects</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#f1f5f9', marginTop: '2px' }}>{summary.dept?.wipRows || 0} In Progress</div>
                  <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700 }}>${summary.dept?.wipAmt || 0} WIP</div>
                </div>
              </div>
            </div>
            <DeptOverview 
              total={summary.dept?.target || 35000} 
              delivered={summary.totalAchieved || 0}
              wip={summary.dept?.wipAmt || 0}
              cancelled={summary.dept?.cancelledAmt || 0}
              members={members.length}
              dept={summary.dept?.name || "GEO Rankers"}
              platformStats={summary.dept?.platformStats || {}}
              orderCount={summary.uniqueOrders || 0}
              wipCount={summary.dept?.wipRows || 0}
              cancelledCount={summary.dept?.cancelledRows || 0}
              bestPerformer={summary.dept?.bestPerformer}
              bestTeam={summary.dept?.bestTeam}
              deliveredCount={summary.dept?.deliveredRows || 0}
              projectCount={summary.dept?.seoSmmRows || 0}
              projectAmt={summary.dept?.totalProjectAmt || summary.totalAchieved * 1.5} 
            />

            {/* Revenue Trend Chart */}
            {finStats && finStats.months && (
              <div className="tc" style={{ marginTop: '24px', padding: '24px', height: '350px', position: 'relative' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '20px' }}>📈 REVENUE TREND (LAST 12 MONTHS)</div>
                <div style={{ height: '260px' }}>
                  <Line 
                    data={{
                      labels: finStats.months,
                      datasets: [{
                        label: 'Revenue',
                        data: finStats.months.map(m => finStats.data[m].total_sales),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointBackgroundColor: '#fff'
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false }, tooltip: { padding: 12, backgroundColor: '#0f172a' } },
                      scales: {
                        x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
                        y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b', font: { size: 10 }, callback: v => '$' + v.toLocaleString() } }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Platform Breakdown Strip */}
            <div className="stitle" style={{ marginTop: '30px' }}>📊 Platform Breakdown</div>
            <div className="platform-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              {deptSummary.platforms && Object.entries(deptSummary.platforms).map(([p, val]) => (
                <div key={p} className="tc" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(148,163,184,0.1)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{p} Revenue</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#f1f5f9', marginTop: '6px' }}>${val.toLocaleString()}</div>
                  <div className="tc-track" style={{ height: '4px', marginTop: '10px', background: 'rgba(255,255,255,0.05)' }}>
                    <div className="tc-fill" style={{ width: `${Math.min(100, (val/(summary.totalAchieved||1))*100)}%`, background: p==='Fiverr'?'#10b981':p==='Upwork'?'#3b82f6':p==='PPH'?'#8b5cf6':'#f59e0b' }}></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="kpi-strip">
              <KpiCard label="Total Delivered" value={`$${(summary.totalAchieved || 0).toLocaleString()}`} sub={`${summary.uniqueOrders || 0} orders`} color="#10b981" icon="✅" />
              <KpiCard label="WIP Pipeline" value={`$${(deptSummary.wipAmt || 0).toLocaleString()}`} sub="Active orders" color="#f59e0b" icon="⏳" />
              <KpiCard label="Cancelled" value={`$${(deptSummary.cancelledAmt || 0).toLocaleString()}`} sub="Lost revenue" color="#ef4444" icon="❌" />
              <KpiCard label="Members" value={members.length} sub="Across 4 teams" color="#cbd5e1" icon="👥" />
              <KpiCard label="Target" value="$35,000" sub="$1,100/member" color="#7ea8c4" icon="🎯" />
            </div>
          </section>
        )}

        {/* Top Performers Section */}
        {activeSection === 'performers' && (
          <section className="dash-section">
            <div className="stitle">🏆 Top Performers</div>
            <div className="spotlight" style={{ background: 'transparent', border: 'none', padding: 0 }}>
              <div className="spot-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                {topPerformers.map((m, i) => {
                  const medals = ['🥇', '🥈', '🥉', '🏅'];
                  const colors = [
                    { glow: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', accent: '#f59e0b' },
                    { glow: 'rgba(148, 163, 184, 0.05)', border: 'rgba(148, 163, 184, 0.1)', accent: '#94a3b8' },
                    { glow: 'rgba(194, 138, 44, 0.05)', border: 'rgba(194, 138, 44, 0.1)', accent: '#c28a2c' },
                    { glow: 'rgba(148, 163, 184, 0.05)', border: 'rgba(148, 163, 184, 0.1)', accent: '#64748b' }
                  ];
                  const c = colors[i] || colors[3];
                  const target = m.target || 1100;
                  const pct = Math.round(((m.deliveredAmt || 0) / target) * 100);
                  return (
                    <div key={m.id || i} className="spot-card" onClick={() => setSelectedMember(m)} style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      backdropFilter: 'blur(16px)',
                      border: `1px solid ${c.border}`,
                      borderRadius: '24px',
                      padding: '24px',
                      textAlign: 'left',
                      boxShadow: `0 0 30px ${c.glow}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ fontSize: '32px' }}>{medals[i]}</div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px' }}>🎉</span>
                          <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '99px', fontSize: '10px', fontWeight: 800, color: '#64748b' }}>#{i + 1}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ 
                          width: '56px', height: '56px', background: `linear-gradient(135deg, ${c.accent}, #000)`, 
                          borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          fontSize: '22px', fontWeight: 900, boxShadow: `0 0 15px ${c.glow}`
                        }}>
                          {m.name?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 900, color: '#f1f5f9' }}>{m.name}</div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                            {m.fullName} - <span style={{ color: '#10b981' }}>{m.team}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '32px', fontWeight: 900, color: '#f59e0b', marginBottom: '16px' }}>
                        ${(m.deliveredAmt || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>

                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginBottom: '16px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: 'linear-gradient(90deg, #10b981, #3b82f6)', borderRadius: '10px' }}></div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                        {pct > 120 && <div style={{ fontSize: '9px', fontWeight: 900, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.2)' }}>🚀 HIGH EFFICIENCY</div>}
                        {(m.lateCount || 0) === 0 && (m.presentCount || 0) > 0 && <div style={{ fontSize: '9px', fontWeight: 900, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(59,130,246,0.2)' }}>⏱️ PERFECT PUNCTUALITY</div>}
                        {(m.cancelled || 0) === 0 && (m.delivered || 0) > 5 && <div style={{ fontSize: '9px', fontWeight: 900, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(139,92,246,0.2)' }}>💎 ZERO CANCELLATION</div>}
                        {(m.presentCount || 0) > 20 && <div style={{ fontSize: '9px', fontWeight: 900, background: 'rgba(236,72,153,0.1)', color: '#ec4899', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(236,72,153,0.2)' }}>⭐ TOP ATTENDANCE</div>}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>
                          {m.delivered || 0} delivered • {pct}% target
                        </div>
                        {pct >= 100 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 900, color: '#10b981' }}>
                            ✅ Target Hit!
                          </div>
                        )}
                      </div>

                      {/* Detailed Stats Row */}
                      <div style={{ 
                        padding: '12px 16px', background: 'rgba(255,255,255,0.02)', 
                        borderRadius: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px',
                        border: '1px solid rgba(255,255,255,0.03)'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800 }}>LATE</div>
                          <div style={{ fontSize: '13px', fontWeight: 900, color: (m.lateCount || 0) > 0 ? '#ef4444' : '#10b981' }}>{m.lateCount || 0}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800 }}>ABSENT</div>
                          <div style={{ fontSize: '13px', fontWeight: 900, color: (m.absentCount || 0) > 5 ? '#ef4444' : '#94a3b8' }}>{m.absentCount || 0}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800 }}>CANCEL</div>
                          <div style={{ fontSize: '13px', fontWeight: 900, color: (m.cancelled || 0) > 0 ? '#ef4444' : '#94a3b8' }}>{m.cancelled || 0}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800 }}>TOTAL</div>
                          <div style={{ fontSize: '13px', fontWeight: 900, color: '#3b82f6' }}>{m.total || 0}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Teams Section */}
        {activeSection === 'teams' && (
          <section className="dash-section">
            <div className="stitle">👥 Teams</div>
            <div className="team-grid">
              {TEAMS.map(t => (
                <TeamCard 
                  key={t} 
                  team={t}
                  teamData={teamSummaries[t]}
                  members={members.filter(m => m.team === t)} 
                  target={1100}
                />
              ))}
            </div>
          </section>
        )}

        {/* Members Section */}
        {activeSection === 'members' && (
          <section className="dash-section">
            <div className="controls">
              <div className="search-wrap" style={{ position: 'relative' }}>
                <span className="si">🔍</span>
                <input 
                  className="search-input" 
                  placeholder="Search member by name or ID..." 
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                />
                {searchQ && (
                  <button
                    onClick={() => setSearchQ('')}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
                      fontSize: 16, lineHeight: 1, padding: 0
                    }}
                  >×</button>
                )}
              </div>
              <div className="filter-tabs">
                {['All', ...TEAMS].map(t => (
                  <button 
                    key={t} 
                    className={`ftab ${teamFilter === t ? 'active' : ''}`}
                    onClick={() => { setTeamFilter(t); setSearchQ(''); }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="stitle">
              👥 Team Members
              {searchQ && <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginLeft: 10 }}>
                {filteredMembers.length} result{filteredMembers.length !== 1 ? 's' : ''} for "{searchQ}"
              </span>}
            </div>
            <div className="members-grid">
              {filteredMembers.length === 0 ? (
                <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: '#475569', fontSize: 14 }}>
                  No members found matching "<strong style={{ color: '#94a3b8' }}>{searchQ}</strong>"
                </div>
              ) : (
                filteredMembers.map((m, i) => (
                  <MemberCard
                    key={m.id || i}
                    member={m}
                    rank={members.findIndex(x => x.id === m.id) + 1}
                    onClick={setSelectedMember}
                    att={attStats[m.id] || null}
                  />
                ))
              )}
            </div>
          </section>
        )}

        {/* Leaderboard Section */}
        {activeSection === 'leaderboard' && (
          <section className="dash-section">
            <Leaderboard members={members} target={1100} />
          </section>
        )}
      </main>

      <MemberModal 
        member={selectedMember} 
        onClose={() => setSelectedMember(null)} 
      />

      <footer className="footer">
        <span>SEO Performance Hub</span>
        <span>·</span>
        <span>GEO Rankers Dept</span>
        <span>·</span>
        <span>April 2026</span>
      </footer>
    </div>
    );
  } catch (err) {
    return <div className="error" style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>Runtime Error: {err.message}</div>;
  }
}

export default MainDashboard;
