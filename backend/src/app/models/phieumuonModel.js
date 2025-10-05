const sql = require('mssql');
const dbConfig = require('../../config/db');

// Lấy tất cả phiếu mượn
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

// Lấy phiếu mượn theo ID
async function getPhieuMuonById(maPM) {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('maPM', sql.VarChar(20), maPM)
            .query(`
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
                WHERE pm.maPM = @maPM
            `);
        return result.recordset;
    } catch (error) {
        console.error('Lỗi getPhieuMuonById:', error);
        throw error;
    }
}

// Tạo phiếu mượn mới
async function createPhieuMuon(data) {
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const maPM = `PM${Date.now()}`;
        await transaction.request()
            .input('maPM', sql.VarChar(20), maPM)
            .input('maDG', sql.VarChar(20), data.maDG)
            .input('maTT', sql.VarChar(20), data.maTT)
            .query('INSERT INTO PhieuMuon (maPM, maDG, maTT) VALUES (@maPM, @maDG, @maTT)');

        for (const item of data.chiTiet) {
            const maCTM = `CTM${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
            await transaction.request()
                .input('maCTM', sql.VarChar(20), maCTM)
                .input('maPM', sql.VarChar(20), maPM)
                .input('maSach', sql.VarChar(20), item.maSach)
                .input('soLuong', sql.Int, item.soLuong)
                .query('INSERT INTO ChiTietPhieuMuon (maCTM, maPM, maSach, soLuong) VALUES (@maCTM, @maPM, @maSach, @soLuong)');

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

// Cập nhật phiếu mượn
async function updatePhieuMuon(maPM, data) {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('maPM', sql.VarChar(20), maPM)
            .input('ngayHenTra', sql.DateTime, data.ngayHenTra)
            .query('UPDATE PhieuMuon SET ngayHenTra = @ngayHenTra WHERE maPM = @maPM');

        return { success: true };
    } catch (error) {
        console.error('Lỗi updatePhieuMuon:', error);
        throw error;
    }
}

// Xóa phiếu mượn
async function deletePhieuMuon(maPM) {
    try {
        const pool = await sql.connect(dbConfig);

        await pool.request()
            .input('maPM', sql.VarChar(20), maPM)
            .query('DELETE FROM ChiTietPhieuMuon WHERE maPM = @maPM');

        await pool.request()
            .input('maPM', sql.VarChar(20), maPM)
            .query('DELETE FROM PhieuMuon WHERE maPM = @maPM');

        return { success: true };
    } catch (error) {
        console.error('Lỗi deletePhieuMuon:', error);
        throw error;
    }
}

module.exports = { getAllPhieuMuon, getPhieuMuonById, createPhieuMuon, updatePhieuMuon, deletePhieuMuon};
