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
        const [resTarget, resAchieved] = await Promise.all([
            fetch('/api/finance'),
            fetch('/api/finance-stats')
        ]);
        
        state.data = await resTarget.json();
        const achievedData = await resAchieved.json();
        
        if (achievedData.status === 'ok') {
            const rawAchieved = achievedData.data;
            const targetMonths = state.data.months;
            
            const monthMap = {
                "Jul '26": "2026-07", "Aug '26": "2026-08", "Sep '26": "2026-09",
                "Oct '26": "2026-10", "Nov '26": "2026-11", "Dec '26": "2026-12",
                "Jan '27": "2027-01", "Feb '27": "2027-02", "Mar '27": "2027-03",
                "Apr '27": "2027-04", "May '27": "2027-05", "Jun '27": "2027-06"
            };

            state.data.teams.forEach(team => {
                const teamId = team.id === 'seo' ? 'SEO' : 'SMM';
                team.profiles.forEach(profile => {
                    const profileName = profile.name;
                    profile.achieved = targetMonths.map(tm => {
                        const backendMonth = monthMap[tm];
                        if (rawAchieved[backendMonth]) {
                            if (rawAchieved[backendMonth][teamId]) {
                                return rawAchieved[backendMonth][teamId][profileName] || 0;
                            }
                            return 0;
                        }
                        return null;
                    });
                });
            });
        }
    } catch (e) {
        console.error("Data load error:", e);
        if(!state.data) state.data = FALLBACK_DATA;
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
    $('exportBtn').addEventListener('click', () => window.print());
}

// ═══════════════════════════════════════
// DASHBOARD TAB  (combined SEO + SMM)
// ═══════════════════════════════════════
function renderDashboard() {
    const root   = $('dashboard-root');
    const teams  = state.data.teams;
    const months = state.data.months;
    root.innerHTML = buildCombinedView(teams, months);
    initCombinedChart(teams, months);
}

function buildCombinedView(teams, months) {
    // ── per-team stats ──────────────────────────────────────────
    const teamHeaders = teams.map(t => {
        const isSmm   = t.id === 'smm';
        const totalTargetRev = sum(t.profiles.flatMap(p => p.monthly));
        const totalAchievedRev = sum(t.profiles.flatMap(p => p.achieved ? p.achieved : []));
        const totalBdg = sum(t.manpower.sp_budget);
        const peakKpi  = Math.max(...t.kpi);
        const endMp    = t.manpower.total[11];
        
        const revColor = totalAchievedRev >= totalTargetRev ? (isSmm?'col-smm':'col-seo') : (totalAchievedRev > 0 ? 'col-amber' : 'col-muted');
        
        return `
        <div class="team-header ${isSmm ? 'smm-header':'seo-header'}">
            <div class="th-left">
                <div class="team-icon ${isSmm ? 'smm-icon':'seo-icon'}">
                    <i class="fa-solid ${isSmm ? 'fa-hashtag':'fa-chart-line'}"></i>
                </div>
                <div><h2>${t.name}</h2><p>${t.subtitle}</p></div>
            </div>
            <div class="th-stats">
                <div class="ths-item">
                    <span class="ths-label">Total Revenue</span>
                    <span class="ths-value ${revColor}">${usdF(totalAchievedRev)}</span>
                    <span style="font-size: 9px; color: var(--t3); font-weight: 600;">T: ${usdF(totalTargetRev)}</span>
                </div>
                <div class="ths-item">
                    <span class="ths-label">SP Budget</span>
                    <span class="ths-value col-muted">${usdF(totalBdg)}</span>
                </div>
                <div class="ths-item">
                    <span class="ths-label">Peak KPI/MP</span>
                    <span class="ths-value col-amber">$${peakKpi.toLocaleString()}</span>
                </div>
                <div class="ths-item">
                    <span class="ths-label">Manpower (End)</span>
                    <span class="ths-value col-white">${endMp}</span>
                </div>
            </div>
        </div>`;
    }).join('');

    // ── combined Q cards ────────────────────────────────────────
    const qCombinedTarget    = Q_LABELS.map((_, qi) =>
        teams.reduce((a, t) => a + sumIdx(t.profiles.flatMap(p => p.monthly), QUARTERS[`q${qi+1}`]), 0)
    );
    const qCombinedAchieved  = Q_LABELS.map((_, qi) =>
        teams.reduce((a, t) => a + sumIdx(t.profiles.flatMap(p => p.achieved ? p.achieved : []), QUARTERS[`q${qi+1}`]), 0)
    );
    const maxQ = Math.max(...qCombinedTarget, 1);

    const qCardsHTML = Q_LABELS.map((ql, qi) => {
        const qkey = `q${qi+1}`;
        const fill = Math.round((qCombinedAchieved[qi] / Math.max(qCombinedTarget[qi], 1)) * 95);
        const fillCapped = Math.min(fill, 100);
        
        const breakdown = teams.map(t => {
            const qT = sumIdx(t.profiles.flatMap(p => p.monthly), QUARTERS[qkey]);
            const qA = sumIdx(t.profiles.flatMap(p => p.achieved ? p.achieved : []), QUARTERS[qkey]);
            return `<span style="color:${t.color}">${t.id.toUpperCase()} ${usdF(qA)} <span style="color:var(--t3);font-size:8px;">/ ${usd(qT)}</span></span>`;
        }).join('<span style="color:var(--t3)"> + </span>');
        
        return `<div class="qcard ${qkey}">
            <div class="qcard-top">
                <span class="qcard-label">${ql} Achieved vs Target</span>
                <span class="qcard-icon"><i class="fa-solid fa-circle-${qi+1}"></i></span>
            </div>
            <div class="qcard-val">${usdF(qCombinedAchieved[qi])} <span style="font-size: 11px; color: var(--t3); font-weight: 600;">/ ${usdF(qCombinedTarget[qi])}</span></div>
            <div class="qcard-sub">${Q_RANGES[qi]}</div>
            <div class="qcard-breakdown">${breakdown}</div>
            <div class="qcard-bar"><div class="qcard-fill" style="width:${fillCapped}%"></div></div>
        </div>`;
    }).join('');

    // ── layout ──────────────────────────────────────────────────
    return `
    <div class="dual-headers">${teamHeaders}</div>

    <div class="overview-row">
        <div class="q-cards">${qCardsHTML}</div>
        <div class="chart-panel">
            <div class="chart-panel-header">
                <span class="cp-title">Revenue Trend — Both Teams</span>
                <div class="cp-legend">
                    ${teams.map(t=>`<span><i class="legend-dot ${t.id}"></i> ${t.name}</span>`).join('')}
                </div>
            </div>
            <div class="chart-wrap"><canvas id="chart-combined"></canvas></div>
        </div>
    </div>

    <div class="table-card">
        <div class="table-card-header">
            <span class="tc-title"><i class="fa-solid fa-table"></i> Monthly Breakdown — SEO + SMM</span>
            <div class="qpills">${Q_LABELS.map(q=>`<span class="qpill">${q}</span>`).join('')}</div>
        </div>
        <div class="table-scroll">${buildCombinedTable(teams, months)}</div>
    </div>`;
}

// ── Combined table (SEO + SMM in one table) ───────────────────
function buildCombinedTable(teams, months) {
    const q         = state.quarter;
    const colGroups = q === 'all' ? ['q1','q2','q3','q4'] : [q];
    const thead     = buildTableHeaders(months, colGroups);
    let   tbody     = '';

    teams.forEach(team => {
        const isSmm = team.id === 'smm';

        // Team group header
        tbody += `<tr class="team-group-row ${isSmm ? 'smm-group':'seo-group'}">
            <td colspan="${countCols(colGroups) + 4}" class="team-group-label">
                <i class="fa-solid ${isSmm?'fa-hashtag':'fa-chart-line'}"></i>
                &nbsp;${team.name}
            </td>
        </tr>`;

        // Profile rows
        team.profiles.forEach(p => {
            const active   = sum(p.monthly) > 0;
            const cells    = buildDataCells(p.monthly, colGroups, 'money', active, p.achieved);
            const rowTargetTotal = q === 'all' ? sum(p.monthly) : sumIdx(p.monthly, QUARTERS[q]);
            
            const isAllRowNull = p.achieved ? p.achieved.every(v => v === null) : true;
            const rowAchievedTotal = isAllRowNull ? null : (q === 'all' ? sum(p.achieved.map(v=>v||0)) : sumIdx(p.achieved.map(v=>v||0), QUARTERS[q]));
            
            let totalHtml = active ? usdF(rowTargetTotal) : '—';
            if (active && rowAchievedTotal !== null) {
                const targetCls = rowAchievedTotal >= rowTargetTotal ? 'target-hit' : (rowAchievedTotal > 0 ? 'target-miss' : 'target-zero');
                totalHtml = `<div class="cell-stack"><span class="val-achieved ${targetCls}">${usdF(rowAchievedTotal)}</span><span class="val-target">T: ${usdF(rowTargetTotal)}</span></div>`;
            }

            tbody += `<tr class="profile-row${active ? '' : ' inactive'}">
                <td class="sc0 sl-cell">${p.sl}</td>
                <td class="sc1 name-cell${active ? ' '+team.id : ''}">${p.name}</td>
                <td class="sc2 type-cell">${p.type}</td>
                ${cells}
                <td class="grand-total">${totalHtml}</td>
            </tr>`;
        });

        // Team revenue total
        const teamMonthlyTarget = months.map((_, mi) => sum(team.profiles.map(p => p.monthly[mi])));
        const teamMonthlyAchieved = months.map((_, mi) => {
            const hasData = team.profiles.some(p => p.achieved && p.achieved[mi] !== null);
            if (!hasData) return null;
            return sum(team.profiles.map(p => p.achieved && p.achieved[mi] !== null ? p.achieved[mi] : 0));
        });
        const teamTargetTotal   = q === 'all' ? sum(teamMonthlyTarget) : sumIdx(teamMonthlyTarget, QUARTERS[q]);
        
        const qIdx = QUARTERS[q === 'all' ? 'q4' : q]; // For 'all' we want total achieved so far, wait sumIdx will handle null.
        // If all achieved months are null, total is null.
        const isAllNull = teamMonthlyAchieved.every(v => v === null);
        const teamAchievedTotal = isAllNull ? null : (q === 'all' ? sum(teamMonthlyAchieved.map(v => v||0)) : sumIdx(teamMonthlyAchieved.map(v => v||0), QUARTERS[q]));
        
        let teamTotalHtml = usdF(teamTargetTotal);
        if (teamAchievedTotal !== null) {
            const targetCls = teamAchievedTotal >= teamTargetTotal ? 'target-hit' : (teamAchievedTotal > 0 ? 'target-miss' : 'target-zero');
            teamTotalHtml = `<div class="cell-stack"><span class="val-achieved ${targetCls}">${usdF(teamAchievedTotal)}</span><span class="val-target">T: ${usdF(teamTargetTotal)}</span></div>`;
        }

        tbody += `<tr class="rev-total-row">
            <td class="sc0 total-badge-cell" colspan="3">
                <span class="total-badge" style="color:${team.color}">${team.name} Total</span>
            </td>
            ${buildDataCells(teamMonthlyTarget, colGroups, 'money', true, teamMonthlyAchieved)}
            <td class="grand-total" style="color:${team.color}">${teamTotalHtml}</td>
        </tr>`;

        // Manpower
        tbody += `<tr class="sec-divider"><td colspan="${countCols(colGroups) + 4}"></td></tr>`;
        tbody += buildManpowerRows(team, colGroups, isSmm);

        // KPI
        const kpiPeak = Math.max(...(q === 'all' ? team.kpi : colGroups.flatMap(qk => QUARTERS[qk]).map(i => team.kpi[i])));
        tbody += `<tr class="kpi-row">
            <td class="sc0 kpi-label-cell" colspan="3">
                <span class="kpi-badge"><i class="fa-solid fa-bolt"></i> KPI vs. Manpower</span>
            </td>
            ${buildDataCells(team.kpi, colGroups, 'kpi', true)}
            <td class="grand-total kpi-peak">$${kpiPeak}</td>
        </tr>`;

        // Spacer between teams
        tbody += `<tr class="team-spacer"><td colspan="${countCols(colGroups) + 4}"></td></tr>`;
    });

    // ── Combined Grand Total row ──────────────────────────────
    const combinedMonthlyTarget = months.map((_, mi) =>
        teams.reduce((a, t) => a + sum(t.profiles.map(p => p.monthly[mi])), 0)
    );
    const combinedMonthlyAchieved = months.map((_, mi) => {
        const hasData = teams.some(t => t.profiles.some(p => p.achieved && p.achieved[mi] !== null));
        if (!hasData) return null;
        return teams.reduce((a, t) => a + sum(t.profiles.map(p => p.achieved && p.achieved[mi] !== null ? p.achieved[mi] : 0)), 0);
    });
    
    const combinedTargetTotal = q === 'all' ? sum(combinedMonthlyTarget) : sumIdx(combinedMonthlyTarget, QUARTERS[q]);
    
    const isAllCombNull = combinedMonthlyAchieved.every(v => v === null);
    const combinedAchievedTotal = isAllCombNull ? null : (q === 'all' ? sum(combinedMonthlyAchieved.map(v => v||0)) : sumIdx(combinedMonthlyAchieved.map(v => v||0), QUARTERS[q]));
    
    let combinedTotalHtml = usdF(combinedTargetTotal);
    if (combinedAchievedTotal !== null) {
        const targetCls = combinedAchievedTotal >= combinedTargetTotal ? 'target-hit' : (combinedAchievedTotal > 0 ? 'target-miss' : 'target-zero');
        combinedTotalHtml = `<div class="cell-stack"><span class="val-achieved ${targetCls}">${usdF(combinedAchievedTotal)}</span><span class="val-target">T: ${usdF(combinedTargetTotal)}</span></div>`;
    }

    tbody += `<tr class="combined-total-row">
        <td class="sc0 combined-label-cell" colspan="3">
            <span class="combined-badge">
                <i class="fa-solid fa-sigma"></i> Combined Total
            </span>
        </td>
        ${buildDataCells(combinedMonthlyTarget, colGroups, 'money', true, combinedMonthlyAchieved)}
        <td class="grand-total combined-grand">${combinedTotalHtml}</td>
    </tr>`;

    return `<table class="ftable"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
}

// ── Single-team table builder (kept for reference) ────────────
function buildTable(team, months) {
    const q = state.quarter;
    const isSmm = team.id === 'smm';

    // Determine which columns to show
    const colGroups = q === 'all'
        ? ['q1','q2','q3','q4']
        : [q];

    // Build header
    const thCols = buildTableHeaders(months, colGroups);

    // Revenue rows
    const profileRows = team.profiles.map((p) => {
        const active = sum(p.monthly) > 0;
        const cells  = buildDataCells(p.monthly, colGroups, 'money', active);
        const rowTotal = q === 'all' ? sum(p.monthly) : sumIdx(p.monthly, QUARTERS[q]);
        return `<tr class="profile-row${active ? '' : ' inactive'}">
            <td class="sc0 sl-cell">${p.sl}</td>
            <td class="sc1 name-cell${active ? ' '+team.id : ''}">${p.name}</td>
            <td class="sc2 type-cell">${p.type}</td>
            ${cells}
            <td class="grand-total">${active ? usdF(rowTotal) : '—'}</td>
        </tr>`;
    }).join('');

    // Revenue total row
    const totalMonthly = months.map((_, mi) => sum(team.profiles.map(p => p.monthly[mi])));
    const totalCells   = buildDataCells(totalMonthly, colGroups, 'money', true);
    const grandRev     = q === 'all' ? sum(totalMonthly) : sumIdx(totalMonthly, QUARTERS[q]);

    const revTotalRow = `<tr class="rev-total-row">
        <td class="sc0 total-badge-cell" colspan="3"><span class="total-badge">Revenue Total</span></td>
        ${totalCells}
        <td class="grand-total">${usdF(grandRev)}</td>
    </tr>`;

    // Divider
    const divider = `<tr class="sec-divider"><td colspan="${countCols(colGroups) + 4}"></td></tr>`;

    // Manpower rows
    const mpRows = buildManpowerRows(team, colGroups, isSmm);

    // KPI row
    const kpiCells  = buildDataCells(team.kpi, colGroups, 'kpi', true);
    const kpiPeak   = Math.max(...(q === 'all' ? team.kpi : colGroups.flatMap(qk => QUARTERS[qk]).map(i => team.kpi[i])));
    const kpiRow = `<tr class="kpi-row">
        <td class="sc0 kpi-label-cell" colspan="3">
            <span class="kpi-badge"><i class="fa-solid fa-bolt"></i> KPI vs. Manpower</span>
        </td>
        ${kpiCells}
        <td class="grand-total kpi-peak">$${kpiPeak}</td>
    </tr>`;

    return `<table class="ftable">
        <thead>${thCols}</thead>
        <tbody>${profileRows}${revTotalRow}${divider}${mpRows}${kpiRow}</tbody>
    </table>`;
}

function buildTableHeaders(months, colGroups) {
    // Row 1: sticky cols + Q group spans + total
    let r1 = `<tr>
        <th class="sc0 qh" rowspan="2">Sl</th>
        <th class="sc1 qh" rowspan="2">Profile</th>
        <th class="sc2 qh" rowspan="2">Type</th>`;

    colGroups.forEach(qk => {
        const qi    = ['q1','q2','q3','q4'].indexOf(qk);
        const idx   = QUARTERS[qk];
        const label = ['Q1 · \'26','Q2 · \'26','Q3 · \'27','Q4 · \'27'][qi];

        // For simplicity: 3 month cols + Q total, mark star inline
        idx.forEach(i => {
            const sc   = starClass(i);
            const mLbl = months[i];
            if (STAR_IDX.includes(i)) {
                r1 += `<th class="qh ${qk}${sc ? ' '+sc : ''}" rowspan="2">${shortMonth(mLbl)} ★</th>`;
            }
        });
        // group header spans non-star months
        const nonStarCount = idx.filter(i => !STAR_IDX.includes(i)).length;
        if (nonStarCount > 0) {
            // We'll insert in r1 as a colspan
        }
        r1 += `<th class="qh ${qk}" colspan="${nonStarCount}">${label}</th>`;
        r1 += `<th class="qs ${qk}" rowspan="2">${qk.toUpperCase()}</th>`;
    });

    r1 += `<th class="qh" rowspan="2" style="background:rgba(255,255,255,.02);color:var(--t2)">TOTAL</th></tr>`;

    // Row 2: individual month labels (non-star only)
    let r2 = '<tr>';
    colGroups.forEach(qk => {
        const idx = QUARTERS[qk];
        idx.filter(i => !STAR_IDX.includes(i)).forEach(i => {
            r2 += `<th class="qh ${qk}">${shortMonth(months[i])}</th>`;
        });
    });
    r2 += '</tr>';

    return r1 + r2;
}

function buildDataCells(arr, colGroups, mode, active, achievedArr = null) {
    let html = '';
    
    const formatCell = (val, idx) => {
        if (!active) return '—';
        if (mode !== 'money') return (val ? (mode === 'kpi' ? '$'+val : val) : '—');
        
        const target = val || 0;
        const achieved = achievedArr && achievedArr[idx] !== null ? achievedArr[idx] : null;
        
        if (achieved !== null) {
            const targetCls = achieved >= target ? 'target-hit' : (achieved > 0 ? 'target-miss' : 'target-zero');
            return `<div class="cell-stack"><span class="val-achieved ${targetCls}">${usd(achieved)}</span><span class="val-target">T: ${usd(target)}</span></div>`;
        }
        return usd(target);
    };
    
    colGroups.forEach(qk => {
        const idx = QUARTERS[qk];
        // star months first in logical order
        idx.forEach(i => {
            const sc  = starClass(i);
            const val = arr[i] || 0;
            if (STAR_IDX.includes(i)) {
                html += `<td class="${sc}${!active || val===0 ? ' zero-cell':''}">${formatCell(val, i)}</td>`;
            }
        });
        // non-star months
        idx.filter(i => !STAR_IDX.includes(i)).forEach(i => {
            const val = arr[i] || 0;
            html += `<td class="${!active || val===0 ? 'zero-cell':''}">${formatCell(val, i)}</td>`;
        });
        // Q total
        const qTarget = sumIdx(arr, idx);
        
        // If all months in this Q are null, the Q achieved is null. Otherwise, it's the sum.
        const qAchieved = achievedArr ? 
            (idx.every(i => achievedArr[i] === null) ? null : sumIdx(achievedArr, idx)) 
            : null;
        
        const qclass = `qs ${qk}${mode === 'kpi' ? ' kpi-q' : ''}`;
        
        let display = '';
        if (mode === 'money') {
            if (!active) {
                display = '$0';
            } else if (qAchieved !== null) {
                const targetCls = qAchieved >= qTarget ? 'target-hit' : (qAchieved > 0 ? 'target-miss' : 'target-zero');
                display = `<div class="cell-stack"><span class="val-achieved ${targetCls}">${usdF(qAchieved)}</span><span class="val-target">T: ${usdF(qTarget)}</span></div>`;
            } else {
                display = usdF(qTarget);
            }
        } else {
            display = mode === 'kpi' ? (active ? '—' : '—') : qTarget;
        }
        
        html += `<td class="${qclass}">${display}</td>`;
    });
    return html;
}

function buildManpowerRows(team, colGroups, isSmm) {
    const mpClass = isSmm ? 'smm-mp' : '';
    const mpRows  = [
        { key:'total',     label:'Total',     cls:'' },
        { key:'sales',     label:'Sales',     cls:'' },
        { key:'operation', label:'Operation', cls:'' },
        { key:'bdt',       label:'BDT',       cls:'' },
        { key:'b2b_sales', label:'B2B Sales', cls:'' },
        { key:'sp_budget', label:'SP Budget', cls:'sp-row' },
        { key:'tool_cost', label:'Tool Cost', cls:'tool-row' },
    ];

    let html = '';
    let isFirst = true;
    mpRows.forEach(({ key, label, cls }) => {
        const arr = team.manpower[key] || [];
        const isMoneyRow = key === 'sp_budget' || key === 'tool_cost';
        const mode = isMoneyRow ? 'money' : 'number';

        const cells = buildMpCells(arr, colGroups, mode);
        const totalVal = state.quarter === 'all'
            ? sum(arr)
            : sumIdx(arr, QUARTERS[state.quarter]);
        const totalDisplay = isMoneyRow ? usdF(totalVal) : (totalVal || '—');

        const mpLabelCell = isFirst
            ? `<td class="sc0 mp-label-cell" rowspan="${mpRows.length}"><span class="mp-rotated">Manpower</span></td>`
            : '';
        isFirst = false;

        html += `<tr class="mp-row ${cls} ${mpClass}">
            ${mpLabelCell}
            <td class="sc1 sc2 mp-sub${key==='sp_budget' ? ' sp-sub':''}" colspan="2">${label}</td>
            ${cells}
            <td class="grand-total${key==='sp_budget' ? ' ksc-val':''}">${totalDisplay}</td>
        </tr>`;
    });
    return html;
}

function buildMpCells(arr, colGroups, mode) {
    let html = '';
    colGroups.forEach(qk => {
        const idx = QUARTERS[qk];
        // star months
        idx.forEach(i => {
            if (STAR_IDX.includes(i)) {
                const sc  = starClass(i);
                const val = arr[i] || 0;
                const disp = mode === 'money' ? usd(val) : (val || '—');
                html += `<td class="${sc}${!val ? ' zero-cell':''}">${disp}</td>`;
            }
        });
        // non-star
        idx.filter(i => !STAR_IDX.includes(i)).forEach(i => {
            const val  = arr[i] || 0;
            const disp = mode === 'money' ? usd(val) : (val || '—');
            html += `<td class="${!val ? 'zero-cell':''}">${disp}</td>`;
        });
        // Q sum
        const qTotal = sumIdx(arr, idx);
        const disp = mode === 'money'
            ? (qTotal ? usdF(qTotal) : '$0')
            : (qTotal || '—');
        html += `<td class="qs ${qk} mp">${disp}</td>`;
    });
    return html;
}

function countCols(colGroups) {
    return colGroups.reduce((a, _qk) => a + 3 + 1, 0); // 3 months + 1 Q total per group
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

    const achievedData = months.map((_, mi) => sum(team.profiles.map(p => p.achieved ? p.achieved[mi] : 0)));

    const revGrad = ctx.createLinearGradient(0, 0, 0, 200);
    revGrad.addColorStop(0, color.replace(')', ',.22)').replace('rgb', 'rgba').replace('#', 'rgba(').replace(/rgba\(([0-9A-Fa-f]{6}),/, (_, hex) => {
        const r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
        return `rgba(${r},${g},${b},`;
    }));

    // Simpler gradient approach
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
                    label: 'Achieved Revenue',
                    data: achievedData,
                    borderColor: team.color,
                    backgroundColor: revG,
                    borderWidth: 2,
                    pointBackgroundColor: '#060B14',
                    pointBorderColor: team.color,
                    pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 5,
                    fill: true, tension: 0.4
                },
                {
                    label: 'Target Revenue',
                    data: revData,
                    borderColor: `rgba(${c}, 0.5)`,
                    backgroundColor: 'transparent',
                    borderWidth: 2, borderDash: [4, 4],
                    pointBackgroundColor: '#060B14',
                    pointBorderColor: `rgba(${c}, 0.5)`,
                    pointBorderWidth: 1.5, pointRadius: 2, pointHoverRadius: 4,
                    fill: false, tension: 0.4
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

    const datasets = teams.flatMap(t => {
        const c    = hexToRgb(t.color);
        const revG = ctx.createLinearGradient(0, 0, 0, 200);
        revG.addColorStop(0, `rgba(${c},0.2)`);
        revG.addColorStop(1, `rgba(${c},0)`);
        
        return [
            {
                label: `${t.name} (Achieved)`,
                data: months.map((_, mi) => sum(t.profiles.map(p => p.achieved ? p.achieved[mi] : 0))),
                borderColor: t.color,
                backgroundColor: revG,
                borderWidth: 2,
                pointBackgroundColor: '#060B14',
                pointBorderColor: t.color,
                pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 5,
                fill: true, tension: 0.4
            },
            {
                label: `${t.name} (Target)`,
                data: months.map((_, mi) => sum(t.profiles.map(p => p.monthly[mi]))),
                borderColor: `rgba(${c}, 0.5)`,
                backgroundColor: 'transparent',
                borderWidth: 2, borderDash: [4, 4],
                pointBackgroundColor: '#060B14',
                pointBorderColor: `rgba(${c}, 0.5)`,
                pointBorderWidth: 1.5, pointRadius: 2, pointHoverRadius: 4,
                fill: false, tension: 0.4
            }
        ];
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
