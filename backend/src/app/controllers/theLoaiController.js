// backend/src/app/controllers/theLoaiController.js
const TheLoai = require("../models/theLoaiModel");

exports.getAll = async (req, res) => {
  try {
    const data = await TheLoai.getAll();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách thể loại" });
  }
};

exports.create = async (req, res) => {
  try {
    const newItem = await TheLoai.create(req.body);
    res.json({ message: "Thêm thể loại thành công", data: newItem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi thêm thể loại" });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await TheLoai.update(id, req.body);
    res.json({ message: "Cập nhật thành công", data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật thể loại" });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await TheLoai.remove(id);
    res.json({ message: "Xóa thể loại thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xóa thể loại" });
  }
};

exports.search = async (req, res) => {
  try {
    const keyword = req.query.q || "";
    const result = await TheLoai.search(keyword);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tìm kiếm thể loại" });
  }
};
