const dbConfig = require('../../config/db');

// Lấy tất cả thủ thư
async function getAllThuThu() {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`SELECT * FROM ThuThu`);
        return result.recordset;
    } catch (error) {
        console.error('Lỗi getAllThuThu:', error);
        throw error;
    }
}

// Lấy thủ thư theo ID
async function getThuThuById(maTT) {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('maTT', sql.VarChar(20), maTT)
            .query(`SELECT * FROM ThuThu WHERE maTT = @maTT`);
        return result.recordset[0];
    } catch (error) {
        console.error('Lỗi getThuThuById:', error);
        throw error;
    }
}

// Tạo thủ thư mới
async function createThuThu(data) {
    try {
        const pool = await sql.connect(dbConfig);
        const maTT = `TT${Date.now()}`;
        await pool.request()
            .input('maTT', sql.VarChar(20), maTT)
            .input('tenTT', sql.NVarChar(100), data.tenTT)
            .input('email', sql.VarChar(100), data.email)
            .input('soDienThoai', sql.VarChar(20), data.soDienThoai)
            .query(`
                INSERT INTO ThuThu (maTT, tenTT, email, soDienThoai) 
                VALUES (@maTT, @tenTT, @email, @soDienThoai)
            `);
        return { success: true, maTT };
    } catch (error) {
        console.error('Lỗi createThuThu:', error);
        throw error;
    }
}

// Cập nhật thủ thư
async function updateThuThu(maTT, data) {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('maTT', sql.VarChar(20), maTT)
            .input('tenTT', sql.NVarChar(100), data.tenTT)
            .input('email', sql.VarChar(100), data.email)
            .input('soDienThoai', sql.VarChar(20), data.soDienThoai)
            .query(`
                UPDATE ThuThu 
                SET tenTT=@tenTT, email=@email, soDienThoai=@soDienThoai
                WHERE maTT=@maTT
            `);
        return { success: true };
    } catch (error) {
        console.error('Lỗi updateThuThu:', error);
        throw error;
    }
}

// Xóa thủ thư
async function deleteThuThu(maTT) {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('maTT', sql.VarChar(20), maTT)
            .query('DELETE FROM ThuThu WHERE maTT = @maTT');
        return { success: true };
    } catch (error) {
        console.error('Lỗi deleteThuThu:', error);
        throw error;
    }
}

module.exports = { getAllThuThu, getThuThuById, createThuThu, updateThuThu, deleteThuThu };
