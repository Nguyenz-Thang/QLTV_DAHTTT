// backend/src/app/models/phieuTraModel.js
const { getPool, sql } = require("../../config/db");

// --- helpers (internal) ---
async function _getBorrowReturnSummaryTx(req, maPM, maSach) {
  const rsMuon = await req
    .input("maPM", sql.VarChar, maPM)
    .input("maSach", sql.VarChar, maSach).query(`
      SELECT ISNULL(SUM(soLuong),0) AS soMuon
      FROM ChiTietPhieuMuon
      WHERE maPM=@maPM AND maSach=@maSach
    `);

  // Tạo request mới trong cùng transaction cho mỗi truy vấn
  const rsTra = await new sql.Request(req.transaction)
    .input("maPM", sql.VarChar, maPM)
    .input("maSach", sql.VarChar, maSach).query(`
      SELECT ISNULL(SUM(ct.soLuong),0) AS daTra
      FROM ChiTietPhieuTra ct
      JOIN PhieuTra pt ON pt.maPT = ct.maPT
      WHERE pt.maPM=@maPM AND ct.maSach=@maSach
    `);

  const soMuon = rsMuon.recordset[0].soMuon || 0;
  const daTra = rsTra.recordset[0].daTra || 0;
  return { soMuon, daTra, conNo: Math.max(soMuon - daTra, 0) };
}

// --- public APIs (Model) ---

async function listPhieuTra() {
  const pool = await getPool();
  const rs = await pool.request().query(`
    SELECT pt.maPT, pt.maPM, pt.maTT, pt.ngayTra,dg.hoTen,dg.MSV,tt.maTT, tt.tenTT,
           COUNT(ct.maCTPT) AS soDauSach,
           ISNULL(SUM(ct.soLuong),0) AS tongSoLuong
    FROM PhieuTra pt
    LEFT JOIN ChiTietPhieuTra ct ON ct.maPT = pt.maPT 
    LEFT JOIN PhieuMuon pm ON pm.maPM = pt.maPM 
    LEFT JOIN DocGia dg ON dg.maDG = pm.maDG 
    LEFT JOIN ThuThu tt ON tt.maTT = pt.maTT 
    GROUP BY pt.maPT, pt.maPM, pt.maTT, pt.ngayTra, dg.hoTen, dg.MSV,tt.maTT, tt.tenTT
    ORDER BY pt.ngayTra DESC, pt.maPT DESC
  `);
  return rs.recordset;
}

async function getPhieuTra(maPT) {
  const pool = await getPool();
  const head = await pool
    .request()
    .input("maPT", sql.VarChar, maPT)
    .query(
      `SELECT * FROM PhieuTra pt join ThuThu tt on pt.maTT = tt.maTT join PhieuMuon pm on pm.maPM = pt.maPM join DocGia dg on dg.maDG = pm.maDG WHERE maPT=@maPT`
    );
  if (!head.recordset.length) return null;

  const items = await pool.request().input("maPT", sql.VarChar, maPT).query(`
      SELECT ct.maCTPT, ct.maSach, s.tieuDe, ct.soLuong, ct.tinhTrang
      FROM ChiTietPhieuTra ct
      LEFT JOIN Sach s ON s.maSach = ct.maSach
      WHERE ct.maPT=@maPT
      ORDER BY ct.maCTPT
    `);

  return { ...head.recordset[0], items: items.recordset };
}

/**
 * createPhieuTra({ maPM, maTT, ngayTra, items })
 * items: [{ maSach, soLuong, tinhTrang? }]
 * - Validate còn nợ theo PM.
 * - Tạo PhieuTra + ChiTietPhieuTra (transaction).
 * - Giảm Sach.soLuongMuon tương ứng.
 * - Cập nhật ChiTietPhieuMuon.trangThai: 'Đã trả' / 'Trả một phần'
 */
async function createPhieuTra({ maPM, maTT, ngayTra, items }) {
  const pool = await getPool();
  const trx = new sql.Transaction(pool);

  try {
    await trx.begin();

    // kiểm tra tồn tại PM
    let rq = new sql.Request(trx);
    const hasPM = await rq
      .input("maPM", sql.VarChar, maPM)
      .query(`SELECT 1 FROM PhieuMuon WHERE maPM=@maPM`);
    if (!hasPM.recordset.length) throw new Error("Không tìm thấy phiếu mượn");

    const maPT = "PT" + Date.now();
    const ngay = ngayTra ? new Date(ngayTra) : new Date();

    // header
    rq = new sql.Request(trx);
    await rq
      .input("maPT", sql.VarChar, maPT)
      .input("maPM", sql.VarChar, maPM)
      .input("maTT", sql.VarChar, maTT || null)
      .input("ngayTra", sql.DateTime, ngay).query(`
        INSERT INTO PhieuTra(maPT, maPM, maTT, ngayTra)
        VALUES(@maPT, @maPM, @maTT, @ngayTra)
      `);

    // --- GỘP các dòng trùng maSach để tránh over-return do payload ---
    const merged = new Map();
    for (const it of items || []) {
      const key = String(it.maSach);
      const qty = Number(it.soLuong || 0);
      if (!key || !qty) continue;
      const cur = merged.get(key) || {
        soLuong: 0,
        tinhTrang: it.tinhTrang ?? "Đã trả",
      };
      cur.soLuong += qty;
      // nếu có tinhTrang mới thì ưu tiên cái có nội dung
      if ((it.tinhTrang || "").trim()) cur.tinhTrang = it.tinhTrang.trim();
      merged.set(key, cur);
    }

    // --- LẤY tồn còn nợ trong CÙNG transaction ---
    // dựng cache "còn nợ" theo từng sách để dùng xuyên vòng lặp
    const remainBySach = new Map();
    for (const maSach of merged.keys()) {
      const r1 = new sql.Request(trx);
      // nhét transaction vào request để helper thấy mọi thay đổi trong trx
      r1.transaction = trx;
      const { conNo } = await _getBorrowReturnSummaryTx(r1, maPM, maSach);
      remainBySach.set(maSach, conNo);
    }

    // --- Ghi chi tiết ---
    for (const [maSach, { soLuong, tinhTrang }] of merged.entries()) {
      const left = remainBySach.get(maSach) ?? 0;
      if (soLuong > left) {
        throw new Error(`Sách ${maSach} trả vượt số lượng còn nợ (${left}).`);
      }

      const maCTPT = "CTPT" + Date.now() + Math.floor(Math.random() * 1000);

      // insert chi tiết
      let rq1 = new sql.Request(trx);
      await rq1
        .input("maCTPT", sql.VarChar, maCTPT)
        .input("maPT", sql.VarChar, maPT)
        .input("maSach", sql.VarChar, maSach)
        .input("soLuong", sql.Int, soLuong)
        .input("tinhTrang", sql.NVarChar, tinhTrang ?? "Đã trả").query(`
          INSERT INTO ChiTietPhieuTra(maCTPT, maPT, maSach, soLuong, tinhTrang)
          VALUES(@maCTPT, @maPT, @maSach, @soLuong, @tinhTrang)
        `);

      // cập nhật sách
      let rq2 = new sql.Request(trx);
      await rq2
        .input("maSach", sql.VarChar, maSach)
        .input("soLuong", sql.Int, soLuong).query(`
          UPDATE Sach
          SET soLuongMuon = CASE WHEN ISNULL(soLuongMuon,0) >= @soLuong
                                 THEN ISNULL(soLuongMuon,0) - @soLuong ELSE 0 END
          WHERE maSach=@maSach
        `);

      // cập nhật trạng thái CT mượn
      const conNoSau = left - soLuong;
      let rq3 = new sql.Request(trx);
      await rq3
        .input("maPM", sql.VarChar, maPM)
        .input("maSach", sql.VarChar, maSach)
        .input(
          "trangThai",
          sql.NVarChar,
          conNoSau <= 0 ? "Đã trả" : "Trả một phần"
        ).query(`
          UPDATE ChiTietPhieuMuon
          SET trangThai = @trangThai
          WHERE maPM = @maPM AND maSach = @maSach
        `);

      // giảm số còn nợ trong cache cho an toàn nếu có nhiều dòng cùng maSach
      remainBySach.set(maSach, conNoSau);
    }

    await trx.commit();
    return { maPT };
  } catch (e) {
    try {
      await trx.rollback();
    } catch {}
    throw e;
  }
}

async function updateHeader(maPT, { ngayTra, maTT }) {
  const pool = await getPool();

  // tồn tại?
  const rs = await pool
    .request()
    .input("maPT", sql.VarChar, maPT)
    .query(`SELECT 1 FROM PhieuTra WHERE maPT=@maPT`);
  if (!rs.recordset.length) return false;

  await pool
    .request()
    .input("maPT", sql.VarChar, maPT)
    .input("ngayTra", sql.DateTime, ngayTra ? new Date(ngayTra) : new Date())
    .input("maTT", sql.VarChar, maTT || null)
    .query(`UPDATE PhieuTra SET ngayTra=@ngayTra, maTT=@maTT WHERE maPT=@maPT`);

  return true;
}

/** Xoá phiếu trả + rollback soLuongMuon đã giảm */
async function deletePhieuTra(maPT) {
  const pool = await getPool();
  const trx = new sql.Transaction(pool);

  try {
    await trx.begin();

    // lấy các dòng chi tiết để hoàn lại soLuongMuon
    const items = await new sql.Request(trx)
      .input("maPT", sql.VarChar, maPT)
      .query(`SELECT maSach, soLuong FROM ChiTietPhieuTra WHERE maPT=@maPT`);

    // kiểm tra tồn tại header
    const existed = await new sql.Request(trx)
      .input("maPT", sql.VarChar, maPT)
      .query(`SELECT 1 FROM PhieuTra WHERE maPT=@maPT`);
    if (!existed.recordset.length) {
      await trx.rollback();
      return false;
    }

    // hoàn lại số lượng mượn cho từng sách
    for (const it of items.recordset) {
      await new sql.Request(trx)
        .input("maSach", sql.VarChar, it.maSach)
        .input("soLuong", sql.Int, it.soLuong).query(`
          UPDATE Sach
          SET soLuongMuon = ISNULL(soLuongMuon,0) + @soLuong
          WHERE maSach=@maSach
        `);
    }

    // xoá chi tiết (thực ra ON DELETE CASCADE cũng xoá, nhưng để chắc chắn)
    await new sql.Request(trx)
      .input("maPT", sql.VarChar, maPT)
      .query(`DELETE FROM ChiTietPhieuTra WHERE maPT=@maPT`);

    // xoá header
    await new sql.Request(trx)
      .input("maPT", sql.VarChar, maPT)
      .query(`DELETE FROM PhieuTra WHERE maPT=@maPT`);

    await trx.commit();
    return true;
  } catch (e) {
    try {
      await trx.rollback();
    } catch {}
    throw e;
  }
}

module.exports = {
  listPhieuTra,
  getPhieuTra,
  createPhieuTra,
  updateHeader,
  deletePhieuTra,
};
