// backend/src/app/controllers/sachControllers.js
const path = require("path");
const fs = require("fs/promises");
const Sach = require("../models/sachModel");

const genMaSach = () => "S" + Date.now();

exports.meta = async (_req, res) => {
  try {
    const m = await Sach.getMeta();
    res.json({ success: true, ...m });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Lỗi lấy danh mục" });
  }
};

exports.list = async (_req, res) => {
  try {
    const data = await Sach.list();
    res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Lỗi lấy danh sách" });
  }
};

exports.detail = async (req, res) => {
  try {
    const it = await Sach.getById(req.params.maSach);
    if (!it) return res.status(404).json({ message: "Không tìm thấy sách" });
    res.json({ success: true, data: it });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Lỗi chi tiết" });
  }
};

exports.create = async (req, res) => {
  try {
    const { tieuDe, tomTat, maTL, maNXB, soLuong, maTG } = req.body;
    if (!tieuDe) return res.status(400).json({ message: "Thiếu tiêu đề" });
    const maSach = genMaSach();
    const file = req.file;
    const taiLieuOnl = file ? `/uploads/tailieu/${file.filename}` : null;

    await Sach.create({
      maSach,
      tieuDe,
      tomTat,
      maTL,
      maNXB,
      soLuong: +soLuong || 0,
      maTG,
      taiLieuOnl,
    });
    res.json({ success: true, maSach, message: "Thêm sách thành công" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Không thêm được sách" });
  }
};

exports.update = async (req, res) => {
  try {
    const maSach = req.params.maSach;
    const old = await Sach.getById(maSach);
    if (!old) return res.status(404).json({ message: "Không tìm thấy sách" });

    const { tieuDe, tomTat, maTL, maNXB, soLuong, maTG } = req.body;

    let taiLieuOnl;
    if (req.file) {
      if (old.taiLieuOnl) {
        const absOld = path.join(__dirname, "../../..", old.taiLieuOnl);
        fs.unlink(absOld).catch(() => {});
      }
      taiLieuOnl = `/uploads/tailieu/${req.file.filename}`;
    }

    await Sach.update(maSach, {
      tieuDe,
      tomTat,
      maTL,
      maNXB,
      soLuong: +soLuong || 0,
      maTG,
      ...(taiLieuOnl !== undefined ? { taiLieuOnl } : {}),
    });
    res.json({ success: true, message: "Cập nhật thành công" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Không cập nhật được sách" });
  }
};

exports.remove = async (req, res) => {
  try {
    const old = await Sach.getById(req.params.maSach);
    if (!old) return res.status(404).json({ message: "Không tìm thấy sách" });
    await Sach.remove(req.params.maSach);
    if (old.taiLieuOnl) {
      const abs = path.join(__dirname, "../../..", old.taiLieuOnl);
      fs.unlink(abs).catch(() => {});
    }
    res.json({ success: true, message: "Đã xóa" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Không xóa được" });
  }
};
