/* ═══════════════════════════════════════════════════════════════
   utils.js — Shared utility functions (pure, no DOM side-effects)
   Requires: config.js
   ═══════════════════════════════════════════════════════════════ */

// ── FORMATTING ──────────────────────────────────────────────────
const fmt  = n => '$' + Number(n||0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
const fmtK = n => n >= 1000 ? '$' + (n/1000).toFixed(1) + 'K' : fmt(n);

// ── HTML ESCAPING ────────────────────────────────────────────────
const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]));

// ── PROGRESS COLOURS ─────────────────────────────────────────────
const pctC = p => p >= 100 ? '#10b981' : p >= 75 ? '#3b82f6' : p >= 50 ? '#f59e0b' : p > 0 ? '#ef4444' : '#64748b';
const pctG = p => p >= 100
  ? 'linear-gradient(90deg,#10b981,#06b6d4)'
  : p >= 75
    ? 'linear-gradient(90deg,#3b82f6,#10b981)'
    : p >= 50
      ? 'linear-gradient(90deg,#f59e0b,#3b82f6)'
      : p > 0
        ? 'linear-gradient(90deg,#ef4444,#f59e0b)'
        : 'linear-gradient(90deg,#374151,#4b5563)';

// ── MEMBER AVATAR PALETTE ────────────────────────────────────────
const memberPalette = name => {
  const idx = ALL_MEMBERS.findIndex(x => x.name === name);
  return MC[(idx >= 0 ? idx : 0) % MC.length];
};

// ── TEAM HEALTH LABEL ────────────────────────────────────────────
const teamHealth = p =>
  p >= 100 ? ['Target Hit','good'] :
  p >= 70  ? ['On Track','good']   :
  p >= 40  ? ['Needs Push','warn'] :
             ['At Risk','risk'];

// ── DATE PARSING ─────────────────────────────────────────────────
function parseGvizDate(v) {
  if (!v) return '';
  const s = String(v).trim();
  if (s.startsWith('Date(') && s.endsWith(')')) {
    const p = s.slice(5, -1).split(',');
    return `${p[0]}-${(parseInt(p[1]) + 1).toString().padStart(2, '0')}-${p[2].trim().padStart(2, '0')}`;
  }
  // If it's already "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s;
  
  // Handle "April 7, 2026" or "7 April 2026"
  if (s.includes('2026')) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    for (let i = 0; i < months.length; i++) {
      if (s.includes(months[i])) {
        const dayMatch = s.match(/\b(\d{1,2})\b/);
        const day = dayMatch ? dayMatch[1].padStart(2, '0') : '01';
        return `2026-${(i + 1).toString().padStart(2, '0')}-${day}`;
      }
    }
  }
  return s;
}

// ── ASSIGNEE PARSING ─────────────────────────────────────────────
function normalizeAssigneeToken(token) {
  return String(token || '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\b\d+%?\b/g, '')
    .replace(/%/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[-\s]+|[-\s]+$/g, '');
}

function parseAssignees(assignText) {
  const parts = String(assignText || '').split(/[\/,]/).map(v => v.trim()).filter(Boolean);
  const seen  = new Set(), exact = [];
  parts.forEach(part => {
    const key = normalizeAssigneeToken(part).toLowerCase();
    if (MEMBER_LOOKUP[key] && !seen.has(key)) {
      exact.push(MEMBER_LOOKUP[key]);
      seen.add(key);
    }
  });
  return exact;
}

// ── TOAST NOTIFICATION ───────────────────────────────────────────
function showToast(msg, color = '#a5b4fc') {
  const box = document.getElementById('toastBox');
  if (!box) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.style.borderColor = color + '44';
  t.style.color = color;
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), 4200);
}

// ── CONFETTI ─────────────────────────────────────────────────────
let _confettiRunning = false;
function launchConfetti() {
  if (_confettiRunning) return;
  _confettiRunning = true;
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) { _confettiRunning = false; return; }
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const pieces = Array.from({ length:80 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    w: 6 + Math.random() * 6, h: 6 + Math.random() * 6,
    color: ['#6366f1','#10b981','#f59e0b','#ec4899','#06b6d4','#a5b4fc'][Math.floor(Math.random()*6)],
    speed: 2 + Math.random() * 4, angle: Math.random() * Math.PI * 2,
    spin: Math.random() * .2 - .1, alpha: 1,
  }));
  let frame = 0;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.speed; p.angle += p.spin; p.alpha -= .008;
      if (p.alpha <= 0) return;
      ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y); ctx.rotate(p.angle);
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h); ctx.restore();
    });
    if (++frame < 200) requestAnimationFrame(animate);
    else { ctx.clearRect(0, 0, canvas.width, canvas.height); _confettiRunning = false; }
  };
  requestAnimationFrame(animate);
}
