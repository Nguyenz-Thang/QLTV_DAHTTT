const TG = require("../models/tacGiaModel");

exports.getAll = async (req, res) => {
  try {
    const data = await TG.list(req.query.q || "");
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ message: "Lỗi tải danh sách tác giả" });
  }
};

exports.create = async (req, res) => {
  try {
    const { tenTG } = req.body || {};
    if (!tenTG) return res.status(400).json({ message: "Thiếu tên tác giả" });
    const r = await TG.create(req.body);
    res.json({ success: true, message: "Đã thêm tác giả", maTG: r.maTG });
  } catch (e) {
    res.status(400).json({ message: e.message || "Không thể thêm" });
  }
};

exports.update = async (req, res) => {
  try {
    const ok = await TG.update(req.params.id, req.body || {});
    if (!ok) return res.status(404).json({ message: "Không tìm thấy tác giả" });
    res.json({ success: true, message: "Đã cập nhật" });
  } catch (e) {
    res.status(400).json({ message: e.message || "Không thể cập nhật" });
  }
};

exports.delete = async (req, res) => {
  try {
    const ok = await TG.remove(req.params.id);
    if (!ok) return res.status(404).json({ message: "Không tìm thấy tác giả" });
    res.json({ success: true, message: "Đã xóa" });
  } catch (e) {
    res.status(400).json({ message: e.message || "Không thể xóa" });
  }
};
