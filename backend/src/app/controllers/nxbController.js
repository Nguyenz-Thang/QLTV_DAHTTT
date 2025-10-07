const NXB = require("../models/nxbModel");

exports.getAll = async (_req, res) => {
  try {
    const data = await NXB.listAll();
    res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Lỗi lấy danh sách NXB" });
  }
};

exports.search = async (req, res) => {
  try {
    const data = await NXB.search((req.query.q || "").trim());
    res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Lỗi tìm kiếm" });
  }
};

exports.create = async (req, res) => {
  try {
    const { tenNXB } = req.body || {};
    if (!tenNXB) return res.status(400).json({ message: "Thiếu tên NXB" });
    const r = await NXB.create(req.body);
    res.json({ success: true, message: "Tạo NXB thành công", maNXB: r.maNXB });
  } catch (e) {
    console.error(e);
    const code = e.message?.includes("tồn tại") ? 409 : 500;
    res.status(code).json({ message: e.message || "Lỗi tạo NXB" });
  }
};

exports.update = async (req, res) => {
  try {
    const ok = await NXB.update(req.params.id, req.body || {});
    if (!ok) return res.status(404).json({ message: "Không tìm thấy NXB" });
    res.json({ success: true, message: "Cập nhật NXB thành công" });
  } catch (e) {
    console.error(e);
    const code = e.message?.includes("tồn tại") ? 409 : 500;
    res.status(code).json({ message: e.message || "Lỗi cập nhật NXB" });
  }
};

exports.delete = async (req, res) => {
  try {
    const ok = await NXB.remove(req.params.id);
    if (!ok) return res.status(404).json({ message: "Không tìm thấy NXB" });
    res.json({ success: true, message: "Đã xoá NXB" });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message || "Không thể xoá" });
  }
};
