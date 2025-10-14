// backend/src/app/controllers/thongKeController.js
const tk = require("../models/thongKeModel");

exports.getDashboard = async (req, res) => {
  try {
    const [ov, series, top, overdue] = await Promise.all([
      tk.overview(),
      tk.borrowByMonth(6),
      tk.topBooks(10),
      tk.overdueList(10),
    ]);
    res.json({
      data: { overview: ov, monthly: series, topBooks: top, overdue },
    });
  } catch (e) {
    console.error("thongKe.getDashboard error:", e);
    res.status(500).json({ message: "Không lấy được thống kê." });
  }
};
