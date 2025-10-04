// backend/models/taiKhoanModel.js
const { getPool, sql } = require("../../config/db");
const bcrypt = require("bcryptjs");

async function findByUsername(username) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("username", sql.NVarChar, username)
    .query(
      "SELECT * FROM TaiKhoan t left join DocGia d on t.maDG = d.maDG left join ThuThu tt on tt.maTT = t.maTT WHERE t.tenDangNhap = @username"
    );
  return result.recordset[0] || null;
}

async function findByMaTK(maTK) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("maTK", sql.VarChar, maTK)
    .query("SELECT * FROM TaiKhoan WHERE maTK = @maTK");
  return result.recordset[0] || null;
}

async function createUser({
  maTK,
  tenDangNhap,
  passwordPlain,
  vaiTro = "Độc giả",
  maDG = null,
  maTT = null,
}) {
  const pool = await getPool();
  const hashed = await bcrypt.hash(passwordPlain, 10);
  await pool
    .request()
    .input("maTK", sql.VarChar, maTK)
    .input("tenDangNhap", sql.NVarChar, tenDangNhap)
    .input("matKhau", sql.NVarChar, hashed)
    .input("vaiTro", sql.NVarChar, vaiTro)
    .input("maDG", sql.VarChar, maDG)
    .input("maTT", sql.VarChar, maTT).query(`
      INSERT INTO TaiKhoan (maTK, tenDangNhap, matKhau, vaiTro, maDG, maTT)
      VALUES (@maTK, @tenDangNhap, @matKhau, @vaiTro, @maDG, @maTT)
    `);
  return { maTK, tenDangNhap, vaiTro, maDG, maTT };
}
async function updatePassword(maTK, newHashed) {
  const pool = await getPool();
  await pool
    .request()
    .input("maTK", sql.NVarChar, maTK)
    .input("matKhau", sql.NVarChar, newHashed)
    .query(`UPDATE TaiKhoan SET matKhau = @matKhau WHERE maTK = @maTK`);
}

module.exports = { findByUsername, findByMaTK, createUser, updatePassword };
