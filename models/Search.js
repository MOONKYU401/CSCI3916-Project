const mongoose = require('mongoose');

const SearchSchema = new mongoose.Schema({
  city: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Search', SearchSchema);
