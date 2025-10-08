const PM = require("../models/phieuMuonModel");

exports.getPhieuMuon = async (req, res) => {
  try {
    const data = await PM.listAll(req.query.q || "");
    res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Lỗi lấy danh sách phiếu mượn" });
  }
};

exports.createPhieuMuon = async (req, res) => {
  try {
    const { maDG, maTT, items } = req.body || {};
    if (!maDG || !maTT)
      return res.status(400).json({ message: "Thiếu độc giả hoặc thủ thư" });
    if (!Array.isArray(items) || !items.length)
      return res.status(400).json({ message: "Thiếu chi tiết mượn" });
    const r = await PM.create(req.body);
    res.json({
      success: true,
      message: "Tạo phiếu mượn thành công",
      maPM: r.maPM,
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message || "Lỗi tạo phiếu mượn" });
  }
};

exports.updatePhieuMuon = async (req, res) => {
  try {
    const ok = await PM.update(req.params.id, req.body || {});
    if (!ok)
      return res.status(404).json({ message: "Không tìm thấy phiếu mượn" });
    res.json({ success: true, message: "Cập nhật phiếu mượn thành công" });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message || "Lỗi cập nhật phiếu mượn" });
  }
};

exports.deletePhieuMuon = async (req, res) => {
  try {
    const ok = await PM.remove(req.params.id);
    if (!ok)
      return res.status(404).json({ message: "Không tìm thấy phiếu mượn" });
    res.json({ success: true, message: "Đã xoá phiếu mượn" });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message || "Không thể xoá" });
  }
};
// NEW: suggest theo maPM / MSSV / tên
exports.suggest = async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    // Nếu muốn tránh spam: q < 2 ký tự thì trả [] nhưng vẫn 200
    if (q.length < 2) return res.json({ data: [] });

    const data = await PM.suggest(q);
    return res.json({ data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// NEW: danh sách sách còn nợ của 1 PM
exports.remaining = async (req, res) => {
  try {
    const maPM = req.params.maPM;
    const data = await PM.remaining(maPM);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
