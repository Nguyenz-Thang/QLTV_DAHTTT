// backend/src/app/routes/thongKeRoutes.js
const express = require("express");
const router = express.Router();
const { getDashboard } = require("../controllers/thongKeController");
const { authMiddleware } = require("../middleware/auth");

router.get("/", authMiddleware, getDashboard);

module.exports = router;
