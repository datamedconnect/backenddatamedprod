const express = require("express");
const router = express.Router();
const { authenticate, isAdmin, isClient } = require("../middleware/auth");
const consultantController = require("../controllers/consultantController");
const slotController = require("../controllers/slotController");
const besionController = require("../controllers/besionController");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/consultants",
  authenticate,
  isAdmin,
  upload.single("pdffile"),
  consultantController.createConsultantAdmin
);
router.get(
  "/acceuil",
  authenticate,
  isAdmin,
  consultantController.getConsultantAdmin
);
router.get(
  "/allconsultants",
  authenticate,
  isAdmin,
  consultantController.getAllConsultantsAdmin
);
router.get(
  "/exchangerequest",
  authenticate,
  isAdmin,
  consultantController.getexchangerequestAdmin
);
router.put(
  "/consultants/:id/status", // New route for updating status
  authenticate,
  isAdmin,
  consultantController.updateConsultantStatus
);
router.put(
  "/consultants/:id/details",
  authenticate,
  isAdmin,
  consultantController.updateConsultantDetails
);
router.put(
  "/slots/:id/details",
  authenticate,
  isAdmin,
  slotController.updateSlotDetails
);
router.put(
  "/slots/:id/status",
  authenticate,
  isAdmin,
  slotController.updateSlotStatus
)
router.post(
  "/addBesion",
  authenticate,
  isAdmin,
  besionController.createbesion
);
router.get(
  "/allBesion",
  authenticate,
  isAdmin,
  besionController.getAllBesion
);
router.get(
  "/getBesion/:id",
  authenticate,
  isAdmin,
  besionController.getBesionById
);
router.post(
  "/compare/:id",
  authenticate,
  isAdmin,
  besionController.createScore
);

router.get(
  "/getallBesionbyId/:id",
  authenticate,
  isAdmin,
  besionController.getAllBesionById
);

router.get(
  "/getAllConsultantsBesion/:id",
  authenticate,
  isAdmin,
  besionController.getAllConsultantsBesionById
);

// New route for PDF data extraction
router.post(
  "/extract-pdf-data",
  authenticate,
  isClient,
  upload.single("pdfFile"),
  besionController.extractPdfData
);

module.exports = router;
