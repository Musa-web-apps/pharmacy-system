import { useState } from 'react'
import { S, Icon, icons, fmtUGX, exportCSV, printSection } from '../shared.jsx'
import { CATEGORIES, SUPPLIERS } from '../data.js'

export default function Inventory({ drugs, setDrugs }) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [editDrug, setEditDrug] = useState(null)
  const [showImport, setShowImport] = useState(false)

  const filtered = drugs.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.batch.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'All' || d.category === catFilter
    return matchSearch && matchCat
  })

  const saveDrug = (drug) => {
    if (drug.id) {
      setDrugs(prev => prev.map(d => d.id === drug.id ? drug : d))
    } else {
      setDrugs(prev => [...prev, { ...drug, id: Date.now() }])
    }
    setShowAdd(false)
    setEditDrug(null)
  }

  const deleteDrug = (id) => {
    if (confirm('Remove this item from inventory?')) {
      setDrugs(prev => prev.filter(d => d.id !== id))
    }
  }

  const doExport = () => {
    exportCSV('inventory_export.csv',
      ['Name', 'Category', 'Stock', 'Reorder', 'Cost', 'Price', 'Batch', 'Expiry', 'Supplier'],
      filtered.map(d => [d.name, d.category, d.qty, d.reorder, d.cost, d.price, d.batch, d.expiry, d.supplier])
    )
  }

  const doImport = (text) => {
    const lines = text.trim().split('\n').slice(1) // skip header
    const newDrugs = []
    lines.forEach(line => {
      const [name, category, qty, reorder, cost, price, batch, expiry, supplier] = line.split(',').map(s => s.replace(/^"|"$/g, '').trim())
      if (!name) return
      const existing = drugs.find(d => d.name.toLowerCase() === name.toLowerCase())
      if (existing) return // skip duplicates
      newDrugs.push({ id: Date.now() + Math.random(), name, category: category || 'Other', qty: +qty || 0, reorder: +reorder || 20, cost: +cost || 0, price: +price || 0, batch: batch || '', expiry: expiry || '', supplier: supplier || '' })
    })
    if (newDrugs.length > 0) {
      setDrugs(prev => [...prev, ...newDrugs])
      alert(`Imported ${newDrugs.length} new drug(s)`)
    } else {
      alert('No new drugs to import (all already exist or file empty)')
    }
    setShowImport(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={S.header}>Inventory</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btn('#f0f2f5', '#333')} onClick={() => setShowImport(true)}><Icon d={icons.upload} size={14}/> Import CSV</button>
          <button style={S.btn('#f0f2f5', '#333')} onClick={doExport}><Icon d={icons.download} size={14}/> Export</button>
          <button style={S.btn('#f0f2f5', '#333')} onClick={() => printSection('Inventory Report', 'inv-table')}><Icon d={icons.print} size={14}/> Print</button>
          <button style={S.btn()} onClick={() => { setEditDrug(null); setShowAdd(true) }}><Icon d={icons.plus} size={16}/> Add Drug</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={S.searchBox}>
          <Icon d={icons.search} size={16} color="#9ca3af"/>
          <input style={S.searchInput} placeholder="Search drugs or batch..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select style={S.select} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option>All</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div style={S.card} id="inv-table">
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Drug Name</th><th style={S.th}>Category</th><th style={S.th}>Stock</th>
              <th style={S.th}>Cost</th><th style={S.th}>Price</th><th style={S.th}>Batch</th>
              <th style={S.th}>Expiry</th><th style={S.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => {
              const low = d.qty <= d.reorder
              const exp = new Date(d.expiry) < new Date()
              return (
                <tr key={d.id} style={{ background: exp ? 'rgba(224,93,93,0.08)' : low ? 'rgba(229,169,67,0.08)' : 'transparent' }}>
                  <td style={{ ...S.td, fontWeight: 500 }}>{d.name}</td>
                  <td style={S.td}><span style={S.badge('#edf2fe', '#4a6fc2')}>{d.category}</span></td>
                  <td style={{ ...S.td, fontWeight: 600, color: d.qty === 0 ? '#e05d5d' : low ? '#e5a943' : 'rgba(255,255,255,0.8)' }}>{d.qty}</td>
                  <td style={S.td}>{fmtUGX(d.cost)}</td>
                  <td style={S.td}>{fmtUGX(d.price)}</td>
                  <td style={S.td}>{d.batch}</td>
                  <td style={S.td}>
                    <span style={S.badge(exp ? '#fde8e8' : '#e8f6f5', exp ? '#c53030' : '#1e8c85')}>{d.expiry}</span>
                  </td>
                  <td style={S.td}>
                    <button style={{ ...S.btn('#edf2fe', '#4a6fc2'), padding: '4px 10px', marginRight: 4 }} onClick={() => { setEditDrug(d); setShowAdd(true) }}>Edit</button>
                    <button style={{ ...S.btn('#fde8e8', '#c53030'), padding: '4px 10px' }} onClick={() => deleteDrug(d.id)}>Del</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 20, textAlign: 'center', ...S.dimText }}>No drugs found</div>}
      </div>

      {showAdd && <DrugModal drug={editDrug} onSave={saveDrug} onClose={() => { setShowAdd(false); setEditDrug(null) }}/>}
      {showImport && <ImportModal onImport={doImport} onClose={() => setShowImport(false)}/>}
    </div>
  )
}

function DrugModal({ drug, onSave, onClose }) {
  const [form, setForm] = useState(drug || { name: '', category: 'Antibiotics', qty: 0, reorder: 20, price: 0, cost: 0, expiry: '', batch: '', supplier: SUPPLIERS[0] })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{drug ? 'Edit Drug' : 'Add New Drug'}</h2>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><Icon d={icons.x} size={20} color="#6b7a8d"/></button>
        </div>
        <div style={S.row}><div style={{ flex: 1 }}><label style={S.label}>Drug Name</label><input style={S.input} value={form.name} onChange={e => set('name', e.target.value)}/></div></div>
        <div style={S.row}>
          <div style={{ flex: 1 }}><label style={S.label}>Category</label>
            <select style={{ ...S.select, width: '100%' }} value={form.category} onChange={e => set('category', e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
          </div>
          <div style={{ flex: 1 }}><label style={S.label}>Supplier</label>
            <select style={{ ...S.select, width: '100%' }} value={form.supplier} onChange={e => set('supplier', e.target.value)}>{SUPPLIERS.map(s => <option key={s}>{s}</option>)}</select>
          </div>
        </div>
        <div style={S.row}>
          <div style={{ flex: 1 }}><label style={S.label}>Quantity</label><input style={S.input} type="number" value={form.qty} onChange={e => set('qty', +e.target.value)}/></div>
          <div style={{ flex: 1 }}><label style={S.label}>Reorder Level</label><input style={S.input} type="number" value={form.reorder} onChange={e => set('reorder', +e.target.value)}/></div>
        </div>
        <div style={S.row}>
          <div style={{ flex: 1 }}><label style={S.label}>Cost Price</label><input style={S.input} type="number" value={form.cost} onChange={e => set('cost', +e.target.value)}/></div>
          <div style={{ flex: 1 }}><label style={S.label}>Selling Price</label><input style={S.input} type="number" value={form.price} onChange={e => set('price', +e.target.value)}/></div>
        </div>
        <div style={S.row}>
          <div style={{ flex: 1 }}><label style={S.label}>Batch No.</label><input style={S.input} value={form.batch} onChange={e => set('batch', e.target.value)}/></div>
          <div style={{ flex: 1 }}><label style={S.label}>Expiry Date</label><input style={S.input} type="date" value={form.expiry} onChange={e => set('expiry', e.target.value)}/></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button style={S.btn('#f0f2f5', '#333')} onClick={onClose}>Cancel</button>
          <button style={S.btn()} onClick={() => { if (!form.name) return alert('Drug name required'); onSave(form) }}>{drug ? 'Update' : 'Add Drug'}</button>
        </div>
      </div>
    </div>
  )
}

function ImportModal({ onImport, onClose }) {
  const [text, setText] = useState('')

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setText(ev.target.result)
    reader.readAsText(file)
  }

  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Import Stock from CSV</h2>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><Icon d={icons.x} size={20} color="#6b7a8d"/></button>
        </div>
        <div style={{ fontSize: 12, ...S.dimText, marginBottom: 12 }}>
          CSV format: Name, Category, Qty, Reorder, Cost, Price, Batch, Expiry, Supplier<br/>
          First row is treated as header and skipped. Existing drugs (by name) are skipped.
        </div>
        <input type="file" accept=".csv,.txt" onChange={handleFile} style={{ marginBottom: 12 }}/>
        <textarea style={{ ...S.input, height: 120, fontFamily: 'monospace', fontSize: 11 }} value={text} onChange={e => setText(e.target.value)} placeholder='Name,Category,Qty,Reorder,Cost,Price,Batch,Expiry,Supplier&#10;Aspirin 300mg,Pain Relief,100,20,300,600,ASP-001,2027-12-01,MedSource Ltd'/>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button style={S.btn('#f0f2f5', '#333')} onClick={onClose}>Cancel</button>
          <button style={S.btn()} onClick={() => { if (!text.trim()) return alert('Paste or upload CSV data'); onImport(text) }}>Import</button>
        </div>
      </div>
    </div>
  )
}
