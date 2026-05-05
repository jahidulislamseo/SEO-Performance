import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import '../assets/css/query_tracker.css';

const GRADS = [
  'linear-gradient(135deg,#4f46e5,#7c3aed)',
  'linear-gradient(135deg,#0f766e,#10b981)',
  'linear-gradient(135deg,#b45309,#f59e0b)',
  'linear-gradient(135deg,#be123c,#f43f5e)',
  'linear-gradient(135deg,#1d4ed8,#60a5fa)',
  'linear-gradient(135deg,#2f5d8a,#5f85a2)',
];

const gradFor = s => GRADS[s.charCodeAt(0) % GRADS.length];
const initials = s => s.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const BLANK_FORM = { client: '', contact: '', source: '', service: '', budget: '', member: '', remark: '' };

function QueryTracker() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth());
  const [year] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [editId, setEditId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchQueries = (forceRefresh = false) => {
    setLoading(true);
    const monthStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
    const url = `/api/query-tracker?month=${monthStr}${forceRefresh ? '&refresh=true' : ''}`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const mapped = data.map(q => {
          let status = 'new';
          const s = (q.status || '').toLowerCase();
          const cs = (q.convStatus || '').toLowerCase();
          
          if (cs === 'sold' || s === 'pass' || cs.includes('no need')) status = 'closed';
          else if (s.includes('sent') || s.includes('follow-up') || cs.includes('done')) status = 'pending';
          
          return {
            id: q.key,
            client: q.client,
            source: q.source,
            service: q.service,
            profile: q.profile || 'N/A',
            member: q.member,
            date: q.date,
            status: status,
            queryStatus: q.status,
            fu1: q.fu1 || '',
            fu2: q.fu2 || '',
            fu3: q.fu3 || '',
            inboxUrl: q.inboxUrl || '',
            convUrl: q.convUrl || '',
            briefUrl: q.briefUrl || '',
            convStatus: q.convStatus || '',
            sheetRemarks: q.sheetRemarks || '',
            localRemark: q.localRemark || ''
          };
        });
        setQueries(mapped);
        setLoading(false);
        setIsSyncing(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
        setIsSyncing(false);
      });
  };

  useEffect(() => {
    fetchQueries();
  }, [monthIdx]);

  const handleRefresh = () => {
    setIsSyncing(true);
    fetchQueries(true);
  };

  const membersList = [...new Set(queries.map(q => q.member))].sort();

  const filtered = queries.filter(q => {
    const qs = search.toLowerCase();
    const matchSearch = !search || q.client.toLowerCase().includes(qs) || q.member.toLowerCase().includes(qs) || q.service.toLowerCase().includes(qs);
    const matchMember = !memberFilter || q.member === memberFilter;
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchSearch && matchMember && matchStatus;
  });

  const counts = { 
    all: queries.length, 
    new: queries.filter(q => q.status === 'new').length, 
    pending: queries.filter(q => q.status === 'pending').length, 
    closed: queries.filter(q => q.status === 'closed').length 
  };

  const setStatus = (id, status) => setQueries(prev => prev.map(q => q.id === id ? { ...q, status } : q));

  const saveLocalRemark = (key, remark) => {
    fetch('/api/query-remarks', {
      method: 'POST',
      body: JSON.stringify({ key, remark })
    }).then(r => r.json()).catch(e => console.error("Remark save error:", e));
  };

  const openAdd = () => { setForm(BLANK_FORM); setEditId(null); setShowModal(true); };
  const openEdit = (q) => { setForm({ client: q.client, contact: q.inboxUrl, source: q.source, service: q.service, budget: q.profile, member: q.member, remark: q.sheetRemarks }); setEditId(q.id); setShowModal(true); };

  const saveForm = () => {
    if (!form.client.trim()) return;
    if (editId) {
      setQueries(prev => prev.map(q => q.id === editId ? { ...q, ...form } : q));
    } else {
      setQueries(prev => [{ id: Date.now(), date: 'Apr 27', status: 'new', ...form }, ...prev]);
    }
    setShowModal(false);
  };

  const statusConfig = {
    new: { label: '🆕 New', cls: 'st-new-b' },
    pending: { label: '⏳ Pending', cls: 'st-pending-b' },
    closed: { label: '✅ Closed', cls: 'st-closed-b' },
  };

  return (
    <div className="dashboard-root">
      <div className="g1"></div>
      <div className="g2"></div>
      <div className="g3"></div>

      <Header 
        dept="Query & Lead Tracker" 
        month={`${MONTHS[monthIdx]} ${year}`} 
        onRefresh={handleRefresh}
      />

      <div className="page-nav">
        <div className="page-nav-inner">
          <Link to="/" className="page-nav-btn">← Back to Dashboard</Link>
          <Link to="/delivery-tracker" className="page-nav-btn">📦 Repeat Order</Link>
          <button className="page-nav-btn active">🚀 Query Tracker</button>
          <Link to="/kpi-reports" className="page-nav-btn" style={{ background: 'rgba(236,72,153,.12)', borderColor: 'rgba(236,72,153,.3)', color: '#f472b6' }}>📊 KPI Reports</Link>
          <Link to="/employee" className="page-nav-btn">👤 Employee Portal</Link>
          <button className="page-nav-btn" onClick={openAdd} style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', border: 'none', color: 'white', marginLeft: 'auto', padding: '10px 20px' }}>+ Add Query</button>
        </div>
      </div>

      <main className="main" style={{ position: 'relative', zIndex: 10 }}>
        {/* KPI strip */}
        <div className="kpi-strip res-grid-auto" style={{ gap: '20px', marginBottom: '30px' }}>
          {[
            { lbl: 'Total Queries', val: counts.all, color: '#a5b4fc', icon: '📊' },
            { lbl: '🆕 New', val: counts.new, color: '#60a5fa', icon: '🆕' },
            { lbl: '⏳ Pending', val: counts.pending, color: '#f59e0b', icon: '⏳' },
            { lbl: '✅ Closed', val: counts.closed, color: '#10b981', icon: '✅' },
            { lbl: '💰 Converted', val: queries.filter(q => q.status === 'closed' && (q.sheetRemarks || '').includes('✅')).length, color: '#34d399', icon: '💰' }
          ].map(k => (
            <div key={k.lbl} className="tc" style={{ padding: '24px', flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: k.color }}>{k.val}</div>
                <div style={{ fontSize: 24, opacity: 0.2 }}>{k.icon}</div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginTop: 4, letterSpacing: 1 }}>{k.lbl}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="controls res-stack" style={{ gap: '20px', marginTop: 30, marginBottom: 30 }}>
          <div className="search-wrap" style={{ flex: 1, maxWidth: '400px' }}>
            <span className="si">🔍</span>
            <input 
              className="search-input" 
              placeholder="Search client / service / member..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          
          <div className="filter-tabs" style={{ display: 'flex', gap: '8px', background: 'rgba(15,23,42,0.4)', padding: '6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {[['all', 'All'], ['new', '🆕 New'], ['pending', '⏳ Pending'], ['closed', '✅ Closed']].map(([v, lbl]) => (
              <button 
                key={v} 
                className={`ftab ${statusFilter === v ? 'active' : ''}`} 
                onClick={() => setStatusFilter(v)}
                style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '12px' }}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="page-nav-btn" style={{ padding: '8px 12px' }} onClick={() => setMonthIdx(i => Math.max(0, i - 1))}>‹</button>
            <div style={{ fontSize: 14, fontWeight: 900, minWidth: 100, textAlign: 'center', color: '#f1f5f9' }}>{MONTHS[monthIdx]}</div>
            <button className="page-nav-btn" style={{ padding: '8px 12px' }} onClick={() => setMonthIdx(i => Math.min(11, i + 1))}>›</button>
          </div>
        </div>

        {/* Query List */}
        <div className="query-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#64748b', background: 'rgba(15,23,42,0.4)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="spinner" style={{ marginBottom: 16 }}>🌀</div>
              Loading real data from Google Sheets...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 80, color: '#64748b', background: 'rgba(15,23,42,0.4)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
              No queries found for {MONTHS[monthIdx]}.
            </div>
          ) : filtered.map(q => {
            const sc = statusConfig[q.status];
            return (
              <div key={q.id} className={`qc ${q.status}-q`}>
                <div className="q-header">
                  <div className="q-client-wrap">
                    <div className="q-av" style={{ background: gradFor(q.client) }}>{initials(q.client)}</div>
                    <div>
                      <div className="q-client">{q.client}</div>
                      <div className="q-date">Received {q.date} · by {q.member}</div>
                    </div>
                  </div>
                  <div className="q-right">
                    <span className={`status-badge ${sc.cls}`}>{q.queryStatus || sc.label}</span>
                  </div>
                </div>

                <div className="q-grid">
                  <div className="q-item"><div className="q-label">Profile Name</div><div className="q-val hi">{q.profile}</div></div>
                  <div className="q-item"><div className="q-label">Service Line</div><div className="q-val">{q.service}</div></div>
                  <div className="q-item"><div className="q-label">Source</div><div className="q-val">{q.source}</div></div>
                  
                  <div className="q-item"><div className="q-label">First Follow UP</div><div className="q-val">{q.fu1 || '-'}</div></div>
                  <div className="q-item"><div className="q-label">Second Follow Up</div><div className="q-val">{q.fu2 || '-'}</div></div>
                  <div className="q-item"><div className="q-label">Third Follow UP</div><div className="q-val">{q.fu3 || '-'}</div></div>
                  
                  <div className="q-item"><div className="q-label">Conversation Status</div><div className="q-val">{q.convStatus || '-'}</div></div>
                  <div className="q-item"><div className="q-label">Inbox URL</div><div className="q-val">
                    {q.inboxUrl && q.inboxUrl.startsWith('http') ? <a href={q.inboxUrl} target="_blank" rel="noreferrer">Open Inbox ↗</a> : (q.inboxUrl || '-')}
                  </div></div>
                  <div className="q-item"><div className="q-label">Brief URL</div><div className="q-val">
                    {q.briefUrl && q.briefUrl.startsWith('http') ? <a href={q.briefUrl} target="_blank" rel="noreferrer">Open Brief ↗</a> : (q.briefUrl || '-')}
                  </div></div>
                </div>

                {q.sheetRemarks && (
                  <div className="q-remarks">
                    <div className="q-remarks-label">Google Sheet Remarks</div>
                    <div className="q-remark-text">{q.sheetRemarks}</div>
                  </div>
                )}

                <div className="q-local-remark" style={{ marginTop: 20, background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="q-remarks-label" style={{ marginBottom: 12, color: '#3b82f6' }}>Our Internal Remark (Auto-Saves)</div>
                  <input 
                    type="text" 
                    className="search-input" 
                    style={{ width: '100%', padding: '12px 16px', fontSize: 13, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}
                    placeholder="Type your private remark here..." 
                    defaultValue={q.localRemark}
                    onBlur={(e) => saveLocalRemark(q.id, e.target.value)}
                  />
                </div>

                <div className="q-actions">
                  <div style={{ display: 'flex', gap: 8 }}>
                    {q.status !== 'new' && <button className="q-action-btn" onClick={() => setStatus(q.id, 'new')} style={{ background: 'rgba(59,130,246,.1)', borderColor: 'rgba(59,130,246,.25)', color: '#60a5fa' }}>🆕 New</button>}
                    {q.status !== 'pending' && <button className="q-action-btn" onClick={() => setStatus(q.id, 'pending')} style={{ background: 'rgba(245,158,11,.1)', borderColor: 'rgba(245,158,11,.25)', color: '#f59e0b' }}>⏳ Pending</button>}
                    {q.status !== 'closed' && <button className="q-action-btn" onClick={() => setStatus(q.id, 'closed')} style={{ background: 'rgba(16,185,129,.1)', borderColor: 'rgba(16,185,129,.25)', color: '#34d399' }}>✅ Closed</button>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                    <button className="q-action-btn" onClick={() => openEdit(q)} style={{ background: 'rgba(99,102,241,.1)', borderColor: 'rgba(99,102,241,.25)', color: '#a5b4fc' }}>✏️ Edit</button>
                    <button className="q-action-btn" onClick={() => setQueries(prev => prev.filter(x => x.id !== q.id))} style={{ background: 'rgba(239,68,68,.08)', borderColor: 'rgba(239,68,68,.2)', color: '#f87171' }}>🗑️ Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="footer">
        <span>SEO Performance Hub</span>
        <span>·</span>
        <span>Query & Lead Tracker</span>
        <span>·</span>
        <span>April 2026</span>
      </footer>

      {/* Modal */}
      {showModal && (
        <div className="overlay open" onClick={e => e.target.classList.contains('overlay') && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560, padding: 28 }}>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>{editId ? '✏️ Edit Query' : '+ New Query'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="q-label">Client Name</label>
                <input className="search-input" style={{ width: '100%', padding: '10px 14px' }} value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="q-label">Contact</label>
                <input className="search-input" style={{ width: '100%', padding: '10px 14px' }} value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="q-label">Source</label>
                <input className="search-input" style={{ width: '100%', padding: '10px 14px' }} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="q-label">Service</label>
                <input className="search-input" style={{ width: '100%', padding: '10px 14px' }} value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="q-label">Budget</label>
                <input className="search-input" style={{ width: '100%', padding: '10px 14px' }} value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="q-label">Assigned Member</label>
                <select className="search-input" style={{ width: '100%', padding: '10px 14px' }} value={form.member} onChange={e => setForm({ ...form, member: e.target.value })}>
                  <option value="">Select member...</option>
                  {membersList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="q-label">Remarks</label>
              <textarea 
                style={{ width: '100%', minHeight: 100, padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(148,163,184,0.18)', color: 'white', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                value={form.remark} 
                onChange={e => setForm({ ...form, remark: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="page-nav-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="page-nav-btn" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderColor: 'transparent', color: 'white' }} onClick={saveForm}>
                {editId ? 'Save Changes' : 'Add Query'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QueryTracker;
