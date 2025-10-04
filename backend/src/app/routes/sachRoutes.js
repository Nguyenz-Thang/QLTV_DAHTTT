// routes/sachRoutes.js
const express = require("express");
const router = express.Router();
const sachController = require("../controllers/sachControllers");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");

router.get(
  "/",
  roleMiddleware("Thủ thư", "Độc giả", "Quản lý"),
  sachController.getSachList
);

module.exports = router;
