// ─── Shared styles, icons, helpers ───
import { createContext, useContext } from 'react'

export const fmtUGX = a => `UGX ${Math.round(a).toLocaleString()}`
export const today = () => new Date().toISOString().split('T')[0]

// ─── Theme CSS variables ───
export const themeCSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Playfair+Display:wght@600;700&display=swap');
:root, body.dark {
  --bg: #0a0e1a;
  --bg2: rgba(255,255,255,0.06);
  --bg3: rgba(255,255,255,0.1);
  --card: rgba(255,255,255,0.1);
  --card-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08);
  --sidebar-bg: #0A0C12;
  --sidebar-hover: #151820;
  --sidebar-active: #1E2130;
  --sidebar-border: rgba(255,255,255,0.08);
  --sidebar-text: #5C6478;
  --sidebar-text-active: #fff;
  --text: #e8ecf1;
  --text2: rgba(255,255,255,0.9);
  --text3: rgba(255,255,255,0.6);
  --text4: rgba(255,255,255,0.45);
  --text5: rgba(255,255,255,0.35);
  --bd: rgba(255,255,255,0.15);
  --bd2: rgba(255,255,255,0.1);
  --bd3: rgba(255,255,255,0.06);
  --input-bg: rgba(255,255,255,0.06);
  --modal-bg: rgba(20,25,40,0.85);
  --modal-overlay: rgba(0,0,0,0.6);
  --btn-secondary-bg: rgba(255,255,255,0.08);
  --btn-secondary-text: rgba(255,255,255,0.7);
  --th-color: rgba(255,255,255,0.6);
  --accent: #4fc3f7;
  --accent-dark: #3aa3d4;
  --nav-active-bg: rgba(79,195,247,0.12);
  --stat-text: #fff;
  --search-bg: rgba(255,255,255,0.06);
  --dropdown-bg: rgba(20,25,40,0.95);
}
body.light {
  --bg: #f0f2f5;
  --bg2: rgba(0,0,0,0.03);
  --bg3: rgba(0,0,0,0.05);
  --card: #ffffff;
  --card-shadow: 0 2px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04);
  --sidebar-bg: #ffffff;
  --sidebar-hover: #F0EDE9;
  --sidebar-active: #E8F6F5;
  --sidebar-border: #e2e5ea;
  --sidebar-text: #6B7A8D;
  --sidebar-text-active: #1a1a2e;
  --text: #1a1a2e;
  --text2: #2d2d44;
  --text3: #5a5a7a;
  --text4: #8a8aa0;
  --text5: #aaa;
  --bd: #d0d5dd;
  --bd2: #e2e5ea;
  --bd3: #f0f1f3;
  --input-bg: #f7f8fa;
  --modal-bg: #ffffff;
  --modal-overlay: rgba(0,0,0,0.3);
  --btn-secondary-bg: #f0f2f5;
  --btn-secondary-text: #333;
  --th-color: #5a5a7a;
  --accent: #1a8fcb;
  --accent-dark: #157ab0;
  --nav-active-bg: rgba(26,143,203,0.1);
  --stat-text: #1a1a2e;
  --search-bg: #f7f8fa;
  --dropdown-bg: #ffffff;
}
body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); transition: background 0.3s, color 0.3s; }

/* Sidebar */
.ph-sb { position: fixed; top: 0; left: 0; bottom: 0; width: 230px; background: var(--sidebar-bg); border-right: 1px solid var(--sidebar-border); display: flex; flex-direction: column; z-index: 10; overflow: hidden; }
.ph-sb::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at top left, rgba(79,195,247,0.08), transparent 60%); pointer-events: none; }
.ph-sb-brand { padding: 28px 20px 24px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; position: relative; z-index: 1; cursor: pointer; }
.ph-sb-icon { width: 54px; height: 54px; background: linear-gradient(135deg, var(--accent), var(--accent-dark)); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: 0 4px 14px rgba(79,195,247,0.3); }
.ph-sb-name { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: var(--text); letter-spacing: -0.3px; line-height: 1.2; }
.ph-sb-sub { font-size: 10.5px; color: var(--accent); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 3px; }
.ph-sb-nav { padding: 10px 12px; flex: 1; position: relative; z-index: 1; overflow-y: auto; }
.ph-sb-sec { font-size: 10px; font-weight: 600; letter-spacing: 1.8px; text-transform: uppercase; color: rgba(155,168,183,0.5); padding: 12px 12px 4px; }
.ph-ni { display: flex; align-items: center; gap: 11px; padding: 9px 14px; border-radius: 8px; color: var(--sidebar-text); cursor: pointer; transition: all 0.2s; font-size: 14px; font-weight: 500; position: relative; margin-bottom: 2px; overflow: hidden; }
.ph-ni::after { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: linear-gradient(90deg, rgba(79,195,247,0.12), transparent); transition: width 0.3s; pointer-events: none; border-radius: 8px; }
.ph-ni:hover { background: var(--sidebar-hover); color: var(--accent); }
.ph-ni:hover::after { width: 100%; }
.ph-ni:hover svg { transform: scale(1.3); filter: drop-shadow(0 0 5px rgba(79,195,247,0.4)); }
.ph-ni svg { transition: transform 0.25s, filter 0.25s; }
.ph-ni.active { background: var(--sidebar-active); color: var(--sidebar-text-active); font-weight: 600; }
.ph-ni.active::before { content: ''; position: absolute; left: 0; top: 6px; bottom: 6px; width: 3px; background: var(--accent); border-radius: 0 3px 3px 0; }
.ph-sb-ft { padding: 12px 14px 18px; border-top: 1px solid var(--bd3); position: relative; z-index: 1; }
.ph-dm-tg { display: flex; align-items: center; gap: 10px; padding: 9px 14px; background: var(--sidebar-hover); border-radius: 8px; border: 1px solid var(--bd3); cursor: pointer; transition: all 0.2s; }
.ph-dm-tg:hover { background: var(--sidebar-active); }
.ph-dm-tg span { font-size: 12px; color: var(--sidebar-text); font-weight: 500; }
`

// ─── CSV Export ───
export function exportCSV(filename, headers, rows) {
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

// ─── Print helper ───
export function printSection(title, elementId) {
  const el = document.getElementById(elementId)
  if (!el) return window.print()
  const win = window.open('', '_blank')
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>
      @page { size: landscape; margin: 10mm; }
      body { font-family: -apple-system, sans-serif; color: #1a1a2e; padding: 0; margin: 0; }
      h1 { font-size: 16px; margin-bottom: 2px; }
      h3 { font-size: 12px; margin: 10px 0 6px; }
      .sub { font-size: 10px; color: #666; margin-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; margin: 6px 0; table-layout: auto; }
      th { text-align: left; padding: 4px 6px; font-size: 9px; border-bottom: 2px solid #ccc; text-transform: uppercase; color: #666; white-space: nowrap; }
      td { padding: 4px 6px; font-size: 10px; border-bottom: 1px solid #eee; white-space: nowrap; }
      .badge { display: inline-block; padding: 1px 6px; border-radius: 10px; font-size: 9px; font-weight: 600; }
      .red { background: #fee; color: #c33; }
      .green { background: #efe; color: #363; }
      .yellow { background: #ffe; color: #863; }
      .summary { display: flex; gap: 16px; margin: 8px 0; }
      .stat { flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 6px; }
      .stat-label { font-size: 9px; text-transform: uppercase; color: #666; }
      .stat-value { font-size: 14px; font-weight: 700; margin-top: 2px; }
      button { display: none !important; }
      svg { display: none !important; }
      @media print { body { padding: 0; } }
    </style>
  </head><body>
    <h1>PharmaCare Pro</h1>
    <div class="sub">${title} | Printed: ${new Date().toLocaleString()}</div>
    ${el.innerHTML}
  </body></html>`)
  win.document.close()
  setTimeout(() => { win.print(); win.close() }, 400)
}

// ─── 80mm Thermal Receipt Print ───
export function printThermalReceipt(sale) {
  const f = (a) => `UGX ${Math.round(a).toLocaleString()}`
  const line = (l, r) => `<tr><td>${l}</td><td style="text-align:right">${r}</td></tr>`
  const dash = '<tr><td colspan="2" style="border-bottom:1px dashed #000;padding:2px 0"></td></tr>'
  let rows = ''
  sale.items.forEach((it, i) => {
    rows += `<tr><td colspan="2" style="padding:1px 0">${i + 1}. ${it.name}</td></tr>`
    rows += `<tr><td style="padding:0 0 2px 10px;color:#555">${it.qty} x ${f(it.price)}</td><td style="text-align:right;padding:0 0 2px 0">${f(it.price * it.qty)}</td></tr>`
  })
  const html = `<!DOCTYPE html><html><head><title>Receipt</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  body { font-family: 'Courier New', monospace; width: 72mm; margin: 4mm auto; padding: 0; font-size: 12px; color: #000; }
  .center { text-align: center; }
  .shop { font-size: 16px; font-weight: 700; margin-bottom: 2px; }
  .sub { font-size: 10px; color: #555; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 0; vertical-align: top; }
  .total-row td { font-size: 14px; font-weight: 700; padding: 4px 0; }
  .footer { text-align: center; font-size: 10px; color: #555; margin-top: 8px; }
  @media print { body { margin: 0; width: 72mm; } }
</style></head><body>
<div class="center">
  <div class="shop">PharmaCare Pro</div>
  <div class="sub">Pharmacy Management System</div>
</div>
<table>${dash}
  ${line('Receipt #:', sale.id)}
  ${line('Date:', sale.date)}
  ${line('Time:', sale.time)}
  ${line('Served By:', sale.cashierName || '-')}
  ${line('Customer:', sale.customer)}
  ${dash}
</table>
<table>${rows}</table>
<table>
  ${dash}
  <tr class="total-row"><td>TOTAL</td><td style="text-align:right">${f(sale.total)}</td></tr>
  ${dash}
  ${line('Payment:', sale.payMethod || 'Cash')}
  ${sale.payMethod === 'Credit' ? `
    ${sale.cashPaid > 0 ? line('Paid Now:', f(sale.cashPaid)) : ''}
    ${line('Credit Owed:', f(sale.creditAmount))}
  ` : `
    ${sale.cashPaid > 0 ? line('Cash Paid:', f(sale.cashPaid)) : ''}
    ${sale.balance > 0 ? line('Change:', f(sale.balance)) : ''}
  `}
  ${dash}
</table>
<div class="footer">
  Thank you for your purchase!<br/>
  Goods once sold are not returnable
</div>
</body></html>`
  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  setTimeout(() => { win.print(); win.close() }, 400)
}

// ─── A4 Document Print (Quotation, Proforma, PO) ───
export function printDocument(doc) {
  const f = (a) => `UGX ${Math.round(a).toLocaleString()}`
  const typeLabel = doc.docType === 'quotation' ? 'QUOTATION' : doc.docType === 'proforma' ? 'PROFORMA INVOICE' : 'PURCHASE ORDER'
  const toLabel = doc.docType === 'purchaseOrder' ? 'Supplier' : 'Customer'
  const priceLabel = doc.docType === 'purchaseOrder' ? 'Cost' : 'Price'
  let rows = ''
  doc.items.forEach((it, i) => {
    rows += `<tr><td>${i+1}</td><td>${it.name}</td><td style="text-align:center">${it.qty}</td><td style="text-align:right">${f(it.price || it.cost)}</td><td style="text-align:right">${f((it.price || it.cost) * it.qty)}</td></tr>`
  })
  const html = `<!DOCTYPE html><html><head><title>${typeLabel} #${doc.id}</title>
<style>
  @page { size: A4 portrait; margin: 15mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; margin: 0; padding: 0; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2196F3; padding-bottom: 16px; margin-bottom: 20px; }
  .brand { font-size: 22px; font-weight: 700; color: #2196F3; }
  .brand-sub { font-size: 11px; color: #666; margin-top: 2px; }
  .doc-type { font-size: 24px; font-weight: 700; color: #333; text-align: right; }
  .doc-num { font-size: 13px; color: #666; text-align: right; }
  .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
  .info-box { flex: 1; }
  .info-box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 6px; }
  .info-box p { margin: 2px 0; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th { background: #f5f7fa; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; border-bottom: 2px solid #ddd; }
  td { padding: 10px 12px; border-bottom: 1px solid #eee; }
  .total-section { display: flex; justify-content: flex-end; margin-top: 10px; }
  .total-box { width: 280px; }
  .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .total-row.grand { border-top: 2px solid #333; padding-top: 10px; margin-top: 6px; font-size: 16px; font-weight: 700; }
  .notes { margin-top: 24px; padding: 14px; background: #f9fafb; border: 1px solid #eee; border-radius: 6px; font-size: 12px; color: #555; }
  .notes h4 { font-size: 11px; text-transform: uppercase; color: #999; margin-bottom: 6px; }
  .footer { margin-top: 30px; padding-top: 14px; border-top: 1px solid #ddd; font-size: 11px; color: #999; text-align: center; }
  .status { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  @media print { body { margin: 0; } }
</style></head><body>
<div class="header">
  <div><div class="brand">PharmaCare Pro</div><div class="brand-sub">Pharmacy Management System</div></div>
  <div><div class="doc-type">${typeLabel}</div><div class="doc-num">#${doc.id}</div></div>
</div>
<div class="info">
  <div class="info-box">
    <h4>${toLabel}</h4>
    <p style="font-weight:600;font-size:14px">${doc.recipient}</p>
    ${doc.recipientDetails || ''}
  </div>
  <div class="info-box" style="text-align:right">
    <h4>Details</h4>
    <p><b>Date:</b> ${doc.date}</p>
    ${doc.validUntil ? `<p><b>Valid Until:</b> ${doc.validUntil}</p>` : ''}
    ${doc.dueDate ? `<p><b>Due Date:</b> ${doc.dueDate}</p>` : ''}
    <p><b>Created By:</b> ${doc.createdBy || '-'}</p>
    <p><b>Status:</b> ${doc.status}</p>
  </div>
</div>
<table>
  <thead><tr><th>#</th><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">${priceLabel}</th><th style="text-align:right">Total</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="total-section"><div class="total-box">
  <div class="total-row"><span>Subtotal</span><span>${f(doc.total)}</span></div>
  <div class="total-row grand"><span>TOTAL</span><span>${f(doc.total)}</span></div>
</div></div>
${doc.notes ? `<div class="notes"><h4>Notes</h4>${doc.notes}</div>` : ''}
<div class="footer">PharmaCare Pro | Generated on ${new Date().toLocaleString()}</div>
</body></html>`
  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  setTimeout(() => { win.print(); win.close() }, 400)
}

// ─── Icons (SVG paths) ───
export const icons = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  inventory: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  pos: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0',
  patients: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  alert: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35',
  plus: 'M12 5v14 M5 12h14',
  x: 'M18 6L6 18 M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  trash: 'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  cart: 'M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6 M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M20 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  analytics: 'M18 20V10 M12 20V4 M6 20v-6',
  reports: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  print: 'M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z',
  verify: 'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  purchase: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  supplier: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M5.5 7.5a4 4 0 1 0 8 0 4 4 0 0 0-8 0z M20 8v6 M23 11h-6',
  stock: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12',
  returnIcon: 'M9 14l-4-4 4-4 M5 10h11a4 4 0 0 1 0 8h-1',
  expiry: 'M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z M12 6v6l4 2',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  credit: 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z M2 10h20 M6 14h4 M14 14h4',
  hospital: 'M3 21h18 M9 8h1 M9 12h1 M9 16h1 M14 8h1 M14 12h1 M14 16h1 M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16',
  fileText: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  send: 'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z',
}

// ─── Icon component ───
export const Icon = ({ d, size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
)

// ─── Styles (use CSS vars for theming) ───
export const S = {
  app: { display: 'flex', minHeight: '100vh', overflowX: 'hidden', background: 'var(--bg)' },
  main: { flex: 1, marginLeft: 230, padding: '24px 32px', overflowX: 'hidden', maxWidth: 'calc(100vw - 230px)' },
  header: { fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 24, paddingBottom: 16, marginLeft: -32, marginRight: -32, paddingLeft: 32, paddingRight: 32, borderBottom: '2px solid var(--accent)' },
  card: { background: 'var(--card)', borderRadius: 16, padding: 20, boxShadow: 'var(--card-shadow)', border: '1px solid var(--bd2)' },
  statCard: (color) => ({ background: 'var(--card)', borderRadius: 16, padding: '20px 24px', boxShadow: 'var(--card-shadow)', borderLeft: `3px solid ${color}`, flex: 1, minWidth: 200, border: '1px solid var(--bd2)' }),
  statLabel: { fontSize: 12, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 26, fontWeight: 700, color: 'var(--stat-text)', marginTop: 4 },
  statSub: { fontSize: 12, color: 'var(--text4)', marginTop: 4 },
  grid: { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 },
  table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' },
  th: { textAlign: 'left', padding: '10px 10px', fontSize: 13, fontWeight: 700, color: 'var(--th-color)', textTransform: 'uppercase', borderBottom: '1px solid var(--bd2)', letterSpacing: 0.5 },
  td: { padding: '10px 10px', fontSize: 14, borderBottom: '1px solid var(--bd3)', color: 'var(--text2)' },
  badge: (bg, tx) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg.replace(')', ',0.2)').replace('rgb', 'rgba'), color: tx, border: `1px solid ${tx}33` }),
  btn: (bg = '#4fc3f7', tx = '#fff') => ({ padding: '8px 16px', borderRadius: 8, border: bg === '#4fc3f7' ? '1px solid rgba(79,195,247,0.5)' : '1px solid var(--bd2)', background: bg === '#4fc3f7' ? 'linear-gradient(135deg, #4fc3f7, #3aa3d4)' : bg === '#f0f2f5' ? 'var(--btn-secondary-bg)' : bg.startsWith('#') ? bg + '22' : bg, color: bg === '#4fc3f7' ? '#fff' : tx === '#333' ? 'var(--btn-secondary-text)' : tx, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', boxShadow: bg === '#4fc3f7' ? '0 2px 8px rgba(79,195,247,0.3)' : 'none' }),
  input: { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--bd)', fontSize: 13, outline: 'none', width: '100%', background: 'var(--input-bg)', color: 'var(--text)' },
  select: { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--bd)', fontSize: 13, outline: 'none', background: 'var(--input-bg)', color: 'var(--text)' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--search-bg)', border: '1px solid var(--bd2)', borderRadius: 10, padding: '6px 12px', width: 280 },
  searchInput: { border: 'none', outline: 'none', fontSize: 13, flex: 1, background: 'transparent', color: 'var(--text)' },
  modal: { position: 'fixed', inset: 0, background: 'var(--modal-overlay)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalBox: { background: 'var(--modal-bg)', border: '1px solid var(--bd2)', borderRadius: 20, padding: 28, width: 480, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' },
  modalWide: { background: 'var(--modal-bg)', border: '1px solid var(--bd2)', borderRadius: 20, padding: 28, width: '90vw', maxWidth: 1050, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' },
  row: { display: 'flex', gap: 12, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 4, display: 'block' },
  dimText: { color: 'var(--text4)' },
  mutedText: { color: 'var(--text5)' },
}

// ─── GlassBar component ───
export function GlassBar({ label, value, max, color = '#4fc3f7', sub }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: 'var(--text3)' }}>{label}</span>
        <span style={{ fontWeight: 600, color: 'var(--text2)' }}>{value}{sub ? <span style={{ color: 'var(--text5)', fontWeight: 400 }}> {sub}</span> : ''}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'var(--bg2)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 4, background: `linear-gradient(90deg, ${color}, ${color}aa)`, transition: 'width 0.4s' }}/>
      </div>
    </div>
  )
}
