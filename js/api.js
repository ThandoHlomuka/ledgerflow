/* ─── API Service Layer ─── */
const API = {
  base: '/api',

  async get(endpoint) {
    try {
      const res = await fetch(`${this.base}/${endpoint}`);
      if (!res.ok) throw new Error('API unavailable');
      return await res.json();
    } catch {
      return null;
    }
  },

  dashboard:  () => API.get('dashboard'),
  accounts:   () => API.get('accounts'),
  ledger:     () => API.get('ledger'),
  invoices:   () => API.get('invoices'),
  bills:      () => API.get('bills'),
  banking:    () => API.get('banking'),
  journal:    () => API.get('journal'),
  reports:    () => API.get('reports'),
  budget:     () => API.get('budget'),
  activity:   () => API.get('activity'),
  compute:    () => API.get('compute')
};
