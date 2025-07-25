const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { sentryMiddleware } = require("../middleware/sentryMiddleware"); 

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/verify-code", authController.verifyCode); 
router.post("/resend-code", authController.resendCode); 
router.get("/user/details", authenticate, authController.getUserDetails);
router.post("/reset-password", authController.resetPassword);
router.put("/user/details", authenticate, authController.updateUserDetails);
router.put("/user/password", authenticate, authController.updatePassword);

module.exports = router;
