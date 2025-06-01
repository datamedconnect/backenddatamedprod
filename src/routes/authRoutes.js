const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/user/details", authenticate, authController.getUserDetails);
router.post("/reset-password", authController.resetPassword);


module.exports = router;