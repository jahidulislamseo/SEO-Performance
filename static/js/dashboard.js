/* ═══════════════════════════════════════════════════════════════
   dashboard.js — Dashboard page logic
   Requires: config.js, utils.js, api.js
   ═══════════════════════════════════════════════════════════════ */

// ── APP STATE ────────────────────────────────────────────────────
let STATIC_DATA = null;
try { STATIC_DATA = __DATA_PLACEHOLDER__; } catch (e) {}

const APP = {
  allMembers: [], members: [], filteredMembers: [], pageMembers: [],
  loaded: false,
  monthFilter: '2026-04', statusFilter: 'all', teamFilter: 'All',
  prevRanks: {}, view: 'cards', page: 1, pageSize: 12,
  source: 'Initializing',
  audit: { seoSmmRows: 0, matchedRows: 0, unmatchedRows: 0, uniqueOrders: 0, unmatchedItems: [] },
  summary: null,
};
let modalMember = null, mTab = 'all', rfInterval = null, lastUpdated = null;
let charts = { team: null, dept: null };

// ── CLOCK ────────────────────────────────────────────────────────
function updateClock() {
  const n = new Date();
  document.getElementById('clock').textContent = n.toLocaleTimeString('en-US', { hour12: false });
  document.getElementById('footerDate').textContent = n.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
setInterval(updateClock, 1000); updateClock();

// ── COUNTDOWN BANNER ─────────────────────────────────────────────
function updateCountdown() {
  const now   = new Date();
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysLeft  = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  const elapsed   = Math.round(((now - start) / (end - start)) * 100);
  document.getElementById('cdMonth').textContent = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  document.getElementById('cdDays').textContent  = daysLeft;
  document.getElementById('cdPct').textContent   = elapsed;
  document.getElementById('cdFill').style.width  = elapsed + '%';
}
updateCountdown(); setInterval(updateCountdown, 60000);

// ── REFRESH COUNTDOWN ────────────────────────────────────────────
function startRfCountdown() {
  clearInterval(rfInterval);
  lastUpdated = new Date();
  try { renderStatusCards(); } catch (e) {}
  rfInterval = setInterval(() => {
    if (!lastUpdated) return;
    const sec = Math.floor((new Date() - lastUpdated) / 1000);
    const m = Math.floor(sec / 60), s = sec % 60;
    const el = document.getElementById('cdNext');
    if (el) el.textContent = `Last updated: ${m}m ${s}s ago`;
  }, 1000);
}

// ── RANK TRACKING ────────────────────────────────────────────────
function saveRanks(sorted) {
  const ranks = {}; sorted.forEach((m, i) => ranks[m.name] = i + 1);
  try { localStorage.setItem('seo_prev_ranks', JSON.stringify(ranks)); } catch (e) {}
  return ranks;
}
function loadPrevRanks() {
  try { const r = localStorage.getItem('seo_prev_ranks'); return r ? JSON.parse(r) : {}; } catch (e) { return {}; }
}
function rankChangeHTML(name, currentRank) {
  const prev = APP.prevRanks[name];
  if (!prev) return '<span class="rank-chg rank-new">NEW</span>';
  const diff = prev - currentRank;
  if (diff > 0) return `<span class="rank-chg rank-up">↑${diff}</span>`;
  if (diff < 0) return `<span class="rank-chg rank-dn">↓${Math.abs(diff)}</span>`;
  return '<span class="rank-chg rank-eq">—</span>';
}

// ── SECTION NAV ──────────────────────────────────────────────────
function jumpSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.querySelectorAll('.page-nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.target === id));
  try { history.replaceState(null, '', `#${id}`); } catch (e) {}
}
function updateSectionNav() {
  const sections = [...document.querySelectorAll('.dash-section')];
  let activeId = sections[0]?.id || '';
  sections.forEach(sec => {
    const r = sec.getBoundingClientRect();
    if (r.top <= 150 && r.bottom > 150) activeId = sec.id;
  });
  document.querySelectorAll('.page-nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.target === activeId));
}

// ── URL STATE ────────────────────────────────────────────────────
function syncControlsFromState() {
  const month   = document.getElementById('monthSel');    if (month)  month.value  = APP.monthFilter;
  const sort    = document.getElementById('sortSel');     if (sort && !sort.value) sort.value = 'deliveredAmt';
  const pageSel = document.getElementById('pageSizeSel'); if (pageSel) pageSel.value = String(APP.pageSize);
  document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
  const active = document.getElementById(`view-${APP.view}`); if (active) active.classList.add('active');
  document.querySelectorAll('.ftab').forEach(b => {
    b.classList.toggle('active', b.textContent.trim() === APP.teamFilter || (APP.teamFilter === 'All' && b.textContent.trim() === 'All'));
  });
  document.querySelectorAll('.sfbtn').forEach(b => b.className = 'sfbtn');
  const sid  = APP.statusFilter === 'all' ? 'all' : APP.statusFilter === 'Delivered' ? 'del' : APP.statusFilter === 'WIP' ? 'wip' : 'can';
  const sbtn = document.getElementById(`sf-${sid}`); if (sbtn) sbtn.className = `sfbtn active-${sid}`;
}
function applyUrlState() {
  try {
    const qs = new URLSearchParams(location.search);
    APP.monthFilter  = qs.get('month')  || APP.monthFilter;
    APP.statusFilter = qs.get('status') || APP.statusFilter;
    APP.teamFilter   = qs.get('team')   || APP.teamFilter;
    APP.view         = qs.get('view')   || APP.view;
    APP.page     = Math.max(parseInt(qs.get('page') || APP.page, 10) || 1, 1);
    APP.pageSize = Math.max(parseInt(qs.get('size') || APP.pageSize, 10) || 12, 1);
    const sort = qs.get('sort'); if (sort) { const el = document.getElementById('sortSel'); if (el) el.value = sort; }
    const q    = qs.get('q');    if (q)    { const el = document.getElementById('srch');    if (el) el.value = q; }
  } catch (e) {}
}
function updateUrlState() {
  try {
    const params = new URLSearchParams();
    if (APP.monthFilter  !== 'all')          params.set('month',  APP.monthFilter);
    if (APP.statusFilter !== 'all')          params.set('status', APP.statusFilter);
    if (APP.teamFilter   !== 'All')          params.set('team',   APP.teamFilter);
    if (APP.view         !== 'cards')        params.set('view',   APP.view);
    if (APP.page         !== 1)              params.set('page',   String(APP.page));
    if (APP.pageSize     !== 12)             params.set('size',   String(APP.pageSize));
    const sort = document.getElementById('sortSel')?.value || 'deliveredAmt';
    if (sort !== 'deliveredAmt') params.set('sort', sort);
    const q = (document.getElementById('srch')?.value || '').trim();
    if (q) params.set('q', q);
    history.replaceState(null, '', `${location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
  } catch (e) {}
}

// ── REAGGREGATE ──────────────────────────────────────────────────
function reAggregate(monthFilter, statusFilter) {
  if (!APP.summary) APP.summary = {};
  if (!APP.summary.teams) {
    APP.summary.teams = {};
    APP.allMembers.forEach(mem => { if (mem.team && !APP.summary.teams[mem.team]) APP.summary.teams[mem.team] = { amt: 0, wip: 0, revision: 0, delivered: 0, cancelled: 0, projects: 0 }; });
  }

  return APP.allMembers.map(m => {
    let projs = m.projects;
    if (monthFilter !== 'all') projs = projs.filter(p => {
      const d = (p.status === 'Delivered' && p.deliveredDate && p.deliveredDate.length >= 7) ? p.deliveredDate : p.date;
      return d.startsWith(monthFilter);
    });
    if (statusFilter === 'Delivered') projs = projs.filter(p => p.status === 'Delivered');
    else if (statusFilter === 'WIP')       projs = projs.filter(p => p.status === 'WIP' || p.status === 'Revision');
    else if (statusFilter === 'Cancelled') projs = projs.filter(p => p.status === 'Cancelled');

    let wip = 0, revision = 0, delivered = 0, cancelled = 0, deliveredAmt = 0, wipAmt = 0;
    projs.forEach(p => {
      if (p.status === 'Delivered')  { delivered++; deliveredAmt += p.share; }
      else if (p.status === 'WIP')       { wip++;      wipAmt += p.share; }
      else if (p.status === 'Revision')  { revision++; wipAmt += p.share; }
      else if (p.status === 'Cancelled')   cancelled++;
    });
    const del = Math.round(deliveredAmt * 100) / 100;
    const wam = Math.round(wipAmt * 100) / 100;
    return {
      ...m, projects: projs, wip, revision, delivered, cancelled, total: projs.length,
      deliveredAmt: del, wipAmt: wam,
      remaining: Math.round((del - m.target) * 100) / 100,
      progress: m.target > 0 ? Math.round((del / m.target) * 10000) / 100 : 0,
    };
  });
}

// ── REFRESH DATA ─────────────────────────────────────────────────
async function refreshData(silent = false) {
  const icon = document.getElementById('rfIcon');
  const btn = document.getElementById('rfBtn');
  if (!silent) {
    icon.classList.add('spin');
    if (btn) btn.style.opacity = '0.5';
  }

  // 0) Trigger Server Sync (New: ensures MongoDB has latest from GSheet)
  if (!silent) {
    showToast('🔄 Google Sheets থেকে ডাটা সিঙ্ক হচ্ছে...', '#6366f1');
    try {
      const syncRes = await fetch('/api/sync');
      const syncData = await syncRes.json();
      if (syncData.status === 'ok') {
        console.log('Sync completed');
      }
    } catch (e) { console.warn('Sync failed, trying to read old data:', e); }
  }

  // 1) Flask API
  try {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok') {
        APP.allMembers = data.data; 
        APP.summary = data.summary; 
        APP.audit = data.audit || APP.audit;
        APP.source = 'Flask API';
        APP.loaded = true;
        document.getElementById('liveMode').textContent  = '🟢 API';
        document.getElementById('footerMode').textContent = 'Flask API';
        buildMonthOptions(); buildTeamOptions(); applyFilters(true);
        if (!silent) showToast('✅ ড্যাশবোর্ড আপডেট করা হয়েছে!', '#10b981');
        startRfCountdown(); 
        if (icon) icon.classList.remove('spin'); 
        if (btn) btn.style.opacity = '1';
        return;
      }
    }
  } catch (e) { console.warn('API Error:', e); }

  // 2) Google Sheets (Fallback)
  try {
    const r = await fetchSheets();
    APP.allMembers = r.members; APP.summary = r.summary; APP.loaded = true; APP.audit = r.audit || APP.audit; APP.source = 'Google Sheets Live';
    document.getElementById('liveMode').textContent = '🔴 Live';
    document.getElementById('footerMode').textContent = 'Google Sheets Live';
    buildMonthOptions(); buildTeamOptions(); applyFilters(true);
    if (!silent) showToast('✅ Google Sheets থেকে live data!', '#10b981');
    startRfCountdown(); icon.classList.remove('spin'); return;
  } catch (e) { console.warn('Sheets:', e.message); }

  // 3) geo_data.json
  try {
    const res2 = await fetch('geo_data.json?t=' + Date.now());
    if (res2.ok) {
      const j2 = await res2.json();
      if (Array.isArray(j2) && j2.length) {
        APP.allMembers = j2; APP.loaded = true; APP.source = 'geo_data.json';
        document.getElementById('liveMode').textContent  = '🟡 JSON';
        document.getElementById('footerMode').textContent = 'geo_data.json';
        buildMonthOptions(); applyFilters(true);
        if (!silent) showToast('📄 geo_data.json থেকে loaded', '#f59e0b');
        startRfCountdown(); icon.classList.remove('spin'); return;
      }
    }
  } catch (e) {}

  // 4) Static
  if (STATIC_DATA && STATIC_DATA.length) {
    APP.allMembers = STATIC_DATA; APP.loaded = true; APP.source = 'Embedded Static Data';
    document.getElementById('liveMode').textContent  = '⚪ Static';
    document.getElementById('footerMode').textContent = 'Static Data';
    buildMonthOptions(); applyFilters(true);
    showToast('📦 Static data ব্যবহার হচ্ছে', '#94a3b8');
  } else if (!APP.loaded) {
    document.getElementById('deptHeading').textContent = 'Data পাওয়া যায়নি';
    document.getElementById('deptSub').textContent = 'Sheet টি publicly shared করুন অথবা python server.py চালান';
    showToast('❌ কোনো data source নেই', '#ef4444');
  } else { showToast('⚠️ Refresh ব্যর্থ', '#f59e0b'); }
  icon.classList.remove('spin');
}

// ── MONTH / TEAM OPTIONS ─────────────────────────────────────────
function buildMonthOptions() {
  const months = new Set();
  APP.allMembers.forEach(m => m.projects.forEach(p => {
    const d = (p.status === 'Delivered' && p.deliveredDate && p.deliveredDate.length >= 7) ? p.deliveredDate : p.date;
    if (d && d.length >= 7) months.add(d.substring(0, 7));
  }));
  const sel = document.getElementById('monthSel');
  const cur = APP.monthFilter || sel.value;
  sel.innerHTML = '<option value="all">📅 All Time</option>';
  [...months].sort().reverse().forEach(mo => {
    const d   = new Date(mo + '-01');
    const lbl = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    sel.innerHTML += `<option value="${mo}">${lbl}</option>`;
  });
  sel.value = (cur === 'all' || months.has(cur)) ? cur : 'all';
}

function buildTeamOptions() {
  const teams = new Set();
  APP.allMembers.forEach(m => { if (m.team) teams.add(m.team); });
  const tArr    = ['All', ...[...teams].sort()];
  const tabWrap = document.getElementById('teamTabs');
  if (tabWrap) {
    tabWrap.innerHTML = tArr.map(t => `<button class="ftab ${APP.teamFilter === t ? 'active' : ''}" onclick="setTeam('${t}',this)">${t}</button>`).join('');
  }
}

// ── FILTERS ──────────────────────────────────────────────────────
function setTeam(team, btn) {
  APP.teamFilter = team; APP.page = 1;
  document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyFilters();
}
function setStatus(s, btn) {
  APP.statusFilter = s; APP.page = 1;
  document.querySelectorAll('.sfbtn').forEach(b => b.className = 'sfbtn');
  if (btn) btn.className = 'sfbtn active-' + (s === 'all' ? 'all' : s === 'Delivered' ? 'del' : s === 'WIP' ? 'wip' : 'can');
  applyFilters(true);
}
function setMonth()    { APP.monthFilter = document.getElementById('monthSel').value; APP.page = 1; applyFilters(true); }
function setView(view, btn) {
  APP.view = view; APP.page = 1;
  document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyFilters();
}
function setPageSize() { APP.pageSize = parseInt(document.getElementById('pageSizeSel').value, 10) || 12; APP.page = 1; applyFilters(); }
function goPage(p)     { APP.page = Math.max(1, p); applyFilters(); }

function setTeamClick(t) {
  const tabs = document.querySelectorAll('.ftab');
  let matchedBtn = [...tabs].find(b => b.textContent === t);
  tabs.forEach(b => b.classList.remove('active'));
  if (matchedBtn) matchedBtn.classList.add('active');
  setTeam(t, null);
}

function applyPreset(kind) {
  if (kind === 'manager') { APP.teamFilter = 'All'; APP.statusFilter = 'all';   APP.view = 'cards'; document.getElementById('sortSel').value = 'deliveredAmt'; }
  if (kind === 'wip')     { APP.teamFilter = 'All'; APP.statusFilter = 'WIP';   APP.view = 'table'; document.getElementById('sortSel').value = 'wipAmt'; }
  if (kind === 'dark')    { APP.teamFilter = 'Dark Rankers'; APP.statusFilter = 'all'; APP.view = 'cards'; document.getElementById('sortSel').value = 'deliveredAmt'; }
  if (kind === 'target')  { APP.teamFilter = 'All'; APP.statusFilter = 'all';   APP.view = 'cards'; document.getElementById('sortSel').value = 'progress'; }
  APP.page = 1;
  document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
  const tabs       = document.querySelectorAll('.ftab');
  const matchedBtn = [...tabs].find(b => b.textContent === APP.teamFilter);
  if (matchedBtn) matchedBtn.classList.add('active'); else if (tabs[0]) tabs[0].classList.add('active');
  document.querySelectorAll('.sfbtn').forEach(b => b.className = 'sfbtn');
  const sid  = APP.statusFilter === 'all' ? 'all' : APP.statusFilter === 'Delivered' ? 'del' : APP.statusFilter === 'WIP' ? 'wip' : 'can';
  const sbtn = document.getElementById(`sf-${sid}`); if (sbtn) sbtn.className = `sfbtn active-${sid}`;
  syncControlsFromState();
  applyFilters(true);
}

function applyFilters(reAgg = false) {
  if (reAgg) APP.members = reAggregate(APP.monthFilter, APP.statusFilter);
  const srch = document.getElementById('srch').value.toLowerCase();
  const sort = document.getElementById('sortSel').value;
  let filtered = APP.members.filter(m => {
    if (APP.teamFilter !== 'All' && m.team !== APP.teamFilter) return false;
    if (!srch) return true;
    if (m.name.toLowerCase().includes(srch))     return true;
    if (m.fullName.toLowerCase().includes(srch)) return true;
    if (m.team.toLowerCase().includes(srch))     return true;
    return (m.projects || []).some(p =>
      (p.order   || '').toLowerCase().includes(srch) ||
      (p.client  || '').toLowerCase().includes(srch) ||
      (p.service || '').toLowerCase().includes(srch) ||
      (p.assign  || '').toLowerCase().includes(srch)
    );
  });
  if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
  else                 filtered.sort((a, b) => (b[sort] || 0) - (a[sort] || 0));
  APP.filteredMembers = filtered;
  const totalPages = Math.max(1, Math.ceil(filtered.length / APP.pageSize));
  APP.page = Math.min(APP.page, totalPages);
  const start = (APP.page - 1) * APP.pageSize;
  APP.pageMembers = filtered.slice(start, start + APP.pageSize);
  document.getElementById('mbadge').innerHTML = `Showing <b>${filtered.length}</b> of ${APP.members.length}`;
  document.getElementById('membersGrid').style.display    = APP.view === 'cards' ? 'grid'  : 'none';
  document.getElementById('membersTableWrap').style.display = APP.view === 'table' ? 'block' : 'none';
  document.getElementById('viewPill').textContent         = APP.view === 'cards' ? 'Cards View' : 'Table View';
  syncControlsFromState();
  updateUrlState();
  try { renderDept();          } catch (e) { console.warn('renderDept', e); }
  try { renderKpiStrip();      } catch (e) { console.warn('renderKpiStrip', e); }
  try { renderStatusCards();   } catch (e) { console.warn('renderStatusCards', e); }
  try { renderSpotlight();     } catch (e) { console.warn('renderSpotlight', e); }
  try { renderTeams();         } catch (e) { console.warn('renderTeams', e); }
  try { renderMembers(APP.pageMembers);      } catch (e) { console.warn('renderMembers', e); }
  try { renderMembersTable(APP.pageMembers); } catch (e) { console.warn('renderMembersTable', e); }
  try { renderPager(filtered.length, totalPages); } catch (e) { console.warn('renderPager', e); }
  try { renderAuditPanels();   } catch (e) { console.warn('renderAuditPanels', e); }
  try { renderLeaderboard();   } catch (e) { console.warn('renderLeaderboard', e); }
}

// ── RENDER — DEPT ─────────────────────────────────────────────────
function renderDept() {
  const ms      = APP.members;
  const summary = APP.summary?.dept || {};
  const totDel  = summary.achieved       !== undefined ? summary.achieved       : ms.reduce((a, m) => a + m.deliveredAmt, 0);
  const totWip  = summary.wipAmt         !== undefined ? summary.wipAmt         : ms.reduce((a, m) => a + m.wipAmt, 0);
  const uniqueP = summary.uniqueProjects !== undefined ? summary.uniqueProjects : new Set(ms.flatMap(m => m.projects.map(p => p.order))).size;
  const pct = Math.min((totDel / DEPT_TARGET) * 100, 100);
  const rem = DEPT_TARGET - totDel;
  document.getElementById('deptHeading').textContent = fmtK(totDel) + ' / ' + fmtK(DEPT_TARGET);
  document.getElementById('deptSub').textContent     = `Department monthly target — ${ms.length} members, ${APP.monthFilter === 'all' ? 'All Time' : APP.monthFilter}`;
  document.getElementById('deptTgt').textContent     = `Target: ${fmt(DEPT_TARGET)}`;
  setTimeout(() => {
    document.getElementById('deptFill').style.width = pct + '%';
    const circ = 2 * Math.PI * 42, off = circ * (1 - pct / 100);
    document.getElementById('dRing').style.strokeDashoffset = off;
    document.getElementById('dRingPct').textContent         = pct.toFixed(1) + '%';
  }, 100);
  document.getElementById('deptKpis').innerHTML = `
    <div class="dkpi"><div class="dkpi-val gn">${fmt(totDel)}</div><div class="dkpi-lbl">Achieved</div></div>
    <div class="dkpi"><div class="dkpi-val ${rem > 0 ? 'yw' : 'gn'}">${rem > 0 ? '-' + fmt(rem) : '+' + fmt(Math.abs(rem))}</div><div class="dkpi-lbl">Remaining</div></div>
    <div class="dkpi"><div class="dkpi-val yw">${fmt(totWip)}</div><div class="dkpi-lbl">WIP Pipeline</div></div>
    <div class="dkpi"><div class="dkpi-val pu">${uniqueP}</div><div class="dkpi-lbl">Unique Orders</div></div>
  `;
}

// ── RENDER — KPI STRIP ────────────────────────────────────────────
function renderKpiStrip() {
  const ms      = APP.members;
  const summary = APP.summary?.dept || {};
  const audit   = APP.audit || {};
  
  // Calculate counts and values from the current filtered members (ms)
  // this ensures the counts match the grid when filters are applied.
  // Using unique project order IDs for counts (delC, wipC, canC)
  const allProjs = ms.flatMap(m => m.projects);
  const mData   = {
    projC: new Set(allProjs.map(p => p.order)).size,
    projV: ms.reduce((a, m) => a + m.deliveredAmt + m.wipAmt, 0),
    runC:  new Set(allProjs.filter(p => p.status === 'WIP' || p.status === 'Revision').map(p => p.order)).size,
    runV:  ms.reduce((a, m) => a + m.wipAmt, 0),
    delC:  new Set(allProjs.filter(p => p.status === 'Delivered').map(p => p.order)).size,
    delV:  ms.reduce((a, m) => a + m.deliveredAmt, 0),
    wipC:  new Set(allProjs.filter(p => p.status === 'WIP' || p.status === 'Revision').map(p => p.order)).size,
    wipV:  ms.reduce((a, m) => a + m.wipAmt, 0),
    canC:  new Set(allProjs.filter(p => p.status === 'Cancelled').map(p => p.order)).size,
  };
  
  const bestMember = [...APP.filteredMembers].sort((a, b) => b.deliveredAmt - a.deliveredAmt)[0];
  const allTeams   = [...new Set(ms.map(m => m.team))].filter(Boolean);
  const teamScores = allTeams.map(t => {
    const tms = ms.filter(m => m.team === t);
    const amt = tms.reduce((a, m) => a + m.deliveredAmt, 0);
    const tgt = TEAM_TARGETS[t] || (tms.length * MEM_TARGET);
    return { name: t, amt, pct: tgt > 0 ? Math.round((amt / tgt) * 10000) / 100 : 0 };
  }).sort((a, b) => b.pct - a.pct);
  const bestTeam = teamScores[0];
  const strip    = document.getElementById('kpiStrip');
  if (!strip) return;
  strip.innerHTML = `
    <div class="kpi-row">
      <div class="kpi-card" style="--kcol:#a5b4fc"><div class="kpi-label">Project</div><div class="kpi-body"><div class="kpi-count">${mData.projC}</div><div class="kpi-val">${fmt(mData.projV)}</div></div></div>
      <div class="kpi-card" style="--kcol:#3b82f6"><div class="kpi-label">Running</div><div class="kpi-body"><div class="kpi-count">${mData.runC}</div><div class="kpi-val">${fmt(mData.runV)}</div></div></div>
      <div class="kpi-card" style="--kcol:#10b981"><div class="kpi-label">Delivery</div><div class="kpi-body"><div class="kpi-count">${mData.delC}</div><div class="kpi-val">${fmt(mData.delV)}</div></div></div>
      <div class="kpi-card" style="--kcol:#f59e0b"><div class="kpi-label">WIP</div><div class="kpi-body"><div class="kpi-count">${mData.wipC}</div><div class="kpi-val">${fmt(mData.wipV)}</div></div></div>
      <div class="kpi-card" style="--kcol:#ef4444"><div class="kpi-label">Cancel</div><div class="kpi-body"><div class="kpi-count">${mData.canC}</div><div class="kpi-val">Audit</div></div></div>
    </div>
    <div class="spot-row">
      <div class="kpi-card kpi-spot" style="--kcol:#f59e0b">
        <div class="kps-icon">🏆</div>
        <div class="kps-info"><h4>Best Performer</h4><div>${escapeHTML(bestMember?.name || '—')}</div><p>${bestMember ? fmt(bestMember.deliveredAmt) + ' delivered' : 'No data'}</p></div>
      </div>
      <div class="kpi-card kpi-spot" style="--kcol:#6366f1">
        <div class="kps-icon">🔥</div>
        <div class="kps-info"><h4>Best Team</h4><div>${escapeHTML(bestTeam?.name || '—')}</div><p>${bestTeam ? bestTeam.pct.toFixed(1) + '% of target · ' + fmt(bestTeam.amt) : 'No data'}</p></div>
      </div>
    </div>`;
}

// ── RENDER — STATUS CARDS ─────────────────────────────────────────
function renderStatusCards() {
  document.getElementById('sourcePill').textContent = `Source: ${APP.source}`;
  document.getElementById('syncPill').textContent   = `Last Sync: ${lastUpdated ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--'}`;
  document.getElementById('auditRows').textContent      = APP.audit.seoSmmRows  || 0;
  document.getElementById('auditMatched').textContent   = APP.audit.matchedRows  || 0;
  document.getElementById('auditUnmatched').textContent = APP.audit.unmatchedRows || 0;
  document.getElementById('auditProjects').textContent  = APP.audit.uniqueOrders || 0;
  const visibleTeams = new Set(APP.filteredMembers.map(m => m.team)).size;
  const start = APP.filteredMembers.length ? ((APP.page - 1) * APP.pageSize) + 1 : 0;
  const end   = Math.min(APP.page * APP.pageSize, APP.filteredMembers.length);
  document.getElementById('viewMembers').textContent = APP.filteredMembers.length;
  document.getElementById('viewTeams').textContent   = visibleTeams;
  document.getElementById('viewPage').textContent    = `${APP.page} / ${Math.max(1, Math.ceil(APP.filteredMembers.length / APP.pageSize))}`;
  document.getElementById('viewRange').textContent   = APP.filteredMembers.length ? `${start}-${end}` : '0';
  document.getElementById('memberSectionMeta').textContent = `Showing ${start || 0}${APP.filteredMembers.length ? `-${end}` : ''} of ${APP.filteredMembers.length} filtered members`;
  document.getElementById('savedViewMeta').textContent     = `URL synced · ${APP.teamFilter} · ${APP.statusFilter} · ${APP.monthFilter === 'all' ? 'All Time' : APP.monthFilter}`;
}

// ── RENDER — SPOTLIGHT ────────────────────────────────────────────
function renderSpotlight() {
  const sorted    = [...APP.filteredMembers].sort((a, b) => b.deliveredAmt - a.deliveredAmt).slice(0, 3);
  const medals    = ['🥇', '🥈', '🥉'], rankClass = ['rank-1', 'rank-2', 'rank-3'];
  document.getElementById('spotGrid').innerHTML = sorted.map((m, i) => {
    const [c1, c2] = memberPalette(m.name);
    const pct = Math.min(m.progress, 100);
    const hit = m.progress >= 100;
    return `
    <div class="spot-card ${rankClass[i]}">
      ${hit ? '<div class="spot-confetti-icon">🎉</div>' : ''}
      <span class="spot-medal">${medals[i]}</span>
      <div class="spot-rank-num">#${i + 1}</div>
      <div class="spot-avatar" style="background:linear-gradient(135deg,${c1},${c2});box-shadow:0 4px 16px ${c1}55">${m.name[0]}</div>
      <div class="spot-name">${m.name}</div>
      <div class="spot-full">${m.fullName} · <span style="color:${TC[m.team]?.color || '#a5b4fc'}">${m.team}</span></div>
      <div class="spot-amt">${fmt(m.deliveredAmt)}</div>
      <div class="spot-prog-bar"><div class="spot-prog-fill" style="width:${pct}%;background:${pctG(m.progress)}"></div></div>
      <div class="spot-stats">
        <span><b>${m.delivered}</b> delivered</span>
        <span><b>${m.progress.toFixed(1)}%</b> target</span>
        ${hit ? '<span style="color:#10b981;font-weight:800">✅ Target Hit!</span>' : ''}
      </div>
    </div>`;
  }).join('');
  APP.members.filter(m => m.progress >= 100).forEach(() => launchConfetti());
}

// ── RENDER — TEAMS ────────────────────────────────────────────────
function renderTeams() {
  const allMs     = APP.allMembers || APP.members;
  const teamOrder = ['GEO Rankers', 'Rank Riser', 'Search Apex', 'SMM'];
  
  const topTeam   = teamOrder.map(team => {
    const tms = APP.members.filter(m => m.team === team);
    const amt = tms.reduce((a, m) => a + m.deliveredAmt, 0);
    const tgt = TEAM_TARGETS[team] || (tms.length * MEM_TARGET);
    return { team, pct: tgt > 0 ? (amt / tgt) * 100 : 0 };
  }).sort((a, b) => b.pct - a.pct)[0]?.team;

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
  document.getElementById('teamGrid').innerHTML = teamOrder.map((tname, idx) => {
    const defaultColor = COLORS[idx % COLORS.length];
    const tc  = TC[tname] || { color: defaultColor, bg: `rgba(99,102,241,.15)`, icon: '🏢' };
    
    // Team stats logic: prioritize APP.summary.teams from Flask, fallback to member sums
    let del = 0, wip = 0, delivered = 0, wipCount = 0, revCount = 0, canCount = 0, proj = 0;
    
    if (APP.summary && APP.summary.teams && APP.summary.teams[tname]) {
      const ts = APP.summary.teams[tname];
      del = ts.deliveredAmt || ts.amt || 0;
      wip = ts.wipAmt || 0;
      delivered = ts.delivered || 0;
      wipCount = ts.wip || 0;
      revCount = ts.revision || 0;
      canCount = ts.cancelled || 0;
      proj = ts.projects || 0;
    } else {
      const ms  = APP.members.filter(m => m.team === tname);
      del = ms.reduce((a, m) => a + m.deliveredAmt, 0);
      wip = ms.reduce((a, m) => a + m.wipAmt, 0);
      delivered = ms.reduce((a, m) => a + m.delivered, 0);
      wipCount  = ms.reduce((a, m) => a + m.wip, 0);
      revCount  = ms.reduce((a, m) => a + m.revision, 0);
      canCount  = ms.reduce((a, m) => a + m.cancelled, 0);
      proj      = ms.reduce((a, m) => a + m.total, 0);
    }
    
    const tgt       = TEAM_TARGETS[tname] || (APP.members.filter(m => m.team === tname).length * MEM_TARGET);
    const remaining = Math.max(tgt - del, 0);
    const pct       = tgt > 0 ? Math.min((del / tgt) * 100, 100) : 0;
    const hit       = del >= tgt && tgt > 0;
    const [healthText, healthCls] = teamHealth(pct);
    const leader = MGMT.leaders[tname]?.name || '';
    
    return `
    <div class="tc${APP.teamFilter === tname ? ' active' : ''}" style="--tcol:${tc.color}" onclick="setTeamClick('${tname}')">
      <div class="tc-glow"></div>
      <div class="tc-head"><div class="tc-icon">${tc.icon}</div><div class="tc-cnt">${APP.allMembers.filter(m => m.team === tname).length} members</div></div>
      <div class="tc-name">${tname}</div>
      ${leader ? `<div class="tc-leader">👤 ${leader}</div>` : ''}
      <div class="tc-flags">
        ${topTeam === tname ? '<span class="tc-flag top">Top Team</span>' : ''}
        <span class="tc-flag ${healthCls}">${healthText}</span>
      </div>
      <div class="tc-amt-row"><div class="tc-amt">${fmtK(del)}</div>${hit ? '<div class="tc-hit">Target Hit</div>' : ''}</div>
      <div class="tc-target"><strong>Achieved</strong> ${fmtK(del)} · <strong>Target</strong> ${fmtK(tgt)} · <strong>WIP</strong> ${fmtK(wip)}</div>
      <div class="tc-summary">
        <div class="tc-box"><div class="tc-box-lbl">Achieved</div><div class="tc-box-val">${fmtK(del)}</div></div>
        <div class="tc-box"><div class="tc-box-lbl">Target</div><div class="tc-box-val">${fmtK(tgt)}</div></div>
        <div class="tc-box"><div class="tc-box-lbl">Remaining</div><div class="tc-box-val">${fmtK(remaining)}</div></div>
      </div>
      <div class="tc-bar"><div class="tc-fill" style="width:0%" data-w="${pct}"></div></div>
      <div class="tc-stat-grid">
        <div class="tc-stat-item tc-stat-del"><div class="tc-stat-val">${delivered}</div><div class="tc-stat-lbl">✅ Delivery</div></div>
        <div class="tc-stat-item tc-stat-wip"><div class="tc-stat-val">${wipCount}</div><div class="tc-stat-lbl">🔄 WIP</div></div>
        <div class="tc-stat-item tc-stat-rev"><div class="tc-stat-val">${revCount}</div><div class="tc-stat-lbl">🔁 Revision</div></div>
        <div class="tc-stat-item tc-stat-can"><div class="tc-stat-val">${canCount}</div><div class="tc-stat-lbl">❌ Cancel</div></div>
        <div class="tc-stat-item tc-stat-tot"><div class="tc-stat-val">${proj}</div><div class="tc-stat-lbl">📦 Total</div></div>
        <div class="tc-stat-item tc-stat-pct"><div class="tc-stat-val" style="color:${pct>=100?'#10b981':pct>=70?'#3b82f6':pct>=40?'#f59e0b':'#ef4444'}">${pct.toFixed(0)}%</div><div class="tc-stat-lbl">🎯 Complete</div></div>
      </div>
    </div>`;
  }).join('');
  setTimeout(() => document.querySelectorAll('.tc-fill').forEach(el => el.style.width = el.dataset.w + '%'), 150);
}

// ── RENDER — MEMBERS ──────────────────────────────────────────────
function renderMembers(list) {
  const grid = document.getElementById('membersGrid');
  if (!list.length) {
    grid.innerHTML = '<div class="empty-state"><h3>No matching records found</h3><p>Try changing team, month, status, or search filters.</p></div>';
    return;
  }
  const sortedForRank = [...APP.filteredMembers].sort((a, b) => b.deliveredAmt - a.deliveredAmt);
  const currentRanks  = {}; sortedForRank.forEach((m, i) => currentRanks[m.name] = i + 1);

  grid.innerHTML = list.map((m, i) => {
    const [c1, c2] = memberPalette(m.name);
    const tc    = TC[m.team] || { color: '#6366f1', bg: 'rgba(99,102,241,.15)', border: 'rgba(99,102,241,.3)' };
    const pct   = Math.min(m.progress || 0, 100);
    const pc    = pctC(m.progress);
    const r     = 40, circ = 2 * Math.PI * r, off = circ * (1 - pct / 100);
    const hit   = m.progress >= 100;
    const seoC  = m.projects.filter(p => p.service.includes('SEO')).length;
    const smmC  = m.projects.filter(p => p.service.includes('SMM')).length;
    const rankNum = currentRanks[m.name] || '—';
    return `
    <div class="mc${hit ? ' target-hit' : ''}" style="animation-delay:${i * .04}s" onclick="openProj('${m.name}')">
      <div class="mc-head">
        <div class="mc-av" style="background:linear-gradient(135deg,${c1},${c2});box-shadow:0 4px 14px ${c1}55">${m.name[0]}</div>
        <div class="mc-info">
          <div class="mc-name">${m.name}${hit ? ' <span style="font-size:14px">🎯</span>' : ''}</div>
          <div class="mc-full">${m.fullName}</div>
        </div>
        <div class="mc-badges">
          <div class="midbadge">#${m.id}</div>
          <div class="tpill" style="background:${tc.bg};color:${tc.color};border-color:${tc.border}">${m.team.split(' ')[0]}</div>
          ${rankChangeHTML(m.name, rankNum)}
        </div>
      </div>
      <div class="mc-body">
        <div class="ring-row">
          <div class="ring-wrap">
            <svg class="ring-svg" width="76" height="76" viewBox="0 0 100 100">
              <circle class="ring-bg" cx="50" cy="50" r="${r}" stroke-width="10"/>
              <circle class="ring-fill" cx="50" cy="50" r="${r}" stroke-width="10" stroke="${pc}" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${circ.toFixed(1)}" data-off="${off.toFixed(1)}"/>
            </svg>
            <div class="ring-center"><div class="ring-pct" style="color:${pc}">${pct.toFixed(0)}%</div><div class="ring-sub">Done</div></div>
          </div>
          <div class="ring-details">
            <div class="rd-row"><span class="rd-lbl">Target</span><span class="rd-val">$${m.target.toLocaleString()}</span></div>
            <div class="rd-row"><span class="rd-lbl">Delivered</span><span class="rd-val" style="color:#10b981">${fmt(m.deliveredAmt)}</span></div>
            <div class="mtrack"><div class="mfill" style="width:0%;background:${pctG(m.progress)}" data-w="${pct}"></div></div>
            <div class="rd-row"><span class="rd-lbl">${m.remaining <= 0 ? 'Surplus' : 'Remaining'}</span><span class="rd-val" style="color:${m.remaining <= 0 ? '#10b981' : '#f59e0b'}">${fmt(Math.abs(m.remaining))}</span></div>
          </div>
        </div>
        ${(seoC || smmC) ? `<div class="svc-row">${seoC ? `<span class="svc-tag svc-seo">SEO · ${seoC}</span>` : ''}${smmC ? `<span class="svc-tag svc-smm">SMM · ${smmC}</span>` : ''}</div>` : ''}
        <div class="metrics">
          <div class="mbox m-total"><div class="mval">${m.total}</div><div class="mlbl">Total</div></div>
          <div class="mbox m-wip"><div class="mval">${(m.wip || 0) + (m.revision || 0)}</div><div class="mlbl">WIP</div></div>
          <div class="mbox m-del"><div class="mval">${m.delivered}</div><div class="mlbl">Done</div></div>
          <div class="mbox m-can"><div class="mval">${m.cancelled}</div><div class="mlbl">Cancel</div></div>
        </div>
        <div class="amts">
          <div class="abox a-del"><div class="albl">Delivered $</div><div class="aval">${fmt(m.deliveredAmt)}</div><div class="asub">${m.delivered} project${m.delivered !== 1 ? 's' : ''}</div></div>
          <div class="abox a-wip"><div class="albl">WIP Pipeline</div><div class="aval">${fmt(m.wipAmt)}</div><div class="asub">${(m.wip || 0) + (m.revision || 0)} active</div></div>
        </div>
        <button class="vbtn" onclick="event.stopPropagation();openProj('${m.name}')">📋 View Projects (${m.projects.length})</button>
      </div>
    </div>`;
  }).join('');
  setTimeout(() => {
    document.querySelectorAll('.ring-fill').forEach(el => el.style.strokeDashoffset = el.dataset.off);
    document.querySelectorAll('.mfill').forEach(el => el.style.width = el.dataset.w + '%');
  }, 200);
}

function renderMembersTable(list) {
  const body = document.getElementById('membersTableBody');
  if (!list.length) {
    body.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--m2);padding:26px 14px">No matching records for current filters.</td></tr>`;
    return;
  }
  const sortedForRank = [...APP.filteredMembers].sort((a, b) => b.deliveredAmt - a.deliveredAmt);
  const currentRanks  = {}; sortedForRank.forEach((m, i) => currentRanks[m.name] = i + 1);
  body.innerHTML = list.map(m => {
    const rank = currentRanks[m.name] || '—';
    const tc   = TC[m.team] || { color: '#6366f1', bg: 'rgba(99,102,241,.15)', border: 'rgba(99,102,241,.3)' };
    return `<tr class="m-row clickable-row" onclick="openProj('${m.name}')">
      <td>#${rank}</td>
      <td><strong>${escapeHTML(m.name)}</strong><div style="font-size:10px;color:var(--m2)">#${m.id} · ${escapeHTML(m.fullName)}</div></td>
      <td><span style="padding:3px 8px;border-radius:999px;background:${tc.bg};color:${tc.color};border:1px solid ${tc.border};font-size:10px;font-weight:700">${escapeHTML(m.team)}</span></td>
      <td>${m.delivered}</td><td>${(m.wip || 0) + (m.revision || 0)}</td><td>${m.cancelled}</td>
      <td style="font-weight:800;color:#89d8cf">${fmt(m.deliveredAmt)}</td>
      <td style="color:#e7c98e">${fmt(m.wipAmt)}</td>
      <td><strong style="color:${pctC(m.progress)}">${(m.progress || 0).toFixed(1)}%</strong></td>
    </tr>`;
  }).join('');
}

function renderPager(total, totalPages) {
  const pager = document.getElementById('pager');
  const start = total ? ((APP.page - 1) * APP.pageSize) + 1 : 0;
  const end   = Math.min(APP.page * APP.pageSize, total);
  const chips = [];
  for (let p = Math.max(1, APP.page - 2); p <= Math.min(totalPages, APP.page + 2); p++) {
    chips.push(`<button class="page-chip ${p === APP.page ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`);
  }
  pager.innerHTML = `
    <span class="section-meta">Showing ${start}${total ? `-${end}` : ''} of ${total}</span>
    <button class="pager-btn" ${APP.page <= 1 ? 'disabled' : ''} onclick="goPage(${APP.page - 1})">Previous</button>
    ${chips.join('')}
    <button class="pager-btn" ${APP.page >= totalPages ? 'disabled' : ''} onclick="goPage(${APP.page + 1})">Next</button>`;
}

function renderAuditPanels() {
  const note = APP.audit.unmatchedRows
    ? `${APP.audit.unmatchedRows} row(s) could not be assigned to tracked members.`
    : 'All SEO/SMM rows are assigned to tracked members.';
  document.getElementById('auditSummaryNote').textContent = note;
  const list = document.getElementById('auditList');
  if (!APP.audit.unmatchedItems?.length) {
    list.innerHTML = `<div class="audit-item"><div class="audit-assign">No unmatched items</div><div class="audit-note">Assignments currently look clean.</div></div>`;
    return;
  }
  list.innerHTML = APP.audit.unmatchedItems.map(item => `
    <div class="audit-item">
      <div class="audit-item-top"><div class="audit-assign">${escapeHTML(item.assign || 'Unassigned')}</div><div class="spill sp-warn">${escapeHTML(item.service)}</div></div>
      <div class="audit-meta">
        <span>Status: ${escapeHTML(item.status || 'N/A')}</span>
        <span>Order: ${escapeHTML(item.order || 'N/A')}</span>
        <span>Client: ${escapeHTML(item.client || 'N/A')}</span>
      </div>
    </div>`).join('');
}

// ── RENDER — LEADERBOARD ──────────────────────────────────────────
function renderLeaderboard() {
  const sorted = [...APP.filteredMembers].sort((a, b) => b.deliveredAmt - a.deliveredAmt);
  APP.prevRanks = saveRanks(sorted);
  const ri = i => i === 0 ? '<span class="rnum r1">🥇</span>' : i === 1 ? '<span class="rnum r2">🥈</span>' : i === 2 ? '<span class="rnum r3">🥉</span>' : `<span class="rnum" style="color:var(--m2)">${i + 1}</span>`;
  document.getElementById('lbBody').innerHTML = sorted.map((m, i) => {
    const [c1, c2] = memberPalette(m.name);
    const tc   = TC[m.team] || { color: '#6366f1', bg: 'rgba(99,102,241,.15)', border: 'rgba(99,102,241,.3)' };
    const pct  = Math.min(m.progress || 0, 100);
    const prev = APP.prevRanks[m.name];
    const diff = prev ? (prev - (i + 1)) : null;
    const chg  = diff === null ? '<span class="rank-chg rank-new">NEW</span>' : diff > 0 ? `<span class="rank-chg rank-up">↑${diff}</span>` : diff < 0 ? `<span class="rank-chg rank-dn">↓${Math.abs(diff)}</span>` : '<span class="rank-chg rank-eq">—</span>';
    return `<tr>
      <td>${ri(i)}</td><td>${chg}</td>
      <td><div style="display:flex;align-items:center;gap:9px">
        <div style="width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,${c1},${c2});display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;flex-shrink:0">${m.name[0]}</div>
        <div><div style="font-weight:700;font-size:12px">${m.name}</div><div style="font-size:10px;color:var(--m2)">#${m.id}</div></div>
      </div></td>
      <td><span style="padding:2px 7px;border-radius:20px;font-size:9px;font-weight:700;background:${tc.bg};color:${tc.color};border:1px solid ${tc.border}">${m.team}</span></td>
      <td style="color:#10b981;font-weight:800">${m.delivered}</td>
      <td style="color:#f59e0b;font-weight:700">${(m.wip || 0) + (m.revision || 0)}</td>
      <td style="color:#ef4444;font-weight:700">${m.cancelled}</td>
      <td style="font-weight:900;font-size:13px;color:#10b981">${fmt(m.deliveredAmt)}</td>
      <td style="color:#f59e0b;font-weight:600">${fmt(m.wipAmt)}</td>
      <td><div style="display:flex;align-items:center;gap:7px">
        <div class="mbar"><div class="mbar-fill" style="width:${pct}%;background:${pctG(m.progress)}"></div></div>
        <span style="font-size:11px;font-weight:800;color:${pctC(m.progress)}">${(m.progress || 0).toFixed(1)}%</span>
      </div></td>
    </tr>`;
  }).join('');
}

// ── PROJECT MODAL ─────────────────────────────────────────────────
function openProj(name) {
  modalMember = APP.members.find(x => x.name === name) || APP.allMembers.find(x => x.name === name);
  if (!modalMember) return;
  mTab = 'all';
  document.querySelectorAll('.mtab').forEach((t, i) => t.classList.toggle('active', i === 0));
  renderProjModal();
  openOverlay('projOverlay');
}
function renderProjModal() {
  const m = modalMember;
  const [c1, c2] = memberPalette(m.name);
  document.getElementById('mAv').style.background  = `linear-gradient(135deg,${c1},${c2})`;
  document.getElementById('mAv').style.boxShadow   = `0 4px 18px ${c1}55`;
  document.getElementById('mAv').textContent        = m.name[0];
  document.getElementById('mName').textContent      = m.name;
  document.getElementById('mSub').textContent       = m.fullName + ' · ' + m.team + ' · #' + m.id;
  document.getElementById('mKpis').innerHTML = `
    <div class="mkpi"><div class="mkpi-val" style="color:#a5b4fc">${m.total}</div><div class="mkpi-lbl">Total</div></div>
    <div class="mkpi"><div class="mkpi-val" style="color:#10b981">${m.delivered}</div><div class="mkpi-lbl">Delivered</div></div>
    <div class="mkpi"><div class="mkpi-val" style="color:#f59e0b">${(m.wip || 0) + (m.revision || 0)}</div><div class="mkpi-lbl">WIP</div></div>
    <div class="mkpi"><div class="mkpi-val" style="color:#10b981">${fmt(m.deliveredAmt)}</div><div class="mkpi-lbl">Delivered $</div></div>
    <div class="mkpi"><div class="mkpi-val" style="color:#f59e0b">${fmt(m.wipAmt)}</div><div class="mkpi-lbl">WIP $</div></div>`;
  const projs = (m.projects || []).filter(p => {
    if (mTab === 'all') return true;
    if (mTab === 'WIP') return p.status === 'WIP' || p.status === 'Revision';
    return p.status === mTab;
  });
  const body = document.getElementById('mBody');
  if (!projs.length) { body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--m2)">এই category-তে কোনো project নেই।</div>'; return; }
  body.innerHTML = projs.map(p => {
    const allParts = p.assign.split(/[\/,]/);
    const pool = new Set();
    allParts.forEach(tok => { const clean = normalizeAssigneeToken(tok).toLowerCase(); if (clean) pool.add(clean); });
    const sc  = pool.size || 1;
    const hasOrderLink = !!(p.link && p.link !== '#' && p.link !== 'None');
    const link = hasOrderLink ? `<a class="plink" href="${p.link}" target="_blank">Open Order</a>` : '';
    return `<div class="pc">
      <div class="pc-top"><span class="pc-ord">${p.order || 'N/A'}</span><span class="st st-${p.status}">${p.status}</span></div>
      <div class="pc-meta">
        <div class="pm"><label>Client</label><span>${p.client || 'N/A'}</span></div>
        <div class="pm"><label>Service</label><span>${p.service || 'N/A'}</span></div>
        <div class="pm"><label>Assigned</label><span style="font-size:10px;color:var(--m2)">${p.assign || '—'}</span></div>
        <div class="pm"><label>Order Date</label><span>${p.date || 'N/A'}</span></div>
        <div class="pm"><label>Delivered</label><span>${p.deliveredDate || '—'}</span></div>
        ${hasOrderLink ? `<div class="pm"><label>Order Link</label>${link}</div>` : ''}
      </div>
      ${p.status !== 'Cancelled' ? `<div class="pc-share"><div class="ps-l">Amount Share<div class="ps-c">$${p.amtX} ÷ ${sc} person${sc > 1 ? 's' : ''}</div></div><div class="ps-v">${fmt(p.share)}</div></div>` : ''}
    </div>`;
  }).join('');
}
function setMTab(tab, btn) {
  mTab = tab;
  document.querySelectorAll('.mtab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderProjModal();
}

// ── MANAGER VIEW ──────────────────────────────────────────────────
function openManager() {
  const ms       = APP.members;
  const allTeams = [...new Set(APP.allMembers.map(m => m.team))].filter(Boolean).sort();
  let totDel = 0, totWip = 0, totProj = 0, hitTarget = 0, totTgt = 0;
  ms.forEach(m => { totDel += m.deliveredAmt; totWip += m.wipAmt; totProj += m.total; if (m.progress >= 100) hitTarget++; });
  allTeams.forEach(t => { const tms = APP.allMembers.filter(m => m.team === t); totTgt += (TEAM_TARGETS[t] || (tms.length * MEM_TARGET)); });
  const pct    = totTgt > 0 ? Math.min((totDel / totTgt) * 100, 100) : 0;
  const sorted = [...ms].sort((a, b) => b.deliveredAmt - a.deliveredAmt);
  const alerts = [];
  if (pct < 50)      alerts.push({ type: 'danger', msg: `⚠️ Department progress ${pct.toFixed(1)}% — মাস শেষ হওয়ার আগে target miss হতে পারে` });
  else if (pct < 75) alerts.push({ type: 'warn',   msg: `📊 Department ${pct.toFixed(1)}% complete — আরও push দরকার` });
  else               alerts.push({ type: 'good',   msg: `✅ Department on track — ${pct.toFixed(1)}% achieved` });
  ms.filter(m => m.total === 0).forEach(m       => alerts.push({ type: 'warn', msg: `⚠️ ${m.name} (${m.team}) — এখনও কোনো project নেই` }));
  ms.filter(m => m.progress >= 100).forEach(m  => alerts.push({ type: 'good', msg: `🎯 ${m.name} target hit করেছে — ${fmt(m.deliveredAmt)}` }));

  document.getElementById('mgrSub').textContent  = `Manager: ${MGMT.manager.name} · ${APP.monthFilter === 'all' ? 'All Time' : APP.monthFilter}`;
  document.getElementById('mgrBody').innerHTML   = `
    <div class="mgr-grid">
      <div class="mgr-kpi"><div class="mgr-kpi-val" style="color:#6366f1">${fmtK(totDel)}</div><div class="mgr-kpi-lbl">Total Delivered</div></div>
      <div class="mgr-kpi"><div class="mgr-kpi-val" style="color:#10b981">${fmtK(totTgt)}</div><div class="mgr-kpi-lbl">Combined Target</div></div>
      <div class="mgr-kpi"><div class="mgr-kpi-val" style="color:#a5b4fc">${totProj}</div><div class="mgr-kpi-lbl">Total Projects</div></div>
      <div class="mgr-kpi"><div class="mgr-kpi-val" style="color:#10b981">${hitTarget} / ${ms.length}</div><div class="mgr-kpi-lbl">Target Hitters</div></div>
    </div>
    <div style="margin-bottom:16px">
      <div style="font-size:12px;color:var(--m2);margin-bottom:6px">Department Progress: <b style="color:#a5b4fc">${pct.toFixed(1)}%</b> of ${fmt(totTgt)}</div>
      <div style="height:8px;background:rgba(255,255,255,.05);border-radius:50px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#6366f1,#06b6d4);border-radius:50px;transition:width 1s ease"></div>
      </div>
    </div>
    <div style="margin-bottom:14px">${alerts.map(a => `<div class="mgr-alert ${a.type}">${a.msg}</div>`).join('')}</div>
    <div class="stitle" style="margin-bottom:14px">Team Summary</div>
    <div class="mgr-team-grid">
      ${allTeams.map(tname => {
        const tms  = APP.allMembers.filter(m => m.team === tname);
        const tDel = tms.reduce((a, m) => a + m.deliveredAmt, 0);
        const tWip = tms.reduce((a, m) => a + m.wipAmt, 0);
        const tgt  = TEAM_TARGETS[tname] || (tms.length * MEM_TARGET);
        const tPct = tgt > 0 ? Math.min((tDel / tgt) * 100, 100) : 0;
        const tc   = TC[tname] || { color: '#6366f1' };
        const leader = MGMT.leaders[tname]?.name || '';
        return `<div class="mgr-team-card" style="--tcol:${tc.color}">
          <div class="mgr-team-name">${tname}</div>
          <div class="mgr-team-leader">👤 ${leader} · ${tms.length} members</div>
          <div class="mgr-team-amt" style="color:${tc.color}">${fmt(tDel)}</div>
          <div class="mgr-tbar"><div class="mgr-tbar-fill" style="width:${tPct}%;background:${tc.color}"></div></div>
          <div class="mgr-tstats"><span><b>${tms.reduce((a,m)=>a+m.delivered,0)}</b> delivered</span><span><b>${fmt(tWip)}</b> WIP</span><span><b>${tPct.toFixed(0)}%</b> target</span></div>
        </div>`;
      }).join('')}
    </div>
    <div class="stitle" style="margin-bottom:12px">Individual Ranking</div>
    <table class="mgr-rank-table">
      <thead><tr><th>Rank</th><th>Member</th><th>Team</th><th>Delivered $</th><th>WIP $</th><th>Progress</th><th>Status</th></tr></thead>
      <tbody>${sorted.map((m, i) => {
        const tc   = TC[m.team] || { color: '#6366f1' };
        const icon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
        const sl   = m.progress >= 100 ? '<span style="color:#10b981;font-weight:800">✅ Hit</span>' : m.progress >= 75 ? '<span style="color:#3b82f6;font-weight:700">🔵 Close</span>' : m.progress >= 50 ? '<span style="color:#f59e0b;font-weight:700">🟡 Mid</span>' : '<span style="color:#ef4444;font-weight:700">🔴 Behind</span>';
        return `<tr><td style="font-weight:900">${icon}</td><td style="font-weight:700">${m.name}<div style="font-size:10px;color:var(--m2)">${m.fullName}</div></td><td><span style="color:${tc.color};font-weight:700;font-size:11px">${m.team}</span></td><td style="font-weight:800;color:#10b981">${fmt(m.deliveredAmt)}</td><td style="color:#f59e0b">${fmt(m.wipAmt)}</td><td style="font-weight:700;color:${pctC(m.progress)}">${m.progress.toFixed(1)}%</td><td>${sl}</td></tr>`;
      }).join('')}</tbody>
    </table>`;
  openOverlay('mgrOverlay');
}

// ── OVERLAY HELPERS ───────────────────────────────────────────────
function openOverlay(id)    { document.getElementById(id).classList.add('open');    document.body.style.overflow = 'hidden'; }
function closeOverlay(id)   { document.getElementById(id).classList.remove('open'); document.body.style.overflow = ''; }
function handleOC(e, id)    { if (e.target === document.getElementById(id)) closeOverlay(id); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeOverlay('projOverlay'); closeOverlay('mgrOverlay'); } });

// ── EXPORT ────────────────────────────────────────────────────────
function downloadCSV() {
  const ms      = [...APP.members].sort((a, b) => b.deliveredAmt - a.deliveredAmt);
  const headers = ['Rank', 'Name', 'Full Name', 'ID', 'Team', 'Target $', 'Delivered $', 'WIP $', 'Progress %', 'Delivered Count', 'WIP Count', 'Cancelled', 'Total Projects'];
  const rows    = ms.map((m, i) => [i + 1, m.name, m.fullName, m.id, m.team, m.target, m.deliveredAmt.toFixed(2), m.wipAmt.toFixed(2), m.progress.toFixed(1), m.delivered, m.wip + m.revision, m.cancelled, m.total]);
  const csv     = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob    = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url     = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `SEO_Performance_${APP.monthFilter === 'all' ? 'AllTime' : APP.monthFilter}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  showToast('📊 CSV download শুরু হয়েছে!', '#10b981');
}
function downloadPDF() {
  showToast('🖨️ Print dialog খুলছে...', '#a5b4fc');
  setTimeout(() => window.print(), 400);
}

// ── INIT ──────────────────────────────────────────────────────────
APP.prevRanks = loadPrevRanks();
applyUrlState();
if (STATIC_DATA && STATIC_DATA.length) {
  APP.allMembers = STATIC_DATA; APP.loaded = true; APP.source = 'Embedded Static Data';
  buildMonthOptions(); applyFilters(true);
}
syncControlsFromState();
window.addEventListener('scroll', updateSectionNav, { passive: true });
window.addEventListener('load', () => {
  updateSectionNav();
  const hid = (location.hash || '').replace('#', '');
  if (hid && document.getElementById(hid)) setTimeout(() => jumpSection(hid), 120);
});
refreshData();
setInterval(() => { if (!document.hidden) refreshData(true); }, 30000);
