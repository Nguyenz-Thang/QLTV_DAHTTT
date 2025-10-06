const express = require("express");
const router = express.Router();
const docGiaController = require("../controllers/docGiaController");

// 🟢 Lấy danh sách độc giả
router.get("/", docGiaController.getAll);

// 🟢 Tìm kiếm độc giả
router.get("/search", docGiaController.search);

// 🟢 Thêm độc giả
router.post("/", docGiaController.create);

// 🟡 Cập nhật độc giả
router.put("/:id", docGiaController.update);

// 🔴 Xóa độc giả
router.delete("/:id", docGiaController.delete);

module.exports = router;
