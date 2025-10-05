// backend/src/app/models/theLoaiModel.js
const { getPool, sql } = require("../../config/db");

// 🟢 Lấy tất cả thể loại
async function getAll() {
  const pool = await getPool();
  const result = await pool.request().query("SELECT * FROM TheLoai");
  return result.recordset; // trả về danh sách thể loại
}

// 🟢 Thêm thể loại
async function create({ maTL, tenTL, moTa }) {
  const pool = await getPool();
  await pool
    .request()
    .input("maTL", sql.VarChar, maTL)
    .input("tenTL", sql.NVarChar, tenTL)
    .input("moTa", sql.NVarChar, moTa)
    .query(
      `INSERT INTO TheLoai (maTL, tenTL, moTa)
       VALUES (@maTL, @tenTL, @moTa)`
    );
  return { maTL, tenTL, moTa };
}

// 🟢 Cập nhật thể loại
async function update(maTL, { tenTL, moTa }) {
  const pool = await getPool();
  await pool
    .request()
    .input("maTL", sql.VarChar, maTL)
    .input("tenTL", sql.NVarChar, tenTL)
    .input("moTa", sql.NVarChar, moTa)
    .query(
      `UPDATE TheLoai
       SET tenTL = @tenTL, moTa = @moTa
       WHERE maTL = @maTL`
    );
  return { maTL, tenTL, moTa };
}

// 🟢 Xóa thể loại
async function remove(maTL) {
  const pool = await getPool();
  await pool
    .request()
    .input("maTL", sql.VarChar, maTL)
    .query("DELETE FROM TheLoai WHERE maTL = @maTL");
  return { message: "Xóa thành công" };
}

// 🟢 Tìm kiếm thể loại theo tên
async function search(keyword) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("keyword", sql.NVarChar, `%${keyword}%`)
    .query("SELECT * FROM TheLoai WHERE tenTL LIKE @keyword");
  return result.recordset;
}

module.exports = { getAll, create, update, remove, search };
