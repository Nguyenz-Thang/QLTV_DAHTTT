const TK = require("../models/taiKhoanAdminModel");

exports.getAll = async (_req, res) => {
  try {
    const data = await TK.listAll();
    res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Lỗi lấy danh sách tài khoản" });
  }
};

exports.search = async (req, res) => {
  try {
    const data = await TK.search((req.query.q || "").trim());
    res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Lỗi tìm kiếm" });
  }
};

exports.create = async (req, res) => {
  try {
    const { tenDangNhap, matKhau, vaiTro } = req.body || {};
    if (!tenDangNhap || !matKhau || !vaiTro)
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    if (String(matKhau).length < 6)
      return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự" });

    const r = await TK.create(req.body);
    res.json({
      success: true,
      message: "Tạo tài khoản thành công",
      maTK: r.maTK,
    });
  } catch (e) {
    console.error(e);
    const code = e.message?.includes("tồn tại") ? 409 : 400;
    res.status(code).json({ message: e.message || "Lỗi tạo tài khoản" });
  }
};

exports.update = async (req, res) => {
  try {
    const ok = await TK.update(req.params.id, req.body || {});
    if (!ok)
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    res.json({ success: true, message: "Cập nhật tài khoản thành công" });
  } catch (e) {
    console.error(e);
    const code = e.message?.includes("tồn tại") ? 409 : 400;
    res.status(code).json({ message: e.message || "Lỗi cập nhật tài khoản" });
  }
};

exports.delete = async (req, res) => {
  try {
    const ok = await TK.remove(req.params.id);
    if (!ok)
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    res.json({ success: true, message: "Đã xoá tài khoản" });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message || "Không thể xoá" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 6)
      return res
        .status(400)
        .json({ message: "Mật khẩu mới tối thiểu 6 ký tự" });
    await TK.resetPassword(req.params.id, newPassword);
    res.json({ success: true, message: "Đặt lại mật khẩu thành công" });
  } catch (e) {
    console.error(e);
    res
      .status(400)
      .json({ message: e.message || "Không thể đặt lại mật khẩu" });
  }
};
