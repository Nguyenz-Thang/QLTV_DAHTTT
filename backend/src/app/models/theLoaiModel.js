// backend/src/app/models/theLoaiModel.js
const { getPool, sql } = require("../../config/db");

// 🟢 Lấy tất cả thể loại
async function getAll() {
  const pool = await getPool();
  const result = await pool.request().query("SELECT * FROM TheLoai");
  return result.recordset;
}

// 🟢 Thêm thể loại (TỰ SINH MÃ)
async function create({ tenTL, moTa }) {
  const pool = await getPool();

  // 🔹 Lấy mã lớn nhất hiện có trong DB
  const result = await pool.request().query(`
    SELECT TOP 1 maTL 
    FROM TheLoai 
    ORDER BY maTL DESC
  `);

  // 🔹 Sinh mã mới (VD: TL01, TL02, TL03,…)
  let newMaTL = "TL01";
  if (result.recordset.length > 0) {
    const lastMa = result.recordset[0].maTL; // TL05
    const number = parseInt(lastMa.replace("TL", "")) + 1;
    newMaTL = "TL" + Date.now();
  }

  // 🔹 Thêm thể loại mới
  await pool
    .request()
    .input("maTL", sql.VarChar, newMaTL)
    .input("tenTL", sql.NVarChar, tenTL)
    .input("moTa", sql.NVarChar, moTa).query(`
      INSERT INTO TheLoai (maTL, tenTL, moTa)
      VALUES (@maTL, @tenTL, @moTa)
    `);

  return { maTL: newMaTL, tenTL, moTa, message: "Thêm thể loại thành công" };
}

// 🟡 Cập nhật thể loại (có kiểm tra tồn tại)
async function update(maTL, { tenTL, moTa }) {
  const pool = await getPool();

  // 🔹 Kiểm tra thể loại có tồn tại không
  const check = await pool
    .request()
    .input("maTL", sql.VarChar, maTL)
    .query("SELECT * FROM TheLoai WHERE maTL = @maTL");

  if (check.recordset.length === 0) {
    throw new Error("Không tìm thấy thể loại để cập nhật");
  }

  // 🔹 Cập nhật
  await pool
    .request()
    .input("maTL", sql.VarChar, maTL)
    .input("tenTL", sql.NVarChar, tenTL)
    .input("moTa", sql.NVarChar, moTa).query(`
      UPDATE TheLoai
      SET tenTL = @tenTL, moTa = @moTa
      WHERE maTL = @maTL
    `);

  return { maTL, tenTL, moTa, message: "Cập nhật thể loại thành công" };
}

// 🔴 Xóa thể loại (kiểm tra tồn tại trước khi xóa)
async function remove(maTL) {
  const pool = await getPool();

  // 🔹 Kiểm tra thể loại có tồn tại không
  const check = await pool
    .request()
    .input("maTL", sql.VarChar, maTL)
    .query("SELECT * FROM TheLoai WHERE maTL = @maTL");

  if (check.recordset.length === 0) {
    throw new Error("Không tìm thấy thể loại để xóa");
  }

  // 🔹 Xóa nếu tồn tại
  await pool
    .request()
    .input("maTL", sql.VarChar, maTL)
    .query("DELETE FROM TheLoai WHERE maTL = @maTL");

  return { message: "Xóa thể loại thành công" };
}

// 🔍 Tìm kiếm thể loại
async function search(keyword) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("keyword", sql.NVarChar, `%${keyword}%`).query(`
      SELECT * FROM TheLoai 
      WHERE tenTL LIKE @keyword OR moTa LIKE @keyword
    `);
  return result.recordset;
}

module.exports = { getAll, create, update, remove, search };
