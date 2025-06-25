const express = require("express");
const router = express.Router();
const { authenticate, isClient } = require("../middleware/auth");
const clientController = require("../controllers/clientController");
const besionController = require("../controllers/besionController");
const savedConsultantController = require("../controllers/savedConsultantController");
const slotController = require("../controllers/slotController");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.get(
  "/rechercher",
  authenticate,
  clientController.getConsultantClient
);

router.get(
  "/savedprofileConsultants",
  authenticate,
  savedConsultantController.getSavedProfileConsultant
);

router.post(
  "/consultantsauvegrader/:id",
  authenticate,
  savedConsultantController.saveConsultant
);

router.delete(
  "/consultantsauvegrader/:id",
  authenticate,
  savedConsultantController.unsaveConsultant
);

router.get(
  "/getallBesionbyId/:id",
  authenticate,
  besionController.getAllBesionById
);

router.get(
  "/getBesion/:id",
  authenticate,
  besionController.getBesionById
);

router.post(
  "/compareclient/:id",
  authenticate,
  besionController.createScore
);

router.get(
  "/getAllMatchedConsultant/:id",
  authenticate,
  besionController.getAllConsultantsBesionByIdClient
);

router.post(
  "/addBesion",
  authenticate,
  besionController.createbesionClient
);

router.get(
  "/getSlots",
  authenticate,
  slotController.getSlotsByClient
);

router.post(
  "/extract-pdf-data",
  authenticate,
  upload.single("pdfFile"),
  besionController.extractPdfData
);

router.post(
  "/sendsupport",
  authenticate,
  clientController.sendsupport
);

router.post(
  "/triggerMatching/:id",
  authenticate,
  besionController.triggerMatching
);

router.post(
  "/getBesionWithMatching/:id",
  authenticate,
  besionController.getBesionWithMatchingPost
);

router.get(
  "/fetchBesionMatching/:id",
  authenticate,
  besionController.fetchBesionMatching
);

module.exports = router;