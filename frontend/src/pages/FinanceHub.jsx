import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../assets/css/dashboard.css';
import '../assets/css/finance-kpi.css';

const usd = (v) => (!v || v === 0) ? '—' : '$' + Number(v).toLocaleString();
const pct = (a, b) => b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0;

const PLATFORM_MAP = { 'Fiverr': 'Green', 'Upwork': 'Repeat', 'B2B': 'B2B', 'PPH': 'PPH' };

const MONTHLY_TARGETS = [32000,32000,33000,35000,36000,38000,40000,40000,40000,42000,43000,45000];
const REPEAT_VALS     = [5000,6000,5500,7000,6500,8000,7500,8500,9000,9500,10000,11000];
const B2B_VALS        = [1000,1500,1200,1800,1600,2000,1900,2200,2500,2800,3000,3500];
const SMM_VALS        = [3000,3000,3000,3000,4000,4000,5000,6000,6000,7000,9000,10000];
const SCALE           = 600000 / 456000;
const SALES_TARGETS   = MONTHLY_TARGETS.map(v => Math.round(v * SCALE));

const FinanceHub = () => {
  const [data, setData]         = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('finance');

  useEffect(() => {
    fetch('/api/finance').then(r => r.json()).then(d => { setData(d); setLoading(false); });
    fetch('/api/data').then(r => r.json()).then(d => setLiveData(d));
  }, []);

  if (loading) return <div className="loading">Loading Finance Hub...</div>;
  if (!data?.months || !data?.teams?.length) return <div className="loading">No finance data available.</div>;

  const { months, teams } = data;
  const seoTeam = teams[0] || {};
  const smmTeam = teams[1] || {};

  const opProfiles = [
    { name: 'Fiverr', type: 'Marketplace', monthly: months.map((_,i) => MONTHLY_TARGETS[i] - (REPEAT_VALS[i] + B2B_VALS[i])) },
    { name: 'Upwork', type: 'Marketplace', monthly: REPEAT_VALS },
    { name: 'B2B',    type: 'B2B Sales',   monthly: B2B_VALS },
    { name: 'SMM',    type: 'SMM Support', monthly: SMM_VALS },
  ];
  const salesProfiles = [
    { name: 'Fiverr', type: 'Marketplace', monthly: SALES_TARGETS.map((v,i) => v - (Math.round(REPEAT_VALS[i]*SCALE) + Math.round(B2B_VALS[i]*SCALE))) },
    { name: 'Upwork', type: 'Marketplace', monthly: REPEAT_VALS.map(v => Math.round(v * SCALE)) },
    { name: 'B2B',    type: 'B2B Sales',   monthly: B2B_VALS.map(v => Math.round(v * SCALE)) },
  ];

  const sumProfiles = (ps) => ps.reduce((a,p) => a + p.monthly.reduce((x,y) => x+y, 0), 0);
  const getQ        = (ps, q) => ps.reduce((a,p) => a + p.monthly.slice(q*3,(q+1)*3).reduce((x,y)=>x+y,0), 0);

  const totalOpRev    = sumProfiles(opProfiles);
  const totalSalesRev = sumProfiles(salesProfiles);
  const totalRev      = totalOpRev + totalSalesRev;
  const avgRev        = Math.round(totalRev / 12);
  const qs            = [0,1,2,3].map(q => getQ(opProfiles,q) + getQ(salesProfiles,q));

  // SMM profiles
  const smmProfiles = smmTeam.profiles || [];
  const totalSmmRev = smmProfiles.reduce((a,p) => a + (p.monthly||[]).reduce((x,y)=>x+y,0), 0);

  // Live dept data for Delivery tab
  const dept     = liveData?.summary?.dept || {};
  const members  = liveData?.data || [];

  const QSUBS = ['Jul – Sep 2026','Oct – Dec 2026','Jan – Mar 2027','Apr – Jun 2027'];
  const QCOLS = ['#06b6d4','#10b981','#f59e0b','#ec4899'];

  return (
    <div className="finance-kpi-root" style={{ background: '#060B14', minHeight: '100vh', color: '#f1f5f9', padding: 'clamp(16px, 4vw, 40px)' }}>

      {/* Header */}
      <header className="finance-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📊</div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>Finance Hub</h1>
            <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Fiscal Year 2026–2027 • SEO + SMM Teams</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ padding: '8px 16px', border: '1px solid #f59e0b', borderRadius: '8px', color: '#f59e0b', fontSize: '10px', fontWeight: 800 }}>⚡ Live Dashboard</div>
          <Link to="/kpi-reports" style={{ padding: '8px 16px', border: '1px solid rgba(236,72,153,0.3)', background: 'rgba(236,72,153,0.1)', borderRadius: '8px', color: '#f472b6', fontSize: '10px', fontWeight: 800, textDecoration: 'none' }}>📊 KPI Reports</Link>
          <Link to="/" style={{ padding: '8px 16px', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', color: '#64748b', fontSize: '10px', fontWeight: 800, textDecoration: 'none' }}>← Dashboard</Link>
        </div>
      </header>

      {/* Tabs */}
      <nav style={{ display: 'flex', gap: '8px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {['Finance','Delivery','Summary'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} style={{
            padding: '8px 24px', borderRadius: '99px',
            border: '1px solid rgba(148,163,184,0.1)',
            background: activeTab === tab.toLowerCase() ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: activeTab === tab.toLowerCase() ? '#fff' : '#64748b',
            fontSize: '11px', fontWeight: 800, cursor: 'pointer',
          }}>{tab.toUpperCase()}</button>
        ))}
      </nav>

      {/* ── FINANCE TAB ── */}
      {activeTab === 'finance' && (
        <>
          <div className="res-grid-auto" style={{ gap: '20px', marginBottom: '40px' }}>
            <StatCard label="TOTAL REVENUE"   value={usd(totalRev)} sub="Jul 2026 – Jun 2027" icon="💰" color="#3b82f6" />
            <StatCard label="OPERATION TARGET" value={usd(519000)}   sub="SEO + SMM Operation"  icon="🏢" color="#06b6d4" />
            <StatCard label="SALES TARGET"    value={usd(600000)}   sub="SEO Sales"            icon="📊" color="#10b981" />
            <StatCard label="AVG MONTHLY"     value={usd(avgRev)}   sub="Per month average"    icon="🎯" color="#ec4899" />
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#cbd5e1', marginBottom: '20px' }}>Quarterly Overview</h2>
            <div className="res-grid-auto" style={{ gap: '20px' }}>
              {qs.map((v,i) => <QCard key={i} label={`Q${i+1}`} value={usd(v)} sub={QSUBS[i]} color={QCOLS[i]} progress={pct(v, totalRev/4*1.1)} />)}
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#06b6d4', marginBottom: '20px' }}>Monthly Breakdown — Operation ($519k Target)</h2>
            <BreakdownTable months={months} profiles={opProfiles} usd={usd} />
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b', marginBottom: '20px' }}>Monthly Breakdown — Sales ($600k Target)</h2>
            <BreakdownTable months={months} profiles={salesProfiles} monthlyTargets={SALES_TARGETS} usd={usd} />
          </div>

          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#cbd5e1', marginBottom: '20px' }}>Platform Overview</h2>
            <div className="res-grid-auto" style={{ gap: '20px' }}>
              {opProfiles.map((p,i) => {
                const total = p.monthly.reduce((a,b)=>a+b,0);
                const colors = ['#10b981','#06b6d4','#f59e0b'];
                return <PlatformCard key={p.name} name={PLATFORM_MAP[p.name]||p.name} type={p.type} value={usd(total)} color={colors[i]} />;
              })}
            </div>
          </div>
        </>
      )}

      {/* ── DELIVERY TAB ── */}
      {activeTab === 'delivery' && (
        <>
          <div className="res-grid-auto" style={{ gap: '20px', marginBottom: '40px' }}>
            <StatCard label="ACHIEVED (LIVE)"  value={usd(dept.achieved||0)}       sub="This month actual" icon="✅" color="#10b981" />
            <StatCard label="WIP PIPELINE"     value={usd(dept.wipAmt||0)}         sub="In progress"      icon="⏳" color="#f59e0b" />
            <StatCard label="TOTAL ORDERS"     value={dept.uniqueProjects||0}      sub="Unique orders"    icon="📦" color="#3b82f6" />
            <StatCard label="DEPT TARGET"      value={usd(dept.target||35000)}     sub="Monthly target"   icon="🎯" color="#ec4899" />
          </div>

          {/* Platform live stats */}
          {dept.platformStats && (
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#cbd5e1', marginBottom: '20px' }}>Live Platform Revenue (This Month)</h2>
              <div className="res-grid-auto" style={{ gap: '16px' }}>
                {Object.entries(dept.platformStats).map(([name, val], i) => {
                  const colors = ['#10b981','#06b6d4','#f59e0b','#a78bfa'];
                  return (
                    <div key={name} style={{ background: '#0C1220', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '14px', padding: '20px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', marginBottom: '8px' }}>{name.toUpperCase()}</div>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: val > 0 ? colors[i%4] : '#334155' }}>{usd(val)}</div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 99, marginTop: 12, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct(val, dept.achieved||1)*100/100}%`, background: colors[i%4], borderRadius: 99 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top performers this month */}
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#cbd5e1', marginBottom: '20px' }}>Member Delivery This Month</h2>
            <div style={{ background: '#0C1220', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['#','Member','Team','Delivered','WIP','Orders','Progress'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', fontSize: '9px', fontWeight: 800, color: '#64748b', textAlign: 'left', letterSpacing: 1, borderBottom: '1px solid rgba(148,163,184,0.08)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...members].sort((a,b) => (b.deliveredAmt||0)-(a.deliveredAmt||0)).map((m,i) => {
                    const p = m.progress || 0;
                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.05)' }}>
                        <td style={{ padding: '12px 16px', fontSize: 11, color: '#334155', fontWeight: 700 }}>{i+1}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{m.name}</div>
                          <div style={{ fontSize: 10, color: '#334155' }}>{m.role}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 11, color: '#64748b' }}>{m.team}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, color: '#10b981' }}>{usd(m.deliveredAmt)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, color: '#f59e0b' }}>{usd(m.wipAmt)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8' }}>{m.delivered||0}</td>
                        <td style={{ padding: '12px 16px', minWidth: 120 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${p}%`, background: p>=70?'#10b981':p>=40?'#f59e0b':'#ef4444', borderRadius: 99 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 800, color: p>=70?'#10b981':p>=40?'#f59e0b':'#ef4444', minWidth: 36 }}>{p}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── SUMMARY TAB ── */}
      {activeTab === 'summary' && (
        <>
          <div className="res-grid-3" style={{ gap: '20px', marginBottom: '40px' }}>
            <StatCard label="SEO ANNUAL TARGET" value={usd(totalRev)}    sub="Operation + Sales" icon="📈" color="#3b82f6" />
            <StatCard label="SMM ANNUAL TARGET"  value={usd(totalSmmRev)} sub="Fiverr + Upwork"   icon="📣" color="#a78bfa" />
            <StatCard label="COMBINED TOTAL"     value={usd(totalRev + totalSmmRev)} sub="All teams" icon="💼" color="#10b981" />
          </div>

          {/* Team comparison */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#cbd5e1', marginBottom: '20px' }}>Annual Team Comparison</h2>
            <div className="res-grid-2" style={{ gap: '20px' }}>
              {/* SEO */}
              <div style={{ background: '#0C1220', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#3b82f6', marginBottom: '16px' }}>SEO TEAM</div>
                {[
                  { label: 'Operation Target', value: usd(456000), color: '#06b6d4' },
                  { label: 'Sales Target',     value: usd(600000), color: '#f59e0b' },
                  { label: 'Combined',         value: usd(totalRev), color: '#10b981' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{r.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
              {/* SMM */}
              <div style={{ background: '#0C1220', border: '1px solid rgba(168,139,250,0.2)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#a78bfa', marginBottom: '16px' }}>SMM TEAM</div>
                {smmProfiles.length > 0 ? smmProfiles.map(p => (
                  <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{p.name}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#a78bfa' }}>{usd((p.monthly||[]).reduce((a,b)=>a+b,0))}</span>
                  </div>
                )) : <div style={{ color: '#334155', fontSize: 12 }}>No SMM data</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', marginTop: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8' }}>Total</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>{usd(totalSmmRev)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly combined view */}
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: '#cbd5e1', marginBottom: '20px' }}>Combined Monthly Target (SEO + SMM)</h2>
            <div className="chart-grid-scroll" style={{ background: '#0C1220', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '16px', padding: '20px', overflowX: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8, minWidth: '600px' }}>
                {months.map((m, i) => {
                  const seoVal = MONTHLY_TARGETS[i] + SALES_TARGETS[i];
                  const smmVal = smmProfiles.reduce((a,p) => a + (p.monthly?.[i]||0), 0);
                  const total  = seoVal + smmVal;
                  const maxVal = 120000;
                  return (
                    <div key={m} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: '#334155', marginBottom: 6, fontWeight: 700 }}>{m.replace("'","'").substring(0,3).toUpperCase()}</div>
                      <div style={{ height: 80, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2 }}>
                        <div style={{ height: `${pct(smmVal,maxVal)}%`, background: '#a78bfa', borderRadius: '3px 3px 0 0', minHeight: smmVal>0?4:0 }} />
                        <div style={{ height: `${pct(seoVal,maxVal)}%`, background: '#3b82f6', borderRadius: smmVal>0?0:'3px 3px 0 0', minHeight: seoVal>0?4:0 }} />
                      </div>
                      <div style={{ fontSize: 9, color: '#64748b', marginTop: 6, fontWeight: 700 }}>{usd(total)}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 16, justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, background: '#3b82f6', borderRadius: 2 }} /><span style={{ fontSize: 10, color: '#64748b' }}>SEO</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, background: '#a78bfa', borderRadius: 2 }} /><span style={{ fontSize: 10, color: '#64748b' }}>SMM</span></div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const BreakdownTable = ({ months, profiles, usd }) => {
  const totalRev = profiles.reduce((a,p) => a + p.monthly.reduce((x,y)=>x+y,0), 0);
  return (
    <div className="ss-table-container" style={{ background: '#0C1220', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '16px', overflow: 'hidden', overflowX: 'auto' }}>
      <table className="ss-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
            <th style={{ padding: '14px 16px', fontSize: '9px', textAlign: 'left', color: '#64748b' }}>PLATFORM</th>
            <th style={{ padding: '14px 16px', fontSize: '9px', textAlign: 'left', color: '#64748b' }}>TYPE</th>
            {months.map((m, i) => (
              <React.Fragment key={m}>
                {i % 3 === 0 && <th style={{ padding: '14px 10px', fontSize: '10px', color: ['#06b6d4','#10b981','#f59e0b','#ec4899'][Math.floor(i/3)] }}>Q{Math.floor(i/3)+1}</th>}
                <th style={{ padding: '14px 10px', fontSize: '9px', color: '#64748b' }}>{m.toUpperCase()}</th>
              </React.Fragment>
            ))}
            <th style={{ padding: '14px 16px', fontSize: '10px', color: '#fff' }}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map(p => {
            const rowTotal = p.monthly.reduce((a,b)=>a+b,0);
            return (
              <tr key={p.name} style={{ borderTop: '1px solid rgba(148,163,184,0.05)' }}>
                <td style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 800, color: p.name==='Fiverr'?'#10b981':'#f1f5f9' }}>● {PLATFORM_MAP[p.name]||p.name}</td>
                <td style={{ padding: '14px 16px', fontSize: '10px', color: '#64748b' }}>{p.type}</td>
                {p.monthly.map((v, i) => (
                  <React.Fragment key={i}>
                    {i % 3 === 0 && <td style={{ padding: '14px 10px', fontSize: '11px', fontWeight: 900, color: ['#06b6d4','#10b981','#f59e0b','#ec4899'][Math.floor(i/3)] }}>{usd(p.monthly.slice(i,i+3).reduce((a,b)=>a+b,0))}</td>}
                    <td style={{ padding: '14px 10px', fontSize: '11px', color: v > 0 ? '#3b82f6' : '#334155' }}>{usd(v)}</td>
                  </React.Fragment>
                ))}
                <td style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 900 }}>{usd(rowTotal)}</td>
              </tr>
            );
          })}
          <tr style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(148,163,184,0.1)' }}>
            <td colSpan="2" style={{ padding: '14px 16px', fontSize: '11px', fontWeight: 900 }}>TOTAL</td>
            {months.map((_, i) => {
              const mTotal = profiles.reduce((a,p) => a + p.monthly[i], 0);
              const qTotal = profiles.reduce((a,p) => a + p.monthly.slice(Math.floor(i/3)*3,(Math.floor(i/3)+1)*3).reduce((x,y)=>x+y,0), 0);
              return (
                <React.Fragment key={i}>
                  {i % 3 === 0 && <td style={{ padding: '14px 10px', fontSize: '11px', fontWeight: 900, color: ['#06b6d4','#10b981','#f59e0b','#ec4899'][Math.floor(i/3)] }}>{usd(qTotal)}</td>}
                  <td style={{ padding: '14px 10px', fontSize: '11px', fontWeight: 900, color: '#3b82f6' }}>{usd(mTotal)}</td>
                </React.Fragment>
              );
            })}
            <td style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 900, color: '#f59e0b' }}>{usd(totalRev)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const StatCard = ({ label, value, sub, icon, color }) => (
  <div style={{ background: '#0C1220', border: '1px solid rgba(148,163,184,0.1)', padding: '24px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', letterSpacing: '1px', marginBottom: '12px' }}>{label}</div>
    <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>{value}</div>
    <div style={{ fontSize: '11px', color: '#64748b' }}>{sub}</div>
    <div style={{ position: 'absolute', top: '20px', right: '20px', opacity: 0.15, fontSize: '22px' }}>{icon}</div>
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: color }} />
  </div>
);

const QCard = ({ label, value, sub, color, progress }) => (
  <div style={{ background: '#0C1220', border: '1px solid rgba(148,163,184,0.1)', padding: '20px', borderRadius: '16px' }}>
    <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', marginBottom: '8px' }}>{label}</div>
    <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>{value}</div>
    <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '16px' }}>{sub}</div>
    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
      <div style={{ height: '100%', width: `${Math.min(100, progress)}%`, background: color, borderRadius: '10px' }} />
    </div>
  </div>
);

const PlatformCard = ({ name, type, value, color }) => (
  <div style={{ background: '#0C1220', border: '1px solid rgba(148,163,184,0.1)', padding: '24px', borderRadius: '16px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
        <div style={{ fontSize: '13px', fontWeight: 800 }}>{name}</div>
      </div>
      <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase' }}>{type}</div>
    </div>
    <div style={{ fontSize: '28px', fontWeight: 900, marginBottom: '4px' }}>{value}</div>
    <div style={{ fontSize: '10px', color: '#64748b' }}>Annual Revenue</div>
    <div style={{ display: 'flex', gap: '4px', marginTop: '20px' }}>
      {[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: '28px', background: color, opacity: 0.1 + (i*0.15), borderRadius: '4px' }} />)}
    </div>
  </div>
);

export default FinanceHub;
