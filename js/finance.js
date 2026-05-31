/* ─── LedgerFlow Finance Engine ─── */
const Finance = (() => {
  const FMT = (n) => new Intl.NumberFormat('en-ZA').format(n);
  const $ = (n) => `R ${FMT(n)}`;

  /* ─── Depreciation ─── */
  function straightLine(cost, salvage, life) {
    return { annual: (cost - salvage) / life, monthly: (cost - salvage) / life / 12 };
  }
  function decliningBalance(cost, salvage, life, year) {
    const rate = 1 - Math.pow(salvage / cost, 1 / life);
    let book = cost;
    const yearArg = year;
    const years = yearArg ? [yearArg] : Array.from({ length: life }, (_, i) => i + 1);
    const results = [];
    for (let y = 1; y <= (yearArg || life); y++) {
      const dep = Math.max(0, (book - salvage) * rate);
      book = Math.max(salvage, book - dep);
      if (yearArg && y === yearArg) return { year, depreciation: Math.round(dep), bookValue: Math.round(book) };
      if (!yearArg) results.push({ year: y, depreciation: Math.round(dep), bookValue: Math.round(book) });
    }
    return results;
  }
  function sumOfYears(cost, salvage, life, year) {
    const sum = life * (life + 1) / 2;
    const dep = (cost - salvage) * (life - year + 1) / sum;
    return { year, depreciation: Math.round(dep) };
  }

  /* ─── Ratios ─── */
  function currentRatio(currentAssets, currentLiabilities) {
    return { value: currentAssets / currentLiabilities, label: 'Current Ratio' };
  }
  function quickRatio(currentAssets, inventory, currentLiabilities) {
    return { value: (currentAssets - inventory) / currentLiabilities, label: 'Quick Ratio' };
  }
  function grossMargin(revenue, cogs) {
    const pct = ((revenue - cogs) / revenue * 100);
    return { pct: Math.round(pct * 10) / 10, value: `${Math.round(pct * 10) / 10}%`, label: 'Gross Margin' };
  }
  function netProfitMargin(netProfit, revenue) {
    const pct = (netProfit / revenue * 100);
    return { pct: Math.round(pct * 10) / 10, value: `${Math.round(pct * 10) / 10}%`, label: 'Net Profit Margin' };
  }
  function operatingExpenseRatio(opEx, revenue) {
    const pct = (opEx / revenue * 100);
    return { pct: Math.round(pct * 10) / 10, value: `${Math.round(pct * 10) / 10}%`, label: 'Operating Expense Ratio' };
  }
  function debtToEquity(totalLiabilities, totalEquity) {
    const v = totalLiabilities / totalEquity;
    return { value: v.toFixed(2), label: 'Debt-to-Equity' };
  }
  function accountsReceivableTurnover(creditSales, avgAR) {
    return { value: (creditSales / avgAR).toFixed(1), label: 'AR Turnover' };
  }
  function inventoryTurnover(cogs, avgInventory) {
    return { value: (cogs / avgInventory).toFixed(1), label: 'Inventory Turnover' };
  }
  function daysSalesOutstanding(avgAR, creditSales) {
    return { days: Math.round(avgAR / (creditSales / 365)), label: 'DSO' };
  }

  /* ─── Tax Calculations ─── */
  function vatOnAmount(amount, rate = 0.15) {
    return { exclusive: amount / (1 + rate), vat: amount - amount / (1 + rate), inclusive: amount };
  }
  function corporateTax(profit, rate = 0.27) {
    return { tax: Math.round(profit * rate), afterTax: Math.round(profit * (1 - rate)), effectiveRate: rate * 100 };
  }
  function payrollTaxes(grossSalary) {
    const uif = Math.min(grossSalary * 0.01, 177.12);
    const sdl = grossSalary > 0 ? Math.min(grossSalary > 500000 ? grossSalary * 0.01 : 0, 100) : 0;
    return { uif: Math.round(uif * 100) / 100, sdl: Math.round(sdl * 100) / 100, total: Math.round((uif + sdl) * 100) / 100 };
  }

  /* ─── Forecaster ─── */
  function linearForecast(dataPoints, periods) {
    const n = dataPoints.length;
    const sumX = n * (n + 1) / 2;
    const sumY = dataPoints.reduce((a, b) => a + b, 0);
    const sumXY = dataPoints.reduce((a, v, i) => a + v * (i + 1), 0);
    const sumX2 = Array.from({ length: n }, (_, i) => (i + 1) ** 2).reduce((a, b) => a + b, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return Array.from({ length: periods }, (_, i) => Math.round(intercept + slope * (n + i + 1)));
  }
  function growthForecast(currentValue, growthRate, periods) {
    const results = [];
    for (let i = 1; i <= periods; i++) {
      results.push(Math.round(currentValue * Math.pow(1 + growthRate / 100, i)));
    }
    return results;
  }
  function cashFlowForecast(income, expenses, growth, months) {
    const incForecast = growthForecast(income, growth, months);
    const expForecast = growthForecast(expenses, growth * 0.7, months);
    return incForecast.map((inc, i) => ({
      month: `Month ${i + 1}`,
      income: inc,
      expenses: expForecast[i],
      net: inc - expForecast[i],
      cumulative: incForecast.slice(0, i + 1).reduce((a, b) => a + b, 0) - expForecast.slice(0, i + 1).reduce((a, b) => a + b, 0)
    }));
  }

  /* ─── P&L Generator ─── */
  function generatePL(accounts) {
    const revenue = accounts.filter(a => a.type === 'Revenue').reduce((s, a) => s + (a.ytd || a.balance), 0);
    const expenses = accounts.filter(a => a.type === 'Expense').reduce((s, a) => s + (a.ytd || a.balance), 0);
    const gross = accounts.find(a => a.code === '4010');
    const cogs = accounts.filter(a => /^5(0|1)/.test(a.code)).reduce((s, a) => s + (a.ytd || a.balance), 0);
    return {
      revenue: accounts.filter(a => a.type === 'Revenue').map(a => ({ name: a.name, amount: a.ytd || a.balance })),
      expenses: accounts.filter(a => a.type === 'Expense').map(a => ({ name: a.name, amount: a.ytd || a.balance })),
      totalRevenue: revenue,
      totalExpenses: expenses,
      grossProfit: (gross ? (gross.ytd || gross.balance) : revenue) - cogs,
      netProfit: revenue - expenses,
      grossMargin: revenue ? ((revenue - cogs) / revenue * 100).toFixed(1) : '0.0'
    };
  }

  /* ─── Balance Sheet Generator ─── */
  function generateBS(accounts) {
    const assets = accounts.filter(a => a.type === 'Asset').reduce((s, a) => s + a.balance, 0);
    const liabilities = accounts.filter(a => a.type === 'Liability').reduce((s, a) => s + a.balance, 0);
    const equity = accounts.filter(a => a.type === 'Equity' || a.type === 'Revenue' || a.type === 'Expense').reduce((s, a) => {
      if (a.type === 'Expense') return s - a.balance;
      return s + a.balance;
    }, 0);
    return { totalAssets: assets, totalLiabilities: liabilities, totalEquity: equity, balanced: Math.abs(assets - (liabilities + equity)) < 1 };
  }

  /* ─── Trial Balance ─── */
  function trialBalance(accounts, ledger) {
    const debits = ledger.filter(e => e.debit).reduce((s, e) => s + e.debit, 0);
    const credits = ledger.filter(e => e.credit).reduce((s, e) => s + e.credit, 0);
    const accountBalances = accounts.map(a => {
      const dr = ledger.filter(e => e.account === a.name && e.debit).reduce((s, e) => s + e.debit, 0);
      const cr = ledger.filter(e => e.account === a.name && e.credit).reduce((s, e) => s + e.credit, 0);
      return { ...a, debitBalance: dr, creditBalance: cr, balance: (a.type === 'Asset' || a.type === 'Expense') ? dr - cr : cr - dr };
    });
    return { debits, credits, balanced: debits === credits, accountBalances };
  }

  /* ─── Budget Variance ─── */
  function budgetVariance(budget) {
    return budget.departments.map(d => ({
      ...d,
      variance: d.budget - d.spent,
      variancePct: d.budget ? Math.round((d.spent / d.budget) * 100) : 0,
      status: d.spent > d.budget ? 'over' : d.spent > d.budget * 0.85 ? 'warning' : 'on-track'
    }));
  }

  /* ─── Aged Receivables ─── */
  function agingReport(invoices, asOf = new Date()) {
    const buckets = { current: [], '1-30': [], '31-60': [], '61-90': [], '90+': [] };
    invoices.forEach(inv => {
      const due = new Date(inv.due);
      const days = Math.floor((asOf - due) / (1000 * 60 * 60 * 24));
      if (inv.status === 'Paid') return;
      if (days <= 0) buckets.current.push(inv);
      else if (days <= 30) buckets['1-30'].push(inv);
      else if (days <= 60) buckets['31-60'].push(inv);
      else if (days <= 90) buckets['61-90'].push(inv);
      else buckets['90+'].push(inv);
    });
    return Object.entries(buckets).map(([bucket, items]) => ({
      bucket, items, total: items.reduce((s, i) => s + i.amount, 0)
    }));
  }

  /* ─── Amortization Schedule ─── */
  function amortization(principal, annualRate, years) {
    const monthlyRate = annualRate / 12 / 100;
    const payments = years * 12;
    const payment = principal * monthlyRate * Math.pow(1 + monthlyRate, payments) / (Math.pow(1 + monthlyRate, payments) - 1);
    const schedule = [];
    let balance = principal;
    for (let i = 1; i <= payments; i++) {
      const interest = balance * monthlyRate;
      const principalPaid = payment - interest;
      balance -= principalPaid;
      schedule.push({ payment: i, total: Math.round(payment), interest: Math.round(interest), principal: Math.round(principalPaid), balance: Math.max(0, Math.round(balance)) });
    }
    return { monthlyPayment: Math.round(payment), totalInterest: Math.round(payment * payments - principal), totalCost: Math.round(payment * payments), schedule };
  }

  /* ─── Breakeven Analysis ─── */
  function breakeven(fixedCosts, pricePerUnit, variableCostPerUnit) {
    const be = fixedCosts / (pricePerUnit - variableCostPerUnit);
    return { units: Math.ceil(be), revenue: Math.ceil(be * pricePerUnit), price: pricePerUnit, variable: variableCostPerUnit, fixed: fixedCosts };
  }

  /* ─── Public API ─── */
  return {
    $, FMT,
    straightLine, decliningBalance, sumOfYears,
    currentRatio, quickRatio, grossMargin, netProfitMargin,
    operatingExpenseRatio, debtToEquity,
    accountsReceivableTurnover, inventoryTurnover, daysSalesOutstanding,
    vatOnAmount, corporateTax, payrollTaxes,
    linearForecast, growthForecast, cashFlowForecast,
    generatePL, generateBS, trialBalance,
    budgetVariance, agingReport,
    amortization, breakeven
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Finance;
