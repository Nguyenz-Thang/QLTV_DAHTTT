// backend/src/app/models/thongKeModel.js
const { getPool, sql } = require("../../config/db");

/** Tổng quan: tổng sách, tổng bản đang mượn, số PM quá hạn (còn nợ) */
async function overview() {
  const pool = await getPool();

  const tongDauSach = await pool.request().query(`
    SELECT COUNT(*) AS n FROM Sach;
  `);

  const dangMuon = await pool.request().query(`
    SELECT ISNULL(SUM(soLuongMuon), 0) AS n
    FROM Sach;
  `);

  const quaHan = await pool.request().query(`
    SELECT COUNT(DISTINCT pm.maPM) AS n
    FROM PhieuMuon pm
    WHERE pm.ngayHenTra < GETDATE()
      AND EXISTS (
        SELECT 1
        FROM ChiTietPhieuMuon c
        WHERE c.maPM = pm.maPM
          AND ISNULL(c.trangThai, N'Đang mượn') <> N'Đã trả'
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
  const rs = await pool.request().query(`
    ;WITH M AS (
      SELECT
        FORMAT(pm.ngayMuon, 'yyyy-MM') AS ym,
        COUNT(DISTINCT pm.maPM) AS soPhieu,
        ISNULL(SUM(ct.soLuong), 0) AS tongSach
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

/** Mượn theo khoảng ngày (tổng theo ngày) */
async function borrowByDateRange(from, to) {
  const pool = await getPool();
  if (!from || !to) return [];
  const q = `
    SELECT 
      FORMAT(pm.ngayMuon, 'yyyy-MM-dd') AS ngay,
      COUNT(DISTINCT pm.maPM) AS soPhieu,
      ISNULL(SUM(ct.soLuong), 0) AS tongSach
    FROM PhieuMuon pm
    LEFT JOIN ChiTietPhieuMuon ct ON ct.maPM = pm.maPM
    WHERE pm.ngayMuon BETWEEN @from AND @to
    GROUP BY FORMAT(pm.ngayMuon, 'yyyy-MM-dd')
    ORDER BY ngay ASC;
  `;
  const rs = await pool
    .request()
    .input("from", sql.Date, from)
    .input("to", sql.Date, to)
    .query(q);
  return rs.recordset;
}

/** Top sách mượn nhiều nhất: tự phát hiện cột ảnh bìa (anhBia / hinhAnh / taiLieuOnl) */
async function topBooks(limit = 10) {
  const pool = await getPool();

  // 1) Lấy danh sách cột ảnh hiện có trong bảng Sach
  const colRes = await pool.request().query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Sach' AND COLUMN_NAME IN ('anhBia','hinhAnh','taiLieuOnl');
  `);
  const have = new Set(
    colRes.recordset.map((r) => (r.COLUMN_NAME || "").toLowerCase())
  );

  // 2) Xây biểu thức COALESCE theo thứ tự ưu tiên nhưng chỉ dùng cột thật sự tồn tại
  const parts = [];
  if (have.has("anhbia")) parts.push("s.anhBia");
  if (have.has("hinhanh")) parts.push("s.hinhAnh");
  if (have.has("tailieuonl")) parts.push("s.taiLieuOnl");
  const coverExpr =
    parts.length > 0
      ? `NULLIF(LTRIM(RTRIM(COALESCE(${parts.join(", ")}, ''))), '')`
      : `NULL`;

  // 3) Query Top mượn
  const q = `
    SELECT TOP (@lim)
      s.maSach,
      s.tieuDe,
      tg.tenTG AS tacGia,
      ${coverExpr} AS coverPath,
      ISNULL(SUM(ct.soLuong), 0) AS soLanMuon
    FROM ChiTietPhieuMuon ct
    JOIN Sach s ON s.maSach = ct.maSach
    LEFT JOIN TacGia tg ON tg.maTG = s.maTG
    GROUP BY s.maSach, s.tieuDe, tg.tenTG${
      parts.length ? "," + parts.map((p) => " " + p).join(",") : ""
    }
    ORDER BY soLanMuon DESC, s.tieuDe ASC;
  `;
  const rs = await pool.request().input("lim", sql.Int, limit).query(q);

  // 4) Chuẩn hoá URL ảnh bìa: nếu relative -> ghép BASE
  const BASE = (process.env.STATIC_BASE_URL || "").replace(/\/+$/, "");
  const toPublicUrl = (p) => {
    if (!p) return null;
    if (/^https?:\/\//i.test(p)) return p; // URL tuyệt đối
    const rel = p.startsWith("/") ? p : "/" + p; // đảm bảo có '/'
    return BASE ? `${BASE}${rel}` : rel;
  };

  return rs.recordset.map((r) => ({
    maSach: r.maSach,
    tieuDe: r.tieuDe,
    tacGia: r.tacGia || "Chưa rõ",
    soLanMuon: r.soLanMuon,
    anhBia: toPublicUrl(r.coverPath), // FE đọc trường này
  }));
}

/** Danh sách phiếu mượn quá hạn */
async function overdueList(limit = 10) {
  const pool = await getPool();
  const rs = await pool.request().input("lim", sql.Int, limit).query(`
    SELECT TOP (@lim)
      pm.maPM, dg.hoTen, pm.ngayMuon, pm.ngayHenTra
    FROM PhieuMuon pm
    LEFT JOIN DocGia dg ON dg.maDG = pm.maDG
    WHERE pm.ngayHenTra < GETDATE()
      AND EXISTS (
        SELECT 1
        FROM ChiTietPhieuMuon c
        WHERE c.maPM = pm.maPM
          AND ISNULL(c.trangThai, N'Đang mượn') <> N'Đã trả'
      )
    ORDER BY pm.ngayHenTra ASC, pm.maPM ASC;
  `);
  return rs.recordset;
}

/** Chi tiết mượn trong khoảng ngày */
async function borrowDetailsByDateRange(from, to) {
  const pool = await getPool();
  if (!from || !to) return [];

  const q = `
    SELECT 
      pm.maPM,
      s.maSach,
      s.tieuDe AS tenSach,
      tt.tenTT AS tenThuThu,
      dg.hoTen AS tenDocGia,
      pm.ngayMuon,
      pm.ngayHenTra,
      ISNULL(ct.soLuong, 1) AS soLuong
    FROM PhieuMuon pm
    JOIN ChiTietPhieuMuon ct ON pm.maPM = ct.maPM
    JOIN Sach s ON s.maSach = ct.maSach
    LEFT JOIN ThuThu tt ON tt.maTT = pm.maTT
    LEFT JOIN DocGia dg ON dg.maDG = pm.maDG
    WHERE pm.ngayMuon BETWEEN @from AND @to
    ORDER BY pm.ngayMuon ASC, pm.maPM ASC;
  `;
  const rs = await pool
    .request()
    .input("from", sql.Date, from)
    .input("to", sql.Date, to)
    .query(q);
  return rs.recordset;
}

/** Lấy toàn bộ danh sách mượn (mọi thời gian) */
async function borrowAllDetails() {
  const pool = await getPool();
  const q = `
    SELECT 
      pm.maPM,
      s.maSach,
      s.tieuDe AS tenSach,
      tt.tenTT AS tenThuThu,
      dg.hoTen AS tenDocGia,
      pm.ngayMuon,
      pm.ngayHenTra,
      ISNULL(ct.soLuong, 1) AS soLuong
    FROM PhieuMuon pm
    JOIN ChiTietPhieuMuon ct ON pm.maPM = ct.maPM
    JOIN Sach s ON s.maSach = ct.maSach
    LEFT JOIN ThuThu tt ON tt.maTT = pm.maTT
    LEFT JOIN DocGia dg ON dg.maDG = pm.maDG
    ORDER BY pm.ngayMuon ASC, pm.maPM ASC;
  `;
  const rs = await pool.request().query(q);
  return rs.recordset;
}

module.exports = {
  overview,
  borrowByMonth,
  borrowByDateRange,
  topBooks,
  overdueList,
  borrowDetailsByDateRange,
  borrowAllDetails,
};
