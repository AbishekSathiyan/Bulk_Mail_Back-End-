// routes/mail.routes.js
import { Router } from "express";
import nodemailer from "nodemailer";
import BulkMail from "../models/BulkMail.js";
import dotenv from "dotenv";

dotenv.config();
const router = Router();

/* ---------- Mail Transporter ---------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* ---------- POST /api/send-bulk ---------- */
router.post("/send-bulk", async (req, res) => {
  const { subject, content: message, recipients } = req.body;

  if (!subject || !message || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({
      error: "Subject, content, and at least one recipient are required",
    });
  }

  try {
    const results = [];

    for (const email of recipients) {
      try {
        const info = await transporter.sendMail({
          from: process.env.MAIL_USER,
          to: email,
          subject,
          html: message,
        });

        results.push({
          email,
          status: "sent",
          sentAt: new Date(),
          error: null,
          messageId: info.messageId,
        });
      } catch (err) {
        results.push({
          email,
          status: "failed",
          sentAt: new Date(),
          error: err.message,
        });
      }
    }

    const overallStatus = results.every((r) => r.status === "sent")
      ? "sent"
      : results.some((r) => r.status === "sent")
      ? "partial"
      : "failed";

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
    res.status(500).json({
      success: false,
      error: "Email sending failed",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/* ---------- GET /api/history ---------- */
router.get("/history", async (req, res) => {
  try {
    const { limit = 20, page = 1, status, sort = "-createdAt", search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { "recipients.email": { $regex: search, $options: "i" } },
      ];
    }

    const opts = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sort,
    };

    const [emails, total] = await Promise.all([
      BulkMail.find(query, null, opts),
      BulkMail.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: emails,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("History fetch error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch email history",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

/* ---------- GET /api/history/:id ---------- */
router.get("/history/:id", async (req, res) => {
  try {
    const mail = await BulkMail.findById(req.params.id);
    if (!mail) {
      return res.status(404).json({ success: false, error: "Record not found" });
    }
    res.json({ success: true, data: mail });
  } catch (err) {
    console.error("Single record fetch error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch record",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

/* ---------- GET /api/recipients/:id ---------- */
router.get("/recipients/:id", async (req, res) => {
  try {
    const mail = await BulkMail.findById(req.params.id, "recipients");
    if (!mail) {
      return res.status(404).json({ success: false, error: "Mail record not found" });
    }

    const emailList = mail.recipients.map((r) => r.email);
    res.json({ success: true, recipients: emailList });
  } catch (err) {
    console.error("Recipient fetch error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recipients",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

export default router;
