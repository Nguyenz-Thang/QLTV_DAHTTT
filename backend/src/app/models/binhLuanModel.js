// src/app/models/binhLuanModel.js
const { getPool, sql } = require("../../config/db");

// Lấy tất cả bình luận của 1 sách (tăng dần theo thời gian)
async function listBySach(maSach) {
  const pool = await getPool();
  const rs = await pool.request().input("maSach", sql.VarChar, maSach).query(`
        SELECT 
          bl.maBL        AS id,       -- FE đang dùng id
          bl.maBL,
          bl.maSach,
          bl.maTK,
          bl.maBLCha,
          bl.noiDung,
          bl.ngayBL,
          COALESCE(dg.hoTen, tt.tenTT, tk.tenDangNhap) AS hoTen
        FROM BinhLuan bl
        LEFT JOIN TaiKhoan tk ON tk.maTK = bl.maTK
        LEFT JOIN DocGia   dg ON dg.maDG = tk.maDG
        LEFT JOIN ThuThu   tt ON tt.maTT = tk.maTT
        WHERE bl.maSach = @maSach
        ORDER BY bl.ngayBL ASC
      `);
  return rs.recordset;
}

// Lấy 1 bình luận theo ID
async function findById(maBL) {
  const pool = await getPool();
  const rs = await pool
    .request()
    .input("maBL", sql.VarChar, maBL)
    .query(`SELECT * FROM BinhLuan WHERE maBL=@maBL`);
  return rs.recordset[0] || null;
}

// Tạo bình luận (trả về maBL)
async function create({ maSach, maTK, noiDung, maBLCha = null }) {
  const pool = await getPool();
  const maBL = "BL" + Date.now(); // nếu bảng dùng IDENTITY thì bỏ cột maBL khỏi INSERT
  await pool
    .request()
    .input("maBL", sql.VarChar, maBL)
    .input("maSach", sql.VarChar, maSach)
    .input("maTK", sql.VarChar, maTK)
    .input("maBLCha", sql.VarChar, maBLCha)
    .input("noiDung", sql.NVarChar, noiDung)
    .input("ngayBL", sql.DateTime, new Date()).query(`
      INSERT INTO BinhLuan(maBL, maSach, maTK, maBLCha, noiDung, ngayBL)
      VALUES (@maBL, @maSach, @maTK, @maBLCha, @noiDung, @ngayBL)
    `);
  return { maBL };
}

// Cập nhật nội dung
async function update(maBL, noiDung) {
  const pool = await getPool();
  const rs = await pool
    .request()
    .input("maBL", sql.VarChar, maBL)
    .input("noiDung", sql.NVarChar, noiDung)
    .query(`UPDATE BinhLuan SET noiDung=@noiDung WHERE maBL=@maBL`);
  return rs.rowsAffected[0] > 0;
}

// Xoá cả thread: c + mọi reply con/cháu (CTE đệ quy)
async function removeThread(maBL) {
  const pool = await getPool();
  await pool.request().input("root", sql.VarChar, maBL).query(`
      ;WITH T AS (
        SELECT maBL FROM BinhLuan WHERE maBL=@root
        UNION ALL
        SELECT c.maBL
        FROM BinhLuan c
        JOIN T ON c.maBLCha = T.maBL
      )
      DELETE FROM BinhLuan WHERE maBL IN (SELECT maBL FROM T)
    `);
  return true;
}

module.exports = { listBySach, findById, create, update, removeThread };
