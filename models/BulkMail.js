// models/BulkMail.js
import mongoose from "mongoose";

const RecipientSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  status: {
    type: String,
    enum: ["sent", "failed", "pending"],
    default: "pending",
  },
  sentAt: {
    type: Date,
    default: null,
  },
  error: {
    type: String,
    default: null,
  },
});

const BulkMailSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    recipients: {
      type: [RecipientSchema],
      required: true,
      validate: (v) => v.length > 0,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "partial"],
      default: "pending",
    },
    messageId: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field to count recipients
BulkMailSchema.virtual("recipientCount").get(function () {
  return this.recipients.length;
});

export default mongoose.models.BulkMail ||
  mongoose.model("BulkMail", BulkMailSchema);
