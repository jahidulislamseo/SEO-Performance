/* ═══════════════════════════════════════════════════════════════
   followups.js — Follow-up persistence (MongoDB via Flask API)
   Requires: config.js
   ═══════════════════════════════════════════════════════════════ */

// ── STATE ────────────────────────────────────────────────────────
let FOLLOWUPS = {};

// ── KEY GENERATION ───────────────────────────────────────────────
function pkey(p) {
  return (p.order && p.order !== 'N/A' && p.order !== '')
    ? p.order
    : (p.client + '_' + (p.deliveredDate || p.date || ''));
}

// ── LOAD ALL ─────────────────────────────────────────────────────
async function loadFollowups() {
  try {
    const r = await fetch('/api/followups', { cache: 'no-store' });
    if (!r.ok) return;
    const docs = await r.json();
    FOLLOWUPS = {};
    docs.forEach(d => { if (d.key) FOLLOWUPS[d.key] = d; });
  } catch (e) { console.warn('followups load:', e); }
}

// ── SAVE ONE ─────────────────────────────────────────────────────
async function saveFollowup(key, followup, remark) {
  try {
    await fetch('/api/followups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, followup, remark }),
    });
    FOLLOWUPS[key] = { ...(FOLLOWUPS[key] || {}), key, followup, remark };
  } catch (e) { console.warn('followup save:', e); }
}
