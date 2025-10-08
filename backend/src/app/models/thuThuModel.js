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
  await pool
    .request()
    .input("maTT", data.maTT)
    .input("tenTT", data.tenTT)
    .input("ngaySinh", data.ngaySinh)
    .input("cccd", data.cccd)
    .input("email", data.email)
    .input("SDT", data.SDT)
    .input("diaChi", data.diaChi)
    .input("chucVu", data.chucVu).query(`
      INSERT INTO ThuThu (maTT,tenTT,ngaySinh, cccd, email, SDT, diaChi, chucVu)
      VALUES (@maTT,@tenTT,@ngaySinh, @cccd, @email, @SDT, @diaChi, @chucVu)
    `);
  return { message: "Thêm thủ thư thành công" };
}

// Xoá thủ thư
async function remove(maTT) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("maTT", maTT)
    .query("DELETE FROM ThuThu WHERE maTT=@maTT");
  return result.rowsAffected[0] > 0;
}

// Cập nhật thủ thư
async function update(maTT, data) {
  const pool = await getPool();
  await pool
    .request()
    .input("maTT", maTT)
    .input("tenTT", data.tenTT)
    .input("ngaySinh", data.ngaySinh)
    .input("cccd", data.cccd)
    .input("email", data.email)
    .input("SDT", data.SDT)
    .input("diaChi", data.diaChi)
    .input("chucVu", data.chucVu).query(`
      UPDATE ThuThu
      SET tenTT=@tenTT,ngaySinh=@ngaySinh, cccd=@cccd, email=@email, SDT=@SDT, diaChi=@diaChi, chucVu=@chucVu
      WHERE maTT=@maTT
    `);
  return { message: "Cập nhật thủ thư thành công" };
}

module.exports = { getAll, create, remove, update };
