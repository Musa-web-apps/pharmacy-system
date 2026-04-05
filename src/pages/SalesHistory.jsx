import { useState } from 'react'
import { S, Icon, icons, fmtUGX, exportCSV, printSection, printThermalReceipt } from '../shared.jsx'

export default function SalesHistory({ sales }) {
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [limit, setLimit] = useState(50)
  const [viewSale, setViewSale] = useState(null)

  let filtered = [...sales].reverse()
  if (dateFrom) filtered = filtered.filter(s => s.date >= dateFrom)
  if (dateTo) filtered = filtered.filter(s => s.date <= dateTo)
  if (search) filtered = filtered.filter(s => s.customer.toLowerCase().includes(search.toLowerCase()) || s.items.some(it => it.name.toLowerCase().includes(search.toLowerCase())))

  const visible = filtered.slice(0, limit)
  const totalRevenue = filtered.reduce((s, x) => s + x.total, 0)
  const totalItems = filtered.reduce((s, x) => s + x.items.reduce((a, it) => a + it.qty, 0), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={S.header}>Sales History</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btn('#f0f2f5', '#333')} onClick={() => exportCSV('sales-history.csv', ['Receipt #','Date','Time','Customer','Items','Total','Cash Paid','Balance','Payment Method'], filtered.map(s => [s.id, s.date, s.time, s.customer, s.items.length, s.total, s.cashPaid || '-', s.balance || '-', s.payMethod || 'Cash']))}><Icon d={icons.download} size={14}/> Export</button>
          <button style={S.btn('#f0f2f5', '#333')} onClick={() => printSection('Sales History', 'sales-table')}><Icon d={icons.print} size={14}/> Print</button>
        </div>
      </div>

      <div style={S.grid}>
        <div style={S.statCard('#4fc3f7')}><div style={S.statLabel}>Total Sales</div><div style={S.statValue}>{filtered.length}</div></div>
        <div style={S.statCard('#4caf82')}><div style={S.statLabel}>Total Revenue</div><div style={S.statValue}>{fmtUGX(totalRevenue)}</div></div>
        <div style={S.statCard('#e5a943')}><div style={S.statLabel}>Items Sold</div><div style={S.statValue}>{totalItems}</div></div>
      </div>

      <div style={{ ...S.card, padding: 16, marginBottom: 16 }}>
        <div style={S.row}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Date From</label>
            <input style={S.input} type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setLimit(50) }}/>
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Date To</label>
            <input style={S.input} type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setLimit(50) }}/>
          </div>
          <div style={{ flex: 2 }}>
            <label style={S.label}>Search Customer or Drug</label>
            <input style={S.input} value={search} onChange={e => { setSearch(e.target.value); setLimit(50) }} placeholder="Search..."/>
          </div>
          {(dateFrom || dateTo || search) && <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button style={{ ...S.btn('#f0f2f5', '#333'), padding: '8px 14px' }} onClick={() => { setDateFrom(''); setDateTo(''); setSearch(''); setLimit(50) }}>Clear</button>
          </div>}
        </div>
      </div>

      <div style={S.card} id="sales-table">
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Receipt #</th>
              <th style={S.th}>Date</th>
              <th style={S.th}>Time</th>
              <th style={S.th}>Customer</th>
              <th style={S.th}>Items</th>
              <th style={S.th}>Total</th>
              <th style={S.th}>Cash Paid</th>
              <th style={S.th}>Balance</th>
              <th style={S.th}>Payment</th>
              <th style={S.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(s => (
              <tr key={s.id}>
                <td style={{ ...S.td, fontWeight: 600, color: 'var(--accent)' }}>{s.id}</td>
                <td style={S.td}>{s.date}</td>
                <td style={S.td}>{s.time}</td>
                <td style={{ ...S.td, fontWeight: 500 }}>{s.customer}</td>
                <td style={S.td}>{s.items.length} ({s.items.reduce((a, it) => a + it.qty, 0)} units)</td>
                <td style={{ ...S.td, fontWeight: 600 }}>{fmtUGX(s.total)}</td>
                <td style={S.td}>{s.cashPaid ? fmtUGX(s.cashPaid) : '-'}</td>
                <td style={{ ...S.td, color: '#4caf82', fontWeight: 500 }}>{s.balance != null ? fmtUGX(s.balance) : '-'}</td>
                <td style={S.td}>
                  <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: (s.payMethod || 'Cash') === 'Cash' ? 'rgba(76,175,130,0.15)' : s.payMethod === 'Credit' ? 'rgba(229,169,67,0.15)' : s.payMethod === 'Mobile Money' ? 'rgba(229,169,67,0.15)' : 'rgba(91,141,239,0.15)', color: (s.payMethod || 'Cash') === 'Cash' ? '#4caf82' : s.payMethod === 'Credit' ? '#e5a943' : s.payMethod === 'Mobile Money' ? '#e5a943' : '#5b8def' }}>{s.payMethod || 'Cash'}</span>
                  {s.payMethod === 'Credit' && <div style={{ fontSize: 11, marginTop: 2, color: ((s.creditAmount || 0) - (s.creditPaid || 0)) > 0 ? '#e5a943' : '#4caf82' }}>{((s.creditAmount || 0) - (s.creditPaid || 0)) > 0 ? `Owes ${fmtUGX((s.creditAmount || 0) - (s.creditPaid || 0))}` : 'Cleared'}</div>}
                </td>
                <td style={S.td}>
                  <button style={{ ...S.btn('#edf2fe', '#4a6fc2'), padding: '5px 12px' }} onClick={() => setViewSale(s)}>View</button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && <tr><td style={{ ...S.td, textAlign: 'center', padding: 40 }} colSpan={10}>No sales found</td></tr>}
          </tbody>
        </table>
        {limit < filtered.length && (
          <div style={{ padding: '12px 16px', textAlign: 'center', borderTop: '1px solid var(--bd3)' }}>
            <button style={{ ...S.btn('#f0f2f5', '#333'), padding: '8px 24px' }} onClick={() => setLimit(limit + 50)}>Load More ({Math.min(50, filtered.length - limit)} of {filtered.length - limit} remaining)</button>
          </div>
        )}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', borderTop: '2px solid var(--bd2)', fontSize: 14 }}>
            <span style={{ color: 'var(--text4)' }}>Showing {visible.length} of {filtered.length} sales</span>
            <span style={{ fontWeight: 700 }}>Total Revenue: {fmtUGX(totalRevenue)}</span>
          </div>
        )}
      </div>

      {/* View Sale Modal */}
      {viewSale && (
        <div style={S.modal} onClick={() => setViewSale(null)}>
          <div style={S.modalWide} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Sale Details</h2>
                <div style={{ fontSize: 13, color: 'var(--text4)' }}>Receipt #{viewSale.id} | {viewSale.date} {viewSale.time} | {viewSale.customer} | {viewSale.payMethod || 'Cash'}{viewSale.cashierName ? ` | Served by: ${viewSale.cashierName}` : ''}</div>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setViewSale(null)}><Icon d={icons.x} size={20} color="var(--text4)"/></button>
            </div>
            <div id="sale-detail">
              <table style={S.table}>
                <thead><tr><th style={S.th}>#</th><th style={S.th}>Drug</th><th style={S.th}>Qty</th><th style={S.th}>Price</th><th style={S.th}>Subtotal</th></tr></thead>
                <tbody>
                  {viewSale.items.map((c, i) => (
                    <tr key={i}>
                      <td style={{ ...S.td, color: 'var(--text4)' }}>{i + 1}</td>
                      <td style={{ ...S.td, fontWeight: 500 }}>{c.name}</td>
                      <td style={S.td}>{c.qty}</td>
                      <td style={S.td}>{fmtUGX(c.price)}</td>
                      <td style={{ ...S.td, fontWeight: 600 }}>{fmtUGX(c.price * c.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ borderTop: '2px solid var(--accent)', marginTop: 8, paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
                  <span>TOTAL</span><span>{fmtUGX(viewSale.total)}</span>
                </div>
                {viewSale.cashPaid > 0 && <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 14 }}>
                    <span>Cash Paid</span><span>{fmtUGX(viewSale.cashPaid)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 15, fontWeight: 700, color: '#4caf82' }}>
                    <span>Balance</span><span>{fmtUGX(viewSale.balance)}</span>
                  </div>
                </>}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button style={S.btn('#f0f2f5', '#333')} onClick={() => printThermalReceipt(viewSale)}><Icon d={icons.print} size={14}/> Print 80mm Receipt</button>
              <button style={S.btn('#f0f2f5', '#333')} onClick={() => printSection(`Receipt #${viewSale.id}`, 'sale-detail')}><Icon d={icons.print} size={14}/> Print A4</button>
              <button style={S.btn()} onClick={() => setViewSale(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
