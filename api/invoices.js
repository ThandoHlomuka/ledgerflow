const data = require('./data');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ invoices: data.invoices, summary: { outstanding: 385000, overdue: 72000, collected: 128500 } });
};
