// KpiCard.jsx — KPI metric card + DeptOverview card
// Exports: KpiCard, DeptOverview

const KpiCard = ({ label, value, sub, color = '#f1f5f9', icon }) => {
  return React.createElement('div', { className: 'kpi-card' },
    React.createElement('div', { className: 'kpi-tag' }, icon ? `${icon} ${label}` : label),
    React.createElement('div', { className: 'kpi-val', style: { color } }, value),
    sub && React.createElement('div', { className: 'kpi-sub' }, sub)
  );
};

const DeptOverview = ({ total = 35000, delivered = 0, wip = 0, cancelled = 0, members = 0, dept = 'GEO Rankers', month = 'April 2026' }) => {
  const pct = Math.min(100, Math.round((delivered / total) * 100));
  const dashArray = 263.9;
  const dashOffset = dashArray - (dashArray * pct / 100);

  return React.createElement('div', { className: 'dept-card' },
    React.createElement('div', { className: 'dept-inner' },
      React.createElement('div', null,
        React.createElement('div', { className: 'dept-tag' }, 'Department Overview'),
        React.createElement('div', { className: 'dept-heading' },
          `$${delivered.toLocaleString()} delivered`
        ),
        React.createElement('div', { className: 'dept-sub' },
          `${dept} · ${pct}% of $${total.toLocaleString()} target · ${month}`
        ),
        React.createElement('div', { className: 'dept-track' },
          React.createElement('div', { className: 'dept-fill', style: { width: `${pct}%` } })
        ),
        React.createElement('div', { className: 'dept-tlabels' },
          React.createElement('span', null, '$0'),
          React.createElement('span', null, `Target: $${total.toLocaleString()}`)
        ),
        React.createElement('div', { className: 'dept-kpis' },
          React.createElement('div', { className: 'dkpi' },
            React.createElement('div', { className: 'dkpi-val', style: { color: '#f59e0b' } }, `$${wip.toLocaleString()}`),
            React.createElement('div', { className: 'dkpi-lbl' }, 'WIP')
          ),
          React.createElement('div', { className: 'dkpi' },
            React.createElement('div', { className: 'dkpi-val', style: { color: '#ef4444' } }, `$${cancelled.toLocaleString()}`),
            React.createElement('div', { className: 'dkpi-lbl' }, 'Cancelled')
          ),
          React.createElement('div', { className: 'dkpi' },
            React.createElement('div', { className: 'dkpi-val', style: { color: '#cbd5e1' } }, members),
            React.createElement('div', { className: 'dkpi-lbl' }, 'Members')
          )
        )
      ),
      // Ring chart
      React.createElement('div', { className: 'dept-ring-wrap' },
        React.createElement('div', { className: 'dept-ring-container' },
          React.createElement('svg', { width: 96, height: 96, viewBox: '0 0 100 100' },
            React.createElement('circle', { className: 'ring-bg', cx: 50, cy: 50, r: 42, stroke: 'rgba(255,255,255,.06)', strokeWidth: 8, fill: 'none' }),
            React.createElement('circle', {
              fill: 'none', cx: 50, cy: 50, r: 42,
              stroke: '#6366f1', strokeWidth: 8,
              strokeDasharray: dashArray,
              strokeDashoffset: dashOffset,
              strokeLinecap: 'round',
              style: { transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1.8s ease' }
            })
          ),
          React.createElement('div', { className: 'dept-ring-inner' },
            React.createElement('div', { className: 'dept-ring-pct' }, `${pct}%`),
            React.createElement('div', { className: 'dept-ring-lbl' }, 'Done')
          )
        ),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--m2)', fontWeight: 600, marginTop: 6 } }, 'Dept Progress')
      )
    )
  );
};

Object.assign(window, { KpiCard, DeptOverview });
