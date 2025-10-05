const sql = require('mssql');
const dbConfig = require('../../config/db');

async function getAllPhieuMuon() {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`
            SELECT 
                pm.maPM, pm.ngayMuon, pm.ngayHenTra,
                dg.hoTen AS tenDocGia, dg.email AS emailDocGia,
                tt.tenTT AS tenThuThu,
                ctm.maSach, s.tieuDe AS tenSach, ctm.soLuong, ctm.trangThai
            FROM PhieuMuon pm
            INNER JOIN DocGia dg ON pm.maDG = dg.maDG
            INNER JOIN ThuThu tt ON pm.maTT = tt.maTT
            INNER JOIN ChiTietPhieuMuon ctm ON pm.maPM = ctm.maPM
            INNER JOIN Sach s ON ctm.maSach = s.maSach
            ORDER BY pm.ngayMuon DESC
        `);
        return result.recordset;
    } catch (error) {
        console.error('Lỗi getAllPhieuMuon:', error);
        throw error;
    }
}

async function createPhieuMuon(data) {
    try {
        const pool = await sql.connect(dbConfig);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        // Tạo PhieuMuon
        const maPM = `PM${Date.now()}`;
        await transaction.request()
            .input('maPM', sql.VarChar(20), maPM)
            .input('maDG', sql.VarChar(20), data.maDG)
            .input('maTT', sql.VarChar(20), data.maTT)
            .query('INSERT INTO PhieuMuon (maPM, maDG, maTT) VALUES (@maPM, @maDG, @maTT)');

        // Tạo ChiTietPhieuMuon và cập nhật soLuongMuon
        for (const item of data.chiTiet) {
            const maCTM = `CTM${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
            await transaction.request()
                .input('maCTM', sql.VarChar(20), maCTM)
                .input('maPM', sql.VarChar(20), maPM)
                .input('maSach', sql.VarChar(20), item.maSach)
                .input('soLuong', sql.Int, item.soLuong)
                .query('INSERT INTO ChiTietPhieuMuon (maCTM, maPM, maSach, soLuong) VALUES (@maCTM, @maPM, @maSach, @soLuong)');

            // Cập nhật sách
            await transaction.request()
                .input('maSach', sql.VarChar(20), item.maSach)
                .input('soLuong', sql.Int, item.soLuong)
                .query('UPDATE Sach SET soLuongMuon = soLuongMuon + @soLuong WHERE maSach = @maSach');
        }

        await transaction.commit();
        return { success: true, maPM };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

module.exports = { getAllPhieuMuon, createPhieuMuon };
