import { useState } from 'react'
import { S, Icon, icons, fmtUGX, GlassBar, exportCSV, printSection } from '../shared.jsx'

export default function Analytics({ drugs, sales }) {
  const [period, setPeriod] = useState('30')

  const now = new Date()
  const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - +period)
  const filtered = sales.filter(s => new Date(s.date) >= cutoff)

  const drugSales = {}
  filtered.forEach(s => s.items.forEach(it => { drugSales[it.name] = (drugSales[it.name] || 0) + it.qty }))
  const fastMovers = Object.entries(drugSales).sort((a, b) => b[1] - a[1])
  const topMax = fastMovers[0]?.[1] || 1
  const slowMovers = drugs.map(d => ({ name: d.name, sold: drugSales[d.name] || 0 })).sort((a, b) => a.sold - b.sold).slice(0, 5)

  const lowStock = drugs.filter(d => d.qty <= d.reorder).sort((a, b) => a.qty - b.qty)
  const expired = drugs.filter(d => new Date(d.expiry) < now)
  const nearExpiry = drugs.filter(d => { const diff = (new Date(d.expiry) - now) / 86400000; return diff > 0 && diff < 90 })

  const dailyRev = {}
  filtered.forEach(s => { dailyRev[s.date] = (dailyRev[s.date] || 0) + s.total })
  const days = Object.entries(dailyRev).sort((a, b) => a[0].localeCompare(b[0]))
  const maxDayRev = Math.max(...days.map(d => d[1]), 1)

  const catRev = {}
  filtered.forEach(s => s.items.forEach(it => {
    const drug = drugs.find(d => d.id === it.drugId)
    catRev[drug?.category || 'Other'] = (catRev[drug?.category || 'Other'] || 0) + it.price * it.qty
  }))
  const catEntries = Object.entries(catRev).sort((a, b) => b[1] - a[1])
  const maxCatRev = catEntries[0]?.[1] || 1

  const totalRev = filtered.reduce((s, x) => s + x.total, 0)
  const totalCost = filtered.reduce((s, x) => s + x.items.reduce((c, it) => c + (drugs.find(d => d.id === it.drugId)?.cost || 0) * it.qty, 0), 0)
  const profit = totalRev - totalCost
  const avgDaily = days.length > 0 ? totalRev / days.length : 0

  const catColors = ['#4fc3f7', '#4caf82', '#e5a943', '#e8735a', '#9b7fe6', '#ff8a65', '#26c6da', '#ab47bc']

  const exportExpired = () => exportCSV('expired_stock.csv', ['Drug','Batch','Qty','Cost/Unit','Total Loss','Expiry'], expired.map(d => [d.name, d.batch, d.qty, d.cost, d.qty * d.cost, d.expiry]))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={S.header}>Analytics</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {expired.length > 0 && <button style={S.btn('#fde8e8', '#c53030')} onClick={exportExpired}><Icon d={icons.download} size={14}/> Export Expired</button>}
          <button style={S.btn('#f0f2f5', '#333')} onClick={() => printSection('Analytics Report', 'analytics-content')}><Icon d={icons.print} size={14}/> Print</button>
          <select style={S.select} value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="7">Last 7 Days</option><option value="14">Last 14 Days</option><option value="30">Last 30 Days</option>
          </select>
        </div>
      </div>

      <div id="analytics-content">
        <div style={S.grid}>
          <div style={S.statCard('#4fc3f7')}><div style={S.statLabel}>Total Revenue</div><div style={S.statValue}>{fmtUGX(totalRev)}</div><div style={S.statSub}>{filtered.length} transactions</div></div>
          <div style={S.statCard('#4caf82')}><div style={S.statLabel}>Gross Profit</div><div style={S.statValue}>{fmtUGX(profit)}</div><div style={S.statSub}>{totalRev > 0 ? ((profit / totalRev) * 100).toFixed(1) : 0}% margin</div></div>
          <div style={S.statCard('#e5a943')}><div style={S.statLabel}>Avg. Daily Revenue</div><div style={S.statValue}>{fmtUGX(avgDaily)}</div><div style={S.statSub}>Over {days.length} days</div></div>
          <div style={S.statCard('#9b7fe6')}><div style={S.statLabel}>Items Sold</div><div style={S.statValue}>{filtered.reduce((s, x) => s + x.items.reduce((c, it) => c + it.qty, 0), 0)}</div><div style={S.statSub}>{Object.keys(drugSales).length} unique products</div></div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ ...S.card, flex: 2 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#4fc3f7' }}>Daily Revenue Trend</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 160, padding: '0 4px' }}>
              {days.map(([date, rev]) => (
                <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }} title={`${date}: ${fmtUGX(rev)}`}>
                  <div style={{ width: '100%', maxWidth: 28, height: (rev / maxDayRev) * 140, borderRadius: '4px 4px 0 0', background: 'linear-gradient(180deg, #4fc3f7, #4fc3f766)', boxShadow: '0 0 6px #4fc3f733' }}/>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{date.split('-')[2]}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...S.card, flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#9b7fe6' }}>Revenue by Category</h3>
            {catEntries.map(([cat, rev], i) => <GlassBar key={cat} label={cat} value={rev} max={maxCatRev} color={catColors[i % catColors.length]} sub={fmtUGX(rev)}/>)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ ...S.card, flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#4caf82' }}>Fast-Moving Drugs</h3>
            {fastMovers.slice(0, 8).map(([name, qty], i) => <GlassBar key={name} label={`${i + 1}. ${name}`} value={qty} max={topMax} color="#4caf82" sub={`${qty} sold`}/>)}
            {fastMovers.length === 0 && <div style={S.mutedText}>No sales data yet</div>}
          </div>
          <div style={{ ...S.card, flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#ff8a65' }}>Slow-Moving Drugs</h3>
            {slowMovers.map((d, i) => <GlassBar key={d.name} label={`${i + 1}. ${d.name}`} value={d.sold} max={topMax} color="#ff8a65" sub={d.sold === 0 ? 'No sales' : `${d.sold} sold`}/>)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ ...S.card, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e5a943' }}>Low Stock ({lowStock.length})</h3>
              {lowStock.length > 0 && <button style={{ ...S.btn('#f0f2f5', '#333'), padding: '4px 10px' }} onClick={() => exportCSV('low_stock.csv', ['Drug','In Stock','Reorder','Deficit'], lowStock.map(d => [d.name, d.qty, d.reorder, d.reorder - d.qty]))}><Icon d={icons.download} size={12}/></button>}
            </div>
            {lowStock.length === 0 ? <div style={S.mutedText}>All items sufficiently stocked</div> : (
              <table style={S.table}>
                <thead><tr><th style={S.th}>Drug</th><th style={S.th}>In Stock</th><th style={S.th}>Reorder</th><th style={S.th}>Deficit</th></tr></thead>
                <tbody>{lowStock.map(d => (
                  <tr key={d.id}><td style={{ ...S.td, fontWeight: 500 }}>{d.name}</td><td style={{ ...S.td, color: d.qty === 0 ? '#e05d5d' : '#e5a943', fontWeight: 600 }}>{d.qty}</td><td style={S.td}>{d.reorder}</td><td style={{ ...S.td, color: '#e05d5d', fontWeight: 600 }}>{d.reorder - d.qty}</td></tr>
                ))}</tbody>
              </table>
            )}
          </div>
          <div style={{ ...S.card, flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#e05d5d' }}>Expired & Expiring Stock</h3>
            {expired.length === 0 && nearExpiry.length === 0 ? <div style={S.mutedText}>No expiry concerns</div> : (
              <table style={S.table}>
                <thead><tr><th style={S.th}>Drug</th><th style={S.th}>Batch</th><th style={S.th}>Qty</th><th style={S.th}>Expiry</th><th style={S.th}>Status</th></tr></thead>
                <tbody>{[...expired.map(d => ({ ...d, _exp: true })), ...nearExpiry.map(d => ({ ...d, _exp: false }))].map(d => (
                  <tr key={d.id} style={{ background: d._exp ? 'rgba(224,93,93,0.08)' : 'rgba(229,169,67,0.06)' }}>
                    <td style={{ ...S.td, fontWeight: 500 }}>{d.name}</td><td style={S.td}>{d.batch}</td><td style={S.td}>{d.qty}</td><td style={S.td}>{d.expiry}</td>
                    <td style={S.td}><span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: d._exp ? 'rgba(224,93,93,0.15)' : 'rgba(229,169,67,0.15)', color: d._exp ? '#ef5350' : '#ffd54f' }}>{d._exp ? 'EXPIRED' : `${Math.ceil((new Date(d.expiry) - now) / 86400000)}d left`}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
            {expired.length > 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(224,93,93,0.08)', border: '1px solid rgba(224,93,93,0.15)', fontSize: 12 }}>
                <b style={{ color: '#ef5350' }}>Expired Value:</b> {fmtUGX(expired.reduce((s, d) => s + d.qty * d.cost, 0))} ({expired.reduce((s, d) => s + d.qty, 0)} units to dispose)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
