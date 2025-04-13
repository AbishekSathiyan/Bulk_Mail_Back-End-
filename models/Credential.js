const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
  user: String,
  pass: String
});

module.exports = mongoose.model('Credential', credentialSchema, 'mail');
