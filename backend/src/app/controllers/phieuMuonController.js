const PhieuMuon = require("../models/phieuMuonModel");

// GET /api/phieumuon
async function getPhieuMuon(req, res) {
  try {
    const data = await PhieuMuon.getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// POST /api/phieumuon
async function createPhieuMuon(req, res) {
  try {
    const result = await PhieuMuon.create(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// DELETE /api/phieumuon/:id
async function deletePhieuMuon(req, res) {
  try {
    const success = await PhieuMuon.remove(req.params.id);
    if (!success)
      return res.status(404).json({ message: "Không tìm thấy phiếu mượn" });
    res.json({ message: "Đã xoá phiếu mượn" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// PUT /api/phieumuon/:id
async function updatePhieuMuon(req, res) {
  try {
    const result = await PhieuMuon.update(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getPhieuMuon, createPhieuMuon, deletePhieuMuon, updatePhieuMuon };
