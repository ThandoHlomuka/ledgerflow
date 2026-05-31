const data = require('./data');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(data.activity);
};
