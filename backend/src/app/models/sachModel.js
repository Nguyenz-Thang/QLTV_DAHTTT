// backend/src/app/models/sachModel.js
const { getPool, sql } = require("../../config/db");

async function getMeta() {
  const pool = await getPool();
  const [tl, tg, nxb] = await Promise.all([
    pool.request().query("SELECT maTL, tenTL FROM TheLoai ORDER BY tenTL"),
    pool.request().query("SELECT maTG, tenTG FROM TacGia ORDER BY tenTG"),
    pool
      .request()
      .query("SELECT maNXB, tenNXB FROM NhaXuatBan ORDER BY tenNXB"),
  ]);
  return {
    theLoai: tl.recordset,
    tacGia: tg.recordset,
    nhaXuatBan: nxb.recordset,
  };
}

async function list() {
  const pool = await getPool();
  const rs = await pool.request().query(`
    SELECT s.*, tl.tenTL, tg.tenTG, nxb.tenNXB
    FROM Sach s
      LEFT JOIN TheLoai tl ON s.maTL = tl.maTL
      LEFT JOIN TacGia tg ON s.maTG = tg.maTG
      LEFT JOIN NhaXuatBan nxb ON s.maNXB = nxb.maNXB
    ORDER BY s.tieuDe
  `);
  return rs.recordset;
}

async function getById(maSach) {
  const pool = await getPool();
  const rs = await pool.request().input("maSach", sql.NVarChar, maSach).query(`
      SELECT s.*, tl.tenTL, tg.tenTG, nxb.tenNXB
      FROM Sach s
        LEFT JOIN TheLoai tl ON s.maTL = tl.maTL
        LEFT JOIN TacGia tg ON s.maTG = tg.maTG
        LEFT JOIN NhaXuatBan nxb ON s.maNXB = nxb.maNXB
      WHERE s.maSach = @maSach
    `);
  return rs.recordset[0] || null;
}

async function create({
  maSach,
  tieuDe,
  tomTat,
  maTL,
  maNXB,
  soLuong,
  maTG,
  taiLieuOnl,
  anhBia, // NEW
}) {
  const pool = await getPool();
  await pool
    .request()
    .input("maSach", sql.NVarChar, maSach)
    .input("tieuDe", sql.NVarChar, tieuDe)
    .input("tomTat", sql.NVarChar, tomTat ?? null)
    .input("maTL", sql.NVarChar, maTL ?? null)
    .input("maNXB", sql.NVarChar, maNXB ?? null)
    .input("soLuong", sql.Int, soLuong ?? 0)
    .input("maTG", sql.NVarChar, maTG ?? null)
    .input("taiLieuOnl", sql.NVarChar, taiLieuOnl ?? null)
    .input("anhBia", sql.NVarChar, anhBia ?? null).query(`
      INSERT INTO Sach (maSach, tieuDe, tomTat, maTL, maNXB, soLuong, soLuongMuon, taiLieuOnl, maTG, anhBia)
      VALUES (@maSach, @tieuDe, @tomTat, @maTL, @maNXB, @soLuong, 0, @taiLieuOnl, @maTG, @anhBia)
    `);
}

async function update(
  maSach,
  { tieuDe, tomTat, maTL, maNXB, soLuong, maTG, taiLieuOnl, anhBia } // NEW
) {
  const pool = await getPool();
  const q = `
    UPDATE Sach SET
      tieuDe = @tieuDe,
      tomTat = @tomTat,
      maTL = @maTL,
      maNXB = @maNXB,
      soLuong = @soLuong,
      maTG = @maTG
      ${taiLieuOnl !== undefined ? ", taiLieuOnl = @taiLieuOnl" : ""}
      ${anhBia !== undefined ? ", anhBia = @anhBia" : ""}
    WHERE maSach = @maSach
  `;
  const req = pool
    .request()
    .input("maSach", sql.NVarChar, maSach)
    .input("tieuDe", sql.NVarChar, tieuDe)
    .input("tomTat", sql.NVarChar, tomTat ?? null)
    .input("maTL", sql.NVarChar, maTL ?? null)
    .input("maNXB", sql.NVarChar, maNXB ?? null)
    .input("soLuong", sql.Int, soLuong ?? 0)
    .input("maTG", sql.NVarChar, maTG ?? null);

  if (taiLieuOnl !== undefined)
    req.input("taiLieuOnl", sql.NVarChar, taiLieuOnl);
  if (anhBia !== undefined) req.input("anhBia", sql.NVarChar, anhBia);

  await req.query(q);
}
async function remove(maSach) {
  const pool = await getPool();
  await pool
    .request()
    .input("maSach", sql.NVarChar, maSach)
    .query("DELETE FROM Sach WHERE maSach = @maSach");
}

module.exports = { getMeta, list, getById, create, update, remove };
