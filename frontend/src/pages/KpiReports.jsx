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
  const totalDeliveryOrders = 1134;
  const totalCancellationOrders = 73;
  const cancellationRateOrders = 6.4;

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

    const revealElements = document.querySelectorAll('.reveal, .reveal-stagger > *');
    revealElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [isAdmin, authChecked]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(9, 9, 27, 0.95)',
        titleFont: { family: 'Outfit', size: 14, weight: '700' },
        bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
        titleColor: '#22d3ee',
        bodyColor: '#94a3b8',
        padding: 16,
        cornerRadius: 12,
        borderColor: 'rgba(34, 211, 238, 0.2)',
        borderWidth: 1,
        displayColors: true,
        boxPadding: 6
      }
    },
    scales: {
      y: { 
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }, 
        ticks: { color: '#64748b', font: { size: 11, family: 'Plus Jakarta Sans' }, padding: 8 },
        border: { dash: [4, 4] }
      },
      x: { 
        grid: { display: false }, 
        ticks: { color: '#64748b', font: { size: 11, family: 'Plus Jakarta Sans' }, padding: 8 }
      }
    }
  };

  const futureMonths = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const futureOp = [35000, 35000, 38000, 40000, 42000, 45000, 48000, 48000, 50000, 52000, 54000, 55000];
  const futureSales = [48000, 48000, 52000, 55000, 58000, 62000, 65000, 65000, 68000, 71000, 73000, 75000];

  const futureChartData = {
    labels: futureMonths,
    datasets: [
      {
        label: 'Operation Target ($)',
        data: futureOp,
        backgroundColor: '#9049D6',
        hoverBackgroundColor: '#a855f7',
        borderRadius: 4,
        borderWidth: 0,
        barPercentage: 0.8,
        categoryPercentage: 0.8
      },
      {
        label: 'Sales Target ($)',
        data: futureSales,
        backgroundColor: '#D7A423',
        hoverBackgroundColor: '#fbbf24',
        borderRadius: 4,
        borderWidth: 0,
        barPercentage: 0.8,
        categoryPercentage: 0.8
      }
    ]
  };

  const serviceMixData = {
    labels: ['SEO', 'SMM', 'CMS'],
    datasets: [{
      data: [60, 30, 10],
      backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
      borderColor: 'rgba(0,0,0,0)',
      borderWidth: 0,
      hoverOffset: 12
    }]
  };

  const planBData = {
    labels: ['SEO', 'SMM', 'CMS'],
    datasets: [{
      data: [50, 40, 10],
      backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
      borderColor: 'rgba(0,0,0,0)',
      borderWidth: 0,
      hoverOffset: 12
    }]
  };

  const planCData = {
    labels: ['SEO', 'SMM', 'CMS'],
    datasets: [{
      data: [45, 45, 10],
      backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
      borderColor: 'rgba(0,0,0,0)',
      borderWidth: 0,
      hoverOffset: 12
    }]
  };

  const repeatTargetData = {
    labels: ['July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April'],
    datasets: [{
      label: 'Repeat Revenue ($)',
      data: [9276, 8534, 8868, 10104, 5940, 5928, 6405, 5248, 10975, 9213],
      borderColor: '#22d3ee',
      backgroundColor: 'rgba(34, 211, 238, 0.08)',
      fill: true,
      tension: 0.45,
      pointRadius: 5,
      pointHoverRadius: 8,
      pointBackgroundColor: '#22d3ee',
      pointBorderColor: 'rgba(9, 9, 27, 0.8)',
      pointBorderWidth: 2,
      borderWidth: 2
    }]
  };

  const cancellationTrendData = {
    labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    datasets: [{
      label: 'Cancellation ($)',
      data: [868, 1628, 2116, 1420, 4000, 2029, 816, 508, 1824],
      borderColor: '#f43f5e',
      backgroundColor: 'rgba(244, 63, 94, 0.08)',
      fill: true,
      tension: 0.45,
      pointRadius: 5,
      pointHoverRadius: 9,
      pointBackgroundColor: '#f43f5e',
      pointBorderColor: 'rgba(9, 9, 27, 0.8)',
      pointBorderWidth: 2,
      borderWidth: 2.5
    }]
  };

  if (!authChecked) return <div style={{ background: '#09111f', minHeight: '100vh' }}></div>;
  if (!isAdmin) {
    return (
      <div style={{ background: 'var(--navy)', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)' }}>
        <h1 style={{ color: 'var(--rose)', marginBottom: '20px', fontFamily: 'var(--font-display)', fontSize: '48px' }}>Access Denied</h1>
        <p style={{ color: 'var(--slate-400)', marginBottom: '30px', fontSize: '16px' }}>Only Administrators have permission to view the KPI Reports.</p>
        <Link to="/" style={{ padding: '12px 24px', background: 'var(--accent)', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: '800', letterSpacing: '1px', fontSize: '12px', textTransform: 'uppercase' }}>Return to Dashboard</Link>
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

          <div className="hero-kpis-v4 reveal-stagger">
            <div className="kpi-card-v4 teal">
              <div className="kpi-val"><CountUp end={218} prefix="$" suffix="K" /></div>
              <div className="kpi-lbl">Total Delivery</div>
            </div>
            <div className="kpi-card-v4 gold">
              <div className="kpi-val"><CountUp end={totalCancellation} prefix="$" separator="," /></div>
              <div className="kpi-lbl">Total Cancellation</div>
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
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--rose)' }}></div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--rose)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>⚠️</span> Critical Mistakes
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  "The sales team was weak, but I did not take any proper action. I should have taken the initiative to hire better sales members or improve the team.",
                  "When sales started to drop continuously, I should have planned alternative services.",
                  "I failed to take quick action when I first saw early warning signs of the problem."
                ].map((mistake, i) => (
                  <li key={i} style={{ display: 'flex', gap: '15px', color: 'var(--slate-400)', fontSize: '15px', lineHeight: '1.6' }}>
                    <span style={{ color: 'var(--rose)', fontSize: '18px' }}>•</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Achievements Column */}
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '40px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--accent)' }}></div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--accent)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                  <li key={i} style={{ display: 'flex', gap: '15px', color: 'var(--slate-400)', fontSize: '15px', lineHeight: '1.6' }}>
                    <span style={{ color: 'var(--accent)', fontSize: '18px' }}>✓</span>
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

          <div className="training-shifts-v4 reveal-stagger">
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
          <div className="section-tag"><span></span> 04 — Repeat Business &amp; Retention</div>


          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '50px', marginBottom: '60px', alignItems: 'center' }}>
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '30px' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)', marginBottom: '15px' }}>Retention Roadmap</h4>
              <p style={{ fontSize: '13px', color: 'var(--slate-400)', lineHeight: '1.6', marginBottom: '20px' }}>
                We are transitioning from a reactive approach to a dedicated retention system. Our goal is to double our repeat rate by the end of the fiscal year through structured tracking and proactive outreach.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>40%</div>
                  <div style={{ fontSize: '9px', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Target Rate</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--white)' }}>Q4</div>
                  <div style={{ fontSize: '9px', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Deadline</div>
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
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 }, callback: v => '$' + v.toLocaleString() } },
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

          <div style={{ background: 'rgba(244, 63, 94, 0.04)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '16px', padding: '30px', marginBottom: '30px', backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--rose)', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--rose)', display: 'inline-block', boxShadow: '0 0 10px var(--rose)' }}></span>
                Monthly Cancellation Trend
              </h4>
              <span style={{ fontSize: '11px', color: 'var(--slate-500)', letterSpacing: '1px' }}>Jul 2025 – Mar 2026</span>
            </div>
            <div style={{ height: '220px' }}>
              <Line 
                data={cancellationTrendData} 
                options={{
                  ...chartOptions,
                  plugins: { ...chartOptions.plugins, legend: { display: false } },
                  scales: {
                    y: { grid: { color: 'rgba(244, 63, 94, 0.06)' }, ticks: { color: '#94a3b8', font: { size: 10 }, callback: v => '$' + v.toLocaleString() } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
                  }
                }} 
              />
            </div>
          </div>

          <div className="cancel-layout-v4">
            <div className="cancel-stats-col">
              <div className="sum-card-v4 delivery">
                <div style={{ flex: 1 }}>
                  <div className="lbl">Total Delivery</div>
                  <div className="val">${totalDelivery.toLocaleString()}</div>
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '1px' }}>Orders</span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>{totalDeliveryOrders.toLocaleString()}</span>
                  </div>
                </div>
                <span className="icon">📦</span>
              </div>
              <div className="sum-card-v4 total-cancel">
                <div style={{ flex: 1 }}>
                  <div className="lbl">Total Cancellation</div>
                  <div className="val">${totalCancellation.toLocaleString()}</div>
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '1px' }}>Orders</span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--rose)', fontFamily: 'var(--font-display)' }}>{totalCancellationOrders.toLocaleString()}</span>
                  </div>
                </div>
                <span className="icon">❌</span>
              </div>
              <div className="sum-card-v4 pct">
                <div style={{ flex: 1 }}>
                  <div className="lbl">Cancellation Rate</div>
                  <div className="val">{cancellationRate}%</div>
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '1px' }}>By Orders</span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--secondary)', fontFamily: 'var(--font-display)' }}>{cancellationRateOrders}%</span>
                  </div>
                </div>
                <span className="icon">📊</span>
              </div>
            </div>

            <div className="cancel-table-col">
              <table className="cancel-table-v4">
                <thead><tr><th>Month</th><th>Amount ($)</th><th>Level</th></tr></thead>
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
                      <td>
                        <span className={`badge-v4 ${row.v > 2000 ? '' : 'success'}`} style={row.v > 2000 ? { background: 'rgba(244,63,94,0.1)', color: 'var(--rose)', border: '1px solid rgba(244,63,94,0.2)' } : {}}>
                          {row.v > 3000 ? '⚠ High' : row.v > 1500 ? '↑ Mid' : '✓ Low'}
                        </span>
                      </td>
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

          <div style={{ height: '360px', marginBottom: '40px', background: '#0a0a16', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', color: 'var(--white)', margin: 0 }}>Revenue forecast</h4>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--slate-500)', letterSpacing: '3px', fontWeight: '600', marginBottom: '20px' }}>JUL '26 — JUN '27</div>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'flex-end' }}>
                  {[{ c: '#9049D6', l: 'Operation Target ($)' }, { c: '#D7A423', l: 'Sales Target ($)' }].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.c }}></div>
                      <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>{item.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ height: '220px' }}>
              <Bar
                data={futureChartData}
                options={{
                  ...chartOptions,
                  plugins: { 
                    ...chartOptions.plugins, 
                    legend: { display: false },
                    tooltip: {
                      ...chartOptions.plugins.tooltip,
                      backgroundColor: 'rgba(10, 10, 22, 0.95)',
                      borderColor: 'rgba(34, 211, 238, 0.3)',
                      borderWidth: 1,
                      titleColor: '#fff',
                      bodyColor: '#94a3b8',
                      callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: $${ctx.raw.toLocaleString()}`
                      }
                    }
                  },
                  scales: {
                    x: { stacked: false, grid: { display: false }, ticks: { color: '#64748b', font: { size: 10, family: 'Plus Jakarta Sans' } } },
                    y: { stacked: false, grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false }, ticks: { color: '#64748b', font: { size: 10, family: 'Plus Jakarta Sans' }, callback: v => '$' + (v/1000) + 'K' } }
                  }
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '40px', paddingTop: '10px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '48px', fontWeight: '800', letterSpacing: '-2px', color: 'var(--white)', marginBottom: '10px', lineHeight: '1.1' }}>
              8 Pillars of Growth
              <em style={{ fontStyle: 'normal', display: 'block', fontSize: '30px', fontWeight: '600', letterSpacing: '-1px', background: 'linear-gradient(to right, var(--accent), var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Strategic Plan 2026 — 2027
              </em>
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--slate-500)', lineHeight: '1.7', maxWidth: '600px', marginTop: '12px' }}>
              Eight key pillars driving our next fiscal year — from sales excellence and retention to B2B expansion and AI-driven search integration.
            </p>
          </div>

          <div className="repeat-grid-v4">
            {[
              { n: "01", t: "Sales Improvement", c: "#3b82f6", cBg: "rgba(59, 130, 246, 0.2)", d: "Hiring qualified, skilled sales members and providing intensive SEO & SMM training to build a high-performing team capable of consistent lead generation and higher conversion rates." },
              { n: "02", t: "Repeat Order ↗", c: "#10b981", cBg: "rgba(16, 185, 129, 0.2)", d: "A dedicated team will focus entirely on client retention and repeat orders. Our primary target is to achieve 30–40% repeat order rate, maximizing Lifetime Value (LTV) and ensuring consistent recurring revenue." },
              { n: "03", t: "Query Tracker ↗", c: "#f59e0b", cBg: "rgba(245, 158, 11, 0.2)", d: "Our custom-built Query Tracker system gives full visibility into every client query — identifying why orders are slowing down, what issues are unresolved, and providing clear solutions. Sales members can use this data directly to address concerns and confidently close more orders." },
              { n: "04", t: "B2B Expansion", c: "#9b5de5", cBg: "rgba(155, 93, 229, 0.2)", d: "Actively converting high-potential clients into long-term B2B partnerships. We are consistently working to grow our B2B client base, ensuring more stable, high-value accounts and increasing the total number of clients month over month." },
              { n: "05", t: "SMM Integration", c: "#e5534b", cBg: "rgba(229, 83, 75, 0.2)", d: "To achieve our monthly targets, we have launched a dedicated SMM service line. This addition allows us to capture new client segments and is projected to contribute 30–45% towards hitting our overall delivery targets each month." },
              { n: "06", t: "CMS Management", c: "#06b6d4", cBg: "rgba(6, 182, 212, 0.2)", d: "Offering end-to-end CMS handling (WordPress, Shopify) alongside SEO efforts. This service is expected to contribute 5–7% towards our monthly delivery targets." },
              { n: "07", t: "Cross-Sell Strategy", c: "#f472b6", cBg: "rgba(244, 114, 182, 0.2)", d: "Leveraging all existing service lines to cross-sell SEO and SMM packages. Every client interaction is treated as an opportunity to expand our engagement and drive higher average order value." },
              { n: "08", t: "Alternative Services", c: "#22d3ee", cBg: "rgba(34, 211, 238, 0.2)", d: "Capturing new market segments by launching high-demand alternative services, specifically Contextual Backlinks and E-commerce SEO, providing more entry points for potential clients." }
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

          <div className="fin-table-wrap-v4">
            <table className="fin-table-v4">
              <thead>
                <tr>
                  {['Month', 'SEO ($)', 'SMM ($)', 'CMS ($)', 'Op. Total', 'Sales Target', 'Members'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { m: "Jul '26", op: 31000, sales: 48000, smm: 3000, cms: 1000, ops_m: 28, smm_m: 7 },
                  { m: "Aug '26", op: 30800, sales: 48000, smm: 3000, cms: 1200, ops_m: 28, smm_m: 7 },
                  { m: "Sep '26", op: 31800, sales: 52000, smm: 3000, cms: 1200, ops_m: 28, smm_m: 7 },
                  { m: "Oct '26", op: 33500, sales: 55000, smm: 3000, cms: 1500, ops_m: 32, smm_m: 10 },
                  { m: "Nov '26", op: 34200, sales: 58000, smm: 4000, cms: 1800, ops_m: 32, smm_m: 10 },
                  { m: "Dec '26", op: 36000, sales: 62000, smm: 4000, cms: 2000, ops_m: 35, smm_m: 10 },
                  { m: "Jan '27", op: 37800, sales: 65000, smm: 5000, cms: 2200, ops_m: 40, smm_m: 10 },
                  { m: "Feb '27", op: 37800, sales: 65000, smm: 6000, cms: 2200, ops_m: 40, smm_m: 10 },
                  { m: "Mar '27", op: 37500, sales: 68000, smm: 6000, cms: 2500, ops_m: 40, smm_m: 10 },
                  { m: "Apr '27", op: 39200, sales: 71000, smm: 7000, cms: 2800, ops_m: 40, smm_m: 12 },
                  { m: "May '27", op: 40000, sales: 73000, smm: 9000, cms: 3000, ops_m: 42, smm_m: 12 },
                  { m: "Jun '27", op: 42000, sales: 75000, smm: 10000, cms: 3000, ops_m: 42, smm_m: 12 },
                ].map((row, i) => {
                  const opTotal = row.op + row.smm + row.cms;
                  const totalMembers = row.ops_m + row.smm_m;
                  return (
                    <tr key={i}>
                      <td className="money">{row.m}</td>
                      <td className="teal">${row.op.toLocaleString()}</td>
                      <td>${row.smm.toLocaleString()}</td>
                      <td>${row.cms.toLocaleString()}</td>
                      <td style={{ color: '#fff', fontWeight: '800' }}>${opTotal.toLocaleString()}</td>
                      <td style={{ color: 'var(--secondary)' }}>${row.sales.toLocaleString()}</td>
                      <td>
                        <span style={{ color: 'var(--white)', fontWeight: '700', fontFamily: 'var(--font-display)' }}>{row.ops_m}</span>
                        <span style={{ color: 'var(--slate-500)', margin: '0 4px', fontSize: '11px' }}>+</span>
                        <span style={{ color: 'var(--accent)', fontWeight: '700', fontFamily: 'var(--font-display)' }}>{row.smm_m}</span>
                        <span style={{ color: 'var(--slate-500)', margin: '0 4px', fontSize: '11px' }}>=</span>
                        <span className="badge-v4 success" style={{ marginLeft: '2px' }}>{totalMembers}</span>
                      </td>
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
               <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent)', boxShadow: '0 0 20px var(--accent)' }}></div>
               <div style={{ fontSize: '22px', fontFamily: 'var(--font-display)', color: 'var(--accent)', letterSpacing: '1px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '30px' }}>Plan A: Jul – Sep</div>
               
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
                    <div style={{ fontSize: '9px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginTop: '4px' }}>SEO Anchor</div>
                  </div>
                </div>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { l: 'SEO Operations', v: '60%', c: 'var(--accent)' },
                    { l: 'SMM Integration', v: '30%', c: 'var(--rose)' },
                    { l: 'CMS Handling', v: '10%', c: 'var(--primary)' }
                  ].map((s, i) => (


                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '1px', background: s.c }}></div>
                        <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>{s.l}</span>
                      </div>
                      {s.l !== 'Alternative Services' && (
                        <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--white)', fontFamily: 'var(--font-display)' }}>{s.v}</span>
                      )}
                    </div>
                  ))}
               </div>
            </div>

            {/* PLAN B: VISUAL INFOGRAPHIC */}
            <div style={{ background: 'linear-gradient(145deg, var(--navy2), var(--navy))', border: '1px solid var(--border)', borderRadius: '8px', padding: '35px 25px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
               <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--secondary)', boxShadow: '0 0 20px var(--secondary)' }}></div>
               <div style={{ fontSize: '22px', fontFamily: 'var(--font-display)', color: 'var(--secondary)', letterSpacing: '1px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '30px' }}>Plan B: Oct – Dec</div>
               
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
                      50%
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginTop: '4px' }}>SEO Anchor</div>
                  </div>
                </div>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { l: 'SEO Operations', v: '50%', c: '#10b981' },
                    { l: 'SMM Integration', v: '40%', c: '#ef4444' },
                    { l: 'CMS Handling', v: '10%', c: '#3b82f6' },
                    { l: 'Alternative Services', c: 'var(--indigo)' }
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '1px', background: s.c }}></div>
                        <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>{s.l}</span>
                      </div>
                      {s.l !== 'Alternative Services' && s.v && (
                        <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--white)', fontFamily: 'var(--font-display)' }}>{s.v}</span>
                      )}
                    </div>
                  ))}

               </div>
            </div>

            {/* PLAN C: VISUAL INFOGRAPHIC */}
            <div style={{ background: 'linear-gradient(145deg, var(--navy2), var(--navy))', border: '1px solid var(--border)', borderRadius: '8px', padding: '35px 25px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
               <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)', boxShadow: '0 0 20px var(--primary)' }}></div>
               <div style={{ fontSize: '22px', fontFamily: 'var(--font-display)', color: 'var(--primary)', letterSpacing: '1px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '30px' }}>Plan C: Jan – Mar</div>
               
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
                      45%
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginTop: '4px' }}>SEO Anchor</div>
                  </div>
                </div>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { l: 'SEO Operations', v: '45%', c: '#10b981' },
                    { l: 'SMM Integration', v: '45%', c: '#ef4444' },
                    { l: 'CMS Handling', v: '10%', c: '#3b82f6' },
                    { l: 'Alternative Services', c: 'var(--indigo)' }
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '1px', background: s.c }}></div>
                        <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>{s.l}</span>
                      </div>
                      {s.l !== 'Alternative Services' && s.v && (
                        <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--white)', fontFamily: 'var(--font-display)' }}>{s.v}</span>
                      )}
                    </div>
                  ))}

               </div>
            </div>

            {/* SUMMARY BOX */}
            <div style={{ gridColumn: 'span 3', background: 'linear-gradient(90deg, var(--navy3), var(--navy2))', border: '1px solid var(--border)', borderRadius: '8px', padding: '35px', display: 'flex', alignItems: 'center', gap: '35px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '48px', filter: 'drop-shadow(0 0 10px var(--accent))' }}>🚀</div>
              <div>
                <h4 style={{ color: 'var(--accent)', fontSize: '18px', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Strategic Readiness</h4>
                <p style={{ fontSize: '14px', color: 'var(--slate-400)', margin: 0, lineHeight: '1.6' }}>
                  This combined framework (A+B+C) ensures that our operations remain resilient while scaling toward our <strong>$55,000 monthly delivery</strong> and <strong>$75,000 monthly sales</strong> targets by June 2027.
                </p>
              </div>
            </div>
          </div>
        </section>






        {/* SECTION: THANK YOU */}
        <section className="thank-you-section reveal">
          <div className="ty-grid"></div>
          <div className="ty-content">
            <div className="ty-eyebrow">A Message of Gratitude</div>
            <h2 className="ty-h1">Thank <em>You</em></h2>
            <p className="ty-sub">Success is never a solo journey. This progress is the result of every team member's hard work, every leader's dedication, and our collective commitment to excellence.</p>
            <div className="ty-footer">
              <div className="ty-signature">
                <span className="name">SEO & SMM Team</span>
              </div>
              <div className="ty-motto">"Excellence is not an act, but a habit."</div>
            </div>
          </div>
        </section>

      </main>


      <footer className="footer-v4">
        <span>SEO Operations Team · 2025–2026</span>
        <span>INTERNAL USE ONLY</span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        :root {
          --navy: #030308; 
          --navy2: #09091b; 
          --navy3: #14142b;
          --accent: #22d3ee; 
          --accent-hover: #0891b2;
          --primary: #a855f7;
          --secondary: #fbbf24;
          --rose: #f43f5e;
          --indigo: #6366f1;
          --slate-400: #94a3b8;
          --slate-500: #64748b;
          --white: #f8fafc;
          --border: rgba(255, 255, 255, 0.06);
          --glass: rgba(9, 9, 27, 0.75);
          --font-display: 'Outfit', sans-serif;
          --font-body: 'Plus Jakarta Sans', sans-serif;
        }

        .kpi-presentation-v4 { 
          background: #020205;
          background-image: 
            radial-gradient(at 0% 0%, rgba(168, 85, 247, 0.12) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(34, 211, 238, 0.12) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.12) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(34, 211, 238, 0.12) 0px, transparent 50%);
          color: var(--white); 
          font-family: var(--font-body); 
          min-height: 100vh; 
          position: relative; 
          overflow-x: hidden; 
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(60px, -80px) scale(1.15); }
          50% { transform: translate(-40px, 40px) scale(0.9); }
          75% { transform: translate(40px, 60px) scale(1.05); }
        }

        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-20px, 20px) rotate(5deg); }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; filter: blur(2px) brightness(1); }
          50% { opacity: 1; filter: blur(6px) brightness(1.5); }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes glint {
          0% { left: -100%; }
          100% { left: 200%; }
        }

        .blob { position: fixed; filter: blur(140px); z-index: 0; opacity: 0.12; pointer-events: none; animation: float 25s infinite alternate ease-in-out; }
        .b1 { width: 1000px; height: 1000px; background: var(--primary); top: -400px; right: -400px; animation-delay: -2s; }
        .b2 { width: 900px; height: 900px; background: var(--accent); bottom: -400px; left: -400px; animation-delay: -5s; }
        .b3 { width: 600px; height: 600px; background: var(--indigo); top: 30%; right: 10%; opacity: 0.05; animation-duration: 30s; animation-delay: -8s; }
        .b4 { width: 400px; height: 400px; background: var(--rose); bottom: 20%; right: 20%; opacity: 0.03; animation-duration: 20s; }

        /* REVEAL SYSTEM */
        .reveal { opacity: 0; transform: translateY(60px) scale(0.98); transition: 1.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal.in { opacity: 1; transform: translateY(0) scale(1); }

        .reveal-stagger > * { opacity: 0; transform: translateY(40px); transition: 1.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal-stagger > *.in { opacity: 1; transform: translateY(0); }

        /* REVEAL SYSTEM */
        .reveal { opacity: 0; transform: translateY(40px); transition: 1.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal.in { opacity: 1; transform: translateY(0); }

        .reveal-stagger > * { opacity: 0; transform: translateY(30px); transition: 1s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal-stagger > *.in { opacity: 1; transform: translateY(0); }
        .reveal-stagger > *:nth-child(1) { transition-delay: 0.1s; }
        .reveal-stagger > *:nth-child(2) { transition-delay: 0.2s; }
        .reveal-stagger > *:nth-child(3) { transition-delay: 0.3s; }
        .reveal-stagger > *:nth-child(4) { transition-delay: 0.4s; }
        .reveal-stagger > *:nth-child(5) { transition-delay: 0.5s; }
        .reveal-stagger > *:nth-child(6) { transition-delay: 0.6s; }

        .report-actions-v4 { position: fixed; top: 80px; right: 40px; display: flex; gap: 10px; z-index: 1000; animation: fadeIn 1s 1s backwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .btn-v4 { background: var(--glass); backdrop-filter: blur(8px); border: 1px solid var(--border); padding: 10px 18px; border-radius: 8px; font-size: 10px; font-weight: 800; color: var(--white); cursor: pointer; text-decoration: none; transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1); letter-spacing: 1px; }
        .btn-v4:hover { border-color: var(--accent); color: var(--accent); transform: translateY(-3px); box-shadow: 0 10px 20px rgba(34, 211, 238, 0.1); }

        .report-container-v4 { max-width: 1200px; margin: 0 auto; padding: 0 40px; position: relative; z-index: 10; }
        .section-v4 { padding: 100px 0; border-bottom: 1px solid var(--border); }

        /* HERO V4 */
        .hero-section-v4 { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; position: relative; padding: 100px 0; }
        .hero-grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse 80% 80% at 80% 20%, black, transparent); pointer-events: none; }
        .hero-eyebrow { font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: var(--accent); margin-bottom: 28px; display: flex; align-items: center; gap: 12px; font-family: var(--font-display); }
        .hero-eyebrow span { width: 40px; height: 1px; background: var(--accent); }
        .hero-h1 { font-family: var(--font-display); font-size: 110px; font-weight: 800; line-height: 0.9; letter-spacing: -5px; margin-bottom: 25px; color: var(--white); animation: slideUpFade 1.2s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
        .hero-h1 em { 
          font-style: normal; 
          display: block; 
          background: linear-gradient(to right, #fff 20%, var(--accent)); 
          -webkit-background-clip: text; 
          -webkit-text-fill-color: transparent; 
          filter: drop-shadow(0 0 20px rgba(34, 211, 238, 0.2));
          animation: slideUpFade 1.2s 0.2s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }
        .hero-sub { max-width: 500px; font-size: 18px; color: var(--slate-400); line-height: 1.6; margin-bottom: 20px; animation: slideUpFade 1.2s 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
        .hero-meta { font-size: 14px; color: var(--slate-500); margin-bottom: 60px; animation: slideUpFade 1.2s 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
        .hero-meta strong { color: var(--white); }

        .hero-kpis-v4 { display: flex; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: var(--glass); backdrop-filter: blur(12px); box-shadow: 0 20px 50px rgba(0,0,0,0.3); animation: slideUpFade 1.2s 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
        .kpi-card-v4 { padding: 30px 40px; border-right: 1px solid var(--border); position: relative; flex: 1; transition: 0.6s cubic-bezier(0.16, 1, 0.3, 1); overflow: hidden; }
        .kpi-card-v4:hover { background: rgba(255,255,255,0.03); transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.4); }
        .kpi-card-v4::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); transform: skewX(-25deg); transition: 0s; }
        .kpi-card-v4:hover::after { animation: glint 0.8s ease-in-out; }
        .kpi-card-v4::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; transform: scaleX(0); transition: 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .kpi-card-v4.in::before { transform: scaleX(1); }
        .kpi-card-v4.teal::before { background: var(--accent); }
        .kpi-card-v4.gold::before { background: var(--secondary); }
        .kpi-card-v4.purple::before { background: var(--indigo); }
        .kpi-card-v4.blue::before { background: var(--primary); }
        .kpi-val { font-family: var(--font-display); font-size: 42px; font-weight: 800; line-height: 1; margin-bottom: 10px; }
        .kpi-card-v4.teal .kpi-val { color: var(--accent); text-shadow: 0 0 20px rgba(34, 211, 238, 0.4); }
        .kpi-card-v4.gold .kpi-val { color: var(--secondary); text-shadow: 0 0 20px rgba(251, 191, 36, 0.4); }
        .kpi-card-v4.purple .kpi-val { color: var(--indigo); text-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
        .kpi-card-v4.blue .kpi-val { color: var(--primary); text-shadow: 0 0 20px rgba(168, 85, 247, 0.4); }
        .kpi-lbl { font-size: 11px; color: var(--slate-500); text-transform: uppercase; letter-spacing: 2px; font-weight: 600; }

        /* SECTION HEADERS */
        .section-tag {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
          background: linear-gradient(135deg, rgba(34, 211, 238, 0.12), rgba(168, 85, 247, 0.12));
          border: 1px solid rgba(34, 211, 238, 0.35);
          border-radius: 50px;
          padding: 9px 22px;
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.15), inset 0 0 20px rgba(34, 211, 238, 0.04);
          font-family: var(--font-display);
          font-size: 11px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: var(--accent);
          font-weight: 800;
        }
        .section-tag span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          display: inline-block;
          box-shadow: 0 0 10px var(--accent);
          animation: pulse-glow 2s infinite;
          flex-shrink: 0;
        }
        .kpi-presentation-v4 h2 { font-family: var(--font-display); font-size: 56px; font-weight: 800; letter-spacing: -2px; margin-bottom: 24px; color: var(--white); }
        .section-desc { font-size: 16px; color: var(--slate-500); max-width: 650px; margin-bottom: 60px; line-height: 1.8; }

        /* CHALLENGE TABLE V4 */
        .challenge-table-v4 { width: 100%; border-collapse: separate; border-spacing: 0 12px; }
        .challenge-table-v4 th { text-align: left; padding: 15px 20px; color: var(--accent); font-family: var(--font-display); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; background: rgba(255,255,255,0.02); border-radius: 8px 8px 0 0; }
        .challenge-table-v4 td { padding: 25px 20px; background: var(--glass); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); font-size: 14px; color: var(--slate-400); line-height: 1.6; vertical-align: middle; }
        .challenge-table-v4 td:first-child { border-left: 1px solid var(--border); border-radius: 12px 0 0 12px; font-family: var(--font-display); font-size: 28px; font-weight: 800; color: var(--accent); width: 80px; text-align: center; }
        .challenge-table-v4 td:last-child { border-right: 1px solid var(--border); border-radius: 0 12px 12px 0; }
        .challenge-table-v4 tr:hover td { border-color: rgba(34, 211, 238, 0.3); background: rgba(255,255,255,0.03); }
        .challenge-table-v4 td:nth-child(2) { font-weight: 700; color: var(--white); width: 300px; font-size: 16px; }
        .sales-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .chip { padding: 4px 12px; background: rgba(255,255,255,0.05); border-radius: 6px; font-size: 11px; font-weight: 700; color: var(--slate-400); border: 1px solid transparent; }
        .chip.high { color: var(--accent); background: rgba(34, 211, 238, 0.1); border-color: rgba(34, 211, 238, 0.2); }
        .chip.low { color: var(--rose); background: rgba(244, 63, 94, 0.1); border-color: rgba(244, 63, 94, 0.2); }

        /* SERVICES V4 */
        .services-compare-v4 { display: grid; grid-template-columns: 1fr 60px 1fr; border: 1px solid var(--border); background: var(--glass); backdrop-filter: blur(12px); border-radius: 12px; overflow: hidden; }
        .svc-col { padding: 40px; }
        .svc-old { border-right: 1px solid var(--border); }
        .svc-arrow { display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.02); }
        .svc-arrow-inner { width: 36px; height: 36px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
        .svc-col-head { font-family: var(--font-display); font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: var(--slate-500); margin-bottom: 30px; }
        .svc-new .svc-col-head { color: var(--accent); }
        .svc-row { display: flex; gap: 20px; margin-bottom: 30px; }
        .svc-icon { width: 44px; height: 44px; background: rgba(255,255,255,0.05); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .svc-new .svc-icon { background: rgba(16, 185, 129, 0.15); color: var(--accent); }
        .svc-row h4 { font-family: var(--font-display); font-size: 18px; margin-bottom: 4px; }
        .svc-row p { font-size: 13px; color: var(--slate-400); line-height: 1.5; }

        /* TRAINING V4 */
        .training-shifts-v4 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 60px; }
        .shift-card-v4 { padding: 30px; border: 1px solid var(--border); border-radius: 12px; position: relative; background: var(--glass); backdrop-filter: blur(12px); transition: 0.6s cubic-bezier(0.16, 1, 0.3, 1); overflow: hidden; }
        .shift-card-v4:hover { transform: translateY(-8px) scale(1.02); border-color: rgba(255,255,255,0.2); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .shift-card-v4::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); transform: skewX(-25deg); }
        .shift-card-v4:hover::after { animation: glint 0.8s ease-in-out; }
        .shift-card-v4::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; border-radius: 12px 12px 0 0; }
        .shift-card-v4.gold::before { background: var(--secondary); }
        .shift-card-v4.blue::before { background: var(--primary); }
        .shift-card-v4.purple::before { background: var(--indigo); }
        .shift-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 15px; }
        .shift-card-v4.gold .shift-badge { background: rgba(245, 158, 11, 0.1); color: var(--secondary); }
        .shift-card-v4.blue .shift-badge { background: rgba(99, 102, 241, 0.1); color: var(--primary); }
        .shift-card-v4.purple .shift-badge { background: rgba(129, 140, 248, 0.1); color: var(--indigo); }
        .shift-card-v4 h4 { font-family: var(--font-display); font-size: 18px; margin-bottom: 8px; }
        .shift-meta { font-size: 13px; color: var(--slate-500); margin-bottom: 4px; }
        .shift-meta strong { color: var(--accent); }

        .plan-grid-v4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .plan-card-v4 { background: var(--glass); border: 1px solid var(--border); padding: 25px; border-radius: 12px; transition: 0.6s cubic-bezier(0.16, 1, 0.3, 1); position: relative; overflow: hidden; }
        .plan-card-v4:hover { background: rgba(255,255,255,0.04); transform: translateY(-5px); border-color: var(--accent); }
        .plan-card-v4::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); transform: skewX(-25deg); }
        .plan-card-v4:hover::after { animation: glint 0.8s ease-in-out; }
        .plan-card-v4.full { grid-column: span 2; }
        .plan-day-v4 { font-family: var(--font-display); font-size: 11px; font-weight: 800; color: var(--accent); margin-bottom: 12px; letter-spacing: 1px; }
        .plan-card-v4 h4 { font-size: 15px; font-weight: 700; margin-bottom: 12px; color: var(--white); }
        .plan-topics-v4 { list-style: none; padding: 0; }
        .plan-topics-v4 li { font-size: 12px; color: var(--slate-400); padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .plan-topics-v4 li:last-child { border: none; }

        /* REPEAT V4 */
        .repeat-grid-v4 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .repeat-card-v4 { padding: 40px; background: var(--glass); border: 1px solid var(--border); border-radius: 12px; display: flex; gap: 30px; align-items: flex-start; transition: 0.6s cubic-bezier(0.16, 1, 0.3, 1); position: relative; overflow: hidden; }
        .repeat-card-v4:hover { border-color: rgba(34, 211, 238, 0.4); transform: translateY(-10px) scale(1.02); box-shadow: 0 25px 50px rgba(0,0,0,0.5); background: rgba(255,255,255,0.03); }
        .repeat-card-v4::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent); transform: skewX(-25deg); }
        .repeat-card-v4:hover::after { animation: glint 0.8s ease-in-out; }
        .repeat-num-v4 { font-family: var(--font-display); font-size: 64px; font-weight: 800; color: rgba(34, 211, 238, 0.1); line-height: 0.8; }
        .repeat-card-v4 h4 { font-family: var(--font-display); font-size: 22px; color: var(--accent); margin-bottom: 12px; }
        .repeat-card-v4 p { font-size: 15px; color: var(--slate-400); line-height: 1.7; }

        /* CANCEL V4 */
        .cancel-layout-v4 { display: grid; grid-template-columns: 350px 1fr; gap: 50px; }
        .sum-card-v4 { padding: 30px; border-radius: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border); background: var(--glass); backdrop-filter: blur(12px); }
        .sum-card-v4.delivery { border-color: rgba(16, 185, 129, 0.2); }
        .sum-card-v4.total-cancel { border-color: rgba(244, 63, 94, 0.2); }
        .sum-card-v4.pct { border-color: rgba(245, 158, 11, 0.2); }
        .sum-card-v4 .lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--slate-500); margin-bottom: 8px; }
        .sum-card-v4 .val { font-family: var(--font-display); font-size: 32px; font-weight: 800; line-height: 1; }
        .sum-card-v4.delivery .val { color: var(--accent); }
        .sum-card-v4.total-cancel .val { color: var(--rose); }
        .sum-card-v4.pct .val { color: var(--secondary); }
        .sum-card-v4 .icon { font-size: 32px; opacity: 0.3; }

        .cancel-table-v4 { width: 100%; border-collapse: collapse; }
        .cancel-table-v4 th { text-align: left; padding: 12px 16px; border-bottom: 2px solid var(--accent); color: var(--accent); font-family: var(--font-display); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; }
        .cancel-table-v4 td { padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 14px; color: var(--slate-400); }
        .cancel-table-v4 td.amt { font-weight: 700; color: var(--white); }
        .cancel-table-v4 td.high-cancel { color: var(--rose); }
        .cancel-table-v4 td.low-cancel { color: var(--accent); }

        /* FINANCIAL V4 */
        .fin-table-wrap-v4 { overflow-x: auto; background: var(--glass); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: 12px; padding: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .fin-table-v4 { width: 100%; border-collapse: collapse; }
        .fin-table-v4 th { padding: 15px 20px; color: var(--accent); text-transform: uppercase; letter-spacing: 2px; font-size: 10px; border-bottom: 2px solid rgba(34, 211, 238, 0.2); text-align: left; }
        .fin-table-v4 tr { transition: 0.3s; }
        .fin-table-v4 tr:hover { background: rgba(255,255,255,0.03); }
        .fin-table-v4 td { padding: 15px 20px; border-bottom: 1px solid var(--border); font-size: 13px; color: var(--slate-400); font-weight: 500; }
        .fin-table-v4 td.money { font-weight: 800; color: var(--white); font-family: var(--font-display); font-size: 14px; }
        .fin-table-v4 td.teal { color: var(--accent); font-weight: 800; }
        .fin-table-v4 td.red { color: var(--rose); font-weight: 800; }
        .badge-v4 { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge-v4.success { background: rgba(34, 211, 238, 0.1); color: var(--accent); border: 1px solid rgba(34, 211, 238, 0.2); }
        .badge-v4.warning { background: rgba(251, 191, 36, 0.1); color: var(--secondary); border: 1px solid rgba(251, 191, 36, 0.2); }

        .footer-v4 { padding: 60px 0; display: flex; justify-content: space-between; font-size: 11px; letter-spacing: 2px; color: var(--gray); border-top: 1px solid var(--border); }



        @media (max-width: 900px) {
          .hero-h1 { font-size: 60px; }
          .hero-kpis-v4 { flex-direction: column; }
          .training-shifts-v4, .plan-grid-v4, .repeat-grid-v4, .cancel-layout-v4 { grid-template-columns: 1fr; }
          .services-compare-v4 { grid-template-columns: 1fr; }
          .svc-arrow { display: none; }
        }

        /* THANK YOU SECTION */
        .thank-you-section { padding: 150px 0; position: relative; text-align: center; border-bottom: none; background: rgba(168, 85, 247, 0.03); }
        .ty-grid { position: absolute; inset: 0; background-image: radial-gradient(var(--accent) 1px, transparent 1px); background-size: 40px 40px; opacity: 0.1; mask-image: radial-gradient(circle at center, black, transparent); }
        .ty-content { position: relative; z-index: 10; max-width: 800px; margin: 0 auto; }
        .ty-eyebrow { font-family: var(--font-display); font-size: 11px; letter-spacing: 5px; text-transform: uppercase; color: var(--accent); margin-bottom: 30px; }
        .ty-h1 { font-family: var(--font-display); font-size: 140px; font-weight: 800; line-height: 0.9; letter-spacing: -8px; margin-bottom: 40px; color: var(--white); }
        .ty-h1 em { 
          font-style: normal; 
          position: relative; 
          background: linear-gradient(to right, #fff 20%, var(--accent)); 
          -webkit-background-clip: text; 
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 40px rgba(34, 211, 238, 0.4)); 
        }
        .ty-h1 em::after { content: ''; position: absolute; bottom: 20px; left: 0; width: 100%; height: 12px; background: rgba(34, 211, 238, 0.15); z-index: -1; }
        .ty-sub { font-size: 20px; color: var(--slate-400); line-height: 1.8; margin-bottom: 60px; font-weight: 500; }
        .ty-footer { display: flex; flex-direction: column; align-items: center; gap: 30px; }
        .ty-signature { display: flex; flex-direction: column; align-items: center; }
        .ty-signature .name { font-family: var(--font-display); font-size: 24px; color: var(--white); font-weight: 700; margin-bottom: 4px; }
        .ty-signature .title { font-size: 12px; color: var(--accent); letter-spacing: 2px; text-transform: uppercase; font-weight: 800; }
        .ty-motto { font-size: 16px; font-style: italic; color: var(--slate-400); opacity: 0.7; font-family: var(--font-sans); }

        @media (max-width: 900px) {
          .ty-h1 { font-size: 80px; letter-spacing: -3px; }
          .ty-sub { font-size: 16px; }
        }

      `}</style>

    </div>
  );
}

export default KpiReports;
