import { useState } from 'react'
import { S, Icon, icons, exportCSV } from '../shared.jsx'

export default function Patients({ patients, setPatients }) {
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editPat, setEditPat] = useState(null)
  const [selected, setSelected] = useState(null)

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search))

  const savePat = (pat) => {
    if (pat.id) {
      setPatients(prev => prev.map(p => p.id === pat.id ? pat : p))
    } else {
      setPatients(prev => [...prev, { ...pat, id: Date.now() }])
    }
    setShowAdd(false)
    setEditPat(null)
  }

  const deletePat = (id) => {
    if (confirm('Remove this patient?')) {
      setPatients(prev => prev.filter(p => p.id !== id))
      if (selected?.id === id) setSelected(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={S.header}>Patients</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btn('#f0f2f5', '#333')} onClick={() => exportCSV('patients.csv', ['Name','Phone','Age','Gender','Allergies','Conditions'], filtered.map(p => [p.name, p.phone, p.age, p.gender, p.allergies, p.conditions]))}><Icon d={icons.download} size={14}/> Export</button>
          <button style={S.btn()} onClick={() => { setEditPat(null); setShowAdd(true) }}><Icon d={icons.plus} size={16}/> Add Patient</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...S.searchBox, marginBottom: 12 }}>
            <Icon d={icons.search} size={16} color="#9ca3af"/>
            <input style={S.searchInput} placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div style={S.card}>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Name</th><th style={S.th}>Phone</th><th style={S.th}>Age</th><th style={S.th}>Gender</th><th style={S.th}>Actions</th></tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{ background: selected?.id === p.id ? 'rgba(79,195,247,0.1)' : 'transparent', cursor: 'pointer' }} onClick={() => setSelected(p)}>
                    <td style={{ ...S.td, fontWeight: 500 }}>{p.name}</td>
                    <td style={S.td}>{p.phone}</td>
                    <td style={S.td}>{p.age}</td>
                    <td style={S.td}>{p.gender}</td>
                    <td style={S.td}>
                      <button style={{ ...S.btn('#edf2fe', '#4a6fc2'), padding: '4px 10px', marginRight: 4 }} onClick={(e) => { e.stopPropagation(); setEditPat(p); setShowAdd(true) }}>Edit</button>
                      <button style={{ ...S.btn('#fde8e8', '#c53030'), padding: '4px 10px' }} onClick={(e) => { e.stopPropagation(); deletePat(p.id) }}>Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div style={{ padding: 20, textAlign: 'center', ...S.dimText }}>No patients found</div>}
          </div>
        </div>

        {selected && (
          <div style={{ width: 300 }}>
            <div style={S.card}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(79,195,247,0.4), rgba(156,39,176,0.3))', border: '2px solid rgba(79,195,247,0.3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, margin: '0 auto 8px' }}>
                  {selected.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{selected.name}</div>
                <div style={{ fontSize: 12, ...S.dimText }}>{selected.phone}</div>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
                <div style={{ fontSize: 12, marginBottom: 8 }}><span style={S.dimText}>Age:</span> {selected.age} | {selected.gender}</div>
                <div style={{ fontSize: 12, marginBottom: 8 }}><span style={S.dimText}>Allergies:</span> <span style={{ color: selected.allergies === 'None' ? '#4caf82' : '#e8735a', fontWeight: 500 }}>{selected.allergies}</span></div>
                <div style={{ fontSize: 12 }}><span style={S.dimText}>Conditions:</span> {selected.conditions || 'None'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAdd && <PatientModal patient={editPat} onSave={savePat} onClose={() => { setShowAdd(false); setEditPat(null) }}/>}
    </div>
  )
}

function PatientModal({ patient, onSave, onClose }) {
  const [form, setForm] = useState(patient || { name: '', phone: '', age: '', gender: 'Male', allergies: 'None', conditions: '' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{patient ? 'Edit Patient' : 'Add Patient'}</h2>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><Icon d={icons.x} size={20} color="#6b7a8d"/></button>
        </div>
        <div style={S.row}><div style={{ flex: 1 }}><label style={S.label}>Full Name</label><input style={S.input} value={form.name} onChange={e => set('name', e.target.value)}/></div></div>
        <div style={S.row}>
          <div style={{ flex: 1 }}><label style={S.label}>Phone</label><input style={S.input} value={form.phone} onChange={e => set('phone', e.target.value)}/></div>
          <div style={{ flex: 1 }}><label style={S.label}>Age</label><input style={S.input} type="number" value={form.age} onChange={e => set('age', +e.target.value)}/></div>
        </div>
        <div style={S.row}>
          <div style={{ flex: 1 }}><label style={S.label}>Gender</label><select style={{ ...S.select, width: '100%' }} value={form.gender} onChange={e => set('gender', e.target.value)}><option>Male</option><option>Female</option></select></div>
          <div style={{ flex: 1 }}><label style={S.label}>Allergies</label><input style={S.input} value={form.allergies} onChange={e => set('allergies', e.target.value)}/></div>
        </div>
        <div style={S.row}><div style={{ flex: 1 }}><label style={S.label}>Conditions</label><input style={S.input} value={form.conditions} onChange={e => set('conditions', e.target.value)} placeholder="e.g. Diabetes, Hypertension"/></div></div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button style={S.btn('#f0f2f5', '#333')} onClick={onClose}>Cancel</button>
          <button style={S.btn()} onClick={() => { if (!form.name) return alert('Name required'); onSave(form) }}>{patient ? 'Update' : 'Add Patient'}</button>
        </div>
      </div>
    </div>
  )
}
