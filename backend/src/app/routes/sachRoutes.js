// backend/src/app/routes/sachRoutes.js
const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const sach = require("../controllers/sachControllers");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");

// Tạo đủ thư mục upload
const tailieuDir = path.join(__dirname, "../../uploads/tailieu");
const anhbiaDir = path.join(__dirname, "../../uploads/anhbia");
fs.mkdirSync(tailieuDir, { recursive: true });
fs.mkdirSync(anhbiaDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "anhBia") return cb(null, anhbiaDir);
    return cb(null, tailieuDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, Date.now() + "-" + Math.random().toString(36).slice(2) + ext);
  },
});

const ALLOWED_MIME = new Set([
  // docs
  "application/pdf",
  "application/epub+zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const fileFilter = (_req, file, cb) =>
  cb(null, ALLOWED_MIME.has(file.mimetype));

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// public
router.get("/meta", sach.meta);
router.get("/", sach.list);
router.get("/:maSach", sach.detail);

// thêm/sửa: Thủ thư + Quản lý; xóa: Quản lý
router.post(
  "/",
  authMiddleware,
  roleMiddleware("Thủ thư", "Quản lý"),
  upload.fields([
    { name: "taiLieuOnl", maxCount: 1 },
    { name: "anhBia", maxCount: 1 },
  ]),
  sach.create
);
router.put(
  "/:maSach",
  authMiddleware,
  roleMiddleware("Thủ thư", "Quản lý"),
  upload.fields([
    { name: "taiLieuOnl", maxCount: 1 },
    { name: "anhBia", maxCount: 1 },
  ]),
  sach.update
);
router.delete(
  "/:maSach",
  authMiddleware,
  roleMiddleware("Thủ thư", "Quản lý"),
  sach.remove
);

module.exports = router;
