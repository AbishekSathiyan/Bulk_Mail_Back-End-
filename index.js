import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import mailRoutes from "./routes/mail.routes.js";

dotenv.config();
mongoose.set("strictQuery", true);

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api", mailRoutes);
app.get("/", (_req, res) => res.send("🚀 Bulk‑Mail backend is running"));

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => console.log(`🚀 Server @ http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ DB connect failed:", err.message);
    process.exit(1);
  }
})();
