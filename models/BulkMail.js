// models/BulkMail.js
import mongoose from "mongoose";

const BulkMailSchema = new mongoose.Schema({
  subject: String,
  message: String,
  recipients: [String],
}, { timestamps: true });

export default mongoose.models.BulkMail || mongoose.model("BulkMail", BulkMailSchema);
