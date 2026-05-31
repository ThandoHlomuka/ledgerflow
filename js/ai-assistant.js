/* ─── LedgerFlow AI Assistant ─── */
const LedgerAI = (() => {
  /* ─── User Activity Log (Learning) ─── */
  const activityLog = [];
  const userPreferences = JSON.parse(localStorage.getItem('ledgerflow-ai-prefs') || '{}');
  let currentModule = 'dashboard';
  let isOpen = localStorage.getItem('ledgerflow-ai-open') === 'true';

  function track(action, detail) {
    activityLog.push({ action, detail, time: Date.now(), module: currentModule });
    if (activityLog.length > 200) activityLog.shift();
    localStorage.setItem('ledgerflow-ai-log', JSON.stringify(activityLog.slice(-50)));
  }

  function getFrequentModule() {
    const counts = {};
    activityLog.forEach(a => { counts[a.module] = (counts[a.module] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  }

  function setPref(key, value) {
    userPreferences[key] = value;
    localStorage.setItem('ledgerflow-ai-prefs', JSON.stringify(userPreferences));
  }

  function getPref(key, def) { return userPreferences[key] !== undefined ? userPreferences[key] : def; }

  /* ─── Knowledge Base ─── */
  const KB = {
    app: {
      name: 'LedgerFlow',
      version: '1.0.0',
      developer: 'Thando Hlomuka',
      description: 'A full-stack Xero-like accounting and bookkeeping system.',
      modules: [
        { id: 'dashboard', name: 'Dashboard', desc: 'Financial overview with revenue, expenses, profit, cash stats, charts, and recent activity.' },
        { id: 'accounts', name: 'Chart of Accounts', desc: 'Manage general ledger accounts — assets, liabilities, equity, revenue, expenses.' },
        { id: 'ledger', name: 'General Ledger', desc: 'View all posted transactions with debit/credit entries.' },
        { id: 'receivables', name: 'Accounts Receivable', desc: 'Track customer invoices, outstanding amounts, and collections.' },
        { id: 'payables', name: 'Accounts Payable', desc: 'Track supplier bills, due payments, and overdue amounts.' },
        { id: 'banking', name: 'Bank Accounts', desc: 'Manage connected bank accounts and view transactions.' },
        { id: 'journal', name: 'Journal Entries', desc: 'Record adjusting entries, accruals, and corrections with a quick-entry form.' },
        { id: 'reports', name: 'Financial Reports', desc: 'Generate P&L, Balance Sheet, Trial Balance, Cash Flow, and Aged Receivables.' },
        { id: 'budget', name: 'Budget & Planning', desc: 'Create and track departmental budgets with variance analysis.' },
        { id: 'settings', name: 'Settings', desc: 'Organisation details, tax info, fiscal year, currency, and preferences.' }
      ]
    },
    features: {
      shortcuts: { '1-9': 'Switch modules (1=Dashboard through 9=Budget)', '0': 'Settings', 'Ctrl+K': 'Focus search' },
      theme: 'Light/Dark mode toggled from sidebar or header button, persisted in localStorage.',
      data: 'All data loaded from /api/* serverless endpoints. Falls back to hardcoded data when offline.'
    }
  };

  /* ─── Cached Data (populated on load) ─── */
  let cachedData = null;

  /* ─── Intent Parser ─── */
  function parseIntent(text) {
    const t = text.toLowerCase().trim();

    /* Navigation */
    const navMap = { dashboard: 0, accounts: 1, ledger: 2, receivables: 3, 'ar': 3, payables: 4, 'ap': 4, banking: 5, journal: 6, reports: 7, budget: 8, settings: 9 };
    for (const [key, idx] of Object.entries(navMap)) {
      if (new RegExp(`^(go to|show|open|switch to|navigate to|take me to)\\s+${key}`).test(t) ||
          new RegExp(`^${key}\\s+(module|page|section)$`).test(t)) {
        return { intent: 'navigate', module: key, idx };
      }
    }

    /* Module Navigation */
    const explicitNav = ['dashboard', 'accounts', 'ledger', 'receivables', 'payables', 'banking', 'journal', 'reports', 'budget', 'settings'];
    for (const m of explicitNav) {
      if (t === m || t === `show ${m}` || t === `go to ${m}`) {
        return { intent: 'navigate', module: m };
      }
    }

    /* Financial Queries */
    if (/\b(cash|balance|money|bank)\b/.test(t) && /\b(show|what|how much|tell)\b/.test(t)) {
      return { intent: 'query', type: 'cash' };
    }
    if (/\b(revenue|income|sales)\b/.test(t) && /\b(show|what|total|how much)\b/.test(t)) {
      return { intent: 'query', type: 'revenue' };
    }
    if (/\b(expense|spend|cost)\b/.test(t) && /\b(show|what|total|how much)\b/.test(t)) {
      return { intent: 'query', type: 'expense' };
    }
    if (/\b(profit|net)\b/.test(t)) {
      return { intent: 'query', type: 'profit' };
    }
    if (/\b(gross margin|profit margin|margin)\b/.test(t)) {
      return { intent: 'query', type: 'margin' };
    }
    if (/\b(ratio|current ratio|quick ratio|debt)\b/.test(t)) {
      return { intent: 'query', type: 'ratios' };
    }
    if (/\b(invoice|outstanding|unpaid|customer.*owe)\b/.test(t)) {
      return { intent: 'query', type: 'receivables' };
    }
    if (/\b(bill|payable|supplier.*owe|what.*we.*owe)\b/.test(t)) {
      return { intent: 'query', type: 'payables' };
    }
    if (/\b(vat|tax)\b/.test(t) && /\b(calculate|what|how much)\b/.test(t)) {
      return { intent: 'calculate', type: 'vat' };
    }
    if (/\b(depreciation|depreciate)\b/.test(t)) {
      return { intent: 'calculate', type: 'depreciation' };
    }
    if (/\b(loan|amortization|mortgage|repayment)\b/.test(t)) {
      return { intent: 'calculate', type: 'amortization' };
    }
    if (/\b(forecast|predict|projection|future)\b/.test(t)) {
      return { intent: 'generate', type: 'forecast' };
    }
    if (/\b(breakeven|break.even|break.?even)\b/.test(t)) {
      return { intent: 'calculate', type: 'breakeven' };
    }
    if (/\b(budget|variance|department)\b/.test(t) && /\b(how|show|compare|status)\b/.test(t)) {
      return { intent: 'query', type: 'budget' };
    }
    if (/\b(pl|profit.*loss|income statement|p&l)\b/.test(t)) {
      return { intent: 'generate', type: 'pl' };
    }
    if (/\b(balance sheet)\b/.test(t)) {
      return { intent: 'generate', type: 'bs' };
    }
    if (/\b(trial balance)\b/.test(t)) {
      return { intent: 'generate', type: 'tb' };
    }
    if (/\b(aging|aged|overdue|outstanding)\b/.test(t)) {
      return { intent: 'query', type: 'aging' };
    }
    if (/\b(help|what can you do|capabilities|commands)\b/.test(t)) {
      return { intent: 'help' };
    }
    if (/\b(hello|hi|hey|good morning|good afternoon)\b/.test(t)) {
      return { intent: 'greeting' };
    }
    if (/\b(thank|thanks|appreciate)\b/.test(t)) {
      return { intent: 'thanks' };
    }
    if (/\b(who are you|what are you|your name)\b/.test(t)) {
      return { intent: 'intro' };
    }

    /* Module-specific quick checks */
    if (/\b(account)\b/.test(t) && /\b(how many|list|show)\b/.test(t)) {
      return { intent: 'query', type: 'accounts' };
    }

    return { intent: 'unknown' };
  }

  /* ─── Response Generator ─── */
  function generateResponse(parsed) {
    const data = cachedData;
    if (!data) return { text: "I'm still loading the data. Give me a moment to fetch everything.", action: null };

    switch (parsed.intent) {

      case 'greeting': {
        const hour = new Date().getHours();
        const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
        return {
          text: `${greet}, Thando! I'm your LedgerFlow AI assistant. I can help you navigate the app, generate reports, run calculations, or provide financial insights. Try asking "what can you do" to see my capabilities.`,
          action: null
        };
      }

      case 'intro': {
        return {
          text: `I'm LedgerAI, your intelligent accounting assistant built into LedgerFlow. I know every module, every shortcut, and all your financial data. I can help you navigate, generate reports, forecast cash flow, calculate ratios, and even automate recurring tasks.`,
          action: null
        };
      }

      case 'thanks': {
        return { text: "You're welcome, Thando! Let me know if you need anything else.", action: null };
      }

      case 'help': {
        const modList = KB.app.modules.map(m => `<strong>${m.id}</strong> — ${m.desc}`).join('<br>');
        return {
          text: `Here's what I can do:<br><br>
<strong>Navigate:</strong> "Go to reports", "Show dashboard", "Open banking"<br>
<strong>Query data:</strong> "What's my cash position?", "Show revenue", "Any overdue invoices?"<br>
<strong>Generate reports:</strong> "Create P&L", "Balance sheet", "Trial balance", "Forecast next quarter"<br>
<strong>Calculations:</strong> "Calculate VAT on R 10,000", "Depreciation for R 500k asset", "Loan amortization"<br>
<strong>Ratios:</strong> "Show me my ratios", "Current ratio", "Gross margin"<br>
<strong>Budget:</strong> "Budget variance", "How are departments tracking?"<br><br>
<strong>Keyboard Shortcuts:</strong><br>${Object.entries(KB.features.shortcuts).map(([k, v]) => `${k}: ${v}`).join('<br>')}<br><br>
<strong>Modules:</strong><br>${modList}`,
          action: null
        };
      }

      case 'navigate': {
        const mod = parsed.module;
        const info = KB.app.modules.find(m => m.id === mod);
        return {
          text: info ? `Navigating to <strong>${info.name}</strong>. ${info.desc}` : `Switching to ${mod}.`,
          action: { type: 'navigate', module: mod }
        };
      }

      case 'query': {
        switch (parsed.type) {

          case 'cash': {
            const cash = data.dash?.stats?.[3];
            const bankAcc = data.banking?.accounts;
            if (cash) {
              let detail = '';
              if (bankAcc) detail = bankAcc.map(a => `${a.name}: R ${Finance.FMT(a.balance)}`).join(', ');
              return { text: `Your <strong>cash position</strong> is <strong class="text-green">R ${Finance.FMT(cash.value)}</strong> (${cash.dir === 'up' ? '&#9650;' : '&#9660;'} ${cash.change}%). ${detail ? 'Breakdown: ' + detail : ''}`, action: null };
            }
            return { text: "I don't have cash data available right now.", action: null };
          }

          case 'revenue': {
            const rev = data.dash?.stats?.[0];
            if (rev) return { text: `Your <strong>total revenue</strong> is <strong class="text-green">R ${Finance.FMT(rev.value)}</strong>, ${rev.dir === 'up' ? 'up' : 'down'} ${rev.change}% vs last month.`, action: null };
            return { text: 'Revenue data not available.', action: null };
          }

          case 'expense': {
            const exp = data.dash?.stats?.[1];
            if (exp) return { text: `Your <strong>total expenses</strong> are <strong class="text-red">R ${Finance.FMT(exp.value)}</strong>, ${exp.dir === 'up' ? 'up' : 'down'} ${exp.change}% vs last month.`, action: null };
            return { text: 'Expense data not available.', action: null };
          }

          case 'profit': {
            const profit = data.dash?.stats?.[2];
            if (profit) return { text: `Your <strong>net profit</strong> is <strong class="text-gold">R ${Finance.FMT(profit.value)}</strong>, ${profit.dir === 'up' ? 'up' : 'down'} ${profit.change}% vs last month.`, action: null };
            return { text: 'Profit data not available.', action: null };
          }

          case 'margin': {
            if (data.reports?.profitLoss) {
              const pl = data.reports.profitLoss;
              const gp = Finance.grossMargin(pl.revenue.reduce((s, r) => s + r.amount, 0), pl.expenses.reduce((s, e) => s + e.amount, 0));
              const np = Finance.netProfitMargin(pl.netProfit, pl.revenue.reduce((s, r) => s + r.amount, 0));
              return { text: `<strong>Gross Margin:</strong> ${gp.value}<br><strong>Net Profit Margin:</strong> ${np.value}`, action: null };
            }
            return { text: 'Margin data not available.', action: null };
          }

          case 'ratios': {
            const accounts = data.accounts;
            if (accounts) {
              const ca = accounts.filter(a => a.type === 'Asset' && /cash|bank|receivable|inventory/i.test(a.name)).reduce((s, a) => s + a.balance, 0);
              const cl = accounts.filter(a => a.type === 'Liability').reduce((s, a) => s + a.balance, 0);
              const inv = accounts.find(a => a.name === 'Inventory')?.balance || 0;
              const cr = Finance.currentRatio(ca, cl);
              const qr = Finance.quickRatio(ca, inv, cl);
              const de = Finance.debtToEquity(cl, accounts.filter(a => a.type === 'Equity').reduce((s, a) => s + a.balance, 0));
              return { text: `<strong>${cr.label}:</strong> ${cr.value.toFixed(2)}<br><strong>${qr.label}:</strong> ${qr.value.toFixed(2)}<br><strong>${de.label}:</strong> ${de.value}`, action: null };
            }
            return { text: 'Ratio data not available.', action: null };
          }

          case 'receivables': {
            if (data.invoices) {
              const overdue = data.invoices.filter(i => i.status === 'Overdue');
              const pending = data.invoices.filter(i => i.status === 'Pending');
              const totalOut = overdue.reduce((s, i) => s + i.amount, 0) + pending.reduce((s, i) => s + i.amount, 0);
              let detail = '';
              if (overdue.length) detail += `<br><span class="text-red">Overdue:</span> ${overdue.map(i => `${i.id} (${i.customer} — R ${Finance.FMT(i.amount)})`).join(', ')}`;
              if (pending.length) detail += `<br><span class="text-gold">Pending:</span> ${pending.map(i => `${i.id} (${i.customer} — R ${Finance.FMT(i.amount)})`).join(', ')}`;
              return { text: `Total outstanding: <strong class="text-red">R ${Finance.FMT(totalOut)}</strong> across ${overdue.length + pending.length} invoices.${detail}`, action: null };
            }
            return { text: 'Invoice data not available.', action: null };
          }

          case 'payables': {
            if (data.bills) {
              const overdue = data.bills.filter(b => b.status === 'Overdue');
              const pending = data.bills.filter(b => b.status === 'Pending');
              const total = overdue.reduce((s, b) => s + b.amount, 0) + pending.reduce((s, b) => s + b.amount, 0);
              let d = '';
              if (overdue.length) d += `<br><span class="text-red">Overdue:</span> ${overdue.map(b => `${b.id} (${b.supplier} — R ${Finance.FMT(b.amount)})`).join(', ')}`;
              if (pending.length) d += `<br><span class="text-gold">Pending:</span> ${pending.map(b => `${b.id} (${b.supplier} — R ${Finance.FMT(b.amount)})`).join(', ')}`;
              return { text: `Total payables: <strong class="text-red">R ${Finance.FMT(total)}</strong> across ${overdue.length + pending.length} bills.${d}`, action: null };
            }
            return { text: 'Bills data not available.', action: null };
          }

          case 'budget': {
            if (data.budget) {
              const v = Finance.budgetVariance(data.budget);
              const lines = v.map(d => `${d.name}: <span class="${d.status === 'over' ? 'text-red' : d.status === 'warning' ? 'text-gold' : 'text-green'}">${d.variancePct}% used</span> (R ${Finance.FMT(d.spent)} of R ${Finance.FMT(d.budget)})`).join('<br>');
              return { text: `<strong>Budget Overview:</strong> ${data.budget.utilization}% utilised overall.<br>${lines}`, action: null };
            }
            return { text: 'Budget data not available.', action: null };
          }

          case 'accounts': {
            if (data.accounts) {
              return { text: `You have <strong>${data.accounts.length} accounts</strong> in your chart: ${data.accounts.filter(a => a.type === 'Asset').length} Assets, ${data.accounts.filter(a => a.type === 'Liability').length} Liabilities, ${data.accounts.filter(a => a.type === 'Equity').length} Equity, ${data.accounts.filter(a => a.type === 'Revenue').length} Revenue, ${data.accounts.filter(a => a.type === 'Expense').length} Expenses.`, action: null };
            }
            return { text: 'Account data not available.', action: null };
          }

          case 'aging': {
            if (data.invoices) {
              const report = Finance.agingReport(data.invoices);
              const lines = report.map(r => `${r.bucket}: <span class="${r.bucket === 'current' ? 'text-green' : 'text-red'}">R ${Finance.FMT(r.total)}</span> (${r.items.length} invoices)`).join('<br>');
              return { text: `<strong>Aged Receivables:</strong><br>${lines}`, action: null };
            }
            return { text: 'Aging data not available.', action: null };
          }

          default: return { text: "I'm not sure what data you're looking for. Could you be more specific?", action: null };
        }
      }

      case 'calculate': {
        switch (parsed.type) {
          case 'vat': {
            return { text: '<strong>VAT Calculator:</strong> Try "Calculate VAT on R 10,000" — I\'ll compute the exclusive, VAT, and inclusive amounts.<br><br>Example: On R 10,000 inclusive of 15% VAT:<br>Exclusive: R 8,695.65<br>VAT: R 1,304.35<br>Inclusive: R 10,000.00', action: null };
          }
          case 'depreciation': {
            return { text: '<strong>Depreciation Calculator:</strong> I support three methods:<br>• Straight Line: "Straight line R 500k cost R 50k salvage 5 years"<br>• Declining Balance: "Declining balance R 500k cost R 50k salvage 5 year 3"<br>• Sum of Years: "Sum of years R 500k cost R 50k salvage 5 years year 2"', action: null };
          }
          case 'amortization': {
            return { text: '<strong>Loan Amortization:</strong> Try "Amortize R 500,000 at 12% over 20 years" and I\'ll generate a full schedule.', action: null };
          }
          case 'breakeven': {
            return { text: '<strong>Breakeven Analysis:</strong> Try "Breakeven R 100k fixed R 50 price R 30 variable" and I\'ll calculate your breakeven point.', action: null };
          }
          default: return { text: 'I can help with VAT, depreciation, amortization, and breakeven calculations. Try asking specifically!', action: null };
        }
      }

      case 'generate': {
        switch (parsed.type) {
          case 'forecast': {
            if (data.dash) {
              const f = Finance.cashFlowForecast(data.dash.stats[0].value, data.dash.stats[1].value, 5, 6);
              const lines = f.map(m => `${m.month}: Income R ${Finance.FMT(m.income)}, Expenses R ${Finance.FMT(m.expenses)}, Net R ${Finance.FMT(m.net)}`).join('<br>');
              return { text: `<strong>6-Month Cash Flow Forecast</strong> (projected 5% growth):<br>${lines}<br><br>Ending cumulative position: <strong class="${f[f.length - 1].cumulative > 0 ? 'text-green' : 'text-red'}">R ${Finance.FMT(f[f.length - 1].cumulative)}</strong>`, action: null };
            }
            return { text: 'Not enough data to generate a forecast.', action: null };
          }

          case 'pl': {
            if (data.accounts) {
              const pl = Finance.generatePL(data.accounts);
              const lines = [
                `<strong>Revenue</strong>`,
                ...pl.revenue.map(r => `  ${r.name}: R ${Finance.FMT(r.amount)}`),
                `<strong>Total Revenue: R ${Finance.FMT(pl.totalRevenue)}</strong>`,
                ``,
                `<strong>Expenses</strong>`,
                ...pl.expenses.map(e => `  ${e.name}: R ${Finance.FMT(e.amount)}`),
                `<strong>Total Expenses: R ${Finance.FMT(pl.totalExpenses)}</strong>`,
                ``,
                `<strong class="text-gold">Net Profit: R ${Finance.FMT(pl.netProfit)}</strong>`,
                `<span class="text-muted">Gross Margin: ${pl.grossMargin}%</span>`
              ].join('<br>');
              return { text: `<strong>Profit &amp; Loss Statement</strong><br>${lines}`, action: { type: 'navigate', module: 'reports' } };
            }
            return { text: 'Account data not available for P&L generation.', action: null };
          }

          case 'bs': {
            if (data.accounts) {
              const bs = Finance.generateBS(data.accounts);
              return { text: `<strong>Balance Sheet</strong><br>Total Assets: <strong class="text-green">R ${Finance.FMT(bs.totalAssets)}</strong><br>Total Liabilities: <strong class="text-red">R ${Finance.FMT(bs.totalLiabilities)}</strong><br>Total Equity: <strong class="text-green">R ${Finance.FMT(bs.totalEquity)}</strong><br>${bs.balanced ? '<span class="text-green">&#10003; Balanced</span>' : '<span class="text-red">&#10007; Not Balanced</span>'}`, action: { type: 'navigate', module: 'reports' } };
            }
            return { text: 'Account data not available.', action: null };
          }

          case 'tb': {
            if (data.accounts && data.ledger) {
              const tb = Finance.trialBalance(data.accounts, data.ledger);
              const lines = tb.accountBalances.map(a => `${a.code} ${a.name}: <span class="${a.balance >= 0 ? 'text-green' : 'text-red'}">R ${Finance.FMT(Math.abs(a.balance))}</span> ${a.balance >= 0 ? 'Dr' : 'Cr'}`).join('<br>');
              return { text: `<strong>Trial Balance</strong><br>Total Debits: <strong>R ${Finance.FMT(tb.debits)}</strong><br>Total Credits: <strong>R ${Finance.FMT(tb.credits)}</strong><br>${tb.balanced ? '<span class="text-green">&#10003; Balanced</span>' : '<span class="text-red">&#10007; Difference: R ' + Finance.FMT(Math.abs(tb.debits - tb.credits)) + '</span>'}<br><br>${lines}`, action: { type: 'navigate', module: 'reports' } };
            }
            return { text: 'Not enough data for trial balance.', action: null };
          }

          default: return { text: 'I can generate P&L, Balance Sheet, Trial Balance, and Cash Flow Forecasts. Try asking specifically!', action: null };
        }
      }

      default: {
        return { text: "I'm not sure I understand. Try asking me to navigate somewhere, check your finances, or generate a report. Say \"help\" to see all my capabilities.", action: null };
      }
    }
  }

  /* ─── Chat Engine ─── */
  async function chat(userMessage) {
    track('chat', userMessage);

    const parsed = parseIntent(userMessage);

    if (!cachedData) {
      try {
        const [dash, accounts, ledger, invoices, bills, banking, journal, reports, budget] = await Promise.all([
          API.dashboard(), API.accounts(), API.ledger(), API.invoices(),
          API.bills(), API.banking(), API.journal(), API.reports(), API.budget()
        ]);
        cachedData = normalizeData({ dash, accounts, ledger, invoices, bills, banking, journal, reports, budget });
      } catch { /* use null */ }
    }

    const response = generateResponse(parsed);

    if (response.action?.type === 'navigate' && typeof window.switchModule === 'function') {
      window.switchModule(response.action.module);
    }

    return {
      user: userMessage,
      bot: response.text,
      action: response.action
    };
  }

  /* ─── Proactive Suggestions ─── */
  function getSuggestion() {
    const freq = getFrequentModule();
    const log = activityLog;

    if (log.length < 5) return { text: "Welcome to LedgerFlow! I'm here to help. Try asking me something!", priority: 'low' };

    const hasOverdue = cachedData?.invoices?.some(i => i.status === 'Overdue');
    if (hasOverdue) return { text: "You have overdue invoices. Would you like me to show you the aged receivables report?", priority: 'high', action: { type: 'navigate', module: 'reports' } };

    const recentJournal = log.filter(a => a.action === 'journal' || a.module === 'journal');
    if (recentJournal.length > 3) return { text: "You've been posting journal entries. I can generate a trial balance to verify your books are balanced.", priority: 'medium', action: { type: 'navigate', module: 'reports' } };

    if (freq && freq !== 'dashboard') {
      const mod = KB.app.modules.find(m => m.id === freq);
      return { text: mod ? `You spend a lot of time in ${mod.name}. I can generate a ${mod.id === 'budget' ? 'variance report' : mod.id === 'receivables' ? 'aging report' : 'P&L statement'} for you.` : '', priority: 'low' };
    }

    return null;
  }

  /* ─── Set Current Module (called from main.js) ─── */
  function setCurrentModule(id) {
    currentModule = id;
    track('navigate', id);
  }

  /* ─── Widget State ─── */
  function toggle() {
    isOpen = !isOpen;
    localStorage.setItem('ledgerflow-ai-open', isOpen);
    return isOpen;
  }

  function getState() { return isOpen; }

  function normalizeData(data) {
    if (!data) return data;
    return {
      dash: data.dash,
      accounts: data.accounts,
      ledger: data.ledger,
      invoices: data.invoices?.invoices || data.invoices,
      bills: data.bills?.bills || data.bills,
      banking: data.banking,
      journal: data.journal?.entries || data.journal,
      reports: data.reports,
      budget: data.budget
    };
  }

  function injectDependencies(data) {
    cachedData = normalizeData(data) || cachedData;
  }

  /* ─── Reinitialize from stored log ─── */
  try {
    const stored = JSON.parse(localStorage.getItem('ledgerflow-ai-log') || '[]');
    activityLog.push(...stored);
  } catch { /* ignore */ }

  return {
    chat,
    getSuggestion,
    setCurrentModule,
    toggle,
    getState,
    injectDependencies,
    track
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LedgerAI;
