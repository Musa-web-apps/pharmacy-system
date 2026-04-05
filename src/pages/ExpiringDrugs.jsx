import { useState } from 'react'
import { S, Icon, icons, fmtUGX, today, exportCSV, printSection } from '../shared.jsx'
import { CATEGORIES } from '../data.js'

export default function ExpiringDrugs({ drugs, setDrugs }) {
  const [range, setRange] = useState(90)
  const [search, setSearch] = useState('')
  const [editDrug, setEditDrug] = useState(null)

  const todayStr = today()
  const cutoff = new Date(todayStr)
  cutoff.setDate(cutoff.getDate() + range)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const daysUntil = (exp) => {
    if (!exp) return null
    return Math.ceil((new Date(exp) - new Date(todayStr)) / 86400000)
  }

  let filtered = drugs.filter(d => d.expiry && d.expiry <= cutoffStr)
  if (search) filtered = filtered.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
  filtered.sort((a, b) => (a.expiry || '').localeCompare(b.expiry || ''))

  const expired = filtered.filter(d => daysUntil(d.expiry) <= 0)
  const within30 = filtered.filter(d => { const days = daysUntil(d.expiry); return days > 0 && days <= 30 })
  const within90 = filtered.filter(d => { const days = daysUntil(d.expiry); return days > 30 && days <= 90 })
  const beyond90 = filtered.filter(d => daysUntil(d.expiry) > 90)

  const expiryColor = (days) => {
    if (days === null) return 'rgba(255,255,255,0.4)'
    if (days <= 0) return '#e05d5d'
    if (days <= 90) return '#e5a943'
    return 'rgba(255,255,255,0.6)'
  }

  const statusBadge = (days) => {
    if (days <= 0) return { bg: 'rgba(224,93,93,0.15)', color: '#e05d5d', text: 'EXPIRED' }
    if (days <= 30) return { bg: 'rgba(229,169,67,0.15)', color: '#e5a943', text: `${days} days left` }
    if (days <= 90) return { bg: 'rgba(229,169,67,0.1)', color: '#e5a943', text: `${days} days left` }
    return { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', text: `${days} days left` }
  }

  const totalValue = filtered.reduce((s, d) => s + (d.cost || 0) * (d.qty || 0), 0)

  const csvHeaders = ['Drug Name', 'Category', 'Batch', 'Expiry Date', 'Days Left', 'Status', 'Qty in Stock', 'Cost/Unit', 'Total Value', 'Supplier']
  const csvRows = filtered.map(d => {
    const days = daysUntil(d.expiry)
    return [d.name, d.category || '-', d.batch || '-', d.expiry, days, days <= 0 ? 'EXPIRED' : 'EXPIRING', d.qty, d.cost, d.cost * d.qty, d.supplier || '-']
  })

  const saveEdit = (updated) => {
    setDrugs(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d))
    setEditDrug(null)
  }

  const deleteDrug = (id) => {
    if (!confirm('Are you sure you want to remove this drug from inventory?')) return
    setDrugs(prev => prev.filter(d => d.id !== id))
    setEditDrug(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={S.header}>Expiring Drugs</h1>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>NDA Compliance Report - Generated {todayStr}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btn('#f0f2f5', '#333')} onClick={() => exportCSV(`expiring-drugs-${todayStr}.csv`, csvHeaders, csvRows)}><Icon d={icons.download} size={14}/> Export CSV</button>
          <button style={S.btn('#f0f2f5', '#333')} onClick={() => printSection(`Expiring Drugs Report - ${todayStr}`, 'expiry-report')}><Icon d={icons.print} size={14}/> Print Report</button>
        </div>
      </div>

      <div style={S.grid}>
        <div style={S.statCard('#e05d5d')}><div style={S.statLabel}>Expired</div><div style={S.statValue}>{expired.length}</div></div>
        <div style={S.statCard('#e5a943')}><div style={S.statLabel}>Within 30 Days</div><div style={S.statValue}>{within30.length}</div></div>
        <div style={S.statCard('#e5a943')}><div style={S.statLabel}>31 - 90 Days</div><div style={S.statValue}>{within90.length}</div></div>
        <div style={S.statCard('#4fc3f7')}><div style={S.statLabel}>Total Value at Risk</div><div style={S.statValue}>{fmtUGX(totalValue)}</div></div>
      </div>

      <div style={{ ...S.card, padding: 16, marginBottom: 16 }}>
        <div style={S.row}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Expiry Window</label>
            <select style={{ ...S.select, width: '100%' }} value={range} onChange={e => setRange(+e.target.value)}>
              <option value={30}>Next 30 days</option>
              <option value={60}>Next 60 days</option>
              <option value={90}>Next 3 months</option>
              <option value={180}>Next 6 months</option>
              <option value={365}>Next 1 year</option>
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <label style={S.label}>Search Drug</label>
            <input style={S.input} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by drug name..."/>
          </div>
        </div>
      </div>

      <div style={S.card} id="expiry-report">
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>#</th>
              <th style={S.th}>Drug Name</th>
              <th style={S.th}>Category</th>
              <th style={S.th}>Batch No.</th>
              <th style={S.th}>Expiry Date</th>
              <th style={S.th}>Days Left</th>
              <th style={S.th}>Status</th>
              <th style={S.th}>Qty in Stock</th>
              <th style={S.th}>Cost/Unit</th>
              <th style={S.th}>Total Value</th>
              <th style={S.th}>Supplier</th>
              <th style={S.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => {
              const days = daysUntil(d.expiry)
              const badge = statusBadge(days)
              return (
                <tr key={d.id} style={{ background: days <= 0 ? 'rgba(224,93,93,0.04)' : 'transparent' }}>
                  <td style={{ ...S.td, color: 'rgba(255,255,255,0.4)' }}>{i + 1}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{d.name}</td>
                  <td style={S.td}>{d.category || '-'}</td>
                  <td style={S.td}>{d.batch || '-'}</td>
                  <td style={{ ...S.td, fontWeight: 500, color: expiryColor(days) }}>{d.expiry}</td>
                  <td style={{ ...S.td, fontWeight: 600, color: expiryColor(days) }}>{days}</td>
                  <td style={S.td}>
                    <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: badge.bg, color: badge.color }}>{badge.text}</span>
                  </td>
                  <td style={{ ...S.td, fontWeight: 500 }}>{d.qty}</td>
                  <td style={S.td}>{fmtUGX(d.cost || 0)}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{fmtUGX((d.cost || 0) * (d.qty || 0))}</td>
                  <td style={S.td}>{d.supplier || '-'}</td>
                  <td style={S.td}>
                    <button style={{ ...S.btn('#edf2fe', '#4a6fc2'), padding: '5px 12px' }} onClick={() => setEditDrug({ ...d })}><Icon d={icons.edit} size={14}/> Edit</button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td style={{ ...S.td, textAlign: 'center', padding: 40 }} colSpan={12}>No drugs expiring within the selected window</td></tr>
            )}
          </tbody>
        </table>

        {filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', borderTop: '2px solid rgba(255,255,255,0.08)', fontSize: 14 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Total: {filtered.length} drug(s) | Expired: {expired.length} | Expiring Soon: {within30.length + within90.length + beyond90.length}</span>
            <span style={{ fontWeight: 700 }}>Total Value at Risk: {fmtUGX(totalValue)}</span>
          </div>
        )}
      </div>

      {/* Edit Drug Modal */}
      {editDrug && <EditDrugModal drug={editDrug} onSave={saveEdit} onDelete={deleteDrug} onClose={() => setEditDrug(null)}/>}
    </div>
  )
}

function EditDrugModal({ drug, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({ ...drug })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = () => {
    if (!form.name) return alert('Drug name is required')
    onSave(form)
  }

  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalWide} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Edit Drug Details</h2>
            <div style={{ fontSize: 13, ...S.dimText }}>Correct expiry date, batch number, or other details</div>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><Icon d={icons.x} size={20} color="#6b7a8d"/></button>
        </div>

        <div style={S.row}>
          <div style={{ flex: 2 }}>
            <label style={S.label}>Drug Name</label>
            <input style={S.input} value={form.name} onChange={e => set('name', e.target.value)}/>
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Category</label>
            <select style={{ ...S.select, width: '100%' }} value={form.category || ''} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div style={S.row}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Batch No.</label>
            <input style={S.input} value={form.batch || ''} onChange={e => set('batch', e.target.value)} placeholder="Batch number"/>
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Expiry Date</label>
            <input style={S.input} type="date" value={form.expiry || ''} onChange={e => set('expiry', e.target.value)}/>
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Supplier</label>
            <input style={S.input} value={form.supplier || ''} onChange={e => set('supplier', e.target.value)}/>
          </div>
        </div>

        <div style={S.row}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Qty in Stock</label>
            <input style={S.input} type="number" min="0" value={form.qty} onChange={e => set('qty', +e.target.value)}/>
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Cost Price</label>
            <input style={S.input} type="number" min="0" value={form.cost || 0} onChange={e => set('cost', +e.target.value)}/>
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Selling Price</label>
            <input style={S.input} type="number" min="0" value={form.price || 0} onChange={e => set('price', +e.target.value)}/>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button style={{ ...S.btn('#fdeded', '#e05d5d') }} onClick={() => onDelete(form.id)}><Icon d={icons.trash} size={14}/> Remove from Inventory</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={S.btn('#f0f2f5', '#333')} onClick={onClose}>Cancel</button>
            <button style={S.btn()} onClick={save}><Icon d={icons.check} size={14}/> Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  )
}
