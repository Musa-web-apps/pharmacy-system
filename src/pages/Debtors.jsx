import { useState } from 'react'
import { S, Icon, icons, fmtUGX, exportCSV, printSection, today } from '../shared.jsx'

export default function Debtors({ sales, setSales }) {
  const [search, setSearch] = useState('')
  const [viewCustomer, setViewCustomer] = useState(null)
  const [payModal, setPayModal] = useState(null) // { saleId, customer, outstanding }
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('Cash')

  // All credit sales
  const creditSales = sales.filter(s => s.payMethod === 'Credit')

  // Compute outstanding per sale
  const getOutstanding = (s) => (s.creditAmount || 0) - (s.creditPaid || 0)

  // Group by customer
  const byCustomer = {}
  creditSales.forEach(s => {
    const out = getOutstanding(s)
    if (!byCustomer[s.customer]) byCustomer[s.customer] = { customer: s.customer, sales: [], totalOwed: 0, totalPaid: 0 }
    byCustomer[s.customer].sales.push(s)
    byCustomer[s.customer].totalOwed += out
    byCustomer[s.customer].totalPaid += (s.creditPaid || 0)
  })
  let customers = Object.values(byCustomer).sort((a, b) => b.totalOwed - a.totalOwed)
  if (search) customers = customers.filter(c => c.customer.toLowerCase().includes(search.toLowerCase()))

  const totalOutstanding = customers.reduce((s, c) => s + c.totalOwed, 0)
  const totalCollected = customers.reduce((s, c) => s + c.totalPaid, 0)
  const activeDebtors = customers.filter(c => c.totalOwed > 0).length

  const recordPayment = () => {
    const amt = Number(payAmount) || 0
    if (amt <= 0 || amt > payModal.outstanding) return alert('Invalid payment amount')
    setSales(prev => prev.map(s => {
      if (s.id !== payModal.saleId) return s
      const payments = s.creditPayments ? [...s.creditPayments] : []
      payments.push({ date: today(), time: new Date().toLocaleTimeString(), amount: amt, method: payMethod })
      return { ...s, creditPaid: (s.creditPaid || 0) + amt, creditPayments: payments }
    }))
    setPayModal(null)
    setPayAmount('')
    setPayMethod('Cash')
  }

  // Detail view for a customer
  const custData = viewCustomer ? byCustomer[viewCustomer] : null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={S.header}>Debtors / Credit Sales</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btn('#f0f2f5', '#333')} onClick={() => exportCSV('debtors.csv', ['Customer','Total Credit','Paid','Outstanding','# Sales'], customers.map(c => [c.customer, c.sales.reduce((s,x) => s + (x.creditAmount || 0), 0), c.totalPaid, c.totalOwed, c.sales.length]))}><Icon d={icons.download} size={14}/> Export</button>
          <button style={S.btn('#f0f2f5', '#333')} onClick={() => printSection('Debtors Report', 'debtors-table')}><Icon d={icons.print} size={14}/> Print</button>
        </div>
      </div>

      <div style={S.grid}>
        <div style={S.statCard('#e5a943')}><div style={S.statLabel}>Total Outstanding</div><div style={S.statValue}>{fmtUGX(totalOutstanding)}</div></div>
        <div style={S.statCard('#4caf82')}><div style={S.statLabel}>Total Collected</div><div style={S.statValue}>{fmtUGX(totalCollected)}</div></div>
        <div style={S.statCard('#e05d5d')}><div style={S.statLabel}>Active Debtors</div><div style={S.statValue}>{activeDebtors}</div></div>
        <div style={S.statCard('#4fc3f7')}><div style={S.statLabel}>Credit Sales</div><div style={S.statValue}>{creditSales.length}</div></div>
      </div>

      <div style={{ ...S.card, padding: 16, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={S.label}>Search Customer</label>
          <input style={{ ...S.input, maxWidth: 360 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search debtor name..."/>
        </div>
      </div>

      {!viewCustomer ? (
        <div style={S.card} id="debtors-table">
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                <th style={S.th}>Customer</th>
                <th style={S.th}>Credit Sales</th>
                <th style={S.th}>Total Credit</th>
                <th style={S.th}>Paid</th>
                <th style={S.th}>Outstanding</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => {
                const totalCredit = c.sales.reduce((s, x) => s + (x.creditAmount || 0), 0)
                return (
                  <tr key={c.customer}>
                    <td style={{ ...S.td, color: 'var(--text4)' }}>{i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{c.customer}</td>
                    <td style={S.td}>{c.sales.length}</td>
                    <td style={S.td}>{fmtUGX(totalCredit)}</td>
                    <td style={{ ...S.td, color: '#4caf82', fontWeight: 500 }}>{fmtUGX(c.totalPaid)}</td>
                    <td style={{ ...S.td, fontWeight: 700, color: c.totalOwed > 0 ? '#e5a943' : '#4caf82' }}>{fmtUGX(c.totalOwed)}</td>
                    <td style={S.td}>
                      <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: c.totalOwed > 0 ? 'rgba(229,169,67,0.15)' : 'rgba(76,175,130,0.15)', color: c.totalOwed > 0 ? '#e5a943' : '#4caf82' }}>{c.totalOwed > 0 ? 'Owing' : 'Cleared'}</span>
                    </td>
                    <td style={S.td}>
                      <button style={{ ...S.btn('#edf2fe', '#4a6fc2'), padding: '5px 12px' }} onClick={() => setViewCustomer(c.customer)}>View</button>
                    </td>
                  </tr>
                )
              })}
              {customers.length === 0 && <tr><td style={{ ...S.td, textAlign: 'center', padding: 40 }} colSpan={8}>No credit sales found</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <button style={{ ...S.btn('#f0f2f5', '#333'), marginBottom: 16 }} onClick={() => setViewCustomer(null)}><Icon d={icons.returnIcon} size={14}/> Back to All Debtors</button>
          {custData && (
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700 }}>{custData.customer}</h2>
                  <div style={{ fontSize: 13, color: 'var(--text4)' }}>{custData.sales.length} credit sale{custData.sales.length > 1 ? 's' : ''} | Outstanding: <span style={{ fontWeight: 700, color: '#e5a943' }}>{fmtUGX(custData.totalOwed)}</span></div>
                </div>
              </div>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Receipt #</th>
                    <th style={S.th}>Date</th>
                    <th style={S.th}>Items</th>
                    <th style={S.th}>Total</th>
                    <th style={S.th}>Paid at Sale</th>
                    <th style={S.th}>Credit Amount</th>
                    <th style={S.th}>Repaid</th>
                    <th style={S.th}>Outstanding</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {custData.sales.map(s => {
                    const out = getOutstanding(s)
                    return (
                      <tr key={s.id}>
                        <td style={{ ...S.td, fontWeight: 600, color: 'var(--accent)' }}>{s.id}</td>
                        <td style={S.td}>{s.date}</td>
                        <td style={S.td}>{s.items.map(it => it.name).join(', ')}</td>
                        <td style={S.td}>{fmtUGX(s.total)}</td>
                        <td style={S.td}>{s.cashPaid > 0 ? fmtUGX(s.cashPaid) : '-'}</td>
                        <td style={S.td}>{fmtUGX(s.creditAmount || 0)}</td>
                        <td style={{ ...S.td, color: '#4caf82', fontWeight: 500 }}>{fmtUGX(s.creditPaid || 0)}</td>
                        <td style={{ ...S.td, fontWeight: 700, color: out > 0 ? '#e5a943' : '#4caf82' }}>{fmtUGX(out)}</td>
                        <td style={S.td}>
                          <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: out > 0 ? 'rgba(229,169,67,0.15)' : 'rgba(76,175,130,0.15)', color: out > 0 ? '#e5a943' : '#4caf82' }}>{out > 0 ? 'Owing' : 'Paid'}</span>
                        </td>
                        <td style={S.td}>
                          {out > 0 && <button style={{ ...S.btn('#4caf82', '#fff'), padding: '5px 12px' }} onClick={() => { setPayModal({ saleId: s.id, customer: s.customer, outstanding: out, total: s.total }); setPayAmount('') }}>Record Payment</button>}
                          {s.creditPayments && s.creditPayments.length > 0 && (
                            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text4)' }}>{s.creditPayments.length} payment{s.creditPayments.length > 1 ? 's' : ''} recorded</div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Payment History */}
              {custData.sales.some(s => s.creditPayments && s.creditPayments.length > 0) && (
                <div style={{ marginTop: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Payment History</h3>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Date</th>
                        <th style={S.th}>Time</th>
                        <th style={S.th}>Receipt #</th>
                        <th style={S.th}>Amount</th>
                        <th style={S.th}>Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {custData.sales.flatMap(s => (s.creditPayments || []).map((p, i) => ({ ...p, saleId: s.id, key: `${s.id}-${i}` }))).sort((a, b) => b.date.localeCompare(a.date)).map(p => (
                        <tr key={p.key}>
                          <td style={S.td}>{p.date}</td>
                          <td style={S.td}>{p.time}</td>
                          <td style={{ ...S.td, color: 'var(--accent)', fontWeight: 600 }}>{p.saleId}</td>
                          <td style={{ ...S.td, fontWeight: 600, color: '#4caf82' }}>{fmtUGX(p.amount)}</td>
                          <td style={S.td}>
                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: p.method === 'Cash' ? 'rgba(76,175,130,0.15)' : p.method === 'Mobile Money' ? 'rgba(229,169,67,0.15)' : 'rgba(91,141,239,0.15)', color: p.method === 'Cash' ? '#4caf82' : p.method === 'Mobile Money' ? '#e5a943' : '#5b8def' }}>{p.method}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Record Payment Modal */}
      {payModal && (
        <div style={S.modal} onClick={() => setPayModal(null)}>
          <div style={{ ...S.modalBox, width: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Record Payment</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setPayModal(null)}><Icon d={icons.x} size={20} color="var(--text4)"/></button>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(229,169,67,0.08)', border: '1px solid rgba(229,169,67,0.15)', marginBottom: 16, fontSize: 13 }}>
              <div><b>Customer:</b> {payModal.customer}</div>
              <div><b>Sale Total:</b> {fmtUGX(payModal.total)}</div>
              <div><b>Outstanding:</b> <span style={{ fontWeight: 700, color: '#e5a943' }}>{fmtUGX(payModal.outstanding)}</span></div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Payment Amount</label>
              <input style={{ ...S.input, fontSize: 18, fontWeight: 700, textAlign: 'right' }} inputMode="numeric" value={payAmount ? Number(payAmount).toLocaleString() : ''} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setPayAmount(v) }} placeholder="0" autoFocus/>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button style={{ ...S.btn('#f0f2f5', '#333'), padding: '4px 10px', fontSize: 12 }} onClick={() => setPayAmount(String(payModal.outstanding))}>Pay Full ({fmtUGX(payModal.outstanding)})</button>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Payment Method</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Cash', 'Mobile Money', 'ATM Card'].map(m => (
                  <button key={m} onClick={() => setPayMethod(m)} style={{ flex: 1, padding: '8px 6px', borderRadius: 8, border: payMethod === m ? '2px solid var(--accent)' : '1px solid var(--bd)', background: payMethod === m ? 'rgba(79,195,247,0.12)' : 'var(--input-bg)', color: payMethod === m ? 'var(--accent)' : 'var(--text3)', fontSize: 13, fontWeight: payMethod === m ? 700 : 500, cursor: 'pointer' }}>{m}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...S.btn('#f0f2f5', '#333'), flex: 1, justifyContent: 'center' }} onClick={() => setPayModal(null)}>Cancel</button>
              <button style={{ ...S.btn('#4caf82', '#fff'), flex: 1, justifyContent: 'center', opacity: (Number(payAmount) || 0) <= 0 || (Number(payAmount) || 0) > payModal.outstanding ? 0.5 : 1 }} onClick={recordPayment} disabled={(Number(payAmount) || 0) <= 0 || (Number(payAmount) || 0) > payModal.outstanding}><Icon d={icons.check} size={14}/> Record Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
