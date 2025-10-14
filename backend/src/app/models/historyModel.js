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

  const where = [];
  if (dateFrom) where.push("pm.ngayMuon >= @dateFrom");
  if (dateTo) where.push("pm.ngayMuon < DATEADD(DAY, 1, @dateTo)");

  // status: all | borrowing | returned | pending
  if (status === "pending") {
    where.push("ctm.trangThai = N'Chờ lấy'");
  } else if (status === "borrowing") {
    // loại 'Chờ lấy' + so sánh với rt
    where.push(
      "ctm.trangThai <> N'Chờ lấy' AND ISNULL(rt.soLuongTra,0) < ctm.soLuong"
    );
  } else if (status === "returned") {
    where.push(
      "ctm.trangThai <> N'Chờ lấy' AND ISNULL(rt.soLuongTra,0) >= ctm.soLuong"
    );
  }
  const whereSql = where.length ? " AND " + where.join(" AND ") : "";

  const q = `
    WITH rt AS (
      SELECT pt.maPM, ctpt.maSach,
             SUM(ctpt.soLuong)   AS soLuongTra,
             MAX(pt.ngayTra)     AS ngayTraCuoi,
             MAX(ctpt.tinhTrang) AS tinhTrangCuoi
      FROM PhieuTra pt
      JOIN ChiTietPhieuTra ctpt ON ctpt.maPT = pt.maPT
      GROUP BY pt.maPM, ctpt.maSach
    )
    SELECT
      pm.maPM, pm.ngayMuon, pm.ngayHenTra,
      s.maSach, s.tieuDe,
      REPLACE(s.anhBia, '\\\\', '/')     AS anhBia,
      REPLACE(s.taiLieuOnl, '\\\\', '/') AS taiLieuOnl,
      ctm.soLuong                    AS soLuongMuon,
      ISNULL(rt.soLuongTra,0)        AS soLuongTra,
      rt.ngayTraCuoi                 AS ngayTra,
      rt.tinhTrangCuoi               AS tinhTrang,
      CASE
        WHEN ctm.trangThai = N'Chờ lấy' THEN N'Chờ lấy'
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

    -- ************ FIX Ở ĐÂY: thêm LEFT JOIN rt ************
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
    LEFT JOIN rt ON rt.maPM = pm.maPM AND rt.maSach = ctm.maSach   -- 👈 thêm dòng này
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

// Hủy phiếu đang ở trạng thái "Chờ lấy" (toàn bộ items đều Chờ lấy)
async function cancelPendingBorrow(maPM) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const rq = new sql.Request(tx);
    rq.input("maPM", sql.NVarChar, maPM);

    // 1) Chỉ cho hủy khi toàn bộ chi tiết là "Chờ lấy"
    const chk = await rq.query(`
      SELECT COUNT(*) AS nAll,
             SUM(CASE WHEN trangThai = N'Chờ lấy' THEN 1 ELSE 0 END) AS nPending
      FROM ChiTietPhieuMuon
      WHERE maPM = @maPM
    `);
    const nAll = chk.recordset?.[0]?.nAll || 0;
    const nPending = chk.recordset?.[0]?.nPending || 0;
    if (!nAll || nAll !== nPending) {
      throw new Error("Phiếu mượn không ở trạng thái 'Chờ lấy' hoàn toàn.");
    }

    // 2) Hoàn trả số lượng đang mượn cho từng sách trong phiếu
    //    - Nếu bạn dùng cột khác (vd. soLuongDangMuon), thay tên cột bên dưới.
    await rq.query(`
      WITH x AS (
        SELECT maSach, SUM(soLuong) AS tong
        FROM ChiTietPhieuMuon
        WHERE maPM = @maPM
        GROUP BY maSach
      )
      UPDATE s
      SET s.soLuongMuon = CASE
        WHEN ISNULL(s.soLuongMuon,0) >= ISNULL(x.tong,0)
             THEN ISNULL(s.soLuongMuon,0) - ISNULL(x.tong,0)
        ELSE 0
      END
      FROM Sach s
      JOIN x ON x.maSach = s.maSach
    `);

    // 3) Xóa chi tiết và phiếu
    await rq.query(`DELETE FROM ChiTietPhieuMuon WHERE maPM = @maPM`);
    await rq.query(`DELETE FROM PhieuMuon WHERE maPM = @maPM`);

    await tx.commit();
    return { ok: true };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}
module.exports = { listByAccount, cancelPendingBorrow };
