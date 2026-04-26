/* ═══════════════════════════════════════════════════════════════
   config.js — All application constants
   Import this on every page before other scripts.
   ═══════════════════════════════════════════════════════════════ */

const SHEET_ID = '1jClQQmwVHg4Eg3WGda0R3w7_B_qwuRE5_W4QGxvabIE';
const DEPT_TARGET = 36000;
const MEM_TARGET = 1100;

const TEAM_TARGETS = {
  'GEO Rankers': 6000,
  'Rank Riser': 12000,
  'Search Apex': 9000,
  'SMM': 7700,
};

// Column indices in "Kam Data" sheet (0-indexed)
const COL = {
  date: 3,   // D
  client: 10,  // K
  order_num: 13,  // N
  order_link: 14,  // O
  assign: 18,  // S
  status: 19,  // T
  service: 20,  // U
  del_by: 21,  // V
  del_date: 22,  // W
  amount_x: 23,  // X
};

// Management hierarchy
const MGMT = {
  manager: { name: 'Mehedi Hassan', title: 'Project Manager' },
  leaders: {
    'GEO Rankers': { name: 'Md. Jahidul Islam', title: 'Team Leader' },
    'Rank Riser': { name: 'Gazi Fahim Hasan', title: 'Team Leader' },
    'Search Apex': { name: 'Shihadul Islam Tihim', title: 'Team Leader' },
    'SMM': { name: 'Istiak', title: 'Team Leader' },
  },
};

// Team visual config
const TC = {
  'GEO Rankers': { color: '#6366f1', bg: 'rgba(99,102,241,.15)', border: 'rgba(99,102,241,.3)', icon: '🌍' },
  'Rank Riser': { color: '#10b981', bg: 'rgba(16,185,129,.15)', border: 'rgba(16,185,129,.3)', icon: '📈' },
  'Search Apex': { color: '#f59e0b', bg: 'rgba(245,158,11,.15)', border: 'rgba(245,158,11,.3)', icon: '🔍' },
  'SMM': { color: '#ec4899', bg: 'rgba(236,72,153,.15)', border: 'rgba(236,72,153,.3)', icon: '🌑' },
};

// Member avatar gradient palette
const MC = [
  ['#6366f1', '#8b5cf6'], ['#10b981', '#06b6d4'], ['#f59e0b', '#ef4444'],
  ['#3b82f6', '#6366f1'], ['#ec4899', '#8b5cf6'], ['#14b8a6', '#3b82f6'],
  ['#8b5cf6', '#ec4899'], ['#06b6d4', '#10b981'], ['#ef4444', '#f59e0b'],
];

// Fallback member list (used if "All Member Data" sheet fetch fails)
let ALL_MEMBERS = [
  { name: 'Jahidul', fullName: 'Md. Jahidul Islam', id: '17137', team: 'GEO Rankers', role: 'Team Leader', target: MEM_TARGET },
  { name: 'Sabit', fullName: 'MD SAIMUN SABED', id: '17384', team: 'GEO Rankers', target: MEM_TARGET },
  { name: 'Komal', fullName: 'Komal Chandro Roy', id: '17066', team: 'GEO Rankers', target: MEM_TARGET },
  { name: 'Hasibul', fullName: 'Md. Hasibul Hasan', id: '17135', team: 'GEO Rankers', target: MEM_TARGET },
  { name: 'Shourav', fullName: 'Shafiul Alam Shourav', id: '17524', team: 'GEO Rankers', target: MEM_TARGET },
  { name: 'Roni', fullName: 'Rony', id: '17490', team: 'GEO Rankers', target: MEM_TARGET },
  { name: 'Sushant', fullName: 'Shosunth Chakarborty', id: '17294', team: 'Rank Riser', target: MEM_TARGET },
  { name: 'Sammi', fullName: 'Samiel Hembrom', id: '17234', team: 'Rank Riser', target: MEM_TARGET },
  { name: 'Samia', fullName: 'Samia ahmed', id: '17491', team: 'Rank Riser', target: MEM_TARGET },
  { name: 'Pinky', fullName: 'Afsana Parvin Pinky', id: '17385', team: 'Rank Riser', target: MEM_TARGET },
  { name: 'Reza', fullName: 'Ahmed Al Reza', id: '17074', team: 'Rank Riser', target: MEM_TARGET },
  { name: 'Aritri', fullName: 'Aritri Biswas Sneha', id: '17541', team: 'Rank Riser', target: MEM_TARGET },
  { name: 'Robel', fullName: 'Muhammad Ali Robel', id: '17046', team: 'Rank Riser', target: MEM_TARGET },
  { name: 'Sobuz', fullName: 'MD.Sobuj Hossain', id: '17152', team: 'Rank Riser', target: MEM_TARGET },
  { name: 'Istiak Ahmed', fullName: 'Istiak Ahmed Soikot', id: '17383', team: 'Rank Riser', target: MEM_TARGET },
  { name: 'Wakil', fullName: 'Waqil Hafiz', id: '17488', team: 'Rank Riser', target: MEM_TARGET },
  { name: 'Rasel', fullName: 'Rasel Mia', id: '17049', team: 'Rank Riser', target: MEM_TARGET },
  { name: 'Gazi Fahim', fullName: 'Gazi Fahim Hasan', id: '17149', team: 'Rank Riser', role: 'Team Leader', target: MEM_TARGET },
  { name: 'Rezwan', fullName: 'Rezwan Ahmed', id: '17492', team: 'Search Apex', target: MEM_TARGET },
  { name: 'Jobaeid', fullName: 'Jobaeid Kha', id: '17493', team: 'Search Apex', target: MEM_TARGET },
  { name: 'Harun', fullName: 'Harun', id: '17299', team: 'Search Apex', target: MEM_TARGET },
  { name: 'Babu', fullName: 'Nishar Farazi Babu', id: '17317', team: 'Search Apex', target: MEM_TARGET },
  { name: 'Akash', fullName: 'ashiqur Rahaman', id: '17369', team: 'Search Apex', target: MEM_TARGET },
  { name: 'Sifat', fullName: 'M A Muyeed Sifat', id: '17246', team: 'Search Apex', target: MEM_TARGET },
  { name: 'Imran', fullName: 'Sheikh Al Imran', id: '17301', team: 'Search Apex', target: MEM_TARGET },
  { name: 'Tihim', fullName: 'Shihadul Islam Tihim', id: '17248', team: 'Search Apex', role: 'Team Leader', target: MEM_TARGET },
  { name: 'Alamin', fullName: 'Al Amin', id: '17236', team: 'SMM', target: MEM_TARGET },
  { name: 'Ibrahim', fullName: 'Ibrahim', id: '17136', team: 'SMM', target: MEM_TARGET },
  { name: 'Raj', fullName: 'Atikuzzaman Raj', id: '17235', team: 'SMM', target: MEM_TARGET },
  { name: 'Turjo', fullName: 'Tohidul Islam Turjo', id: '17058', team: 'SMM', target: MEM_TARGET },
  { name: 'Saiful', fullName: 'Saiful Islam Sagor', id: '17318', team: 'SMM', target: MEM_TARGET },
  { name: 'Romjan', fullName: 'Md Romjanul Islam', id: '17233', team: 'SMM', target: MEM_TARGET },
  { name: 'Istiak', fullName: 'Istiak', id: '17238', team: 'SMM', role: 'Team Leader', target: 0 },
];

// Name → canonical name lookup (rebuilt whenever ALL_MEMBERS changes)
let MEMBER_LOOKUP = {};
function rebuildMemberLookup() {
  MEMBER_LOOKUP = {};
  ALL_MEMBERS.forEach(m => { MEMBER_LOOKUP[m.name.trim().toLowerCase()] = m.name; });
  MEMBER_LOOKUP['istak'] = 'Istiak';
  MEMBER_LOOKUP['istak ahamed'] = 'Istiak';
}
rebuildMemberLookup();
