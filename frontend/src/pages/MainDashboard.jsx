import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import DeptOverview from '../components/DeptOverview';
import KpiCard from '../components/KpiCard';
import TeamCard from '../components/TeamCard';
import MemberCard from '../components/MemberCard';
import Leaderboard from '../components/Leaderboard';
import MemberModal from '../components/MemberModal';
import '../assets/css/dashboard.css';

const TEAMS = ['Geo Rankers', 'Rank Riser', 'Search Apex', 'SMM'];

function MainDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [teamFilter, setTeamFilter] = useState('All');
  const [searchQ, setSearchQ] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/data');
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
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading Dashboard...</div>;
  if (error) return <div className="error" style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>Error: {error}</div>;
  if (!data) return null;

  const { data: members = [], summary = {}, audit = {} } = data;
  const deptSummary = summary.dept || {};
  const teamSummaries = summary.teams || {};

  const filteredMembers = members.filter(m => 
    (teamFilter === 'All' || m.team === teamFilter) &&
    (m.name?.toLowerCase().includes(searchQ.toLowerCase()) || m.fullName?.toLowerCase().includes(searchQ.toLowerCase()))
  );

  const topPerformers = [...members].sort((a, b) => (b.deliveredAmt || 0) - (a.deliveredAmt || 0)).slice(0, 4);

  // Countdown logic
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();
  const elapsedPct = Math.round((now.getDate() / daysInMonth) * 100);

  return (
    <div className="dashboard-root">
      <div className="g1"></div>
      <div className="g2"></div>
      <div className="g3"></div>
      <Header 
        dept={deptSummary.name || "GEO Rankers"} 
        month={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        onRefresh={() => window.location.reload()}
      />

      <div className="welcome-strip" style={{ padding: '20px 32px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px' }}>Welcome back, <span style={{ color: '#3b82f6' }}>Admin</span> 👋</h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Here's what's happening in the {deptSummary.name || "GEO Rankers"} department today.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px' }}>Last Sync</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>{new Date().toLocaleTimeString()}</div>
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
          <Link to="/delivery-tracker" className="page-nav-btn" style={{ background: 'rgba(16,185,129,.12)', borderColor: 'rgba(16,185,129,.3)', color: '#7ed2c7' }}>📦 Delivery Tracker ↗</Link>
          <Link to="/query-tracker" className="page-nav-btn" style={{ background: 'rgba(99,102,241,.12)', borderColor: 'rgba(99,102,241,.3)', color: '#a5b4fc' }}>🚀 Query Tracker ↗</Link>
          <Link to="/employee" className="page-nav-btn" style={{ background: 'rgba(37,99,235,.12)', borderColor: 'rgba(37,99,235,.3)', color: '#93c5fd' }}>👤 Employee Portal ↗</Link>
        </div>
      </div>

      <main className="main">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <section className="dash-section">
            <DeptOverview 
              total={35000} 
              delivered={summary.totalAchieved || 0}
              wip={deptSummary.wipAmt || 0}
              cancelled={deptSummary.cancelledAmt || 0}
              members={members.length}
              dept={deptSummary.name}
            />
            
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
            <div className="spotlight">
              <div className="spot-grid">
                {topPerformers.map((m, i) => {
                  const medals = ['🥇', '🥈', '🥉', '🏅'];
                  return (
                    <div key={m.id || i} className="spot-card" onClick={() => setSelectedMember(m)}>
                      <div className="spot-rank">{medals[i]}</div>
                      <div className="spot-name">{m.name}</div>
                      <div className="spot-team">{m.team}</div>
                      <div className="spot-amt">${(m.deliveredAmt || 0).toLocaleString()}</div>
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
              <div className="search-wrap">
                <span className="si">🔍</span>
                <input 
                  className="search-input" 
                  placeholder="Search member..." 
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                />
              </div>
              <div className="filter-tabs">
                {['All', ...TEAMS].map(t => (
                  <button 
                    key={t} 
                    className={`ftab ${teamFilter === t ? 'active' : ''}`}
                    onClick={() => setTeamFilter(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="stitle">👥 Team Members</div>
            <div className="members-grid">
              {filteredMembers.map((m, i) => (
                <MemberCard 
                  key={m.id || i} 
                  member={m} 
                  rank={members.findIndex(x => x.id === m.id) + 1}
                  onClick={setSelectedMember}
                />
              ))}
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
}

export default MainDashboard;
