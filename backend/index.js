// app.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const sachRoutes = require("./src/app/routes/sachRoutes");
const { getPool } = require("./src/config/db");

const app = express();
app.use(cors());
app.use(express.json());

// Ensure DB connection at startup
getPool().catch((err) => {
  console.error("Failed to connect DB on startup:", err.message);
  // you may choose to process.exit(1) here
});
const theLoaiRoutes = require("./src/app/routes/theLoaiRoutes");

app.use(cors());
app.use(express.json());
app.use("/theloai", theLoaiRoutes);
app.get("/", (req, res) => res.send("Library API running"));

const authRoutes = require("../backend/src/app/routes/authRoutes");
app.use("/api/auth", authRoutes);
const docGiaRoutes = require("./src/app/routes/docGiaRoutes");
app.use("/api/docgia", docGiaRoutes);
const thuThuRoutes = require("./src/app/routes/thuThuRoutes");
app.use("/api/thuThu", thuThuRoutes);
const phieuMuonRoutes = require("./src/app/routes/phieuMuonRoutes");
app.use("/api/phieumuon", phieuMuonRoutes);
// Ví dụ bảo vệ route sách
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "src", "uploads")));
const { authMiddleware } = require("./src/app/middleware/auth");
app.use("/api/sach", sachRoutes);
const phieuTraRoutes = require("./src/app/routes/phieuTraRoutes");
app.use("/api/phieutra", phieuTraRoutes);
const nxbRoutes = require("./src/app/routes/nxbRoutes");
app.use("/api/nxb", nxbRoutes);
const accountsRoutes = require("./src/app/routes/accountsRoutes");
app.use("/api/accounts", accountsRoutes);
const tacGiaRoutes = require("./src/app/routes/tacGiaRoutes");
app.use("/api/tacgia", tacGiaRoutes);
const binhLuanRoutes = require("./src/app/routes/binhLuanRoutes");
app.use("/api/binhluan", binhLuanRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);
