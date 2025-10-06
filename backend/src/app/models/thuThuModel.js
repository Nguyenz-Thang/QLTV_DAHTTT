const { getPool } = require("../../config/db");

// Lấy danh sách thủ thư
async function getAll() {
  const pool = await getPool();
  const result = await pool.request().query("SELECT * FROM ThuThu");
  return result.recordset;
}

// Thêm thủ thư
async function create(data) {
  const pool = await getPool();
  await pool.request()
    .input("maTT", data.maTT)
    .input("tenTT", data.tenTT)
    .input("email", data.email)
    .input("soDienThoai", data.soDienThoai)
    .input("diaChi", data.diaChi)
    .query(`
      INSERT INTO ThuThu (maTT, tenTT, email, soDienThoai, diaChi)
      VALUES (@maTT, @tenTT, @email, @soDienThoai, @diaChi)
    `);
  return { message: "Thêm thủ thư thành công" };
}

// Xoá thủ thư
async function remove(maTT) {
  const pool = await getPool();
  const result = await pool.request()
    .input("maTT", maTT)
    .query("DELETE FROM ThuThu WHERE maTT=@maTT");
  return result.rowsAffected[0] > 0;
}

// Cập nhật thủ thư
async function update(maTT, data) {
  const pool = await getPool();
  await pool.request()
    .input("maTT", maTT)
    .input("tenTT", data.tenTT)
    .input("email", data.email)
    .input("soDienThoai", data.soDienThoai)
    .input("diaChi", data.diaChi)
    .query(`
      UPDATE ThuThu
      SET tenTT=@tenTT, email=@email, soDienThoai=@soDienThoai, diaChi=@diaChi
      WHERE maTT=@maTT
    `);
  return { message: "Cập nhật thủ thư thành công" };
}

module.exports = { getAll, create, remove, update };
