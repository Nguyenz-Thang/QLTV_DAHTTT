// backend/src/app/controllers/sachControllers.js
const path = require("path");
const fs = require("fs/promises");
const Sach = require("../models/sachModel");

const genMaSach = () => "S" + Date.now();

exports.create = async (req, res) => {
  try {
    const { tieuDe, tomTat, maTL, maNXB, soLuong, maTG } = req.body;
    if (!tieuDe) return res.status(400).json({ message: "Thiếu tiêu đề" });

    const maSach = genMaSach();

    // files
    const fTL = req.files?.taiLieuOnl?.[0];
    const fAnh = req.files?.anhBia?.[0];
    const taiLieuOnl = fTL ? `/uploads/tailieu/${fTL.filename}` : null;
    const anhBia = fAnh ? `/uploads/anhbia/${fAnh.filename}` : null;

    await Sach.create({
      maSach,
      tieuDe,
      tomTat,
      maTL,
      maNXB,
      soLuong: +soLuong || 0,
      maTG,
      taiLieuOnl,
      anhBia, // NEW
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

    let taiLieuOnl; // optional
    let anhBia; // optional

    const fTL = req.files?.taiLieuOnl?.[0];
    const fAnh = req.files?.anhBia?.[0];

    if (fTL) {
      if (old.taiLieuOnl) {
        const absOld = path.join(__dirname, "../../..", old.taiLieuOnl);
        fs.unlink(absOld).catch(() => {});
      }
      taiLieuOnl = `/uploads/tailieu/${fTL.filename}`;
    }

    if (fAnh) {
      if (old.anhBia) {
        const absOld = path.join(__dirname, "../../..", old.anhBia);
        fs.unlink(absOld).catch(() => {});
      }
      anhBia = `/uploads/anhbia/${fAnh.filename}`;
    }

    await Sach.update(maSach, {
      tieuDe,
      tomTat,
      maTL,
      maNXB,
      soLuong: +soLuong || 0,
      maTG,
      ...(taiLieuOnl !== undefined ? { taiLieuOnl } : {}),
      ...(anhBia !== undefined ? { anhBia } : {}),
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

    const filesToDelete = [old.taiLieuOnl, old.anhBia].filter(Boolean);
    await Promise.all(
      filesToDelete.map(async (rel) => {
        const abs = path.join(__dirname, "../../..", rel);
        await fs.unlink(abs).catch(() => {});
      })
    );

    res.json({ success: true, message: "Đã xóa" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Không xóa được" });
  }
};
exports.meta = async (req, res) => {
  try {
    // Sach.getMeta() phải có trong sachModel.js
    const data = await Sach.getMeta();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Không lấy được meta sách" });
  }
};

exports.list = async (req, res) => {
  try {
    // hỗ trợ query nếu model có nhận (tùy bạn đã viết)
    const data = await Sach.list(req.query || {});
    res.json({ data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Không lấy được danh sách sách" });
  }
};

exports.detail = async (req, res) => {
  try {
    const { maSach } = req.params;
    const book = await Sach.getById(maSach);
    if (!book) return res.status(404).json({ message: "Không tìm thấy sách" });
    res.json(book);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Không lấy được chi tiết sách" });
  }
};
