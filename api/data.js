module.exports = {
  accounts: [
    { code: "1010", name: "Cash & Bank", type: "Asset", balance: 2450000, indent: 0, bold: true },
    { code: "1020", name: "Chequing Account", type: "Asset", balance: 1200000, indent: 1 },
    { code: "1030", name: "Savings Account", type: "Asset", balance: 1250000, indent: 1 },
    { code: "1100", name: "Accounts Receivable", type: "Asset", balance: 385000, indent: 0, bold: true },
    { code: "1200", name: "Inventory", type: "Asset", balance: 620000, indent: 0, bold: true },
    { code: "1300", name: "Fixed Assets", type: "Asset", balance: 1850000, indent: 0, bold: true },
    { code: "2010", name: "Accounts Payable", type: "Liability", balance: 312000, indent: 0, bold: true },
    { code: "2100", name: "VAT Payable", type: "Liability", balance: 98500, indent: 0, bold: true },
    { code: "3010", name: "Owner's Equity", type: "Equity", balance: 3200000, indent: 0, bold: true },
    { code: "3020", name: "Retained Earnings", type: "Equity", balance: 1420000, indent: 0, bold: true },
    { code: "4010", name: "Sales Revenue", type: "Revenue", balance: 1842500, indent: 0, bold: true },
    { code: "5010", name: "Salaries & Wages", type: "Expense", balance: 520000, indent: 0, bold: true },
    { code: "5020", name: "Rent & Utilities", type: "Expense", balance: 180000, indent: 0, bold: true },
    { code: "5030", name: "Office Supplies", type: "Expense", balance: 45000, indent: 0, bold: true }
  ],

  ledger: [
    { date: "31 May 2026", entry: "JE-015", account: "Accounts Receivable", desc: "May sales closing entry", debit: 42000, credit: null },
    { date: "31 May 2026", entry: "JE-015", account: "Sales Revenue", desc: "May sales closing entry", debit: null, credit: 42000 },
    { date: "30 May 2026", entry: "JE-014", account: "Salaries & Wages", desc: "May payroll", debit: 52000, credit: null },
    { date: "30 May 2026", entry: "JE-014", account: "Cash & Bank", desc: "May payroll", debit: null, credit: 52000 },
    { date: "28 May 2026", entry: "JE-013", account: "Cash & Bank", desc: "INV-0042 payment received", debit: 24500, credit: null },
    { date: "28 May 2026", entry: "JE-013", account: "Accounts Receivable", desc: "INV-0042 payment received", debit: null, credit: 24500 },
    { date: "25 May 2026", entry: "JE-012", account: "Rent & Utilities", desc: "June rent payment", debit: 15000, credit: null },
    { date: "25 May 2026", entry: "JE-012", account: "Cash & Bank", desc: "June rent payment", debit: null, credit: 15000 }
  ],

  invoices: [
    { id: "INV-0043", customer: "TechSolve Pty Ltd", amount: 18200, issue: "25 May 2026", due: "24 Jun 2026", status: "Pending" },
    { id: "INV-0042", customer: "Acme Corporation", amount: 24500, issue: "20 May 2026", due: "19 Jun 2026", status: "Paid" },
    { id: "INV-0041", customer: "BuildRight Construction", amount: 42000, issue: "10 May 2026", due: "09 Jun 2026", status: "Overdue" },
    { id: "INV-0040", customer: "Global Logistics Co.", amount: 9850, issue: "05 May 2026", due: "04 Jun 2026", status: "Paid" },
    { id: "INV-0039", customer: "Alpha Manufacturing", amount: 67000, issue: "28 Apr 2026", due: "28 May 2026", status: "Overdue" },
    { id: "INV-0038", customer: "Nexus Consulting", amount: 31500, issue: "20 Apr 2026", due: "20 May 2026", status: "Pending" }
  ],

  bills: [
    { id: "BILL-0020", supplier: "CloudHost Services", amount: 3500, issue: "28 May 2026", due: "27 Jun 2026", status: "Pending" },
    { id: "BILL-0019", supplier: "OfficeWorks Supplies", amount: 8750, issue: "25 May 2026", due: "24 Jun 2026", status: "Pending" },
    { id: "BILL-0018", supplier: "PowerGrid Energy", amount: 12400, issue: "20 May 2026", due: "19 Jun 2026", status: "Overdue" },
    { id: "BILL-0017", supplier: "PropCo Real Estate", amount: 85000, issue: "01 May 2026", due: "31 May 2026", status: "Paid" },
    { id: "BILL-0016", supplier: "TechLogix IT", amount: 18100, issue: "28 Apr 2026", due: "28 May 2026", status: "Overdue" }
  ],

  banking: {
    accounts: [
      { name: "Chequing Account", balance: 1200000, last4: "4521" },
      { name: "Savings Account", balance: 1250000, last4: "7890" }
    ],
    transactions: [
      { date: "31 May 2026", desc: "INV-0042 Payment", account: "Chequing", amount: 24500, type: "credit" },
      { date: "30 May 2026", desc: "Payroll Transfer", account: "Chequing", amount: 52000, type: "debit" },
      { date: "28 May 2026", desc: "OfficeWorks Supplies", account: "Chequing", amount: 8750, type: "debit" },
      { date: "25 May 2026", desc: "Interest Earned", account: "Savings", amount: 1200, type: "credit" },
      { date: "20 May 2026", desc: "PropCo Rent Payment", account: "Chequing", amount: 85000, type: "debit" }
    ]
  },

  activity: [
    { text: "Invoice <strong>INV-0042</strong> paid — <span class=\"text-green font-bold\">R 24,500</span>", time: "12 minutes ago", dot: "green" },
    { text: "Bill <strong>BILL-0018</strong> due — <span class=\"text-red font-bold\">R 8,750</span>", time: "1 hour ago", dot: "red" },
    { text: "Journal entry <strong>JE-015</strong> posted — <span class=\"text-gold font-bold\">R 12,000</span>", time: "3 hours ago", dot: "gold" },
    { text: "New customer <strong>Acme Corp</strong> added", time: "5 hours ago", dot: "green" },
    { text: "Bank reconciliation <strong>1</strong> mismatch found", time: "Yesterday at 4:30 PM", dot: "red" }
  ],

  journalEntries: [
    { date: "31 May 2026", entry: "JE-015", desc: "May sales closing entry", totalDebit: 42000, totalCredit: 42000 },
    { date: "30 May 2026", entry: "JE-014", desc: "May payroll", totalDebit: 52000, totalCredit: 52000 },
    { date: "28 May 2026", entry: "JE-013", desc: "INV-0042 payment received", totalDebit: 24500, totalCredit: 24500 },
    { date: "25 May 2026", entry: "JE-012", desc: "June rent payment", totalDebit: 15000, totalCredit: 15000 }
  ],

  dashboard: {
    stats: [
      { label: "Total Revenue", value: 1842500, change: 12.5, dir: "up", color: "green" },
      { label: "Total Expenses", value: 1124300, change: 8.2, dir: "down", color: "red" },
      { label: "Net Profit", value: 718200, change: 18.3, dir: "up", color: "gold" },
      { label: "Cash on Hand", value: 2450000, change: 3.1, dir: "up", color: "cream" }
    ],
    chartMonths: ["Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun"],
    revenueData: [78,82,90,75,85,95,65,71,68,60,73,80],
    expenseData: [65,71,68,60,73,80,78,82,90,75,85,95]
  },

  reports: {
    profitLoss: {
      revenue: [{ name: "Sales Revenue", amount: 1842500 }],
      expenses: [
        { name: "Salaries & Wages", amount: 520000 },
        { name: "Rent & Utilities", amount: 180000 },
        { name: "Office Supplies", amount: 45000 },
        { name: "Marketing & Advertising", amount: 120000 },
        { name: "Professional Fees", amount: 95000 },
        { name: "Depreciation", amount: 24000 },
        { name: "Other Expenses", amount: 140300 }
      ],
      netProfit: 718200
    },
    insights: [
      { label: "Gross Margin", value: "64.2%", pct: 64, color: "var(--green-light)" },
      { label: "Operating Expense Ratio", value: "38.5%", pct: 38.5, color: "var(--gold)" },
      { label: "Net Profit Margin", value: "39.0%", pct: 39, color: "var(--red-light)" },
      { label: "Current Ratio", value: "2.8 : 1", pct: 70, color: "#5ceb9a" }
    ]
  },

  budget: {
    annual: 3200000,
    spent: 2100000,
    remaining: 1100000,
    utilization: 65.6,
    departments: [
      { name: "Operations", budget: 850000, spent: 620000, pct: 73, color: "var(--red-light)" },
      { name: "Marketing", budget: 480000, spent: 310000, pct: 65, color: "var(--gold)" },
      { name: "Human Resources", budget: 720000, spent: 520000, pct: 72, color: "var(--gold)" },
      { name: "Technology", budget: 650000, spent: 380000, pct: 58, color: "var(--green-light)" },
      { name: "Admin & Other", budget: 500000, spent: 270000, pct: 54, color: "var(--green-light)" }
    ]
  },

  summary: {
    outstandingAR: 385000,
    overdueAR: 72000,
    collectedAR: 128500,
    outstandingAP: 312000,
    due30AP: 148000,
    overdueAP: 30500
  }
};
