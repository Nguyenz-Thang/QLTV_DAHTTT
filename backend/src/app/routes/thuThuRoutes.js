const express = require("express");
const router = express.Router();
const { getThuThu, createThuThu, deleteThuThu, updateThuThu } = require("../controllers/thuThuController");
const { authMiddleware } = require("../middleware/auth");

router.get("/", authMiddleware, getThuThu);
router.post("/", authMiddleware, createThuThu);
router.delete("/:id", authMiddleware, deleteThuThu);
router.put("/:id", authMiddleware, updateThuThu);

module.exports = router;
