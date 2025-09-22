// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "secret_key_please_change";

function authMiddleware(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ message: "Không có token" });
  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Không có token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { maTK, tenDangNhap, vaiTro }
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token không hợp lệ" });
  }
}

function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.vaiTro;
    if (!role || !allowedRoles.includes(role))
      return res.status(403).json({ message: "Không có quyền" });
    next();
  };
}

module.exports = { authMiddleware, roleMiddleware };
