require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const Credential = require('./models/Credential');

const app = express();

// CORS configuration to allow frontend requests from localhost
const corsOptions = {
  origin: 'https://bulk-mail-front-end.vercel.app', // Allow only your frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true, // Allow credentials if needed
};

app.use(cors(corsOptions)); // Enable CORS with the updated options
app.use(express.json()); // To parse JSON request body

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ Mongo Error:", err));

// Handle preflight requests (for CORS)
app.options('*', cors(corsOptions));

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
      to: recipients, 
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
