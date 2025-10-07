const express = require("express");
const router = express.Router();
const nxbController = require("../controllers/nxbController");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");

// yêu cầu đăng nhập
router.use(authMiddleware);

// xem & tìm kiếm
router.get("/", nxbController.getAll);
router.get("/search", nxbController.search);

// thêm/sửa/xoá — cho Quản lý & Thủ thư
router.post("/", roleMiddleware("Quản lý", "Thủ thư"), nxbController.create);
router.put("/:id", roleMiddleware("Quản lý", "Thủ thư"), nxbController.update);
router.delete(
  "/:id",
  roleMiddleware("Quản lý", "Thủ thư"),
  nxbController.delete
);

module.exports = router;
