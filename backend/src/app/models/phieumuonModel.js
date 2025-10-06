const { getPool } = require("../../config/db");

// Lấy danh sách phiếu mượn
async function getAll() {
  const pool = await getPool();
  const result = await pool.request().query("SELECT * FROM PhieuMuon");
  return result.recordset;
}

// Thêm phiếu mượn
async function create(data) {
  const pool = await getPool();
  await pool.request()
    .input("maPM", data.maPM)
    .input("maDG", data.maDG)
    .input("maSach", data.maSach)
    .input("ngayMuon", data.ngayMuon)
    .input("ngayTra", data.ngayTra)
    .query(`
      INSERT INTO PhieuMuon (maPM, maDG, maSach, ngayMuon, ngayTra)
      VALUES (@maPM, @maDG, @maSach, @ngayMuon, @ngayTra)
    `);
  return { message: "Thêm phiếu mượn thành công" };
}

// Xoá phiếu mượn
async function remove(maPM) {
  const pool = await getPool();
  const result = await pool.request()
    .input("maPM", maPM)
    .query("DELETE FROM PhieuMuon WHERE maPM = @maPM");
  return result.rowsAffected[0] > 0;
}

// Cập nhật phiếu mượn
async function update(maPM, data) {
  const pool = await getPool();
  await pool.request()
    .input("maPM", maPM)
    .input("maDG", data.maDG)
    .input("maSach", data.maSach)
    .input("ngayMuon", data.ngayMuon)
    .input("ngayTra", data.ngayTra)
    .query(`
      UPDATE PhieuMuon
      SET maDG=@maDG, maSach=@maSach, ngayMuon=@ngayMuon, ngayTra=@ngayTra
      WHERE maPM=@maPM
    `);
  return { message: "Cập nhật phiếu mượn thành công" };
}

module.exports = { getAll, create, remove, update };
