/* ═══════════════════════════════════════════════════════════════
   api.js — Data fetching layer (Sheets + Flask fallback)
   Requires: config.js, utils.js
   ═══════════════════════════════════════════════════════════════ */

async function fetchMembers() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=All+Member+Data&t=${Date.now()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    const m = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);\s*$/);
    if (!m) return null;
    const raw = JSON.parse(m[1]);
    const rows = raw.table.rows || [];
    const members = [];
    rows.forEach(r => {
      const c = r.c || [];
      if (c.length > 6 && c[2] && c[2].v && c[6] && c[6].v) {
        members.push({
          name:     String(c[2].v).trim(),
          fullName: (c[1] && c[1].v) ? String(c[1].v).trim() : String(c[2].v),
          id:       (c[0] && c[0].f) ? String(c[0].f) : (c[0] ? String(c[0].v) : ''),
          team:     String(c[6].v).trim(),
          target:   MEM_TARGET,
        });
      }
    });
    return members.length ? members : null;
  } catch (e) { console.warn('Member fetch failed', e); return null; }
}

async function fetchSheets() {
  const liveMembers = await fetchMembers();
  if (liveMembers) {
    ALL_MEMBERS = liveMembers;
    rebuildMemberLookup();
  }
  const attempts = [
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Kam+Data&t=${Date.now()}`,
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=0&t=${Date.now()}`,
  ];
  let lastErr = '';
  for (const url of attempts) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const text = await res.text();
      const m = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);\s*$/);
      if (!m) continue;
      const raw = JSON.parse(m[1]);
      if (raw.status === 'error') { lastErr = raw.errors?.[0]?.message || 'Sheet error'; continue; }
      const rows = (raw.table.rows || []).map(r => (r.c || []).map(c => (c && c.v != null) ? String(c.v) : ''));
      const result = processRows(rows);
      if (result.members.some(m => m.total > 0)) return result;
    } catch (e) { lastErr = e.message; }
  }
  throw new Error('Sheet fetch failed: ' + lastErr);
}

function processRows(rows) {
  // 0. Detect Header & Column Mapping
  const headerIdx = rows.findIndex(r => r.some(c => c === 'ID' || c === 'date' || c === 'Order ID'));
  const headerRow = headerIdx >= 0 ? rows[headerIdx] : rows[0];
  const dataRows   = rows.slice(headerIdx + 1);
  
  // Create dynamic mapping based on header row strings
  const sheet_col = { ...COL }; // Fallback to config
  headerRow.forEach((val, idx) => {
    const v = String(val).toLowerCase().trim();
    if (v === 'service' || v === 'service type') sheet_col.service = idx;
    if (v === 'assign' || v === 'assigned to')    sheet_col.assign  = idx;
    if (v === 'status')                           sheet_col.status  = idx;
    if (v === 'delivered by')                     sheet_col.del_by  = idx;
    if (v === 'delivered date')                   sheet_col.del_date = idx;
    if (v === 'amount' || v === 'amount_x')       sheet_col.amount_x = idx;
    if (v === 'order' || v === 'order id' || v === 'order_num') sheet_col.order_num = idx;
  });
  const stats = {};
  const teamStats = {};
  ALL_MEMBERS.forEach(m => {
    stats[m.name] = { ...m, wip: 0, revision: 0, delivered: 0, cancelled: 0, total: 0, deliveredAmt: 0, wipAmt: 0, projects: [] };
    if (m.team && !teamStats[m.team]) {
      teamStats[m.team] = { amt: 0, wip: 0, revision: 0, delivered: 0, cancelled: 0, projects: 0 };
    }
  });
  const sf = v => { try { return parseFloat(String(v).replace(/[$,]/g, '').trim()) || 0; } catch (e) { return 0; } };
  const uniqueOrders = new Set();
  let seoSmmRows = 0, matchedRows = 0;
  const uniqueDelivered = new Set(), uniqueWip = new Set(), uniqueCancelled = new Set();
  const unmatchedItems = [];

  dataRows.forEach(row => {
    while (row.length <= sheet_col.amount_x) row.push('');
    const assign  = (row[sheet_col.assign]  || '').trim();
    const status  = (row[sheet_col.status]  || '').trim();
    const service = (row[sheet_col.service] || '').trim().toUpperCase();
    const orderID = (row[sheet_col.order_num] || '').trim();
    if (!service.includes('SEO') && !service.includes('SMM')) return;
    seoSmmRows++;
    
    if (orderID) {
      if (status === 'Delivered') uniqueDelivered.add(orderID);
      else if (status === 'WIP' || status === 'Revision') uniqueWip.add(orderID);
      else if (status === 'Cancelled') uniqueCancelled.add(orderID);
    }

    const matchedNames = parseAssignees(assign);
    if (!matchedNames.length) {
      unmatchedItems.push({
        assign: assign || 'Unassigned',
        status: status || 'N/A',
        service: service || 'N/A',
        order: (row[sheet_col.order_num] || '').trim(),
        client: (row[sheet_col.client]   || '').trim(),
      });
      return;
    }
    matchedRows++;
    const amtX  = sf(row[sheet_col.amount_x]);
    const proj  = {
      order:         orderID,
      link:          (row[sheet_col.order_link] || '').trim(),
      client:        (row[sheet_col.client]     || '').trim(),
      assign, service, status, amtX, share: 0,
      date:          parseGvizDate(row[sheet_col.date]    || ''),
      deliveredDate: parseGvizDate(row[sheet_col.del_date] || ''),
      deliveredBy:   (row[sheet_col.del_by]    || '').trim(),
    };

    const delBy = (row[sheet_col.del_by] || '').trim().toLowerCase().replace(/[\s_]/g, '');
    let delByTeam = null;
    // Map sheet names to team keys
    const teamMapping = {
      'geo_rankers': 'GEO Rankers',
      'rank_riser': 'Rank Riser',
      'search_apex': 'Search Apex',
      'smm': 'SMM',
      'dark_rankers': 'SMM' // Handle legacy name
    };
    
    if (teamMapping[delBy]) {
      delByTeam = teamMapping[delBy];
    } else {
      // Direct lookup fallback
      for (const t in teamStats) {
        if (t.toLowerCase().replace(/[\s_]/g, '') === delBy) { delByTeam = t; break; }
      }
    }

    if (delByTeam) {
      teamStats[delByTeam].projects++;
      if (status === 'Delivered')  { teamStats[delByTeam].amt += amtX; teamStats[delByTeam].delivered++; }
      else if (status === 'WIP')       teamStats[delByTeam].wip++;
      else if (status === 'Revision')  teamStats[delByTeam].revision++;
      else if (status === 'Cancelled') teamStats[delByTeam].cancelled++;
    }

    const allParts = assign.split(/[\/,]/);
    const pool = new Set();
    allParts.forEach(p => {
      const token = normalizeAssigneeToken(p).toLowerCase();
      if (token) pool.add(token);
    });
    const divisor = pool.size || 1;
    const share   = Math.round((amtX / divisor) * 100) / 100;

    matchedNames.forEach(name => {
      const p = { ...proj, share };
      const s = stats[name];
      if (s) {
        s.projects.push(p); s.total++;
        if (status === 'Delivered')  { s.delivered++; s.deliveredAmt += p.share; }
        else if (status === 'WIP')       { s.wip++;       s.wipAmt += p.share; }
        else if (status === 'Revision')  { s.revision++;  s.wipAmt += p.share; }
        else if (status === 'Cancelled')   s.cancelled++;
      }
    });
    if (orderID) uniqueOrders.add(orderID);
  });

  let totalDel = 0, totalWip = 0;
  const members = ALL_MEMBERS.map(m => {
    const s   = stats[m.name];
    const del = Math.round(s.deliveredAmt * 100) / 100;
    const wip = Math.round(s.wipAmt * 100) / 100;
    totalDel += del; totalWip += wip;
    return {
      name: s.name, fullName: s.fullName, id: s.id, team: s.team, target: MEM_TARGET,
      total: s.total, wip: s.wip, revision: s.revision, delivered: s.delivered, cancelled: s.cancelled,
      deliveredAmt: del, wipAmt: wip,
      remaining: Math.round((del - s.target) * 100) / 100,
      progress:  s.target > 0 ? Math.round((del / s.target) * 10000) / 100 : 0,
      projects:  s.projects,
    };
  });
  const summary = {
    dept: {
      target:         DEPT_TARGET,
      achieved:       Math.round(totalDel * 100) / 100,
      remaining:      Math.round((DEPT_TARGET - totalDel) * 100) / 100,
      progress:       Math.round((totalDel / DEPT_TARGET) * 10000) / 100,
      uniqueProjects: uniqueOrders.size,
      wipAmt:         Math.round(totalWip * 100) / 100,
    },
  };
  return {
    members, summary,
    audit: { seoSmmRows, matchedRows, deliveredRows: uniqueDelivered.size, wipRows: uniqueWip.size, cancelledRows: uniqueCancelled.size, unmatchedRows: unmatchedItems.length, uniqueOrders: uniqueOrders.size, unmatchedItems: unmatchedItems.slice(0, 12) },
  };
}

// ── TRACKER-SPECIFIC: fetch all delivered projects from Sheets ──────────────
async function fetchDeliveredFromSheets() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Kam+Data&t=${Date.now()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Sheet fetch failed');
  const text = await res.text();
  const m = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);\s*$/);
  if (!m) throw new Error('Parse failed');
  const raw = JSON.parse(m[1]);
  if (raw.status === 'error') throw new Error(raw.errors?.[0]?.message || 'Sheet error');
  const rows = (raw.table.rows || []).map(r => (r.c || []).map(c => (c && c.v != null) ? String(c.v) : ''));

  // Also refresh member list
  const murl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=All+Member+Data&t=${Date.now()}`;
  try {
    const mr  = await fetch(murl);
    const mt  = await mr.text();
    const mm  = mt.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);\s*$/);
    if (mm) {
      const mraw = JSON.parse(mm[1]);
      const live = (mraw.table.rows || []).filter(r => r.c && r.c[2] && r.c[2].v && r.c[6] && r.c[6].v).map(r => ({
        name:     String(r.c[2].v).trim(),
        fullName: r.c[1] && r.c[1].v ? String(r.c[1].v).trim() : String(r.c[2].v).trim(),
        team:     String(r.c[6].v).trim(),
      }));
      if (live.length) { ALL_MEMBERS = live; rebuildMemberLookup(); }
    }
  } catch (e) { /* use fallback list */ }

  const lookup = {};
  ALL_MEMBERS.forEach(m => { lookup[m.name.trim().toLowerCase()] = m; });
  lookup['istak']        = lookup['istiak'] || { name: 'Istiak', team: 'Dark Rankers' };
  lookup['istak ahamed'] = lookup['istiak'] || { name: 'Istiak', team: 'Dark Rankers' };

  const sf   = v => { try { return parseFloat(String(v).replace(/[$,]/g, '').trim()) || 0; } catch (e) { return 0; } };
  const seen = new Set(), projects = [];

  rows.slice(1).forEach(row => {
    while (row.length <= COL.amount_x) row.push('');
    const status  = (row[COL.status]  || '').trim();
    if (status !== 'Delivered') return;
    const service = (row[COL.service] || '').trim().toUpperCase();
    if (!service.includes('SEO') && !service.includes('SMM')) return;

    const order         = (row[COL.order_num]  || '').trim();
    const client        = (row[COL.client]      || '').trim();
    const assign        = (row[COL.assign]      || '').trim();
    const amtX          = sf(row[COL.amount_x]);
    const date          = parseGvizDate(row[COL.date]    || '');
    const deliveredDate = parseGvizDate(row[COL.del_date] || '');
    const deliveredBy   = (row[COL.del_by]      || '').trim();
    const link          = (row[COL.order_link]  || '').trim();

    const p = { order, client, assign, service, status, amtX, date, deliveredDate, deliveredBy, link };
    const k = pkey(p);
    if (seen.has(k)) return;
    seen.add(k);

    const parts = assign.split(/[\/,]/);
    const teamSet = new Set(), memberNames = [];
    parts.forEach(pt => {
      const tk  = normalizeAssigneeToken(pt).toLowerCase();
      const mem = lookup[tk];
      if (mem) { teamSet.add(mem.team); memberNames.push(mem.name); }
    });
    p._teams   = [...teamSet];
    p._members = memberNames;
    projects.push(p);
  });

  return projects.sort((a, b) => (b.deliveredDate || b.date || '').localeCompare(a.deliveredDate || a.date || ''));
}

async function fetchDeliveredFromApi() {
  const r = await fetch('/api/data', { cache: 'no-store' });
  if (!r.ok) throw new Error('API failed');
  const data = await r.json();
  if (data.status !== 'ok') throw new Error('API error');
  const seen = new Set(), projects = [];
  (data.data || []).forEach(m => {
    (m.projects || []).forEach(p => {
      if (p.status !== 'Delivered') return;
      const k = pkey(p);
      if (seen.has(k)) return;
      seen.add(k);
      projects.push({
        order:         p.order         || '',
        client:        p.client        || '',
        assign:        p.assign        || p.deliveredBy || '',
        service:       p.service       || '',
        status:        'Delivered',
        amtX:          p.amtX          || 0,
        date:          p.date          || '',
        deliveredDate: p.deliveredDate || '',
        deliveredBy:   p.deliveredBy   || '',
        link:          p.link          || p.order_link || '',
        _teams:        [m.team].filter(Boolean),
        _members:      [m.name],
      });
    });
  });
  return projects.sort((a, b) => (b.deliveredDate || b.date || '').localeCompare(a.deliveredDate || a.date || ''));
}
