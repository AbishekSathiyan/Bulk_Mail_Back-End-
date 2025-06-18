const mongoose = require('mongoose');

const CredentialSchema = new mongoose.Schema({
  user: { type: String, required: true },
  pass: { type: String, required: true }
});

module.exports = mongoose.model('Credential', CredentialSchema);