import { useState } from 'react'
import { S, Icon, icons, fmtUGX, today, printDocument } from '../shared.jsx'

const TABS = ['Quotations', 'Proforma Invoices', 'Purchase Orders']
const STATUS_COLORS = {
  Draft: { bg: 'rgba(155,168,183,0.15)', color: '#8b95a8' },
  Sent: { bg: 'rgba(91,141,239,0.15)', color: '#5b8def' },
  Accepted: { bg: 'rgba(76,175,130,0.15)', color: '#4caf82' },
  Expired: { bg: 'rgba(224,93,93,0.15)', color: '#e05d5d' },
  Paid: { bg: 'rgba(76,175,130,0.15)', color: '#4caf82' },
  Received: { bg: 'rgba(76,175,130,0.15)', color: '#4caf82' },
  Cancelled: { bg: 'rgba(224,93,93,0.15)', color: '#e05d5d' },
  Converted: { bg: 'rgba(229,169,67,0.15)', color: '#e5a943' },
}

export default function Documents({ drugs, patients, clients, suppliers, cashier, quotations, setQuotations, proformas, setProformas, purchaseOrders, setPurchaseOrders, onConvertToSale }) {
  const [tab, setTab] = useState(0)
  const [showForm, setShowForm] = useState(null) // 'quotation' | 'proforma' | 'purchaseOrder'
  const [viewDoc, setViewDoc] = useState(null)
  const [editDoc, setEditDoc] = useState(null)

  // Form state
  const [form, setForm] = useState({ recipient: '', date: today(), validUntil: '', dueDate: '', notes: '', items: [{ name: '', qty: 1, price: '' }] })
  const [drugSearch, setDrugSearch] = useState('')

  const openCreate = (type) => {
    setForm({ recipient: '', date: today(), validUntil: '', dueDate: '', notes: '', items: [{ name: '', qty: 1, price: '' }] })
    setEditDoc(null)
    setShowForm(type)
  }

  const openEdit = (doc, type) => {
    setForm({ recipient: doc.recipient, date: doc.date, validUntil: doc.validUntil || '', dueDate: doc.dueDate || '', notes: doc.notes || '', items: doc.items.map(it => ({ ...it })) })
    setEditDoc(doc)
    setShowForm(type)
  }

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { name: '', qty: 1, price: '' }] }))
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  const updateItem = (i, key, val) => setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [key]: val } : it) }))

  const pickDrug = (i, drug) => {
    const price = showForm === 'purchaseOrder' ? drug.cost : drug.price
    updateItem(i, 'name', drug.name)
    updateItem(i, 'price', price)
    setDrugSearch('')
  }

  const formTotal = form.items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 0), 0)

  const save = () => {
    if (!form.recipient) return alert('Recipient is required')
    if (form.items.length === 0 || !form.items[0].name) return alert('Add at least one item')
    const doc = {
      id: editDoc ? editDoc.id : Date.now(),
      date: form.date,
      recipient: form.recipient,
      items: form.items.filter(it => it.name).map(it => ({ name: it.name, qty: Number(it.qty) || 1, price: Number(it.price) || 0, cost: Number(it.price) || 0 })),
      total: formTotal,
      status: editDoc ? editDoc.status : 'Draft',
      notes: form.notes,
      createdBy: cashier || '-',
      ...(showForm !== 'purchaseOrder' ? { validUntil: form.validUntil } : {}),
      ...(showForm === 'proforma' ? { dueDate: form.dueDate } : {}),
    }
    if (showForm === 'quotation') {
      setQuotations(prev => editDoc ? prev.map(q => q.id === editDoc.id ? { ...q, ...doc } : q) : [...prev, doc])
    } else if (showForm === 'proforma') {
      setProformas(prev => editDoc ? prev.map(p => p.id === editDoc.id ? { ...p, ...doc } : p) : [...prev, doc])
    } else {
      setPurchaseOrders(prev => editDoc ? prev.map(p => p.id === editDoc.id ? { ...p, ...doc } : p) : [...prev, doc])
    }
    setShowForm(null)
    setEditDoc(null)
  }

  const updateStatus = (doc, newStatus, type) => {
    const setter = type === 'quotation' ? setQuotations : type === 'proforma' ? setProformas : setPurchaseOrders
    setter(prev => prev.map(d => d.id === doc.id ? { ...d, status: newStatus } : d))
    if (viewDoc && viewDoc.id === doc.id) setViewDoc({ ...doc, status: newStatus })
  }

  const convertQuotationToProforma = (q) => {
    const proforma = { id: Date.now(), date: today(), recipient: q.recipient, items: q.items.map(it => ({ ...it })), total: q.total, status: 'Draft', notes: q.notes, createdBy: cashier || '-', validUntil: q.validUntil || '', dueDate: '', fromQuotation: q.id }
    setProformas(prev => [...prev, proforma])
    setQuotations(prev => prev.map(d => d.id === q.id ? { ...d, status: 'Converted' } : d))
    setViewDoc(null)
    setTab(1)
  }

  const convertProformaToSale = (p) => {
    if (onConvertToSale) onConvertToSale(p)
    setProformas(prev => prev.map(d => d.id === p.id ? { ...d, status: 'Paid' } : d))
    setViewDoc(null)
  }

  const getPrintDoc = (doc, type) => ({
    ...doc,
    docType: type,
    recipientDetails: '',
  })

  const allCustomers = [...patients.map(p => ({ name: p.name, type: 'Patient' })), ...clients.map(c => ({ name: c.name, type: c.type }))]

  const renderList = (docs, type) => {
    const typeLabel = type === 'quotation' ? 'Quotation' : type === 'proforma' ? 'Proforma' : 'Purchase Order'
    const recipientLabel = type === 'purchaseOrder' ? 'Supplier' : 'Customer'
    return (
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>#</th>
              <th style={S.th}>Doc ID</th>
              <th style={S.th}>Date</th>
              <th style={S.th}>{recipientLabel}</th>
              <th style={S.th}>Items</th>
              <th style={S.th}>Total</th>
              <th style={S.th}>Status</th>
              <th style={S.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...docs].reverse().map((d, i) => {
              const sc = STATUS_COLORS[d.status] || STATUS_COLORS.Draft
              return (
                <tr key={d.id}>
                  <td style={{ ...S.td, color: 'var(--text4)' }}>{i + 1}</td>
                  <td style={{ ...S.td, fontWeight: 600, color: 'var(--accent)' }}>{d.id}</td>
                  <td style={S.td}>{d.date}</td>
                  <td style={{ ...S.td, fontWeight: 500 }}>{d.recipient}</td>
                  <td style={S.td}>{d.items.length}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{fmtUGX(d.total)}</td>
                  <td style={S.td}><span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{d.status}</span></td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <button style={{ ...S.btn('#edf2fe', '#4a6fc2'), padding: '4px 10px', fontSize: 12 }} onClick={() => setViewDoc({ ...d, _type: type })}>View</button>
                      {d.status === 'Draft' && <button style={{ ...S.btn('#f0f2f5', '#333'), padding: '4px 10px', fontSize: 12 }} onClick={() => openEdit(d, type)}><Icon d={icons.edit} size={12}/></button>}
                      <button style={{ ...S.btn('#f0f2f5', '#333'), padding: '4px 10px', fontSize: 12 }} onClick={() => printDocument(getPrintDoc(d, type))}><Icon d={icons.print} size={12}/></button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {docs.length === 0 && <tr><td style={{ ...S.td, textAlign: 'center', padding: 40 }} colSpan={8}>No {typeLabel.toLowerCase()}s yet</td></tr>}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={S.header}>Documents</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 0 && <button style={S.btn()} onClick={() => openCreate('quotation')}><Icon d={icons.plus} size={14}/> New Quotation</button>}
          {tab === 1 && <button style={S.btn()} onClick={() => openCreate('proforma')}><Icon d={icons.plus} size={14}/> New Proforma</button>}
          {tab === 2 && <button style={S.btn()} onClick={() => openCreate('purchaseOrder')}><Icon d={icons.plus} size={14}/> New Purchase Order</button>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '10px 20px', borderRadius: '8px 8px 0 0', border: '1px solid var(--bd2)', borderBottom: tab === i ? '2px solid var(--accent)' : '1px solid var(--bd2)', background: tab === i ? 'var(--nav-active-bg)' : 'transparent', color: tab === i ? 'var(--accent)' : 'var(--text3)', fontSize: 14, fontWeight: tab === i ? 700 : 500, cursor: 'pointer' }}>{t} ({(i === 0 ? quotations : i === 1 ? proformas : purchaseOrders).length})</button>
        ))}
      </div>

      {tab === 0 && renderList(quotations, 'quotation')}
      {tab === 1 && renderList(proformas, 'proforma')}
      {tab === 2 && renderList(purchaseOrders, 'purchaseOrder')}

      {/* View Document */}
      {viewDoc && (
        <div style={S.modal} onClick={() => setViewDoc(null)}>
          <div style={S.modalWide} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                  {viewDoc._type === 'quotation' ? 'Quotation' : viewDoc._type === 'proforma' ? 'Proforma Invoice' : 'Purchase Order'} #{viewDoc.id}
                </h2>
                <div style={{ fontSize: 13, color: 'var(--text4)' }}>
                  {viewDoc.date} | {viewDoc.recipient} | {viewDoc.createdBy && `By: ${viewDoc.createdBy}`}
                  {viewDoc.validUntil && ` | Valid until: ${viewDoc.validUntil}`}
                  {viewDoc.dueDate && ` | Due: ${viewDoc.dueDate}`}
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setViewDoc(null)}><Icon d={icons.x} size={20} color="var(--text4)"/></button>
            </div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>#</th>
                  <th style={S.th}>Item</th>
                  <th style={S.th}>Qty</th>
                  <th style={S.th}>{viewDoc._type === 'purchaseOrder' ? 'Cost' : 'Price'}</th>
                  <th style={S.th}>Total</th>
                </tr>
              </thead>
              <tbody>
                {viewDoc.items.map((it, i) => (
                  <tr key={i}>
                    <td style={{ ...S.td, color: 'var(--text4)' }}>{i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 500 }}>{it.name}</td>
                    <td style={S.td}>{it.qty}</td>
                    <td style={S.td}>{fmtUGX(it.price || it.cost)}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{fmtUGX((it.price || it.cost) * it.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, borderTop: '2px solid var(--accent)', paddingTop: 10 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>TOTAL: {fmtUGX(viewDoc.total)}</div>
            </div>
            {viewDoc.notes && <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg2)', borderRadius: 8, fontSize: 13, color: 'var(--text3)' }}><b>Notes:</b> {viewDoc.notes}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--bd3)' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {viewDoc.status === 'Draft' && <button style={{ ...S.btn('#5b8def', '#fff'), padding: '6px 14px' }} onClick={() => updateStatus(viewDoc, 'Sent', viewDoc._type)}><Icon d={icons.send} size={14}/> Mark as Sent</button>}
                {viewDoc._type === 'quotation' && viewDoc.status === 'Sent' && <button style={{ ...S.btn('#4caf82', '#fff'), padding: '6px 14px' }} onClick={() => updateStatus(viewDoc, 'Accepted', viewDoc._type)}><Icon d={icons.check} size={14}/> Mark Accepted</button>}
                {viewDoc._type === 'quotation' && (viewDoc.status === 'Accepted' || viewDoc.status === 'Sent') && <button style={{ ...S.btn('#e5a943', '#fff'), padding: '6px 14px' }} onClick={() => convertQuotationToProforma(viewDoc)}>Convert to Proforma</button>}
                {viewDoc._type === 'proforma' && (viewDoc.status === 'Sent' || viewDoc.status === 'Draft') && <button style={{ ...S.btn('#4caf82', '#fff'), padding: '6px 14px' }} onClick={() => convertProformaToSale(viewDoc)}>Convert to Sale</button>}
                {viewDoc._type === 'purchaseOrder' && viewDoc.status === 'Sent' && <button style={{ ...S.btn('#4caf82', '#fff'), padding: '6px 14px' }} onClick={() => updateStatus(viewDoc, 'Received', viewDoc._type)}><Icon d={icons.check} size={14}/> Mark Received</button>}
                {viewDoc.status !== 'Cancelled' && viewDoc.status !== 'Paid' && viewDoc.status !== 'Converted' && <button style={{ ...S.btn('#e05d5d', '#fff'), padding: '6px 14px' }} onClick={() => updateStatus(viewDoc, 'Cancelled', viewDoc._type)}>Cancel</button>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={S.btn('#f0f2f5', '#333')} onClick={() => printDocument(getPrintDoc(viewDoc, viewDoc._type))}><Icon d={icons.print} size={14}/> Print A4</button>
                <button style={S.btn()} onClick={() => setViewDoc(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <div style={S.modal} onClick={() => setShowForm(null)}>
          <div style={S.modalWide} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                {editDoc ? 'Edit' : 'New'} {showForm === 'quotation' ? 'Quotation' : showForm === 'proforma' ? 'Proforma Invoice' : 'Purchase Order'}
              </h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowForm(null)}><Icon d={icons.x} size={20} color="var(--text4)"/></button>
            </div>

            <div style={S.row}>
              <div style={{ flex: 2 }}>
                <label style={S.label}>{showForm === 'purchaseOrder' ? 'Supplier *' : 'Customer *'}</label>
                {showForm === 'purchaseOrder' ? (
                  <select style={{ ...S.select, width: '100%' }} value={form.recipient} onChange={e => setForm({ ...form, recipient: e.target.value })}>
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                ) : (
                  <select style={{ ...S.select, width: '100%' }} value={form.recipient} onChange={e => setForm({ ...form, recipient: e.target.value })}>
                    <option value="">Select Customer</option>
                    {patients.length > 0 && <optgroup label="Patients">
                      {patients.map(p => <option key={`p-${p.id}`} value={p.name}>{p.name}</option>)}
                    </optgroup>}
                    {clients.length > 0 && <optgroup label="Clinics / Hospitals">
                      {clients.map(c => <option key={`c-${c.id}`} value={c.name}>{c.name} ({c.type})</option>)}
                    </optgroup>}
                  </select>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Date</label>
                <input style={S.input} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}/>
              </div>
              {showForm !== 'purchaseOrder' && <div style={{ flex: 1 }}>
                <label style={S.label}>Valid Until</label>
                <input style={S.input} type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })}/>
              </div>}
              {showForm === 'proforma' && <div style={{ flex: 1 }}>
                <label style={S.label}>Due Date</label>
                <input style={S.input} type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}/>
              </div>}
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ ...S.label, marginBottom: 0 }}>Items</label>
                <button style={{ ...S.btn('#f0f2f5', '#333'), padding: '4px 12px', fontSize: 12 }} onClick={addItem}><Icon d={icons.plus} size={12}/> Add Item</button>
              </div>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Drug / Item</th>
                    <th style={{ ...S.th, width: 80 }}>Qty</th>
                    <th style={{ ...S.th, width: 130 }}>{showForm === 'purchaseOrder' ? 'Cost' : 'Price'}</th>
                    <th style={{ ...S.th, width: 120 }}>Subtotal</th>
                    <th style={{ ...S.th, width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((it, i) => (
                    <tr key={i}>
                      <td style={S.td}>
                        <div style={{ position: 'relative' }}>
                          <input style={S.input} value={it.name} onChange={e => { updateItem(i, 'name', e.target.value); setDrugSearch(e.target.value) }} placeholder="Type drug name..."/>
                          {drugSearch && it.name === drugSearch && (() => {
                            const matches = drugs.filter(d => d.name.toLowerCase().includes(drugSearch.toLowerCase())).slice(0, 6)
                            if (matches.length === 0) return null
                            return <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--dropdown-bg)', border: '1px solid var(--bd2)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.3)', zIndex: 10, maxHeight: 160, overflowY: 'auto', marginTop: 2 }}>
                              {matches.map(d => <div key={d.id} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--bd3)' }} onMouseDown={() => pickDrug(i, d)}>{d.name} <span style={{ color: 'var(--text4)' }}>- {fmtUGX(showForm === 'purchaseOrder' ? d.cost : d.price)}</span></div>)}
                            </div>
                          })()}
                        </div>
                      </td>
                      <td style={S.td}><input style={{ ...S.input, textAlign: 'center' }} type="number" min="1" value={it.qty} onChange={e => updateItem(i, 'qty', e.target.value)}/></td>
                      <td style={S.td}><input style={{ ...S.input, textAlign: 'right' }} inputMode="numeric" value={it.price ? Number(it.price).toLocaleString() : ''} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); updateItem(i, 'price', v) }} placeholder="0"/></td>
                      <td style={{ ...S.td, fontWeight: 600 }}>{fmtUGX((Number(it.price) || 0) * (Number(it.qty) || 0))}</td>
                      <td style={S.td}>{form.items.length > 1 && <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => removeItem(i)}><Icon d={icons.trash} size={14} color="#e05d5d"/></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Total: {fmtUGX(formTotal)}</div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={S.label}>Notes</label>
              <textarea style={{ ...S.input, minHeight: 50, resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Payment terms, delivery instructions..."/>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button style={{ ...S.btn('#f0f2f5', '#333'), padding: '8px 16px' }} onClick={() => setShowForm(null)}>Cancel</button>
              <button style={{ ...S.btn(), padding: '8px 16px' }} onClick={save}><Icon d={icons.check} size={14}/> {editDoc ? 'Save Changes' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
