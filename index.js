// index.js  (backend entry)
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import mailRoutes from "./routes/mail.routes.js";

dotenv.config();
mongoose.set("strictQuery", true);

const app = express();
const PORT = process.env.PORT || 5000;

/* ------------------------------------------------------------------ */
/* 1️⃣  CORS – allow frontend on Render + localhost dev               */
/* ------------------------------------------------------------------ */
const FRONTEND = (process.env.APPLICATION_URI || "").replace(/\/$/, ""); // strip trailing /
const allowedOrigins = [FRONTEND, "http://localhost:3000"];

app.use(
  cors({
    origin: "https://bulk-mail-app-z9bh.onrender.com", // ✅ your deployed Vite frontend
    methods: ["GET", "POST"],
    credentials: true,
  })
);

/* Handle OPTIONS pre‑flight globally */
app.options("*", cors());

/* ------------------------------------------------------------------ */
/* 2️⃣  Basic middleware                                              */
/* ------------------------------------------------------------------ */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* ------------------------------------------------------------------ */
/* 3️⃣  Routes                                                        */
/* ------------------------------------------------------------------ */
app.use("/api", mailRoutes);

app.get("/", (_req, res) => res.send("🚀 Bulk‑Mail backend is running"));

/* ------------------------------------------------------------------ */
/* 4️⃣  Catch‑all 404                                                 */
/* ------------------------------------------------------------------ */
app.use((req, res) =>
  res.status(404).json({ success: false, error: "Not found" })
);

/* ------------------------------------------------------------------ */
/* 5️⃣  Connect to MongoDB & start server                             */
/* ------------------------------------------------------------------ */
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
})();
