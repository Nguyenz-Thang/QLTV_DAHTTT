// controllers/phieuTraController.js
const PT = require("../models/phieuTraModel");

exports.list = async (req, res) => {
  try {
    const data = await PT.listPhieuTra();
    res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Lỗi lấy danh sách phiếu trả" });
  }
};

exports.detail = async (req, res) => {
  try {
    const row = await PT.getPhieuTra(req.params.maPT);
    if (!row)
      return res.status(404).json({ message: "Không tìm thấy phiếu trả" });
    res.json({ success: true, data: row });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Lỗi lấy chi tiết phiếu trả" });
  }
};

exports.create = async (req, res) => {
  try {
    const { maPM, items = [], ngayTra } = req.body || {};
    if (!maPM || !Array.isArray(items) || items.length === 0)
      return res
        .status(400)
        .json({ message: "Thiếu maPM hoặc danh sách sách trả" });

    const maTT = req.user?.maTT || null; // từ token
    const { maPT } = await PT.createPhieuTra({ maPM, maTT, ngayTra, items });
    res.json({ success: true, message: "Tạo phiếu trả thành công", maPT });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message || "Tạo phiếu trả thất bại" });
  }
};

exports.updateHeader = async (req, res) => {
  try {
    const ok = await PT.updateHeader(req.params.maPT, {
      ngayTra: req.body?.ngayTra,
      maTT: req.body?.maTT || req.user?.maTT || null,
    });
    if (!ok)
      return res.status(404).json({ message: "Không tìm thấy phiếu trả" });
    res.json({ success: true, message: "Cập nhật phiếu trả thành công" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Cập nhật phiếu trả thất bại" });
  }
};

exports.remove = async (req, res) => {
  try {
    const ok = await PT.deletePhieuTra(req.params.maPT);
    if (!ok)
      return res.status(404).json({ message: "Không tìm thấy phiếu trả" });
    res.json({ success: true, message: "Đã xoá phiếu trả" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Xoá phiếu trả thất bại" });
  }
};
