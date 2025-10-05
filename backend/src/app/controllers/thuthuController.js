const thuThuModel = require('../models/thuthuModel');

async function getAllThuThu(req, res) {
    try {
        const data = await thuThuModel.getAllThuThu();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách thủ thư' });
    }
}

async function getThuThuById(req, res) {
    try {
        const data = await thuThuModel.getThuThuById(req.params.id);
        if (!data) return res.status(404).json({ message: 'Không tìm thấy thủ thư' });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy thủ thư' });
    }
}

async function createThuThu(req, res) {
    try {
        const result = await thuThuModel.createThuThu(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo thủ thư' });
    }
}

async function updateThuThu(req, res) {
    try {
        const result = await thuThuModel.updateThuThu(req.params.id, req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật thủ thư' });
    }
}

async function deleteThuThu(req, res) {
    try {
        const result = await thuThuModel.deleteThuThu(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa thủ thư' });
    }
}

module.exports = { getAllThuThu, getThuThuById, createThuThu, updateThuThu, deleteThuThu };
