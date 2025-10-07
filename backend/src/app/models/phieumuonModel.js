const { getPool, sql } = require("../../config/db");

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

  // nạp chi tiết cho từng phiếu
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

async function create({
  maDG,
  maTT,
  ngayMuon = null,
  ngayHenTra = null,
  items = [],
}) {
  const pool = await getPool();
  const maPM = "PM" + Date.now();

  const tx = new sql.Transaction(await pool);
  await tx.begin();

  try {
    const r1 = new sql.Request(tx);
    await r1
      .input("id", sql.VarChar, maPM)
      .input("dg", sql.VarChar, maDG)
      .input("tt", sql.VarChar, maTT)
      .input("nm", sql.Date, ngayMuon)
      .input("nht", sql.Date, ngayHenTra)
      .query(
        `INSERT INTO PhieuMuon(maPM, maDG, maTT, ngayMuon, ngayHenTra) VALUES (@id, @dg, @tt, @nm, @nht)`
      );

    for (const it of items) {
      const idct = "CTPM" + Math.floor(Math.random() * 1e9);
      const r2 = new sql.Request(tx);
      await r2
        .input("id", sql.VarChar, idct)
        .input("pm", sql.VarChar, maPM)
        .input("s", sql.VarChar, it.maSach)
        .input("sl", sql.Int, it.soLuong || 1)
        .input("st", sql.NVarChar, it.trangThai || "Đang mượn")
        .query(
          `INSERT INTO ChiTietPhieuMuon(maCTM, maPM, maSach, soLuong, trangThai) VALUES (@id, @pm, @s, @sl, @st)`
        );
    }

    await tx.commit();
    return { maPM };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

async function update(
  maPM,
  { maDG, maTT, ngayMuon = null, ngayHenTra = null, items = [] }
) {
  const pool = await getPool();
  const tx = new sql.Transaction(await pool);
  await tx.begin();

  try {
    await new sql.Request(tx)
      .input("id", sql.VarChar, maPM)
      .input("dg", sql.VarChar, maDG)
      .input("tt", sql.VarChar, maTT)
      .input("nm", sql.Date, ngayMuon)
      .input("nht", sql.Date, ngayHenTra).query(`
        UPDATE PhieuMuon SET maDG=@dg, maTT=@tt, ngayMuon=@nm, ngayHenTra=@nht WHERE maPM=@id
      `);

    await new sql.Request(tx)
      .input("id", sql.VarChar, maPM)
      .query(`DELETE FROM ChiTietPhieuMuon WHERE maPM=@id`);
    for (const it of items) {
      const idct = "CTPM" + Math.floor(Math.random() * 1e9);
      await new sql.Request(tx)
        .input("id", sql.VarChar, idct)
        .input("pm", sql.VarChar, maPM)
        .input("s", sql.VarChar, it.maSach)
        .input("sl", sql.Int, it.soLuong || 1)
        .input("st", sql.NVarChar, it.trangThai || "Đang mượn")
        .query(
          `INSERT INTO ChiTietPhieuMuon(maCTM, maPM, maSach, soLuong, trangThai) VALUES (@id, @pm, @s, @sl, @st)`
        );
    }

    await tx.commit();
    return true;
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

async function remove(maPM) {
  const pool = await getPool();
  await pool
    .request()
    .input("id", sql.VarChar, maPM)
    .query(`DELETE FROM ChiTietPhieuMuon WHERE maPM=@id`);
  const r = await pool
    .request()
    .input("id", sql.VarChar, maPM)
    .query(`DELETE FROM PhieuMuon WHERE maPM=@id`);
  return r.rowsAffected[0] > 0;
}

module.exports = { listAll, create, update, remove };
