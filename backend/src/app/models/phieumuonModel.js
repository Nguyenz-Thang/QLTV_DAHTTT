// backend/src/app/models/phieuMuonModel.js
const { getPool, sql } = require("../../config/db");

// Gom items theo maSach để xử lý gọn
function groupItems(items = []) {
  const map = new Map();
  for (const it of items) {
    const maSach = String(it?.maSach || "").trim();
    const sl = Number(it?.soLuong || 0);
    if (!maSach || sl <= 0) continue;
    map.set(maSach, (map.get(maSach) || 0) + sl);
  }
  return map; // Map<maSach, tongSoLuong>
}

// Danh sách phiếu mượn + gộp items
async function listAll(q = "") {
  const pool = await getPool();

  const rs = await pool.request().input("k", sql.NVarChar, `%${q}%`).query(`
    ;WITH PM AS (
      SELECT pm.maPM, pm.maDG, pm.maTT, pm.ngayMuon, pm.ngayHenTra,
             dg.hoTen AS tenDG, tt.tenTT,
             (SELECT COUNT(*) FROM ChiTietPhieuMuon c WHERE c.maPM = pm.maPM) AS soSach
      FROM PhieuMuon pm
      LEFT JOIN DocGia dg ON pm.maDG = dg.maDG
      LEFT JOIN ThuThu tt ON pm.maTT = tt.maTT
      WHERE @k IS NULL OR @k = '%%' OR pm.maPM LIKE @k OR ISNULL(dg.hoTen,'') LIKE @k OR ISNULL(tt.tenTT,'') LIKE @k
    )
    SELECT * FROM PM ORDER BY ngayMuon DESC, maPM DESC
  `);

  const list = rs.recordset;
  if (!list.length) return [];

  const ids = list.map((x) => `'${x.maPM}'`).join(",");
  const ct = await pool.request().query(`
    SELECT c.maPM, c.maSach, c.soLuong, c.trangThai, s.tieuDe
    FROM ChiTietPhieuMuon c
    LEFT JOIN Sach s ON s.maSach = c.maSach
    WHERE c.maPM IN (${ids})
  `);

  const byPM = ct.recordset.reduce((m, x) => {
    (m[x.maPM] ||= []).push(x);
    return m;
  }, {});
  return list.map((x) => ({ ...x, items: byPM[x.maPM] || [] }));
}

/**
 * Tạo phiếu mượn:
 * - Check tồn kho (available = soLuong - soLuongMuon) theo từng sách
 * - Insert header + details
 * - Tăng Sach.soLuongMuon tương ứng
 */
async function create({
  maDG,
  maTT,
  ngayMuon = null,
  ngayHenTra = null,
  items = [],
}) {
  const pool = await getPool();
  const tx = new sql.Transaction(await pool);
  await tx.begin();

  try {
    const maPM = "PM" + Date.now();

    // Gom items
    const gNew = groupItems(items); // Map<maSach, soLuong>

    // Insert header
    await new sql.Request(tx)
      .input("id", sql.VarChar, maPM)
      .input("dg", sql.VarChar, maDG)
      .input("tt", sql.VarChar, maTT)
      .input("nm", sql.DateTime, ngayMuon ? new Date(ngayMuon) : new Date())
      .input("nht", sql.DateTime, ngayHenTra ? new Date(ngayHenTra) : null)
      .query(`
        INSERT INTO PhieuMuon(maPM, maDG, maTT, ngayMuon, ngayHenTra)
        VALUES (@id, @dg, @tt, @nm, @nht)
      `);

    // Check tồn kho & cập nhật soLuongMuon
    for (const [maSach, slNew] of gNew.entries()) {
      // Khóa dòng sách + đọc tồn kho
      const stock = await new sql.Request(tx).input("s", sql.VarChar, maSach)
        .query(`
          SELECT soLuong, ISNULL(soLuongMuon,0) AS soLuongMuon
          FROM Sach WITH (UPDLOCK, ROWLOCK)
          WHERE maSach=@s
        `);
      if (!stock.recordset.length)
        throw new Error(`Không tìm thấy sách ${maSach}.`);

      const { soLuong, soLuongMuon } = stock.recordset[0];
      const available = Math.max(soLuong - soLuongMuon, 0);
      if (slNew > available) {
        throw new Error(
          `Sách ${maSach} chỉ còn ${available} bản khả dụng (yêu cầu ${slNew}).`
        );
      }
    }

    // Ghi chi tiết + tăng soLuongMuon
    for (const it of items) {
      const maSach = String(it.maSach || "").trim();
      const sl = Number(it.soLuong || 0);
      if (!maSach || sl <= 0) continue;

      const idct = "CTPM" + Math.floor(Math.random() * 1e9);
      await new sql.Request(tx)
        .input("id", sql.VarChar, idct)
        .input("pm", sql.VarChar, maPM)
        .input("s", sql.VarChar, maSach)
        .input("sl", sql.Int, sl)
        .input("st", sql.NVarChar, it.trangThai || "Đang mượn").query(`
          INSERT INTO ChiTietPhieuMuon(maCTM, maPM, maSach, soLuong, trangThai)
          VALUES (@id, @pm, @s, @sl, @st)
        `);

      await new sql.Request(tx)
        .input("s", sql.VarChar, maSach)
        .input("inc", sql.Int, sl).query(`
          UPDATE Sach
          SET soLuongMuon = ISNULL(soLuongMuon,0) + @inc
          WHERE maSach=@s
        `);
    }

    await tx.commit();
    return { maPM };
  } catch (e) {
    try {
      await tx.rollback();
    } catch {}
    throw e;
  }
}

/**
 * Cập nhật phiếu mượn:
 * - Lấy tổng cũ theo từng sách
 * - Tính delta = new - old; nếu delta>0 -> check tồn kho trước
 * - Ghi lại chi tiết (xoá cũ, insert mới)
 * - Cập nhật Sach.soLuongMuon += delta (âm/dương)
 */
async function update(
  maPM,
  { maDG, maTT, ngayMuon = null, ngayHenTra = null, items = [] }
) {
  const pool = await getPool();
  const tx = new sql.Transaction(await pool);
  await tx.begin();

  try {
    // Lấy tổng cũ theo sách
    const rsOld = await new sql.Request(tx).input("pm", sql.VarChar, maPM)
      .query(`
        SELECT maSach, SUM(soLuong) AS sl
        FROM ChiTietPhieuMuon
        WHERE maPM=@pm
        GROUP BY maSach
      `);

    const gOld = new Map();
    for (const r of rsOld.recordset) {
      gOld.set(String(r.maSach), Number(r.sl || 0));
    }

    // Gom tổng mới
    const gNew = groupItems(items);

    // Kiểm tra tồn kho cho các delta > 0
    for (const [maSach, newSL] of gNew.entries()) {
      const oldSL = gOld.get(maSach) || 0;
      const delta = newSL - oldSL;
      if (delta > 0) {
        const stock = await new sql.Request(tx).input("s", sql.VarChar, maSach)
          .query(`
            SELECT soLuong, ISNULL(soLuongMuon,0) AS soLuongMuon
            FROM Sach WITH (UPDLOCK, ROWLOCK)
            WHERE maSach=@s
          `);
        if (!stock.recordset.length)
          throw new Error(`Không tìm thấy sách ${maSach}.`);
        const { soLuong, soLuongMuon } = stock.recordset[0];
        const available = Math.max(soLuong - soLuongMuon, 0);
        if (delta > available) {
          throw new Error(
            `Sách ${maSach} chỉ còn ${available} bản khả dụng (cần thêm ${delta}).`
          );
        }
      }
    }

    // Update header
    await new sql.Request(tx)
      .input("id", sql.VarChar, maPM)
      .input("dg", sql.VarChar, maDG)
      .input("tt", sql.VarChar, maTT)
      .input("nm", sql.DateTime, ngayMuon ? new Date(ngayMuon) : new Date())
      .input("nht", sql.DateTime, ngayHenTra ? new Date(ngayHenTra) : null)
      .query(`
        UPDATE PhieuMuon
        SET maDG=@dg, maTT=@tt, ngayMuon=@nm, ngayHenTra=@nht
        WHERE maPM=@id
      `);

    // Xoá chi tiết cũ
    await new sql.Request(tx)
      .input("id", sql.VarChar, maPM)
      .query(`DELETE FROM ChiTietPhieuMuon WHERE maPM=@id`);

    // Ghi chi tiết mới
    for (const it of items) {
      const maSach = String(it.maSach || "").trim();
      const sl = Number(it.soLuong || 0);
      if (!maSach || sl <= 0) continue;

      const idct = "CTPM" + Math.floor(Math.random() * 1e9);
      await new sql.Request(tx)
        .input("id", sql.VarChar, idct)
        .input("pm", sql.VarChar, maPM)
        .input("s", sql.VarChar, maSach)
        .input("sl", sql.Int, sl)
        .input("st", sql.NVarChar, it.trangThai || "Đang mượn").query(`
          INSERT INTO ChiTietPhieuMuon(maCTM, maPM, maSach, soLuong, trangThai)
          VALUES (@id, @pm, @s, @sl, @st)
        `);
    }

    // Cập nhật soLuongMuon theo delta
    // tập hợp tất cả mã sách xuất hiện ở old hoặc new
    const keys = new Set([...gOld.keys(), ...gNew.keys()]);
    for (const maSach of keys) {
      const oldSL = gOld.get(maSach) || 0;
      const newSL = gNew.get(maSach) || 0;
      const delta = newSL - oldSL;
      if (delta !== 0) {
        await new sql.Request(tx)
          .input("s", sql.VarChar, maSach)
          .input("d", sql.Int, delta).query(`
            UPDATE Sach
            SET soLuongMuon = ISNULL(soLuongMuon,0) + @d
            WHERE maSach=@s
          `);
      }
    }

    await tx.commit();
    return true;
  } catch (e) {
    try {
      await tx.rollback();
    } catch {}
    throw e;
  }
}

/**
 * Xoá phiếu mượn:
 * - Lấy tổng số lượng chi tiết theo từng sách
 * - Trừ lại soLuongMuon
 * - Xoá chi tiết + header
 */
async function remove(maPM) {
  const pool = await getPool();
  const tx = new sql.Transaction(await pool);
  await tx.begin();

  try {
    // tổng theo sách
    const rs = await new sql.Request(tx).input("pm", sql.VarChar, maPM).query(`
        SELECT maSach, SUM(soLuong) AS sl
        FROM ChiTietPhieuMuon
        WHERE maPM=@pm
        GROUP BY maSach
      `);

    // trừ lại soLuongMuon
    for (const r of rs.recordset) {
      await new sql.Request(tx)
        .input("s", sql.VarChar, r.maSach)
        .input("sl", sql.Int, Number(r.sl || 0)).query(`
          UPDATE Sach
          SET soLuongMuon = CASE WHEN ISNULL(soLuongMuon,0) >= @sl
                                 THEN ISNULL(soLuongMuon,0) - @sl
                                 ELSE 0 END
          WHERE maSach=@s
        `);
    }

    await new sql.Request(tx)
      .input("pm", sql.VarChar, maPM)
      .query(`DELETE FROM ChiTietPhieuMuon WHERE maPM=@pm`);
    const r = await new sql.Request(tx)
      .input("pm", sql.VarChar, maPM)
      .query(`DELETE FROM PhieuMuon WHERE maPM=@pm`);

    await tx.commit();
    return r.rowsAffected[0] > 0;
  } catch (e) {
    try {
      await tx.rollback();
    } catch {}
    throw e;
  }
}

async function suggest(q = "") {
  const pool = await getPool();
  const rs = await pool.request().input("q", sql.NVarChar, `%${q}%`).query(`
      SELECT TOP 8
        pm.maPM,
        pm.maDG,
        dg.MSV,
        dg.hoTen,
        CONVERT(varchar(10), pm.ngayMuon, 23) AS ngayMuon,
        CONVERT(varchar(10), pm.ngayHenTra, 23) AS ngayHenTra,
        ISNULL( (SELECT SUM(c.soLuong) FROM ChiTietPhieuMuon c WHERE c.maPM = pm.maPM), 0) AS tongMuon,
        ISNULL( (SELECT SUM(ct.soLuong) FROM ChiTietPhieuTra ct
                 JOIN PhieuTra pt ON pt.maPT = ct.maPT
                 WHERE pt.maPM = pm.maPM), 0) AS tongTra
      FROM PhieuMuon pm
      LEFT JOIN DocGia dg ON dg.maDG = pm.maDG
      WHERE (@q = '' OR pm.maPM LIKE @q OR dg.MSV LIKE @q OR dg.hoTen LIKE @q)
      ORDER BY pm.ngayMuon DESC, pm.maPM DESC
    `);

  // Có thể tính thêm còn nợ ở đây nếu cần cho UI:
  return rs.recordset.map((r) => ({
    ...r,
    conNo: Math.max((r.tongMuon || 0) - (r.tongTra || 0), 0),
  }));
}

async function remaining(maPM) {
  const pool = await getPool();
  const rq = await pool.request().input("pm", sql.VarChar, maPM);

  // tổng đã mượn theo sách
  const rs = await rq.query(`
    SELECT c.maSach, s.tieuDe,
           SUM(c.soLuong) AS muon
    FROM ChiTietPhieuMuon c
    LEFT JOIN Sach s ON s.maSach = c.maSach
    WHERE c.maPM=@pm
    GROUP BY c.maSach, s.tieuDe
  `);

  // tính daTra cho từng sách
  const out = [];
  for (const row of rs.recordset) {
    const q2 = await pool
      .request()
      .input("pm", sql.VarChar, maPM)
      .input("s", sql.VarChar, row.maSach).query(`
        SELECT ISNULL(SUM(ct.soLuong),0) AS daTra
        FROM ChiTietPhieuTra ct
        JOIN PhieuTra pt ON pt.maPT = ct.maPT
        WHERE pt.maPM=@pm AND ct.maSach=@s
      `);
    const daTra = q2.recordset[0].daTra || 0;
    const conNo = Math.max((row.muon || 0) - daTra, 0);
    if (conNo > 0) {
      out.push({ maSach: row.maSach, tieuDe: row.tieuDe, conNo });
    }
  }
  return out;
}

async function remaining(maPM) {
  const pool = await getPool();
  const rq = await pool.request().input("pm", sql.VarChar, maPM);

  // tổng đã mượn theo sách
  const rs = await rq.query(`
    SELECT c.maSach, s.tieuDe,
           SUM(c.soLuong) AS muon
    FROM ChiTietPhieuMuon c
    LEFT JOIN Sach s ON s.maSach = c.maSach
    WHERE c.maPM=@pm
    GROUP BY c.maSach, s.tieuDe
  `);

  // tính daTra cho từng sách
  const out = [];
  for (const row of rs.recordset) {
    const q2 = await pool
      .request()
      .input("pm", sql.VarChar, maPM)
      .input("s", sql.VarChar, row.maSach).query(`
        SELECT ISNULL(SUM(ct.soLuong),0) AS daTra
        FROM ChiTietPhieuTra ct
        JOIN PhieuTra pt ON pt.maPT = ct.maPT
        WHERE pt.maPM=@pm AND ct.maSach=@s
      `);
    const daTra = q2.recordset[0].daTra || 0;
    const conNo = Math.max((row.muon || 0) - daTra, 0);
    if (conNo > 0) {
      out.push({ maSach: row.maSach, tieuDe: row.tieuDe, conNo });
    }
  }
  return out;
}
module.exports = { listAll, create, update, remove, suggest, remaining };
