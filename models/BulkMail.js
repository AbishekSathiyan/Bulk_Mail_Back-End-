// models/BulkMail.js
import mongoose from "mongoose";

const bulkMailSchema = new mongoose.Schema(
  {
    subject: String,
    content: String,
    recipients: [String],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("BulkMail", bulkMailSchema);
