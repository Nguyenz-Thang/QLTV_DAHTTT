// backend/src/app/routes/sachRoutes.js
const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const sach = require("../controllers/sachControllers");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");

// thư mục upload
const uploadDir = path.join(__dirname, "../../uploads/tailieu");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, Date.now() + "-" + Math.random().toString(36).slice(2) + ext);
  },
});
const fileFilter = (_req, file, cb) => {
  const ok = [
    "application/pdf",
    "application/epub+zip",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ].includes(file.mimetype);
  cb(null, ok);
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// public (hoặc bạn có thể yêu cầu đăng nhập tuỳ ý)
router.get("/meta", sach.meta);
router.get("/", sach.list);
router.get("/:maSach", sach.detail);

// thêm/sửa: Thủ thư + Quản lý; xóa: Quản lý
router.post(
  "/",
  authMiddleware,
  roleMiddleware("Thủ thư", "Quản lý"),
  upload.single("taiLieuOnl"),
  sach.create
);
router.put(
  "/:maSach",
  authMiddleware,
  roleMiddleware("Thủ thư", "Quản lý"),
  upload.single("taiLieuOnl"),
  sach.update
);
router.delete(
  "/:maSach",
  authMiddleware,
  roleMiddleware("Quản lý"),
  sach.remove
);

module.exports = router;
