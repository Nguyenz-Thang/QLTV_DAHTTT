const PM = require("../models/phieuMuonModel");

exports.getPhieuMuon = async (req, res) => {
  try {
    const data = await PM.listAll(req.query.q || "");
    res.json({ success: true, data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Lỗi lấy danh sách phiếu mượn" });
  }
};

exports.createPhieuMuon = async (req, res) => {
  try {
    const { maDG, maTT, items } = req.body || {};
    if (!maDG || !maTT)
      return res.status(400).json({ message: "Thiếu độc giả hoặc thủ thư" });
    if (!Array.isArray(items) || !items.length)
      return res.status(400).json({ message: "Thiếu chi tiết mượn" });
    const r = await PM.create(req.body);
    res.json({
      success: true,
      message: "Tạo phiếu mượn thành công",
      maPM: r.maPM,
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message || "Lỗi tạo phiếu mượn" });
  }
};

exports.updatePhieuMuon = async (req, res) => {
  try {
    const ok = await PM.update(req.params.id, req.body || {});
    if (!ok)
      return res.status(404).json({ message: "Không tìm thấy phiếu mượn" });
    res.json({ success: true, message: "Cập nhật phiếu mượn thành công" });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message || "Lỗi cập nhật phiếu mượn" });
  }
};

exports.deletePhieuMuon = async (req, res) => {
  try {
    const ok = await PM.remove(req.params.id);
    if (!ok)
      return res.status(404).json({ message: "Không tìm thấy phiếu mượn" });
    res.json({ success: true, message: "Đã xoá phiếu mượn" });
  } catch (e) {
    console.error(e);
    // Lỗi ràng buộc FK (SQL Server thường là 547)
    const code = e.number || e.originalError?.number;
    const isFK =
      code === 547 || /REFERENCE constraint/i.test(String(e.message || ""));
    if (isFK) {
      return res.status(409).json({
        message:
          "Không thể xoá phiếu mượn vì đã phát sinh phiếu trả liên quan. " +
          "Vui lòng xoá/thu hồi các phiếu trả của phiếu mượn này trước.",
      });
    }
    return res
      .status(400)
      .json({ message: e.message || "Không thể xoá phiếu mượn" });
  }
};

// NEW: suggest theo maPM / MSSV / tên
exports.suggest = async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    // Nếu muốn tránh spam: q < 2 ký tự thì trả [] nhưng vẫn 200
    if (q.length < 2) return res.json({ data: [] });

    const data = await PM.suggest(q);
    return res.json({ data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// NEW: danh sách sách còn nợ của 1 PM
exports.remaining = async (req, res) => {
  try {
    const maPM = req.params.maPM;
    const data = await PM.remaining(maPM);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
exports.quickBorrow = async (req, res) => {
  try {
    const { maSach, soLuong = 1, ngayHenTra = null } = req.body || {};
    if (!maSach) return res.status(400).json({ message: "Thiếu mã sách." });

    // Lấy mã độc giả từ token (tùy payload bạn đang ký trong JWT)
    const maDG = req.user?.maDG;
    if (!maDG) {
      return res
        .status(400)
        .json({ message: "Không xác định độc giả (maDG) từ token." });
    }

    // Toàn bộ kiểm kho + tạo PM nằm ở model
    const created = await PM.createWithStockCheck({
      maDG,
      maTT: null, // nếu muốn, có thể lấy từ req.user.maTT khi thủ thư thao tác
      ngayMuon: new Date(), // hôm nay
      ngayHenTra: ngayHenTra ? new Date(ngayHenTra) : null,
      items: [
        {
          maSach: String(maSach),
          soLuong: Number(soLuong) || 1,
          trangThai: "Đang mượn",
        },
      ],
    });

    return res.json({ data: created });
  } catch (e) {
    console.error("quickBorrow error:", e);
    return res.status(500).json({ message: e.message || "Lỗi mượn nhanh." });
  }
};
// GET /api/phieumuon/my?q=&status=
async function resolveMaDGFromUser(user) {
  if (!user) return null;
  if (user.maDG) return String(user.maDG);

  const pool = await getPool();
  // Thử theo maTK
  if (user.maTK) {
    const rs = await pool
      .request()
      .input("maTK", sql.VarChar, String(user.maTK))
      .query(`SELECT maDG FROM TaiKhoan WHERE maTK=@maTK`);
    if (rs.recordset[0]?.maDG) return String(rs.recordset[0].maDG);
  }
  // Hoặc theo tên đăng nhập
  if (user.tenDangNhap) {
    const rs = await pool
      .request()
      .input("tdn", sql.VarChar, String(user.tenDangNhap))
      .query(`SELECT maDG FROM TaiKhoan WHERE tenDangNhap=@tdn`);
    if (rs.recordset[0]?.maDG) return String(rs.recordset[0].maDG);
  }
  return null;
}
