import { useState } from 'react'
import { S, Icon, icons, fmtUGX, today, exportCSV, printSection } from '../shared.jsx'

const PERIODS = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom']

function getDateRange(period, customFrom, customTo) {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  if (period === 'Daily') return { from: todayStr, to: todayStr, label: `Today (${todayStr})` }
  if (period === 'Weekly') {
    const d = new Date(now); d.setDate(d.getDate() - d.getDay())
    return { from: d.toISOString().split('T')[0], to: todayStr, label: `This Week (${d.toISOString().split('T')[0]} to ${todayStr})` }
  }
  if (period === 'Monthly') {
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    return { from, to: todayStr, label: `This Month (${from} to ${todayStr})` }
  }
  if (period === 'Yearly') {
    const from = `${now.getFullYear()}-01-01`
    return { from, to: todayStr, label: `This Year (${from} to ${todayStr})` }
  }
  return { from: customFrom || todayStr, to: customTo || todayStr, label: `${customFrom || '?'} to ${customTo || '?'}` }
}

export default function Reports({ drugs, sales, purchases }) {
  const [period, setPeriod] = useState('Daily')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [tab, setTab] = useState('sales')

  const { from, to, label } = getDateRange(period, customFrom, customTo)
  const filtered = sales.filter(s => s.date >= from && s.date <= to)
  const filtPurch = purchases.filter(p => p.date >= from && p.date <= to)

  const totalRev = filtered.reduce((s, x) => s + x.total, 0)
  const totalCost = filtered.reduce((s, x) => s + x.items.reduce((c, it) => c + (drugs.find(d => d.id === it.drugId)?.cost || 0) * it.qty, 0), 0)
  const profit = totalRev - totalCost
  const totalPurch = filtPurch.reduce((s, p) => s + p.total, 0)

  // Payment method breakdown
  const byMethod = {}
  filtered.forEach(s => {
    const m = s.payMethod || 'Cash'
    if (!byMethod[m]) byMethod[m] = { count: 0, total: 0 }
    byMethod[m].count++
    byMethod[m].total += s.total
  })

  // By customer
  const custSales = {}
  filtered.forEach(s => { if (!custSales[s.customer]) custSales[s.customer] = { count: 0, total: 0 }; custSales[s.customer].count++; custSales[s.customer].total += s.total })
  const custEntries = Object.entries(custSales).sort((a, b) => b[1].total - a[1].total)

  // Product perf
  const prodPerf = {}
  filtered.forEach(s => s.items.forEach(it => {
    if (!prodPerf[it.name]) prodPerf[it.name] = { qty: 0, revenue: 0, drugId: it.drugId }
    prodPerf[it.name].qty += it.qty; prodPerf[it.name].revenue += it.price * it.qty
  }))
  const prodEntries = Object.entries(prodPerf).map(([name, d]) => {
    const drug = drugs.find(x => x.id === d.drugId)
    const cost = (drug?.cost || 0) * d.qty
    return { name, ...d, cost, profit: d.revenue - cost, margin: d.revenue > 0 ? ((d.revenue - cost) / d.revenue * 100) : 0 }
  }).sort((a, b) => b.revenue - a.revenue)

  // Stock val
  const stockVal = drugs.map(d => ({ ...d, costVal: d.qty * d.cost, retailVal: d.qty * d.price, potentialProfit: d.qty * (d.price - d.cost) })).sort((a, b) => b.costVal - a.costVal)
  const totalStockCost = stockVal.reduce((s, d) => s + d.costVal, 0)
  const totalStockRetail = stockVal.reduce((s, d) => s + d.retailVal, 0)

  // Stock movement
  const movementByDrug = drugs.map(d => {
    const soldQty = filtered.reduce((s, sale) => s + sale.items.filter(it => it.drugId === d.id).reduce((c, it) => c + it.qty, 0), 0)
    const purchQty = filtPurch.reduce((s, po) => s + po.items.filter(it => it.drugId === d.id).reduce((c, it) => c + it.qty, 0), 0)
    const closing = d.qty
    const opening = closing + soldQty - purchQty
    return { ...d, opening, purchased: purchQty, sold: soldQty, closing }
  }).filter(d => d.sold > 0 || d.purchased > 0)

  // Daily breakdown
  const byDate = {}
  filtered.forEach(s => { if (!byDate[s.date]) byDate[s.date] = { count: 0, items: 0, rev: 0, cost: 0 }; byDate[s.date].count++; byDate[s.date].items += s.items.reduce((c, it) => c + it.qty, 0); byDate[s.date].rev += s.total; byDate[s.date].cost += s.items.reduce((c, it) => c + (drugs.find(d => d.id === it.drugId)?.cost || 0) * it.qty, 0) })
  const dateEntries = Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0]))

  // Cashier breakdown
  const byCashier = {}
  filtered.forEach(s => {
    const c = s.cashierName || 'Unknown'
    if (!byCashier[c]) byCashier[c] = { count: 0, total: 0 }
    byCashier[c].count++
    byCashier[c].total += s.total
  })
  const cashierEntries = Object.entries(byCashier).sort((a, b) => b[1].total - a[1].total)

  const tabs = [
    { id: 'sales', label: 'Sales Summary' },
    { id: 'products', label: 'Product Performance' },
    { id: 'customers', label: 'Customers' },
    { id: 'cashiers', label: 'By Cashier' },
    { id: 'stock', label: 'Stock Valuation' },
    { id: 'movement', label: 'Stock Movement' },
    { id: 'endmonth', label: 'End of Period' },
  ]

  const exportTab = () => {
    const fn = `${tab}_report_${from}_to_${to}.csv`
    if (tab === 'sales') exportCSV(fn, ['Date', 'Sales', 'Items', 'Revenue', 'Cost', 'Profit'], dateEntries.map(([d, v]) => [d, v.count, v.items, v.rev, v.cost, v.rev - v.cost]))
    else if (tab === 'products') exportCSV(fn, ['Drug', 'Qty Sold', 'Revenue', 'Cost', 'Profit', 'Margin %'], prodEntries.map(p => [p.name, p.qty, p.revenue, p.cost, p.profit, p.margin.toFixed(1)]))
    else if (tab === 'customers') exportCSV(fn, ['Customer', 'Transactions', 'Total Spent', 'Avg/Visit'], custEntries.map(([n, d]) => [n, d.count, d.total, Math.round(d.total / d.count)]))
    else if (tab === 'cashiers') exportCSV(fn, ['Cashier', 'Transactions', 'Total'], cashierEntries.map(([n, d]) => [n, d.count, d.total]))
    else if (tab === 'stock') exportCSV(fn, ['Drug', 'Qty', 'Cost/Unit', 'Total Cost', 'Price/Unit', 'Retail Value', 'Potential Profit'], stockVal.map(d => [d.name, d.qty, d.cost, d.costVal, d.price, d.retailVal, d.potentialProfit]))
    else if (tab === 'movement') exportCSV(fn, ['Drug', 'Opening', 'Purchased', 'Sold', 'Closing'], movementByDrug.map(d => [d.name, d.opening, d.purchased, d.sold, d.closing]))
    else if (tab === 'endmonth') exportCSV(fn, ['Drug', 'Opening', 'Purchases', 'Sales', 'Closing', 'Cost Value', 'Retail Value'], drugs.map(d => { const m = movementByDrug.find(x => x.id === d.id) || { opening: d.qty, purchased: 0, sold: 0, closing: d.qty }; return [d.name, m.opening, m.purchased, m.sold, m.closing, m.closing * d.cost, m.closing * d.price] }))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={S.header}>Reports</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btn('#f0f2f5', '#333')} onClick={exportTab}><Icon d={icons.download} size={14}/> Export CSV</button>
          <button style={S.btn('#f0f2f5', '#333')} onClick={() => printSection(`Report: ${tabs.find(t => t.id === tab)?.label} | ${label}`, 'report-content')}><Icon d={icons.print} size={14}/> Print</button>
        </div>
      </div>

      {/* Period Selector */}
      <div style={{ ...S.card, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: period === 'Custom' ? 12 : 0, flexWrap: 'wrap' }}>
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding: '8px 18px', borderRadius: 8, border: period === p ? '2px solid var(--accent)' : '1px solid var(--bd)', background: period === p ? 'var(--nav-active-bg)' : 'transparent', color: period === p ? 'var(--accent)' : 'var(--text3)', fontSize: 14, fontWeight: period === p ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>{p}</button>
          ))}
        </div>
        {period === 'Custom' && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <label style={S.label}>From Date</label>
              <input style={S.input} type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}/>
            </div>
            <div>
              <label style={S.label}>To Date</label>
              <input style={S.input} type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}/>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text4)', paddingBottom: 10 }}>{filtered.length} sales found</div>
          </div>
        )}
        {period !== 'Custom' && <div style={{ fontSize: 12, color: 'var(--text4)', marginTop: 8 }}>{label} -- {filtered.length} sales</div>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} style={{ ...S.btn(tab === t.id ? '#4fc3f7' : '#f0f2f5', tab === t.id ? '#fff' : '#333'), ...(tab === t.id ? { boxShadow: '0 0 12px rgba(79,195,247,0.3)' } : {}) }} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div id="report-content">
        {tab === 'sales' && (
          <div>
            <div style={S.grid}>
              <div style={S.statCard('#4fc3f7')}><div style={S.statLabel}>Revenue</div><div style={S.statValue}>{fmtUGX(totalRev)}</div></div>
              <div style={S.statCard('#e8735a')}><div style={S.statLabel}>Cost of Goods</div><div style={S.statValue}>{fmtUGX(totalCost)}</div></div>
              <div style={S.statCard('#4caf82')}><div style={S.statLabel}>Gross Profit</div><div style={S.statValue}>{fmtUGX(profit)}</div><div style={S.statSub}>{totalRev > 0 ? ((profit / totalRev) * 100).toFixed(1) : 0}% margin</div></div>
              <div style={S.statCard('#e5a943')}><div style={S.statLabel}>Transactions</div><div style={S.statValue}>{filtered.length}</div></div>
            </div>

            {/* Payment Method Breakdown */}
            {Object.keys(byMethod).length > 0 && (
              <div style={{ ...S.card, marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>By Payment Method</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {Object.entries(byMethod).map(([m, d]) => (
                    <div key={m} style={{ flex: 1, minWidth: 140, padding: '10px 14px', borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--bd3)' }}>
                      <div style={{ fontSize: 12, color: 'var(--text4)', textTransform: 'uppercase' }}>{m}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{fmtUGX(d.total)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text4)' }}>{d.count} transaction{d.count > 1 ? 's' : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={S.card}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Daily Breakdown</h3>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Date</th><th style={S.th}>Sales</th><th style={S.th}>Items</th><th style={S.th}>Revenue</th><th style={S.th}>Cost</th><th style={S.th}>Profit</th></tr></thead>
                <tbody>{dateEntries.map(([date, d]) => (
                  <tr key={date}><td style={S.td}>{date}</td><td style={S.td}>{d.count}</td><td style={S.td}>{d.items}</td><td style={{ ...S.td, color: '#4fc3f7', fontWeight: 600 }}>{fmtUGX(d.rev)}</td><td style={S.td}>{fmtUGX(d.cost)}</td><td style={{ ...S.td, color: '#4caf82', fontWeight: 600 }}>{fmtUGX(d.rev - d.cost)}</td></tr>
                ))}</tbody>
              </table>
              {dateEntries.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 0', borderTop: '2px solid var(--bd2)', marginTop: 8, fontSize: 14 }}>
                  <span style={{ fontWeight: 700 }}>Period Total: {fmtUGX(totalRev)} revenue, {fmtUGX(profit)} profit</span>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'products' && (
          <div style={S.card}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Product Performance</h3>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Drug</th><th style={S.th}>Qty Sold</th><th style={S.th}>Revenue</th><th style={S.th}>Cost</th><th style={S.th}>Profit</th><th style={S.th}>Margin</th></tr></thead>
              <tbody>{prodEntries.map(p => (
                <tr key={p.name}><td style={{ ...S.td, fontWeight: 500 }}>{p.name}</td><td style={S.td}>{p.qty}</td><td style={{ ...S.td, color: '#4fc3f7' }}>{fmtUGX(p.revenue)}</td><td style={S.td}>{fmtUGX(p.cost)}</td><td style={{ ...S.td, color: '#4caf82', fontWeight: 600 }}>{fmtUGX(p.profit)}</td>
                  <td style={S.td}><span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: p.margin > 50 ? 'rgba(76,175,130,0.15)' : 'rgba(229,169,67,0.15)', color: p.margin > 50 ? '#4caf82' : '#e5a943' }}>{p.margin.toFixed(1)}%</span></td></tr>
              ))}</tbody>
            </table>
            {prodEntries.length > 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(79,195,247,0.06)', border: '1px solid rgba(79,195,247,0.12)', fontSize: 12, display: 'flex', gap: 24 }}>
                <span><b>Total Revenue:</b> {fmtUGX(totalRev)}</span><span><b>Total Cost:</b> {fmtUGX(totalCost)}</span><span style={{ color: '#4caf82' }}><b>Total Profit:</b> {fmtUGX(profit)}</span>
              </div>
            )}
          </div>
        )}

        {tab === 'customers' && (
          <div style={S.card}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Customer Spending</h3>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Customer</th><th style={S.th}>Transactions</th><th style={S.th}>Total Spent</th><th style={S.th}>Avg / Visit</th></tr></thead>
              <tbody>{custEntries.map(([name, d]) => (
                <tr key={name}><td style={{ ...S.td, fontWeight: 500 }}>{name}</td><td style={S.td}>{d.count}</td><td style={{ ...S.td, color: '#4fc3f7', fontWeight: 600 }}>{fmtUGX(d.total)}</td><td style={S.td}>{fmtUGX(d.total / d.count)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {tab === 'cashiers' && (
          <div style={S.card}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Sales by Cashier</h3>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Cashier</th><th style={S.th}>Transactions</th><th style={S.th}>Total Sales</th><th style={S.th}>Avg / Sale</th></tr></thead>
              <tbody>{cashierEntries.map(([name, d]) => (
                <tr key={name}><td style={{ ...S.td, fontWeight: 500 }}>{name}</td><td style={S.td}>{d.count}</td><td style={{ ...S.td, color: '#4fc3f7', fontWeight: 600 }}>{fmtUGX(d.total)}</td><td style={S.td}>{fmtUGX(d.total / d.count)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {tab === 'stock' && (
          <div>
            <div style={S.grid}>
              <div style={S.statCard('#4fc3f7')}><div style={S.statLabel}>Stock at Cost</div><div style={S.statValue}>{fmtUGX(totalStockCost)}</div></div>
              <div style={S.statCard('#4caf82')}><div style={S.statLabel}>Stock at Retail</div><div style={S.statValue}>{fmtUGX(totalStockRetail)}</div></div>
              <div style={S.statCard('#9b7fe6')}><div style={S.statLabel}>Potential Profit</div><div style={S.statValue}>{fmtUGX(totalStockRetail - totalStockCost)}</div></div>
            </div>
            <div style={S.card}>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Drug</th><th style={S.th}>Qty</th><th style={S.th}>Cost/Unit</th><th style={S.th}>Total Cost</th><th style={S.th}>Price/Unit</th><th style={S.th}>Retail Value</th><th style={S.th}>Potential Profit</th></tr></thead>
                <tbody>{stockVal.map(d => (
                  <tr key={d.id} style={{ background: d.qty <= d.reorder ? 'rgba(229,169,67,0.06)' : 'transparent' }}>
                    <td style={{ ...S.td, fontWeight: 500 }}>{d.name}</td><td style={{ ...S.td, color: d.qty <= d.reorder ? '#e5a943' : 'inherit', fontWeight: d.qty <= d.reorder ? 600 : 400 }}>{d.qty}</td>
                    <td style={S.td}>{fmtUGX(d.cost)}</td><td style={S.td}>{fmtUGX(d.costVal)}</td><td style={S.td}>{fmtUGX(d.price)}</td>
                    <td style={{ ...S.td, color: '#4fc3f7' }}>{fmtUGX(d.retailVal)}</td><td style={{ ...S.td, color: '#4caf82', fontWeight: 600 }}>{fmtUGX(d.potentialProfit)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'movement' && (
          <div style={S.card}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Stock Movement</h3>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Drug</th><th style={S.th}>Opening</th><th style={S.th}>Purchased</th><th style={S.th}>Sold</th><th style={S.th}>Closing</th><th style={S.th}>Variance</th></tr></thead>
              <tbody>{movementByDrug.map(d => {
                const expected = d.opening + d.purchased - d.sold
                const variance = d.closing - expected
                return (
                  <tr key={d.id}><td style={{ ...S.td, fontWeight: 500 }}>{d.name}</td><td style={S.td}>{d.opening}</td><td style={{ ...S.td, color: '#4caf82' }}>+{d.purchased}</td><td style={{ ...S.td, color: '#e8735a' }}>-{d.sold}</td><td style={{ ...S.td, fontWeight: 600 }}>{d.closing}</td>
                    <td style={{ ...S.td, color: variance === 0 ? '#4caf82' : '#e5a943', fontWeight: 600 }}>{variance === 0 ? 'OK' : variance > 0 ? `+${variance}` : variance}</td></tr>
                )
              })}</tbody>
            </table>
          </div>
        )}

        {tab === 'endmonth' && (
          <div>
            <div style={S.grid}>
              <div style={S.statCard('#4fc3f7')}><div style={S.statLabel}>Total Revenue</div><div style={S.statValue}>{fmtUGX(totalRev)}</div></div>
              <div style={S.statCard('#e8735a')}><div style={S.statLabel}>Total Purchases</div><div style={S.statValue}>{fmtUGX(totalPurch)}</div></div>
              <div style={S.statCard('#4caf82')}><div style={S.statLabel}>Gross Profit</div><div style={S.statValue}>{fmtUGX(profit)}</div></div>
              <div style={S.statCard('#9b7fe6')}><div style={S.statLabel}>Current Stock Value</div><div style={S.statValue}>{fmtUGX(totalStockCost)}</div></div>
            </div>
            <div style={S.card}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>End of Period Stock Summary</h3>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Drug</th><th style={S.th}>Opening</th><th style={S.th}>Purchased</th><th style={S.th}>Sold</th><th style={S.th}>Closing</th><th style={S.th}>Cost Value</th><th style={S.th}>Retail Value</th></tr></thead>
                <tbody>{drugs.map(d => {
                  const m = movementByDrug.find(x => x.id === d.id) || { opening: d.qty, purchased: 0, sold: 0, closing: d.qty }
                  return (
                    <tr key={d.id}><td style={{ ...S.td, fontWeight: 500 }}>{d.name}</td><td style={S.td}>{m.opening}</td><td style={{ ...S.td, color: '#4caf82' }}>{m.purchased || '-'}</td><td style={{ ...S.td, color: '#e8735a' }}>{m.sold || '-'}</td><td style={{ ...S.td, fontWeight: 600 }}>{m.closing}</td>
                      <td style={S.td}>{fmtUGX(m.closing * d.cost)}</td><td style={{ ...S.td, color: '#4fc3f7' }}>{fmtUGX(m.closing * d.price)}</td></tr>
                  )
                })}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
