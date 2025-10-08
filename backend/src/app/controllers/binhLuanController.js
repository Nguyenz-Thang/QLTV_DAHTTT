// src/app/controllers/binhLuanController.js
const BinhLuan = require("../models/binhLuanModel");

// GET /api/binhluan?sachId=...
async function list(req, res) {
  try {
    const { sachId } = req.query;
    if (!sachId) return res.status(400).json({ message: "Thiếu sachId" });
    const data = await BinhLuan.listBySach(sachId);
    // Chuẩn hoá id để FE tiện dùng
    const mapped = data.map((x) => ({ id: x.maBL, ...x }));
    res.json({ success: true, data: mapped });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Lỗi lấy bình luận" });
  }
}

// POST /api/binhluan  { maSach, noiDung, maBLCha? }
async function create(req, res) {
  try {
    const { maSach, noiDung, maBLCha = null } = req.body || {};
    const me = req.user; // từ authMiddleware
    if (!me?.maTK) return res.status(401).json({ message: "Chưa đăng nhập" });
    if (!maSach || !noiDung?.trim())
      return res.status(400).json({ message: "Thiếu dữ liệu" });

    const result = await BinhLuan.create({
      maSach,
      maTK: me.maTK,
      noiDung: noiDung.trim(),
      maBLCha: maBLCha || null,
    });
    res.json({ success: true, ...result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Không tạo được bình luận" });
  }
}

// PATCH /api/binhluan/:id  { noiDung }
async function update(req, res) {
  try {
    const { id } = req.params;
    const { noiDung } = req.body || {};
    if (!noiDung?.trim())
      return res.status(400).json({ message: "Nội dung trống" });

    const bl = await BinhLuan.findById(id);
    if (!bl) return res.status(404).json({ message: "Không tồn tại" });

    // chỉ owner hoặc quản lý/thủ thư
    const me = req.user;
    const isAdmin = ["Quản lý", "Thủ thư"].includes(me?.vaiTro);
    if (!isAdmin && me?.maTK !== bl.maTK)
      return res.status(403).json({ message: "Không có quyền" });

    const ok = await BinhLuan.update(id, noiDung.trim());
    res.json({ success: ok });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Không cập nhật được" });
  }
}

// DELETE /api/binhluan/:id  (?thread=1)  -> luôn xoá cả thread
async function remove(req, res) {
  try {
    const { id } = req.params;
    const bl = await BinhLuan.findById(id);
    if (!bl) return res.status(404).json({ message: "Không tồn tại" });

    // owner hoặc quản lý/thủ thư
    const me = req.user;
    const isAdmin = ["Quản lý", "Thủ thư"].includes(me?.vaiTro);
    if (!isAdmin && me?.maTK !== bl.maTK)
      return res.status(403).json({ message: "Không có quyền" });

    await BinhLuan.removeThread(id);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Không xoá được" });
  }
}

module.exports = { list, create, update, remove };
