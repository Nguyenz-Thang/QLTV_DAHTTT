// backend/src/app/controllers/thongKeController.js
const tk = require("../models/thongKeModel");

exports.getDashboard = async (req, res) => {
  try {
    const { from, to } = req.query;

    if ((from && !to) || (!from && to)) {
      return res.status(400).json({ message: "Thiếu tham số from/to" });
    }

    if (from && to) {
      const details = await tk.borrowDetailsByDateRange(from, to);
      return res.json({ data: { details } });
    }

    const [ov, series, top, overdue, allDetails] = await Promise.all([
      tk.overview(),
      tk.borrowByMonth(6),
      tk.topBooks(3), // Top 3
      tk.overdueList(10),
      tk.borrowAllDetails(),
    ]);

    res.json({
      data: {
        overview: ov,
        monthly: series,
        topBooks: top,
        overdue,
        details: allDetails,
      },
    });
  } catch (e) {
    console.error("thongKe.getDashboard error:", e);
    res.status(500).json({ message: "Không lấy được thống kê." });
  }
};
