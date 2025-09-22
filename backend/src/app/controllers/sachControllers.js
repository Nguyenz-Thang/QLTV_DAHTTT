// controllers/sachController.js
const SachModel = require("../models/sachModel");

async function getSachList(req, res) {
  try {
    const rows = await SachModel.getAllSach();
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getSachList };
