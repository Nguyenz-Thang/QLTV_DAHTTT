const History = require("../models/historyModel");

// GET /api/lichsu/:maTK
exports.listByAccount = async (req, res) => {
  try {
    const { dateFrom, dateTo, status, page, pageSize } = req.query;
    const { maTK } = req.params;
    const out = await History.listByAccount({
      maTK,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      status: status || "all",
      page: page || 1,
      pageSize: pageSize || 20,
    });
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Không lấy được lịch sử mượn" });
  }
};

// (tuỳ chọn) GET /api/lichsu/me -> lấy theo user đăng nhập
exports.listMyHistory = async (req, res) => {
  try {
    const maTK = req.user?.maTK; // từ auth middleware
    if (!maTK) return res.status(401).json({ message: "Chưa đăng nhập" });
    req.params.maTK = maTK;
    return exports.listByAccount(req, res);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Không lấy được lịch sử của bạn" });
  }
};
