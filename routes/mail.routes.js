import express from "express";
import nodemailer from "nodemailer";
import BulkMail from "../models/BulkMail.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

/* ---------- Mail transporter ---------- */
const transporter = nodemailer.createTransport({
  service: "gmail",          // use an APP‑PASSWORD, not your normal pwd
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* ---------- POST /api/send-bulk ---------- */
router.post("/send-bulk", async (req, res) => {
  const { subject, message, recipients } = req.body;

  try {
    // 1️⃣ send the email
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: recipients,        // comma‑separated string OR array
      subject,
      html: message,
    });

    // 2️⃣ save a copy in MongoDB
    await BulkMail.create({ subject, content: message, recipients });

    res.status(200).json({ message: "Emails sent & saved to DB" });
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    res.status(500).json({ error: "Failed to send email or save to DB" });
  }
});

/* ---------- GET /api/history ---------- */
router.get("/history", async (_req, res) => {
  try {
    const emails = await BulkMail.find().sort({ createdAt: -1 });
    res.status(200).json(emails);
  } catch (error) {
    console.error("❌ History fetch failed:", error);
    res.status(500).json({ error: "Failed to fetch email history" });
  }
});

export default router;
