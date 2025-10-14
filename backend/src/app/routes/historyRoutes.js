const router = require("express").Router();
const { authMiddleware, roleMiddleware } = require("../middleware/auth");
const history = require("../controllers/historyController");

// ✅ ĐỂ TRƯỚC
router.get("/me", authMiddleware, history.listMyHistory);

// ✅ ĐỂ SAU
router.get("/:maTK", authMiddleware, history.listByAccount);

// (nếu muốn hạn quyền admin):
// router.get("/:maTK", authMiddleware, roleMiddleware("Quản lý","Thủ thư"), history.listByAccount);

module.exports = router;
