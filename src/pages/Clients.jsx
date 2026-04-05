import { useState } from 'react'
import { S, Icon, icons, fmtUGX, exportCSV, printSection } from '../shared.jsx'

const CLIENT_TYPES = ['Hospital', 'Clinic', 'Health Center', 'Pharmacy', 'NGO', 'Other']

export default function Clients({ clients, setClients, sales }) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [viewClient, setViewClient] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'Clinic', contact: '', phone: '', email: '', address: '', creditLimit: '', notes: '' })

  let filtered = [...clients]
  if (filterType) filtered = filtered.filter(c => c.type === filterType)
  if (search) filtered = filtered.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.contact.toLowerCase().includes(search.toLowerCase()))

  // Credit stats per client
  const getClientCredit = (name) => {
    const creditSales = sales.filter(s => s.payMethod === 'Credit' && s.customer === name)
    const totalCredit = creditSales.reduce((s, x) => s + (x.creditAmount || 0), 0)
    const totalPaid = creditSales.reduce((s, x) => s + (x.creditPaid || 0), 0)
    return { creditSales: creditSales.length, totalCredit, totalPaid, outstanding: totalCredit - totalPaid }
  }

  const openAdd = () => {
    setForm({ name: '', type: 'Clinic', contact: '', phone: '', email: '', address: '', creditLimit: '', notes: '' })
    setEditClient(null)
    setShowForm(true)
  }

  const openEdit = (c) => {
    setForm({ name: c.name, type: c.type, contact: c.contact || '', phone: c.phone || '', email: c.email || '', address: c.address || '', creditLimit: c.creditLimit ? String(c.creditLimit) : '', notes: c.notes || '' })
    setEditClient(c)
    setShowForm(true)
  }

  const save = () => {
    if (!form.name.trim()) return alert('Client name is required')
    if (!form.type) return alert('Client type is required')
    if (!form.phone.trim()) return alert('Phone number is required')
    const data = { ...form, creditLimit: Number(form.creditLimit) || 0 }
    if (editClient) {
      setClients(prev => prev.map(c => c.id === editClient.id ? { ...c, ...data } : c))
    } else {
      setClients(prev => [...prev, { id: Date.now(), ...data }])
    }
    setShowForm(false)
    setEditClient(null)
  }

  const remove = (id) => {
    if (!confirm('Delete this client?')) return
    setClients(prev => prev.filter(c => c.id !== id))
    setShowForm(false)
    setEditClient(null)
  }

  const totalClients = clients.length
  const hospitals = clients.filter(c => c.type === 'Hospital').length
  const clinics = clients.filter(c => c.type === 'Clinic').length
  const totalCreditLimit = clients.reduce((s, c) => s + (c.creditLimit || 0), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={S.header}>Clients (Clinics / Hospitals)</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btn('#f0f2f5', '#333')} onClick={() => exportCSV('clients.csv', ['Name','Type','Contact','Phone','Email','Address','Credit Limit','Notes'], clients.map(c => [c.name, c.type, c.contact, c.phone, c.email, c.address, c.creditLimit || 0, c.notes]))}><Icon d={icons.download} size={14}/> Export</button>
          <button style={S.btn('#f0f2f5', '#333')} onClick={() => printSection('Clients Report', 'clients-table')}><Icon d={icons.print} size={14}/> Print</button>
          <button style={S.btn()} onClick={openAdd}><Icon d={icons.plus} size={14}/> Register Client</button>
        </div>
      </div>

      <div style={S.grid}>
        <div style={S.statCard('#4fc3f7')}><div style={S.statLabel}>Total Clients</div><div style={S.statValue}>{totalClients}</div></div>
        <div style={S.statCard('#e05d5d')}><div style={S.statLabel}>Hospitals</div><div style={S.statValue}>{hospitals}</div></div>
        <div style={S.statCard('#4caf82')}><div style={S.statLabel}>Clinics</div><div style={S.statValue}>{clinics}</div></div>
        <div style={S.statCard('#e5a943')}><div style={S.statLabel}>Total Credit Limit</div><div style={S.statValue}>{fmtUGX(totalCreditLimit)}</div></div>
      </div>

      <div style={{ ...S.card, padding: 16, marginBottom: 16 }}>
        <div style={S.row}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Type</label>
            <select style={S.select} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <label style={S.label}>Search</label>
            <input style={S.input} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or contact person..."/>
          </div>
          {(filterType || search) && <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button style={{ ...S.btn('#f0f2f5', '#333'), padding: '8px 14px' }} onClick={() => { setFilterType(''); setSearch('') }}>Clear</button>
          </div>}
        </div>
      </div>

      {!viewClient ? (
        <div style={S.card} id="clients-table">
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                <th style={S.th}>Name</th>
                <th style={S.th}>Type</th>
                <th style={S.th}>Contact Person</th>
                <th style={S.th}>Phone</th>
                <th style={S.th}>Credit Limit</th>
                <th style={S.th}>Outstanding</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const cr = getClientCredit(c.name)
                return (
                  <tr key={c.id}>
                    <td style={{ ...S.td, color: 'var(--text4)' }}>{i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{c.name}</td>
                    <td style={S.td}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.type === 'Hospital' ? 'rgba(224,93,93,0.15)' : c.type === 'Clinic' ? 'rgba(76,175,130,0.15)' : c.type === 'Pharmacy' ? 'rgba(91,141,239,0.15)' : 'rgba(229,169,67,0.15)', color: c.type === 'Hospital' ? '#e05d5d' : c.type === 'Clinic' ? '#4caf82' : c.type === 'Pharmacy' ? '#5b8def' : '#e5a943' }}>{c.type}</span>
                    </td>
                    <td style={S.td}>{c.contact}</td>
                    <td style={S.td}>{c.phone}</td>
                    <td style={S.td}>{c.creditLimit ? fmtUGX(c.creditLimit) : '-'}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: cr.outstanding > 0 ? '#e5a943' : 'var(--text4)' }}>{cr.outstanding > 0 ? fmtUGX(cr.outstanding) : '-'}</td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ ...S.btn('#edf2fe', '#4a6fc2'), padding: '5px 12px' }} onClick={() => setViewClient(c)}>View</button>
                        <button style={{ ...S.btn('#f0f2f5', '#333'), padding: '5px 12px' }} onClick={() => openEdit(c)}><Icon d={icons.edit} size={13}/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && <tr><td style={{ ...S.td, textAlign: 'center', padding: 40 }} colSpan={8}>No clients found</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <button style={{ ...S.btn('#f0f2f5', '#333'), marginBottom: 16 }} onClick={() => setViewClient(null)}><Icon d={icons.returnIcon} size={14}/> Back to All Clients</button>
          {(() => {
            const c = viewClient
            const cr = getClientCredit(c.name)
            const creditSales = sales.filter(s => s.payMethod === 'Credit' && s.customer === c.name)
            return (
              <div style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700 }}>{c.name}</h2>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, marginTop: 4, background: c.type === 'Hospital' ? 'rgba(224,93,93,0.15)' : c.type === 'Clinic' ? 'rgba(76,175,130,0.15)' : 'rgba(229,169,67,0.15)', color: c.type === 'Hospital' ? '#e05d5d' : c.type === 'Clinic' ? '#4caf82' : '#e5a943' }}>{c.type}</span>
                  </div>
                  <button style={S.btn('#f0f2f5', '#333')} onClick={() => openEdit(c)}><Icon d={icons.edit} size={14}/> Edit</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text4)', marginBottom: 2 }}>Contact Person</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{c.contact || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text4)', marginBottom: 2 }}>Phone</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{c.phone || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text4)', marginBottom: 2 }}>Email</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{c.email || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text4)', marginBottom: 2 }}>Address</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{c.address || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text4)', marginBottom: 2 }}>Credit Limit</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{c.creditLimit ? fmtUGX(c.creditLimit) : 'Not set'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text4)', marginBottom: 2 }}>Notes</div>
                    <div style={{ fontSize: 14 }}>{c.notes || '-'}</div>
                  </div>
                </div>

                <div style={S.grid}>
                  <div style={S.statCard('#4fc3f7')}><div style={S.statLabel}>Credit Sales</div><div style={S.statValue}>{cr.creditSales}</div></div>
                  <div style={S.statCard('#e5a943')}><div style={S.statLabel}>Total Credit</div><div style={S.statValue}>{fmtUGX(cr.totalCredit)}</div></div>
                  <div style={S.statCard('#4caf82')}><div style={S.statLabel}>Repaid</div><div style={S.statValue}>{fmtUGX(cr.totalPaid)}</div></div>
                  <div style={S.statCard(cr.outstanding > 0 ? '#e05d5d' : '#4caf82')}><div style={S.statLabel}>Outstanding</div><div style={S.statValue}>{fmtUGX(cr.outstanding)}</div></div>
                </div>

                {creditSales.length > 0 && <>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, marginTop: 10 }}>Credit Sale History</h3>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Receipt #</th>
                        <th style={S.th}>Date</th>
                        <th style={S.th}>Items</th>
                        <th style={S.th}>Total</th>
                        <th style={S.th}>Credit</th>
                        <th style={S.th}>Repaid</th>
                        <th style={S.th}>Outstanding</th>
                        <th style={S.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditSales.map(s => {
                        const out = (s.creditAmount || 0) - (s.creditPaid || 0)
                        return (
                          <tr key={s.id}>
                            <td style={{ ...S.td, fontWeight: 600, color: 'var(--accent)' }}>{s.id}</td>
                            <td style={S.td}>{s.date}</td>
                            <td style={S.td}>{s.items.map(it => it.name).join(', ')}</td>
                            <td style={S.td}>{fmtUGX(s.total)}</td>
                            <td style={S.td}>{fmtUGX(s.creditAmount || 0)}</td>
                            <td style={{ ...S.td, color: '#4caf82' }}>{fmtUGX(s.creditPaid || 0)}</td>
                            <td style={{ ...S.td, fontWeight: 700, color: out > 0 ? '#e5a943' : '#4caf82' }}>{fmtUGX(out)}</td>
                            <td style={S.td}>
                              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: out > 0 ? 'rgba(229,169,67,0.15)' : 'rgba(76,175,130,0.15)', color: out > 0 ? '#e5a943' : '#4caf82' }}>{out > 0 ? 'Owing' : 'Paid'}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </>}
              </div>
            )
          })()}
        </div>
      )}

      {/* Add/Edit Client Modal */}
      {showForm && (
        <div style={S.modal} onClick={() => setShowForm(false)}>
          <div style={{ ...S.modalBox, width: 540 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editClient ? 'Edit Client' : 'Register New Client'}</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowForm(false)}><Icon d={icons.x} size={20} color="var(--text4)"/></button>
            </div>
            <div style={S.row}>
              <div style={{ flex: 2 }}>
                <label style={S.label}>Client Name *</label>
                <input style={S.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mulago Hospital"/>
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Type *</label>
                <select style={{ ...S.select, width: '100%' }} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={S.row}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Contact Person</label>
                <input style={S.input} value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="e.g. Dr. Okello"/>
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Phone *</label>
                <input style={S.input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 0772100200"/>
              </div>
            </div>
            <div style={S.row}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Email</label>
                <input style={S.input} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="e.g. orders@hospital.ug"/>
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Credit Limit</label>
                <input style={S.input} inputMode="numeric" value={form.creditLimit ? Number(form.creditLimit).toLocaleString() : ''} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setForm({ ...form, creditLimit: v }) }} placeholder="0"/>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Address</label>
              <input style={S.input} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="e.g. Plot 42, Kampala"/>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Notes</label>
              <textarea style={{ ...S.input, minHeight: 60, resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Payment terms, special arrangements..."/>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {editClient && <button style={{ ...S.btn('#e05d5d', '#fff'), padding: '8px 16px' }} onClick={() => remove(editClient.id)}><Icon d={icons.trash} size={14}/> Delete</button>}
              <div style={{ flex: 1 }}/>
              <button style={{ ...S.btn('#f0f2f5', '#333'), padding: '8px 16px' }} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={{ ...S.btn(), padding: '8px 16px' }} onClick={save}><Icon d={icons.check} size={14}/> {editClient ? 'Save Changes' : 'Register Client'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
