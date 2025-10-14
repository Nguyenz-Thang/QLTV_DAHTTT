const express = require("express");
const router = express.Router();
const {
  getPhieuMuon,
  createPhieuMuon,
  deletePhieuMuon,
  updatePhieuMuon,
} = require("../controllers/phieuMuonController");
const { authMiddleware } = require("../middleware/auth");
const pmCtrl = require("../controllers/phieuMuonController");

router.get("/", authMiddleware, getPhieuMuon);
router.post("/", authMiddleware, createPhieuMuon);
router.delete("/:id", authMiddleware, deletePhieuMuon);
router.put("/:id", authMiddleware, updatePhieuMuon);
router.get("/suggest", authMiddleware, pmCtrl.suggest);
router.get("/:maPM/remaining", authMiddleware, pmCtrl.remaining);
// quick borrow cho độc giả
router.post("/quick", authMiddleware, pmCtrl.quickBorrow);

// router.get("/my", authMiddleware, pmCtrl.listMyBorrows); // lịch sử của user
// router.post("/:maPM/cancel", authMiddleware, pmCtrl.cancelMine);
module.exports = router;
