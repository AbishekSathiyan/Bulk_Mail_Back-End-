import express from "express";
import nodemailer from "nodemailer";
import BulkMail from "../models/BulkMail.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

router.post("/send-bulk", async (req, res) => {
  const { subject, message, recipients } = req.body;

  try {
    // Send Email
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: recipients,
      subject,
      html: message,
    };

    await transporter.sendMail(mailOptions);

    // Store in DB
    await BulkMail.create({ subject, content: message, recipients });

    res.status(200).json({ message: "Emails sent & saved to DB" });
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    res.status(500).json({ error: "Failed to send email or save to DB" });
  }

  router.get("/history", async (req, res) => {
    try {
      const emails = await BulkMail.find().sort({ createdAt: -1 });
      res.status(200).json(emails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email history" });
    }
  });
});

export default router;
