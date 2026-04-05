import { useState } from 'react'
import { S, Icon, icons, fmtUGX, today, exportCSV, printSection } from '../shared.jsx'
import { CATEGORIES, SUPPLIERS } from '../data.js'

export default function Purchases({ drugs, setDrugs, purchases, setPurchases, suppliers, returns, setReturns }) {
  const [tab, setTab] = useState('purchases')
  const [showAdd, setShowAdd] = useState(false)
  const [viewPO, setViewPO] = useState(null)
  const [showReturn, setShowReturn] = useState(null) // holds the PO to return from
  const [showExpiryReturn, setShowExpiryReturn] = useState(false)
  const [viewReturn, setViewReturn] = useState(null)
  // Transaction filters
  const [txDateFrom, setTxDateFrom] = useState('')
  const [txDateTo, setTxDateTo] = useState('')
  const [txSupplier, setTxSupplier] = useState('')
  const [txInvoice, setTxInvoice] = useState('')
  const [txLimit, setTxLimit] = useState(50)
  const [txDetail, setTxDetail] = useState(null) // holds the selected transaction group for detail page

  const totalSpent = purchases.reduce((s, p) => s + p.total, 0)
  const totalReturns = returns.reduce((s, r) => s + r.total, 0)

  const handleReturn = (ret) => {
    setReturns(prev => [...prev, ret])
    // Deduct returned quantities from inventory
    setDrugs(prev => prev.map(d => {
      const it = ret.items.find(x => x.drugId === d.id)
      return it ? { ...d, qty: Math.max(0, d.qty - it.returnQty) } : d
    }))
    setShowReturn(null)
  }

  const tabStyle = (active) => ({
    padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
    borderBottom: active ? '2px solid #4fc3f7' : '2px solid transparent',
    background: 'none', color: active ? '#4fc3f7' : 'rgba(255,255,255,0.5)',
    transition: 'all 0.2s',
  })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={S.header}>Purchases</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'purchases' && <>
            <button style={S.btn('#f0f2f5', '#333')} onClick={() => exportCSV('purchases.csv', ['PO#','Date','Supplier','Invoice No./Ref','Invoice Date','Particulars','Items','Total'], purchases.map(p => [p.poNumber, p.date, p.supplier, p.invoiceRef, p.invoiceDate || '-', p.particulars || '-', p.items.length, p.total]))}><Icon d={icons.download} size={14}/> Export</button>
            <button style={S.btn('#f0f2f5', '#333')} onClick={() => printSection('Purchase Orders', 'po-table')}><Icon d={icons.print} size={14}/> Print</button>
            <button style={S.btn()} onClick={() => setShowAdd(true)}><Icon d={icons.plus} size={16}/> New Purchase</button>
          </>}
          {tab === 'returns' && <>
            <button style={S.btn('#f0f2f5', '#333')} onClick={() => exportCSV('purchase-returns.csv', ['Return#','Date','Supplier','PO#','Reason','Items','Total','Status'], returns.map(r => [r.returnNumber, r.date, r.supplier, r.poNumber, r.reason, r.items.length, r.total, r.status]))}><Icon d={icons.download} size={14}/> Export</button>
            <button style={S.btn('#f0f2f5', '#333')} onClick={() => printSection('Purchase Returns', 'returns-table')}><Icon d={icons.print} size={14}/> Print</button>
            <button style={S.btn('#e05d5d', '#fff')} onClick={() => setShowExpiryReturn(true)}><Icon d={icons.returnIcon} size={14}/> New Return</button>
          </>}
          {tab === 'transactions' && <>
            <button style={S.btn('#f0f2f5', '#333')} onClick={() => {
              const allTx = []
              purchases.forEach(po => po.items.forEach(it => allTx.push([po.invoiceRef || '-', po.invoiceDate || po.date, po.supplier, it.name, it.cost * it.qty, 'Purchase'])))
              returns.forEach(r => r.items.forEach(it => allTx.push([r.returnNumber, r.date, r.supplier, it.name, it.cost * it.returnQty, 'Purchase Return'])))
              exportCSV('purchase-transactions.csv', ['Invoice No./Ref','Invoice Date','Supplier','Product Name','Purchase Amount','Type'], allTx)
            }}><Icon d={icons.download} size={14}/> Export</button>
            <button style={S.btn('#f0f2f5', '#333')} onClick={() => printSection('Purchase Transactions', 'tx-table')}><Icon d={icons.print} size={14}/> Print</button>
          </>}
        </div>
      </div>

      <div style={S.grid}>
        <div style={S.statCard('#4fc3f7')}><div style={S.statLabel}>Total Orders</div><div style={S.statValue}>{purchases.length}</div></div>
        <div style={S.statCard('#4caf82')}><div style={S.statLabel}>Total Spent</div><div style={S.statValue}>{fmtUGX(totalSpent)}</div></div>
        <div style={S.statCard('#e05d5d')}><div style={S.statLabel}>Returns</div><div style={S.statValue}>{returns.length}</div></div>
        <div style={S.statCard('#e5a943')}><div style={S.statLabel}>Returns Value</div><div style={S.statValue}>{fmtUGX(totalReturns)}</div></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
        <button style={tabStyle(tab === 'purchases')} onClick={() => setTab('purchases')}>Purchase Orders ({purchases.length})</button>
        <button style={tabStyle(tab === 'returns')} onClick={() => setTab('returns')}>Purchase Returns ({returns.length})</button>
        <button style={tabStyle(tab === 'transactions')} onClick={() => setTab('transactions')}>Purchase Transactions</button>
      </div>

      {/* ─── Purchase Orders Tab ─── */}
      {tab === 'purchases' && <div style={S.card} id="po-table">
        <table style={S.table}>
          <thead><tr><th style={S.th}>PO #</th><th style={S.th}>Date</th><th style={S.th}>Supplier</th><th style={S.th}>Invoice No./Ref</th><th style={S.th}>Invoice Date</th><th style={S.th}>Particulars</th><th style={S.th}>Items</th><th style={S.th}>Total</th><th style={S.th}>Actions</th></tr></thead>
          <tbody>
            {[...purchases].reverse().map(po => (
              <tr key={po.id}>
                <td style={{ ...S.td, fontWeight: 600, color: '#4fc3f7' }}>{po.poNumber}</td>
                <td style={S.td}>{po.date}</td>
                <td style={{ ...S.td, fontWeight: 500 }}>{po.supplier}</td>
                <td style={S.td}>{po.invoiceRef || '-'}</td>
                <td style={S.td}>{po.invoiceDate || '-'}</td>
                <td style={S.td}>{po.particulars || '-'}</td>
                <td style={S.td}>{po.items.length}</td>
                <td style={{ ...S.td, fontWeight: 600 }}>{fmtUGX(po.total)}</td>
                <td style={S.td}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button style={{ ...S.btn('#edf2fe', '#4a6fc2'), padding: '4px 10px' }} onClick={() => setViewPO(po)}>View</button>
                    <button style={{ ...S.btn('#fdeded', '#e05d5d'), padding: '4px 10px' }} onClick={() => setShowReturn(po)}>Return</button>
                  </div>
                </td>
              </tr>
            ))}
            {purchases.length === 0 && <tr><td style={{ ...S.td, textAlign: 'center', padding: 30 }} colSpan={9}>No purchase orders yet</td></tr>}
          </tbody>
        </table>
      </div>}

      {/* ─── Purchase Returns Tab ─── */}
      {tab === 'returns' && <div style={S.card} id="returns-table">
        {returns.length === 0
          ? <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No purchase returns yet. Use the "Return" button on a received purchase order to create one.</div>
          : <table style={S.table}>
            <thead><tr><th style={S.th}>Return #</th><th style={S.th}>Date</th><th style={S.th}>Supplier</th><th style={S.th}>PO #</th><th style={S.th}>Reason</th><th style={S.th}>Items</th><th style={S.th}>Total Value</th><th style={S.th}>Status</th><th style={S.th}>Actions</th></tr></thead>
            <tbody>
              {[...returns].reverse().map(r => (
                <tr key={r.id}>
                  <td style={{ ...S.td, fontWeight: 600, color: '#e05d5d' }}>{r.returnNumber}</td>
                  <td style={S.td}>{r.date}</td>
                  <td style={{ ...S.td, fontWeight: 500 }}>{r.supplier}</td>
                  <td style={{ ...S.td, color: '#4fc3f7' }}>{r.poNumber}</td>
                  <td style={S.td}>{r.reason}</td>
                  <td style={S.td}>{r.items.length}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{fmtUGX(r.total)}</td>
                  <td style={S.td}>
                    <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: r.status === 'refunded' ? 'rgba(76,175,130,0.15)' : r.status === 'credited' ? 'rgba(91,141,239,0.15)' : 'rgba(229,169,67,0.15)', color: r.status === 'refunded' ? '#4caf82' : r.status === 'credited' ? '#5b8def' : '#e5a943' }}>
                      {r.status === 'refunded' ? 'Refunded' : r.status === 'credited' ? 'Credit Note' : 'Pending'}
                    </span>
                  </td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={{ ...S.btn('#edf2fe', '#4a6fc2'), padding: '4px 10px' }} onClick={() => setViewReturn(r)}>View</button>
                      {r.status === 'pending' && <>
                        <button style={{ ...S.btn('#e8f6f5', '#1e8c85'), padding: '4px 10px' }} onClick={() => setReturns(prev => prev.map(x => x.id === r.id ? { ...x, status: 'refunded' } : x))}>Refunded</button>
                        <button style={{ ...S.btn('#edf2fe', '#5b8def'), padding: '4px 10px' }} onClick={() => setReturns(prev => prev.map(x => x.id === r.id ? { ...x, status: 'credited' } : x))}>Credit Note</button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
        {returns.length > 0 && <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 14, fontWeight: 700 }}>
          Total Returns Value: {fmtUGX(totalReturns)}
        </div>}
      </div>}

      {/* ─── Purchase Transactions Tab ─── */}
      {tab === 'transactions' && (() => {
        // Build grouped transactions: each purchase/return is one group
        const groups = []
        purchases.forEach(po => {
          groups.push({
            id: `p-${po.id}`, type: 'Purchase', invoiceRef: po.invoiceRef || '-',
            invoiceDate: po.invoiceDate || po.date, date: po.date, supplier: po.supplier,
            total: po.total, itemCount: po.items.length, particulars: po.particulars || '-',
            poNumber: po.poNumber, status: po.status,
            items: po.items.map(it => ({ name: it.name, qty: it.qty, cost: it.cost, subtotal: it.cost * it.qty })),
          })
        })
        returns.forEach(r => {
          groups.push({
            id: `r-${r.id}`, type: 'Purchase Return', invoiceRef: r.returnNumber,
            invoiceDate: r.date, date: r.date, supplier: r.supplier,
            total: r.total, itemCount: r.items.length, reason: r.reason,
            poNumber: r.poNumber, status: r.status,
            items: r.items.map(it => ({ name: it.name, qty: it.returnQty, cost: it.cost, subtotal: it.cost * it.returnQty })),
          })
        })
        groups.sort((a, b) => (b.date || '').localeCompare(a.date || ''))

        // Apply filters
        let filtered = groups
        if (txDateFrom) filtered = filtered.filter(g => g.date >= txDateFrom)
        if (txDateTo) filtered = filtered.filter(g => g.date <= txDateTo)
        if (txSupplier) filtered = filtered.filter(g => g.supplier.toLowerCase().includes(txSupplier.toLowerCase()))
        if (txInvoice) filtered = filtered.filter(g => g.invoiceRef.toLowerCase().includes(txInvoice.toLowerCase()))

        const visible = filtered.slice(0, txLimit)
        const totalPurchases = filtered.filter(g => g.type === 'Purchase').reduce((s, g) => s + g.total, 0)
        const totalRet = filtered.filter(g => g.type === 'Purchase Return').reduce((s, g) => s + g.total, 0)

        // Detail page for a selected transaction
        if (txDetail) {
          const g = txDetail
          const isPurchase = g.type === 'Purchase'
          const accent = isPurchase ? '#4caf82' : '#e05d5d'
          return <div>
            <button style={{ ...S.btn('#f0f2f5', '#333'), marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setTxDetail(null)}>
              <span style={{ fontSize: 16 }}>&larr;</span> Back to Transactions
            </button>
            <div style={S.card} id="tx-detail">
              {/* Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: isPurchase ? '#4fc3f7' : '#e05d5d' }}>{g.invoiceRef}</h2>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{g.type}{g.poNumber ? ` | ${g.poNumber}` : ''}</div>
                  </div>
                  <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${accent}20`, color: accent }}>
                    {g.type}
                  </span>
                </div>
              </div>

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ padding: '14px 24px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Supplier</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{g.supplier}</div>
                </div>
                <div style={{ padding: '14px 24px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Invoice Date</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{g.invoiceDate}</div>
                </div>
                <div style={{ padding: '14px 24px' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{isPurchase ? 'Particulars' : 'Reason'}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{isPurchase ? (g.particulars || '-') : (g.reason || '-')}</div>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ padding: '16px 24px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>Products ({g.items.length})</div>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>#</th>
                    <th style={S.th}>Product Name</th>
                    <th style={S.th}>{isPurchase ? 'Qty' : 'Return Qty'}</th>
                    <th style={S.th}>Cost/Unit</th>
                    <th style={S.th}>Subtotal</th>
                  </tr></thead>
                  <tbody>
                    {g.items.map((it, i) => (
                      <tr key={i}>
                        <td style={{ ...S.td, color: 'rgba(255,255,255,0.4)' }}>{i + 1}</td>
                        <td style={{ ...S.td, fontWeight: 500 }}>{it.name}</td>
                        <td style={S.td}>{it.qty}</td>
                        <td style={S.td}>{fmtUGX(it.cost)}</td>
                        <td style={{ ...S.td, fontWeight: 600 }}>{fmtUGX(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: `2px solid ${accent}30`, background: `${accent}06` }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{g.items.length} product{g.items.length !== 1 ? 's' : ''}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Total: {fmtUGX(g.total)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button style={S.btn('#f0f2f5', '#333')} onClick={() => printSection(`Transaction ${g.invoiceRef}`, 'tx-detail')}><Icon d={icons.print} size={14}/> Print</button>
              <button style={S.btn()} onClick={() => setTxDetail(null)}>Back to List</button>
            </div>
          </div>
        }

        return <div>
          {/* Filters */}
          <div style={{ ...S.card, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Filter Transactions</div>
            <div style={S.row}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Date From</label>
                <input style={S.input} type="date" value={txDateFrom} onChange={e => { setTxDateFrom(e.target.value); setTxLimit(50) }}/>
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Date To</label>
                <input style={S.input} type="date" value={txDateTo} onChange={e => { setTxDateTo(e.target.value); setTxLimit(50) }}/>
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Supplier Name</label>
                <input style={S.input} value={txSupplier} onChange={e => { setTxSupplier(e.target.value); setTxLimit(50) }} placeholder="Search supplier..."/>
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Invoice No./Ref</label>
                <input style={S.input} value={txInvoice} onChange={e => { setTxInvoice(e.target.value); setTxLimit(50) }} placeholder="Search invoice..."/>
              </div>
              {(txDateFrom || txDateTo || txSupplier || txInvoice) && <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button style={{ ...S.btn('#f0f2f5', '#333'), padding: '8px 14px' }} onClick={() => { setTxDateFrom(''); setTxDateTo(''); setTxSupplier(''); setTxInvoice(''); setTxLimit(50) }}>Clear</button>
              </div>}
            </div>
          </div>

          {/* Summary */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.15)' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Showing</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{visible.length}<span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}> of {filtered.length} transactions</span></div>
            </div>
            <div style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: 'rgba(76,175,130,0.08)', border: '1px solid rgba(76,175,130,0.15)' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Total Purchases</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#4caf82' }}>{fmtUGX(totalPurchases)}</div>
            </div>
            <div style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: 'rgba(224,93,93,0.08)', border: '1px solid rgba(224,93,93,0.15)' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Total Returns</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e05d5d' }}>{fmtUGX(totalRet)}</div>
            </div>
            <div style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.15)' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Net Purchases</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{fmtUGX(totalPurchases - totalRet)}</div>
            </div>
          </div>

          {/* Transaction List Table */}
          <div style={S.card} id="tx-table">
            <table style={S.table}>
              <thead><tr><th style={S.th}>Invoice No./Ref</th><th style={S.th}>Invoice Date</th><th style={S.th}>Supplier</th><th style={S.th}>Products</th><th style={S.th}>Purchase Amount</th><th style={S.th}>Type</th><th style={{ ...S.th, width: 40 }}></th></tr></thead>
              <tbody>
                {visible.map(g => {
                  const isPurchase = g.type === 'Purchase'
                  const accent = isPurchase ? '#4caf82' : '#e05d5d'
                  return (
                    <tr key={g.id} onClick={() => setTxDetail(g)} style={{ cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,195,247,0.04)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ ...S.td, fontWeight: 600, color: isPurchase ? '#4fc3f7' : '#e05d5d' }}>{g.invoiceRef}</td>
                      <td style={S.td}>{g.invoiceDate}</td>
                      <td style={{ ...S.td, fontWeight: 500 }}>{g.supplier}</td>
                      <td style={S.td}>{g.itemCount} item{g.itemCount !== 1 ? 's' : ''}</td>
                      <td style={{ ...S.td, fontWeight: 600 }}>{fmtUGX(g.total)}</td>
                      <td style={S.td}>
                        <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${accent}25`, color: accent }}>
                          {g.type}
                        </span>
                      </td>
                      <td style={{ ...S.td, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>&rsaquo;</td>
                    </tr>
                  )
                })}
                {visible.length === 0 && <tr><td style={{ ...S.td, textAlign: 'center', padding: 30 }} colSpan={7}>{filtered.length === 0 && groups.length > 0 ? 'No transactions match your filters' : 'No purchase transactions yet'}</td></tr>}
              </tbody>
            </table>
            {txLimit < filtered.length && (
              <div style={{ padding: '12px 16px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button style={{ ...S.btn('#f0f2f5', '#333'), padding: '8px 24px' }} onClick={() => setTxLimit(txLimit + 50)}>Load More ({Math.min(50, filtered.length - txLimit)} of {filtered.length - txLimit} remaining)</button>
              </div>
            )}
          </div>
        </div>
      })()}

      {/* ─── New Purchase Modal ─── */}
      {showAdd && <PurchaseModal drugs={drugs} setDrugs={setDrugs} suppliers={suppliers} onSave={(po) => { setPurchases(prev => [...prev, po]); setShowAdd(false) }} onClose={() => setShowAdd(false)}/>}

      {/* ─── View PO Modal ─── */}
      {viewPO && (
        <div style={S.modal} onClick={() => setViewPO(null)}>
          <div style={S.modalWide} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{viewPO.poNumber}</h2>
                <div style={{ fontSize: 12, ...S.dimText }}>{viewPO.date} | {viewPO.supplier} | Invoice: {viewPO.invoiceRef || '-'} ({viewPO.invoiceDate || '-'}){viewPO.particulars && viewPO.particulars !== '-' ? ` | ${viewPO.particulars}` : ''}</div>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setViewPO(null)}><Icon d={icons.x} size={20} color="#6b7a8d"/></button>
            </div>
            <div id="po-detail">
              <table style={S.table}>
                <thead><tr><th style={S.th}>Drug</th><th style={S.th}>Batch</th><th style={S.th}>Expiry</th><th style={S.th}>Qty</th><th style={S.th}>Cost/Unit</th><th style={S.th}>Subtotal</th><th style={S.th}>Action</th></tr></thead>
                <tbody>{viewPO.items.map((it, i) => {
                  const expDays = it.expiry ? Math.ceil((new Date(it.expiry) - new Date()) / 86400000) : null
                  const expColor = expDays === null ? 'rgba(255,255,255,0.4)' : expDays <= 0 ? '#e05d5d' : expDays <= 90 ? '#e5a943' : 'rgba(255,255,255,0.7)'
                  return (
                    <tr key={i}>
                      <td style={{ ...S.td, fontWeight: 500 }}>{it.name}</td>
                      <td style={S.td}>{it.batch || '-'}</td>
                      <td style={{ ...S.td, color: expColor }}>{it.expiry || '-'}{expDays !== null && expDays <= 90 && expDays > 0 ? ` (${expDays}d)` : expDays !== null && expDays <= 0 ? ' (EXPIRED)' : ''}</td>
                      <td style={S.td}>{it.qty}</td>
                      <td style={S.td}>{fmtUGX(it.cost)}</td>
                      <td style={{ ...S.td, fontWeight: 600 }}>{fmtUGX(it.cost * it.qty)}</td>
                      <td style={S.td}>
                        <button style={{ ...S.btn('#fdeded', '#e05d5d'), padding: '5px 12px', fontSize: 13 }} onClick={() => {
                          const singleItemPO = { ...viewPO, items: [it] }
                          setViewPO(null)
                          setShowReturn(singleItemPO)
                        }}>Return</button>
                      </td>
                    </tr>
                  )
                })}</tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12, borderTop: '2px solid rgba(79,195,247,0.3)', marginTop: 8, fontSize: 16, fontWeight: 700 }}>TOTAL: {fmtUGX(viewPO.total)}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button style={S.btn('#f0f2f5', '#333')} onClick={() => printSection(`Purchase Order ${viewPO.poNumber}`, 'po-detail')}><Icon d={icons.print} size={14}/> Print</button>
              <button style={{ ...S.btn('#fdeded', '#e05d5d') }} onClick={() => { setViewPO(null); setShowReturn(viewPO) }}><Icon d={icons.returnIcon} size={14}/> Return All</button>
              <button style={S.btn()} onClick={() => setViewPO(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── View Return Modal ─── */}
      {viewReturn && (
        <div style={S.modal} onClick={() => setViewReturn(null)}>
          <div style={S.modalWide} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e05d5d' }}>{viewReturn.returnNumber}</h2>
                <div style={{ fontSize: 12, ...S.dimText }}>{viewReturn.date} | {viewReturn.supplier} | From: {viewReturn.poNumber}</div>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setViewReturn(null)}><Icon d={icons.x} size={20} color="#6b7a8d"/></button>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(224,93,93,0.08)', border: '1px solid rgba(224,93,93,0.15)', marginBottom: 16, fontSize: 13 }}>
              <strong>Reason:</strong> {viewReturn.reason}{viewReturn.notes ? ` - ${viewReturn.notes}` : ''}
            </div>
            <div id="return-detail">
              <table style={S.table}>
                <thead><tr><th style={S.th}>Drug</th><th style={S.th}>Return Qty</th><th style={S.th}>Cost/Unit</th><th style={S.th}>Subtotal</th></tr></thead>
                <tbody>{viewReturn.items.map((it, i) => (
                  <tr key={i}><td style={{ ...S.td, fontWeight: 500 }}>{it.name}</td><td style={S.td}>{it.returnQty}</td><td style={S.td}>{fmtUGX(it.cost)}</td><td style={{ ...S.td, fontWeight: 600 }}>{fmtUGX(it.cost * it.returnQty)}</td></tr>
                ))}</tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '2px solid rgba(224,93,93,0.3)', marginTop: 8 }}>
                <span style={{ fontSize: 12, ...S.dimText }}>Status: <span style={{ fontWeight: 600, color: viewReturn.status === 'refunded' ? '#4caf82' : viewReturn.status === 'credited' ? '#5b8def' : '#e5a943' }}>{viewReturn.status === 'refunded' ? 'Refunded' : viewReturn.status === 'credited' ? 'Credit Note Issued' : 'Pending'}</span></span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>RETURN TOTAL: {fmtUGX(viewReturn.total)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button style={S.btn('#f0f2f5', '#333')} onClick={() => printSection(`Purchase Return ${viewReturn.returnNumber}`, 'return-detail')}><Icon d={icons.print} size={14}/> Print</button>
              <button style={S.btn()} onClick={() => setViewReturn(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Return Modal (from PO) ─── */}
      {showReturn && <ReturnModal po={showReturn} onSave={handleReturn} onClose={() => setShowReturn(null)}/>}

      {/* ─── New Return Modal (expiry/direct) ─── */}
      {showExpiryReturn && <ExpiryReturnModal drugs={drugs} purchases={purchases} onSave={(rets) => { rets.forEach(r => handleReturn(r)); setShowExpiryReturn(false) }} onClose={() => setShowExpiryReturn(false)}/>}
    </div>
  )
}

/* ─── New Return Modal (from inventory / expiry) ─── */
function ExpiryReturnModal({ drugs, purchases, onSave, onClose }) {
  const [reason, setReason] = useState('Short Expiry')
  const [notes, setNotes] = useState('')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState([]) // { drugId, name, cost, qty (in stock), supplier, poNumber, returnQty, expiry }
  const [expiryDays, setExpiryDays] = useState(90)

  const reasons = ['Short Expiry', 'Expired', 'Damaged', 'Wrong Item', 'Quality Issue', 'Overstock', 'Other']
  const total = items.reduce((s, it) => s + it.cost * it.returnQty, 0)

  // Find drugs nearing expiry
  const todayStr = today()
  const cutoff = new Date(todayStr)
  cutoff.setDate(cutoff.getDate() + expiryDays)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const nearExpiry = drugs.filter(d => d.expiry && d.expiry <= cutoffStr && d.qty > 0)
    .sort((a, b) => (a.expiry || '').localeCompare(b.expiry || ''))

  // Search results (drugs not already added)
  const addedIds = new Set(items.map(it => it.drugId))
  const searchResults = search.length > 1
    ? drugs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) && d.qty > 0 && !addedIds.has(d.id))
    : []

  // Find which PO a drug came from (most recent purchase containing that drug)
  const findPO = (drugId) => {
    for (let i = purchases.length - 1; i >= 0; i--) {
      const po = purchases[i]
      const item = po.items.find(it => it.drugId === drugId)
      if (item) return { supplier: po.supplier, poNumber: po.poNumber, cost: item.cost }
    }
    return null
  }

  const addDrug = (drug) => {
    if (addedIds.has(drug.id)) return
    const po = findPO(drug.id)
    setItems(prev => [...prev, {
      drugId: drug.id, name: drug.name,
      cost: po ? po.cost : drug.cost,
      qty: drug.qty, returnQty: drug.qty,
      supplier: po ? po.supplier : (drug.supplier || 'Unknown'),
      poNumber: po ? po.poNumber : '-',
      expiry: drug.expiry || '-',
    }])
    setSearch('')
  }

  const removeDrug = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

  // Group items by supplier for the return
  const save = () => {
    if (items.length === 0) return alert('Add at least one drug to return')
    if (items.some(it => it.returnQty <= 0)) return alert('Return quantity must be greater than 0')
    if (items.some(it => it.returnQty > it.qty)) return alert('Return quantity cannot exceed stock quantity')

    // Group by supplier
    const bySupplier = {}
    items.forEach(it => {
      if (!bySupplier[it.supplier]) bySupplier[it.supplier] = []
      bySupplier[it.supplier].push(it)
    })

    // Create one return per supplier
    const allReturns = Object.entries(bySupplier).map(([supplier, sitems], idx) => ({
      id: Date.now() + idx,
      returnNumber: `RET-${String(Date.now() + idx).slice(-4)}`,
      date: today(),
      supplier,
      poNumber: sitems.map(it => it.poNumber).filter((v, i, a) => a.indexOf(v) === i).join(', '),
      reason,
      notes: notes || '',
      items: sitems.map(it => ({ drugId: it.drugId, name: it.name, cost: it.cost, returnQty: it.returnQty, originalQty: it.qty })),
      total: sitems.reduce((s, it) => s + it.cost * it.returnQty, 0),
      status: 'pending',
    }))
    onSave(allReturns)
  }

  const daysUntil = (exp) => {
    if (!exp || exp === '-') return null
    const diff = Math.ceil((new Date(exp) - new Date(todayStr)) / 86400000)
    return diff
  }

  const expiryColor = (days) => {
    if (days === null) return 'rgba(255,255,255,0.4)'
    if (days <= 0) return '#e05d5d'
    if (days <= 30) return '#e5a943'
    if (days <= 90) return '#e5a943'
    return 'rgba(255,255,255,0.6)'
  }

  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalWide} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e05d5d' }}>New Purchase Return</h2>
            <div style={{ fontSize: 12, ...S.dimText }}>Return drugs from inventory to supplier</div>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><Icon d={icons.x} size={20} color="#6b7a8d"/></button>
        </div>

        <div style={S.row}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Return Reason</label>
            <select style={{ ...S.select, width: '100%' }} value={reason} onChange={e => setReason(e.target.value)}>
              {reasons.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <label style={S.label}>Notes (optional)</label>
            <input style={S.input} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional details about the return..."/>
          </div>
        </div>

        {/* Near Expiry Drugs */}
        <div style={{ marginBottom: 16, padding: 18, borderRadius: 12, background: 'rgba(229,169,67,0.06)', border: '1px solid rgba(229,169,67,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e5a943' }}>Drugs Nearing Expiry</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Within</span>
              <select style={{ ...S.select, padding: '6px 12px', fontSize: 14 }} value={expiryDays} onChange={e => setExpiryDays(+e.target.value)}>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>6 months</option>
                <option value={365}>1 year</option>
              </select>
            </div>
          </div>
          {nearExpiry.length === 0
            ? <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', padding: '10px 0' }}>No drugs expiring within {expiryDays} days</div>
            : <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {nearExpiry.map(d => {
                const days = daysUntil(d.expiry)
                const already = addedIds.has(d.id)
                return (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, marginBottom: 6, background: already ? 'rgba(76,175,130,0.08)' : 'rgba(255,255,255,0.03)', opacity: already ? 0.5 : 1 }}>
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{d.name}</span>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginLeft: 10 }}>Qty: {d.qty}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: expiryColor(days) }}>
                        {days <= 0 ? 'EXPIRED' : `${days} days left`}
                      </span>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{d.expiry}</span>
                      {!already && <button style={{ ...S.btn('#e05d5d', '#fff'), padding: '6px 16px', fontSize: 14 }} onClick={() => addDrug(d)}>Add</button>}
                      {already && <span style={{ fontSize: 14, fontWeight: 600, color: '#4caf82' }}>Added</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          }
        </div>

        {/* Search to add any drug */}
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Or Search Any Drug</label>
          <div style={{ position: 'relative' }}>
            <input style={S.input} placeholder="Search drug by name..." value={search} onChange={e => setSearch(e.target.value)}/>
            {searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--dropdown-bg)', border: '1px solid var(--bd2)', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 10, maxHeight: 150, overflowY: 'auto', marginTop: 4, backdropFilter: 'blur(20px)' }}>
                {searchResults.map(d => (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', cursor: 'pointer', fontSize: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }} onMouseDown={() => addDrug(d)}>
                    <span>{d.name} <span style={S.dimText}>({fmtUGX(d.cost)}/unit, Qty: {d.qty})</span></span>
                    {d.expiry && <span style={{ color: expiryColor(daysUntil(d.expiry)), fontSize: 13 }}>Exp: {d.expiry}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Items */}
        {items.length > 0 && (
          <table style={S.table}>
            <thead><tr><th style={S.th}>Drug</th><th style={S.th}>Supplier</th><th style={S.th}>PO #</th><th style={S.th}>Expiry</th><th style={S.th}>In Stock</th><th style={S.th}>Return Qty</th><th style={S.th}>Cost/Unit</th><th style={S.th}>Return Value</th><th style={S.th}></th></tr></thead>
            <tbody>{items.map((it, i) => {
              const days = daysUntil(it.expiry)
              return (
                <tr key={i}>
                  <td style={{ ...S.td, fontWeight: 500 }}>{it.name}</td>
                  <td style={S.td}>{it.supplier}</td>
                  <td style={{ ...S.td, color: '#4fc3f7' }}>{it.poNumber}</td>
                  <td style={{ ...S.td, color: expiryColor(days) }}>{it.expiry}{days !== null && days <= 0 ? ' (EXPIRED)' : ''}</td>
                  <td style={S.td}>{it.qty}</td>
                  <td style={S.td}>
                    <input style={{ ...S.input, width: 70 }} type="number" min="1" max={it.qty} value={it.returnQty}
                      onChange={e => setItems(prev => prev.map((x, j) => j === i ? { ...x, returnQty: Math.min(+e.target.value, x.qty) } : x))}/>
                  </td>
                  <td style={S.td}>{fmtUGX(it.cost)}</td>
                  <td style={{ ...S.td, fontWeight: 600, color: '#e05d5d' }}>{fmtUGX(it.cost * it.returnQty)}</td>
                  <td style={S.td}><button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => removeDrug(i)}><Icon d={icons.trash} size={14} color="#e05d5d"/></button></td>
                </tr>
              )
            })}</tbody>
          </table>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '2px solid rgba(224,93,93,0.3)' }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#e05d5d' }}>Return Total: {fmtUGX(total)}</span>
            <div style={{ fontSize: 11, ...S.dimText, marginTop: 4 }}>{items.length} drug{items.length !== 1 ? 's' : ''} selected{items.length > 0 && ` across ${[...new Set(items.map(it => it.supplier))].length} supplier(s)`}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={S.btn('#f0f2f5', '#333')} onClick={onClose}>Cancel</button>
            <button style={{ ...S.btn('#e05d5d', '#fff'), opacity: items.length === 0 ? 0.5 : 1 }} onClick={save} disabled={items.length === 0}><Icon d={icons.returnIcon} size={14}/> Submit Return</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Purchase Return Modal (from PO) ─── */
function ReturnModal({ po, onSave, onClose }) {
  const [reason, setReason] = useState('Short Expiry')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState(
    po.items.map(it => ({ ...it, returnQty: 0, selected: false }))
  )

  const reasons = ['Short Expiry', 'Expired', 'Damaged', 'Wrong Item', 'Quality Issue', 'Overstock', 'Other']
  const selectedItems = items.filter(it => it.selected && it.returnQty > 0)
  const total = selectedItems.reduce((s, it) => s + it.cost * it.returnQty, 0)

  const toggleItem = (idx) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected, returnQty: !it.selected ? it.qty : 0 } : it))
  }

  const save = () => {
    if (selectedItems.length === 0) return alert('Select at least one item to return')
    if (selectedItems.some(it => it.returnQty <= 0)) return alert('Return quantity must be greater than 0')
    if (selectedItems.some(it => it.returnQty > it.qty)) return alert('Return quantity cannot exceed purchased quantity')
    const ret = {
      id: Date.now(),
      returnNumber: `RET-${String(Date.now()).slice(-4)}`,
      date: today(),
      supplier: po.supplier,
      poNumber: po.poNumber,
      poId: po.id,
      reason,
      notes: notes || '',
      items: selectedItems.map(it => ({ drugId: it.drugId, name: it.name, cost: it.cost, returnQty: it.returnQty, originalQty: it.qty })),
      total,
      status: 'pending',
    }
    onSave(ret)
  }

  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalWide} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e05d5d' }}>Purchase Return</h2>
            <div style={{ fontSize: 12, ...S.dimText }}>From {po.poNumber} | {po.supplier} | {po.date}</div>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><Icon d={icons.x} size={20} color="#6b7a8d"/></button>
        </div>

        <div style={S.row}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Return Reason</label>
            <select style={{ ...S.select, width: '100%' }} value={reason} onChange={e => setReason(e.target.value)}>
              {reasons.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <label style={S.label}>Notes (optional)</label>
            <input style={S.input} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional details about the return..."/>
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={S.label}>Select Items to Return</label>
        </div>
        <table style={S.table}>
          <thead><tr><th style={{ ...S.th, width: 30 }}></th><th style={S.th}>Drug</th><th style={S.th}>Batch</th><th style={S.th}>Expiry</th><th style={S.th}>Purchased Qty</th><th style={S.th}>Return Qty</th><th style={S.th}>Cost/Unit</th><th style={S.th}>Return Value</th></tr></thead>
          <tbody>{items.map((it, i) => {
            const expDays = it.expiry ? Math.ceil((new Date(it.expiry) - new Date()) / 86400000) : null
            const expColor = expDays === null ? 'rgba(255,255,255,0.4)' : expDays <= 0 ? '#e05d5d' : expDays <= 90 ? '#e5a943' : 'rgba(255,255,255,0.7)'
            return (
            <tr key={i} style={{ opacity: it.selected ? 1 : 0.5 }}>
              <td style={S.td}>
                <div onClick={() => toggleItem(i)} style={{ width: 20, height: 20, borderRadius: 4, border: it.selected ? '2px solid #e05d5d' : '2px solid rgba(255,255,255,0.2)', background: it.selected ? 'rgba(224,93,93,0.2)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {it.selected && <Icon d={icons.check} size={12} color="#e05d5d"/>}
                </div>
              </td>
              <td style={{ ...S.td, fontWeight: 500 }}>{it.name}</td>
              <td style={S.td}>{it.batch || '-'}</td>
              <td style={{ ...S.td, color: expColor }}>{it.expiry || '-'}{expDays !== null && expDays <= 90 && expDays > 0 ? ` (${expDays}d)` : expDays !== null && expDays <= 0 ? ' (EXPIRED)' : ''}</td>
              <td style={S.td}>{it.qty}</td>
              <td style={S.td}>
                <input style={{ ...S.input, width: 80 }} type="number" min="0" max={it.qty} value={it.returnQty}
                  disabled={!it.selected}
                  onChange={e => setItems(prev => prev.map((x, j) => j === i ? { ...x, returnQty: Math.min(+e.target.value, x.qty) } : x))}/>
              </td>
              <td style={S.td}>{fmtUGX(it.cost)}</td>
              <td style={{ ...S.td, fontWeight: 600, color: it.selected ? '#e05d5d' : 'inherit' }}>{it.selected ? fmtUGX(it.cost * it.returnQty) : '-'}</td>
            </tr>
            )
          })}</tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '2px solid rgba(224,93,93,0.3)' }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#e05d5d' }}>Return Total: {fmtUGX(total)}</span>
            <div style={{ fontSize: 11, ...S.dimText, marginTop: 4 }}>{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected for return</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={S.btn('#f0f2f5', '#333')} onClick={onClose}>Cancel</button>
            <button style={{ ...S.btn('#e05d5d', '#fff'), opacity: selectedItems.length === 0 ? 0.5 : 1 }} onClick={save} disabled={selectedItems.length === 0}><Icon d={icons.returnIcon} size={14}/> Submit Return</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── New Purchase Modal ─── */
function PurchaseModal({ drugs, setDrugs, suppliers, onSave, onClose }) {
  const [supplier, setSupplier] = useState(suppliers[0]?.name || '')
  const [invoiceRef, setInvoiceRef] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(today())
  const [particulars, setParticulars] = useState('')
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [showNewDrug, setShowNewDrug] = useState(false)

  const results = search.length > 1 ? drugs.filter(d => d.name.toLowerCase().includes(search.toLowerCase())) : []
  const total = items.reduce((s, it) => s + it.cost * it.qty, 0)

  const addItem = (drug) => {
    if (items.find(it => it.drugId === drug.id)) return
    setItems(prev => [...prev, { drugId: drug.id, name: drug.name, cost: drug.cost, qty: 1, batch: drug.batch || '', expiry: drug.expiry || '' }])
    setSearch('')
  }

  const addNewDrugAndItem = (drug) => {
    const newDrug = { ...drug, id: Date.now() }
    setDrugs(prev => [...prev, newDrug])
    setItems(prev => [...prev, { drugId: newDrug.id, name: newDrug.name, cost: newDrug.cost, qty: drug._purchaseQty || 1, batch: drug.batch || '', expiry: drug.expiry || '' }])
    setShowNewDrug(false)
  }

  const save = () => {
    if (items.length === 0) return alert('Add at least one item')
    const po = {
      id: Date.now(),
      poNumber: `PO-${String(Date.now()).slice(-4)}`,
      date: today(),
      supplier,
      items,
      total,
      status: 'received',
      receivedBy: 'Admin',
      invoiceRef: invoiceRef || '-',
      invoiceDate: invoiceDate || today(),
      particulars: particulars || '-',
    }
    setDrugs(prev => prev.map(d => {
      const it = items.find(x => x.drugId === d.id)
      if (!it) return d
      const upd = { ...d, qty: d.qty + it.qty }
      if (it.batch) upd.batch = it.batch
      if (it.expiry) upd.expiry = it.expiry
      return upd
    }))
    onSave(po)
  }

  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalWide} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>New Purchase / Goods Received</h2>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><Icon d={icons.x} size={20} color="#6b7a8d"/></button>
        </div>

        <div style={S.row}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Supplier</label>
            <select style={{ ...S.select, width: '100%' }} value={supplier} onChange={e => setSupplier(e.target.value)}>
              {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}><label style={S.label}>Invoice No./Ref</label><input style={S.input} value={invoiceRef} onChange={e => setInvoiceRef(e.target.value)} placeholder="e.g. INV-1234"/></div>
          <div style={{ flex: 1 }}><label style={S.label}>Invoice Date</label><input style={S.input} type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)}/></div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Particulars</label>
          <input style={S.input} value={particulars} onChange={e => setParticulars(e.target.value)} placeholder="e.g. Monthly restock, Emergency order..."/>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Add Items</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input style={S.input} placeholder="Search existing drug..." value={search} onChange={e => setSearch(e.target.value)}/>
              {results.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--dropdown-bg)', border: '1px solid var(--bd2)', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 10, maxHeight: 150, overflowY: 'auto', marginTop: 4, backdropFilter: 'blur(20px)' }}>
                  {results.map(d => (
                    <div key={d.id} style={{ padding: '8px 14px', cursor: 'pointer', fontSize: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }} onMouseDown={() => addItem(d)}>
                      {d.name} <span style={S.dimText}>({fmtUGX(d.cost)}/unit)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button style={S.btn()} onClick={() => setShowNewDrug(true)}><Icon d={icons.plus} size={14}/> New Drug</button>
          </div>
        </div>

        {items.length > 0 && (
          <table style={S.table}>
            <thead><tr><th style={S.th}>Drug</th><th style={S.th}>Batch</th><th style={S.th}>Expiry</th><th style={S.th}>Qty</th><th style={S.th}>Cost/Unit</th><th style={S.th}>Subtotal</th><th style={S.th}></th></tr></thead>
            <tbody>{items.map((it, i) => (
              <tr key={i}>
                <td style={{ ...S.td, fontWeight: 500 }}>{it.name}</td>
                <td style={S.td}><input style={{ ...S.input, width: 90 }} value={it.batch} onChange={e => setItems(prev => prev.map((x, j) => j === i ? { ...x, batch: e.target.value } : x))} placeholder="Batch #"/></td>
                <td style={S.td}><input style={{ ...S.input, width: 120 }} type="date" value={it.expiry} onChange={e => setItems(prev => prev.map((x, j) => j === i ? { ...x, expiry: e.target.value } : x))}/></td>
                <td style={S.td}><input style={{ ...S.input, width: 70 }} type="number" min="1" value={it.qty} onChange={e => setItems(prev => prev.map((x, j) => j === i ? { ...x, qty: +e.target.value } : x))}/></td>
                <td style={S.td}><input style={{ ...S.input, width: 90 }} type="number" value={it.cost} onChange={e => setItems(prev => prev.map((x, j) => j === i ? { ...x, cost: +e.target.value } : x))}/></td>
                <td style={{ ...S.td, fontWeight: 600 }}>{fmtUGX(it.cost * it.qty)}</td>
                <td style={S.td}><button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}><Icon d={icons.trash} size={14} color="#e05d5d"/></button></td>
              </tr>
            ))}</tbody>
          </table>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '2px solid rgba(79,195,247,0.3)' }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>Total: {fmtUGX(total)}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={S.btn('#f0f2f5', '#333')} onClick={onClose}>Cancel</button>
            <button style={S.btn()} onClick={save}><Icon d={icons.check} size={14}/> Save & Receive</button>
          </div>
        </div>

        {showNewDrug && <NewDrugInline onAdd={addNewDrugAndItem} onClose={() => setShowNewDrug(false)}/>}
      </div>
    </div>
  )
}

function NewDrugInline({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', category: 'Other', qty: 0, reorder: 20, price: 0, cost: 0, expiry: '', batch: '', supplier: SUPPLIERS[0], _purchaseQty: 1 })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: 'rgba(79,195,247,0.06)', border: '1px solid rgba(79,195,247,0.15)' }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#4fc3f7' }}>Add New Drug to System</h3>
      <div style={S.row}>
        <div style={{ flex: 2 }}><label style={S.label}>Drug Name</label><input style={S.input} value={form.name} onChange={e => set('name', e.target.value)}/></div>
        <div style={{ flex: 1 }}><label style={S.label}>Category</label><select style={{ ...S.select, width: '100%' }} value={form.category} onChange={e => set('category', e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
      </div>
      <div style={S.row}>
        <div style={{ flex: 1 }}><label style={S.label}>Purchase Qty</label><input style={S.input} type="number" value={form._purchaseQty} onChange={e => set('_purchaseQty', +e.target.value)}/></div>
        <div style={{ flex: 1 }}><label style={S.label}>Cost Price</label><input style={S.input} type="number" value={form.cost} onChange={e => set('cost', +e.target.value)}/></div>
        <div style={{ flex: 1 }}><label style={S.label}>Selling Price</label><input style={S.input} type="number" value={form.price} onChange={e => set('price', +e.target.value)}/></div>
      </div>
      <div style={S.row}>
        <div style={{ flex: 1 }}><label style={S.label}>Batch</label><input style={S.input} value={form.batch} onChange={e => set('batch', e.target.value)}/></div>
        <div style={{ flex: 1 }}><label style={S.label}>Expiry</label><input style={S.input} type="date" value={form.expiry} onChange={e => set('expiry', e.target.value)}/></div>
        <div style={{ flex: 1 }}><label style={S.label}>Reorder Level</label><input style={S.input} type="number" value={form.reorder} onChange={e => set('reorder', +e.target.value)}/></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button style={S.btn('#f0f2f5', '#333')} onClick={onClose}>Cancel</button>
        <button style={S.btn()} onClick={() => { if (!form.name) return alert('Drug name required'); onAdd(form) }}>Add Drug & Include</button>
      </div>
    </div>
  )
}
