import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

function WorkExamplesAdmin() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/work-examples`);
      setCategories(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await axios.post(`${API_BASE}/api/work-examples`, { categories });
      setMessage('✅ Successfully saved to database!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Error saving data');
    }
    setSaving(false);
  };

  const updateCategory = (index, field, value) => {
    const newCats = [...categories];
    newCats[index][field] = value;
    setCategories(newCats);
  };

  const updateProject = (catIndex, projIndex, field, value) => {
    const newCats = [...categories];
    newCats[catIndex].examples[projIndex][field] = value;
    setCategories(newCats);
  };

  const addProject = (catIndex) => {
    const newCats = [...categories];
    newCats[catIndex].examples.push({ name: '', client: '', result: '', detail: '' });
    setCategories(newCats);
  };

  const removeProject = (catIndex, projIndex) => {
    const newCats = [...categories];
    newCats[catIndex].examples.splice(projIndex, 1);
    setCategories(newCats);
  };

  if (loading) return <div className="loading">Loading Admin Panel...</div>;

  return (
    <div className="dashboard-root" style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <div className="g1"></div>
      <Header dept="Admin Panel" month="Manage Work Examples" onRefresh={fetchData} />

      <div className="page-nav">
        <div className="page-nav-inner">
          <Link to="/work-examples" className="page-nav-btn">← Back to Showcase</Link>
          <button onClick={handleSave} className="page-nav-btn active" disabled={saving}>
            {saving ? 'Saving...' : '💾 Save All Changes'}
          </button>
          {message && <span style={{ marginLeft: '20px', color: '#10b981', fontWeight: 700 }}>{message}</span>}
        </div>
      </div>

      <main className="main" style={{ padding: '0 32px' }}>
        {categories.map((cat, cIdx) => (
          <div key={cat.id} className="card" style={{ padding: '30px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', alignItems: 'center' }}>
              <input 
                value={cat.emoji} 
                onChange={(e) => updateCategory(cIdx, 'emoji', e.target.value)}
                style={{ fontSize: '30px', width: '60px', background: 'rgba(0,0,0,0.2)', border: '1px solid #334155', borderRadius: '8px', textAlign: 'center' }}
              />
              <div style={{ flex: 1 }}>
                <input 
                  value={cat.title} 
                  onChange={(e) => updateCategory(cIdx, 'title', e.target.value)}
                  style={{ fontSize: '24px', fontWeight: 900, background: 'none', border: 'none', color: '#fff', width: '100%' }}
                />
                <input 
                  value={cat.description} 
                  onChange={(e) => updateCategory(cIdx, 'description', e.target.value)}
                  style={{ fontSize: '14px', color: '#94a3b8', background: 'none', border: 'none', width: '100%', marginTop: '5px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
              {cat.examples.map((ex, pIdx) => (
                <div key={pIdx} style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <span style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 800 }}>PROJECT #{pIdx + 1}</span>
                    <button onClick={() => removeProject(cIdx, pIdx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>CLIENT NAME</label>
                    <input value={ex.client} onChange={(e) => updateProject(cIdx, pIdx, 'client', e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px' }} />
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>PROJECT TITLE</label>
                    <input value={ex.name} onChange={(e) => updateProject(cIdx, pIdx, 'name', e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px' }} />
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>RESULT / KPI</label>
                    <input value={ex.result} onChange={(e) => updateProject(cIdx, pIdx, 'result', e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#10b981', padding: '8px', borderRadius: '6px', fontWeight: 800 }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>DETAILS</label>
                    <textarea value={ex.detail} onChange={(e) => updateProject(cIdx, pIdx, 'detail', e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#94a3b8', padding: '8px', borderRadius: '6px', height: '60px' }} />
                  </div>
                </div>
              ))}
              <button 
                onClick={() => addProject(cIdx)}
                style={{ border: '2px dashed #1e293b', background: 'none', color: '#64748b', borderRadius: '12px', cursor: 'pointer', height: '100%', minHeight: '200px' }}
              >
                + Add New Project
              </button>
            </div>
          </div>
        ))}
      </main>

      <style>{`
        .dashboard-root { background: #09111f; color: #f1f5f9; position: relative; overflow-x: hidden; font-family: 'Inter', sans-serif; }
        .g1 { position: fixed; filter: blur(100px); border-radius: 50%; z-index: 0; pointer-events: none; opacity: 0.15; width: 500px; height: 500px; background: #3b82f6; top: -100px; left: -100px; }
        .page-nav { position: sticky; top: 70px; z-index: 99; margin: 0 32px 30px; }
        .page-nav-inner { display: flex; gap: 10px; background: rgba(14, 24, 38, 0.8); backdrop-filter: blur(20px); padding: 8px; border-radius: 16px; border: 1px solid rgba(148, 163, 184, 0.1); }
        .page-nav-btn { padding: 10px 18px; border-radius: 12px; border: 1px solid transparent; background: transparent; color: #94a3b8; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; text-decoration: none; display: flex; align-items: center; }
        .page-nav-btn:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .page-nav-btn.active { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); color: #10b981; }
        .card { background: rgba(14, 24, 38, 0.95); border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 20px; }
        .loading { display: flex; align-items: center; justify-content: center; height: 100vh; background: #09111f; color: #fff; font-size: 24px; }
      `}</style>
    </div>
  );
}

export default WorkExamplesAdmin;
