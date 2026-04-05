import { useState, useEffect } from 'react'
import { S, Icon, icons, themeCSS } from './shared.jsx'
import { DEMO_DRUGS, DEMO_PATIENTS, DEMO_SALES, DEMO_SUPPLIERS, DEMO_PURCHASES, DEMO_VERIFICATIONS, DEMO_CLIENTS } from './data.js'

import Dashboard from './pages/Dashboard.jsx'
import Inventory from './pages/Inventory.jsx'
import POS from './pages/POS.jsx'
import Patients from './pages/Patients.jsx'
import Analytics from './pages/Analytics.jsx'
import Reports from './pages/Reports.jsx'
import Purchases from './pages/Purchases.jsx'
import SuppliersPage from './pages/Suppliers.jsx'
import StockVerification from './pages/StockVerification.jsx'
import ExpiringDrugs from './pages/ExpiringDrugs.jsx'
import SalesHistory from './pages/SalesHistory.jsx'
import Debtors from './pages/Debtors.jsx'
import Clients from './pages/Clients.jsx'
import Documents from './pages/Documents.jsx'

// Inject theme CSS once
if (!document.getElementById('theme-vars')) {
  const style = document.createElement('style')
  style.id = 'theme-vars'
  style.textContent = themeCSS
  document.head.appendChild(style)
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [drugs, setDrugs] = useState(DEMO_DRUGS)
  const [patients, setPatients] = useState(DEMO_PATIENTS)
  const [sales, setSales] = useState(DEMO_SALES)
  const [suppliers, setSuppliers] = useState(DEMO_SUPPLIERS)
  const [purchases, setPurchases] = useState(DEMO_PURCHASES)
  const [verifications, setVerifications] = useState(DEMO_VERIFICATIONS)
  const [clients, setClients] = useState(DEMO_CLIENTS)
  const [purchaseReturns, setPurchaseReturns] = useState([])
  const [quotations, setQuotations] = useState([])
  const [proformas, setProformas] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [theme, setTheme] = useState(() => localStorage.getItem('pharmacare-theme') || 'dark')
  const [cashier, setCashier] = useState(() => localStorage.getItem('pharmacare-cashier') || '')

  useEffect(() => {
    document.body.className = theme
    localStorage.setItem('pharmacare-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  // Convert proforma invoice to a sale
  const convertProformaToSale = (proforma) => {
    const sale = {
      id: Date.now(), date: proforma.date, time: new Date().toLocaleTimeString(),
      customer: proforma.recipient,
      items: proforma.items.map(it => ({ drugId: 0, name: it.name, price: it.price || it.cost, qty: it.qty, maxQty: it.qty })),
      total: proforma.total, cashPaid: proforma.total, balance: 0,
      payMethod: 'Cash', cashierName: cashier || '-', fromProforma: proforma.id
    }
    setSales(prev => [...prev, sale])
    setDrugs(prev => prev.map(d => {
      const item = proforma.items.find(it => it.name === d.name)
      return item ? { ...d, qty: Math.max(0, d.qty - item.qty) } : d
    }))
  }

  const navSections = [
    { section: 'Main', items: [
      { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
      { id: 'inventory', label: 'Inventory', icon: icons.inventory },
      { id: 'pos', label: 'Point of Sale', icon: icons.pos },
      { id: 'sales', label: 'Sales History', icon: icons.cart },
      { id: 'debtors', label: 'Debtors', icon: icons.credit },
      { id: 'patients', label: 'Patients', icon: icons.patients },
      { id: 'clients', label: 'Clients', icon: icons.hospital },
      { id: 'documents', label: 'Documents', icon: icons.fileText },
    ]},
    { section: 'Supply Chain', items: [
      { id: 'purchases', label: 'Purchases', icon: icons.purchase },
      { id: 'suppliers', label: 'Suppliers', icon: icons.supplier },
    ]},
    { section: 'Compliance', items: [
      { id: 'expiring', label: 'Expiring Drugs', icon: icons.expiry },
      { id: 'verification', label: 'Stock Verification', icon: icons.verify },
      { id: 'analytics', label: 'Analytics', icon: icons.analytics },
      { id: 'reports', label: 'Reports', icon: icons.reports },
    ]},
  ]

  return (
    <div style={S.app}>
      <div className="ph-sb">
        <div className="ph-sb-brand" onClick={() => setPage('dashboard')}>
          <div className="ph-sb-icon">
            <Icon d={icons.pos} size={28}/>
          </div>
          <div>
            <div className="ph-sb-name">PharmaCare Pro</div>
            <div className="ph-sb-sub">Pharmacy Management</div>
          </div>
        </div>
        <div className="ph-sb-nav">
          {navSections.map(sec => (
            <div key={sec.section}>
              <div className="ph-sb-sec">{sec.section}</div>
              {sec.items.map(n => (
                <div key={n.id} className={`ph-ni${page === n.id ? ' active' : ''}`} onClick={() => setPage(n.id)}>
                  <Icon d={n.icon} size={18}/> {n.label}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="ph-sb-ft">
          <div className="ph-dm-tg" onClick={toggleTheme}>
            <Icon d={theme === 'dark' ? icons.sun : icons.moon} size={16}/>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
        </div>
      </div>
      <div style={S.main}>
        {page === 'dashboard' && <Dashboard drugs={drugs} sales={sales}/>}
        {page === 'inventory' && <Inventory drugs={drugs} setDrugs={setDrugs}/>}
        {page === 'pos' && <POS drugs={drugs} setDrugs={setDrugs} sales={sales} setSales={setSales} patients={patients} clients={clients} cashier={cashier} setCashier={setCashier}/>}
        {page === 'sales' && <SalesHistory sales={sales}/>}
        {page === 'debtors' && <Debtors sales={sales} setSales={setSales}/>}
        {page === 'patients' && <Patients patients={patients} setPatients={setPatients}/>}
        {page === 'clients' && <Clients clients={clients} setClients={setClients} sales={sales}/>}
        {page === 'documents' && <Documents drugs={drugs} patients={patients} clients={clients} suppliers={suppliers} cashier={cashier} quotations={quotations} setQuotations={setQuotations} proformas={proformas} setProformas={setProformas} purchaseOrders={purchaseOrders} setPurchaseOrders={setPurchaseOrders} onConvertToSale={convertProformaToSale}/>}
        {page === 'purchases' && <Purchases drugs={drugs} setDrugs={setDrugs} purchases={purchases} setPurchases={setPurchases} suppliers={suppliers} returns={purchaseReturns} setReturns={setPurchaseReturns}/>}
        {page === 'suppliers' && <SuppliersPage suppliers={suppliers} setSuppliers={setSuppliers} purchases={purchases}/>}
        {page === 'expiring' && <ExpiringDrugs drugs={drugs} setDrugs={setDrugs}/>}
        {page === 'verification' && <StockVerification drugs={drugs} setDrugs={setDrugs} verifications={verifications} setVerifications={setVerifications}/>}
        {page === 'analytics' && <Analytics drugs={drugs} sales={sales}/>}
        {page === 'reports' && <Reports drugs={drugs} sales={sales} purchases={purchases}/>}
      </div>
    </div>
  )
}
