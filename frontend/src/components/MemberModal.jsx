import React, { useState } from 'react';
import { avatarGradient, getInitials } from './MemberCard';

const MemberModal = ({ member, onClose }) => {
  const [modalTab, setModalTab] = useState('all');

  if (!member) return null;

  const projects = member.projects || [];
  const filteredProjects = modalTab === 'all' 
    ? projects 
    : projects.filter(p => p.status === modalTab);

  const statusBadge = (status) => {
    const styles = {
      'Delivered': { bg: 'rgba(16,185,129,.12)', color: '#10b981' },
      'WIP': { bg: 'rgba(245,158,11,.12)', color: '#f59e0b' },
      'Revision': { bg: 'rgba(99,102,241,.12)', color: '#a5b4fc' },
      'Cancelled': { bg: 'rgba(239,68,68,.12)', color: '#ef4444' },
    };
    const s = styles[status] || { bg: 'rgba(148,163,184,.12)', color: '#94a3b8' };
    return (
      <span style={{ 
        padding: '2px 8px', 
        borderRadius: 4, 
        fontSize: 10, 
        fontWeight: 700, 
        background: s.bg, 
        color: s.color,
        marginLeft: 8
      }}>
        {status}
      </span>
    );
  };

  return (
    <div className={`overlay open`} onClick={e => { if(e.target.classList.contains('overlay')) onClose(); }}>
      <div className="modal">
        <div className="m-hdr">
          <div className="m-top">
            <div className="m-av-wrap">
              <div className="m-av" style={{ background: avatarGradient(member.name) }}>{getInitials(member.name)}</div>
              <div>
                <div className="m-name">{member.name}</div>
                <div className="m-sub">{member.team}</div>
                <div className="m-kpis" style={{ display:'flex', gap:14, marginTop:6 }}>
                  <span style={{fontSize:13,fontWeight:800,color:'#10b981'}}>${(member.deliveredAmt || 0).toLocaleString()} delivered</span>
                  <span style={{fontSize:13,fontWeight:700,color:'#f59e0b'}}>${(member.wipAmt || 0).toLocaleString()} WIP</span>
                </div>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="m-tabs">
            {['all','Delivered','WIP','Revision','Cancelled'].map(t => (
              <button
                key={t}
                className={`mtab ${modalTab === t ? 'active' : ''}`}
                onClick={() => setModalTab(t)}
              >
                {t === 'all' ? 'All' : t === 'Delivered' ? '✅ Delivered' : t === 'WIP' ? '⏳ WIP' : t === 'Revision' ? '🔄 Revision' : '❌ Cancelled'}
              </button>
            ))}
          </div>
        </div>
        <div className="m-body">
          {filteredProjects.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No projects found for this category.</div>
          ) : (
            filteredMembersProjects(filteredProjects).map((p, i) => (
              <div key={i} className="proj-row">
                <div>
                  <div className="proj-title">{p.order || p.client}</div>
                  <div className="proj-meta">{p.service} · {p.date}</div>
                </div>
                <div className="proj-right">
                  <span className="proj-amt" style={{ color: p.status === 'Delivered' ? '#10b981' : p.status === 'WIP' ? '#f59e0b' : '#94a3b8' }}>
                    ${(p.share || p.amtX || 0).toLocaleString()}
                  </span>
                  {statusBadge(p.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Helper to handle the API data structure vs the UI Kit structure
const filteredMembersProjects = (projects) => {
  return projects.map(p => ({
    order: p.order,
    client: p.client,
    service: p.service,
    date: p.date,
    status: p.status,
    share: p.share || p.amtX || 0
  }));
};

export default MemberModal;
