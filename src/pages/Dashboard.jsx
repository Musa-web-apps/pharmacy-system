import { useState } from 'react'
import { S, Icon, icons, fmtUGX, today } from '../shared.jsx'

export default function Dashboard({ drugs, sales, onNavigate }) {
  const totalStock = drugs.reduce((s, d) => s + d.qty, 0)
  const totalValue = drugs.reduce((s, d) => s + d.qty * d.cost, 0)
  const todaySales = sales.filter(s => s.date === today())
  const todayRevenue = todaySales.reduce((s, x) => s + x.total, 0)

  // Low stock alerts
  const lowStock = drugs.filter(d => d.qty <= d.reorder)

  // Expiring drugs (within 5 months = ~150 days)
  const nowMs = Date.now()
  const expiringDrugs = drugs.filter(d => {
    const diff = (new Date(d.expiry) - nowMs) / 86400000
    return diff > 0 && diff <= 150
  }).sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
  const expired = drugs.filter(d => new Date(d.expiry) < new Date())

  // Debtors
  const creditSales = sales.filter(s => s.payMethod === 'Credit')
  const debtors = {}
  creditSales.forEach(s => {
    const out = (s.creditAmount || 0) - (s.creditPaid || 0)
    if (out <= 0) return
    if (!debtors[s.customer]) debtors[s.customer] = { total: 0, count: 0 }
    debtors[s.customer].total += out
    debtors[s.customer].count++
  })
  const debtorList = Object.entries(debtors).sort((a, b) => b[1].total - a[1].total)
  const totalOutstanding = debtorList.reduce((s, [, d]) => s + d.total, 0)

  const totalAlerts = lowStock.length + expiringDrugs.length + expired.length + debtorList.length

  return (
    <div>
      <h1 style={S.header}>Dashboard</h1>
      <div style={S.grid}>
        <div style={S.statCard('#4fc3f7')}>
          <div style={S.statLabel}>Total Products</div>
          <div style={S.statValue}>{drugs.length}</div>
          <div style={S.statSub}>{totalStock.toLocaleString()} units in stock</div>
        </div>
        <div style={S.statCard('#4caf82')}>
          <div style={S.statLabel}>Stock Value</div>
          <div style={S.statValue}>{fmtUGX(totalValue)}</div>
          <div style={S.statSub}>At cost price</div>
        </div>
        <div style={S.statCard('#e5a943')}>
          <div style={S.statLabel}>Today's Sales</div>
          <div style={S.statValue}>{todaySales.length}</div>
          <div style={S.statSub}>{fmtUGX(todayRevenue)} revenue</div>
        </div>
        <div style={S.statCard('#e8735a')}>
          <div style={S.statLabel}>Alerts</div>
          <div style={S.statValue}>{totalAlerts}</div>
          <div style={S.statSub}>{lowStock.length} low stock, {expiringDrugs.length + expired.length} expiry, {debtorList.length} debtors</div>
        </div>
      </div>

      {/* Reminders Section */}
      {totalAlerts > 0 && (
        <div style={{ ...S.card, marginBottom: 20, padding: 20, borderLeft: '4px solid #e5a943' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon d={icons.alert} size={20} color="#e5a943"/> Reminders & Alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Debtors */}
            {debtorList.length > 0 && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(229,169,67,0.08)', border: '1px solid rgba(229,169,67,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e5a943' }}>Outstanding Debts ({debtorList.length} debtor{debtorList.length > 1 ? 's' : ''})</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#e5a943' }}>{fmtUGX(totalOutstanding)}</span>
                </div>
                {debtorList.slice(0, 5).map(([name, d]) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: 'var(--text3)' }}>
                    <span>{name} ({d.count} sale{d.count > 1 ? 's' : ''})</span>
                    <span style={{ fontWeight: 600, color: 'var(--text2)' }}>{fmtUGX(d.total)}</span>
                  </div>
                ))}
                {debtorList.length > 5 && <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 4 }}>+{debtorList.length - 5} more...</div>}
                {onNavigate && <button style={{ ...S.btn('#e5a943', '#fff'), padding: '4px 12px', fontSize: 12, marginTop: 8 }} onClick={() => onNavigate('debtors')}>View All Debtors</button>}
              </div>
            )}

            {/* Low Stock */}
            {lowStock.length > 0 && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(224,93,93,0.08)', border: '1px solid rgba(224,93,93,0.15)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e05d5d', marginBottom: 6 }}>Low Stock ({lowStock.length} item{lowStock.length > 1 ? 's' : ''} at or below reorder level)</div>
                {lowStock.slice(0, 5).map(d => (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: 'var(--text3)' }}>
                    <span>{d.name}</span>
                    <span style={{ fontWeight: 600, color: d.qty === 0 ? '#e05d5d' : '#e5a943' }}>{d.qty} left (reorder: {d.reorder})</span>
                  </div>
                ))}
                {lowStock.length > 5 && <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 4 }}>+{lowStock.length - 5} more...</div>}
                {onNavigate && <button style={{ ...S.btn('#e05d5d', '#fff'), padding: '4px 12px', fontSize: 12, marginTop: 8 }} onClick={() => onNavigate('inventory')}>View Inventory</button>}
              </div>
            )}

            {/* Expired */}
            {expired.length > 0 && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(224,93,93,0.08)', border: '1px solid rgba(224,93,93,0.15)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e05d5d', marginBottom: 6 }}>Expired Drugs ({expired.length})</div>
                {expired.slice(0, 5).map(d => (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: 'var(--text3)' }}>
                    <span>{d.name} ({d.batch})</span>
                    <span style={{ fontWeight: 600, color: '#e05d5d' }}>Expired {d.expiry}</span>
                  </div>
                ))}
                {onNavigate && <button style={{ ...S.btn('#e05d5d', '#fff'), padding: '4px 12px', fontSize: 12, marginTop: 8 }} onClick={() => onNavigate('expiring')}>View Expiring Drugs</button>}
              </div>
            )}

            {/* Expiring Soon */}
            {expiringDrugs.length > 0 && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(229,169,67,0.08)', border: '1px solid rgba(229,169,67,0.15)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e5a943', marginBottom: 6 }}>Expiring Within 5 Months ({expiringDrugs.length} item{expiringDrugs.length > 1 ? 's' : ''})</div>
                {expiringDrugs.slice(0, 5).map(d => {
                  const days = Math.ceil((new Date(d.expiry) - nowMs) / 86400000)
                  return (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: 'var(--text3)' }}>
                      <span>{d.name} ({d.batch}) - Qty: {d.qty}</span>
                      <span style={{ fontWeight: 600, color: days <= 30 ? '#e05d5d' : days <= 90 ? '#e5a943' : 'var(--text2)' }}>{days} days left ({d.expiry})</span>
                    </div>
                  )
                })}
                {expiringDrugs.length > 5 && <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 4 }}>+{expiringDrugs.length - 5} more...</div>}
                {onNavigate && <button style={{ ...S.btn('#e5a943', '#fff'), padding: '4px 12px', fontSize: 12, marginTop: 8 }} onClick={() => onNavigate('expiring')}>View All Expiring</button>}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ ...S.card, flex: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#ff8a65' }}>Low Stock Alerts</h3>
          {lowStock.length === 0 ? <div style={S.dimText}>All items above reorder level</div> : (
            <table style={S.table}>
              <thead><tr><th style={S.th}>Drug</th><th style={S.th}>Qty</th><th style={S.th}>Reorder</th></tr></thead>
              <tbody>
                {lowStock.map(d => (
                  <tr key={d.id}>
                    <td style={S.td}>{d.name}</td>
                    <td style={{ ...S.td, color: d.qty === 0 ? '#e05d5d' : '#e5a943', fontWeight: 600 }}>{d.qty}</td>
                    <td style={S.td}>{d.reorder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ ...S.card, flex: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#ffd54f' }}>Expiry Alerts</h3>
          {[...expired, ...expiringDrugs].length === 0 ? <div style={S.dimText}>No expiry concerns</div> : (
            <table style={S.table}>
              <thead><tr><th style={S.th}>Drug</th><th style={S.th}>Batch</th><th style={S.th}>Expiry</th><th style={S.th}>Status</th></tr></thead>
              <tbody>
                {[...expired, ...expiringDrugs].slice(0, 10).map(d => {
                  const isExp = new Date(d.expiry) < new Date()
                  const days = Math.ceil((new Date(d.expiry) - nowMs) / 86400000)
                  return (
                    <tr key={d.id}>
                      <td style={S.td}>{d.name}</td>
                      <td style={S.td}>{d.batch}</td>
                      <td style={S.td}>{d.expiry}</td>
                      <td style={S.td}><span style={S.badge(isExp ? '#fde8e8' : '#fef3cd', isExp ? '#c53030' : '#856404')}>{isExp ? 'Expired' : `${days}d left`}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
