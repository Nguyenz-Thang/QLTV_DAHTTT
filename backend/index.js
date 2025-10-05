// app.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const sachRoutes = require("./src/app/routes/sachRoutes");
const theLoaiRoutes = require("./src/app/routes/theLoaiRoutes");
// const authRoutes = require("./src/app/routes/authRoutes");
const phieuMuonRoutes = require("./src/app/routes/phieumuonRoutes");
// const thuThuRoutes = require("./src/app/routes/thuthuRoutes");
const { getPool } = require("./src/config/db");

const app = express();
app.use(cors());
app.use(express.json());

// Ensure DB connection at startup
getPool().catch((err) => {
  console.error("Failed to connect DB on startup:", err.message);
  // you may choose to process.exit(1) here
});


app.use(cors());
app.use(express.json());
app.use('/theloai', theLoaiRoutes);
app.get("/", (req, res) => res.send("Library API running"));

const authRoutes = require("./src/app/routes/authRoutes");
app.use("/api/auth", authRoutes);

// Ví dụ bảo vệ route sách
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "src", "uploads")));
const { authMiddleware } = require("./src/app/middleware/auth");
app.use("/api/sach", sachRoutes);
app.use("/api/phieumuon", phieuMuonRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);
