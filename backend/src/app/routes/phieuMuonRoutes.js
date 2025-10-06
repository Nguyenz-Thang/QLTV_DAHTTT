const express = require("express");
const router = express.Router();
const { getPhieuMuon, createPhieuMuon, deletePhieuMuon, updatePhieuMuon } = require("../controllers/phieuMuonController");
const { authMiddleware } = require("../middleware/auth");

router.get("/", authMiddleware, getPhieuMuon);
router.post("/", authMiddleware, createPhieuMuon);
router.delete("/:id", authMiddleware, deletePhieuMuon);
router.put("/:id", authMiddleware, updatePhieuMuon);

module.exports = router;
