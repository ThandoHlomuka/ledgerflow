const data = require('./_data');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ entries: data.journalEntries, activity: data.activity });
};
