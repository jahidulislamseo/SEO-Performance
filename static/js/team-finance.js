/* ── Team Finance Dashboard ────────────────────────────────── */

// ── Helpers ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const usd  = v => v === 0 ? '—' : '$' + v.toLocaleString();
const usdF = v => '$' + v.toLocaleString();
const sum  = arr => arr.reduce((a, b) => a + b, 0);
const sumIdx = (arr, idx) => idx.reduce((a, i) => a + (arr[i] || 0), 0);

const QUARTERS = { q1:[0,1,2], q2:[3,4,5], q3:[6,7,8], q4:[9,10,11] };
const STAR_IDX = [5, 8, 9];       // Dec '26, Mar '27, Apr '27
const STAR_CLS = ['sh-dec','sh-mar','sh-apr'];

const Q_COLORS = {
    q1: { bg:'rgba(59,130,246,.08)',  text:'#93C5FD', border:'rgba(59,130,246,.3)'  },
    q2: { bg:'rgba(236,72,153,.08)',  text:'#F9A8D4', border:'rgba(236,72,153,.3)'  },
    q3: { bg:'rgba(20,184,166,.08)',  text:'#5EEAD4', border:'rgba(20,184,166,.3)'  },
    q4: { bg:'rgba(139,92,246,.08)',  text:'#C4B5FD', border:'rgba(139,92,246,.3)'  },
};
const Q_LABELS = ['Q1','Q2','Q3','Q4'];
const Q_RANGES = [
    'Jul – Sep \'26', 'Oct – Dec \'26', 'Jan – Mar \'27', 'Apr – Jun \'27'
];

// ── State ─────────────────────────────────────────────────────
const state = { tab: 'dashboard', quarter: 'all', data: null, charts: {} };

function destroyChart(id) {
    if (state.charts[id]) { state.charts[id].destroy(); delete state.charts[id]; }
}

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res  = await fetch('/api/finance');
        state.data = await res.json();
    } catch (e) {
        state.data = FALLBACK_DATA;
    }
    setupNav();
    setupTabs();
    setupFilter();
    setupExport();
    render();
});

function render() {
    renderNavStats();
    renderDashboard();
    renderComparison();
    renderKPI();
}

// ── Nav stats ─────────────────────────────────────────────────
function renderNavStats() {
    const d = state.data;
    const totalRev = d.teams.reduce((a, t) => a + sum(t.profiles.flatMap(p => p.monthly)), 0);
    const totalBudget = d.teams.reduce((a, t) => a + sum(t.manpower.sp_budget), 0);
    $('nav-stats').innerHTML = `
        <div class="nav-kv">
            <span class="nav-kv-label">Total Revenue</span>
            <span class="nav-kv-val green">${usdF(totalRev)}</span>
        </div>
        <div class="nav-kv">
            <span class="nav-kv-label">SP Budget</span>
            <span class="nav-kv-val purple">${usdF(totalBudget)}</span>
        </div>
        <div class="nav-kv">
            <span class="nav-kv-label">Teams</span>
            <span class="nav-kv-val white">${d.teams.length}</span>
        </div>`;
}

// ── Tab switching ─────────────────────────────────────────────
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            state.tab = tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tab}`));
            $('qfilter').style.display = tab === 'dashboard' ? 'flex' : 'none';
        });
    });
}

function setupNav() { $('qfilter').style.display = 'flex'; }

// ── Quarter filter ────────────────────────────────────────────
function setupFilter() {
    document.querySelectorAll('.qbtn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.quarter = btn.dataset.q;
            document.querySelectorAll('.qbtn').forEach(b => b.classList.toggle('active', b.dataset.q === state.quarter));
            renderDashboard();
        });
    });
}

// ── Export / Print ────────────────────────────────────────────
function setupExport() {
    const btn = $('exportBtn');
    if (btn) btn.addEventListener('click', () => window.print());
}

// ═══════════════════════════════════════
// DASHBOARD TAB (Spreadsheet Style)
// ═══════════════════════════════════════
function renderDashboard() {
    const root   = $('dashboard-root');
    const teams  = state.data.teams;
    root.innerHTML = buildSpreadsheetDashboard(teams);
}

function buildSpreadsheetDashboard(teams) {
    const monthLabels = [
        "Jul. 2026", "Aug. 2026", "Sep. 2026",
        "Oct. 2026", "Nov. 2026", "Dec. 2026",
        "Jan. 2027", "Feb. 2027", "Mar. 2027",
        "Apr. 2027", "May. 2027", "Jun. 2027"
    ];

    let html = '';
    teams.forEach(team => {
        const isSmm = team.id === 'smm';
        
        let theadHTML = `<tr>
            <th class="ss-sl">Sl</th>
            <th class="ss-name">Profile Name</th>
            <th class="ss-type">Particulars</th>`;
        
        monthLabels.forEach((m, i) => {
            theadHTML += `<th>${m}</th>`;
            if (i === 2) theadHTML += `<th class="ss-q ss-q1">Q1</th>`;
            else if (i === 5) theadHTML += `<th class="ss-q ss-q2">Q2</th>`;
            else if (i === 8) theadHTML += `<th class="ss-q ss-q3">Q3</th>`;
            else if (i === 11) theadHTML += `<th class="ss-q ss-q4">Q4</th>`;
        });
        theadHTML += `<th class="ss-total">Total</th></tr>`;

        let tbodyHTML = team.profiles.map(p => {
            const qVals = [
                sumIdx(p.monthly, [0,1,2]),
                sumIdx(p.monthly, [3,4,5]),
                sumIdx(p.monthly, [6,7,8]),
                sumIdx(p.monthly, [9,10,11])
            ];
            const rowTotal = sum(p.monthly);
            
            let pHTML = `<tr>
                <td>${p.sl}</td>
                <td>${p.name}</td>
                <td>${p.type}</td>`;
            
            p.monthly.forEach((v, i) => {
                pHTML += `<td class="ss-val">${usd(v)}</td>`;
                if (i === 2) pHTML += `<td class="ss-val ss-q ss-q1">${usd(qVals[0])}</td>`;
                else if (i === 5) pHTML += `<td class="ss-val ss-q ss-q2">${usd(qVals[1])}</td>`;
                else if (i === 8) pHTML += `<td class="ss-val ss-q ss-q3">${usd(qVals[2])}</td>`;
                else if (i === 11) pHTML += `<td class="ss-val ss-q ss-q4">${usd(qVals[3])}</td>`;
            });
            pHTML += `<td class="ss-val ss-total">${usd(rowTotal)}</td></tr>`;
            return pHTML;
        }).join('');

        // Total Row
        const teamMonthly = monthLabels.map((_, i) => sum(team.profiles.map(p => p.monthly[i])));
        const teamQVals = [
            sumIdx(teamMonthly, [0,1,2]),
            sumIdx(teamMonthly, [3,4,5]),
            sumIdx(teamMonthly, [6,7,8]),
            sumIdx(teamMonthly, [9,10,11])
        ];
        const teamGrandTotal = sum(teamMonthly);
        
        let tHTML = `<tr class="ss-total-row">
            <td colspan="3" style="text-align:center;">TOTAL</td>`;
        
        teamMonthly.forEach((v, i) => {
            tHTML += `<td class="ss-val">${usd(v)}</td>`;
            if (i === 2) tHTML += `<td class="ss-val ss-q ss-q1">${usd(teamQVals[0])}</td>`;
            else if (i === 5) tHTML += `<td class="ss-val ss-q ss-q2">${usd(teamQVals[1])}</td>`;
            else if (i === 8) tHTML += `<td class="ss-val ss-q ss-q3">${usd(teamQVals[2])}</td>`;
            else if (i === 11) tHTML += `<td class="ss-val ss-q ss-q4">${usd(teamQVals[3])}</td>`;
        });
        tHTML += `<td class="ss-val ss-total">${usd(teamGrandTotal)}</td></tr>`;
        tbodyHTML += tHTML;

        html += `
        <div class="ss-wrapper">
            <div class="ss-header">
                <i class="fa-solid ${isSmm ? 'fa-hashtag' : 'fa-chart-line'}" style="color: #f1c40f; margin-right: 5px;"></i>
                ${team.name.toUpperCase()} TEAM - REVENUE KPI (2026 - 2027)
            </div>
            <div class="ss-table-container">
                <table class="ss-table">
                    <thead>${theadHTML}</thead>
                    <tbody>${tbodyHTML}</tbody>
                </table>
            </div>
        </div>`;
    });

    return html;
}


function starClass(idx) {
    const si = STAR_IDX.indexOf(idx);
    return si >= 0 ? STAR_CLS[si] : '';
}

function shortMonth(label) {
    return label.split(' ')[0]; // "Jul '26" → "Jul"
}

// ── Mini team charts ──────────────────────────────────────────
function initTeamChart(team) {
    const canvas = document.getElementById(`chart-${team.id}`);
    if (!canvas) return;
    destroyChart(`chart-${team.id}`);

    const ctx      = canvas.getContext('2d');
    const months   = state.data.months;
    const revData  = months.map((_, mi) => sum(team.profiles.map(p => p.monthly[mi])));
    const budData  = team.manpower.sp_budget;
    const color    = team.color;

    const c = hexToRgb(team.color);
    const revG = ctx.createLinearGradient(0, 0, 0, 200);
    revG.addColorStop(0, `rgba(${c},0.25)`);
    revG.addColorStop(1, `rgba(${c},0)`);
    const budG = ctx.createLinearGradient(0, 0, 0, 200);
    budG.addColorStop(0, 'rgba(245,158,11,0.15)');
    budG.addColorStop(1, 'rgba(245,158,11,0)');

    state.charts[`chart-${team.id}`] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(shortMonth),
            datasets: [
                {
                    label: 'Revenue',
                    data: revData,
                    borderColor: team.color,
                    backgroundColor: revG,
                    borderWidth: 2,
                    pointBackgroundColor: '#060B14',
                    pointBorderColor: team.color,
                    pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 5,
                    fill: true, tension: 0.4
                },
                {
                    label: 'SP Budget',
                    data: budData,
                    borderColor: '#F59E0B',
                    backgroundColor: budG,
                    borderWidth: 1.5, borderDash: [4,3],
                    pointBackgroundColor: '#060B14',
                    pointBorderColor: '#F59E0B',
                    pointBorderWidth: 1.5, pointRadius: 2, pointHoverRadius: 4,
                    fill: true, tension: 0.4
                }
            ]
        },
        options: chartOpts(Math.max(...revData) * 1.15, v => '$'+(v>=1000?(v/1000)+'k':v))
    });
}

// ── Combined chart (both teams on one canvas) ─────────────────
function initCombinedChart(teams, months) {
    const canvas = document.getElementById('chart-combined');
    if (!canvas) return;
    destroyChart('chart-combined');
    const ctx = canvas.getContext('2d');

    const datasets = teams.map(t => {
        const c    = hexToRgb(t.color);
        const revG = ctx.createLinearGradient(0, 0, 0, 200);
        revG.addColorStop(0, `rgba(${c},0.2)`);
        revG.addColorStop(1, `rgba(${c},0)`);
        return {
            label: t.name,
            data: months.map((_, mi) => sum(t.profiles.map(p => p.monthly[mi]))),
            borderColor: t.color,
            backgroundColor: revG,
            borderWidth: 2,
            pointBackgroundColor: '#060B14',
            pointBorderColor: t.color,
            pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 5,
            fill: true, tension: 0.4
        };
    });

    const allVals = datasets.flatMap(d => d.data);
    state.charts['chart-combined'] = new Chart(ctx, {
        type: 'line',
        data: { labels: months.map(shortMonth), datasets },
        options: {
            ...chartOpts(Math.max(...allVals) * 1.15, v => '$'+(v>=1000?(v/1000)+'k':v), true),
            plugins: {
                ...chartOpts().plugins,
                legend: { display: true, labels: { color:'#94A3B8', font:{size:11}, boxWidth:10 } }
            }
        }
    });
}

// ═══════════════════════════════════════
// COMPARISON TAB
// ═══════════════════════════════════════
function renderComparison() {
    const d = state.data;
    const teams = d.teams;

    // Summary strip
    let strip = '';
    teams.forEach(t => {
        const totalRev = sum(t.profiles.flatMap(p => p.monthly));
        const totalBdg = sum(t.manpower.sp_budget);
        const eff = (totalRev / totalBdg).toFixed(1);
        strip += `<div class="css-card ${t.id}-card">
            <span class="css-label">${t.name}</span>
            <span class="css-val" style="color:${t.color}">${usdF(totalRev)}</span>
            <span class="css-sub">Budget: ${usdF(totalBdg)} · Efficiency: ${eff}×</span>
        </div>`;
    });
    strip += `<div class="css-card">
        <span class="css-label">Combined Revenue</span>
        <span class="css-val" style="color:#F1F5F9">${usdF(teams.reduce((a,t)=>a+sum(t.profiles.flatMap(p=>p.monthly)),0))}</span>
        <span class="css-sub">FY 2026 – 2027</span>
    </div>`;
    $('comp-summary').innerHTML = strip;

    // Chart legends
    const legHTML = teams.map(t => `<span><i class="legend-dot" style="background:${t.color};box-shadow:0 0 5px ${t.color}"></i> ${t.name}</span>`).join('');
    $('comp-rev-legend').innerHTML = legHTML;
    $('kpi-chart-legend') && ($('kpi-chart-legend').innerHTML = legHTML);

    // 1. Combined revenue trend
    destroyChart('compRevChart');
    const months = d.months;
    const compRevDatasets = teams.map(t => {
        const c = hexToRgb(t.color);
        return {
            label: t.name,
            data: months.map((_, mi) => sum(t.profiles.map(p => p.monthly[mi]))),
            borderColor: t.color,
            backgroundColor: `rgba(${c},0.08)`,
            borderWidth: 2.5,
            pointBackgroundColor: '#060B14',
            pointBorderColor: t.color,
            pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 5,
            fill: true, tension: 0.4
        };
    });
    state.charts['compRevChart'] = new Chart($('compRevChart').getContext('2d'), {
        type: 'line',
        data: { labels: months.map(shortMonth), datasets: compRevDatasets },
        options: chartOpts(null, v => '$'+(v>=1000?(v/1000)+'k':v), true)
    });

    // 2. Quarterly revenue bar
    destroyChart('compQtrChart');
    const qBarData = teams.map(t => ({
        label: t.name,
        data: Q_LABELS.map((_, qi) => sumIdx(t.profiles.flatMap(p => p.monthly), QUARTERS[`q${qi+1}`])),
        backgroundColor: hexToRgba(t.color, 0.7),
        borderColor: t.color,
        borderWidth: 1.5, borderRadius: 5
    }));
    state.charts['compQtrChart'] = new Chart($('compQtrChart').getContext('2d'), {
        type: 'bar',
        data: { labels: Q_LABELS, datasets: qBarData },
        options: {
            ...chartOpts(null, v => '$'+(v>=1000?(v/1000)+'k':v)),
            plugins: { ...chartOpts().plugins, legend: { display:true, labels:{ color:'#64748B', font:{size:11} } } }
        }
    });

    // 3. Budget efficiency (rev/budget per month)
    destroyChart('compEffChart');
    const effDatasets = teams.map(t => {
        const revArr = months.map((_, mi) => sum(t.profiles.map(p => p.monthly[mi])));
        return {
            label: t.name,
            data: months.map((_, mi) => t.manpower.sp_budget[mi] > 0 ? +(revArr[mi]/t.manpower.sp_budget[mi]).toFixed(2) : 0),
            borderColor: t.color, backgroundColor: 'transparent',
            borderWidth: 2, pointBorderColor: t.color, pointBackgroundColor: '#060B14',
            pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 5,
            tension: 0.4
        };
    });
    state.charts['compEffChart'] = new Chart($('compEffChart').getContext('2d'), {
        type: 'line',
        data: { labels: months.map(shortMonth), datasets: effDatasets },
        options: {
            ...chartOpts(null, v => v+'×'),
            plugins: { ...chartOpts().plugins, legend:{ display:true, labels:{ color:'#64748B', font:{size:11} } } }
        }
    });

    // 4. Manpower growth
    destroyChart('compMpChart');
    const mpDatasets = teams.map(t => ({
        label: t.name,
        data: t.manpower.total,
        borderColor: t.color, backgroundColor: 'transparent',
        borderWidth: 2, pointBorderColor: t.color, pointBackgroundColor: '#060B14',
        pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 5,
        tension: 0.4
    }));
    state.charts['compMpChart'] = new Chart($('compMpChart').getContext('2d'), {
        type: 'line',
        data: { labels: months.map(shortMonth), datasets: mpDatasets },
        options: {
            ...chartOpts(null, v => v+' ppl'),
            plugins: { ...chartOpts().plugins, legend:{ display:true, labels:{ color:'#64748B', font:{size:11} } } }
        }
    });

    // 5. KPI comparison
    destroyChart('compKpiChart');
    const kpiDatasets = teams.map(t => ({
        label: t.name,
        data: t.kpi,
        borderColor: t.color, backgroundColor: 'transparent',
        borderWidth: 2, pointBorderColor: t.color, pointBackgroundColor: '#060B14',
        pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 5,
        tension: 0.4
    }));
    state.charts['compKpiChart'] = new Chart($('compKpiChart').getContext('2d'), {
        type: 'line',
        data: { labels: months.map(shortMonth), datasets: kpiDatasets },
        options: {
            ...chartOpts(null, v => '$'+v),
            plugins: { ...chartOpts().plugins, legend:{ display:true, labels:{ color:'#64748B', font:{size:11} } } }
        }
    });

    // Comparison table
    const tblHTML = buildComparisonTable(teams);
    $('comp-table').innerHTML = tblHTML;
}

function buildComparisonTable(teams) {
    const rows = [
        { label:'Revenue', fn: t => sum(t.profiles.flatMap(p => p.monthly)), fmt: usdF },
        { label:'SP Budget', fn: t => sum(t.manpower.sp_budget), fmt: usdF },
        { label:'Efficiency (Rev/Budget)', fn: t => (sum(t.profiles.flatMap(p=>p.monthly))/sum(t.manpower.sp_budget)).toFixed(1)+'×', fmt: v=>v },
        { label:'Peak KPI/Manpower', fn: t => '$'+Math.max(...t.kpi), fmt: v=>v },
        { label:'Manpower Start', fn: t => t.manpower.total[0]+' ppl', fmt: v=>v },
        { label:'Manpower End', fn: t => t.manpower.total[11]+' ppl', fmt: v=>v },
        { label:'Manpower Growth', fn: t => '+'+( t.manpower.total[11]-t.manpower.total[0] )+' ppl', fmt: v=>v },
    ];

    const headerCols = teams.map(t => `<th style="color:${t.color}">${t.name}</th>`).join('');
    const bodyRows   = rows.map(r => {
        const cells = teams.map(t => `<td>${r.fmt(r.fn(t))}</td>`).join('');
        return `<tr><td class="comp-tbl-label">${r.label}</td>${cells}</tr>`;
    }).join('');

    return `<table class="comp-tbl">
        <thead><tr><th>Metric</th>${headerCols}</tr></thead>
        <tbody>${bodyRows}</tbody>
    </table>`;
}

// ═══════════════════════════════════════
// KPI TRACKER TAB
// ═══════════════════════════════════════
function renderKPI() {
    const d      = state.data;
    const teams  = d.teams;
    const months = d.months;

    // Summary cards
    let sumHTML = '';
    teams.forEach(t => {
        const peak = Math.max(...t.kpi);
        const avg  = Math.round(sum(t.kpi) / t.kpi.length);
        const last = t.kpi[t.kpi.length - 1];
        sumHTML += `
        <div class="kpi-stat-card ${t.id}-kpi">
            <div class="ksc-label">${t.name} — Peak KPI/MP</div>
            <div class="ksc-val ${t.id}-v">$${peak.toLocaleString()}</div>
            <div class="ksc-sub">Avg: $${avg.toLocaleString()} · Last: $${last.toLocaleString()}</div>
        </div>
        <div class="kpi-stat-card ${t.id}-kpi">
            <div class="ksc-label">${t.name} — Manpower Growth</div>
            <div class="ksc-val ${t.id}-v">${t.manpower.total[0]} → ${t.manpower.total[11]}</div>
            <div class="ksc-sub">+${t.manpower.total[11]-t.manpower.total[0]} headcount added</div>
        </div>`;
    });
    $('kpi-summary').innerHTML = sumHTML;

    // KPI trend chart
    destroyChart('kpiTrendChart');
    const kpiDatasets = teams.map(t => ({
        label: t.name,
        data: t.kpi,
        borderColor: t.color,
        backgroundColor: hexToRgba(t.color, 0.07),
        borderWidth: 2.5,
        pointBackgroundColor: '#060B14',
        pointBorderColor: t.color,
        pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
        fill: true, tension: 0.4
    }));
    state.charts['kpiTrendChart'] = new Chart($('kpiTrendChart').getContext('2d'), {
        type: 'line',
        data: { labels: months.map(shortMonth), datasets: kpiDatasets },
        options: {
            ...chartOpts(null, v => '$'+v, true),
            plugins: { ...chartOpts().plugins, legend:{ display:true, labels:{ color:'#94A3B8', font:{size:11} } } }
        }
    });

    // Peak KPI bar chart
    destroyChart('kpiPeakChart');
    const qKpiData = teams.map(t => ({
        label: t.name,
        data: Q_LABELS.map((_, qi) => {
            const idx = QUARTERS[`q${qi+1}`];
            return Math.max(...idx.map(i => t.kpi[i]));
        }),
        backgroundColor: hexToRgba(t.color, 0.7),
        borderColor: t.color, borderWidth: 1.5, borderRadius: 5
    }));
    state.charts['kpiPeakChart'] = new Chart($('kpiPeakChart').getContext('2d'), {
        type: 'bar',
        data: { labels: Q_LABELS, datasets: qKpiData },
        options: {
            ...chartOpts(null, v => '$'+v),
            plugins: { ...chartOpts().plugins, legend:{ display:true, labels:{ color:'#64748B', font:{size:11} } } }
        }
    });

    // KPI detail table
    let tblHTML = `<table class="kpi-tbl"><thead><tr>
        <th>Team</th>
        ${months.map((m,i) => {
            const sc = starClass(i);
            return `<th class="${sc}">${shortMonth(m)}</th>`;
        }).join('')}
        <th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>Peak</th>
    </tr></thead><tbody>`;

    teams.forEach(t => {
        const monthlyCells = t.kpi.map((v, i) => {
            const sc   = starClass(i);
            const peak = v === Math.max(...t.kpi);
            return `<td class="${sc}${peak ? ' star-cell':''} ${peak?'kpi-peak':''}">${v ? '$'+v : '—'}</td>`;
        }).join('');
        const qTotals = Q_LABELS.map((_, qi) => {
            const idx = QUARTERS[`q${qi+1}`];
            return `<td class="q-sum-cell" style="color:${['#93C5FD','#F9A8D4','#5EEAD4','#C4B5FD'][qi]}">$${Math.max(...idx.map(i=>t.kpi[i]))}</td>`;
        }).join('');
        const peak = Math.max(...t.kpi);
        tblHTML += `<tr class="${t.id}-row">
            <td style="color:${t.color};font-weight:700">${t.name}</td>
            ${monthlyCells}
            ${qTotals}
            <td class="kpi-peak">$${peak}</td>
        </tr>`;
    });

    tblHTML += '</tbody></table>';
    $('kpi-table').innerHTML = tblHTML;
}

// ═══════════════════════════════════════
// CHART OPTIONS FACTORY
// ═══════════════════════════════════════
function chartOpts(yMax = null, yFmt = null, showLegend = false) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: showLegend, labels: { color:'#64748B', font:{size:11}, boxWidth:10 } },
            tooltip: {
                backgroundColor: '#0C1220', titleColor:'#94A3B8', bodyColor:'#F1F5F9',
                borderColor:'rgba(255,255,255,.08)', borderWidth:1, padding:10,
                callbacks: {
                    label: ctx => {
                        const v = ctx.parsed.y;
                        return ` ${ctx.dataset.label}: ${yFmt ? yFmt(v) : v}`;
                    }
                }
            }
        },
        scales: {
            x: { grid:{ color:'rgba(255,255,255,.04)', drawBorder:false }, ticks:{ font:{size:10}, color:'#475569' } },
            y: {
                ...(yMax ? { max: yMax } : {}),
                grid:{ color:'rgba(255,255,255,.04)', drawBorder:false },
                ticks:{ font:{size:10}, color:'#475569', callback: yFmt || (v => v) }
            }
        },
        interaction: { intersect:false, mode:'index' }
    };
}

// ── Colour utilities ──────────────────────────────────────────
function hexToRgb(hex) {
    const h = hex.replace('#','');
    const r = parseInt(h.slice(0,2),16);
    const g = parseInt(h.slice(2,4),16);
    const b = parseInt(h.slice(4,6),16);
    return `${r},${g},${b}`;
}
function hexToRgba(hex, a) { return `rgba(${hexToRgb(hex)},${a})`; }

// ── Fallback static data (if API is unreachable) ──────────────
const FALLBACK_DATA = {
    months: ["Jul '26","Aug '26","Sep '26","Oct '26","Nov '26","Dec '26","Jan '27","Feb '27","Mar '27","Apr '27","May '27","Jun '27"],
    star_months: [5,8,9],
    teams: [
        {
            id:"seo", name:"Team SEO", subtitle:"Marketplace & B2B Sales", color:"#10D9A0",
            profiles:[
                {sl:1,name:"Fiverr",type:"Marketplace",monthly:[32000,32000,33000,35000,36000,38000,40000,40000,40000,42000,43000,45000]},
                {sl:2,name:"Upwork",type:"Marketplace",monthly:[0,0,0,0,0,0,0,0,0,0,0,0]},
                {sl:3,name:"PPH",type:"Marketplace",monthly:[0,0,0,0,0,0,0,0,0,0,0,0]},
                {sl:4,name:"B2B",type:"B2B Sales",monthly:[0,0,0,0,0,0,0,0,0,0,0,0]}
            ],
            manpower:{
                total:[41,41,41,45,45,48,53,53,53,53,55,55],
                sales:[12,12,12,12,12,12,12,12,12,12,12,12],
                operation:[28,28,28,32,32,35,40,40,40,40,42,42],
                bdt:[1,1,1,1,1,1,1,1,1,1,1,1],
                b2b_sales:[0,0,0,0,0,0,0,0,0,0,0,0],
                sp_budget:[9600,9600,9900,10500,10800,11400,12000,12000,12000,12600,12900,13500],
                tool_cost:[0,0,0,0,0,0,0,0,0,0,0,0]
            },
            kpi:[300,300,300,231,308,308,313,375,375,389,500,556]
        },
        {
            id:"smm", name:"Team SMM", subtitle:"Social Media Marketing", color:"#A855F7",
            profiles:[
                {sl:1,name:"Fiverr",type:"Marketplace",monthly:[3000,3000,3000,3000,4000,4000,5000,6000,6000,7000,9000,10000]},
                {sl:2,name:"Upwork",type:"Marketplace",monthly:[0,0,0,0,0,0,0,0,0,0,0,0]},
                {sl:3,name:"PPH",type:"Marketplace",monthly:[0,0,0,0,0,0,0,0,0,0,0,0]},
                {sl:4,name:"B2B",type:"B2B Sales",monthly:[0,0,0,0,0,0,0,0,0,0,0,0]}
            ],
            manpower:{
                total:[10,10,10,13,13,13,16,16,16,18,18,18],
                sales:[3,3,3,3,3,3,6,6,6,6,6,6],
                operation:[7,7,7,10,10,10,10,10,10,12,12,12],
                bdt:[0,0,0,0,0,0,0,0,0,0,0,0],
                b2b_sales:[0,0,0,0,0,0,0,0,0,0,0,0],
                sp_budget:[900,900,900,900,1200,1200,1500,1800,1800,2100,2700,3000],
                tool_cost:[0,0,0,0,0,0,0,0,0,0,0,0]
            },
            kpi:[703,723,716,731,746,746,722,750,750,778,806,833]
        }
    ]
};
