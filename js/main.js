/* ─── Theme Toggle ─── */
const html = document.documentElement;
let darkMode = false;

function setTheme(mode) {
  darkMode = mode;
  html.setAttribute('data-theme', mode ? 'dark' : 'light');
  const label = document.getElementById('themeLabel');
  if (label) label.textContent = mode ? 'Light Mode' : 'Dark Mode';
  localStorage.setItem('ledgerflow-theme', mode ? 'dark' : 'light');
}

function toggleTheme() {
  setTheme(!darkMode);
}

// Load saved theme
const saved = localStorage.getItem('ledgerflow-theme');
if (saved) setTheme(saved === 'dark');

document.getElementById('themeToggleSide')?.addEventListener('click', toggleTheme);
document.getElementById('themeToggleHeader')?.addEventListener('click', toggleTheme);

/* ─── Sidebar Navigation ─── */
const navItems = document.querySelectorAll('.nav-item[data-module]');
const modules = {};

document.querySelectorAll('.module').forEach(m => {
  modules[m.id] = m;
});

function switchModule(id) {
  // Hide all modules
  Object.values(modules).forEach(m => m.classList.remove('active'));
  // Show target
  const target = document.getElementById(`mod-${id}`);
  if (target) target.classList.add('active');

  // Update nav
  navItems.forEach(n => n.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[data-module="${id}"]`);
  if (activeNav) activeNav.classList.add('active');

  // Update header
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
  const [title, sub] = titles[id] || ['Module', ''];
  document.getElementById('pageTitle').textContent = title;
  document.getElementById('pageSubtitle').textContent = sub;

  // Close sidebar on mobile
  if (window.innerWidth <= 1024) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    switchModule(item.dataset.module);
  });
});

/* ─── Mobile Hamburger ─── */
document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

/* ─── Section Tabs ─── */
document.querySelectorAll('.section-tabs').forEach(tabGroup => {
  tabGroup.querySelectorAll('.section-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tabGroup.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
});

/* ─── Toast ─── */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  // Force reflow
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ─── Form Handlers ─── */
document.getElementById('journalForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  showToast('Journal entry posted successfully!', 'success');
  // Reset line items after the first
  const lines = this.querySelectorAll('.journal-line');
  // (mock)
});

// "New" button handlers
document.querySelectorAll('.btn-primary').forEach(btn => {
  if (btn.textContent.includes('New')) {
    btn.addEventListener('click', function(e) {
      if (this.closest('#mod-journal') || this.closest('#mod-receivables') || this.closest('#mod-payables') || this.closest('#mod-budget') || this.closest('#mod-accounts')) {
        showToast('New entry form opened (demo)', 'success');
      }
    });
  }
});

/* ─── Chart Bar Animation ─── */
document.addEventListener('DOMContentLoaded', () => {
  // Animate bars on load
  const bars = document.querySelectorAll('.chart-bar');
  bars.forEach(bar => {
    const h = bar.style.height;
    bar.style.height = '0%';
    setTimeout(() => { bar.style.height = h; }, 100);
  });

  // Stat cards staggered animation
  const cards = document.querySelectorAll('.stat-card');
  cards.forEach((card, i) => {
    card.style.animationDelay = `${i * 0.08}s`;
  });
});

/* ─── Global Search ─── */
document.getElementById('globalSearch')?.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && this.value.trim()) {
    showToast(`Searching for "${this.value.trim()}"...`, 'success');
  }
});

/* ─── Keyboard shortcuts ─── */
document.addEventListener('keydown', (e) => {
  // Ctrl+K for search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('globalSearch')?.focus();
  }
  // 1-0 for nav items
  const navMap = ['dashboard','accounts','ledger','receivables','payables','banking','journal','reports','budget','settings'];
  if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key >= '1' && e.key <= '9') {
    const idx = parseInt(e.key) - 1;
    if (navMap[idx]) switchModule(navMap[idx]);
  }
  if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key === '0') {
    switchModule('settings');
  }
});

/* ─── Make switchModule globally accessible ─── */
window.switchModule = switchModule;
