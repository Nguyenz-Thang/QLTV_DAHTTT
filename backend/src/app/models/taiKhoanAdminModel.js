const { getPool, sql } = require("../../config/db");
const bcrypt = require("bcryptjs");

// Danh sách + tên DG/TT
async function listAll() {
  const pool = await getPool();
  const rs = await pool.request().query(`
    SELECT t.maTK, t.tenDangNhap, t.vaiTro, t.maDG, t.maTT, t.ngayTao,
           d.hoTen AS tenDG, tt.tenTT AS tenTT
    FROM TaiKhoan t
    LEFT JOIN DocGia d  ON t.maDG = d.maDG
    LEFT JOIN ThuThu tt ON t.maTT = tt.maTT
    ORDER BY t.ngayTao DESC, t.tenDangNhap
  `);
  return rs.recordset;
}

async function search(q) {
  const pool = await getPool();
  const rs = await pool.request().input("k", sql.NVarChar, `%${q}%`).query(`
      SELECT t.maTK, t.tenDangNhap, t.vaiTro, t.maDG, t.maTT, t.ngayTao,
             d.hoTen AS tenDG, tt.tenTT AS tenTT
      FROM TaiKhoan t
      LEFT JOIN DocGia d  ON t.maDG = d.maDG
      LEFT JOIN ThuThu tt ON t.maTT = tt.maTT
      WHERE t.tenDangNhap LIKE @k OR t.vaiTro LIKE @k
         OR ISNULL(d.hoTen,'') LIKE @k OR ISNULL(tt.tenTT,'') LIKE @k
      ORDER BY t.ngayTao DESC
    `);
  return rs.recordset;
}

async function ensureUniqueUsername(pool, tenDangNhap, exceptMaTK = null) {
  const req = pool.request().input("u", sql.NVarChar, tenDangNhap);
  let q = `SELECT 1 FROM TaiKhoan WHERE tenDangNhap=@u`;
  if (exceptMaTK) {
    q += ` AND maTK<>@id`;
    req.input("id", sql.VarChar, exceptMaTK);
  }
  const rs = await req.query(q);
  if (rs.recordset.length) throw new Error("Tên đăng nhập đã tồn tại");
}

async function create({
  tenDangNhap,
  matKhau,
  vaiTro,
  maDG = null,
  maTT = null,
}) {
  const pool = await getPool();
  await ensureUniqueUsername(pool, tenDangNhap);

  // ràng buộc theo vai trò
  if (vaiTro === "Độc giả" && !maDG)
    throw new Error("Cần maDG cho vai trò Độc giả");
  if (vaiTro === "Thủ thư" && !maTT)
    throw new Error("Cần maTT cho vai trò Thủ thư");
  if (vaiTro === "Quản lý") {
    maDG = null;
    maTT = null;
  }

  const maTK = "TK" + Date.now();
  const hashed = await bcrypt.hash(matKhau, 10);
  await pool
    .request()
    .input("id", sql.VarChar, maTK)
    .input("u", sql.NVarChar, tenDangNhap)
    .input("p", sql.NVarChar, hashed)
    .input("r", sql.NVarChar, vaiTro)
    .input("dg", sql.VarChar, maDG)
    .input("tt", sql.VarChar, maTT).query(`
      INSERT INTO TaiKhoan (maTK, tenDangNhap, matKhau, vaiTro, maDG, maTT, ngayTao)
      VALUES (@id, @u, @p, @r, @dg, @tt, GETDATE())
    `);
  return { maTK };
}

async function update(maTK, { tenDangNhap, vaiTro, maDG = null, maTT = null }) {
  const pool = await getPool();

  const ex = await pool
    .request()
    .input("id", sql.VarChar, maTK)
    .query(`SELECT 1 FROM TaiKhoan WHERE maTK=@id`);
  if (!ex.recordset.length) return false;

  if (tenDangNhap) await ensureUniqueUsername(pool, tenDangNhap, maTK);

  if (vaiTro === "Độc giả" && !maDG)
    throw new Error("Cần maDG cho vai trò Độc giả");
  if (vaiTro === "Thủ thư" && !maTT)
    throw new Error("Cần maTT cho vai trò Thủ thư");
  if (vaiTro === "Quản lý") {
    maDG = null;
    maTT = null;
  }

  await pool
    .request()
    .input("id", sql.VarChar, maTK)
    .input("u", sql.NVarChar, tenDangNhap)
    .input("r", sql.NVarChar, vaiTro)
    .input("dg", sql.VarChar, maDG)
    .input("tt", sql.VarChar, maTT).query(`
      UPDATE TaiKhoan
      SET tenDangNhap = COALESCE(@u, tenDangNhap),
          vaiTro = COALESCE(@r, vaiTro),
          maDG = @dg,
          maTT = @tt
      WHERE maTK=@id
    `);
  return true;
}

async function remove(maTK) {
  const pool = await getPool();
  const rs = await pool
    .request()
    .input("id", sql.VarChar, maTK)
    .query(`DELETE FROM TaiKhoan WHERE maTK=@id`);
  return rs.rowsAffected[0] > 0;
}

async function resetPassword(maTK, newPlain) {
  const pool = await getPool();
  const hashed = await bcrypt.hash(newPlain, 10);
  await pool
    .request()
    .input("id", sql.VarChar, maTK)
    .input("p", sql.NVarChar, hashed)
    .query(`UPDATE TaiKhoan SET matKhau=@p WHERE maTK=@id`);
  return true;
}

module.exports = { listAll, search, create, update, remove, resetPassword };
