const express = require("express");
const router = express.Router();
const { isSuper, authenticate } = require("../middleware/auth");
const spuerController = require("../controllers/superController");

router.get("/getSuper", authenticate, isSuper, spuerController.getAllLogs);

module.exports = router;
