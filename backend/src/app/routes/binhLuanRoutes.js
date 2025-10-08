// src/app/routes/binhLuanRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/binhLuanController");
const { authMiddleware } = require("../middleware/auth");

// Lấy theo sách
router.get("/", ctrl.list);

// Tạo/sửa/xoá cần đăng nhập
router.post("/", authMiddleware, ctrl.create);
router.patch("/:id", authMiddleware, ctrl.update);
router.delete("/:id", authMiddleware, ctrl.remove);

module.exports = router;
