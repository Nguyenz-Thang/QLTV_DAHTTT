const { getPool, sql } = require("../../config/db");
const bcrypt = require("bcryptjs");

const DocGia = {
  // Lấy tất cả độc giả + username (nếu có)
  getAll: async () => {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT dg.*, tk.tenDangNhap
      FROM DocGia dg
      LEFT JOIN TaiKhoan tk ON tk.maDG = dg.maDG
      ORDER BY dg.maDG
    `);
    return result.recordset;
  },

  // Thêm độc giả + (tùy chọn) tạo tài khoản vai trò "Độc giả"
  create: async (data) => {
    const pool = await getPool();
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      // 1) check trùng
      const reqChk = new sql.Request(tx);
      const chk = await reqChk
        .input("MSV", sql.VarChar, data.MSV)
        .input("email", sql.NVarChar, data.email)
        .query(`SELECT 1 FROM DocGia WHERE MSV=@MSV OR email=@email`);
      if (chk.recordset.length)
        throw new Error("MSV hoặc email đã tồn tại trong hệ thống");

      // 2) sinh mã
      const reqLast = new sql.Request(tx);
      const last = await reqLast.query(
        `SELECT TOP 1 maDG FROM DocGia ORDER BY maDG DESC`
      );
      let maDG = "DG" + Date.now();
      // if (last.recordset.length) {
      //   const next =
      //     parseInt(String(last.recordset[0].maDG).replace("DG", "")) + 1;
      //   maDG = "DG" + String(next).padStart(10, "0");
      // }

      // 3) insert DocGia
      const reqIns = new sql.Request(tx);
      await reqIns
        .input("maDG", sql.VarChar, maDG)
        .input("MSV", sql.VarChar, data.MSV)
        .input("hoTen", sql.NVarChar, data.hoTen)
        .input("gioiTinh", sql.NVarChar, data.gioiTinh)
        .input("ngaySinh", sql.Date, data.ngaySinh || null)
        .input("lop", sql.NVarChar, data.lop)
        .input("khoa", sql.NVarChar, data.khoa)
        .input("email", sql.NVarChar, data.email)
        .input("SDT", sql.VarChar, data.SDT)
        .input("diaChi", sql.NVarChar, data.diaChi).query(`
        INSERT INTO DocGia (maDG, MSV, hoTen, gioiTinh, ngaySinh, lop, khoa, email, SDT, diaChi)
        VALUES (@maDG, @MSV, @hoTen, @gioiTinh, @ngaySinh, @lop, @khoa, @email, @SDT, @diaChi)
      `);

      // 4) (tuỳ chọn) tạo tài khoản
      if (data.tenDangNhap && data.matKhau) {
        const tenDangNhap = String(data.tenDangNhap).trim();

        const reqDup = new sql.Request(tx);
        const dup = await reqDup
          .input("tenDangNhap", sql.NVarChar, tenDangNhap)
          .query(`SELECT 1 FROM TaiKhoan WHERE tenDangNhap=@tenDangNhap`);
        if (dup.recordset.length) throw new Error("Tên đăng nhập đã tồn tại.");

        const maTK = "TK" + Date.now();
        const hash = await bcrypt.hash(String(data.matKhau), 10);

        const reqAcc = new sql.Request(tx);
        await reqAcc
          .input("maTK", sql.NVarChar, maTK)
          .input("tenDangNhap", sql.NVarChar, tenDangNhap)
          .input("matKhau", sql.NVarChar, hash)
          .input("vaiTro", sql.NVarChar, "Độc giả")
          .input("maDG", sql.NVarChar, maDG).query(`
          INSERT INTO TaiKhoan (maTK, tenDangNhap, matKhau, vaiTro, maDG)
          VALUES (@maTK, @tenDangNhap, @matKhau, @vaiTro, @maDG)
        `);
      }

      await tx.commit();
      return { message: "Thêm độc giả thành công", maDG };
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  },

  // Cập nhật độc giả + (tuỳ chọn) cập nhật/tạo tài khoản
  update: async (id, data) => {
    const pool = await getPool();
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      // 1) check trùng
      const reqChk = new sql.Request(tx);
      const chk = await reqChk
        .input("MSV", sql.VarChar, data.MSV)
        .input("email", sql.NVarChar, data.email)
        .input("maDG", sql.VarChar, id).query(`
        SELECT 1 FROM DocGia WHERE (MSV=@MSV OR email=@email) AND maDG<>@maDG
      `);
      if (chk.recordset.length)
        throw new Error("MSV hoặc email đã tồn tại ở độc giả khác");

      // 2) update DocGia
      const reqUpd = new sql.Request(tx);
      await reqUpd
        .input("maDG", sql.VarChar, id)
        .input("MSV", sql.VarChar, data.MSV)
        .input("hoTen", sql.NVarChar, data.hoTen)
        .input("gioiTinh", sql.NVarChar, data.gioiTinh)
        .input("ngaySinh", sql.Date, data.ngaySinh || null)
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

      // 3) xử lý tài khoản (đọc hiện có)
      const reqCur = new sql.Request(tx);
      const cur = await reqCur
        .input("maDGcur", sql.NVarChar, id)
        .query(`SELECT maTK, tenDangNhap FROM TaiKhoan WHERE maDG=@maDGcur`);
      const existed = cur.recordset?.[0];

      const hasUsername = !!(
        data.tenDangNhap && String(data.tenDangNhap).trim()
      );
      const hasPwdNew = !!(data.matKhau && String(data.matKhau).trim());

      if (hasUsername || hasPwdNew) {
        if (hasUsername) {
          const reqDup = new sql.Request(tx);
          const dup = await reqDup.input(
            "tenDangNhap",
            sql.NVarChar,
            String(data.tenDangNhap).trim()
          ).query(`
            SELECT 1 FROM TaiKhoan 
            WHERE tenDangNhap=@tenDangNhap
              AND (${existed?.maTK ? `maTK <> '${existed.maTK}'` : "1=1"})
          `);
          if (dup.recordset.length)
            throw new Error("Tên đăng nhập đã tồn tại.");
        }

        if (existed) {
          if (hasUsername) {
            const reqU1 = new sql.Request(tx);
            await reqU1
              .input("tenU", sql.NVarChar, String(data.tenDangNhap).trim())
              .input("maTK", sql.NVarChar, existed.maTK)
              .query(`UPDATE TaiKhoan SET tenDangNhap=@tenU WHERE maTK=@maTK`);
          }
          if (hasPwdNew) {
            const hash = await bcrypt.hash(String(data.matKhau), 10);
            const reqU2 = new sql.Request(tx);
            await reqU2
              .input("pwd", sql.NVarChar, hash)
              .input("maTK", sql.NVarChar, existed.maTK)
              .query(`UPDATE TaiKhoan SET matKhau=@pwd WHERE maTK=@maTK`);
          }
        } else {
          if (!hasUsername || !hasPwdNew) {
            throw new Error(
              "Nhập cả tên đăng nhập và mật khẩu mới để tạo tài khoản."
            );
          }
          const maTK = "TK" + Date.now();
          const hash = await bcrypt.hash(String(data.matKhau), 10);
          const reqInsAcc = new sql.Request(tx);
          await reqInsAcc
            .input("maTK", sql.NVarChar, maTK)
            .input("tenDangNhap", sql.NVarChar, String(data.tenDangNhap).trim())
            .input("matKhau", sql.NVarChar, hash)
            .input("vaiTro", sql.NVarChar, "Độc giả")
            .input("maDG", sql.NVarChar, id).query(`
            INSERT INTO TaiKhoan (maTK, tenDangNhap, matKhau, vaiTro, maDG)
            VALUES (@maTK, @tenDangNhap, @matKhau, @vaiTro, @maDG)
          `);
        }
      }

      await tx.commit();
      return { message: "Cập nhật độc giả thành công" };
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  },

  delete: async (id) => {
    const pool = await getPool();
    // Xoá account gắn độc giả (nếu có) rồi xoá độc giả
    await pool.request().input("maDG", sql.VarChar, id).query(`
        DELETE FROM TaiKhoan WHERE maDG=@maDG;
        DELETE FROM DocGia WHERE maDG=@maDG;
      `);
  },

  search: async (keyword) => {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("keyword", sql.NVarChar, `%${keyword}%`).query(`
        SELECT dg.*, tk.tenDangNhap
        FROM DocGia dg
        LEFT JOIN TaiKhoan tk ON tk.maDG = dg.maDG
        WHERE dg.hoTen LIKE @keyword 
           OR dg.MSV LIKE @keyword 
           OR dg.khoa LIKE @keyword 
           OR dg.lop LIKE @keyword 
           OR dg.email LIKE @keyword
      `);
    return result.recordset;
  },
};

module.exports = DocGia;
