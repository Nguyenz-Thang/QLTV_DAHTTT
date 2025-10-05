const express = require('express');
const router = express.Router();
const phieuMuonController = require('../controllers/phieuMuonController');

// CRUD
router.get('/', phieuMuonController.getAllPhieuMuon);        // Lấy tất cả phiếu mượn
router.get('/:id', phieuMuonController.getPhieuMuonById);    // Lấy theo ID
router.post('/', phieuMuonController.createPhieuMuon);       // Tạo mới
router.put('/:id', phieuMuonController.updatePhieuMuon);     // Cập nhật
router.delete('/:id', phieuMuonController.deletePhieuMuon);  // Xóa

module.exports = router;
