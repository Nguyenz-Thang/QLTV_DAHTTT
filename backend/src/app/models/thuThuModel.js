const bcrypt = require("bcryptjs");
const { getPool, sql } = require("../../config/db"); // 👈 cần cả sql

// Lấy danh sách thủ thư
async function getAll() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT tt.*, tk.tenDangNhap
    FROM ThuThu tt
    LEFT JOIN TaiKhoan tk ON tk.maTT = tt.maTT
    ORDER BY tt.maTT
  `);
  return result.recordset;
}

// Thêm thủ thư + (tùy chọn) tạo tài khoản
async function create(data) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const req = new sql.Request(tx);

    // 1) Tạo mã TT
    const maTT = data.maTT || "TT" + Date.now();

    // 2) Chèn ThuThu
    await req
      .input("maTT", sql.NVarChar, maTT)
      .input("tenTT", sql.NVarChar, data.tenTT)
      .input("ngaySinh", sql.Date, data.ngaySinh || null)
      .input("cccd", sql.NVarChar, data.cccd || null)
      .input("email", sql.NVarChar, data.email || null)
      .input("SDT", sql.NVarChar, data.SDT || null)
      .input("diaChi", sql.NVarChar, data.diaChi || null)
      .input("chucVu", sql.NVarChar, data.chucVu || null).query(`
        INSERT INTO ThuThu (maTT,tenTT,ngaySinh, cccd, email, SDT, diaChi, chucVu)
        VALUES (@maTT,@tenTT,@ngaySinh, @cccd, @email, @SDT, @diaChi, @chucVu)
      `);

    // 3) Nếu có tên đăng nhập + mật khẩu => tạo luôn tài khoản vai trò "Thủ thư"
    if (data.tenDangNhap && data.matKhau) {
      const tenDangNhap = String(data.tenDangNhap).trim();

      // 3.1) Check trùng username
      const chk = await req
        .input("tenDangNhap", sql.NVarChar, tenDangNhap)
        .query("SELECT 1 FROM TaiKhoan WHERE tenDangNhap=@tenDangNhap");
      if (chk.recordset.length) {
        throw new Error("Tên đăng nhập đã tồn tại.");
      }

      // 3.2) Hash mật khẩu
      const hash = await bcrypt.hash(String(data.matKhau), 10);
      const maTK = "TK" + Date.now();

      // 3.3) Tạo tài khoản, gắn vai trò Thủ thư + liên kết maTT
      await // maTT đã có trong request với @maTT
      req
        .input("maTK", sql.NVarChar, maTK)
        .input("matKhau", sql.NVarChar, hash)
        .input("vaiTro", sql.NVarChar, "Thủ thư").query(`
          INSERT INTO TaiKhoan (maTK, tenDangNhap, matKhau, vaiTro, maTT)
          VALUES (@maTK, @tenDangNhap, @matKhau, @vaiTro, @maTT)
        `);
    }

    await tx.commit();
    return { message: "Thêm thủ thư thành công", maTT };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

// Xoá thủ thư
async function remove(maTT) {
  const pool = await getPool();
  const result = await pool.request().input("maTT", maTT).query(`
    DELETE FROM TaiKhoan WHERE maTT=@maTT;   -- xoá tài khoản gắn TT (nếu có)
    DELETE FROM ThuThu   WHERE maTT=@maTT;
  `);
  // rowsAffected là mảng theo từng câu lệnh; chỉ cần có xoá ở câu 2
  const affected = Array.isArray(result.rowsAffected)
    ? result.rowsAffected[result.rowsAffected.length - 1] || 0
    : result.rowsAffected || 0;
  return affected > 0;
}

// Cập nhật thủ thư (không đụng tài khoản ở API này)
async function update(maTT, data) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const req = new sql.Request(tx);

    // 1) update bảng ThuThu
    await req
      .input("maTT", sql.NVarChar, maTT)
      .input("tenTT", sql.NVarChar, data.tenTT)
      .input("ngaySinh", sql.Date, data.ngaySinh || null)
      .input("cccd", sql.NVarChar, data.cccd || null)
      .input("email", sql.NVarChar, data.email || null)
      .input("SDT", sql.NVarChar, data.SDT || null)
      .input("diaChi", sql.NVarChar, data.diaChi || null)
      .input("chucVu", sql.NVarChar, data.chucVu || null).query(`
        UPDATE ThuThu
        SET tenTT=@tenTT, ngaySinh=@ngaySinh, cccd=@cccd, email=@email,
            SDT=@SDT, diaChi=@diaChi, chucVu=@chucVu
        WHERE maTT=@maTT
      `);

    // 2) Nếu có dữ liệu tài khoản → cập nhật/khởi tạo
    const hasUsername = !!(data.tenDangNhap && String(data.tenDangNhap).trim());
    const hasPwdNew = !!(data.matKhau && String(data.matKhau).trim());

    if (hasUsername || hasPwdNew) {
      // Kiểm tra hiện có tài khoản gắn maTT chưa
      const cur = await req.query(`
        SELECT maTK, tenDangNhap FROM TaiKhoan WHERE maTT=@maTT
      `);
      const existed = cur.recordset?.[0];

      // Nếu đổi username → check trùng (loại trừ chính mình)
      if (hasUsername) {
        const tenDangNhap = String(data.tenDangNhap).trim();
        const chk = await req.input("tenDangNhap", sql.NVarChar, tenDangNhap)
          .query(`
            SELECT 1 FROM TaiKhoan
            WHERE tenDangNhap=@tenDangNhap
              AND (${existed?.maTK ? `maTK <> '${existed.maTK}'` : "1=1"})
          `);
        if (chk.recordset.length) {
          throw new Error("Tên đăng nhập đã tồn tại.");
        }
      }

      if (existed) {
        // --- Cập nhật tài khoản hiện có ---
        if (hasUsername) {
          await req
            .input(
              "tenDangNhapU",
              sql.NVarChar,
              String(data.tenDangNhap).trim()
            )
            .query(
              `UPDATE TaiKhoan SET tenDangNhap=@tenDangNhapU WHERE maTK='${existed.maTK}'`
            );
        }
        if (hasPwdNew) {
          const hash = await bcrypt.hash(String(data.matKhau), 10);
          await req
            .input("matKhau", sql.NVarChar, hash)
            .query(
              `UPDATE TaiKhoan SET matKhau=@matKhau WHERE maTK='${existed.maTK}'`
            );
        }
      } else {
        // --- Chưa có tài khoản → tạo mới (cần cả username & password) ---
        if (!hasUsername || !hasPwdNew) {
          throw new Error(
            "Nhập cả tên đăng nhập và mật khẩu mới để tạo tài khoản."
          );
        }
        const tenDangNhap = String(data.tenDangNhap).trim();
        const chk = await req
          .input("tenDangNhap", sql.NVarChar, tenDangNhap)
          .query("SELECT 1 FROM TaiKhoan WHERE tenDangNhap=@tenDangNhap");
        if (chk.recordset.length) {
          throw new Error("Tên đăng nhập đã tồn tại.");
        }

        const maTK = "TK" + Date.now();
        const hash = await bcrypt.hash(String(data.matKhau), 10);
        await req
          .input("maTK", sql.NVarChar, maTK)
          .input("tenDangNhap", sql.NVarChar, tenDangNhap)
          .input("matKhau", sql.NVarChar, hash)
          .input("vaiTro", sql.NVarChar, "Thủ thư").query(`
            INSERT INTO TaiKhoan (maTK, tenDangNhap, matKhau, vaiTro, maTT)
            VALUES (@maTK, @tenDangNhap, @matKhau, @vaiTro, @maTT)
          `);
      }
    }

    await tx.commit();
    return { message: "Cập nhật thủ thư thành công" };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}
module.exports = { getAll, create, remove, update };
