// api/send-bulk.js
import { connectToDatabase } from "../utils/db";
import BulkMail from "../models/BulkMail";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    await connectToDatabase();
    const mail = new BulkMail(req.body);
    await mail.save();
    res.status(201).json({ message: "Mail saved" });
  } catch (err) {
    console.error("Error saving mail:", err);
    res.status(500).json({ error: "Server error" });
  }
}
