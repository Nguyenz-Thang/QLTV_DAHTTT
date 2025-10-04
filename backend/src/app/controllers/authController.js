// backend/controllers/authController.js
const jwt = require("jsonwebtoken");
const TaiKhoan = require("../models/taiKhoanModel");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || "secret_key_please_change";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";

async function register(req, res) {
  try {
    const { tenDangNhap, matKhau, vaiTro, maDG, maTT } = req.body;
    if (!tenDangNhap || !matKhau)
      return res.status(400).json({
        message: "Thiếu username hoặc password",
      });

    const existing = await TaiKhoan.findByUsername(tenDangNhap);
    if (existing)
      return res.status(409).json({ message: "Tên đăng nhập đã tồn tại" });

    const maTK = "TK" + Date.now(); // or generate GUID/UUID if muốn
    await TaiKhoan.createUser({
      maTK,
      tenDangNhap,
      passwordPlain: matKhau,
      vaiTro,
      maDG,
      maTT,
    });

    res.json({
      success: true,
      message: "Đăng ký thành công",
      maTK,
      tenDangNhap,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

async function login(req, res) {
  try {
    const { tenDangNhap, matKhau } = req.body;
    if (!tenDangNhap || !matKhau)
      return res.status(400).json({ message: "Thiếu username hoặc password" });

    const user = await TaiKhoan.findByUsername(tenDangNhap);
    if (!user)
      return res.status(404).json({ message: "Tài khoản không tồn tại" });

    const ok = await bcrypt.compare(matKhau, user.matKhau);
    if (!ok) {
      return res
        .status(401)
        .json({ message: "Sai mật khẩu" + matKhau + user.matKhau });
    }

    const payload = {
      maTK: user.maTK,
      tenDangNhap: user.tenDangNhap,
      vaiTro: user.vaiTro,
      hoTen: user.hoTen || user.tenTT || "Chưa có thông tin",
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({ success: true, token, user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Thiếu mật khẩu cũ hoặc mới" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải từ 6 ký tự" });
    }

    // req.user.maTK có từ middleware auth
    const me = await TaiKhoan.findByMaTK(req.user.maTK);
    if (!me)
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });

    const ok = await bcrypt.compare(oldPassword, me.matKhau);
    if (!ok) return res.status(401).json({ message: "Mật khẩu cũ không đúng" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await TaiKhoan.updatePassword(me.maTK, hashed);

    return res.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Lỗi server" });
  }
}

module.exports = { register, login, changePassword };
