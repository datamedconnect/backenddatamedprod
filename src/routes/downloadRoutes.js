const express = require("express");
const router = express.Router();
const downloadController = require("../controllers/downloadController");


router.get("/:id/details",downloadController.getConsultantById);
router.get("/:id/download-cv", downloadController.downloadConsultantCV);

module.exports = router;
