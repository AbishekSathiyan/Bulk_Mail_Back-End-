// index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors'); // For enabling CORS
const Credential = require('./models/Credential');

const app = express();

// Middleware
app.use(express.json()); // To parse JSON request body
app.use(cors()); // Allow cross-origin requests

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ Mongo Error:", err));

// POST endpoint to handle sending emails
app.post('/send-bulk', async (req, res) => {
  try {
    const creds = await Credential.findOne(); // Get credentials from DB
    if (!creds) return res.status(404).send("No credentials found");

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: creds.user,
        pass: creds.pass
      }
    });

    const { recipients, subject, message } = req.body;

    const mailOptions = {
      from: creds.user,
      to: recipients, // Comma-separated string or array of emails
      subject: subject,
      html: message
    };

    const info = await transporter.sendMail(mailOptions);
    res.send(`✅ Emails sent: ${info.response}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Failed to send emails");
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
