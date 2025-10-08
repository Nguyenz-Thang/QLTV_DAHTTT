const ThuThu = require("../models/thuThuModel");

async function getThuThu(req, res) {
  try {
    const data = await ThuThu.getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function createThuThu(req, res) {
  try {
    let newId = "TT001";

    newId = "TT" + Date.now();

    // Gán vào body để lưu
    const newThuThu = { ...req.body, maTT: newId };

    const result = await ThuThu.create(newThuThu);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleteThuThu(req, res) {
  try {
    const success = await ThuThu.remove(req.params.id);
    if (!success)
      return res.status(404).json({ message: "Không tìm thấy thủ thư" });
    res.json({ message: "Đã xoá thủ thư" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateThuThu(req, res) {
  try {
    const result = await ThuThu.update(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getThuThu, createThuThu, deleteThuThu, updateThuThu };
