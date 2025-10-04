// models/sachModel.js
const { getPool, sql } = require("../../config/db");

    async function getAllSach() {
        try {
            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .query(`
                    SELECT 
                        s.maSach, s.tieuDe, s.tomTat, s.soLuong, s.soLuongMuon,
                        tl.tenTL, tg.tenTG, nxb.tenNXB
                    FROM Sach s
                    INNER JOIN TheLoai tl ON s.maTL = tl.maTL
                    INNER JOIN TacGia tg ON s.maTG = tg.maTG
                    INNER JOIN NhaXuatBan nxb ON s.maNXB = nxb.maNXB
                `);
            return result.recordset;
        } catch (error) {
            console.error('Lỗi query sách:', error);
            throw error;
        }
    }
    async function getSachByMa(maSach) {
        try {
            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .input('maSach', sql.VarChar(20), maSach)
                .query(`
                    SELECT 
                        s.*, tl.tenTL, tg.tenTG, nxb.tenNXB
                    FROM Sach s
                    INNER JOIN TheLoai tl ON s.maTL = tl.maTL
                    INNER JOIN TacGia tg ON s.maTG = tg.maTG
                    INNER JOIN NhaXuatBan nxb ON s.maNXB = nxb.maNXB
                    WHERE s.maSach = @maSach
                `);
            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    }
    
async function createSach(sachData) {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('maSach', sql.VarChar(20), sachData.maSach)
            .input('tieuDe', sql.NVarChar(500), sachData.tieuDe)
            .input('tomTat', sql.NVarChar, sachData.tomTat)
            .input('maTL', sql.VarChar(20), sachData.maTL)
            .input('maNXB', sql.VarChar(20), sachData.maNXB)
            .input('soLuong', sql.Int, sachData.soLuong || 0)
            .input('soLuongMuon', sql.Int, 0)
            .input('taiLieuOnl', sql.VarChar, sachData.taiLieuOnl)
            .input('maTG', sql.VarChar(20), sachData.maTG)
            .query(`
                INSERT INTO Sach (maSach, tieuDe, tomTat, maTL, maNXB, soLuong, soLuongMuon, taiLieuOnl, maTG)
                VALUES (@maSach, @tieuDe, @tomTat, @maTL, @maNXB, @soLuong, @soLuongMuon, @taiLieuOnl, @maTG)
            `);
        return { success: true };
    } catch (error) {
        throw error;  // DB sẽ throw nếu FK vi phạm
    }
}

    module.exports = { getAllSach, getSachByMa };