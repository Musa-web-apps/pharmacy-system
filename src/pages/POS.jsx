import { useState, useRef } from 'react'
import { S, Icon, icons, fmtUGX, today, printThermalReceipt } from '../shared.jsx'

export default function POS({ drugs, setDrugs, sales, setSales, patients, clients, cashier, setCashier }) {
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [customer, setCustomer] = useState('')
  const [showReceipt, setShowReceipt] = useState(null)
  const [cashPaid, setCashPaid] = useState('')
  const [payMethod, setPayMethod] = useState('Cash')
  const [barcode, setBarcode] = useState('')
  const barcodeRef = useRef(null)

  const [showAll, setShowAll] = useState(false)
  const [hlIdx, setHlIdx] = useState(-1)
  const results = showAll
    ? drugs.filter(d => d.qty > 0 && (!search || d.name.toLowerCase().includes(search.toLowerCase())))
    : search.length > 1 ? drugs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) && d.qty > 0) : []

  const addToCart = (drug) => {
    setCart(prev => {
      const ex = prev.find(c => c.drugId === drug.id)
      if (ex) return prev.map(c => c.drugId === drug.id ? { ...c, qty: Math.min(c.qty + 1, drug.qty) } : c)
      return [...prev, { drugId: drug.id, name: drug.name, price: drug.price, qty: 1, maxQty: drug.qty }]
    })
    setSearch('')
    setShowAll(false)
    setHlIdx(-1)
  }

  const onBarcodeScan = (e) => {
    if (e.key !== 'Enter') return
    const code = barcode.trim()
    if (!code) return
    const drug = drugs.find(d => d.barcode === code)
    if (!drug) { alert(`No drug found with barcode: ${code}`); setBarcode(''); return }
    if (drug.qty <= 0) { alert(`${drug.name} is out of stock`); setBarcode(''); return }
    addToCart(drug)
    setBarcode('')
  }

  const onSearchKey = (e) => {
    if (!showAll && results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!showAll) setShowAll(true)
      setHlIdx(prev => prev < results.length - 1 ? prev + 1 : 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!showAll) setShowAll(true)
      setHlIdx(prev => prev > 0 ? prev - 1 : results.length - 1)
    } else if ((e.key === 'Enter' || e.key === ' ') && hlIdx >= 0 && hlIdx < results.length) {
      e.preventDefault()
      addToCart(results[hlIdx])
    } else if (e.key === 'Escape') {
      setShowAll(false)
      setHlIdx(-1)
    }
  }

  const updateQty = (drugId, qty) => {
    if (qty <= 0) return setCart(prev => prev.filter(c => c.drugId !== drugId))
    setCart(prev => prev.map(c => c.drugId === drugId ? { ...c, qty: Math.min(qty, c.maxQty) } : c))
  }

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0)

  const paid = Number(cashPaid) || 0
  const balance = paid - total

  const checkout = () => {
    if (cart.length === 0) return
    if (payMethod === 'Cash' && paid < total) return alert('Cash paid is less than the total amount')
    if (payMethod === 'Credit' && !customer) return alert('Please select a customer for credit sales')
    if (!cashier.trim()) return alert('Please enter your name (Served By) before completing the sale')
    localStorage.setItem('pharmacare-cashier', cashier)
    const isCredit = payMethod === 'Credit'
    const sale = {
      id: Date.now(), date: today(), time: new Date().toLocaleTimeString(),
      customer: customer || 'Walk-in', items: [...cart], total,
      cashPaid: isCredit ? paid : paid, balance: isCredit ? 0 : balance,
      payMethod, cashierName: cashier.trim(),
      ...(isCredit ? { creditAmount: total - paid, creditPaid: 0 } : {})
    }
    setSales(prev => [...prev, sale])
    setDrugs(prev => prev.map(d => {
      const item = cart.find(c => c.drugId === d.id)
      return item ? { ...d, qty: d.qty - item.qty } : d
    }))
    setShowReceipt(sale)
    setCart([])
    setCustomer('')
    setCashPaid('')
    setPayMethod('Cash')
  }

  return (
    <div>
      <h1 style={S.header}>Point of Sale</h1>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 2 }}>
          <div style={{ ...S.card, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--input-bg)', border: '1px solid var(--bd)', borderRadius: 10, padding: '8px 12px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--text4)' }}><path d="M2 4h2v16H2zM6 4h1v16H6zM9 4h2v16H9zM13 4h1v16h-1zM16 4h2v16h-2zM20 4h2v16h-2z"/></svg>
                <input ref={barcodeRef} style={{ ...S.searchInput, fontSize: 15 }} placeholder="Scan barcode or type code..." value={barcode} onChange={e => setBarcode(e.target.value)} onKeyDown={onBarcodeScan}/>
                {barcode && <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setBarcode('')}><Icon d={icons.x} size={14} color="var(--text4)"/></button>}
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--input-bg)', border: '1px solid var(--bd)', borderRadius: 12, padding: '12px 16px' }}>
                <Icon d={icons.search} size={20} color="#9ca3af"/>
                <input style={{ ...S.searchInput, fontSize: 16 }} placeholder="Search drug to add..." value={search} onChange={e => { setSearch(e.target.value); setShowAll(true); setHlIdx(-1) }} onFocus={() => setShowAll(true)} onBlur={() => setTimeout(() => { setShowAll(false); setHlIdx(-1) }, 200)} onKeyDown={onSearchKey}/>
                <div onClick={() => setShowAll(p => !p)} style={{ cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 18, color: 'var(--text3)', transform: showAll ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', display: 'inline-block' }}>&#9660;</span>
                </div>
              </div>
              {showAll && results.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--dropdown-bg)', border: '1px solid var(--bd2)', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 10, maxHeight: 260, overflowY: 'auto', marginTop: 6, backdropFilter: 'blur(20px)' }}>
                  {results.map((d, i) => (
                    <div key={d.id} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 15, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bd3)', background: i === hlIdx ? 'rgba(79,195,247,0.15)' : 'transparent' }}
                      onMouseDown={() => addToCart(d)} onMouseEnter={() => setHlIdx(i)}>
                      <span style={{ fontWeight: 500 }}>{d.name}</span>
                      <span style={S.dimText}>{fmtUGX(d.price)} | Qty: {d.qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={S.card}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Cart ({cart.length} items)</h3>
            {cart.length === 0 ? <div style={{ padding: 30, textAlign: 'center', ...S.mutedText }}>Search and add drugs above</div> : (
              <table style={S.table}>
                <thead><tr><th style={S.th}>Item</th><th style={S.th}>Price</th><th style={S.th}>Qty</th><th style={S.th}>Subtotal</th><th style={S.th}></th></tr></thead>
                <tbody>
                  {cart.map(c => (
                    <tr key={c.drugId}>
                      <td style={{ ...S.td, fontWeight: 500 }}>{c.name}</td>
                      <td style={S.td}>{fmtUGX(c.price)}</td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button style={{ ...S.btn('#f0f2f5', '#333'), padding: '2px 8px' }} onClick={() => updateQty(c.drugId, c.qty - 1)}>-</button>
                          <span style={{ minWidth: 24, textAlign: 'center' }}>{c.qty}</span>
                          <button style={{ ...S.btn('#f0f2f5', '#333'), padding: '2px 8px' }} onClick={() => updateQty(c.drugId, c.qty + 1)}>+</button>
                        </div>
                      </td>
                      <td style={{ ...S.td, fontWeight: 600 }}>{fmtUGX(c.price * c.qty)}</td>
                      <td style={S.td}><button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => updateQty(c.drugId, 0)}><Icon d={icons.trash} size={16} color="#e05d5d"/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={S.card}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Checkout</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Served By *</label>
              <input style={S.input} value={cashier} onChange={e => setCashier(e.target.value)} placeholder="Enter your name"/>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Customer</label>
              <select style={{ ...S.select, width: '100%' }} value={customer} onChange={e => setCustomer(e.target.value)}>
                <option value="">Walk-in Customer</option>
                {patients.length > 0 && <optgroup label="Patients">
                  {patients.map(p => <option key={`p-${p.id}`} value={p.name}>{p.name}</option>)}
                </optgroup>}
                {clients.length > 0 && <optgroup label="Clinics / Hospitals">
                  {clients.map(c => <option key={`c-${c.id}`} value={c.name}>{c.name} ({c.type})</option>)}
                </optgroup>}
              </select>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}><span>Items</span><span>{cart.length}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}><span>Units</span><span>{cart.reduce((s, c) => s + c.qty, 0)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '2px solid rgba(79,195,247,0.3)', marginTop: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#4fc3f7' }}>{fmtUGX(total)}</span>
              </div>
            </div>

            {cart.length > 0 && <div style={{ marginTop: 14 }}>
              <label style={S.label}>Payment Method</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {['Cash', 'Mobile Money', 'ATM Card', 'Credit'].map(m => (
                  <button key={m} onClick={() => { setPayMethod(m); if (m !== 'Cash' && m !== 'Credit') setCashPaid('') }} style={{ flex: 1, minWidth: 70, padding: '8px 6px', borderRadius: 8, border: payMethod === m ? '2px solid var(--accent)' : '1px solid var(--bd)', background: payMethod === m ? 'rgba(79,195,247,0.12)' : 'var(--input-bg)', color: payMethod === m ? 'var(--accent)' : 'var(--text3)', fontSize: 13, fontWeight: payMethod === m ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>{m}</button>
                ))}
              </div>
              {payMethod === 'Cash' && <>
                <label style={S.label}>Cash Paid</label>
                <input style={{ ...S.input, fontSize: 18, fontWeight: 700, padding: '10px 12px', textAlign: 'right' }} inputMode="numeric" value={cashPaid ? Number(cashPaid).toLocaleString() : ''} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setCashPaid(v) }} placeholder="0"/>
                {paid > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, padding: '10px 14px', borderRadius: 10, background: balance >= 0 ? 'rgba(76,175,130,0.1)' : 'rgba(224,93,93,0.1)', border: `1px solid ${balance >= 0 ? 'rgba(76,175,130,0.2)' : 'rgba(224,93,93,0.2)'}` }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>Balance</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: balance >= 0 ? '#4caf82' : '#e05d5d' }}>{fmtUGX(Math.abs(balance))}{balance < 0 ? ' SHORT' : ''}</span>
                  </div>
                )}
              </>}
              {payMethod === 'Credit' && <>
                {!customer && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(224,93,93,0.1)', border: '1px solid rgba(224,93,93,0.2)', fontSize: 13, color: '#e05d5d', marginBottom: 10 }}>Select a customer above for credit sale</div>}
                <label style={S.label}>Amount Paid Now (optional)</label>
                <input style={{ ...S.input, fontSize: 18, fontWeight: 700, padding: '10px 12px', textAlign: 'right' }} inputMode="numeric" value={cashPaid ? Number(cashPaid).toLocaleString() : ''} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setCashPaid(v) }} placeholder="0"/>
                <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(229,169,67,0.1)', border: '1px solid rgba(229,169,67,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text3)' }}>Total</span><span style={{ fontWeight: 600 }}>{fmtUGX(total)}</span>
                  </div>
                  {paid > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text3)' }}>Paid Now</span><span style={{ fontWeight: 600 }}>{fmtUGX(paid)}</span>
                  </div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#e5a943', paddingTop: 6, borderTop: '1px solid rgba(229,169,67,0.2)' }}>
                    <span>Credit Balance</span><span>{fmtUGX(Math.max(0, total - paid))}</span>
                  </div>
                </div>
              </>}
              {payMethod !== 'Cash' && payMethod !== 'Credit' && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(79,195,247,0.06)', border: '1px solid rgba(79,195,247,0.15)', fontSize: 13, color: 'var(--text3)' }}>
                  {payMethod === 'Mobile Money' ? 'Amount will be received via Mobile Money' : 'Amount will be charged to ATM Card'} - {fmtUGX(total)}
                </div>
              )}
            </div>}

            <button style={{ ...S.btn(), width: '100%', justifyContent: 'center', marginTop: 16, padding: '12px 0', opacity: cart.length === 0 || (payMethod === 'Cash' && paid < total) || (payMethod === 'Credit' && !customer) ? 0.5 : 1 }} onClick={checkout} disabled={cart.length === 0 || (payMethod === 'Cash' && paid < total) || (payMethod === 'Credit' && !customer)}>
              <Icon d={icons.check} size={16}/> Complete Sale
            </button>
          </div>

        </div>
      </div>

      {showReceipt && (
        <div style={S.modal} onClick={() => setShowReceipt(null)}>
          <div style={{ ...S.modalBox, width: 380, fontFamily: "'Courier New', monospace" }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--bd)', paddingBottom: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>PharmaCare Pro</div>
              <div style={{ fontSize: 10, color: 'var(--text4)' }}>Pharmacy Management System</div>
            </div>
            <div style={{ borderBottom: '1px dashed var(--bd)', paddingBottom: 8, marginBottom: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}><span style={{ color: 'var(--text4)' }}>Receipt #:</span><span style={{ fontWeight: 600 }}>{showReceipt.id}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}><span style={{ color: 'var(--text4)' }}>Date:</span><span>{showReceipt.date}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}><span style={{ color: 'var(--text4)' }}>Time:</span><span>{showReceipt.time}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}><span style={{ color: 'var(--text4)' }}>Served By:</span><span>{showReceipt.cashierName || '-'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text4)' }}>Customer:</span><span>{showReceipt.customer}</span></div>
            </div>
            <div style={{ borderBottom: '1px dashed var(--bd)', paddingBottom: 6, marginBottom: 6 }}>
              {showReceipt.items.map((c, i) => (
                <div key={c.drugId} style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{i + 1}. {c.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, paddingLeft: 12, color: 'var(--text3)' }}>
                    <span>{c.qty} x {fmtUGX(c.price)}</span><span style={{ fontWeight: 600, color: 'var(--text)' }}>{fmtUGX(c.price * c.qty)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderBottom: '1px dashed var(--bd)', paddingBottom: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                <span>TOTAL</span><span>{fmtUGX(showReceipt.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}><span style={{ color: 'var(--text4)' }}>Payment:</span><span>{showReceipt.payMethod || 'Cash'}</span></div>
              {showReceipt.payMethod === 'Credit' ? <>
                {showReceipt.cashPaid > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}><span style={{ color: 'var(--text4)' }}>Paid Now:</span><span>{fmtUGX(showReceipt.cashPaid)}</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#e5a943' }}><span>Credit Owed:</span><span>{fmtUGX(showReceipt.creditAmount)}</span></div>
              </> : <>
                {showReceipt.cashPaid > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}><span style={{ color: 'var(--text4)' }}>Cash Paid:</span><span>{fmtUGX(showReceipt.cashPaid)}</span></div>}
                {showReceipt.balance > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#4caf82' }}><span>Change:</span><span>{fmtUGX(showReceipt.balance)}</span></div>}
              </>}
            </div>
            <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text4)', marginBottom: 12 }}>
              Thank you for your purchase!<br/>Goods once sold are not returnable
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...S.btn('#f0f2f5', '#333'), flex: 1, justifyContent: 'center' }} onClick={() => printThermalReceipt(showReceipt)}><Icon d={icons.print} size={14}/> Print Receipt</button>
              <button style={{ ...S.btn(), flex: 1, justifyContent: 'center' }} onClick={() => setShowReceipt(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
