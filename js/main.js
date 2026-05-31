/* ─── Formatting Helpers ─── */
const FMT = {
  rand(n) { return new Intl.NumberFormat('en-ZA').format(n); },
  money(n) { return `R ${this.rand(n)}`; },
  status(s) {
    const cls = s.toLowerCase();
    return `<span class="status ${cls}"><span class="status-dot"></span>${s}</span>`;
  }
};

/* ─── Render: Dashboard Stats ─── */
function renderStats(stats) {
  const map = ['stat-revenue','stat-expenses','stat-profit','stat-cash'];
  const changeMap = ['stat-revenue-change','stat-expenses-change','stat-profit-change','stat-cash-change'];
  stats.forEach((s, i) => {
    const el = document.getElementById(map[i]);
    if (el) { el.textContent = FMT.money(s.value); el.className = `stat-card-value ${s.color === 'cream' ? '' : 'text-'+s.color}`; }
    const ce = document.getElementById(changeMap[i]);
    if (ce) { ce.innerHTML = `${s.dir === 'up' ? '&#9650;' : '&#9660;'} ${s.change}% vs last month`; ce.className = `stat-card-change ${s.dir}`; }
  });
}

/* ─── Render: Chart ─── */
function renderChart(data) {
  const container = document.getElementById('revenueChart');
  if (!container) return;
  container.innerHTML = '';
  data.revenueData.forEach((h, i) => {
    const bar = document.createElement('div');
    bar.className = 'chart-bar green';
    bar.style.height = '0%';
    bar.innerHTML = `<span class="tooltip">R ${Math.round(h * 1960)}</span>`;
    container.appendChild(bar);
    const bar2 = document.createElement('div');
    bar2.className = 'chart-bar red';
    bar2.style.height = '0%';
    bar2.innerHTML = `<span class="tooltip">R ${Math.round(data.expenseData[i] * 1960)}</span>`;
    container.appendChild(bar2);
  });
  // Animate
  setTimeout(() => {
    const bars = container.querySelectorAll('.chart-bar');
    bars.forEach((bar, i) => {
      const d = i % 2 === 0 ? data.revenueData : data.expenseData;
      bar.style.height = d[Math.floor(i/2)] + '%';
    });
  }, 150);
  // Labels
  const labelsEl = document.getElementById('chart-labels');
  if (labelsEl) labelsEl.innerHTML = data.chartMonths.map(m => `<span>${m}</span>`).join('');
}

/* ─── Render: Activity ─── */
function renderActivity(activities) {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;
  feed.innerHTML = activities.map(a => `
    <div class="activity-item">
      <span class="activity-dot ${a.dot}"></span>
      <div class="activity-content">
        <p>${a.text}</p>
        <div class="time">${a.time}</div>
      </div>
    </div>
  `).join('');
}

/* ─── Render: Table (generic) ─── */
function renderTable(id, rows, cols) {
  const tbody = document.getElementById(id);
  if (!tbody) return;
  tbody.innerHTML = rows.map(r => {
    const cells = cols.map(c => {
      if (c === '_status') return `<td>${FMT.status(r.status)}</td>`;
      if (c.startsWith('money:')) {
        const key = c.replace('money:','');
        const cls = r[key] && r[key] > 0 ? 'font-mono font-bold' : '';
        return `<td class="text-right ${cls}">${r[key] ? FMT.money(r[key]) : '—'}</td>`;
      }
      if (c.startsWith('mono:')) {
        const key = c.replace('mono:','');
        return `<td class="text-right font-mono">${r[key] ? FMT.money(r[key]) : '—'}</td>`;
      }
      if (c.startsWith('mono-cr:')) {
        const key = c.replace('mono-cr:','');
        const color = r[key] && r[key] > 0 ? 'text-green' : 'text-red';
        const abs = Math.abs(r[key] || 0);
        return `<td class="text-right font-mono ${color}">${abs ? FMT.money(abs) : '—'}</td>`;
      }
      if (c === 'indent-bold') return `<td><span class="indent font-bold">${r.name}</span></td>`;
      if (c === 'indent') return `<td><span class="indent-2">${r.name}</span></td>`;
      return `<td>${r[c] || ''}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
}

/* ─── Render: Accounts (special) ─── */
function renderAccounts(accounts) {
  const tbody = document.getElementById('accounts-body');
  if (!tbody) return;
  tbody.innerHTML = accounts.map(a => {
    const indent = a.indent === 0 ? (a.bold ? 'indent font-bold' : 'indent') : 'indent-2';
    const color = a.type === 'Asset' ? 'text-green' : a.type === 'Liability' ? 'text-red' : a.type === 'Expense' ? 'text-red' : a.type === 'Revenue' ? 'text-green' : '';
    return `<tr class="account-row"><td>${a.code}</td><td><span class="${indent}">${a.name}</span></td><td>${a.type}</td><td class="text-right font-mono font-bold ${color}">${FMT.money(a.balance)}</td></tr>`;
  }).join('');
}

/* ─── Render: GL Ledger ─── */
function renderLedger(entries) {
  const tbody = document.getElementById('ledger-body');
  if (!tbody) return;
  tbody.innerHTML = entries.map(e => `
    <tr>
      <td>${e.date}</td>
      <td class="font-bold">${e.entry}</td>
      <td>${e.account}</td>
      <td>${e.desc}</td>
      <td class="text-right font-mono">${e.debit ? FMT.money(e.debit) : '—'}</td>
      <td class="text-right font-mono">${e.credit ? FMT.money(e.credit) : '—'}</td>
    </tr>
  `).join('');
}

/* ─── Render: Invoices ─── */
function renderInvoices(data) {
  ['inv-outstanding','inv-overdue','inv-collected'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const key = id.replace('inv-','');
    el.textContent = FMT.money(data.summary[key]);
  });
  const tbody = document.getElementById('invoices-body');
  if (!tbody) return;
  tbody.innerHTML = data.invoices.map(inv => `
    <tr>
      <td class="font-bold">${inv.id}</td>
      <td>${inv.customer}</td>
      <td class="font-mono font-bold">${FMT.money(inv.amount)}</td>
      <td>${inv.issue}</td>
      <td>${inv.due}</td>
      <td>${FMT.status(inv.status)}</td>
    </tr>
  `).join('');
}

/* ─── Render: Bills ─── */
function renderBills(data) {
  ['bill-outstanding','bill-due30','bill-overdue'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const key = id.replace('bill-','');
    el.textContent = FMT.money(data.summary[key]);
  });
  const tbody = document.getElementById('bills-body');
  if (!tbody) return;
  tbody.innerHTML = data.bills.map(b => `
    <tr>
      <td class="font-bold">${b.id}</td>
      <td>${b.supplier}</td>
      <td class="font-mono font-bold">${FMT.money(b.amount)}</td>
      <td>${b.issue}</td>
      <td>${b.due}</td>
      <td>${FMT.status(b.status)}</td>
    </tr>
  `).join('');
}

/* ─── Render: Banking ─── */
function renderBanking(data) {
  const container = document.getElementById('bank-accounts');
  if (container) {
    const colors = ['green','gold'];
    container.innerHTML = data.accounts.map((a, i) => `
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">${a.name}</span>
          <span class="stat-card-icon ${colors[i]}">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/></svg>
          </span>
        </div>
        <div class="stat-card-value">${FMT.money(a.balance)}</div>
        <div class="stat-card-label">${'•'.repeat(4)} ${a.last4}</div>
      </div>
    `).join('');
  }
  const tbody = document.getElementById('bank-transactions-body');
  if (!tbody) return;
  tbody.innerHTML = data.transactions.map(t => `
    <tr>
      <td>${t.date}</td>
      <td>${t.desc}</td>
      <td>${t.account}</td>
      <td class="text-right font-mono ${t.type === 'credit' ? 'text-green' : 'text-red'}">${t.type === 'credit' ? FMT.money(t.amount) : '-' + FMT.money(t.amount)}</td>
    </tr>
  `).join('');
}

/* ─── Render: Journal Entries ─── */
function renderJournal(data) {
  const tbody = document.getElementById('journal-entries-body');
  if (!tbody) return;
  tbody.innerHTML = data.entries.map(e => `
    <tr>
      <td>${e.date}</td>
      <td class="font-bold">${e.entry}</td>
      <td>${e.desc}</td>
      <td class="text-right font-mono">${FMT.money(e.totalDebit)}</td>
      <td class="text-right font-mono">${FMT.money(e.totalCredit)}</td>
    </tr>
  `).join('');
}

/* ─── Render: P&L Report ─── */
function renderReports(data) {
  const plBody = document.getElementById('pl-body');
  if (plBody) {
    const totalRev = data.profitLoss.revenue.reduce((s, r) => s + r.amount, 0);
    const totalExp = data.profitLoss.expenses.reduce((s, e) => s + e.amount, 0);
    let html = '<tr><td class="font-bold">Revenue</td><td class="text-right"></td></tr>';
    data.profitLoss.revenue.forEach(r => {
      html += `<tr><td><span class="indent">${r.name}</span></td><td class="text-right font-mono font-bold text-green">${FMT.money(r.amount)}</td></tr>`;
    });
    html += `<tr><td style="border-bottom:2px solid var(--border);"><span class="indent font-bold">Total Revenue</span></td><td class="text-right font-mono font-bold text-green" style="border-bottom:2px solid var(--border);">${FMT.money(totalRev)}</td></tr>`;
    html += '<tr><td class="font-bold" style="padding-top:16px;">Expenses</td><td class="text-right" style="padding-top:16px;"></td></tr>';
    data.profitLoss.expenses.forEach(e => {
      html += `<tr><td><span class="indent">${e.name}</span></td><td class="text-right font-mono text-red">${FMT.money(e.amount)}</td></tr>`;
    });
    html += `<tr><td style="border-bottom:2px solid var(--border);"><span class="indent font-bold">Total Expenses</span></td><td class="text-right font-mono font-bold text-red" style="border-bottom:2px solid var(--border);">${FMT.money(totalExp)}</td></tr>`;
    html += `<tr><td class="font-bold" style="padding-top:16px;font-size:1rem;">Net Profit</td><td class="text-right font-mono font-bold text-gold" style="padding-top:16px;font-size:1.1rem;">${FMT.money(data.profitLoss.netProfit)}</td></tr>`;
    plBody.innerHTML = html;
  }
  const insightsEl = document.getElementById('report-insights');
  if (insightsEl) {
    insightsEl.innerHTML = `<div style="display:flex;flex-direction:column;gap:16px;">
      ${data.insights.map(i => `
        <div>
          <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:6px;">
            <span>${i.label}</span><span class="font-bold">${i.value}</span>
          </div>
          <div style="height:6px;background:var(--bg-body);border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${i.pct}%;background:${i.color};border-radius:3px;"></div>
          </div>
        </div>
      `).join('')}
      <div style="margin-top:8px;padding-top:16px;border-top:1px solid var(--border-light);">
        <p style="font-size:0.8rem;color:var(--text-secondary);">&#128200; Revenue has grown 18.3% year-over-year. Consider increasing marketing spend to capitalize on momentum.</p>
      </div>
    </div>`;
  }
}

/* ─── Render: Budget ─── */
function renderBudget(data) {
  const statsEl = document.getElementById('budget-stats');
  if (statsEl) {
    const cards = [
      { label: 'Annual Budget', value: FMT.money(data.annual), cls: '' },
      { label: 'Spent to Date', value: FMT.money(data.spent), cls: 'text-red' },
      { label: 'Remaining', value: FMT.money(data.remaining), cls: 'text-green' },
      { label: 'Utilization', value: data.utilization + '%', cls: 'text-gold' }
    ];
    statsEl.innerHTML = cards.map(c => `
      <div class="stat-card">
        <div class="stat-card-label">${c.label}</div>
        <div class="stat-card-value font-bold ${c.cls}">${c.value}</div>
      </div>
    `).join('');
  }
  const tbody = document.getElementById('budget-body');
  if (!tbody) return;
  tbody.innerHTML = data.departments.map(d => {
    const remaining = d.budget - d.spent;
    return `<tr>
      <td class="font-bold">${d.name}</td>
      <td>${FMT.money(d.budget)}</td>
      <td class="text-right font-mono text-red">${FMT.money(d.spent)}</td>
      <td class="text-right font-mono text-green">${FMT.money(remaining)}</td>
      <td><div style="height:6px;background:var(--bg-body);border-radius:3px;width:120px;overflow:hidden;"><div style="height:100%;width:${d.pct}%;background:${d.color};border-radius:3px;"></div></div></td>
    </tr>`;
  }).join('');
}

/* ─── Load All Data ─── */
async function loadAll() {
  const [dash, accounts, ledger, invoices, bills, banking, journal, reports, budget] = await Promise.all([
    API.dashboard(), API.accounts(), API.ledger(), API.invoices(),
    API.bills(), API.banking(), API.journal(), API.reports(), API.budget()
  ]);

  if (dash) {
    renderStats(dash.stats);
    renderChart(dash);
    renderActivity(dash.activity || []);
  }
  if (accounts) renderAccounts(accounts);
  if (ledger) renderLedger(ledger);
  if (invoices) {
    renderInvoices(invoices);
    const recentBody = document.getElementById('recent-invoices-body');
    if (recentBody) {
      recentBody.innerHTML = invoices.invoices.slice(0, 4).map(inv => `
        <tr>
          <td class="font-bold">${inv.id}</td>
          <td>${inv.customer}</td>
          <td class="font-mono font-bold">${FMT.money(inv.amount)}</td>
          <td>${inv.issue}</td>
          <td>${FMT.status(inv.status)}</td>
        </tr>
      `).join('');
    }
  }
  if (bills) renderBills(bills);
  if (banking) renderBanking(banking);
  if (journal) renderJournal(journal);
  if (reports) renderReports(reports);
  if (budget) renderBudget(budget);

  LedgerAI.injectDependencies({ dash, accounts, ledger, invoices, bills, banking, journal, reports, budget });
  showAISuggestion();
}

function showAISuggestion() {
  const container = document.getElementById('ai-suggestion');
  if (!container) return;
  const s = LedgerAI.getSuggestion();
  if (s) {
    container.innerHTML = `<div class="ai-suggestion-banner ${s.priority}">
      <span class="ai-suggestion-icon">&#129302;</span>
      <span class="ai-suggestion-text">${s.text}</span>
      <button class="ai-suggestion-dismiss" onclick="this.parentElement.remove()">&times;</button>
    </div>`;
  }
}

/* ─── Theme Toggle ─── */
const htmlEl = document.documentElement;
let darkMode = localStorage.getItem('ledgerflow-theme') === 'dark';
htmlEl.setAttribute('data-theme', darkMode ? 'dark' : 'light');

function toggleTheme() {
  darkMode = !darkMode;
  htmlEl.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  const label = document.getElementById('themeLabel');
  if (label) label.textContent = darkMode ? 'Light Mode' : 'Dark Mode';
  localStorage.setItem('ledgerflow-theme', darkMode ? 'dark' : 'light');
}

document.getElementById('themeToggleSide')?.addEventListener('click', toggleTheme);
document.getElementById('themeToggleHeader')?.addEventListener('click', toggleTheme);
if (document.getElementById('themeLabel')) {
  document.getElementById('themeLabel').textContent = darkMode ? 'Light Mode' : 'Dark Mode';
}

/* ─── Sidebar Navigation ─── */
const navItems = document.querySelectorAll('.nav-item[data-module]');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');

const titles = {
  dashboard: ['Dashboard', "Welcome back, Thando. Here's your financial overview."],
  accounts: ['Chart of Accounts', 'Manage your general ledger account structure.'],
  ledger: ['General Ledger', 'View all posted transactions across your accounts.'],
  receivables: ['Accounts Receivable', 'Track and manage customer invoices.'],
  payables: ['Accounts Payable', 'Track and manage supplier bills.'],
  banking: ['Bank Accounts', 'Connect, reconcile, and manage your bank accounts.'],
  journal: ['Journal Entries', 'Record and post adjusting entries, accruals, and corrections.'],
  reports: ['Financial Reports', 'Generate and export financial statements.'],
  budget: ['Budget & Planning', 'Create and track budgets across departments.'],
  settings: ['Settings', 'Manage your organisation and accounting preferences.']
};

function switchModule(id) {
  document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
  const target = document.getElementById(`mod-${id}`);
  if (target) target.classList.add('active');

  navItems.forEach(n => n.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[data-module="${id}"]`);
  if (activeNav) activeNav.classList.add('active');

  const [title, sub] = titles[id] || ['Module', ''];
  if (pageTitle) pageTitle.textContent = title;
  if (pageSubtitle) pageSubtitle.textContent = sub;

  if (window.innerWidth <= 1024) document.getElementById('sidebar')?.classList.remove('open');

  if (typeof LedgerAI !== 'undefined') LedgerAI.setCurrentModule(id);
}

navItems.forEach(item => {
  item.addEventListener('click', () => switchModule(item.dataset.module));
});

document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.toggle('open');
});

/* ─── Section Tabs ─── */
document.querySelectorAll('.section-tabs').forEach(g => {
  g.querySelectorAll('.section-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      g.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
});

/* ─── Toast ─── */
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type}`;
  void t.offsetWidth;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/* ─── Form: New Buttons ─── */
document.querySelectorAll('.btn-primary').forEach(btn => {
  if (btn.textContent.includes('New')) {
    btn.addEventListener('click', () => showToast('New entry form opened (demo)', 'success'));
  }
});

/* ─── Journal Form ─── */
document.getElementById('journalForm')?.addEventListener('submit', e => {
  e.preventDefault();
  showToast('Journal entry posted successfully!', 'success');
});

/* ─── Search ─── */
document.getElementById('globalSearch')?.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && this.value.trim()) {
    showToast(`Searching for "${this.value.trim()}"...`);
    this.value = '';
  }
});

/* ─── Keyboard shortcuts ─── */
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('globalSearch')?.focus();
  }
  const navMap = ['dashboard','accounts','ledger','receivables','payables','banking','journal','reports','budget','settings'];
  if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key >= '1' && e.key <= '9') {
    const idx = parseInt(e.key) - 1;
    if (navMap[idx]) switchModule(navMap[idx]);
  }
  if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key === '0') switchModule('settings');
});

window.switchModule = switchModule;

/* ─── AI Chat Widget ─── */
document.getElementById('ai-chat-toggle')?.addEventListener('click', () => {
  const open = LedgerAI.toggle();
  document.getElementById('ai-chat-panel')?.classList.toggle('open', open);
  document.getElementById('ai-chat-toggle')?.classList.toggle('active', open);
  if (open) document.getElementById('ai-chat-input')?.focus();
});

document.getElementById('ai-chat-close')?.addEventListener('click', () => {
  LedgerAI.toggle();
  document.getElementById('ai-chat-panel')?.classList.remove('open');
  document.getElementById('ai-chat-toggle')?.classList.remove('active');
});

document.getElementById('ai-chat-send')?.addEventListener('click', sendChatMessage);
document.getElementById('ai-chat-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendChatMessage();
});

async function sendChatMessage() {
  const input = document.getElementById('ai-chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  const messages = document.getElementById('ai-chat-messages');
  messages.innerHTML += `<div class="chat-msg user"><div class="chat-bubble user-bubble">${msg}</div></div>`;
  messages.scrollTop = messages.scrollHeight;

  const thinking = document.getElementById('ai-thinking');
  if (thinking) thinking.style.display = 'flex';

  try {
    const reply = await LedgerAI.chat(msg);
    if (thinking) thinking.style.display = 'none';
    messages.innerHTML += `<div class="chat-msg bot"><div class="chat-bubble bot-bubble">${reply.bot}</div></div>`;
  } catch {
    if (thinking) thinking.style.display = 'none';
    messages.innerHTML += `<div class="chat-msg bot"><div class="chat-bubble bot-bubble">Sorry, I hit an error. Please try again.</div></div>`;
  }
  messages.scrollTop = messages.scrollHeight;
}

document.getElementById('ai-suggestion')?.addEventListener('click', e => {
  const banner = e.target.closest('.ai-suggestion-banner');
  if (!banner || e.target.closest('.ai-suggestion-dismiss')) return;
  const action = LedgerAI.getSuggestion();
  if (action?.action?.type === 'navigate') switchModule(action.action.module);
});

/* ─── Chat Auto-Open (first visit) ─── */
if (!localStorage.getItem('ledgerflow-ai-seen')) {
  setTimeout(() => {
    const toggle = document.getElementById('ai-chat-toggle');
    if (toggle) {
      toggle.style.animation = 'pulse 2s ease 3';
    }
    localStorage.setItem('ledgerflow-ai-seen', '1');
  }, 3000);
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
  loadAll();
  LedgerAI.track('app_start', 'Application initialized');
  // Restore chat state
  if (LedgerAI.getState()) {
    document.getElementById('ai-chat-panel')?.classList.add('open');
    document.getElementById('ai-chat-toggle')?.classList.add('active');
  }
  // Stagger stat card animation
  document.querySelectorAll('.stat-card').forEach((c, i) => c.style.animationDelay = `${i * 0.08}s`);
});
