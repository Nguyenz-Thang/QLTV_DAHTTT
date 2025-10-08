const { getPool, sql } = require("../../config/db");

const DocGia = {
  // 🟢 Lấy tất cả độc giả
  getAll: async () => {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM DocGia");
    return result.recordset;
  },

  // 🟢 Thêm độc giả (tự sinh mã DGxx)
  create: async (data) => {
    const pool = await getPool();

    // 🔹 Kiểm tra trùng MSV hoặc email
    const check = await pool
      .request()
      .input("MSV", sql.VarChar, data.MSV)
      .input("email", sql.NVarChar, data.email).query(`
        SELECT * FROM DocGia
        WHERE MSV = @MSV OR email = @email
      `);

    if (check.recordset.length > 0) {
      throw new Error("MSV hoặc email đã tồn tại trong hệ thống");
    }

    // 🔹 Sinh mã DGxx tự động
    const last = await pool
      .request()
      .query("SELECT TOP 1 maDG FROM DocGia ORDER BY maDG DESC");
    let newId = "DG01";
    if (last.recordset.length > 0) {
      const lastId = last.recordset[0].maDG;
      const next = parseInt(lastId.replace("DG", "")) + 1;
      newId = "DG" + next.toString().padStart(10, "0");
    }

    // 🔹 Thêm độc giả
    await pool
      .request()
      .input("maDG", sql.VarChar, newId)
      .input("MSV", sql.VarChar, data.MSV)
      .input("hoTen", sql.NVarChar, data.hoTen)
      .input("gioiTinh", sql.NVarChar, data.gioiTinh)
      .input("ngaySinh", sql.Date, data.ngaySinh)
      .input("lop", sql.NVarChar, data.lop)
      .input("khoa", sql.NVarChar, data.khoa)
      .input("email", sql.NVarChar, data.email)
      .input("SDT", sql.VarChar, data.SDT)
      .input("diaChi", sql.NVarChar, data.diaChi).query(`
        INSERT INTO DocGia (maDG, MSV, hoTen, gioiTinh, ngaySinh, lop, khoa, email, SDT, diaChi)
        VALUES (@maDG, @MSV, @hoTen, @gioiTinh, @ngaySinh, @lop, @khoa, @email, @SDT, @diaChi)
      `);

    return { message: "Thêm độc giả thành công", maDG: newId, ...data };
  },

  // 🟡 Cập nhật độc giả
  update: async (id, data) => {
    const pool = await getPool();

    const check = await pool
      .request()
      .input("MSV", sql.VarChar, data.MSV)
      .input("email", sql.NVarChar, data.email)
      .input("maDG", sql.VarChar, id).query(`
        SELECT * FROM DocGia
        WHERE (MSV = @MSV OR email = @email) AND maDG <> @maDG
      `);

    if (check.recordset.length > 0) {
      throw new Error("MSV hoặc email đã tồn tại ở độc giả khác");
    }

    const current = await pool
      .request()
      .input("maDG", sql.VarChar, id)
      .query("SELECT * FROM DocGia WHERE maDG=@maDG");
    if (current.recordset.length === 0) {
      throw new Error("Không tìm thấy độc giả để cập nhật");
    }

    const old = current.recordset[0];
    const same =
      old.MSV === data.MSV &&
      old.hoTen === data.hoTen &&
      old.gioiTinh === data.gioiTinh &&
      new Date(old.ngaySinh).toISOString().split("T")[0] === data.ngaySinh &&
      old.lop === data.lop &&
      old.khoa === data.khoa &&
      old.email === data.email &&
      old.SDT === data.SDT &&
      old.diaChi === data.diaChi;

    if (same) throw new Error("Độc giả này đã có trong hệ thống");

    await pool
      .request()
      .input("maDG", sql.VarChar, id)
      .input("MSV", sql.VarChar, data.MSV)
      .input("hoTen", sql.NVarChar, data.hoTen)
      .input("gioiTinh", sql.NVarChar, data.gioiTinh)
      .input("ngaySinh", sql.Date, data.ngaySinh)
      .input("lop", sql.NVarChar, data.lop)
      .input("khoa", sql.NVarChar, data.khoa)
      .input("email", sql.NVarChar, data.email)
      .input("SDT", sql.VarChar, data.SDT)
      .input("diaChi", sql.NVarChar, data.diaChi).query(`
        UPDATE DocGia
        SET MSV=@MSV, hoTen=@hoTen, gioiTinh=@gioiTinh, ngaySinh=@ngaySinh,
            lop=@lop, khoa=@khoa, email=@email, SDT=@SDT, diaChi=@diaChi
        WHERE maDG=@maDG
      `);

    return { message: "Cập nhật độc giả thành công", maDG: id, ...data };
  },

  // 🔴 Xóa độc giả
  delete: async (id) => {
    const pool = await getPool();
    await pool
      .request()
      .input("maDG", sql.VarChar, id)
      .query("DELETE FROM DocGia WHERE maDG=@maDG");
  },

  // 🔍 Tìm kiếm
  search: async (keyword) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("keyword", sql.NVarChar, `%${keyword}%`).query(`
        SELECT * FROM DocGia
        WHERE hoTen LIKE @keyword OR MSV LIKE @keyword OR khoa LIKE @keyword OR lop LIKE @keyword OR email LIKE @keyword
      `);
    return result.recordset;
  },
};

module.exports = DocGia;
