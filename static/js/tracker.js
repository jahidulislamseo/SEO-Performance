/* ═══════════════════════════════════════════════════════════════
   tracker.js — Delivery Tracker page logic
   Requires: config.js, utils.js, api.js, followups.js
   ═══════════════════════════════════════════════════════════════ */

// ── STATE ────────────────────────────────────────────────────────
let ALL_PROJECTS = [];
let fuTabFilter  = '';
let msgCurrentKey  = null;
let msgCurrentStep = 1;

// ── REFRESH ALL ──────────────────────────────────────────────────
async function refreshAll(silent = false) {
  const icon = document.getElementById('rfIcon');
  if (!silent) icon.classList.add('spin');
  await loadFollowups();
  try {
    ALL_PROJECTS = await fetchDeliveredFromSheets();
    document.getElementById('srcLabel').textContent = 'Live (Sheets)';
    if (!silent) showToast('Google Sheets থেকে data loaded', '#10b981');
  } catch (e) {
    try {
      ALL_PROJECTS = await fetchDeliveredFromApi();
      document.getElementById('srcLabel').textContent = 'Flask API';
      if (!silent) showToast('Flask API থেকে data loaded', '#3b82f6');
    } catch (e2) {
      document.getElementById('srcLabel').textContent = 'No Data';
      if (!silent) showToast('Data load failed', '#ef4444');
    }
  }
  buildSelects();
  applyFilters();
  icon.classList.remove('spin');
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
  const done5    = ALL_PROJECTS.filter(p => (FOLLOWUPS[pkey(p)]?.followup || 0) >= 5).length;
  const withRmk  = ALL_PROJECTS.filter(p => (FOLLOWUPS[pkey(p)]?.remark || '').trim().length > 0).length;
  document.getElementById('kTotal').textContent  = total;
  document.getElementById('kNoFu').textContent   = noFu;
  document.getElementById('kInProg').textContent = inProg;
  document.getElementById('kDone5').textContent  = done5;
  document.getElementById('kWithRmk').textContent = withRmk;
}

// ── RENDER LIST ──────────────────────────────────────────────────
const FU_COLORS = ['var(--muted)', '#60a5fa', '#fbbf24', '#f472b6', '#c084fc', '#34d399'];
const FU_LABELS = ['No follow-up yet', '1st follow-up done', '2nd follow-up done', '3rd follow-up done', '4th follow-up done', 'All 5 done ✓'];

function renderList(list) {
  const el = document.getElementById('dtList');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state-tracker"><h3>📭</h3><p>No delivered projects match the current filters.</p></div>`;
    return;
  }
  el.innerHTML = list.map(p => {
    const key     = pkey(p);
    const fd      = FOLLOWUPS[key] || {};
    const fu      = fd.followup || 0;
    const safeKey = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const cardCls = fu >= 5 ? 'dt-card fu-complete' : fu === 0 ? 'dt-card fu-none' : 'dt-card';

    const stepsHTML = [1, 2, 3, 4, 5].map(n => {
      const done = n <= fu;
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <button class="fu-step ${done ? 's' + n : ''}" onclick="toggleStep('${safeKey}',${n})" title="Follow-up ${n}: ${done ? 'Done — click to undo' : 'Click to mark as sent'}">${done ? '✓' : n}</button>
        <span class="fu-step-hint">${['1st', '2nd', '3rd', '4th', '5th'][n - 1]}</span>
      </div>`;
    }).join('');

    const assignees = (p.assign || '').split(/[\/,]/).map(s => s.trim()).filter(Boolean).slice(0, 4);
    const teams     = p._teams || [];
    return `<div class="${cardCls}">
      <div class="dt-top">
        <div class="dt-info">
          <div class="dt-client">${escapeHTML(p.client || 'Unknown Client')}</div>
          <div class="dt-meta">
            <span>📋 <b>${escapeHTML(p.order || 'No Order #')}</b></span>
            <span>🗓 ${p.deliveredDate || p.date || '—'}</span>
            <span>🔧 ${escapeHTML(p.service || '—')}</span>
            ${p.link && p.link !== '#' && p.link !== 'None' ? `<span><a href="${escapeHTML(p.link)}" target="_blank" style="color:#60a5fa;text-decoration:none;font-weight:700">↗ Order Link</a></span>` : ''}
          </div>
          <div class="dt-assignees">
            ${teams.map(t => `<span class="tag team">${escapeHTML(t)}</span>`).join('')}
            ${assignees.map(a => `<span class="tag">${escapeHTML(a)}</span>`).join('')}
          </div>
        </div>
        <div class="dt-right">
          <div class="dt-amt">${fmt(p.amtX)}</div>
          <div class="dt-fu-status" style="color:${FU_COLORS[fu]}">${FU_LABELS[fu]}</div>
          <span class="dt-saved" id="saved-${escapeHTML(key)}">Saved ✓</span>
        </div>
      </div>
      <div class="dt-bottom">
        <div class="fu-section">
          <div class="fu-label">Follow-up Steps</div>
          <div class="fu-steps">${stepsHTML}</div>
        </div>
        <div class="copy-section">
          <div class="copy-label">Send Message</div>
          <div class="copy-btns">
            <button class="copy-btn next" onclick="openMsgModal('${safeKey}',${Math.min(fu + 1, 5)})">📋 Follow-up ${Math.min(fu + 1, 5)} Message</button>
            <button class="copy-btn" onclick="openMsgModal('${safeKey}',null)">Choose...</button>
          </div>
        </div>
        <div class="remark-section">
          <div class="remark-label">Client Remark / Note</div>
          <textarea class="remark-input" placeholder="e.g. Client happy, asked for revision..." onblur="saveRemark('${safeKey}',this.value)">${escapeHTML(fd.remark || '')}</textarea>
        </div>
      </div>
    </div>`;
  }).join('');
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
  showToast('Remark saved', '#6366f1');
}

// ── MESSAGE MODAL ─────────────────────────────────────────────────
const MSG_TEMPLATES = [
  p => `Hi! Your project has been successfully delivered.\n\nOrder: ${p.order || p.client}\nService: ${p.service || 'SEO/SMM'}\n\nPlease review the delivery and share your feedback. We're here if you need any adjustments!\n\nThank you for working with us! 🙏`,
  p => `Hi! Hope you're doing well.\n\nThis is our 2nd follow-up regarding your recent delivery (Order: ${p.order || p.client}).\n\nWe'd love to hear your thoughts — did everything meet your expectations? Please let us know if you need anything.\n\nLooking forward to your response!`,
  p => `Hi! Checking in again (3rd follow-up) regarding Order: ${p.order || p.client}.\n\nWe want to make sure you're satisfied with the delivery. If there's anything you'd like us to review or improve, please don't hesitate to ask!\n\nYour feedback means a lot to us.`,
  p => `Hi! This is our 4th follow-up for Order: ${p.order || p.client}.\n\nWe noticed we haven't heard back yet. Could you please take a moment to review the delivery and confirm everything is in order?\n\nWe value your satisfaction and want to ensure you're happy with the results.`,
  p => `Hi! This is our 5th and final follow-up regarding Order: ${p.order || p.client}.\n\nWe would greatly appreciate your confirmation of the delivery. If you have any concerns or need revisions, please let us know at your earliest convenience.\n\nThank you for your time and trust in our services! 🙏`,
];

function openMsgModal(key, step) {
  msgCurrentKey = key;
  const p = ALL_PROJECTS.find(x => pkey(x) === key);
  if (!p) return;
  const fu = FOLLOWUPS[key]?.followup || 0;
  msgCurrentStep = step || Math.min(fu + 1, 5) || 1;

  document.getElementById('msgTitle').textContent = `Follow-up Message — ${escapeHTML(p.client || p.order || 'Client')}`;
  document.getElementById('msgSub').textContent   = `Order: ${p.order || 'N/A'} · Delivered: ${p.deliveredDate || p.date || '—'}`;

  document.getElementById('msgSteps').innerHTML = [1, 2, 3, 4, 5].map(n => `
    <button class="msg-step-btn ${n === msgCurrentStep ? 'active' : ''}" onclick="selectMsgStep(${n})">${n}${['st', 'nd', 'rd', 'th', 'th'][n - 1]} F/U</button>
  `).join('');
  document.getElementById('msgText').value = MSG_TEMPLATES[msgCurrentStep - 1](p);
  document.getElementById('msgOverlay').classList.add('open');
}

function selectMsgStep(n) {
  msgCurrentStep = n;
  document.querySelectorAll('.msg-step-btn').forEach((b, i) => b.classList.toggle('active', i + 1 === n));
  const p = ALL_PROJECTS.find(x => pkey(x) === msgCurrentKey);
  if (p) document.getElementById('msgText').value = MSG_TEMPLATES[n - 1](p);
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

// ── FOOTER DATE ───────────────────────────────────────────────────
document.getElementById('fDate').textContent = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// ── INIT ──────────────────────────────────────────────────────────
refreshAll();
setInterval(() => { if (!document.hidden) refreshAll(true); }, 60000);
