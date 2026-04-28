import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import '../assets/css/tracker.css';

const FOLLOW_UP_TEMPLATES = [
  "Hi {client}, I'm following up on your {service} order (#{order}). Just checking in — have you had a chance to review the delivered work? We'd love your feedback! 😊",
  "Hello {client}! This is follow-up #2 for order #{order} ({service}). If you have any questions or need adjustments, feel free to reach out. We're here to help! ✅",
  "Hi {client}, checking in again on your {service} (Order #{order}). Just a friendly nudge — any feedback or approval would be greatly appreciated! 🙏",
  "Hello {client}! Follow-up #4 for #{order} ({service}). We noticed we haven't heard back — please let us know if everything is satisfactory or if you need any revision. 📩",
  "Hi {client}, this is our final follow-up for order #{order} ({service}). Please review and share your feedback at your earliest convenience. Thank you for working with us! 🌟",
];

const SAMPLE_DATA = [
  { id: 'ORD-4821', client: 'Dhaka Restaurant & Catering', service: 'Local SEO Package', member: 'Jahidul Islam', team: 'Geo Rankers', amt: 120, date: 'Apr 10', followups: [true, true, false, false, false], remark: 'Client is slow to respond', sold: false },
  { id: 'ORD-4790', client: 'RajShahi Travels Agency', service: 'GMB Optimization × 2', member: 'Rafiq Ahmed', team: 'Geo Rankers', amt: 90, date: 'Apr 8', followups: [true, true, true, true, true], remark: 'Converted! Client ordered again 🎉', sold: true },
  { id: 'ORD-4755', client: 'Chittagong Mart Online', service: 'National SEO — Tier 2', member: 'Sara Rahman', team: 'Rank Riser', amt: 250, date: 'Apr 5', followups: [true, false, false, false, false], remark: '', sold: false },
  { id: 'ORD-4820', client: 'Sylhet Coffee House', service: 'Citation Building × 50', member: 'Nadia Khan', team: 'Rank Riser', amt: 75, date: 'Apr 12', followups: [true, true, true, false, false], remark: 'Satisfied, asked for quote', sold: false },
  { id: 'ORD-4800', client: 'Khulna Tech Solutions', service: 'Press Release × 3', member: 'Omar Sheikh', team: 'Search Apex', amt: 180, date: 'Apr 7', followups: [false, false, false, false, false], remark: '', sold: false },
  { id: 'ORD-4810', client: 'Barishal Fashion Hub', service: 'E-commerce SEO Setup', member: 'Priya Das', team: 'Search Apex', amt: 320, date: 'Apr 9', followups: [true, true, true, true, false], remark: 'Requested revision first', sold: false },
  { id: 'ORD-4815', client: 'Mymensingh Auto Parts', service: 'SMM Package — 1 Month', member: 'Tanvir Hossain', team: 'SMM', amt: 200, date: 'Apr 11', followups: [true, true, false, false, false], remark: 'Happy with results', sold: false },
];

const gradFor = (s) => {
  const GRADIENTS = [
    'linear-gradient(135deg,#2f5d8a,#5f85a2)',
    'linear-gradient(135deg,#0f766e,#10b981)',
    'linear-gradient(135deg,#7c3aed,#a78bfa)',
    'linear-gradient(135deg,#b45309,#f59e0b)',
    'linear-gradient(135deg,#be123c,#f43f5e)',
    'linear-gradient(135deg,#1d4ed8,#60a5fa)',
  ];
  return GRADIENTS[s.charCodeAt(0) % GRADIENTS.length];
};

const initials = (s) => s.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const FU_KEY = 'dt_followups_v2';
const loadFuState = () => { try { return JSON.parse(localStorage.getItem(FU_KEY) || '{}'); } catch { return {}; } };
const saveFuState = (s) => localStorage.setItem(FU_KEY, JSON.stringify(s));

function DeliveryTracker() {
  const [rawProjects, setRawProjects] = useState([]);
  const [fuState, setFuState]         = useState(loadFuState); // { orderId: [bool×5, sold] }
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [fuFilter, setFuFilter]       = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [modal, setModal]             = useState(null);
  const [toast, setToast]             = useState('');

  useEffect(() => {
    // Fetch both project data and follow-up state from backend
    Promise.all([
      fetch('/api/data').then(r => r.json()),
      fetch('/api/followups').then(r => r.json())
    ])
    .then(([d, fuData]) => {
      // Convert follow-up list to lookup object
      const lookup = {};
      fuData.forEach(item => {
        lookup[item.key] = item;
      });
      setFuState(lookup);

      const members = d.data || [];
      const all = [];
      members.forEach(m => {
        (m.projects || []).filter(p => p.status === 'Delivered').forEach(p => {
          all.push({
            id:     p.order || `${m.id}-${p.date}`,
            client: p.client || '—',
            service: p.service || '—',
            member: m.name,
            team:   m.team,
            amt:    p.share || p.amtX || 0,
            date:   p.deliveredDate || p.date || '—',
            link:   p.link || null,
          });
        });
      });
      setRawProjects(all);
      setLoading(false);
    })
    .catch(() => { 
      setRawProjects(SAMPLE_DATA.map(d => ({ ...d, id: d.id }))); 
      setLoading(false); 
    });
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const getFu   = (id) => fuState[id]?.fu   || [false,false,false,false,false];
  const getSold = (id) => fuState[id]?.sold  || false;

  const saveToBackend = (id, fu, sold) => {
    fetch('/api/followups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: id, fu, sold })
    }).catch(err => console.error("Save error:", err));
  };

  const toggleFu = (id, idx) => {
    const currentFu = getFu(id);
    const nextFu = currentFu.map((v, i) => i === idx ? !v : v);
    const currentSold = getSold(id);
    
    setFuState(prev => ({ 
      ...prev, 
      [id]: { key: id, fu: nextFu, sold: currentSold } 
    }));
    saveToBackend(id, nextFu, currentSold);
  };

  const toggleSold = (id) => {
    const nextFu = [true, true, true, true, true];
    const nextSold = !getSold(id);
    
    setFuState(prev => ({ 
      ...prev, 
      [id]: { key: id, fu: nextFu, sold: nextSold } 
    }));
    saveToBackend(id, nextFu, nextSold);
  };

  const data = rawProjects.map(p => ({ ...p, followups: getFu(p.id), sold: getSold(p.id) }));
  const fuCount = (fu) => fu.filter(Boolean).length;

  const filtered = data.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !search || d.client.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || d.member.toLowerCase().includes(q);
    const matchMember = !memberFilter || d.member === memberFilter;
    const matchFu = fuFilter === '' ? true : fuFilter === '6' ? d.sold : fuCount(d.followups) === parseInt(fuFilter);
    return matchSearch && matchMember && matchFu;
  });

  const members = [...new Set(rawProjects.map(d => d.member))].sort();
  const total  = data.length;
  const noFu   = data.filter(d => fuCount(d.followups) === 0 && !d.sold).length;
  const inProg = data.filter(d => fuCount(d.followups) > 0 && fuCount(d.followups) < 5 && !d.sold).length;
  const done5  = data.filter(d => fuCount(d.followups) === 5 && !d.sold).length;
  const sold   = data.filter(d => d.sold).length;

  const modalTemplate = modal ? FOLLOW_UP_TEMPLATES[modal.step].replace('{client}', modal.item.client).replace('{service}', modal.item.service).replace('{order}', modal.item.id) : '';

  return (
    <div className="dashboard-root">
      <Header 
        dept="Delivery Tracker" 
        month="Follow-Up Management" 
        onRefresh={() => window.location.reload()}
      />

      <div className="page-nav">
        <div className="page-nav-inner">
          <Link to="/" className="page-nav-btn">← Back to Dashboard</Link>
          <button className="page-nav-btn active">📦 Delivery Tracker</button>
          <Link to="/query-tracker" className="page-nav-btn">🚀 Query Tracker</Link>
          <Link to="/employee" className="page-nav-btn">👤 Employee Portal</Link>
        </div>
      </div>

      <main className="main">
        {/* KPI strip */}
        <div className="kpi-strip">
          <div className="kpi-box" style={{ background: 'rgba(14,24,38,.97)', border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 16 }}>
            <div className="kpi-num" style={{ fontSize: 28, fontWeight: 900, color: '#a5b4fc' }}>{total}</div>
            <div className="kpi-lbl" style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Total Projects</div>
          </div>
          <div className="kpi-box" style={{ background: 'rgba(14,24,38,.97)', border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 16 }}>
            <div className="kpi-num" style={{ fontSize: 28, fontWeight: 900, color: '#ef4444' }}>{noFu}</div>
            <div className="kpi-lbl" style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Not Started</div>
          </div>
          <div className="kpi-box" style={{ background: 'rgba(14,24,38,.97)', border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 16 }}>
            <div className="kpi-num" style={{ fontSize: 28, fontWeight: 900, color: '#60a5fa' }}>{inProg}</div>
            <div className="kpi-lbl" style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Following Up</div>
          </div>
          <div className="kpi-box" style={{ background: 'rgba(14,24,38,.97)', border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 16 }}>
            <div className="kpi-num" style={{ fontSize: 28, fontWeight: 900, color: '#10b981' }}>{done5}</div>
            <div className="kpi-lbl" style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Completed (5)</div>
          </div>
          <div className="kpi-box" style={{ background: 'rgba(14,24,38,.97)', border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 16 }}>
            <div className="kpi-num" style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b' }}>{sold} 💰</div>
            <div className="kpi-lbl" style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Sold / Success</div>
          </div>
        </div>

        {/* Controls */}
        <div className="controls" style={{ marginTop: 20, marginBottom: 20 }}>
          <div className="search-wrap">
            <span className="si">🔍</span>
            <input 
              className="search-input" 
              placeholder="Search client / order..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <div className="filter-tabs">
            {[['', 'All'], ['0', 'No Follow-up'], ['1', '1 Done'], ['2', '2 Done'], ['3', '3 Done'], ['4', '4 Done'], ['5', '5 ✓'], ['6', 'Sold 💰']].map(([v, lbl]) => (
              <button 
                key={v} 
                className={`ftab ${fuFilter === v ? 'active' : ''}`} 
                onClick={() => setFuFilter(v)}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="dt-list">
          {filtered.map(item => {
            const fc = fuCount(item.followups);
            return (
              <div key={item.id} className={`dt-item ${item.sold ? 'sold' : ''}`}>
                <div>
                  <div className="dt-top">
                    <div className="dt-av" style={{ background: gradFor(item.client) }}>{initials(item.client)}</div>
                    <div>
                      <div className="dt-client">{item.client}</div>
                      <div className="dt-meta">{item.id} · {item.service} · {item.date}</div>
                    </div>
                  </div>
                  <div className="dt-info">
                    <div className="dt-field"><div className="dt-field-lbl">Member</div><div className="dt-field-val">{item.member}</div></div>
                    <div className="dt-field"><div className="dt-field-lbl">Team</div><div className="dt-field-val">{item.team}</div></div>
                    <div className="dt-field"><div className="dt-field-lbl">Amount</div><div className="dt-field-val green">${item.amt}</div></div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', marginBottom: 8, textTransform: 'uppercase' }}>Follow-up Progress ({fc}/5)</div>
                  <div className="fu-dots">
                    {item.followups.map((done, i) => (
                      <button 
                        key={i} 
                        className={`fu-dot ${item.sold ? 'sold' : done ? 'done' : 'pending'}`} 
                        onClick={() => toggleFu(item.id, i)}
                      >
                        {item.sold ? '💰' : done ? '✓' : i + 1}
                      </button>
                    ))}
                    <button className="dt-msg-btn" onClick={() => setModal({ item, step: Math.min(fc, 4) })}>
                      📋 Message
                    </button>
                    <button className="dt-msg-btn" style={{ borderColor: 'rgba(245,158,11,.3)', color: '#f59e0b' }} onClick={() => toggleSold(item.id)}>
                      {item.sold ? '↩️ Unmark' : '💰 Sold'}
                    </button>
                  </div>
                </div>
                <div className="dt-right">
                  <div className="dt-amt">${item.amt}</div>
                  {item.sold ? (
                    <span className="dt-status-badge" style={{ background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.3)', color: '#fbbf24' }}>💰 Sold</span>
                  ) : fc === 5 ? (
                    <span className="dt-status-badge" style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.3)', color: '#34d399' }}>✅ Complete</span>
                  ) : fc === 0 ? (
                    <span className="dt-status-badge" style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: '#f87171' }}>⏳ Not Started</span>
                  ) : (
                    <span className="dt-status-badge" style={{ background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.28)', color: '#a5b4fc' }}>🔄 {fc}/5 Done</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="footer">
        <span>SEO Performance Hub</span>
        <span>·</span>
        <span>Delivery Tracker</span>
        <span>·</span>
        <span>April 2026</span>
      </footer>

      {/* Message Modal */}
      {modal && (
        <div className="overlay open" onClick={e => e.target.classList.contains('overlay') && setModal(null)}>
          <div className="modal" style={{ maxWidth: 540, padding: 28 }}>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>📋 Follow-up Message</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{modal.item.client} · {modal.item.id}</div>
            
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <button 
                  key={i} 
                  className={`ftab ${modal.step === i ? 'active' : ''}`}
                  onClick={() => setModal({ ...modal, step: i })}
                >
                  Follow-up {i + 1}
                </button>
              ))}
            </div>

            <textarea 
              style={{ 
                width: '100%', minHeight: 120, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.04)', 
                border: '1px solid rgba(148,163,184,0.18)', color: '#f1f5f9', fontSize: 14, fontFamily: 'inherit', outline: 'none'
              }}
              defaultValue={modalTemplate}
              key={`${modal.item.id}-${modal.step}`}
            />

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="page-nav-btn" onClick={() => setModal(null)}>Cancel</button>
              <button 
                className="page-nav-btn" 
                style={{ background: 'rgba(16,185,129,.15)', borderColor: 'rgba(16,185,129,.3)', color: '#34d399' }}
                onClick={() => {
                  toggleFu(modal.item.id, modal.step);
                  setModal(null);
                  showToast('✅ Message copied & follow-up marked done!');
                }}
              >
                📋 Copy & Mark Done
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" style={{ position: 'fixed', bottom: 24, right: 24, padding: '12px 20px', borderRadius: 12, background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', color: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', zIndex: 1000 }}>
          {toast}
        </div>
      )}
    </div>
  );
}

export default DeliveryTracker;
