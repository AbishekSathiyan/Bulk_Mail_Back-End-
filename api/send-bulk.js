// pages/api/send-bulk.js
import { connectToDatabase } from "../../utils/db";
import BulkMail from "../../models/BulkMail";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { subject, content: message, recipients } = req.body;

  if (!subject || !message || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({
      error: "Subject, content, and at least one recipient are required",
    });
  }

  try {
    await connectToDatabase();

    /* --- mail transport --- */
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    /* --- send mail per recipient & collect results --- */
    const recipientResults = [];

    for (const email of recipients) {
      try {
        const info = await transporter.sendMail({
          from: process.env.MAIL_USER,
          to: email,
          subject,
          html: message,
        });

        recipientResults.push({
          email,
          status: "sent",
          sentAt: new Date(),
          error: null,
          messageId: info.messageId,
        });
      } catch (err) {
        recipientResults.push({
          email,
          status: "failed",
          sentAt: new Date(),
          error: err.message,
        });
      }
    }

    const overallStatus = recipientResults.every((r) => r.status === "sent")
      ? "sent"
      : recipientResults.some((r) => r.status === "sent")
      ? "partial"
      : "failed";

    /* --- save in MongoDB --- */
    const mailRecord = await BulkMail.create({
      subject,
      content: message,
      recipients: recipientResults,
      status: overallStatus,
    });

    res.status(201).json({
      success: true,
      data: mailRecord,
      message: `Processed ${recipients.length} recipient(s)`,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
