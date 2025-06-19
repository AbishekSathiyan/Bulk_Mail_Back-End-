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

// POST /api/send-bulk - Send emails and store data
router.post("/send-bulk", async (req, res) => {
  const { subject, content: message, recipients } = req.body;

  // Validate input
  if (!subject || !message || !recipients?.length) {
    return res.status(400).json({ 
      error: "Subject, content, and at least one recipient are required" 
    });
  }

  try {
    // Send email
    const info = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: recipients,
      subject,
      html: message,
    });

    // Store successful attempt
    const mailRecord = await BulkMail.create({
      subject,
      content: message,
      recipients,
      status: "sent",
      messageId: info.messageId
    });

    res.status(201).json({
      success: true,
      data: mailRecord,
      message: `Email sent to ${recipients.length} recipients`
    });

  } catch (error) {
    // Store failed attempt
    const failedRecord = await BulkMail.create({
      subject,
      content: message,
      recipients,
      status: "failed",
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: "Email sending failed",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
      record: failedRecord
    });
  }
});

// GET /api/history - Fetch all email records
router.get("/history", async (req, res) => {
  try {
    const { 
      limit = 20, 
      page = 1,
      status,
      sort = "-createdAt",
      search 
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { recipients: { $regex: search, $options: "i" } }
      ];
    }

    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      sort: sort
    };

    const [emails, total] = await Promise.all([
      BulkMail.find(query, null, options),
      BulkMail.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: emails,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch email history",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// GET /api/history/:id - Get single email record
router.get("/history/:id", async (req, res) => {
  try {
    const mail = await BulkMail.findById(req.params.id);
    if (!mail) {
      return res.status(404).json({
        success: false,
        error: "Email record not found"
      });
    }
    res.status(200).json({
      success: true,
      data: mail
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch email record",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

export default router;