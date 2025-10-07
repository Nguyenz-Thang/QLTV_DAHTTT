// backend/src/app/routes/phieuTraRoutes.js
const express = require("express");
const router = express.Router();
const phieuTraCtrl = require("../controllers/phieuTraController");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");

router.use(authMiddleware);

router.get("/", phieuTraCtrl.list);
router.get("/:maPT", phieuTraCtrl.detail);

router.post("/", roleMiddleware("Quản lý", "Thủ thư"), phieuTraCtrl.create);
router.put(
  "/:maPT",
  roleMiddleware("Quản lý", "Thủ thư"),
  phieuTraCtrl.updateHeader
);
router.delete(
  "/:maPT",
  roleMiddleware("Quản lý", "Thủ thư"),
  phieuTraCtrl.remove
);

module.exports = router;
