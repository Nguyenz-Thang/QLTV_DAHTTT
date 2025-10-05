const express = require('express');
const router = express.Router();
const thuThuController = require('../controllers/thuthuController');

// CRUD
router.get('/', thuThuController.getAllThuThu);         // Lấy tất cả thủ thư
router.get('/:id', thuThuController.getThuThuById);     // Lấy 1 thủ thư
router.post('/', thuThuController.createThuThu);        // Thêm mới
router.put('/:id', thuThuController.updateThuThu);      // Cập nhật
router.delete('/:id', thuThuController.deleteThuThu);   // Xóa

module.exports = router;
