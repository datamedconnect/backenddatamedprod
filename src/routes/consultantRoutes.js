const express = require("express");
const router = express.Router();
const consultantController = require("../controllers/consultantController");

router.post("/", consultantController.uploadCV);
router.get("/:id", consultantController.getConsultant);
router.put("/:id", consultantController.updateConsultant);
router.get("/:id/details", consultantController.getConsultantById);
router.get("/:id/Name", consultantController.getConsultantName);
router.put("/:id/availability", consultantController.updatedAvailability);
router.post(
  "/verify-availability-token",
  consultantController.verifyAvailabilityToken
);

module.exports = router;
