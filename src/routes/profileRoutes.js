// routes/profile.js
const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
});

router.get("/:id", profileController.getProfile);
router.post("/", upload.single("pdfFile"), profileController.processPDF);
router.put("/:id", profileController.updateProfile);
router.post(
  "/upload-picture/:id",
  upload.single("profilePicture"),
  profileController.uploadProfilePicture
);

module.exports = router;