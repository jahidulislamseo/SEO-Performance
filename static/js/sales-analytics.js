async function fetchAnalyticsTable() {
    try {
        const response = await fetch('/api/finance-stats');
        const result = await response.json();
        
        if (result.status === 'ok') {
            const tbody = document.querySelector('#analytics-table tbody');
            if (!tbody) return;
            
            let html = '';
            
            result.months.forEach(month => {
                const rowData = result.data[month];
                if (!rowData) return;
                
                const fiverr = rowData.platforms.Fiverr || 0;
                const upwork = rowData.platforms.Upwork || 0;
                const b2b = rowData.platforms.B2B || 0;
                
                let focusColor = '#94a3b8';
                if (rowData.focus.includes('🔴')) focusColor = '#ef4444';
                else if (rowData.focus.includes('🟢')) focusColor = '#10b981';
                else if (rowData.focus.includes('⚠️')) focusColor = '#f59e0b';
                else if (rowData.focus.includes('⭐')) focusColor = '#3b82f6';
                
                const revClass = rowData.total_sales > 40000 ? 'color: #10b981;' : (rowData.total_sales < 10000 ? 'color: #ef4444;' : 'color: #f1f5f9;');
                
                html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 16px; font-weight: 800; color: #f1f5f9;">${month}</td>
                    <td style="padding: 16px; text-align: right; font-weight: 900; ${revClass}">$${rowData.total_sales.toLocaleString()}</td>
                    <td style="padding: 16px; text-align: right; font-weight: 700; color: #cbd5e1;">${rowData.total_deliveries} <span style="font-size: 10px; color:#64748b;">orders</span></td>
                    <td style="padding: 16px; text-align: right; color: #10b981; font-weight: 600;">$${fiverr.toLocaleString()}</td>
                    <td style="padding: 16px; text-align: right; color: #14a800; font-weight: 600;">$${upwork.toLocaleString()}</td>
                    <td style="padding: 16px; text-align: right; color: #0ea5e9; font-weight: 600;">$${b2b.toLocaleString()}</td>
                    <td style="padding: 16px; text-align: right; color: #a855f7; font-weight: 800;">$${rowData.repeat_sales.toLocaleString()}</td>
                    <td style="padding: 16px; text-align: left; padding-left: 30px; font-weight: 600; color: ${focusColor}; font-size: 12px;">${rowData.focus}</td>
                </tr>`;
            });
            
            tbody.innerHTML = html;
        }
    } catch (e) {
        console.error('Error loading analytics table:', e);
    }
}

document.addEventListener('DOMContentLoaded', fetchAnalyticsTable);
