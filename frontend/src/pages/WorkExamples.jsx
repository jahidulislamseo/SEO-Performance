import React, { useState } from 'react';
import Header from '../components/Header';
import { Link } from 'react-router-dom';

const INITIAL_CATEGORIES = [
  // ... (keeping them as fallback)
  {
    id: 'onpage',
    title: 'Onpage / AEO / GEO',
    emoji: '🎯',
    description: 'Optimization for Search, Answer Engines, and Generative Experience.',
    examples: [
      { name: 'AI Search Optimization', client: 'TechFlow Solutions', result: '+240% Visibility in SGE', detail: 'Content restructuring for LLM-based search engines.' },
      { name: 'Schema Architecture', client: 'ShopMax Retail', result: 'Rich Snippets for 90% URLs', detail: 'Advanced JSON-LD implementation for product sets.' },
      { name: 'GEO-targeted Landing Pages', client: 'Global Relo', result: '15k Monthly Organic Leads', detail: 'Geo-specific optimization for multi-regional services.' },
      { name: 'Core Web Vitals Audit', client: 'Pulse Media', result: '99/100 Mobile Score', detail: 'Speed and performance optimization for publisher nodes.' },
      { name: 'Semantic Keyword Mapping', client: 'EduPath', result: 'Ranked #1 for 50+ High Vol Terms', detail: 'Topic cluster strategy and entity-based optimization.' }
    ]
  },
  {
    id: 'local-seo',
    title: 'Local SEO',
    emoji: '📍',
    description: 'Hyper-local optimization and Google Business Profile management.',
    examples: [
      { name: 'GBP Dominance', client: 'The Dental Hub', result: 'Ranked Top 3 for "Dentist near me"', detail: 'Daily GMB updates and local citation synchronization.' },
      { name: 'Hyper-local Citations', client: 'City Movers', result: '85% Increase in Phone Calls', detail: 'Building niche-specific local business directories.' },
      { name: 'Review Management System', client: 'Elite Restaurant', result: '4.9 Star Average (500+ Reviews)', detail: 'Automated review request and monitoring workflow.' },
      { name: 'Local Backlink Campaign', client: 'AutoCare NY', result: 'DA increase from 12 to 34', detail: 'Sourcing links from local news and community sites.' },
      { name: 'Multi-location Sync', client: 'FitNation Gyms', result: 'Unified NAP across 12 branches', detail: 'Centralized management of physical location data.' }
    ]
  },
  {
    id: 'backlink',
    title: 'Backlink Strategy',
    emoji: '🔗',
    description: 'High-authority link building and relationship management.',
    examples: [
      { name: 'Skyscraper Outreach', client: 'SaaS Pro', result: '45 DR70+ Backlinks', detail: 'Content-driven outreach for high-intent SaaS keywords.' },
      { name: 'Broken Link Building', client: 'HealthGuide', result: '12 Edu/Gov Backlinks', detail: 'Finding and replacing dead resource links in health niche.' },
      { name: 'Resource Page Links', client: 'Finance Expert', result: 'Ranked #1 for "Mortgage Tips"', detail: 'Placement on authoritative financial resource pages.' },
      { name: 'Niche Edits Campaign', client: 'PetLovers', result: 'Steady Traffic Growth (15%/mo)', detail: 'Securing contextual links in existing relevant articles.' },
      { name: 'Competitor Gap Link Building', client: 'eCom Store', result: 'Outranked Competitor B', detail: 'Analyzing and acquiring links that competitors possess.' }
    ]
  },
  {
    id: 'guest-post',
    title: 'Guest Posting',
    emoji: '✍️',
    description: 'Quality content placement on top-tier publications.',
    examples: [
      { name: 'Forbes/Entrepreneur Placement', client: 'Tech CEO', result: 'Instant Brand Authority', detail: 'High-end PR and guest posting on top-tier sites.' },
      { name: 'Tech Niche Publication', client: 'DevCloud', result: 'DA80+ Contextual Link', detail: 'Securing placements on major tech industry blogs.' },
      { name: 'Blogger Outreach', client: 'Lifestyle Brand', result: '20+ Monthly Placements', detail: 'Scaling guest posting across niche-relevant blogs.' },
      { name: 'Content Syndication', client: 'Market News', result: '5k Referral Visits', detail: 'Publishing and syndicating expert content across networks.' },
      { name: 'Industry Whitepapers', client: 'Legal Firm', result: 'Highly Cited Resource', detail: 'Placement of expert research in legal publications.' }
    ]
  },
  {
    id: 'smm',
    title: 'Social Media Management',
    emoji: '📱',
    description: 'Engagement, growth, and performance-based social marketing.',
    examples: [
      { name: 'Viral Reel Campaign', client: 'Fashion Hub', result: '1.2M Organic Impressions', detail: 'Strategic short-form video content for Instagram/TikTok.' },
      { name: 'Community Engagement', client: 'Crypto Wave', result: '50k Discord Members', detail: 'Active moderation and community building for Web3.' },
      { name: 'Influencer Collabs', client: 'Beauty Box', result: '300% ROI on Campaign', detail: 'Managing partnerships with niche micro-influencers.' },
      { name: 'Ads Management (FB/IG)', client: 'Real Estate Pro', result: '$2.50 CPL (Lead Gen)', detail: 'Advanced targeting and creative A/B testing.' },
      { name: 'LinkedIn Thought Leadership', client: 'B2B Consulting', result: 'Top 1% Industry SSI', detail: 'Ghostwriting and profile optimization for executives.' }
    ]
  }
];

const API_BASE = import.meta.env.VITE_API_URL || '';

function WorkExamples() {
  const [activeCat, setActiveCat] = useState('onpage');
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/work-examples`);
        const data = await res.json();
        if (data && data.length > 0) {
          setCategories(data);
        }
      } catch (err) {
        console.error("Error fetching examples:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectedCat = categories.find(c => c.id === activeCat) || categories[0];

  return (
    <div className="dashboard-root" style={{ minHeight: '100vh' }}>
      <div className="g1"></div>
      <div className="g2"></div>
      <div className="g3"></div>
      
      <Header 
        dept="SEO & SMM Showcase" 
        month={loading ? "Loading..." : "Best Performance Examples"}
        onRefresh={() => window.location.reload()}
        onExport={() => alert("Exporting Portfolio...")}
      />

      <div className="page-nav">
        <div className="page-nav-inner">
          <Link to="/" className="page-nav-btn">← Back to Dashboard</Link>
          {categories.map(cat => (
            <button 
              key={cat.id}
              className={`page-nav-btn ${activeCat === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCat(cat.id)}
            >
              {cat.emoji} {cat.title}
            </button>
          ))}
          <Link to="/admin/work-examples" className="page-nav-btn" style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>⚙️ Admin Mode</Link>
        </div>
      </div>

      <main className="main" style={{ padding: '0 32px 40px' }}>
        <div className="section-header" style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '32px', margin: 0, background: 'linear-gradient(to bottom, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {selectedCat.emoji} {selectedCat.title}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '16px', marginTop: '8px' }}>{selectedCat.description}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
          {selectedCat.examples.map((ex, idx) => (
            <div key={idx} className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, padding: '12px 20px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '11px', fontWeight: 800, borderBottomLeftRadius: '12px' }}>
                EXCELLENCE AWARD
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  💼
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>{ex.client}</div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#f1f5f9' }}>{ex.name}</h3>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase' }}>Outcome / Result</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#10b981' }}>{ex.result}</div>
              </div>

              <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', lineHeight: '1.6' }}>
                {ex.detail}
              </p>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: '#f59e0b', fontSize: '12px' }}>★</span>)}
                </div>
                <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>View Case Study →</button>
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
        .page-nav-inner { display: flex; gap: 10px; background: rgba(14, 24, 38, 0.8); backdrop-filter: blur(20px); padding: 8px; border-radius: 16px; border: 1px solid rgba(148, 163, 184, 0.1); overflow-x: auto; scrollbar-width: none; }
        .page-nav-btn { padding: 10px 18px; border-radius: 12px; border: 1px solid transparent; background: transparent; color: #94a3b8; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; text-decoration: none; display: flex; align-items: center; }
        .page-nav-btn:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .page-nav-btn.active { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.2); color: #3b82f6; }
        .card { background: rgba(14, 24, 38, 0.95); border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 20px; transition: transform 0.2s, border-color 0.2s; }
        .card:hover { transform: translateY(-5px); border-color: rgba(59, 130, 246, 0.3); }
      `}</style>
    </div>
  );
}

export default WorkExamples;
