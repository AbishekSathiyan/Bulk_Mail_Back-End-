// api/send-bulk.js
import Cors from "micro-cors";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import Credential from "../models/Credential.js";
import Mail from "../models/BulkMail.js";

const cors = Cors({
  allowMethods: ["GET", "POST", "OPTIONS"],
  origin: ["http://localhost:3000", "http://localhost:3000"],
});

async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end(); // pre‑flight

  if (req.method !== "POST") return res.status(405).end();

  // 1. ensure DB connected (only once per cold start)
  if (mongoose.connections[0].readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  // 2. send mail (same logic as before) …
  //    remember to wrap errors and set status codes
}

export default cors(handler);
