import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import mailRoutes from "./routes/mail.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------- middleware ---------- */
app.use(cors());
app.use(express.json());

/* ---------- routes ---------- */
app.use("/api", mailRoutes);          // →  POST /api/send-bulk
                                      // →  GET  /api/history

/* ---------- test root ---------- */
app.get("/", (_req, res) =>
  res.send("🚀 Bulk‑Mail backend is running")
);

/* ---------- DB & server ---------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
