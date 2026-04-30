import React, { useState } from 'react';

const MemberModal = ({ member, onClose }) => {
  const [modalTab, setModalTab] = useState('all');

  if (!member) return null;

  const projects = member.projects || [];
  const filteredProjects = modalTab === 'all' 
    ? projects 
    : projects.filter(p => p.status === modalTab);

  const statusBadge = (status) => {
    const styles = {
      'Delivered': { bg: 'rgba(16,185,129,.1)', color: '#10b981', border: 'rgba(16,185,129,.2)' },
      'WIP': { bg: 'rgba(245,158,11,.1)', color: '#f59e0b', border: 'rgba(245,158,11,.2)' },
      'Revision': { bg: 'rgba(139,92,246,.1)', color: '#a78bfa', border: 'rgba(139,92,246,.2)' },
      'Cancelled': { bg: 'rgba(239,68,68,.1)', color: '#ef4444', border: 'rgba(239,68,68,.2)' },
    };
    const s = styles[status] || { bg: 'rgba(148,163,184,.1)', color: '#94a3b8', border: 'rgba(148,163,184,.2)' };
    return (
      <span style={{ 
        padding: '4px 12px', borderRadius: '6px', fontSize: '9px', fontWeight: 900, 
        background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: 'uppercase'
      }}>
        {status}
      </span>
    );
  };

  const deliveredAmt = member.deliveredAmt || 0;
  const wipAmt = member.wipAmt || 0;
  const deliveredCount = projects.filter(p => p.status === 'Delivered').length;
  const wipCount = projects.filter(p => p.status === 'WIP').length;

  return (
    <div className="overlay open" onClick={e => { if(e.target.classList.contains('overlay')) onClose(); }} style={{ zIndex: 1000 }}>
      <div className="modal" style={{ maxWidth: '900px', background: '#090F1D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '32px' }}>
        
        {/* Modal Header */}
        <div className="m-hdr" style={{ padding: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ 
                width: '64px', height: '64px', background: 'linear-gradient(135deg, #ec4899, #db2777)', 
                borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '24px', fontWeight: 900, boxShadow: '0 0 20px rgba(236, 72, 153, 0.3)'
              }}>
                {member.name?.slice(0,2).toUpperCase() || '?'}
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>{member.name}</h2>
                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>{member.team} • {member.role || 'Member'} • #{String(member.id || '').slice(-5)}</p>
              </div>
            </div>
            <button className="close-btn" onClick={onClose} style={{ width: '40px', height: '40px', borderRadius: '12px', fontSize: '20px' }}>✕</button>
          </div>

          <div style={{ display: 'flex', gap: '32px' }}>
            <KpiItem label="TOTAL" value={projects.length} />
            <KpiItem label="DELIVERED" value={deliveredCount} color="#10b981" />
            <KpiItem label="WIP" value={wipCount} color="#3b82f6" />
            <KpiItem label="DELIVERED $" value={`$${deliveredAmt.toLocaleString()}`} color="#10b981" />
            <KpiItem label="WIP $" value={`$${wipAmt.toLocaleString()}`} color="#f59e0b" />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '0 32px', marginTop: '20px' }}>
          <div className="m-tabs" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '12px' }}>
            {['all','Delivered','WIP','Revision','Cancelled'].map(t => (
              <button
                key={t}
                className={`mtab ${modalTab === t ? 'active' : ''}`}
                onClick={() => setModalTab(t)}
                style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 800 }}
              >
                {t === 'all' ? 'All Projects' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="m-body" style={{ padding: '24px 32px', gap: '16px' }}>
          {filteredProjects.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>No projects found.</div>
          ) : (
            filteredProjects.map((p, i) => (
              <ProjectCard key={i} p={p} statusBadge={statusBadge} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const KpiItem = ({ label, value, color }) => (
  <div>
    <div style={{ fontSize: '18px', fontWeight: 900, color: color || '#fff' }}>{value}</div>
    <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', letterSpacing: '0.5px' }}>{label}</div>
  </div>
);

const ProjectCard = ({ p, statusBadge }) => {
  const share = p.share || p.amtX || 0;
  const totalAmt = p.amtX || share;
  const persons = p.persons || 1;

  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', 
      borderRadius: '20px', padding: '20px', position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', fontWeight: 900, color: '#3b82f6', letterSpacing: '0.5px' }}>{p.order || "N/A"}</div>
        {statusBadge(p.status)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px 40px', marginBottom: '20px' }}>
        <InfoItem label="CLIENT" value={p.client || "N/A"} />
        <InfoItem label="SERVICE" value={p.service || "SEO"} />
        <InfoItem label="ASSIGNED" value={p.assign || p.assigned || "N/A"} />
        <InfoItem label="ORDER DATE" value={p.date || "N/A"} />
        <InfoItem label="DELIVERED" value={p.deliveredDate || p.date || "N/A"} />
        <InfoItem label="ORDER LINK" value={p.link && p.link.startsWith('http') ? <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 800 }}>Open Order ↗</a> : <span style={{ color: '#64748b' }}>N/A</span>} />
      </div>

      <div style={{ 
        background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', 
        borderRadius: '12px', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8' }}>Amount Share</div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>${totalAmt} total · your share below</div>
        </div>
        <div style={{ fontSize: '20px', fontWeight: 900, color: '#10b981' }}>${share.toLocaleString()}</div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '12px', fontWeight: 800, color: '#f1f5f9' }}>{value}</div>
  </div>
);

export default MemberModal;
