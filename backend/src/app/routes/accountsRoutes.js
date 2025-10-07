const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/accountsController");
const { authMiddleware, roleMiddleware } = require("../middleware/auth");

// Chỉ "Quản lý" được quản trị tài khoản
router.use(authMiddleware, roleMiddleware("Quản lý"));

router.get("/", ctrl.getAll);
router.get("/search", ctrl.search);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.delete);
router.post("/:id/reset-password", ctrl.resetPassword);

module.exports = router;
