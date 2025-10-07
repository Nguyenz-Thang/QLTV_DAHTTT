const { getPool, sql } = require("../../config/db");

async function list(q = "") {
  const pool = await getPool();
  const rs = await pool.request().input("k", sql.NVarChar, `%${q}%`).query(`
      SELECT maTG, tenTG, thongTin
      FROM TacGia
      WHERE (@k IS NULL OR @k='%%') OR tenTG LIKE @k OR maTG LIKE @k
      ORDER BY tenTG
    `);
  return rs.recordset;
}

async function create({ tenTG, thongTin }) {
  const pool = await getPool();
  const maTG = "TG" + Date.now();
  await pool
    .request()
    .input("id", sql.VarChar, maTG)
    .input("ten", sql.NVarChar, tenTG)
    .input("tt", sql.NVarChar, thongTin || null)
    .query(`INSERT INTO TacGia(maTG, tenTG, thongTin) VALUES (@id, @ten, @tt)`);
  return { maTG };
}

async function update(id, { tenTG, thongTin }) {
  const pool = await getPool();
  const r = await pool
    .request()
    .input("id", sql.VarChar, id)
    .input("ten", sql.NVarChar, tenTG)
    .input("tt", sql.NVarChar, thongTin || null)
    .query(`UPDATE TacGia SET tenTG=@ten, thongTin=@tt WHERE maTG=@id`);
  return r.rowsAffected[0] > 0;
}

async function remove(id) {
  const pool = await getPool();
  const r = await pool
    .request()
    .input("id", sql.VarChar, id)
    .query(`DELETE FROM TacGia WHERE maTG=@id`);
  return r.rowsAffected[0] > 0;
}

module.exports = { list, create, update, remove };
