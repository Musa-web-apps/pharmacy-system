// Demo seed data
export const DEMO_DRUGS = [
  { id: 1, name: 'Amoxicillin 500mg', category: 'Antibiotics', qty: 240, reorder: 50, price: 1500, cost: 800, expiry: '2027-03-15', batch: 'AMX-2401', supplier: 'MedSource Ltd', barcode: '4901001000012' },
  { id: 2, name: 'Paracetamol 500mg', category: 'Pain Relief', qty: 500, reorder: 100, price: 500, cost: 200, expiry: '2027-06-20', batch: 'PCM-2405', supplier: 'PharmaCo Uganda', barcode: '4901002000019' },
  { id: 3, name: 'Metformin 850mg', category: 'Diabetes', qty: 180, reorder: 40, price: 2000, cost: 1200, expiry: '2026-12-01', batch: 'MET-2403', supplier: 'MedSource Ltd', barcode: '4901003000016' },
  { id: 4, name: 'Ibuprofen 400mg', category: 'Pain Relief', qty: 320, reorder: 60, price: 800, cost: 350, expiry: '2027-09-10', batch: 'IBU-2402', supplier: 'HealthLine Pharma', barcode: '4901004000013' },
  { id: 5, name: 'Omeprazole 20mg', category: 'GI Tract', qty: 150, reorder: 30, price: 2500, cost: 1500, expiry: '2027-01-25', batch: 'OMP-2404', supplier: 'PharmaCo Uganda', barcode: '4901005000010' },
  { id: 6, name: 'Ciprofloxacin 500mg', category: 'Antibiotics', qty: 90, reorder: 30, price: 3000, cost: 1800, expiry: '2026-08-15', batch: 'CIP-2401', supplier: 'HealthLine Pharma', barcode: '4901006000017' },
  { id: 7, name: 'Losartan 50mg', category: 'Hypertension', qty: 200, reorder: 40, price: 3500, cost: 2200, expiry: '2027-11-30', batch: 'LOS-2406', supplier: 'MedSource Ltd', barcode: '4901007000014' },
  { id: 8, name: 'Cetirizine 10mg', category: 'Allergy', qty: 400, reorder: 80, price: 600, cost: 250, expiry: '2028-02-10', batch: 'CET-2405', supplier: 'PharmaCo Uganda', barcode: '4901008000011' },
  { id: 9, name: 'Diclofenac 50mg', category: 'Pain Relief', qty: 15, reorder: 40, price: 1200, cost: 600, expiry: '2026-05-01', batch: 'DIC-2403', supplier: 'HealthLine Pharma', barcode: '4901009000018' },
  { id: 10, name: 'Azithromycin 250mg', category: 'Antibiotics', qty: 60, reorder: 20, price: 5000, cost: 3200, expiry: '2027-04-18', batch: 'AZT-2402', supplier: 'MedSource Ltd', barcode: '4901010000014' },
];

export const DEMO_PATIENTS = [
  { id: 1, name: 'Sarah Nakamya', phone: '0771234567', age: 34, gender: 'Female', allergies: 'Penicillin', conditions: 'Hypertension' },
  { id: 2, name: 'James Okello', phone: '0752345678', age: 45, gender: 'Male', allergies: 'None', conditions: 'Diabetes Type 2' },
  { id: 3, name: 'Grace Atim', phone: '0783456789', age: 28, gender: 'Female', allergies: 'Sulfa drugs', conditions: 'None' },
  { id: 4, name: 'David Mugisha', phone: '0704567890', age: 52, gender: 'Male', allergies: 'None', conditions: 'Asthma, Hypertension' },
  { id: 5, name: 'Fatuma Hassan', phone: '0775678901', age: 39, gender: 'Female', allergies: 'Aspirin', conditions: 'Peptic ulcer' },
];

export const CATEGORIES = ['Antibiotics', 'Pain Relief', 'Diabetes', 'Hypertension', 'GI Tract', 'Allergy', 'Vitamins', 'Skin Care', 'Respiratory', 'Other'];

export const SUPPLIERS = ['MedSource Ltd', 'PharmaCo Uganda', 'HealthLine Pharma'];

// Generate demo sales for the last 30 days
function genSales() {
  const sales = [];
  const names = ['Walk-in', 'Sarah Nakamya', 'James Okello', 'Grace Atim', 'David Mugisha', 'Fatuma Hassan', 'Walk-in', 'Walk-in'];
  const items = [
    { drugId: 2, name: 'Paracetamol 500mg', price: 500 },
    { drugId: 1, name: 'Amoxicillin 500mg', price: 1500 },
    { drugId: 4, name: 'Ibuprofen 400mg', price: 800 },
    { drugId: 8, name: 'Cetirizine 10mg', price: 600 },
    { drugId: 3, name: 'Metformin 850mg', price: 2000 },
    { drugId: 5, name: 'Omeprazole 20mg', price: 2500 },
    { drugId: 7, name: 'Losartan 50mg', price: 3500 },
    { drugId: 6, name: 'Ciprofloxacin 500mg', price: 3000 },
    { drugId: 10, name: 'Azithromycin 250mg', price: 5000 },
    { drugId: 9, name: 'Diclofenac 50mg', price: 1200 },
  ];
  const now = new Date();
  for (let d = 29; d >= 0; d--) {
    const dt = new Date(now); dt.setDate(dt.getDate() - d);
    const dateStr = dt.toISOString().split('T')[0];
    const count = 2 + Math.floor(Math.random() * 6); // 2-7 sales per day
    for (let i = 0; i < count; i++) {
      const numItems = 1 + Math.floor(Math.random() * 3);
      const saleItems = [];
      const used = new Set();
      for (let j = 0; j < numItems; j++) {
        let idx = Math.floor(Math.random() * items.length);
        while (used.has(idx)) idx = Math.floor(Math.random() * items.length);
        used.add(idx);
        const qty = 1 + Math.floor(Math.random() * 4);
        saleItems.push({ ...items[idx], qty, maxQty: 100 });
      }
      const total = saleItems.reduce((s, x) => s + x.price * x.qty, 0);
      const h = 8 + Math.floor(Math.random() * 10);
      const m = Math.floor(Math.random() * 60);
      sales.push({
        id: Date.now() + d * 10000 + i,
        date: dateStr,
        time: `${h}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`,
        customer: names[Math.floor(Math.random() * names.length)],
        items: saleItems,
        total,
      });
    }
  }
  return sales;
}

export const DEMO_SALES = genSales();

// Supplier profiles
export const DEMO_SUPPLIERS = [
  { id: 1, name: 'MedSource Ltd', contact: 'John Kalema', phone: '0772100200', email: 'orders@medsource.ug', address: 'Plot 42, Industrial Area, Kampala', terms: 'Net 30', rating: 4.5, notes: 'Primary antibiotics supplier, reliable delivery' },
  { id: 2, name: 'PharmaCo Uganda', contact: 'Amina Nakato', phone: '0753200300', email: 'sales@pharmaco.ug', address: '15 Bombo Rd, Kampala', terms: 'Net 14', rating: 4.2, notes: 'Good prices on OTC drugs, occasionally delayed' },
  { id: 3, name: 'HealthLine Pharma', contact: 'Peter Ochieng', phone: '0784300400', email: 'supply@healthline.co.ug', address: 'Nakasero Hill, Kampala', terms: 'Cash on Delivery', rating: 3.8, notes: 'Competitive pricing on pain relief, COD only' },
];

// Purchase orders (goods received notes)
function genPurchases() {
  const purchases = [];
  const items = [
    { drugId: 1, name: 'Amoxicillin 500mg', cost: 800 },
    { drugId: 2, name: 'Paracetamol 500mg', cost: 200 },
    { drugId: 3, name: 'Metformin 850mg', cost: 1200 },
    { drugId: 4, name: 'Ibuprofen 400mg', cost: 350 },
    { drugId: 5, name: 'Omeprazole 20mg', cost: 1500 },
    { drugId: 6, name: 'Ciprofloxacin 500mg', cost: 1800 },
    { drugId: 7, name: 'Losartan 50mg', cost: 2200 },
    { drugId: 8, name: 'Cetirizine 10mg', cost: 250 },
    { drugId: 9, name: 'Diclofenac 50mg', cost: 600 },
    { drugId: 10, name: 'Azithromycin 250mg', cost: 3200 },
  ];
  const suppliers = ['MedSource Ltd', 'PharmaCo Uganda', 'HealthLine Pharma'];
  const statuses = ['received', 'received', 'received', 'pending', 'received'];
  const now = new Date();
  for (let d = 25; d >= 0; d -= 3) {
    const dt = new Date(now); dt.setDate(dt.getDate() - d);
    const dateStr = dt.toISOString().split('T')[0];
    const numItems = 2 + Math.floor(Math.random() * 3);
    const poItems = [];
    const used = new Set();
    for (let j = 0; j < numItems; j++) {
      let idx = Math.floor(Math.random() * items.length);
      while (used.has(idx)) idx = Math.floor(Math.random() * items.length);
      used.add(idx);
      const qty = 20 + Math.floor(Math.random() * 80);
      poItems.push({ ...items[idx], qty });
    }
    const total = poItems.reduce((s, x) => s + x.cost * x.qty, 0);
    purchases.push({
      id: 1000 + d,
      poNumber: `PO-${String(1000 + purchases.length + 1).padStart(4, '0')}`,
      date: dateStr,
      supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
      items: poItems,
      total,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      receivedBy: 'Admin',
      invoiceRef: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
    });
  }
  return purchases;
}

export const DEMO_PURCHASES = genPurchases();

// Stock verification records
export const DEMO_VERIFICATIONS = [
  { id: 1, date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], verifiedBy: 'Admin', status: 'completed',
    items: [
      { drugId: 1, name: 'Amoxicillin 500mg', systemQty: 245, physicalQty: 240, variance: -5, reason: 'Breakage' },
      { drugId: 2, name: 'Paracetamol 500mg', systemQty: 500, physicalQty: 500, variance: 0, reason: '' },
      { drugId: 4, name: 'Ibuprofen 400mg', systemQty: 325, physicalQty: 320, variance: -5, reason: 'Miscounted at receiving' },
      { drugId: 8, name: 'Cetirizine 10mg', systemQty: 400, physicalQty: 402, variance: 2, reason: 'Extra from supplier' },
    ]
  },
];

// Registered clients (clinics, hospitals, health centers, pharmacies)
export const DEMO_CLIENTS = [
  { id: 1, name: 'Mulago National Referral Hospital', type: 'Hospital', contact: 'Dr. Richard Byarugaba', phone: '0414541188', email: 'procurement@mulago.go.ug', address: 'Upper Mulago Hill, Kampala', creditLimit: 5000000, notes: 'Major referral hospital, monthly bulk orders' },
  { id: 2, name: 'Nakasero Clinic', type: 'Clinic', contact: 'Nurse Agnes Nambi', phone: '0772345678', email: 'orders@nakaserohc.ug', address: '12 Nakasero Rd, Kampala', creditLimit: 2000000, notes: 'Regular weekly orders, reliable payments' },
  { id: 3, name: 'Kisugu Health Centre IV', type: 'Health Center', contact: 'Dr. Moses Otim', phone: '0753456789', email: 'kisuguhc@gmail.com', address: 'Kisugu, Makindye Division', creditLimit: 1500000, notes: 'Government facility, payments via LPO' },
  { id: 4, name: 'Mengo Hospital', type: 'Hospital', contact: 'James Ssentamu', phone: '0414270222', email: 'pharmacy@mengohospital.org', address: 'Albert Cook Rd, Kampala', creditLimit: 3000000, notes: 'Church of Uganda hospital, net-30 terms' },
  { id: 5, name: "Dr. Okello's Pharmacy", type: 'Pharmacy', contact: 'Dr. Patrick Okello', phone: '0784567890', email: 'okellopharm@gmail.com', address: 'Luwum St, Kampala', creditLimit: 1000000, notes: 'Peer pharmacy, buys antibiotics in bulk' },
];
