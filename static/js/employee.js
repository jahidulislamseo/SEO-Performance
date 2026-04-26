'use strict';

/* ══════════════════════════════════════════════════════════════════
   MOCK DATA — self-contained demo (no backend required)
══════════════════════════════════════════════════════════════════ */

const EMPLOYEES = {
  "EMP001": {
    password:"pass123",
    profile:{id:"EMP001",name:"Jahidul Islam",fullName:"Md. Jahidul Islam",avatar:"JI",avatarColor:"linear-gradient(135deg,#2563eb,#7c3aed)",role:"Senior SEO Specialist",department:"GEO Rankers Dept.",email:"jahidul@georankers.com",phone:"+880 1712 345678",location:"Dhaka, Bangladesh",joinDate:"2022-03-15",manager:"Md. Rafiqul Islam",employmentType:"Full-Time"},
    stats:{workingDays:22,present:18,absent:2,late:2,trends:{present:3,absent:-1,late:0},leaveBalance:{annual:{label:"Annual Leave",total:15,used:2,remaining:13,color:"#3b82f6"},sick:{label:"Sick Leave",total:10,used:2,remaining:8,color:"#10b981"},casual:{label:"Casual Leave",total:5,used:0,remaining:5,color:"#8b5cf6"}}},
    attendance:[{date:"2026-04-01",in:"09:02",out:"18:15",status:"Present"},{date:"2026-04-02",in:"09:55",out:"18:30",status:"Late"},{date:"2026-04-03",in:null,out:null,status:"Absent"},{date:"2026-04-06",in:"09:08",out:"18:20",status:"Present"},{date:"2026-04-07",in:"09:00",out:"18:05",status:"Present"},{date:"2026-04-08",in:"09:12",out:"18:35",status:"Present"},{date:"2026-04-09",in:"09:45",out:"18:40",status:"Late"},{date:"2026-04-10",in:"09:05",out:"18:10",status:"Present"},{date:"2026-04-13",in:"09:00",out:"18:00",status:"Present"},{date:"2026-04-14",in:null,out:null,status:"Leave"},{date:"2026-04-15",in:null,out:null,status:"Leave"},{date:"2026-04-16",in:"09:03",out:"18:18",status:"Present"},{date:"2026-04-17",in:"09:07",out:"18:22",status:"Present"},{date:"2026-04-20",in:"09:10",out:"18:15",status:"Present"},{date:"2026-04-21",in:"09:00",out:"18:05",status:"Present"},{date:"2026-04-22",in:"09:04",out:"18:12",status:"Present"},{date:"2026-04-23",in:"09:02",out:"18:08",status:"Present"},{date:"2026-04-24",in:null,out:null,status:"Absent"},{date:"2026-04-27",in:"09:01",out:"18:06",status:"Present"},{date:"2026-04-28",in:"09:00",out:null,status:"Present"}],
    projects:[{id:"PRJ-001",name:"Website Technical SEO Audit",client:"TechVision BD",status:"Active",progress:78,deadline:"2026-05-20",priority:"High",color:"#3b82f6",desc:"Comprehensive technical SEO audit including crawlability, indexation, page speed, and structured data markup."},{id:"PRJ-002",name:"Local SEO Campaign",client:"Dhaka Dental Care",status:"Completed",progress:100,deadline:"2026-03-31",priority:"Medium",color:"#10b981",desc:"Google My Business optimization, local citation building, and review management campaign."},{id:"PRJ-003",name:"Content Strategy & SEO",client:"EduBridge Online",status:"Active",progress:45,deadline:"2026-06-15",priority:"High",color:"#8b5cf6",desc:"Keyword research, content gap analysis, and monthly content calendar creation for organic growth."},{id:"PRJ-004",name:"E-commerce SEO Setup",client:"ShopBD",status:"Pending",progress:0,deadline:"2026-07-01",priority:"Low",color:"#f59e0b",desc:"Full e-commerce SEO setup including product page optimization and category structure planning."},{id:"PRJ-005",name:"Backlink Building Campaign",client:"FinanceGuru",status:"Active",progress:62,deadline:"2026-05-06",priority:"Medium",color:"#ec4899",desc:"Authority backlink acquisition through digital PR, resource page outreach, and guest posting."},{id:"PRJ-006",name:"SEO Performance Reporting",client:"MediCore Health",status:"Completed",progress:100,deadline:"2026-04-10",priority:"Low",color:"#6366f1",desc:"Monthly SEO performance reporting dashboard and data-driven strategy recommendations."}],
    performance:[{label:"Projects Completed",value:12,target:15,unit:"",color:"#3b82f6"},{label:"Client Satisfaction",value:94,target:90,unit:"%",color:"#10b981"},{label:"Tasks On-Time",value:87,target:85,unit:"%",color:"#8b5cf6"},{label:"Avg Hours / Day",value:8.5,target:8,unit:"h",color:"#f59e0b"}],
    notifications:[{id:1,text:"Attendance for April 24 is marked Absent. Please submit an explanation.",time:"2h ago",read:false},{id:2,text:"'Backlink Building' deadline is in 8 days. Current progress: 62%.",time:"Yesterday",read:false},{id:3,text:"Leave balance updated — 13 annual leave days remaining.",time:"2 days ago",read:false},{id:4,text:"Q1 2026 performance review is now available in your profile.",time:"1 week ago",read:true}]
  },
  "EMP002": {
    password:"pass123",
    profile:{id:"EMP002",name:"Rania Ahmed",fullName:"Rania Ahmed",avatar:"RA",avatarColor:"linear-gradient(135deg,#ec4899,#8b5cf6)",role:"Content Strategist",department:"GEO Rankers Dept.",email:"rania@georankers.com",phone:"+880 1987 654321",location:"Dhaka, Bangladesh",joinDate:"2023-07-01",manager:"Md. Rafiqul Islam",employmentType:"Full-Time"},
    stats:{workingDays:22,present:20,absent:1,late:1,trends:{present:5,absent:-2,late:-1},leaveBalance:{annual:{label:"Annual Leave",total:15,used:0,remaining:15,color:"#3b82f6"},sick:{label:"Sick Leave",total:10,used:1,remaining:9,color:"#10b981"},casual:{label:"Casual Leave",total:5,used:0,remaining:5,color:"#8b5cf6"}}},
    attendance:[{date:"2026-04-01",in:"08:58",out:"18:00",status:"Present"},{date:"2026-04-02",in:"09:05",out:"18:15",status:"Present"},{date:"2026-04-03",in:null,out:null,status:"Absent"},{date:"2026-04-06",in:"09:00",out:"18:10",status:"Present"},{date:"2026-04-07",in:"09:03",out:"18:05",status:"Present"},{date:"2026-04-08",in:"09:10",out:"18:20",status:"Present"},{date:"2026-04-09",in:"09:48",out:"18:30",status:"Late"},{date:"2026-04-10",in:"09:02",out:"18:08",status:"Present"},{date:"2026-04-13",in:"09:00",out:"18:00",status:"Present"},{date:"2026-04-14",in:"09:04",out:"18:12",status:"Present"},{date:"2026-04-15",in:"09:01",out:"18:05",status:"Present"},{date:"2026-04-16",in:"09:00",out:"18:15",status:"Present"},{date:"2026-04-17",in:"09:06",out:"18:20",status:"Present"},{date:"2026-04-20",in:"09:08",out:"18:14",status:"Present"},{date:"2026-04-21",in:"09:00",out:"18:05",status:"Present"},{date:"2026-04-22",in:"09:03",out:"18:10",status:"Present"},{date:"2026-04-23",in:"09:01",out:"18:07",status:"Present"},{date:"2026-04-24",in:"09:05",out:"18:12",status:"Present"},{date:"2026-04-27",in:"09:00",out:"18:05",status:"Present"},{date:"2026-04-28",in:"09:02",out:null,status:"Present"}],
    projects:[{id:"PRJ-101",name:"Blog Content Strategy",client:"TechVision BD",status:"Active",progress:65,deadline:"2026-05-25",priority:"High",color:"#ec4899",desc:"Monthly blog content calendar creation with SEO-optimized articles and keyword-driven topic clustering."},{id:"PRJ-102",name:"Social Media Content",client:"LocalShop BD",status:"Active",progress:80,deadline:"2026-05-10",priority:"Medium",color:"#8b5cf6",desc:"Daily social media content creation and scheduling for Instagram, Facebook, and LinkedIn channels."},{id:"PRJ-103",name:"Email Newsletter Series",client:"EduBridge Online",status:"Completed",progress:100,deadline:"2026-04-05",priority:"Low",color:"#10b981",desc:"Monthly email newsletter design and copywriting for subscriber engagement and retention."},{id:"PRJ-104",name:"Product Descriptions",client:"ShopBD",status:"Pending",progress:0,deadline:"2026-07-15",priority:"Medium",color:"#f59e0b",desc:"Writing 200+ SEO-optimized product descriptions for comprehensive e-commerce catalog."}],
    performance:[{label:"Articles Published",value:24,target:25,unit:"",color:"#ec4899"},{label:"Client Satisfaction",value:96,target:90,unit:"%",color:"#10b981"},{label:"Tasks On-Time",value:92,target:85,unit:"%",color:"#8b5cf6"},{label:"Avg Hours / Day",value:8.2,target:8,unit:"h",color:"#f59e0b"}],
    notifications:[{id:1,text:"Social Media Content deadline is in 12 days. Progress: 80%.",time:"3h ago",read:false},{id:2,text:"Q1 performance: 96% client satisfaction — great work!",time:"Yesterday",read:false},{id:3,text:"New project 'Product Descriptions' assigned to you.",time:"3 days ago",read:true}]
  }
};

const APP = {
  user: null,
  page: 'overview',
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  attFilter: 'all',
  projFilter: 'all',
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
};

/* ══════════════════════════════════════════════════════════════════
   AUTH
══════════════════════════════════════════════════════════════════ */

async function fetchAttendance() {
  if (!APP.user || !APP.user.profile) return;
  try {
    const res = await fetch(`/api/attendance?id=${APP.user.profile.id}`);
    if (res.ok) {
      APP.user.attendance = await res.json();
    }
  } catch (e) { console.warn("Attendance fetch error", e); }
}

function doLogin() {
  const id   = (document.getElementById('empId').value || '').trim().toUpperCase();
  const pass = document.getElementById('empPass').value;
  const err  = document.getElementById('loginErr');
  const btn  = document.getElementById('loginBtn');
  err.textContent = '';
  if (!id || !pass) { err.textContent = 'Please enter Employee ID and password.'; return; }
  btn.disabled = true;
  document.getElementById('loginBtnText').textContent = 'Signing in…';
  setTimeout(() => {
    const emp = EMPLOYEES[id];
    if (!emp || emp.password !== pass) {
      err.textContent = 'Invalid Employee ID or password.';
      btn.disabled = false;
      document.getElementById('loginBtnText').textContent = 'Sign In to Portal';
      return;
    }
    APP.user = { id, ...emp };
    APP.calYear = 2026; APP.calMonth = 3;
    if (document.getElementById('rememberMe').checked) {
      try { localStorage.setItem('emp_session', JSON.stringify({ id, ts: Date.now() })); } catch(_) {}
    }
    launchDashboard();
  }, 700);
}

function launchDashboard() {
  const loginEl = document.getElementById('loginScreen');
  const appEl = document.getElementById('empApp');
  loginEl.style.cssText = 'opacity:0;transition:opacity .35s ease';
  setTimeout(() => {
    loginEl.style.display = 'none';
    appEl.style.cssText = 'display:flex;opacity:0;transition:opacity .35s ease';
    requestAnimationFrame(() => { appEl.style.opacity = '1'; });
    initDashboard();
  }, 350);
}

function doLogout() {
  try { localStorage.removeItem('emp_session'); } catch (_) { }
  APP.user = null;
  const appEl = document.getElementById('empApp');
  const loginEl = document.getElementById('loginScreen');
  appEl.style.cssText = 'display:flex;opacity:0;transition:opacity .3s ease';
  setTimeout(() => {
    appEl.style.display = 'none';
    loginEl.style.cssText = 'opacity:0;transition:opacity .35s ease';
    requestAnimationFrame(() => { loginEl.style.opacity = '1'; });
    document.getElementById('empId').value = '';
    document.getElementById('empPass').value = '';
    document.getElementById('loginErr').textContent = '';
    document.getElementById('loginBtn').disabled = false;
    document.getElementById('loginBtnText').textContent = 'Sign In';
  }, 300);
}

function fillDemo(id) {
  document.getElementById('empId').value = id;
  document.getElementById('empPass').value = 'pass123';
  document.getElementById('loginErr').textContent = '';
}

function togglePass() {
  const inp = document.getElementById('empPass');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

/* ══════════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════════ */

function initDashboard() {
  const { profile, notifications } = APP.user;

  const tbAv = document.getElementById('tbUserAv');
  tbAv.style.background = profile.avatarColor; tbAv.textContent = profile.avatar;
  document.getElementById('tbUserName').textContent = profile.name;
  document.getElementById('tbUserRole').textContent = profile.role;

  const sbAv = document.getElementById('sbUserAv');
  sbAv.style.background = profile.avatarColor; sbAv.textContent = profile.avatar;
  document.getElementById('sbUserName').textContent = profile.name;
  document.getElementById('sbUserId').textContent   = profile.id;

  // Notifications
  if (notifications) {
    const unread = notifications.filter(n => !n.read).length;
    const badge  = document.getElementById('notifBadge');
    if (badge) { if (unread > 0) { badge.textContent = unread; badge.classList.remove('hidden'); } else badge.classList.add('hidden'); }
    const nl = document.getElementById('notifList');
    if (nl) nl.innerHTML = notifications.map(n => `
      <div class="notif-item ${n.read?'':'unread'}">
        <div class="notif-dot ${n.read?'read':''}"></div>
        <div><div class="notif-text">${n.text}</div><div class="notif-time">${n.time}</div></div>
      </div>`).join('');
  }

  startClock();
  updateDateDisplay();
  document.addEventListener('click', e => {
    const panel = document.getElementById('notifPanel');
    if (panel && !e.target.closest('#tbNotif') && !e.target.closest('#notifPanel')) {
      panel.classList.remove('open'); APP.notifOpen = false;
    }
  });
  navigate('overview');
}

function startClock() {
  function tick() {
    const now = new Date();
    const el  = document.getElementById('tbClock');
    if (el) el.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }
  tick(); setInterval(tick, 1000);
}

function updateDateDisplay() {
  const el = document.getElementById('tbDate');
  if (el) el.textContent = new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
}

function toggleNotif() {
  APP.notifOpen = !APP.notifOpen;
  const panel = document.getElementById('notifPanel');
  if (panel) panel.classList.toggle('open', APP.notifOpen);
}

function clearNotifs() {
  if (APP.user.notifications) APP.user.notifications.forEach(n => { n.read = true; });
  const badge = document.getElementById('notifBadge');
  if (badge) badge.classList.add('hidden');
  document.querySelectorAll('.notif-item').forEach(el => {
    el.classList.remove('unread');
    const dot = el.querySelector('.notif-dot'); if (dot) dot.classList.add('read');
  });
  showToast('All notifications marked as read', 'success');
}

/* ══════════════════════════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════════════════════════ */

function navigate(page) {
  APP.page = page;

  document.querySelectorAll('.sb-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  const labels = { overview: 'Overview', attendance: 'Attendance', projects: 'Projects', profile: 'Profile' };
  document.getElementById('tbPage').textContent = labels[page] || page;

  const content = document.getElementById('empContent');
  content.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'page-content';
  content.appendChild(wrapper);

  const renderers = { overview: renderOverview, attendance: renderAttendance, projects: renderProjects, profile: renderProfile };
  if (renderers[page]) renderers[page](wrapper);

  // Close mobile sidebar after navigation
  if (window.innerWidth <= 960) closeSidebarMobile();
}

/* ══════════════════════════════════════════════════════════════════
   OVERVIEW
══════════════════════════════════════════════════════════════════ */

function renderOverview(el) {
  const { profile, stats, attendance } = APP.user;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dayStr = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});

  const todayStr  = fmtDate(new Date());
  const todayRec   = attendance.find(r => r.date === todayStr);
  const checkedIn  = !!(todayRec && todayRec.in);
  const checkedOut = !!(todayRec && todayRec.out);
  const { trends } = stats;

  let checkBtnHtml;
  if (checkedOut)
    checkBtnHtml = `<button class="wb-checkin-btn checked">✓ ${todayRec.in} – ${todayRec.out}</button>`;
  else if (checkedIn)
    checkBtnHtml = `<button class="wb-checkin-btn check-out" onclick="doCheckOut()">⏹ Check Out <span style="opacity:.75;margin-left:4px">${todayRec.in}</span></button>`;
  else
    checkBtnHtml = `<button class="wb-checkin-btn check-in" onclick="doCheckIn()">▶ Check In</button>`;

  const recentRows = attendance.slice(-7).reverse().map(r => `
    <tr>
      <td>
        <div style="font-weight:700;color:var(--text);font-size:12px">${fmtDateShort(r.date)}</div>
        <div style="font-size:10px;color:var(--muted)">${getDayName(r.date)}</div>
      </td>
      <td><span class="att-time ${r.in && isLate(r.in) ? 'late' : ''}">${r.in || '—'}</span></td>
      <td><span class="att-time">${r.out || '—'}</span></td>
      <td><span class="att-hours">${calcHours(r.in, r.out)}</span></td>
      <td>${attBadge(r.status)}</td>
    </tr>`).join('');

  el.innerHTML = `
    <div class="welcome-banner">
      <div class="wb-left">
        <div class="wb-greeting">${greeting}, ${profile.name.split(' ')[0]}! 👋</div>
        <div class="wb-meta">
          <span>${dayStr}</span>
          <span class="wb-dept-badge">${profile.role}</span>
        </div>
      </div>
      <div class="wb-right">
        ${checkBtnHtml}
        <div class="wb-avatar" style="background:${profile.avatarColor}">${profile.avatar}</div>
      </div>
    </div>

    <div class="stat-cards">
      ${sc('Working Days',  stats.workingDays, 'This month',                         '#3b82f6', calSvg(),  null)}
      ${sc('Present Days',  stats.present,     pct(stats.present,stats.workingDays)+'% rate','#10b981',chkSvg(), trends.present)}
      ${sc('Absent Days',   stats.absent,      'Days missed',                        '#ef4444', xSvg(),    trends.absent * -1)}
      ${sc('Late Arrivals', stats.late,        'Late check-ins',                     '#f59e0b', clkSvg(),  trends.late * -1)}
      ${sc('Leave Balance', stats.leaveBalance.annual.remaining, 'Annual days left', '#8b5cf6', lvSvg(),   null)}
    </div>

    <div class="overview-grid">
      <div class="emp-card">
        <div class="emp-card-header">
          <div class="emp-card-title">${calSvg(14)} Recent Attendance</div>
          <button class="emp-card-action" onclick="navigate('attendance')">View All →</button>
        </div>
        <div style="overflow-x:auto">
          <table class="mini-att-table">
            <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
            <tbody>${recentRows}</tbody>
          </table>
        </div>
      </div>

      <div>
        <div class="emp-card" style="margin-bottom:14px">
          ${calendarHtml(APP.calYear, APP.calMonth)}
        </div>
        <div class="emp-card">
          <div class="emp-card-header">
            <div class="emp-card-title">${lvSvg(14)} Leave Balance</div>
            <button class="emp-card-action" onclick="navigate('profile')">Details →</button>
          </div>
          <div style="padding:14px 18px;display:flex;flex-direction:column;gap:11px">
            ${Object.values(stats.leaveBalance).map(lb => `
              <div>
                <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px">
                  <span style="color:var(--m2);font-weight:600">${lb.label}</span>
                  <span style="color:var(--text);font-weight:800">${lb.remaining}/${lb.total} days</span>
                </div>
                <div style="height:5px;background:rgba(255,255,255,.06);border-radius:50px;overflow:hidden">
                  <div style="height:100%;width:${pct(lb.remaining,lb.total)}%;background:${lb.color};border-radius:50px;transition:width 1.2s ease"></div>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════════════════════
   CHECK IN / OUT  (local state — no backend required)
══════════════════════════════════════════════════════════════════ */

function doCheckIn() {
  const now     = new Date();
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const today   = fmtDate(now);
  let rec = APP.user.attendance.find(r => r.date === today);
  if (!rec) {
    rec = { date:today, in:timeStr, out:null, status:isLate(timeStr)?'Late':'Present' };
    APP.user.attendance.push(rec);
  } else { rec.in = timeStr; rec.status = isLate(timeStr)?'Late':'Present'; }
  showToast(`Checked in at ${timeStr}${isLate(timeStr)?' — Late':''}`, isLate(timeStr)?'warning':'success');
  navigate('overview');
}

function doCheckOut() {
  const now     = new Date();
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const rec     = APP.user.attendance.find(r => r.date === fmtDate(now));
  if (rec) rec.out = timeStr;
  showToast(`Checked out at ${timeStr}`, 'success');
  navigate('overview');
}

/* ══════════════════════════════════════════════════════════════════
   ATTENDANCE PAGE
══════════════════════════════════════════════════════════════════ */

function renderAttendance(el) {
  const { stats } = APP.user;
  let records = [...APP.user.attendance].reverse();
  if (APP.attFilter !== 'all') records = records.filter(r => r.status === APP.attFilter);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const leaveCount = APP.user.attendance.filter(r => r.status === 'Leave').length;

  const filterBtns = ['all', 'Present', 'Late', 'Absent', 'Leave'].map(f =>
    `<button class="att-filter-btn ${APP.attFilter === f ? 'active' : ''}"
      onclick="APP.attFilter='${f}';renderAttendance(document.querySelector('.page-content'))">
      ${f === 'all' ? 'All Records' : f}
    </button>`
  ).join('');

  const tableRows = records.map((r, i) => {
    const rowCls = {Late:'att-row-late',Absent:'att-row-absent',Leave:'att-row-leave'}[r.status]||'';
    return `<tr class="${rowCls}">
      <td style="color:var(--muted);font-size:10px">${i+1}</td>
      <td><span style="font-weight:700;color:var(--text)">${fmtDateLong(r.date)}</span></td>
      <td style="color:var(--m2)">${getDayName(r.date)}</td>
      <td><span class="att-time ${r.in && isLate(r.in)?'late':''}">${r.in||'—'}</span></td>
      <td><span class="att-time">${r.out||'—'}</span></td>
      <td><span class="att-hours">${calcHours(r.in,r.out)}</span></td>
      <td>${attBadge(r.status)}</td>
    </tr>`;
  }).join('');

  el.innerHTML = `
    <div class="att-page-header">
      <div class="att-page-title">Attendance Record</div>
      <div class="att-controls">
        <select class="att-select"
          onchange="APP.calMonth=parseInt(this.value);renderAttendance(document.querySelector('.page-content'))">
          ${months.map((m, i) => `<option value="${i}" ${i === APP.calMonth ? 'selected' : ''}>${m} ${APP.calYear}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="att-stats-row">
      <div class="att-stat">
        <div class="att-stat-icon" style="background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.2);color:#10b981">${chkSvg(20)}</div>
        <div><div class="att-stat-count" style="color:#10b981">${stats.present}</div><div class="att-stat-label">Present</div></div>
      </div>
      <div class="att-stat">
        <div class="att-stat-icon" style="background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.2);color:#f59e0b">${clkSvg(20)}</div>
        <div><div class="att-stat-count" style="color:#f59e0b">${stats.late}</div><div class="att-stat-label">Late</div></div>
      </div>
      <div class="att-stat">
        <div class="att-stat-icon" style="background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.2);color:#ef4444">${xSvg(20)}</div>
        <div><div class="att-stat-count" style="color:#ef4444">${stats.absent}</div><div class="att-stat-label">Absent</div></div>
      </div>
      <div class="att-stat">
        <div class="att-stat-icon" style="background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.2);color:#a78bfa">${lvSvg(20)}</div>
        <div><div class="att-stat-count" style="color:#a78bfa">${leaveCount}</div><div class="att-stat-label">On Leave</div></div>
      </div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:12px">
      <div style="font-size:12px;color:var(--m2)">Showing <b style="color:var(--text)">${records.length}</b> records</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">${filterBtns}</div>
    </div>

    <div class="att-table-wrap">
      <table class="att-table">
        <thead><tr>
          <th>#</th><th>Date</th><th>Day</th><th>Check In</th><th>Check Out</th><th>Total Hours</th><th>Status</th>
        </tr></thead>
        <tbody>
          ${records.length ? tableRows : '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--muted)">No records match this filter</td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="emp-card">
      <div class="emp-card-header"><div class="emp-card-title">${calSvg(14)} Monthly View</div></div>
      ${calendarHtml(APP.calYear, APP.calMonth)}
    </div>`;
}

/* ══════════════════════════════════════════════════════════════════
   PROJECTS PAGE
══════════════════════════════════════════════════════════════════ */

function renderProjects(el) {
  const { projects } = APP.user;
  const f = APP.projFilter;
  const filtered = f === 'all' ? projects : projects.filter(p => p.status === f);

  const tabs = ['all', 'Active', 'Completed', 'Pending'].map(t => {
    const cnt = t === 'all' ? projects.length : projects.filter(p => p.status === t).length;
    return `<button class="proj-tab ${f === t ? 'active' : ''}"
      onclick="APP.projFilter='${t}';renderProjects(document.querySelector('.page-content'))">
      ${t === 'all' ? 'All' : t} <span class="proj-count">${cnt}</span>
    </button>`;
  }).join('');

  const cards = filtered.map(p => `
    <div class="proj-card" style="--pc-color:${p.color}">
      <div class="proj-card-top">
        <div class="proj-id">${p.id}</div>
        <div class="proj-name">${p.name}</div>
        <div class="proj-client">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          ${p.client}
        </div>
        <div class="proj-status-row">
          <span class="proj-status ps-${p.status.toLowerCase()}">${statusDot(p.status)} ${p.status}</span>
          <span class="proj-priority pp-${p.priority.toLowerCase()}">${p.priority}</span>
        </div>
      </div>
      <div class="proj-card-body">
        <div class="proj-desc">${p.desc}</div>
        <div class="proj-progress-label"><span>Progress</span><span>${p.progress}%</span></div>
        <div class="proj-progress-track">
          <div class="proj-progress-fill" style="width:${p.progress}%"></div>
        </div>
        <div class="proj-footer">
          <div class="proj-deadline">${calSvg(11)} ${fmtDateLong(p.deadline)}</div>
          ${p.status==='Completed' ? '<span class="dl-badge dl-done">✓ Done</span>' : deadlineBadge(p.deadline)}
        </div>
      </div>
    </div>`).join('');

  el.innerHTML = `
    <div class="proj-header">
      <div class="proj-title">My Projects</div>
      <div class="proj-filter-tabs">${tabs}</div>
    </div>
    ${filtered.length
      ? `<div class="proj-grid">${cards}</div>`
      : `<div class="proj-empty">
          <div class="proj-empty-icon">📂</div>
          <div class="proj-empty-title">No ${f === 'all' ? '' : f} projects</div>
          <div class="proj-empty-sub">No projects match this filter.</div>
        </div>`}`;
}

/* ══════════════════════════════════════════════════════════════════
   PROFILE PAGE
══════════════════════════════════════════════════════════════════ */

function renderProfile(el) {
  const { profile, stats, performance } = APP.user;
  const lb = stats.leaveBalance;

  el.innerHTML = `
    <div class="profile-banner">
      <div class="profile-avatar" style="background:${profile.avatarColor}">${profile.avatar}</div>
      <div class="profile-info">
        <div class="profile-name">${profile.fullName}</div>
        <div class="profile-role-dept">${profile.role} · ${profile.department}</div>
        <div class="profile-badges">
          <span class="profile-badge">${profile.id}</span>
          <span class="profile-badge">${profile.employmentType}</span>
          <span class="profile-badge">Joined ${fmtDateLong(profile.joinDate)}</span>
        </div>
      </div>
    </div>

    <div class="profile-grid">
      <div class="info-card">
        <div class="info-card-header">${usrSvg(13)} Personal Information</div>
        ${ir('Full Name', profile.fullName)}
        ${ir('Employee ID', profile.id)}
        ${ir('Email', profile.email)}
        ${ir('Phone', profile.phone)}
        ${ir('Location', profile.location)}
      </div>
      <div class="info-card">
        <div class="info-card-header">${bagSvg(13)} Job Information</div>
        ${ir('Job Role', profile.role)}
        ${ir('Department', profile.department)}
        ${ir('Employment Type', profile.employmentType)}
        ${ir('Direct Manager', profile.manager)}
        ${ir('Joined Date', fmtDateLong(profile.joinDate))}
      </div>
    </div>

    <div class="kpi-section">
      <div class="kpi-section-header">Performance Metrics — April 2026</div>
      <div class="kpi-items">
        ${performance.map(k => `
          <div class="kpi-item">
            <div class="kpi-item-val" style="color:${k.color}">${k.value}${k.unit}</div>
            <div class="kpi-item-label">${k.label}</div>
            <div class="kpi-progress-bar">
              <div class="kpi-progress-fill" style="width:${Math.min(k.value / k.target * 100, 100)}%;background:${k.color}"></div>
            </div>
          </div>`).join('')}
      </div>
    </div>

    <div class="leave-section-title">Leave Balance</div>
    <div class="leave-balance">
      ${Object.values(lb).map(l => `
        <div class="leave-card" style="--lc-color:${l.color}">
          <div class="leave-type">${l.label}</div>
          <div class="leave-count">${l.remaining}</div>
          <div class="leave-total">of ${l.total} days remaining</div>
          <div class="leave-bar-track">
            <div class="leave-bar-fill" style="width:${pct(l.remaining, l.total)}%"></div>
          </div>
        </div>`).join('')}
    </div>`;
}

/* ══════════════════════════════════════════════════════════════════
   CALENDAR
══════════════════════════════════════════════════════════════════ */

function calendarHtml(year, month) {
  const attMap = {};
  APP.user.attendance.forEach(r => { attMap[r.date] = r.status.toLowerCase(); });

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DOWS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const first = new Date(year, month, 1);
  const daysNum = new Date(year, month + 1, 0).getDate();
  const startDow = first.getDay();
  const todayStr = fmtDate(new Date());

  let cells = '';
  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, -startDow + i + 1);
    cells += `<div class="cal-day other-month">${d.getDate()}</div>`;
  }
  for (let d = 1; d <= daysNum; d++) {
    const ds = `${year}-${pad(month + 1)}-${pad(d)}`;
    const dow = new Date(year, month, d).getDay();
    const cls = ['cal-day',
      dow === 0 || dow === 6 ? 'weekend' : '',
      ds === todayStr ? 'today' : '',
      attMap[ds] || ''
    ].filter(Boolean).join(' ');
    cells += `<div class="${cls}" title="${ds}${attMap[ds] ? ' · ' + cap(attMap[ds]) : ''}">${d}</div>`;
  }
  const tail = (7 - (startDow + daysNum) % 7) % 7;
  for (let i = 1; i <= tail; i++) cells += `<div class="cal-day other-month">${i}</div>`;

  return `
    <div class="mini-calendar">
      <div class="cal-header">
        <button class="cal-nav-btn" onclick="prevCalMonth()">‹</button>
        <div class="cal-title">${MONTHS[month]} ${year}</div>
        <button class="cal-nav-btn" onclick="nextCalMonth()">›</button>
      </div>
      <div class="cal-dow-row">${DOWS.map(d => `<div class="cal-dow">${d}</div>`).join('')}</div>
      <div class="cal-grid">${cells}</div>
    </div>
    <div class="cal-legend">
      <div class="cal-leg-item"><div class="cal-leg-dot" style="background:rgba(16,185,129,.6)"></div>Present</div>
      <div class="cal-leg-item"><div class="cal-leg-dot" style="background:rgba(245,158,11,.6)"></div>Late</div>
      <div class="cal-leg-item"><div class="cal-leg-dot" style="background:rgba(239,68,68,.6)"></div>Absent</div>
      <div class="cal-leg-item"><div class="cal-leg-dot" style="background:rgba(139,92,246,.6)"></div>Leave</div>
    </div>`;
}

function prevCalMonth() {
  if (APP.calMonth === 0) { APP.calMonth = 11; APP.calYear--; }
  else APP.calMonth--;
  navigate(APP.page);
}

function nextCalMonth() {
  if (APP.calMonth === 11) { APP.calMonth = 0; APP.calYear++; }
  else APP.calMonth++;
  navigate(APP.page);
}

/* ══════════════════════════════════════════════════════════════════
   SIDEBAR TOGGLE
══════════════════════════════════════════════════════════════════ */

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sbOverlay');
  if (window.innerWidth <= 960) {
    APP.sidebarMobileOpen = !APP.sidebarMobileOpen;
    sb.classList.toggle('open', APP.sidebarMobileOpen);
    ov.classList.toggle('open', APP.sidebarMobileOpen);
  } else {
    APP.sidebarCollapsed = !APP.sidebarCollapsed;
    sb.classList.toggle('collapsed', APP.sidebarCollapsed);
  }
}

function closeSidebarMobile() {
  APP.sidebarMobileOpen = false;
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sbOverlay').classList.remove('open');
}

/* ══════════════════════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════════════════════ */

function fmtDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function fmt(n) { return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

function fmtDateShort(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function fmtDateLong(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function getDayName(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}
function isLate(t) {
  if (!t) return false;
  const [h, m] = t.split(':').map(Number);
  return h > 9 || (h === 9 && m > 30);
}
function calcHours(inT, outT) {
  if (!inT || !outT) return '—';
  const [ih, im] = inT.split(':').map(Number);
  const [oh, om] = outT.split(':').map(Number);
  const mins = (oh * 60 + om) - (ih * 60 + im);
  if (mins <= 0) return '—';
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
function pad(n) { return String(n).padStart(2, '0'); }
function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function attBadge(status) {
  const map = { Present: ['att-present', '●'], Late: ['att-late', '⏰'], Absent: ['att-absent', '✕'], Leave: ['att-leave', '◐'], Holiday: ['att-holiday', '★'] };
  const [cls, ico] = map[status] || ['att-present', '●'];
  return `<span class="att-badge ${cls}">${ico} ${status}</span>`;
}

function statusDot(s) {
  if (s === 'Active') return '●'; if (s === 'Completed') return '✓'; return '⏸';
}

function showToast(msg, type = 'info') {
  const box = document.getElementById('toastBox');
  const colMap = { success:'#10b981', error:'#ef4444', info:'#3b82f6', warning:'#f59e0b' };
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span style="color:${colMap[type] || colMap.info}">●</span> ${msg}`;
  box.appendChild(t);
  setTimeout(() => t.remove(), 4200);
}

/* ══════════════════════════════════════════════════════════════════
   CARD / ROW HELPERS
══════════════════════════════════════════════════════════════════ */

function daysUntil(s) {
  return Math.ceil((new Date(s+'T00:00:00') - new Date(fmtDate(new Date())+'T00:00:00')) / 86400000);
}
function deadlineBadge(s) {
  const d = daysUntil(s);
  if (d<0)   return `<span class="dl-badge dl-overdue">Overdue ${Math.abs(d)}d</span>`;
  if (d===0) return `<span class="dl-badge dl-today">Due Today</span>`;
  if (d<=7)  return `<span class="dl-badge dl-urgent">${d}d left</span>`;
  if (d<=30) return `<span class="dl-badge dl-soon">${d}d left</span>`;
  return `<span class="dl-badge dl-ok">${d}d left</span>`;
}

function sc(label, value, sub, color, icon, trend) {
  let trendHtml = '';
  if (trend != null) {
    if (trend > 0) trendHtml = `<span class="sc-trend sc-trend-up">↑ ${trend}%</span>`;
    else if (trend < 0) trendHtml = `<span class="sc-trend sc-trend-down">↓ ${Math.abs(trend)}%</span>`;
    else trendHtml = `<span class="sc-trend sc-trend-same">→ 0%</span>`;
  }
  return `<div class="stat-card" style="--sc-color:${color}">
    <div class="sc-top-row">
      <div class="sc-icon" style="background:${color}1a;border:1px solid ${color}33;color:${color}">${icon}</div>
      ${trendHtml}
    </div>
    <div class="sc-value">${value}</div>
    <div class="sc-label">${label}</div>
    <div class="sc-sub">${sub}</div>
  </div>`;
}

function ir(label, value) {
  return `<div class="info-row"><span class="info-row-label">${label}</span><span class="info-row-value">${value}</span></div>`;
}

/* ══════════════════════════════════════════════════════════════════
   SVG ICONS
══════════════════════════════════════════════════════════════════ */

function calSvg(s = 15) { return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01"/></svg>`; }
function chkSvg(s = 15) { return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`; }
function xSvg(s = 15) { return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`; }
function clkSvg(s = 15) { return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`; }
function lvSvg(s = 15) { return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`; }
function usrSvg(s = 14) { return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`; }
function bagSvg(s = 14) { return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>`; }

/* ══════════════════════════════════════════════════════════════════
   SESSION RESTORE
══════════════════════════════════════════════════════════════════ */

function tryRestoreSession() {
  try {
    const saved = localStorage.getItem('emp_session');
    if (!saved) return;
    const { id, ts } = JSON.parse(saved);
    if (Date.now() - ts > 86400000) { localStorage.removeItem('emp_session'); return; }
    const emp = EMPLOYEES[id];
    if (!emp) return;
    APP.user = { id, ...emp };
    launchDashboard();
  } catch (_) { }
}

/* ══════════════════════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  tryRestoreSession();

  const passEl = document.getElementById('empPass');
  const idEl = document.getElementById('empId');
  if (passEl) passEl.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  if (idEl) idEl.addEventListener('keydown', e => { if (e.key === 'Enter') passEl && passEl.focus(); });
});
