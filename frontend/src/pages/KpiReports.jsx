import { useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Radar, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

// --- COMPONENT: COUNT UP NUMBER ---
const CountUp = ({ end, duration = 1500, prefix = '', suffix = '', decimals = 0 }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );
    if (countRef.current) observer.observe(countRef.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const endValue = parseFloat(end);
    if (start === endValue) return;

    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentCount = progress * (endValue - start) + start;
      setCount(currentCount);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [hasStarted, end, duration]);

  return (
    <span ref={countRef}>
      {prefix}{count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
};

function KpiReports() {
  const scrollRef = useRef([]);
  const memberCost = 550;

  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      if (u && u.isAdmin) setIsAdmin(true);
    } catch (e) { }
    setAuthChecked(true);
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const rawData = [
    { m: "July '25", d: 27990, members: 35 },
    { m: "August '25", d: 24488, members: 36 },
    { m: "September '25", d: 28612, members: 35 },
    { m: "October '25", d: 29076, members: 34 },
    { m: "November '25", d: 26564, members: 34 },
    { m: "December '25", d: 25768, members: 33 },
    { m: "January '26", d: 26283, members: 37 },
    { m: "February '26", d: 25856, members: 36 },
    { m: "March '26", d: 34327, members: 34 }
  ];

  const processedData = rawData.map(r => {
    const cost = r.members * memberCost;
    const profit = r.d - cost;
    const profitPct = (profit / r.d) * 100;
    return { ...r, cost, profit, profitPct };
  });

  const totalDelivery = 218153;
  const totalCancellation = 15209;
  const cancellationRate = 6.98;

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = processedData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(processedData.length / rowsPerPage);

  useEffect(() => {
    if (!isAdmin) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
        }
      });
    }, { threshold: 0.1 });

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [isAdmin, authChecked]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
    }
  };

  const futureMonths = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const futureOp = [35000, 35000, 38000, 40000, 42000, 45000, 48000, 48000, 50000, 52000, 54000, 55000];
  const futureSales = [48000, 48000, 52000, 55000, 58000, 62000, 65000, 65000, 68000, 71000, 73000, 75000];

  const futureChartData = {
    labels: futureMonths,
    datasets: [
      {
        label: 'Sales Target ($)',
        data: futureSales,
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderRadius: 4
      },
      {
        label: 'Operation Target ($)',
        data: futureOp,
        backgroundColor: 'rgba(6, 182, 212, 0.8)',
        borderRadius: 4
      }
    ]
  };

  const serviceMixData = {
    labels: ['SEO', 'SMM', 'CMS'],
    datasets: [{
      data: [60, 30, 10],
      backgroundColor: ['#17c3a0', '#e5534b', '#3a86e8'],
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 2,
      hoverOffset: 15
    }]
  };

  const planBData = {
    labels: ['SEO', 'SMM', 'CMS'],
    datasets: [{
      data: [55, 35, 10],
      backgroundColor: ['#17c3a0', '#e5534b', '#3a86e8'],
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 2,
      hoverOffset: 15
    }]
  };

  const planCData = {
    labels: ['SEO', 'SMM', 'CMS'],
    datasets: [{
      data: [50, 40, 10],
      backgroundColor: ['#17c3a0', '#e5534b', '#3a86e8'],
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 2,
      hoverOffset: 15
    }]
  };

  const repeatTargetData = {
    labels: ['Current', 'Q2 Target', 'Year-End Target'],
    datasets: [{
      label: 'Repeat Rate (%)',
      data: [10, 25, 40],
      borderColor: '#17c3a0',
      backgroundColor: 'rgba(23, 195, 160, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointBackgroundColor: '#17c3a0'
    }]
  };

  const cancellationTrendData = {
    labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    datasets: [{
      label: 'Cancellation ($)',
      data: [868, 1628, 2116, 1420, 4000, 2029, 816, 508, 1824],
      borderColor: '#e5534b',
      backgroundColor: 'rgba(229, 83, 75, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#e5534b',
      borderWidth: 3
    }]
  };

  if (!authChecked) return <div style={{ background: '#09111f', minHeight: '100vh' }}></div>;
  if (!isAdmin) {
    return (
      <div style={{ background: '#09111f', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Manrope, sans-serif' }}>
        <h1 style={{ color: '#e5534b', marginBottom: '20px', fontFamily: 'Syne, sans-serif', fontSize: '48px' }}>Access Denied</h1>
        <p style={{ color: '#94a3b8', marginBottom: '30px', fontSize: '16px' }}>Only Administrators have permission to view the KPI Reports.</p>
        <Link to="/" style={{ padding: '12px 24px', background: '#17c3a0', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: '800', letterSpacing: '1px', fontSize: '12px', textTransform: 'uppercase' }}>Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="kpi-presentation-v4">
      <div className="blob b1"></div>
      <div className="blob b2"></div>

      <Header
        dept="SEO Operations Department"
        month="KPI Performance 2025 – 2026"
        onRefresh={() => window.location.reload()}
      />

      <div className="report-actions-v4 no-print">
        <Link to="/" className="btn-v4">← DASHBOARD</Link>
        <button onClick={() => window.print()} className="btn-v4">DOWNLOAD REPORT (PDF)</button>
      </div>

      <main className="report-container-v4">

        {/* SLIDE 1: HERO */}
        <section className="hero-section-v4 reveal" ref={el => scrollRef.current[0] = el}>
          <div className="hero-grid-bg"></div>
          <div className="hero-eyebrow"><span></span> SEO Operations Department</div>
          <h1 className="hero-h1">KPI Performance <em>2025–2026</em></h1>
          <p className="hero-sub">Growth, Challenges & Strategic Improvements — a full review of what we faced, what we built, and where we're heading.</p>
          <p className="hero-meta"><strong>Team:</strong> SEO Operations &nbsp;·&nbsp; <strong>Period:</strong> July 2025 – Present &nbsp;·&nbsp; <em>Internal Use Only</em></p>

          <div className="hero-kpis-v4">
            <div className="kpi-card-v4 teal">
              <div className="kpi-val"><CountUp end={218} prefix="$" suffix="K" /></div>
              <div className="kpi-lbl">Total Delivery</div>
            </div>
            <div className="kpi-card-v4 gold">
              <div className="kpi-val"><CountUp end={cancellationRate} suffix="%" decimals={2} /></div>
              <div className="kpi-lbl">Cancellation Rate</div>
            </div>
          </div>
        </section>

        {/* --- SLIDE 1.5: PERSONAL REFLECTIONS --- */}
        <section className="section-v4" style={{ paddingTop: '20px', marginTop: '-40px' }}>
          <div className="section-tag"><span></span>Reflections</div>
          <h2>Personal Reflections</h2>
          <p className="section-desc">An honest evaluation of leadership missteps and foundational achievements during this period.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'stretch' }}>

            {/* Mistakes Column */}
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '40px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--red)' }}></div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--red)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>⚠️</span> Critical Mistakes
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  "The sales team was weak, but I did not take any proper action. I should have taken the initiative to hire better sales members or improve the team.",
                  "SEO team consistency was an operational bottleneck that required more immediate strategic intervention and oversight.",
                  "When sales started to drop continuously, I should have planned alternative services.",
                  "I failed to take quick action when I first saw early warning signs of the problem."
                ].map((mistake, i) => (
                  <li key={i} style={{ display: 'flex', gap: '15px', color: 'var(--gray)', fontSize: '15px', lineHeight: '1.6' }}>
                    <span style={{ color: 'var(--red)', fontWeight: '800', fontFamily: 'var(--font-display)', fontSize: '18px' }}>0{i + 1}.</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Achievements Column */}
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '40px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--teal)' }}></div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--teal)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>✅</span> Key Achievements
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  "I successfully built 4 separate teams to handle different responsibilities effectively.",
                  "From those 4 teams, I developed 4 team leaders who can take responsibility and manage operations even in my absence.",
                  "I created strong coordination between the Sales and Operations teams, which improved overall workflow and communication.",
                  "I improved the team structure and work process, which helped tasks run more smoothly.",
                  "I gained strong leadership experience by managing multiple teams and handling responsibilities under pressure."
                ].map((achievement, i) => (
                  <li key={i} style={{ display: 'flex', gap: '15px', color: 'var(--gray)', fontSize: '15px', lineHeight: '1.6' }}>
                    <span style={{ color: 'var(--teal)', fontSize: '18px' }}>✓</span>
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </section>

        {/* SLIDE 2: CHALLENGES */}
        <section className="section-v4 reveal" id="challenges" ref={el => scrollRef.current[1] = el}>
          <div className="section-tag"><span></span> 01 — Key Challenges</div>
          <h2>What We Faced</h2>
          <p className="section-desc">Five core challenges shaped our 2025–26 strategy. Each drove a distinct response initiative.</p>

          <table className="challenge-table-v4">
            <thead>
              <tr>
                <th>#</th>
                <th>Challenge</th>
                <th>Context & Data</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>01</td>
                <td>Significant drop in sales / No consistent growth</td>
                <td>
                  Monthly revenue fluctuated with no sustained upward trend.
                  <div className="sales-chips">
                    {rawData.map((r, i) => (
                      <span key={i} className={`chip ${r.d > 30000 ? 'high' : r.d < 25000 ? 'low' : ''}`}>
                        {r.m.split(' ')[0]} ${r.d.toLocaleString()}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
              <tr>
                <td>02</td>
                <td>High market competition</td>
                <td>Different SBUs providing SEO services — even at $5,000 delivery — increases competition and reduces our pipeline share.</td>
              </tr>
              <tr>
                <td>03</td>
                <td>No consistently experienced salesperson</td>
                <td>Conversion ratio remained low. Client requirements often unclear at initial contact stage.</td>
              </tr>
              <tr>
                <td>04</td>
                <td>Clients expect instant results (Ads-like)</td>
                <td>SEO is long-term. Expectation mismatch leads to dissatisfaction and early cancellations.</td>
              </tr>
              <tr>
                <td>05</td>
                <td>No top-rated profile (Authority Gap)</td>
                <td>No profile has performed at the level of "Rankeyfy" — creating a credibility gap.</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* SLIDE 3: SERVICE EXPANSION */}
        <section className="section-v4 reveal" id="services" ref={el => scrollRef.current[2] = el}>
          <div className="section-tag"><span></span> 02 — Service Expansion Strategy</div>
          <h2>Expanding the Portfolio</h2>
          <p className="section-desc">Moving beyond core SEO to meet diverse client needs and capture new market segments.</p>

          <div className="services-compare-v4">
            <div className="svc-col svc-old">
              <div className="svc-col-head">Initial Focus</div>
              <div className="svc-row">
                <div className="svc-icon">🔍</div>
                <div><h4>Technical SEO</h4><p>Site speed, crawlability, indexation optimization</p></div>
              </div>
              <div className="svc-row">
                <div className="svc-icon">⚙️</div>
                <div><h4>On-Page SEO</h4><p>Content, meta tags, keyword targeting & placement</p></div>
              </div>
              <div className="svc-row">
                <div className="svc-icon">🔗</div>
                <div><h4>Backlinks</h4><p>Authority link building campaigns & outreach</p></div>
              </div>
            </div>
            <div className="svc-arrow"><div className="svc-arrow-inner">→</div></div>
            <div className="svc-col svc-new">
              <div className="svc-col-head">Expanded Services</div>
              <div className="svc-row">
                <div className="svc-icon">📍</div>
                <div><h4>Local SEO</h4><p>Google Business Profile, local citations & map ranking</p></div>
              </div>
              <div className="svc-row">
                <div className="svc-icon">🌐</div>
                <div><h4>AEO / GEO</h4><p>AI Engine Optimization & Geo-targeted search strategies</p></div>
              </div>
              <div className="svc-row">
                <div className="svc-icon">✉️</div>
                <div><h4>Guest Posting</h4><p>High-DA guest posts & PR outreach campaigns</p></div>
              </div>
            </div>
          </div>
        </section>

        {/* SLIDE 4: TRAINING */}
        <section className="section-v4 reveal" id="training" ref={el => scrollRef.current[3] = el}>
          <div className="section-tag"><span></span> 03 — Sales Training Initiative</div>
          <h2>14-Day Training Program</h2>

          <div className="training-shifts-v4">
            {[
              { s: "Morning Shift", m: "Mahabub", t: "3:00 PM – 5:00 PM", a: "Gazi Fahim", c: "gold" },
              { s: "Evening Shift", m: "Samiun Islam · Nusrat", t: "12:00 PM – 2:00 PM", a: "Reza", c: "blue" },
              { s: "Night Shift", m: "Lavlu Hossain", t: "7:30 AM – 9:30 AM", a: "Tihim", c: "purple" }
            ].map((sh, idx) => (
              <div key={idx} className={`shift-card-v4 ${sh.c}`}>
                <span className="shift-badge">{sh.s}</span>
                <h4>{sh.m}</h4>
                <p className="shift-meta">Time: <strong>{sh.t}</strong></p>
                <p className="shift-meta">Assigned: <strong>{sh.a}</strong></p>
              </div>
            ))}
          </div>

          <div className="plan-grid-v4">
            {[
              { d: "Day 1", h: "Industry Overview", t: ["SEO Basics", "On-page/Off-page", "SERP Analysis"] },
              { d: "Day 2", h: "Keyword Research", t: ["Search Intent", "Keyword Planner", "Competitor keywords"] },
              { d: "Day 3", h: "On-Page Part 1", t: ["Titles & Meta", "Headings", "Content Optimization"] },
              { d: "Day 4", h: "On-Page Part 2", t: ["Internal Linking", "Image SEO", "UX Factors"] },
              { d: "Day 5", h: "Technical SEO 1", t: ["Speed & Mobile", "Indexing/Crawling", "Sitemaps"] },
              { d: "Day 6", h: "Technical SEO 2", t: ["Redirection (404/301)", "Schema Markup", "SSL Importance"] },
              { d: "Day 7", h: "Off-Page Part 1", t: ["Backlink Strategy", "Link Quality", "Outreach Basics"] },
              { d: "Day 8", h: "Off-Page Part 2", t: ["Social Signals", "Directory Listings", "Competitor links"] },
              { d: "Day 9", h: "Content Strategy 1", t: ["SEO Writing", "Blog Planning", "Integration"] },
              { d: "Day 10", h: "Content Strategy 2", t: ["Content Audit", "KPI Tracking", "Update cycles"] },
              { d: "Day 11", h: "Local SEO 1", t: ["GMB Setup", "Local Citations", "Map Ranking"] },
              { d: "Day 12", h: "Local SEO 2", t: ["Review Mgmt", "Local Analytics", "Multi-location"] },
              { d: "Day 13", h: "Mock Training", t: ["Q&A Recap", "Trainer Feedback", "Topic tests"], full: true },
              { d: "Day 14", h: "Final Execution", t: ["Live Project Fixes", "Strategy Audit", "Final Assessment"], full: true }
            ].map((p, i) => (
              <div key={i} className={`plan-card-v4 ${p.full ? 'full' : ''}`}>
                <div className="plan-day-v4">{p.d}</div>
                <h4>{p.h}</h4>
                <ul className="plan-topics-v4">
                  {p.t.map((topic, ti) => <li key={ti}>{topic}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* SLIDE 5: REPEAT STRATEGY */}
        <section className="section-v4 reveal" id="repeat" ref={el => scrollRef.current[4] = el}>
          <div className="section-tag"><span></span> 04 — Repeat Business & Retention</div>
          <h2>Keeping Clients, Not Just Getting Them</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '50px', marginBottom: '60px', alignItems: 'center' }}>
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '30px' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--teal)', marginBottom: '15px' }}>Retention Roadmap</h4>
              <p style={{ fontSize: '13px', color: 'var(--gray)', lineHeight: '1.6', marginBottom: '20px' }}>
                We are transitioning from a reactive approach to a dedicated retention system. Our goal is to double our repeat rate by the end of the fiscal year through structured tracking and proactive outreach.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--teal)' }}>40%</div>
                  <div style={{ fontSize: '9px', color: 'var(--gray)', textTransform: 'uppercase' }}>Target Rate</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--white)' }}>Q4</div>
                  <div style={{ fontSize: '9px', color: 'var(--gray)', textTransform: 'uppercase' }}>Deadline</div>
                </div>
              </div>
            </div>
            <div style={{ height: '220px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '4px', padding: '20px' }}>
              <Line 
                data={repeatTargetData} 
                options={{
                  ...chartOptions,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
                  }
                }} 
              />
            </div>
          </div>

          <div className="repeat-grid-v4">
            {[
              { n: "01", t: "Dedicated Repeat Team", d: "Specialized team created exclusively to manage and nurture existing client relationships." },
              { n: "02", t: "Tracking Sheet System", d: "Structured client tracking sheet to monitor renewal dates, satisfaction, and upsells." },
              { n: "03", t: "Cross-Service Expansion", d: "Combining our dedicated repeat team, structured tracking system, and cross-sell strategy — repeating clients are guided into adjacent services (SMM, Meta/Google Ads, CMS). Together, these three pillars form a complete client retention engine designed to maximize LTV, reduce churn, and hit our 30–40% repeat order target." }
            ].map((r, i) => (
              <div key={i} className="repeat-card-v4" style={i === 2 ? { gridColumn: 'span 2', background: 'linear-gradient(135deg, rgba(23,195,160,0.08), rgba(14,24,38,0.95))', borderColor: 'rgba(23,195,160,0.25)' } : {}}>
                <div className="repeat-num-v4">{r.n}</div>
                <div>
                  <h4>{r.t}</h4>
                  <p>{r.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SLIDE 6: CANCELLATIONS */}
        <section className="section-v4 reveal" id="cancellations" ref={el => scrollRef.current[5] = el}>
          <div className="section-tag"><span></span> 05 — Cancellation Performance</div>
          <h2>Reducing Cancellations</h2>

          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '4px', padding: '30px', marginBottom: '30px' }}>
            <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--red)', marginBottom: '20px', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>Monthly Cancellation Trend</h4>
            <div style={{ height: '220px' }}>
              <Line 
                data={cancellationTrendData} 
                options={{
                  ...chartOptions,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
                  }
                }} 
              />
            </div>
          </div>

          <div className="cancel-layout-v4">
            <div className="cancel-stats-col">
              <div className="sum-card-v4 delivery">
                <div><div className="lbl">Total Delivery</div><div className="val">${totalDelivery.toLocaleString()}</div></div>
                <span className="icon">📦</span>
              </div>
              <div className="sum-card-v4 total-cancel">
                <div><div className="lbl">Total Cancellation</div><div className="val">${totalCancellation.toLocaleString()}</div></div>
                <span className="icon">❌</span>
              </div>
              <div className="sum-card-v4 pct">
                <div><div className="lbl">Cancellation Rate</div><div className="val">{cancellationRate}%</div></div>
                <span className="icon">📊</span>
              </div>
            </div>
            <div className="cancel-table-col">
              <table className="cancel-table-v4">
                <thead><tr><th>Month</th><th>Cancellation ($)</th></tr></thead>
                <tbody>
                  {[
                    { m: "July '25", v: 868 },
                    { m: "August '25", v: 1628 },
                    { m: "September '25", v: 2116 },
                    { m: "October '25", v: 1420 },
                    { m: "November '25", v: 4000 },
                    { m: "December '25", v: 2029 },
                    { m: "January '26", v: 816 },
                    { m: "February '26", v: 508 },
                    { m: "March '26", v: 1824 }
                  ].map((row, i) => (
                    <tr key={i}>
                      <td>{row.m}</td>
                      <td className={`amt ${row.v > 2000 ? 'high-cancel' : 'low-cancel'}`}>${row.v.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SLIDE 8: 26-27 PLAN */}
        <section className="section-v4 reveal" id="strategic-plan" ref={el => scrollRef.current[6] = el}>
          <div className="section-tag"><span></span> 06 — Future Roadmap</div>
          <h2>2026–2027 Financial Plan</h2>
          <p className="section-desc">Our financial and strategic roadmap for the Jul 2026 – Jun 2027 fiscal year, balancing Operational capacity with aggressive Sales targets.</p>

          <div style={{ height: '300px', marginBottom: '40px', background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '20px' }}>
            <Bar
              data={futureChartData}
              options={{
                ...chartOptions,
                plugins: { legend: { display: true, position: 'top', labels: { color: '#94a3b8', font: { size: 11, family: 'Manrope' } } } },
                scales: {
                  x: { stacked: true, grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                  y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }
                }
              }}
            />
          </div>

          <div className="repeat-grid-v4">
            {[
              { n: "01", t: "Sales Improvement", c: "#3b82f6", cBg: "rgba(59, 130, 246, 0.2)", d: "Hiring qualified, skilled sales members and providing intensive SEO & SMM training to build a high-performing team capable of consistent lead generation and higher conversion rates." },
              { n: "02", t: "Repeat Order ↗", c: "#10b981", cBg: "rgba(16, 185, 129, 0.2)", d: "A dedicated team will focus entirely on client retention and repeat orders. Our primary target is to achieve 30–40% repeat order rate, maximizing Lifetime Value (LTV) and ensuring consistent recurring revenue." },
              { n: "03", t: "Query Tracker ↗", c: "#f59e0b", cBg: "rgba(245, 158, 11, 0.2)", d: "Our custom-built Query Tracker system gives full visibility into every client query — identifying why orders are slowing down, what issues are unresolved, and providing clear solutions. Sales members can use this data directly to address concerns and confidently close more orders." },
              { n: "04", t: "B2B Expansion", c: "#9b5de5", cBg: "rgba(155, 93, 229, 0.2)", d: "Actively converting high-potential clients into long-term B2B partnerships. We are consistently working to grow our B2B client base, ensuring more stable, high-value accounts and increasing the total number of clients month over month." },
              { n: "05", t: "SMM Integration", c: "#e5534b", cBg: "rgba(229, 83, 75, 0.2)", d: "To achieve our monthly targets, we have launched a dedicated SMM service line. This addition allows us to capture new client segments and is projected to contribute 30–45% towards hitting our overall delivery targets each month." },
              { n: "06", t: "CMS Management", c: "#06b6d4", cBg: "rgba(6, 182, 212, 0.2)", d: "Offering end-to-end CMS handling (WordPress, Shopify) alongside SEO efforts. This service is expected to contribute 5–7% towards our monthly delivery targets." }
            ].map((item, i) => (
              <div key={i} className="repeat-card-v4">
                <div className="repeat-num-v4" style={{ fontSize: "48px", color: item.cBg }}>{item.n}</div>
                <div>
                  <h4 style={{ color: item.c }}>{item.t}</h4>
                  <p>{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>



        {/* SECTION: MONTHLY TARGET BREAKDOWN */}
        <section className="section-v4 reveal" id="monthly-targets" ref={el => scrollRef.current[7] = el}>
          <div className="section-tag"><span></span> 07 — Financial Targets</div>
          <h2>Monthly Target Breakdown 2026–27</h2>
          <p className="section-desc">Full-year delivery and sales targets broken down month by month — Jul 2026 to Jun 2027.</p>

          <div style={{ overflowX: 'auto', background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '4px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Month', 'Op. Target ($)', 'Sales Target ($)', 'SMM ($)', 'CMS ($)', 'Total ($)', 'Members'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '14px 18px', borderBottom: '2px solid var(--teal)', color: 'var(--teal)', fontFamily: 'var(--font-display)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { m: "Jul '26", op: 35000, sales: 48000, smm: 4000, cms: 1000, members: 38 },
                  { m: "Aug '26", op: 35000, sales: 48000, smm: 4500, cms: 1200, members: 38 },
                  { m: "Sep '26", op: 38000, sales: 52000, smm: 5000, cms: 1200, members: 40 },
                  { m: "Oct '26", op: 40000, sales: 55000, smm: 6000, cms: 1500, members: 42 },
                  { m: "Nov '26", op: 42000, sales: 58000, smm: 6500, cms: 1800, members: 43 },
                  { m: "Dec '26", op: 45000, sales: 62000, smm: 7500, cms: 2000, members: 44 },
                  { m: "Jan '27", op: 48000, sales: 65000, smm: 8500, cms: 2200, members: 45 },
                  { m: "Feb '27", op: 48000, sales: 65000, smm: 8500, cms: 2200, members: 45 },
                  { m: "Mar '27", op: 50000, sales: 68000, smm: 9000, cms: 2500, members: 46 },
                  { m: "Apr '27", op: 52000, sales: 71000, smm: 10000, cms: 2800, members: 48 },
                  { m: "May '27", op: 54000, sales: 73000, smm: 11000, cms: 3000, members: 50 },
                  { m: "Jun '27", op: 55000, sales: 75000, smm: 12000, cms: 3000, members: 50 },
                ].map((row, i) => {
                  const total = row.op + row.smm + row.cms;
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '13px 18px', fontFamily: 'var(--font-display)', fontSize: '13px', color: 'var(--white)', borderBottom: '1px solid var(--border)' }}>{row.m}</td>
                      <td style={{ padding: '13px 18px', fontSize: '13px', color: 'var(--teal)', fontWeight: '700', borderBottom: '1px solid var(--border)' }}>${row.op.toLocaleString()}</td>
                      <td style={{ padding: '13px 18px', fontSize: '13px', color: 'var(--gold)', fontWeight: '700', borderBottom: '1px solid var(--border)' }}>${row.sales.toLocaleString()}</td>
                      <td style={{ padding: '13px 18px', fontSize: '13px', color: 'var(--red)', borderBottom: '1px solid var(--border)' }}>${row.smm.toLocaleString()}</td>
                      <td style={{ padding: '13px 18px', fontSize: '13px', color: 'var(--blue)', borderBottom: '1px solid var(--border)' }}>${row.cms.toLocaleString()}</td>
                      <td style={{ padding: '13px 18px', fontSize: '13px', fontWeight: '800', color: 'var(--white)', fontFamily: 'var(--font-display)', borderBottom: '1px solid var(--border)' }}>${total.toLocaleString()}</td>
                      <td style={{ padding: '13px 18px', fontSize: '13px', color: 'var(--gray)', borderBottom: '1px solid var(--border)' }}>{row.members}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION: STRATEGIC EXECUTION FRAMEWORK (PLAN A, B, C) */}
        <section className="section-v4 reveal" id="execution-framework" ref={el => scrollRef.current[8] = el}>
          <div className="section-tag"><span></span> 08 — Strategic Execution Framework</div>
          <h2>Operational Contingency & Scaling</h2>
          <p className="section-desc">Our 2026-27 tactical roadmap designed to ensure stability and maximize revenue through data-driven scaling.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '40px' }}>
            {/* PLAN A: VISUAL INFOGRAPHIC */}
            <div style={{ background: 'linear-gradient(145deg, var(--navy2), var(--navy))', border: '1px solid var(--border)', borderRadius: '8px', padding: '35px 25px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
               <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--teal)', boxShadow: '0 0 20px var(--teal)' }}></div>
               <div style={{ fontSize: '10px', color: 'var(--teal)', letterSpacing: '2px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '15px' }}>Plan A: Jul – Sep</div>
               <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '25px', lineHeight: '1.1' }}>Service Mix Target</h3>
               
               <div style={{ height: '200px', position: 'relative', marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '200px', height: '100%', position: 'relative' }}>
                  <Doughnut 
                    data={serviceMixData} 
                    options={{ 
                      plugins: { legend: { display: false } },
                      cutout: '70%',
                      spacing: 5,
                      borderRadius: 2,
                      maintainAspectRatio: false
                    }} 
                  />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: '100%', pointerEvents: 'none' }}>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--white)', fontFamily: 'var(--font-display)', lineHeight: '1' }}>
                      60%
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginTop: '4px' }}>SEO Anchor</div>
                  </div>
                </div>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { l: 'SEO Operations', v: '60%', c: 'var(--teal)' },
                    { l: 'SMM Integration', v: '30%', c: 'var(--red)' },
                    { l: 'CMS Handling', v: '10%', c: 'var(--blue)' }
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '1px', background: s.c }}></div>
                        <span style={{ fontSize: '12px', color: 'var(--gray)' }}>{s.l}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--white)', fontFamily: 'var(--font-display)' }}>{s.v}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* PLAN B: VISUAL INFOGRAPHIC */}
            <div style={{ background: 'linear-gradient(145deg, var(--navy2), var(--navy))', border: '1px solid var(--border)', borderRadius: '8px', padding: '35px 25px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
               <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--gold)', boxShadow: '0 0 20px var(--gold)' }}></div>
               <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '2px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '15px' }}>Plan B: Oct – Dec</div>
               <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '25px', lineHeight: '1.1' }}>Retention Pivot</h3>
               
               <div style={{ height: '200px', position: 'relative', marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '200px', height: '100%', position: 'relative' }}>
                  <Doughnut 
                    data={planBData} 
                    options={{ 
                      plugins: { legend: { display: false } },
                      cutout: '70%',
                      spacing: 5,
                      borderRadius: 2,
                      maintainAspectRatio: false
                    }} 
                  />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: '100%', pointerEvents: 'none' }}>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--white)', fontFamily: 'var(--font-display)', lineHeight: '1' }}>
                      55%
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginTop: '4px' }}>SEO Anchor</div>
                  </div>
                </div>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { l: 'SEO Operations', v: '55%', c: 'var(--teal)' },
                    { l: 'SMM Integration', v: '35%', c: 'var(--red)' },
                    { l: 'CMS Handling', v: '10%', c: 'var(--blue)' }
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '1px', background: s.c }}></div>
                        <span style={{ fontSize: '12px', color: 'var(--gray)' }}>{s.l}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--white)', fontFamily: 'var(--font-display)' }}>{s.v}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* PLAN C: VISUAL INFOGRAPHIC */}
            <div style={{ background: 'linear-gradient(145deg, var(--navy2), var(--navy))', border: '1px solid var(--border)', borderRadius: '8px', padding: '35px 25px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
               <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--blue)', boxShadow: '0 0 20px var(--blue)' }}></div>
               <div style={{ fontSize: '10px', color: 'var(--blue)', letterSpacing: '2px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '15px' }}>Plan C: Jan – Mar</div>
               <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '25px', lineHeight: '1.1' }}>Scaling Efficiency</h3>
               
               <div style={{ height: '200px', position: 'relative', marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '200px', height: '100%', position: 'relative' }}>
                  <Doughnut 
                    data={planCData} 
                    options={{ 
                      plugins: { legend: { display: false } },
                      cutout: '70%',
                      spacing: 5,
                      borderRadius: 2,
                      maintainAspectRatio: false
                    }} 
                  />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: '100%', pointerEvents: 'none' }}>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--white)', fontFamily: 'var(--font-display)', lineHeight: '1' }}>
                      50%
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginTop: '4px' }}>SEO Anchor</div>
                  </div>
                </div>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { l: 'SEO Operations', v: '50%', c: 'var(--teal)' },
                    { l: 'SMM Integration', v: '40%', c: 'var(--red)' },
                    { l: 'CMS Handling', v: '10%', c: 'var(--blue)' }
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '1px', background: s.c }}></div>
                        <span style={{ fontSize: '12px', color: 'var(--gray)' }}>{s.l}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--white)', fontFamily: 'var(--font-display)' }}>{s.v}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* SUMMARY BOX */}
            <div style={{ gridColumn: 'span 3', background: 'linear-gradient(90deg, var(--navy3), var(--navy2))', border: '1px solid var(--border)', borderRadius: '8px', padding: '35px', display: 'flex', alignItems: 'center', gap: '35px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '48px', filter: 'drop-shadow(0 0 10px var(--teal))' }}>🚀</div>
              <div>
                <h4 style={{ color: 'var(--teal)', fontSize: '18px', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Strategic Readiness</h4>
                <p style={{ fontSize: '14px', color: 'var(--gray)', margin: 0, lineHeight: '1.6' }}>
                  This combined framework (A+B+C) ensures that our operations remain resilient while scaling toward our <strong>$55,000 monthly delivery</strong> and <strong>$75,000 monthly sales</strong> targets by June 2027.
                </p>
              </div>
            </div>
          </div>
        </section>





      </main>

      <footer className="footer-v4">
        <span>SEO Operations Team · 2025–2026</span>
        <span>INTERNAL USE ONLY</span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Manrope:wght@400;500;600;700;800&display=swap');

        :root {
          --navy: #09111f; --navy2: #0e1826; --navy3: #112030;
          --teal: #17c3a0; --teal2: #0fa882; --gold: #f5a623;
          --red: #e5534b; --blue: #3a86e8; --purple: #9b5de5;
          --green: #2ecc71; --white: #f1f5f9; --gray: #94a3b8;
          --border: rgba(255,255,255,0.07);
          --font-sans: 'Manrope', sans-serif;
          --font-display: 'Syne', sans-serif;
        }

        .kpi-presentation-v4 { background: var(--navy); color: var(--white); font-family: var(--font-sans); min-height: 100vh; position: relative; overflow-x: hidden; }
        .blob { position: fixed; filter: blur(140px); z-index: 0; opacity: 0.15; pointer-events: none; }
        .b1 { width: 600px; height: 600px; background: var(--teal); top: -200px; right: -200px; }
        .b2 { width: 500px; height: 500px; background: var(--blue); bottom: -200px; left: -200px; }

        .report-actions-v4 { position: fixed; top: 80px; right: 40px; display: flex; gap: 10px; z-index: 1000; }
        .btn-v4 { background: var(--navy2); border: 1px solid var(--border); padding: 10px 18px; border-radius: 4px; font-size: 10px; font-weight: 800; color: var(--white); cursor: pointer; text-decoration: none; transition: 0.3s; letter-spacing: 1px; }
        .btn-v4:hover { border-color: var(--teal); color: var(--teal); }

        .report-container-v4 { max-width: 1200px; margin: 0 auto; padding: 0 40px; position: relative; z-index: 10; }
        .section-v4 { padding: 100px 0; border-bottom: 1px solid var(--border); }

        /* HERO V4 */
        .hero-section-v4 { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; position: relative; padding: 100px 0; }
        .hero-grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse 80% 80% at 80% 20%, black, transparent); pointer-events: none; }
        .hero-eyebrow { font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: var(--teal); margin-bottom: 28px; display: flex; align-items: center; gap: 12px; font-family: var(--font-display); }
        .hero-eyebrow span { width: 40px; height: 1px; background: var(--teal); }
        .hero-h1 { font-family: var(--font-display); font-size: 100px; font-weight: 800; line-height: 0.95; letter-spacing: -4px; margin-bottom: 20px; }
        .hero-h1 em { font-style: normal; color: var(--teal); display: block; }
        .hero-sub { max-width: 500px; font-size: 18px; color: var(--gray); line-height: 1.6; margin-bottom: 20px; }
        .hero-meta { font-size: 14px; color: var(--gray); margin-bottom: 60px; }
        .hero-meta strong { color: var(--white); }

        .hero-kpis-v4 { display: flex; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; background: var(--navy2); }
        .kpi-card-v4 { padding: 30px 40px; border-right: 1px solid var(--border); position: relative; flex: 1; }
        .kpi-card-v4::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
        .kpi-card-v4.teal::before { background: var(--teal); }
        .kpi-card-v4.gold::before { background: var(--gold); }
        .kpi-card-v4.purple::before { background: var(--purple); }
        .kpi-card-v4.blue::before { background: var(--blue); }
        .kpi-val { font-family: var(--font-display); font-size: 42px; font-weight: 800; line-height: 1; margin-bottom: 10px; }
        .kpi-card-v4.teal .kpi-val { color: var(--teal); }
        .kpi-card-v4.gold .kpi-val { color: var(--gold); }
        .kpi-card-v4.purple .kpi-val { color: var(--purple); }
        .kpi-card-v4.blue .kpi-val { color: var(--blue); }
        .kpi-lbl { font-size: 11px; color: var(--gray); text-transform: uppercase; letter-spacing: 1px; }

        /* SECTION HEADERS */
        .section-tag { font-family: var(--font-display); font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: var(--teal); margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .section-tag span { width: 30px; height: 1px; background: var(--teal); }
        h2 { font-family: var(--font-display); font-size: 48px; font-weight: 800; letter-spacing: -1.5px; margin-bottom: 20px; }
        .section-desc { font-size: 15px; color: var(--gray); max-width: 600px; margin-bottom: 50px; line-height: 1.7; }

        /* CHALLENGE TABLE V4 */
        .challenge-table-v4 { width: 100%; border-collapse: collapse; }
        .challenge-table-v4 th { text-align: left; padding: 15px 20px; border-bottom: 2px solid var(--teal); color: var(--teal); font-family: var(--font-display); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; }
        .challenge-table-v4 td { padding: 25px 20px; border-bottom: 1px solid var(--border); font-size: 14px; color: var(--gray); line-height: 1.6; vertical-align: top; }
        .challenge-table-v4 td:first-child { font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--gold); width: 80px; text-align: center; }
        .challenge-table-v4 td:nth-child(2) { font-weight: 700; color: var(--white); width: 300px; }
        .sales-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .chip { padding: 4px 12px; background: rgba(255,255,255,0.05); border-radius: 4px; font-size: 11px; font-weight: 600; color: var(--gray); }
        .chip.high { color: var(--green); background: rgba(46,204,113,0.1); }
        .chip.low { color: var(--red); background: rgba(229,83,75,0.1); }

        /* SERVICES V4 */
        .services-compare-v4 { display: grid; grid-template-columns: 1fr 60px 1fr; border: 1px solid var(--border); background: var(--navy2); border-radius: 4px; }
        .svc-col { padding: 40px; }
        .svc-old { border-right: 1px solid var(--border); }
        .svc-arrow { display: flex; align-items: center; justify-content: center; background: var(--navy3); }
        .svc-arrow-inner { width: 36px; height: 36px; background: var(--teal2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; }
        .svc-col-head { font-family: var(--font-display); font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--gray); margin-bottom: 30px; }
        .svc-new .svc-col-head { color: var(--teal); }
        .svc-row { display: flex; gap: 20px; margin-bottom: 30px; }
        .svc-icon { width: 44px; height: 44px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .svc-new .svc-icon { background: rgba(23,195,160,0.15); }
        .svc-row h4 { font-family: var(--font-display); font-size: 18px; margin-bottom: 4px; }
        .svc-row p { font-size: 13px; color: var(--gray); line-height: 1.5; }

        /* TRAINING V4 */
        .training-shifts-v4 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 60px; }
        .shift-card-v4 { padding: 30px; border: 1px solid var(--border); border-radius: 4px; position: relative; background: var(--navy2); }
        .shift-card-v4::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; }
        .shift-card-v4.gold::before { background: var(--gold); }
        .shift-card-v4.blue::before { background: var(--blue); }
        .shift-card-v4.purple::before { background: var(--purple); }
        .shift-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 15px; }
        .shift-card-v4.gold .shift-badge { background: rgba(245,166,35,0.1); color: var(--gold); }
        .shift-card-v4.blue .shift-badge { background: rgba(58,134,232,0.1); color: var(--blue); }
        .shift-card-v4.purple .shift-badge { background: rgba(155,93,229,0.1); color: var(--purple); }
        .shift-card-v4 h4 { font-family: var(--font-display); font-size: 18px; margin-bottom: 8px; }
        .shift-meta { font-size: 13px; color: var(--gray); margin-bottom: 4px; }
        .shift-meta strong { color: var(--teal); }

        .plan-grid-v4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .plan-card-v4 { background: var(--navy2); border: 1px solid var(--border); padding: 25px; border-radius: 4px; }
        .plan-card-v4.full { grid-column: span 2; }
        .plan-day-v4 { font-family: var(--font-display); font-size: 11px; font-weight: 800; color: var(--teal); margin-bottom: 12px; letter-spacing: 1px; }
        .plan-card-v4 h4 { font-size: 15px; font-weight: 700; margin-bottom: 12px; color: var(--white); }
        .plan-topics-v4 { list-style: none; padding: 0; }
        .plan-topics-v4 li { font-size: 12px; color: var(--gray); padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .plan-topics-v4 li:last-child { border: none; }

        /* REPEAT V4 */
        .repeat-grid-v4 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .repeat-card-v4 { padding: 40px; background: var(--navy2); border: 1px solid var(--border); border-radius: 4px; display: flex; gap: 30px; align-items: flex-start; }
        .repeat-num-v4 { font-family: var(--font-display); font-size: 64px; font-weight: 800; color: rgba(23,195,160,0.15); line-height: 0.8; }
        .repeat-card-v4 h4 { font-family: var(--font-display); font-size: 20px; color: var(--teal); margin-bottom: 10px; }
        .repeat-card-v4 p { font-size: 14px; color: var(--gray); line-height: 1.6; }

        /* CANCEL V4 */
        .cancel-layout-v4 { display: grid; grid-template-columns: 350px 1fr; gap: 50px; }
        .sum-card-v4 { padding: 30px; border-radius: 4px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border); }
        .sum-card-v4.delivery { background: rgba(23,195,160,0.05); border-color: rgba(23,195,160,0.2); }
        .sum-card-v4.total-cancel { background: rgba(229,83,75,0.05); border-color: rgba(229,83,75,0.2); }
        .sum-card-v4.pct { background: rgba(245,166,35,0.05); border-color: rgba(245,166,35,0.2); }
        .sum-card-v4 .lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--gray); margin-bottom: 8px; }
        .sum-card-v4 .val { font-family: var(--font-display); font-size: 32px; font-weight: 800; line-height: 1; }
        .sum-card-v4.delivery .val { color: var(--teal); }
        .sum-card-v4.total-cancel .val { color: var(--red); }
        .sum-card-v4.pct .val { color: var(--gold); }
        .sum-card-v4 .icon { font-size: 32px; opacity: 0.5; }

        .cancel-table-v4 { width: 100%; border-collapse: collapse; }
        .cancel-table-v4 th { text-align: left; padding: 12px 16px; border-bottom: 2px solid var(--teal); color: var(--teal); font-family: var(--font-display); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; }
        .cancel-table-v4 td { padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 14px; color: var(--gray); }
        .cancel-table-v4 td.amt { font-weight: 700; color: var(--white); }
        .cancel-table-v4 td.high-cancel { color: var(--red); }
        .cancel-table-v4 td.low-cancel { color: var(--green); }

        /* FINANCIAL V4 */
        .fin-table-wrap-v4 { overflow-x: auto; background: var(--navy2); border: 1px solid var(--border); border-radius: 4px; padding: 10px; }
        .fin-table-v4 { width: 100%; border-collapse: collapse; }
        .fin-table-v4 th { text-align: left; padding: 15px 20px; border-bottom: 2px solid var(--teal); color: var(--teal); font-family: var(--font-display); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; }
        .fin-table-v4 td { padding: 15px 20px; border-bottom: 1px solid var(--border); font-size: 14px; color: var(--gray); }
        .fin-table-v4 td.money { font-weight: 800; color: var(--white); font-family: var(--font-display); }
        .fin-table-v4 td.teal { color: var(--teal); }
        .fin-table-v4 td.red { color: var(--red); }

        .footer-v4 { padding: 60px 0; display: flex; justify-content: space-between; font-size: 11px; letter-spacing: 2px; color: var(--gray); border-top: 1px solid var(--border); }

        .reveal { opacity: 1; transform: none; transition: 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal.in { opacity: 1; transform: none; }

        @media (max-width: 900px) {
          .hero-h1 { font-size: 60px; }
          .hero-kpis-v4 { flex-direction: column; }
          .training-shifts-v4, .plan-grid-v4, .repeat-grid-v4, .cancel-layout-v4 { grid-template-columns: 1fr; }
          .services-compare-v4 { grid-template-columns: 1fr; }
          .svc-arrow { display: none; }
        }
      `}</style>
    </div>
  );
}

export default KpiReports;
