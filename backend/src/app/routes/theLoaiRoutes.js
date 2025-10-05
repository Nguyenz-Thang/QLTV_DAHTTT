const express = require('express');
const router = express.Router();
const theLoaiController = require('../controllers/theLoaiController');

// GET /theloai → lấy danh sách thể loại
router.get('/', theLoaiController.getAll);

// POST /theloai → thêm thể loại
router.post('/', theLoaiController.create);

// PUT /theloai/:id → cập nhật thể loại
router.put('/:id', theLoaiController.update);

// DELETE /theloai/:id → xóa thể loại
router.delete('/:id', theLoaiController.delete);

// GET /theloai/search?q=abc → tìm kiếm
router.get('/search', theLoaiController.search);

module.exports = router;
