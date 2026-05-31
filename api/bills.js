const data = require('./data');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ bills: data.bills, summary: { outstanding: 312000, due30: 148000, overdue: 30500 } });
};
