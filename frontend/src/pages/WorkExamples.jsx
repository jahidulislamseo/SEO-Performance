import React from 'react';
import Header from '../components/Header';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  { id: 'aeo', title: 'AEO / GEO', emoji: '🌐', color: '#3b82f6', items: ['AEO Optimization', 'GEO Search Strategy', 'AI Search Visibility', 'Entity Mapping', 'SGE Content Structure'] },
  { id: 'local', title: 'LOCAL SEO', emoji: '📍', color: '#10b981', items: ['GMB Management', 'Local Citations', 'Review Strategy', 'Map Pack Ranking', 'Geo-Targeted Content'] },
  { id: 'backlink', title: 'BACKLINK LIST', emoji: '🔗', color: '#8b5cf6', items: ['DR 70+ Links', 'Niche Edits', 'EDU / GOV Backlinks', 'Contextual Placements', 'Broken Link Building', 'Manual Outreach', 'Competitor Gap Links', 'Resource Page Links', 'High DA Guest Posts', 'Skyscraper Links'] },
  { id: 'guest', title: 'GUEST POST', emoji: '✍️', color: '#f59e0b', items: ['Forbes Placement', 'Entrepreneur Post', 'TechCrunch Feature', 'Industry Blogs', 'Niche-Specific Content', 'Authority Sites', 'Editorial Links', 'Sponsored Content', 'Medium/Substack', 'Business Insider'] },
];

function WorkExamples() {
  return (
    <div className="dashboard-root" style={{ minHeight: '100vh' }}>
      <div className="g1"></div>
      <div className="g2"></div>
      <div className="g3"></div>
      
      <Header 
        dept="SEO & SMM Showcase" 
        month="Performance Examples"
        onRefresh={() => window.location.reload()}
        onExport={() => alert("Exporting Portfolio...")}
      />

      <div className="page-nav">
        <div className="page-nav-inner">
          <Link to="/" className="page-nav-btn">← Back to Dashboard</Link>
          <div className="page-nav-btn active">📂 Work Examples</div>
          <Link to="/kpi-reports" className="page-nav-btn" style={{ background: 'rgba(236,72,153,.12)', borderColor: 'rgba(236,72,153,.3)', color: '#f472b6' }}>📊 KPI Reports</Link>
        </div>
      </div>

      <main className="main" style={{ padding: '0 32px 60px', position: 'relative', zIndex: 10 }}>
        <div className="work-grid">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="tc" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                padding: '16px 24px', 
                background: `linear-gradient(90deg, ${cat.color}22, transparent)`,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>{cat.emoji}</span>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#f1f5f9', letterSpacing: '1px' }}>{cat.title}</span>
              </div>
              
            <div className="work-card-body">
              <div className="work-header-row">
                <span className="h-idx">#</span>
                <span className="h-client">Client Name</span>
                <span className="h-site">Website URL</span>
                <span className="h-report">Report</span>
              </div>
              {cat.items.map((item, idx) => (
                <div key={idx} className="work-item-row">
                  <span className="work-idx">{idx + 1}</span>
                  <span className="work-client">{item}</span>
                  <span className="work-site">example-site.com</span>
                  <a href="#" className="work-report-btn" onClick={(e) => e.preventDefault()}>View Report ↗</a>
                </div>
              ))}
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <button className="add-row-btn" style={{ margin: 0, width: '100%' }}>+ Add Row</button>
              </div>
            </div>
            </div>
          ))}
        </div>
      </main>

      <style>{`
        .dashboard-root { background: #09111f; color: #f1f5f9; position: relative; overflow-x: hidden; font-family: 'Inter', sans-serif; }
        .g1, .g2, .g3 { position: fixed; filter: blur(100px); border-radius: 50%; z-index: 0; pointer-events: none; opacity: 0.15; }
        .g1 { width: 500px; height: 500px; background: #3b82f6; top: -100px; left: -100px; }
        .g2 { width: 400px; height: 400px; background: #10b981; bottom: -100px; right: -100px; }
        .g3 { width: 300px; height: 300px; background: #f59e0b; top: 40%; left: 50%; transform: translate(-50%, -50%); }
        
        .page-nav { position: sticky; top: 70px; z-index: 99; margin: 0 32px 30px; }
        .page-nav-inner { display: flex; gap: 10px; background: rgba(14, 24, 38, 0.8); backdrop-filter: blur(20px); padding: 8px; border-radius: 16px; border: 1px solid rgba(148, 163, 184, 0.1); }
        .page-nav-btn { padding: 10px 18px; border-radius: 12px; border: 1px solid transparent; background: transparent; color: #94a3b8; font-weight: 700; cursor: pointer; transition: all 0.2s; text-decoration: none; display: flex; align-items: center; }
        .page-nav-btn:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .page-nav-btn.active { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.2); color: #3b82f6; }

        .work-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .tc {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 24px;
        }

        .work-card-body {
          padding: 10px 0;
        }

        .work-header-row {
          display: grid;
          grid-template-columns: 40px 1.5fr 1.5fr 100px;
          padding: 12px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 10px;
          font-weight: 900;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .work-item-row {
          display: grid;
          grid-template-columns: 40px 1.5fr 1.5fr 100px;
          padding: 16px 24px;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: background 0.2s;
        }

        .work-item-row:hover {
          background: rgba(255,255,255,0.02);
        }

        .work-idx {
          font-size: 11px;
          font-weight: 900;
          color: #3b82f6;
        }

        .work-client {
          font-size: 13px;
          font-weight: 700;
          color: #f1f5f9;
        }

        .work-site {
          font-size: 12px;
          color: #64748b;
          font-family: monospace;
        }

        .work-report-btn {
          font-size: 11px;
          font-weight: 800;
          color: #3b82f6;
          text-decoration: none;
          background: rgba(59,130,246,0.1);
          padding: 6px 12px;
          border-radius: 6px;
          text-align: center;
          transition: all 0.2s;
        }

        .work-report-btn:hover {
          background: #3b82f6;
          color: #fff;
        }

        .add-row-btn {
          padding: 10px;
          background: transparent;
          border: 1px dashed rgba(255,255,255,0.1);
          color: #64748b;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-row-btn:hover {
          border-color: rgba(255,255,255,0.3);
          color: #f1f5f9;
        }

        @media (max-width: 900px) {
          .work-grid {
            grid-template-columns: 1fr;
          }
          .page-nav {
            margin: 0 16px 20px;
          }
          .main {
            padding: 0 16px 60px !important;
          }
        }

        @media (max-width: 600px) {
          .work-card-body {
            overflow-x: auto;
          }
          .work-header-row, .work-item-row {
            min-width: 500px;
          }
        }

      `}</style>
    </div>
  );
}

export default WorkExamples;
