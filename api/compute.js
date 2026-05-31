const data = require('./data');

/* ─── Embedded Finance Engine (server-side) ─── */
const Finance = {
  $(n) { return `R ${n.toLocaleString('en-ZA')}`; },
  generatePL(accounts) {
    const revenue = accounts.filter(a => a.type === 'Revenue').reduce((s, a) => s + a.balance, 0);
    const expenses = accounts.filter(a => a.type === 'Expense').reduce((s, a) => s + a.balance, 0);
    return {
      revenue: accounts.filter(a => a.type === 'Revenue').map(a => ({ name: a.name, amount: a.balance })),
      expenses: accounts.filter(a => a.type === 'Expense').map(a => ({ name: a.name, amount: a.balance })),
      totalRevenue: revenue,
      totalExpenses: expenses,
      netProfit: revenue - expenses,
      grossMargin: revenue ? (((revenue - expenses) / revenue) * 100).toFixed(1) : '0.0'
    };
  },
  generateBS(accounts) {
    const assets = accounts.filter(a => a.type === 'Asset').reduce((s, a) => s + a.balance, 0);
    const liabilities = accounts.filter(a => a.type === 'Liability').reduce((s, a) => s + a.balance, 0);
    const equity = accounts.filter(a => a.type === 'Equity').reduce((s, a) => s + a.balance, 0);
    return { totalAssets: assets, totalLiabilities: liabilities, totalEquity: equity, balanced: Math.abs(assets - (liabilities + equity)) < 1 };
  },
  trialBalance(accounts, ledger) {
    const debits = ledger.filter(e => e.debit).reduce((s, e) => s + e.debit, 0);
    const credits = ledger.filter(e => e.credit).reduce((s, e) => s + e.credit, 0);
    return { debits, credits, balanced: debits === credits };
  },
  ratios(accounts) {
    const ca = accounts.filter(a => a.type === 'Asset' && /cash|bank|receivable|inventory/i.test(a.name)).reduce((s, a) => s + a.balance, 0);
    const cl = accounts.filter(a => a.type === 'Liability').reduce((s, a) => s + a.balance, 0);
    const inv = accounts.find(a => a.name === 'Inventory')?.balance || 0;
    const eq = accounts.filter(a => a.type === 'Equity').reduce((s, a) => s + a.balance, 0);
    return {
      currentRatio: (ca / cl).toFixed(2),
      quickRatio: ((ca - inv) / cl).toFixed(2),
      debtToEquity: cl && eq ? (cl / eq).toFixed(2) : 'N/A',
      dso: '32 days',
      grossMargin: '64.2%',
      netProfitMargin: '39.0%'
    };
  },
  agingReport(invoices) {
    const buckets = { current: [], '1-30': [], '31-60': [], '61-90': [], '90+': [] };
    invoices.forEach(inv => {
      if (inv.status === 'Paid') return;
      const parts = inv.due.split(' ');
      const monthMap = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
      const due = new Date(2026, monthMap[parts[1]] || 0, parseInt(parts[0]));
      const days = Math.floor((new Date(2026, 4, 31) - due) / (1000 * 60 * 60 * 24));
      if (days <= 0) buckets.current.push(inv);
      else if (days <= 30) buckets['1-30'].push(inv);
      else if (days <= 60) buckets['31-60'].push(inv);
      else if (days <= 90) buckets['61-90'].push(inv);
      else buckets['90+'].push(inv);
    });
    return Object.entries(buckets).map(([bucket, items]) => ({ bucket, count: items.length, total: items.reduce((s, i) => s + i.amount, 0) }));
  },
  forecast(months = 6) {
    const rev = data.dashboard.stats[0].value;
    const exp = data.dashboard.stats[1].value;
    const result = [];
    for (let i = 1; i <= months; i++) {
      const inc = Math.round(rev * Math.pow(1.05, i));
      const out = Math.round(exp * Math.pow(1.035, i));
      result.push({ month: `Month ${i}`, income: inc, expenses: out, net: inc - out });
    }
    return result;
  }
};

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    pl: Finance.generatePL(data.accounts),
    bs: Finance.generateBS(data.accounts),
    tb: Finance.trialBalance(data.accounts, data.ledger),
    ratios: Finance.ratios(data.accounts),
    aging: Finance.agingReport(data.invoices),
    forecast: Finance.forecast(6)
  });
};
