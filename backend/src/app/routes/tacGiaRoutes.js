const express = require("express");
const router = express.Router();
const ctl = require("../controllers/tacGiaController");
const { authMiddleware /*, roleMiddleware*/ } = require("../middleware/auth");

router.get("/", authMiddleware, ctl.getAll);
router.post("/", authMiddleware /*, roleMiddleware("Quản lý")*/, ctl.create);
router.put("/:id", authMiddleware /*, roleMiddleware("Quản lý")*/, ctl.update);
router.delete(
  "/:id",
  authMiddleware /*, roleMiddleware("Quản lý")*/,
  ctl.delete
);

module.exports = router;
