import { useState } from 'react'
import { S, Icon, icons, fmtUGX, today, exportCSV, printSection } from '../shared.jsx'

export default function StockVerification({ drugs, setDrugs, verifications, setVerifications }) {
  const [showNew, setShowNew] = useState(false)
  const [viewVer, setViewVer] = useState(null)

  const exportVer = (ver) => {
    exportCSV(`stock_verification_${ver.date}.csv`,
      ['Drug', 'System Qty', 'Physical Qty', 'Variance', 'Reason'],
      ver.items.map(it => [it.name, it.systemQty, it.physicalQty, it.variance, it.reason])
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={S.header}>Stock Verification</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btn('#f0f2f5', '#333')} onClick={() => printSection('Stock Verification History', 'ver-table')}><Icon d={icons.print} size={14}/> Print</button>
          <button style={S.btn()} onClick={() => setShowNew(true)}><Icon d={icons.plus} size={16}/> New Verification</button>
        </div>
      </div>

      <div style={S.grid}>
        <div style={S.statCard('#4fc3f7')}><div style={S.statLabel}>Total Verifications</div><div style={S.statValue}>{verifications.length}</div></div>
        <div style={S.statCard('#4caf82')}><div style={S.statLabel}>Last Verified</div><div style={S.statValue}>{verifications.length > 0 ? verifications[verifications.length - 1].date : '-'}</div></div>
        <div style={S.statCard('#e5a943')}><div style={S.statLabel}>Total Discrepancies</div><div style={S.statValue}>{verifications.reduce((s, v) => s + v.items.filter(it => it.variance !== 0).length, 0)}</div></div>
      </div>

      <div style={S.card} id="ver-table">
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Verification History</h3>
        <table style={S.table}>
          <thead><tr><th style={S.th}>Date</th><th style={S.th}>Verified By</th><th style={S.th}>Items Checked</th><th style={S.th}>Discrepancies</th><th style={S.th}>Status</th><th style={S.th}>Actions</th></tr></thead>
          <tbody>
            {[...verifications].reverse().map(v => {
              const disc = v.items.filter(it => it.variance !== 0).length
              return (
                <tr key={v.id}>
                  <td style={{ ...S.td, fontWeight: 500 }}>{v.date}</td>
                  <td style={S.td}>{v.verifiedBy}</td>
                  <td style={S.td}>{v.items.length}</td>
                  <td style={{ ...S.td, color: disc > 0 ? '#e5a943' : '#4caf82', fontWeight: 600 }}>{disc > 0 ? `${disc} found` : 'None'}</td>
                  <td style={S.td}><span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(76,175,130,0.15)', color: '#4caf82' }}>{v.status}</span></td>
                  <td style={S.td}>
                    <button style={{ ...S.btn('#edf2fe', '#4a6fc2'), padding: '4px 10px', marginRight: 4 }} onClick={() => setViewVer(v)}>View</button>
                    <button style={{ ...S.btn('#f0f2f5', '#333'), padding: '4px 10px' }} onClick={() => exportVer(v)}><Icon d={icons.download} size={12}/></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {verifications.length === 0 && <div style={{ padding: 20, textAlign: 'center', ...S.mutedText }}>No verifications yet</div>}
      </div>

      {showNew && <NewVerificationModal drugs={drugs} setDrugs={setDrugs} onSave={(v) => { setVerifications(prev => [...prev, v]); setShowNew(false) }} onClose={() => setShowNew(false)}/>}

      {viewVer && (
        <div style={S.modal} onClick={() => setViewVer(null)}>
          <div style={S.modalWide} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Verification: {viewVer.date}</h2>
                <div style={{ fontSize: 12, ...S.dimText }}>By {viewVer.verifiedBy} | {viewVer.items.length} items checked</div>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setViewVer(null)}><Icon d={icons.x} size={20} color="#6b7a8d"/></button>
            </div>
            <div id="ver-detail">
              <table style={S.table}>
                <thead><tr><th style={S.th}>Drug</th><th style={S.th}>System Qty</th><th style={S.th}>Physical Qty</th><th style={S.th}>Variance</th><th style={S.th}>Reason</th></tr></thead>
                <tbody>{viewVer.items.map((it, i) => (
                  <tr key={i} style={{ background: it.variance !== 0 ? 'rgba(229,169,67,0.06)' : 'transparent' }}>
                    <td style={{ ...S.td, fontWeight: 500 }}>{it.name}</td>
                    <td style={S.td}>{it.systemQty}</td>
                    <td style={S.td}>{it.physicalQty}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: it.variance === 0 ? '#4caf82' : it.variance < 0 ? '#e05d5d' : '#e5a943' }}>{it.variance === 0 ? 'OK' : it.variance > 0 ? `+${it.variance}` : it.variance}</td>
                    <td style={S.td}>{it.reason || '-'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button style={S.btn('#f0f2f5', '#333')} onClick={() => { exportVer(viewVer) }}><Icon d={icons.download} size={14}/> Export CSV</button>
              <button style={S.btn('#f0f2f5', '#333')} onClick={() => printSection(`Verification ${viewVer.date}`, 'ver-detail')}><Icon d={icons.print} size={14}/> Print</button>
              <button style={S.btn()} onClick={() => setViewVer(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NewVerificationModal({ drugs, setDrugs, onSave, onClose }) {
  const [items, setItems] = useState(drugs.map(d => ({ drugId: d.id, name: d.name, systemQty: d.qty, physicalQty: d.qty, variance: 0, reason: '' })))
  const [verifiedBy, setVerifiedBy] = useState('Admin')

  const updatePhysical = (idx, val) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it
      const physicalQty = +val
      return { ...it, physicalQty, variance: physicalQty - it.systemQty }
    }))
  }

  const updateReason = (idx, val) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, reason: val } : it))
  }

  const save = () => {
    const ver = {
      id: Date.now(),
      date: today(),
      verifiedBy,
      status: 'completed',
      items: items.map(it => ({ ...it })),
    }
    // Adjust inventory to match physical count
    const adjustments = items.filter(it => it.variance !== 0)
    if (adjustments.length > 0) {
      setDrugs(prev => prev.map(d => {
        const adj = adjustments.find(a => a.drugId === d.id)
        return adj ? { ...d, qty: adj.physicalQty } : d
      }))
    }
    onSave(ver)
  }

  const discrepancies = items.filter(it => it.variance !== 0).length

  return (
    <div style={S.modal} onClick={onClose}>
      <div style={{ ...S.modalWide, width: 800, maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>New Stock Verification</h2>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={onClose}><Icon d={icons.x} size={20} color="#6b7a8d"/></button>
        </div>

        <div style={S.row}>
          <div style={{ flex: 1 }}><label style={S.label}>Verified By</label><input style={S.input} value={verifiedBy} onChange={e => setVerifiedBy(e.target.value)}/></div>
          <div style={{ flex: 1 }}><label style={S.label}>Date</label><input style={S.input} type="date" value={today()} disabled/></div>
        </div>

        <div style={{ fontSize: 12, ...S.dimText, marginBottom: 8 }}>Enter the physical count for each drug. Variances are calculated automatically.</div>

        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Drug</th><th style={S.th}>System Qty</th><th style={S.th}>Physical Qty</th><th style={S.th}>Variance</th><th style={S.th}>Reason</th></tr></thead>
            <tbody>{items.map((it, i) => (
              <tr key={i} style={{ background: it.variance !== 0 ? 'rgba(229,169,67,0.06)' : 'transparent' }}>
                <td style={{ ...S.td, fontWeight: 500 }}>{it.name}</td>
                <td style={S.td}>{it.systemQty}</td>
                <td style={S.td}><input style={{ ...S.input, width: 80 }} type="number" min="0" value={it.physicalQty} onChange={e => updatePhysical(i, e.target.value)}/></td>
                <td style={{ ...S.td, fontWeight: 600, color: it.variance === 0 ? '#4caf82' : it.variance < 0 ? '#e05d5d' : '#e5a943' }}>{it.variance === 0 ? 'OK' : it.variance > 0 ? `+${it.variance}` : it.variance}</td>
                <td style={S.td}>{it.variance !== 0 && <input style={{ ...S.input, width: 140 }} value={it.reason} onChange={e => updateReason(i, e.target.value)} placeholder="Reason..."/>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '2px solid rgba(79,195,247,0.3)' }}>
          <div style={{ fontSize: 13 }}>
            {discrepancies > 0
              ? <span style={{ color: '#e5a943', fontWeight: 600 }}>{discrepancies} discrepanc{discrepancies === 1 ? 'y' : 'ies'} found - stock will be adjusted to physical count</span>
              : <span style={{ color: '#4caf82', fontWeight: 600 }}>All counts match</span>
            }
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={S.btn('#f0f2f5', '#333')} onClick={onClose}>Cancel</button>
            <button style={S.btn()} onClick={save}><Icon d={icons.check} size={14}/> Save Verification</button>
          </div>
        </div>
      </div>
    </div>
  )
}
