const express = require("express");
const router = express.Router();
const downloadController = require("../controllers/downloadController");
const { authenticate } = require("../middleware/auth");

router.get("/:id/details", downloadController.getConsultantById);
router.get(
  "/:id/download-cv",
  authenticate,
  downloadController.downloadConsultantCV,
);

module.exports = router;
