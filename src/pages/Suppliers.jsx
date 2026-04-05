import { useState } from 'react'
import { S, Icon, icons, fmtUGX, exportCSV, printSection } from '../shared.jsx'

export default function SuppliersPage({ suppliers, setSuppliers, purchases }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editSup, setEditSup] = useState(null)
  const [selected, setSelected] = useState(null)

  const saveSup = (sup) => {
    if (sup.id) {
      setSuppliers(prev => prev.map(s => s.id === sup.id ? sup : s))
    } else {
      setSuppliers(prev => [...prev, { ...sup, id: Date.now() }])
    }
    setShowAdd(false)
    setEditSup(null)
  }

  const deleteSup = (id) => {
    if (confirm('Remove this supplier?')) {
      setSuppliers(prev => prev.filter(s => s.id !== id))
      if (selected?.id === id) setSelected(null)
    }
  }

  const getSupPurchases = (name) => purchases.filter(p => p.supplier === name)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={S.header}>Suppliers</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btn('#f0f2f5', '#333')} onClick={() => exportCSV('suppliers.csv', ['Name','Contact','Phone','Email','Address','Terms','Rating'], suppliers.map(s => [s.name, s.contact, s.phone, s.email, s.address, s.terms, s.rating]))}><Icon d={icons.download} size={14}/> Export</button>
          <button style={S.btn()} onClick={() => { setEditSup(null); setShowAdd(true) }}><Icon d={icons.plus} size={16}/> Add Supplier</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={S.card}>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Name</th><th style={S.th}>Contact</th><th style={S.th}>Phone</th><th style={S.th}>Terms</th><th style={S.th}>Orders</th><th style={S.th}>Total</th><th style={S.th}>Actions</th></tr></thead>
              <tbody>
                {suppliers.map(s => {
                  const pos = getSupPurchases(s.name)
                  const total = pos.reduce((sum, p) => sum + p.total, 0)
                  return (
                    <tr key={s.id} style={{ background: selected?.id === s.id ? 'rgba(79,195,247,0.1)' : 'transparent', cursor: 'pointer' }} onClick={() => setSelected(s)}>
                      <td style={{ ...S.td, fontWeight: 600 }}>{s.name}</td>
                      <td style={S.td}>{s.contact}</td>
                      <td style={S.td}>{s.phone}</td>
                      <td style={S.td}><span style={S.badge('#edf2fe', '#4a6fc2')}>{s.terms}</span></td>
                      <td style={S.td}>{pos.length}</td>
                      <td style={{ ...S.td, fontWeight: 600, color: '#4fc3f7' }}>{fmtUGX(total)}</td>
                      <td style={S.td}>
                        <button style={{ ...S.btn('#edf2fe', '#4a6fc2'), padding: '4px 10px', marginRight: 4 }} onClick={(e) => { e.stopPropagation(); setEditSup(s); setShowAdd(true) }}>Edit</button>
                        <button style={{ ...S.btn('#fde8e8', '#c53030'), padding: '4px 10px' }} onClick={(e) => { e.stopPropagation(); deleteSup(s.id) }}>Del</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div style={{ width: 340 }}>
            <div style={S.card}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(79,195,247,0.4), rgba(76,175,130,0.3))', border: '2px solid rgba(79,195,247,0.3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, margin: '0 auto 8px' }}>
                  {selected.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 600 }}>{selected.name}</div>
                <div style={{ textAlign: 'center', fontSize: 12, ...S.dimText }}>{selected.terms}</div>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, fontSize: 12 }}>
                <div style={{ marginBottom: 6 }}><span style={S.dimText}>Contact:</span> {selected.contact}</div>
                <div style={{ marginBottom: 6 }}><span style={S.dimText}>Phone:</span> {selected.phone}</div>
                <div style={{ marginBottom: 6 }}><span style={S.dimText}>Email:</span> {selected.email}</div>
                <div style={{ marginBottom: 6 }}><span style={S.dimText}>Address:</span> {selected.address}</div>
                {selected.rating && <div style={{ marginBottom: 6 }}><span style={S.dimText}>Rating:</span> <span style={{ color: '#e5a943' }}>{'*'.repeat(Math.round(selected.rating))}</span> ({selected.rating})</div>}
                {selected.notes && <div><span style={S.dimText}>Notes:</span> {selected.notes}</div>}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, marginTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Recent Orders</div>
                {getSupPurchases(selected.name).slice(-5).reverse().map(po => (
                  <div key={po.id} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <div><span style={{ fontWeight: 500 }}>{po.poNumber}</span> <span style={S.dimText}>{po.date}</span></div>
                    <span style={{ fontWeight: 600 }}>{fmtUGX(po.total)}</span>
                  </div>
                ))}
                {getSupPurchases(selected.name).length === 0 && <div style={S.mutedText}>No orders yet</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {showAdd && <SupplierModal supplier={editSup} onSave={saveSup} onClose={() => { setShowAdd(false); setEditSup(null) }}/>}
    </div>
  )
}

function SupplierModal({ supplier, onSave, onClose }) {
  const [form, setForm] = useState(supplier || { name: '', contact: '', phone: '', email: '', address: '', terms: 'Net 30', rating: 0, notes: '' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{supplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><Icon d={icons.x} size={20} color="#6b7a8d"/></button>
        </div>
        <div style={S.row}><div style={{ flex: 1 }}><label style={S.label}>Company Name</label><input style={S.input} value={form.name} onChange={e => set('name', e.target.value)}/></div></div>
        <div style={S.row}>
          <div style={{ flex: 1 }}><label style={S.label}>Contact Person</label><input style={S.input} value={form.contact} onChange={e => set('contact', e.target.value)}/></div>
          <div style={{ flex: 1 }}><label style={S.label}>Phone</label><input style={S.input} value={form.phone} onChange={e => set('phone', e.target.value)}/></div>
        </div>
        <div style={S.row}>
          <div style={{ flex: 1 }}><label style={S.label}>Email</label><input style={S.input} value={form.email} onChange={e => set('email', e.target.value)}/></div>
          <div style={{ flex: 1 }}><label style={S.label}>Payment Terms</label>
            <select style={{ ...S.select, width: '100%' }} value={form.terms} onChange={e => set('terms', e.target.value)}>
              <option>Cash on Delivery</option><option>Net 7</option><option>Net 14</option><option>Net 30</option><option>Net 60</option>
            </select>
          </div>
        </div>
        <div style={S.row}><div style={{ flex: 1 }}><label style={S.label}>Address</label><input style={S.input} value={form.address} onChange={e => set('address', e.target.value)}/></div></div>
        <div style={S.row}><div style={{ flex: 1 }}><label style={S.label}>Notes</label><input style={S.input} value={form.notes} onChange={e => set('notes', e.target.value)}/></div></div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button style={S.btn('#f0f2f5', '#333')} onClick={onClose}>Cancel</button>
          <button style={S.btn()} onClick={() => { if (!form.name) return alert('Name required'); onSave(form) }}>{supplier ? 'Update' : 'Add Supplier'}</button>
        </div>
      </div>
    </div>
  )
}
