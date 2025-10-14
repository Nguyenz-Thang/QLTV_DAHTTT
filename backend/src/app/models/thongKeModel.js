// backend/src/app/models/thongKeModel.js
const { getPool, sql } = require("../../config/db");

/** Tổng quan: tổng sách, tổng bản đang mượn, số PM quá hạn (còn nợ) */
async function overview() {
  const pool = await getPool();

  // Tổng số đầu sách
  const tongDauSach = await pool.request().query(`
    SELECT COUNT(*) AS n FROM Sach;
  `);

  // Tổng số bản đang mượn (dựa vào cột soLuongMuon trong bảng Sach)
  const dangMuon = await pool.request().query(`
    SELECT ISNULL(SUM(soLuongMuon),0) AS n
    FROM Sach;
  `);

  // Số phiếu mượn quá hạn và còn nợ (chưa trả đủ)
  const quaHan = await pool.request().query(`
    SELECT COUNT(DISTINCT pm.maPM) AS n
    FROM PhieuMuon pm
    WHERE pm.ngayHenTra < GETDATE()
      AND EXISTS (
        SELECT 1 FROM ChiTietPhieuMuon c
        WHERE c.maPM = pm.maPM AND ISNULL(c.trangThai,N'Đang mượn') <> N'Đã trả'
      );
  `);

  return {
    tongDauSach: tongDauSach.recordset[0].n || 0,
    soBanDangMuon: dangMuon.recordset[0].n || 0,
    soPhieuQuaHan: quaHan.recordset[0].n || 0,
  };
}

/** Mượn theo tháng: 6 tháng gần nhất */
async function borrowByMonth(lastN = 6) {
  const pool = await getPool();
  // Lấy theo PhieuMuon (số phiếu) & tổng SL sách mượn
  const rs = await pool.request().query(`
    ;WITH M AS (
      SELECT
        FORMAT(pm.ngayMuon, 'yyyy-MM') AS ym,
        COUNT(DISTINCT pm.maPM) AS soPhieu,
        ISNULL(SUM(ct.soLuong),0) AS tongSach
      FROM PhieuMuon pm
      LEFT JOIN ChiTietPhieuMuon ct ON ct.maPM = pm.maPM
      WHERE pm.ngayMuon >= DATEADD(MONTH, -${
        lastN - 1
      }, CONVERT(date, GETDATE()))
      GROUP BY FORMAT(pm.ngayMuon, 'yyyy-MM')
    )
    SELECT ym, soPhieu, tongSach
    FROM M
    ORDER BY ym ASC;
  `);
  return rs.recordset;
}

/** Top sách mượn nhiều nhất (theo lịch sử mượn) */
async function topBooks(limit = 10) {
  const pool = await getPool();
  const rs = await pool.request().input("lim", sql.Int, limit).query(`
      SELECT TOP (@lim)
        s.maSach, s.tieuDe,
        ISNULL(SUM(ct.soLuong),0) AS soLanMuon
      FROM ChiTietPhieuMuon ct
      JOIN Sach s ON s.maSach = ct.maSach
      GROUP BY s.maSach, s.tieuDe
      ORDER BY soLanMuon DESC, s.tieuDe ASC;
    `);
  return rs.recordset;
}

/** Danh sách PM quá hạn (gọn) – tuỳ bạn có dùng bảng này không */
async function overdueList(limit = 10) {
  const pool = await getPool();
  const rs = await pool.request().input("lim", sql.Int, limit).query(`
      SELECT TOP (@lim)
        pm.maPM, dg.hoTen, pm.ngayMuon, pm.ngayHenTra
      FROM PhieuMuon pm
      LEFT JOIN DocGia dg ON dg.maDG = pm.maDG
      WHERE pm.ngayHenTra < GETDATE()
        AND EXISTS (
          SELECT 1 FROM ChiTietPhieuMuon c
          WHERE c.maPM = pm.maPM AND ISNULL(c.trangThai,N'Đang mượn') <> N'Đã trả'
        )
      ORDER BY pm.ngayHenTra ASC, pm.maPM ASC;
    `);
  return rs.recordset;
}

module.exports = {
  overview,
  borrowByMonth,
  topBooks,
  overdueList,
};
