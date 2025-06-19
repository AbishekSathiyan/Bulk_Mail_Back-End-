// routes/mail.routes.js
import { Router } from "express";
import nodemailer from "nodemailer";
import BulkMail from "../models/BulkMail.js";
import dotenv from "dotenv";

dotenv.config();
const router = Router();

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
const badRequest = (res, msg) =>
  res.status(400).json({ success: false, error: msg });

/* -------------------------------------------------------------------------- */
/*  Mail Transporter                                                          */
/* -------------------------------------------------------------------------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* -------------------------------------------------------------------------- */
/*  POST /api/send-bulk                                                       */
/* -------------------------------------------------------------------------- */
router.post("/send-bulk", async (req, res) => {
  const { subject, content: message, recipients } = req.body;

  if (!subject || !message || !Array.isArray(recipients) || !recipients.length) {
    return badRequest(res, "Subject, content, and at least one recipient are required");
  }

  try {
    /* Send one email per recipient (sequential to avoid spam throttling) */
    const results = [];
    for (const email of recipients) {
      try {
        const info = await transporter.sendMail({
          from: process.env.MAIL_USER,
          to: email,
          subject,
          html: message,
        });
        results.push({ email, status: "sent", sentAt: new Date(), messageId: info.messageId });
      } catch (err) {
        results.push({ email, status: "failed", sentAt: new Date(), error: err.message });
      }
    }

    /* Compute overall status */
    const overallStatus =
      results.every(r => r.status === "sent")
        ? "sent"
        : results.some(r => r.status === "sent")
        ? "partial"
        : "failed";

    /* Save to MongoDB */
    const mailRecord = await BulkMail.create({
      subject,
      content: message,
      recipients: results,
      status: overallStatus,
    });

    res.status(201).json({
      success: true,
      data: mailRecord,
      message: `Processed ${recipients.length} recipient(s)`,
    });
  } catch (error) {
    console.error("Bulk send error:", error);
    res.status(500).json({ success: false, error: "Email sending failed" });
  }
});

/* -------------------------------------------------------------------------- */
/*  GET /api/history  (pagination, status filter, search)                     */
/* -------------------------------------------------------------------------- */
router.get("/history", async (req, res) => {
  try {
    const { limit = 10, page = 1, status, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { subject:   { $regex: search, $options: "i" } },
        { content:   { $regex: search, $options: "i" } },
        { "recipients.email": { $regex: search, $options: "i" } },
      ];
    }

    const parsedLimit = Math.max(1, parseInt(limit));
    const parsedPage  = Math.max(1, parseInt(page));

    const [emails, total] = await Promise.all([
      BulkMail.find(query)
        .sort({ createdAt: -1 })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit),
      BulkMail.countDocuments(query),
    ]);

    /* add recipientCount for your table */
    const emailsWithCounts = emails.map(e => ({
      ...e.toObject(),
      recipientCount: e.recipients.length,
    }));

    res.json({
      success: true,
      data: emailsWithCounts,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (err) {
    console.error("History fetch error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch email history" });
  }
});

/* -------------------------------------------------------------------------- */
/*  GET /api/history/:id                                                      */
/* -------------------------------------------------------------------------- */
router.get("/history/:id", async (req, res) => {
  try {
    const mail = await BulkMail.findById(req.params.id);
    if (!mail) return res.status(404).json({ success: false, error: "Record not found" });
    res.json({ success: true, data: mail });
  } catch (err) {
    console.error("Single record fetch error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch record" });
  }
});

/* -------------------------------------------------------------------------- */
/*  GET /api/recipients/:id                                                   */
/* -------------------------------------------------------------------------- */
router.get("/recipients/:id", async (req, res) => {
  try {
    const mail = await BulkMail.findById(req.params.id, "recipients");
    if (!mail) return res.status(404).json({ success: false, error: "Mail record not found" });

    res.json({
      success: true,
      recipients: mail.recipients.map(r => r.email),
    });
  } catch (err) {
    console.error("Recipient fetch error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch recipients" });
  }
});

export default router;
