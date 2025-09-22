// models/sachModel.js
const { getPool, sql } = require("../../config/db");

async function getAllSach() {
  const pool = await getPool();
  const result = await pool.request().query("SELECT * FROM Sach");
  return result.recordset;
}

module.exports = { getAllSach };
