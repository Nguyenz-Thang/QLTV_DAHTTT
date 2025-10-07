const { getPool, sql } = require("../../config/db");

async function listAll() {
  const pool = await getPool();
  const rs = await pool.request().query(`
    SELECT maNXB, tenNXB, diaChi, SDT, email
    FROM NhaXuatBan
    ORDER BY tenNXB
  `);
  return rs.recordset;
}

async function search(q) {
  const pool = await getPool();
  const rs = await pool.request().input("k", sql.NVarChar, `%${q}%`).query(`
      SELECT maNXB, tenNXB, diaChi, SDT, email
      FROM NhaXuatBan
      WHERE tenNXB LIKE @k OR ISNULL(email,'') LIKE @k
            OR ISNULL(SDT,'') LIKE @k OR ISNULL(diaChi,'') LIKE @k
      ORDER BY tenNXB
    `);
  return rs.recordset;
}

async function create(data) {
  const pool = await getPool();

  // check trùng tên/email (tuỳ yêu cầu)
  const dupName = await pool
    .request()
    .input("t", sql.NVarChar, data.tenNXB)
    .query(`SELECT 1 FROM NhaXuatBan WHERE tenNXB=@t`);
  if (dupName.recordset.length) throw new Error("Tên NXB đã tồn tại");

  if (data.email) {
    const dupEmail = await pool
      .request()
      .input("e", sql.NVarChar, data.email)
      .query(`SELECT 1 FROM NhaXuatBan WHERE email=@e`);
    if (dupEmail.recordset.length) throw new Error("Email đã tồn tại");
  }

  const maNXB = "NXB" + Date.now();
  await pool
    .request()
    .input("id", sql.VarChar, maNXB)
    .input("ten", sql.NVarChar, data.tenNXB)
    .input("dc", sql.NVarChar, data.diaChi || null)
    .input("sdt", sql.NVarChar, data.SDT || null)
    .input("em", sql.NVarChar, data.email || null).query(`
      INSERT INTO NhaXuatBan (maNXB, tenNXB, diaChi, SDT, email)
      VALUES (@id, @ten, @dc, @sdt, @em)
    `);

  return { maNXB };
}

async function update(id, data) {
  const pool = await getPool();

  const ex = await pool
    .request()
    .input("id", sql.VarChar, id)
    .query(`SELECT 1 FROM NhaXuatBan WHERE maNXB=@id`);
  if (!ex.recordset.length) return false;

  const dupName = await pool
    .request()
    .input("t", sql.NVarChar, data.tenNXB)
    .input("id", sql.VarChar, id)
    .query(`SELECT 1 FROM NhaXuatBan WHERE tenNXB=@t AND maNXB<>@id`);
  if (dupName.recordset.length) throw new Error("Tên NXB đã tồn tại");

  if (data.email) {
    const dupEmail = await pool
      .request()
      .input("e", sql.NVarChar, data.email)
      .input("id", sql.VarChar, id)
      .query(`SELECT 1 FROM NhaXuatBan WHERE email=@e AND maNXB<>@id`);
    if (dupEmail.recordset.length) throw new Error("Email đã tồn tại");
  }

  await pool
    .request()
    .input("id", sql.VarChar, id)
    .input("ten", sql.NVarChar, data.tenNXB)
    .input("dc", sql.NVarChar, data.diaChi || null)
    .input("sdt", sql.NVarChar, data.SDT || null)
    .input("em", sql.NVarChar, data.email || null).query(`
      UPDATE NhaXuatBan
      SET tenNXB=@ten, diaChi=@dc, SDT=@sdt, email=@em
      WHERE maNXB=@id
    `);

  return true;
}

async function remove(id) {
  const pool = await getPool();

  const ref = await pool
    .request()
    .input("id", sql.VarChar, id)
    .query(`SELECT TOP 1 maSach FROM Sach WHERE maNXB=@id`);
  if (ref.recordset.length)
    throw new Error("NXB đang được tham chiếu bởi Sách — không thể xoá.");

  const del = await pool
    .request()
    .input("id", sql.VarChar, id)
    .query(`DELETE FROM NhaXuatBan WHERE maNXB=@id`);
  return del.rowsAffected[0] > 0;
}

module.exports = { listAll, search, create, update, remove };
