const { getPool, sql } = require("../../config/db");

async function listByAccount({
  maTK,
  dateFrom,
  dateTo,
  status,
  page = 1,
  pageSize = 20,
}) {
  const pool = await getPool();
  const offset = (Math.max(1, +page) - 1) * Math.max(1, +pageSize);

  // build where phụ
  const where = [];
  if (dateFrom) where.push("pm.ngayMuon >= @dateFrom");
  if (dateTo) where.push("pm.ngayMuon < DATEADD(DAY, 1, @dateTo)"); // inclusive
  // status: all | borrowing | returned | partial
  if (status === "borrowing")
    where.push("(ISNULL(rt.soLuongTra,0) < ctm.soLuong)");
  if (status === "returned")
    where.push("(ISNULL(rt.soLuongTra,0) >= ctm.soLuong)");
  if (status === "partial")
    where.push(
      "(ISNULL(rt.soLuongTra,0) > 0 AND ISNULL(rt.soLuongTra,0) < ctm.soLuong)"
    );

  const whereSql = where.length ? " AND " + where.join(" AND ") : "";

  const q = `
    WITH rt AS (
      SELECT pt.maPM, ctpt.maSach,
             SUM(ctpt.soLuong) AS soLuongTra,
             MAX(pt.ngayTra)   AS ngayTraCuoi,
             MAX(ctpt.tinhTrang) AS tinhTrangCuoi
      FROM PhieuTra pt
      JOIN ChiTietPhieuTra ctpt ON ctpt.maPT = pt.maPT
      GROUP BY pt.maPM, ctpt.maSach
    )
    SELECT
      pm.maPM, pm.ngayMuon, pm.ngayHenTra,
      s.maSach, s.tieuDe,
      ctm.soLuong                    AS soLuongMuon,
      ISNULL(rt.soLuongTra,0)        AS soLuongTra,
      rt.ngayTraCuoi                 AS ngayTra,
      rt.tinhTrangCuoi               AS tinhTrang,
      CASE
        WHEN ISNULL(rt.soLuongTra,0) >= ctm.soLuong THEN N'Đã trả'
        WHEN ISNULL(rt.soLuongTra,0) = 0 THEN N'Đang mượn'
        ELSE N'Đang mượn (trả thiếu)'
      END AS trangThai
    FROM TaiKhoan tk
    JOIN DocGia dg ON dg.maDG = tk.maDG
    JOIN PhieuMuon pm ON pm.maDG = dg.maDG
    JOIN ChiTietPhieuMuon ctm ON ctm.maPM = pm.maPM
    JOIN Sach s ON s.maSach = ctm.maSach
    LEFT JOIN rt ON rt.maPM = pm.maPM AND rt.maSach = ctm.maSach
    WHERE tk.maTK = @maTK
    ${whereSql}
    ORDER BY pm.ngayMuon DESC, pm.maPM DESC, s.tieuDe
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;

    -- total for pagination
    WITH rt AS (
      SELECT pt.maPM, ctpt.maSach,
             SUM(ctpt.soLuong) AS soLuongTra
      FROM PhieuTra pt
      JOIN ChiTietPhieuTra ctpt ON ctpt.maPT = pt.maPT
      GROUP BY pt.maPM, ctpt.maSach
    )
    SELECT COUNT(*) AS total
    FROM TaiKhoan tk
    JOIN DocGia dg ON dg.maDG = tk.maDG
    JOIN PhieuMuon pm ON pm.maDG = dg.maDG
    JOIN ChiTietPhieuMuon ctm ON ctm.maPM = pm.maPM
    WHERE tk.maTK = @maTK
    ${whereSql};
  `;

  const req = pool
    .request()
    .input("maTK", sql.NVarChar, maTK)
    .input("offset", sql.Int, offset)
    .input("pageSize", sql.Int, Math.max(1, +pageSize));
  if (dateFrom) req.input("dateFrom", sql.Date, dateFrom);
  if (dateTo) req.input("dateTo", sql.Date, dateTo);

  const result = await req.query(q);
  const rows = result.recordsets?.[0] || [];
  const total = result.recordsets?.[1]?.[0]?.total || 0;
  return { data: rows, total, page: +page, pageSize: +pageSize };
}

module.exports = { listByAccount };
