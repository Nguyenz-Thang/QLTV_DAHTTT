// routes/sachRoutes.js
const express = require("express");
const router = express.Router();
const sachController = require("../controllers/sachControllers");

router.get("/", sachController.getSachList);

module.exports = router;
