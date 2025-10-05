const phieuMuonModel = require('../models/phieumuonModel');

async function getAllPhieuMuon(req, res) {
    try {
        const data = await phieuMuonModel.getAllPhieuMuon();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách phiếu mượn' });
    }
}

async function getPhieuMuonById(req, res) {
    try {
        const data = await phieuMuonModel.getPhieuMuonById(req.params.id);
        if (data.length === 0) return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy phiếu mượn' });
    }
}

async function createPhieuMuon(req, res) {
    try {
        const result = await phieuMuonModel.createPhieuMuon(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo phiếu mượn' });
    }
}

async function updatePhieuMuon(req, res) {
    try {
        const result = await phieuMuonModel.updatePhieuMuon(req.params.id, req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật phiếu mượn' });
    }
}

async function deletePhieuMuon(req, res) {
    try {
        const result = await phieuMuonModel.deletePhieuMuon(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa phiếu mượn' });
    }
}

module.exports = {
    getAllPhieuMuon,
    getPhieuMuonById,
    createPhieuMuon,
    updatePhieuMuon,
    deletePhieuMuon
};
