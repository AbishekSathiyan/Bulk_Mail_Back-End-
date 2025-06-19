// index.js  (server.js)
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
    // 1️⃣ connect to Atlas
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Atlas connected");

    // 2️⃣ diagnostics
    const uri           = process.env.MONGO_URI;
    const clusterName   = uri.match(/@([^./]+)\./)?.[1] ?? "unknown";
    const conn          = mongoose.connection;
    const dbName        = conn.name;
    const collections   = (await conn.db.listCollections().toArray()).map(c => c.name);

    console.log("📡  Cluster     :", clusterName);
    console.log("📂  Database    :", dbName);
    console.log("📄  Collections :", collections.join(", ") || "(none)");

    // 3️⃣ start server (no “localhost” in the log)
    app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
  } catch (err) {
    console.error("❌ DB connect failed:", err.message);
    process.exit(1);
  }
})();
