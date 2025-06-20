import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

/* -------------------------------------------------------------------------- */
/*  Recipient sub‑document                                                    */
/* -------------------------------------------------------------------------- */
// _id is disabled because each recipient does not need its own ObjectId
const RecipientSchema = new Schema(
  {
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
  },
  { _id: false } // keep the sub‑document lean
);

/* -------------------------------------------------------------------------- */
/*  BulkMail schema                                                           */
/* -------------------------------------------------------------------------- */
const BulkMailSchema = new Schema(
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
      required: [true, "At least one recipient is required"],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "At least one recipient is required",
      },
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "partial"],
      default: "pending",
    },
    messageId: String,
  },
  {
    timestamps: true, // adds createdAt & updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* -------------------------------------------------------------------------- */
/*  Virtuals & Indexes                                                        */
/* -------------------------------------------------------------------------- */
// Quickly know how many recipients were included without extra aggregation
BulkMailSchema.virtual("recipientCount").get(function () {
  return this.recipients.length;
});

// Make frequent queries on createdAt faster (e.g., latest history)
BulkMailSchema.index({ createdAt: -1 });

/* -------------------------------------------------------------------------- */
/*  Model export                                                              */
/* -------------------------------------------------------------------------- */
export default models.BulkMail || model("BulkMail", BulkMailSchema);
