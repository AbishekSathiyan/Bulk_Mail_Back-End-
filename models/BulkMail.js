import mongoose from "mongoose";

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
      type: [String],
      required: [true, "Recipients are required"],
      validate: {
        validator: function (v) {
          return (
            v.length > 0 &&
            v.every((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          );
        },
        message: "At least one valid email address is required",
      },
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    messageId: {
      type: String,
      required: false,
    },
    error: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true, // creates createdAt and updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for recipient count
BulkMailSchema.virtual("recipientCount").get(function () {
  return this.recipients.length;
});

export default mongoose.models.BulkMail ||
  mongoose.model("BulkMail", BulkMailSchema);
