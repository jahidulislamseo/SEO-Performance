/* ═══════════════════════════════════════════════════════════════
   tracker.js — Delivery Tracker page logic
   Requires: config.js, utils.js, api.js, followups.js
   ═══════════════════════════════════════════════════════════════ */

// ── STATE ────────────────────────────────────────────────────────
let ALL_PROJECTS = [];
let fuTabFilter  = '';
let msgCurrentKey  = null;
let msgCurrentStep = 1;
let SLIDE_INDEXES  = {};
let GLOBAL_TEMPLATES = {}; 

// ── REFRESH ALL ──────────────────────────────────────────────────
async function refreshAll(manual = false) {
  const icon = document.getElementById('rfIcon');
  if (manual) icon.classList.add('spin');
  
  await Promise.all([loadFollowups(), loadTemplates()]);
  
  try {
    // If manual, we tell the server to sync with Sheets first. 
    // If silent, we just pull from the DB (which is updated every 10 mins by server).
    const url = manual ? '/api/sync-delivered' : '/api/delivered-projects';
    const r = await fetch(url);
    ALL_PROJECTS = await r.json();
    
    document.getElementById('srcLabel').textContent = manual ? 'Live (Sheet Sync)' : 'Database (Fast)';
    if (manual) showToast('Data synced from Google Sheets ✓', '#10b981');
  } catch (e) {
    document.getElementById('srcLabel').textContent = 'Error';
    if (manual) showToast('Refresh failed', '#ef4444');
  }
  
  buildSelects();
  applyFilters();
  if (manual) icon.classList.remove('spin');
}

// ── SELECTS ──────────────────────────────────────────────────────
function buildSelects() {
  const members = new Set(), teams = new Set(), months = new Set();
  ALL_PROJECTS.forEach(p => {
    (p._members || []).forEach(n => members.add(n));
    (p._teams   || []).forEach(t => teams.add(t));
    const d = p.deliveredDate || p.date || '';
    if (d.length >= 7) months.add(d.substring(0, 7));
  });
  const mSel  = document.getElementById('memberSel');
  const tSel  = document.getElementById('teamSel');
  const moSel = document.getElementById('monthSel');
  const curM = mSel.value, curT = tSel.value, curMo = moSel.value;
  mSel.innerHTML  = '<option value="">All Members</option>' + [...members].sort().map(n => `<option value="${escapeHTML(n)}">${escapeHTML(n)}</option>`).join('');
  tSel.innerHTML  = '<option value="">All Teams</option>'   + [...teams].sort().map(t   => `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`).join('');
  moSel.innerHTML = '<option value="">All Months</option>'  + [...months].sort().reverse().map(mo => {
    const d   = new Date(mo + '-01');
    const lbl = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return `<option value="${mo}">${lbl}</option>`;
  }).join('');
  mSel.value = curM; tSel.value = curT; moSel.value = curMo;
}

function setFuTab(btn) {
  document.querySelectorAll('.fu-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  fuTabFilter = btn.dataset.fu;
  applyFilters();
}

// ── FILTERS ──────────────────────────────────────────────────────
function applyFilters() {
  const srch     = (document.getElementById('srch').value || '').toLowerCase();
  const mFilter  = document.getElementById('memberSel').value;
  const tFilter  = document.getElementById('teamSel').value;
  const moFilter = document.getElementById('monthSel').value;

  const list = ALL_PROJECTS.filter(p => {
    if (mFilter && !(p._members || []).includes(mFilter) && !(p.assign || '').toLowerCase().includes(mFilter.toLowerCase())) return false;
    if (tFilter && !(p._teams  || []).includes(tFilter)) return false;
    if (moFilter) {
      const d = p.deliveredDate || p.date || '';
      if (!d.startsWith(moFilter)) return false;
    }
    if (srch) {
      if (!(p.client  || '').toLowerCase().includes(srch) &&
          !(p.order   || '').toLowerCase().includes(srch) &&
          !(p.assign  || '').toLowerCase().includes(srch) &&
          !(p.service || '').toLowerCase().includes(srch)) return false;
    }
    if (fuTabFilter !== '') {
      const fu = (FOLLOWUPS[pkey(p)]?.followup) || 0;
      if (String(fu) !== fuTabFilter) return false;
    }
    return true;
  });

  updateKpis();
  renderList(list);
  document.getElementById('badge').innerHTML = `Showing <b>${list.length}</b> of ${ALL_PROJECTS.length}`;
}

function updateKpis() {
  const total    = ALL_PROJECTS.length;
  const noFu     = ALL_PROJECTS.filter(p => !(FOLLOWUPS[pkey(p)]?.followup)).length;
  const inProg   = ALL_PROJECTS.filter(p => { const f = FOLLOWUPS[pkey(p)]?.followup || 0; return f > 0 && f < 5; }).length;
  const done5    = ALL_PROJECTS.filter(p => (FOLLOWUPS[pkey(p)]?.followup || 0) === 5).length;
  const sold     = ALL_PROJECTS.filter(p => (FOLLOWUPS[pkey(p)]?.followup || 0) >= 6).length;
  const withRmk  = ALL_PROJECTS.filter(p => (FOLLOWUPS[pkey(p)]?.remark || '').trim().length > 0).length;
  
  document.getElementById('kTotal').textContent  = total;
  document.getElementById('kNoFu').textContent   = noFu;
  document.getElementById('kInProg').textContent = inProg;
  document.getElementById('kDone5').textContent  = done5;
  if(document.getElementById('kSold')) document.getElementById('kSold').textContent = sold;
  document.getElementById('kWithRmk').textContent = withRmk;
}

// ── RENDER LIST ──────────────────────────────────────────────────
const FU_COLORS = ['var(--muted)', '#60a5fa', '#fbbf24', '#f472b6', '#c084fc', '#34d399', '#f59e0b'];
const FU_LABELS = ['No follow-up yet', '1st follow-up done', '2nd follow-up done', '3rd follow-up done', '4th follow-up done', 'All 5 done ✓', 'Converted / Sold 💰'];

function renderList(list) {
  const el = document.getElementById('dtList');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state-tracker"><h3>📭</h3><p>No delivered projects match the current filters.</p></div>`;
    return;
  }

  // 1. Group by Client
  const grouped = {};
  list.forEach(p => {
    const client = p.client || 'Unknown Client';
    if (!grouped[client]) grouped[client] = [];
    grouped[client].push(p);
  });

  // 2. Render Cards
  el.innerHTML = Object.entries(grouped).map(([client, projects]) => {
    const clientId = client.replace(/\W/g, '_');
    const currentIndex = SLIDE_INDEXES[clientId] || 0;
    
    // Sort projects by date descending (within group)
    projects.sort((a, b) => (b.deliveredDate || b.date || '').localeCompare(a.deliveredDate || a.date || ''));

    const totalAmt = projects.reduce((sum, p) => sum + (p.amtX || 0), 0);
    const hasMultiple = projects.length > 1;

    // Determine Urgency and Card Status
    // If ANY project in the group has 0 follow-ups, it's fu-none
    // If all have >= 5, it's fu-complete
    const allFu = projects.map(p => FOLLOWUPS[pkey(p)]?.followup || 0);
    const minFu = Math.min(...allFu);
    const maxFu = Math.max(...allFu);
    
    let cardCls = 'dt-card';
    if (minFu >= 6) cardCls += ' fu-sold';
    else if (minFu === 0) cardCls += ' fu-none';
    else if (minFu >= 5) cardCls += ' fu-complete';
    else if (minFu < 2) cardCls += ' fu-urgent';

    return `
    <div class="${cardCls}" id="card-${clientId}">
      <div class="dt-top">
        <div class="dt-info">
          <div class="dt-client-row">
            <div class="dt-client">${escapeHTML(client)}</div>
            ${hasMultiple ? `<div class="dt-count">${projects.length} Orders</div>` : ''}
          </div>
        </div>
        <div class="dt-right">
          <div class="dt-amt-total">${fmt(totalAmt)}</div>
          <div class="dt-amt-sub">Client Total</div>
        </div>
      </div>

      <div class="dt-slider-container">
        <div class="dt-slider-track" id="track-${clientId}" style="transform: translateX(-${currentIndex * 100}%)">
          ${projects.map((p, idx) => renderSlide(p, idx)).join('')}
        </div>
        
        ${hasMultiple ? `
          <button class="dt-slider-btn prev" onclick="moveSlide('${clientId}', -1)">❮</button>
          <button class="dt-slider-btn next" onclick="moveSlide('${clientId}', 1)">❯</button>
        ` : ''}
      </div>

      ${hasMultiple ? `
        <div class="dt-dot-nav">
          ${projects.map((_, idx) => `
            <div class="dt-dot ${idx === currentIndex ? 'active' : ''}" onclick="setSlide('${clientId}', ${idx})"></div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Follow-up persistent status hint for the *active* slide is handled by the slide content -->
    </div>`;
  }).join('');
}

function renderSlide(p, idx) {
  const key     = pkey(p);
  const fd      = FOLLOWUPS[key] || {};
  const fu      = fd.followup || 0;
  const safeKey = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  
  const stepsHTML = [1, 2, 3, 4, 5, 6].map(n => {
    const done = n <= fu || (fu >= 6 && n <= 5); // If sold, all previous are implied done
    const label = n === 6 ? '💰' : n;
    const title = n === 6 ? 'Mark as Sold / New Project' : `Follow-up ${n}`;
    return `
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <button class="fu-step ${done ? 's' + n : ''} ${n===6 && fu>=6 ? 's6':''}" onclick="toggleStep('${safeKey}',${n})" title="${title}: ${done ? 'Done' : 'Pending'}">${done ? (n===6 ? '💰':'✓') : label}</button>
        <span class="fu-step-hint">${n === 6 ? 'SOLD' : ['1st', '2nd', '3rd', '4th', '5th'][n - 1]}</span>
      </div>`;
  }).join('');

  const assignees = (p.assign || '').split(/[\/,]/).map(s => s.trim()).filter(Boolean).slice(0, 4);
  const teams     = p._teams || [];

  return `
  <div class="dt-slide">
    <div class="dt-slide-meta">
      <div class="meta-item">
        <span class="meta-lbl">Order ID</span>
        <span class="meta-val">📋 ${escapeHTML(p.order || 'N/A')}</span>
      </div>
      <div class="meta-item">
        <span class="meta-lbl">Delivered</span>
        <span class="meta-val">🗓 ${p.deliveredDate || p.date || '—'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-lbl">Service</span>
        <span class="meta-val">🔧 ${escapeHTML(p.service || '—')}</span>
      </div>
      <div class="meta-item">
        <span class="meta-lbl">Amount</span>
        <span class="meta-val" style="color:#10b981">${fmt(p.amtX)}</span>
      </div>
    </div>

    <div class="dt-meta">
      ${p.link && p.link !== '#' && p.link !== 'None' ? `<span><a href="${escapeHTML(p.link)}" target="_blank" style="color:#60a5fa;text-decoration:none;font-weight:700">↗ Order Link</a></span>` : ''}
      <div class="dt-assignees" style="margin-left:auto">
        ${teams.map(t => `<span class="tag team">${escapeHTML(t)}</span>`).join('')}
        ${assignees.map(a => `<span class="tag">${escapeHTML(a)}</span>`).join('')}
      </div>
    </div>

    <div class="slide-actions">
      <div class="fu-section">
        <div class="fu-label">Step Progress — <span style="color:${FU_COLORS[fu]}">${FU_LABELS[fu]}</span></div>
        <div class="fu-steps">${stepsHTML}</div>
      </div>
      <div class="copy-section">
        <div class="fu-label">Communication</div>
        <div class="copy-btns">
          <button class="copy-btn next" onclick="openMsgModal('${safeKey}',${Math.min(fu + 1, 5)})">📋 F/U ${Math.min(fu + 1, 5)} Message</button>
          <button class="copy-btn" onclick="openMsgModal('${safeKey}',null)">Customize...</button>
        </div>
      </div>
      <div class="remark-section">
        <div class="fu-label">Client Feedback / Internal Note</div>
        <textarea class="remark-input" placeholder="Enter status update or client response here..." onblur="saveRemark('${safeKey}',this.value)">${escapeHTML(fd.remark || '')}</textarea>
        <span class="dt-saved" id="saved-${key.replace(/\W/g,'_')}">Saved ✓</span>
      </div>
    </div>
  </div>`;
}

// ── SLIDER CONTROL ────────────────────────────────────────────────
function moveSlide(clientId, dir) {
  const track = document.getElementById(`track-${clientId}`);
  const slides = track.children.length;
  let current = SLIDE_INDEXES[clientId] || 0;
  
  current += dir;
  if (current >= slides) current = 0;
  if (current < 0) current = slides - 1;
  
  setSlide(clientId, current);
}

function setSlide(clientId, idx) {
  SLIDE_INDEXES[clientId] = idx;
  const track = document.getElementById(`track-${clientId}`);
  track.style.transform = `translateX(-${idx * 100}%)`;
  
  // Update dots
  const dots = track.parentElement.nextElementSibling;
  if (dots && dots.classList.contains('dt-dot-nav')) {
    Array.from(dots.children).forEach((dot, i) => {
      dot.classList.toggle('active', i === idx);
    });
  }
}

// ── FOLLOW-UP STEP TOGGLE ─────────────────────────────────────────
function toggleStep(key, step) {
  const cur    = FOLLOWUPS[key]?.followup || 0;
  const newVal = cur === step ? step - 1 : step;
  const remark = FOLLOWUPS[key]?.remark || '';
  FOLLOWUPS[key] = { ...(FOLLOWUPS[key] || {}), key, followup: newVal, remark };
  saveFollowup(key, newVal, remark);
  applyFilters();
  try {
    const el = document.getElementById('saved-' + key);
    if (el) { el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 1800); }
  } catch (e) {}
  showToast(`Follow-up ${newVal} marked`, '#10b981');
}

// ── REMARK SAVE ───────────────────────────────────────────────────
function saveRemark(key, val) {
  const fu = FOLLOWUPS[key]?.followup || 0;
  FOLLOWUPS[key] = { ...(FOLLOWUPS[key] || {}), key, followup: fu, remark: val };
  saveFollowup(key, fu, val);
  updateKpis();
  
  const savedId = 'saved-' + key.replace(/\W/g,'_');
  const el = document.getElementById(savedId);
  if (el) { el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 1800); }
  showToast('Remark saved', '#6366f1');
}

// ── MESSAGE MODAL ─────────────────────────────────────────────────
async function loadTemplates() {
  try {
    const r = await fetch('/api/templates');
    GLOBAL_TEMPLATES = await r.json();
  } catch(e) { console.warn('Templates load failed', e); }
}

async function updateTemplate() {
  const txt = document.getElementById('msgText').value;
  GLOBAL_TEMPLATES[msgCurrentStep] = txt;
  try {
    const r = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(GLOBAL_TEMPLATES)
    });
    if (r.ok) showToast('Template updated! ✓', '#10b981');
  } catch(e) { showToast('Save failed', '#ef4444'); }
}

function getProcessedMsg(step, p) {
  let tpl = GLOBAL_TEMPLATES[step] || "";
  return tpl
    .replace(/{order}/g,   p.order || 'N/A')
    .replace(/{client}/g,  p.client || 'Client')
    .replace(/{service}/g, p.service || 'SEO/SMM');
}

function openMsgModal(key, step) {
  msgCurrentKey = key;
  const p = ALL_PROJECTS.find(x => pkey(x) === key);
  if (!p) return;
  const fu = FOLLOWUPS[key]?.followup || 0;
  msgCurrentStep = step || Math.min(fu + 1, 5) || 1;

  document.getElementById('msgTitle').textContent = `Follow-up — ${escapeHTML(p.client || 'Client')}`;
  document.getElementById('msgSub').textContent   = `Order: ${p.order || 'N/A'} · Step: ${msgCurrentStep}`;

  document.getElementById('msgSteps').innerHTML = [1, 2, 3, 4, 5].map(n => `
    <button class="msg-step-btn ${n === msgCurrentStep ? 'active' : ''}" onclick="selectMsgStep(${n})">${n}${['st', 'nd', 'rd', 'th', 'th'][n - 1]} F/U</button>
  `).join('');
  
  document.getElementById('msgText').value = getProcessedMsg(msgCurrentStep, p);
  document.getElementById('msgOverlay').classList.add('open');
}

function selectMsgStep(n) {
  msgCurrentStep = n;
  document.querySelectorAll('.msg-step-btn').forEach((b, i) => b.classList.toggle('active', i + 1 === n));
  const p = ALL_PROJECTS.find(x => pkey(x) === msgCurrentKey);
  if (p) {
    document.getElementById('msgSub').textContent = `Order: ${p.order || 'N/A'} · Step: ${n}`;
    document.getElementById('msgText').value = getProcessedMsg(n, p);
  }
}

function closeMsgModal() {
  document.getElementById('msgOverlay').classList.remove('open');
}

function copyMsgText() {
  const txt = document.getElementById('msgText').value;
  navigator.clipboard.writeText(txt).then(() => {
    showToast(`Follow-up ${msgCurrentStep} message copied! ✓`, '#10b981');
    closeMsgModal();
    if (msgCurrentKey) {
      const fu = FOLLOWUPS[msgCurrentKey]?.followup || 0;
      if (msgCurrentStep > fu) {
        const remark = FOLLOWUPS[msgCurrentKey]?.remark || '';
        FOLLOWUPS[msgCurrentKey] = { ...(FOLLOWUPS[msgCurrentKey] || {}), key: msgCurrentKey, followup: msgCurrentStep, remark };
        saveFollowup(msgCurrentKey, msgCurrentStep, remark);
        applyFilters();
        showToast(`Follow-up ${msgCurrentStep} marked as done`, '#6366f1');
      }
    }
  }).catch(() => { prompt('Copy this message:', txt); });
}

// ── EXPORT TO CSV ────────────────────────────────────────────────
function exportToCSV() {
  const srch = (document.getElementById('srch').value || '').toLowerCase();
  // We export ONLY the currently filtered projects
  const rows = [];
  rows.push(['Client', 'Order ID', 'Delivered Date', 'Service', 'Amount', 'Assignees', 'Teams', 'Follow-up Status', 'Remark']);
  
  ALL_PROJECTS.forEach(p => {
    // Re-apply filters simplified
    const mFilter  = document.getElementById('memberSel').value;
    const tFilter  = document.getElementById('teamSel').value;
    const moFilter = document.getElementById('monthSel').value;
    
    if (mFilter && !(p._members || []).includes(mFilter) && !(p.assign || '').toLowerCase().includes(mFilter.toLowerCase())) return;
    if (tFilter && !(p._teams  || []).includes(tFilter)) return;
    if (moFilter && !(p.deliveredDate || p.date || '').startsWith(moFilter)) return;
    if (srch && !JSON.stringify(p).toLowerCase().includes(srch)) return;
    
    const key = pkey(p);
    const fu  = FOLLOWUPS[key]?.followup || 0;
    const rmk = (FOLLOWUPS[key]?.remark || '').replace(/"/g, '""');
    
    rows.push([
      `"${p.client}"`,
      `"${p.order}"`,
      `"${p.deliveredDate || p.date}"`,
      `"${p.service}"`,
      p.amtX,
      `"${(p._members || []).join(', ')}"`,
      `"${(p._teams   || []).join(', ')}"`,
      `"${FU_LABELS[fu]}"`,
      `"${rmk}"`
    ]);
  });
  
  if (rows.length <= 1) { showToast('Nothing to export', '#ef4444'); return; }
  
  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Delivery_Followups_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('CSV Exported Successfully ✓', '#10b981');
}

// ── FOOTER DATE ───────────────────────────────────────────────────
document.getElementById('fDate').textContent = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// ── INIT ──────────────────────────────────────────────────────────
refreshAll();
// Auto-refresh from Database every 10 minutes
setInterval(() => { if (!document.hidden) refreshAll(false); }, 600000);
