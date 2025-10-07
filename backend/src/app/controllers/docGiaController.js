const DocGia = require("../models/docGiaModel");

// 🟢 Lấy tất cả độc giả
exports.getAll = async (req, res) => {
  try {
    const data = await DocGia.getAll();
    res.status(200).json(data);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách độc giả:", err);
    res.status(500).json({ message: err.message || "Lỗi khi lấy danh sách độc giả" });
  }
};

// 🟢 Thêm độc giả
exports.create = async (req, res) => {
  try {
    const result = await DocGia.create(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error("❌ Lỗi khi thêm độc giả:", err.message);

    if (err.message.includes("tồn tại") || err.message.includes("MSV") || err.message.includes("email")) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: err.message || "Lỗi khi thêm độc giả" });
  }
};

// 🟡 Cập nhật độc giả
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await DocGia.update(id, req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật độc giả:", err.message);

    if (err.message.includes("tồn tại") || err.message.includes("không") || err.message.includes("Độc giả")) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: err.message || "Lỗi khi cập nhật độc giả" });
  }
};

// 🔴 Xóa độc giả
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await DocGia.delete(id);
    res.status(200).json({ message: "Xóa độc giả thành công" });
  } catch (err) {
    console.error("Lỗi khi xóa độc giả:", err.message);

    if (err.message.includes("REFERENCE")) {
      return res.status(400).json({
        message: "Không thể xóa độc giả vì đang liên kết với bảng Tài Khoản.",
      });
    }

    res.status(500).json({ message: err.message || "Lỗi khi xóa độc giả" });
  }
};

// 🔍 Tìm kiếm độc giả
exports.search = async (req, res) => {
  try {
    const keyword = req.query.q || "";
    const results = await DocGia.search(keyword);
    res.status(200).json(results);
  } catch (err) {
    console.error("❌ Lỗi khi tìm kiếm độc giả:", err.message);
    res.status(500).json({ message: err.message || "Lỗi khi tìm kiếm độc giả" });
  }
};
