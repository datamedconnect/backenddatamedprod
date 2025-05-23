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
  isClient,
  clientController.getConsultantClient
);

// router.get(
//   "/consultantsauvegrader",
//   authenticate,
//   isClient,
//   savedConsultantController.getSavedConsultants
// );

router.get(
  "/savedprofileConsultants",
  authenticate,
  isClient,
  savedConsultantController.getSavedProfileConsultant
);
// workrs juste fine
router.post(
  "/consultantsauvegrader/:id",
  authenticate,
  isClient,
  savedConsultantController.saveConsultant
);
// works juste fine
router.delete(
  "/consultantsauvegrader/:id",
  authenticate,
  isClient,
  savedConsultantController.unsaveConsultant
);
router.get(
  "/getallBesionbyId/:id",
  authenticate,
  isClient,
  besionController.getAllBesionById
);
router.get(
  "/getBesion/:id",
  authenticate,
  isClient,
  besionController.getBesionById
);

router.post(
  "/compareclient/:id",
  authenticate,
  isClient,
  besionController.createScore
);

router.get(
  "/getAllMatchedConsultant/:id",
  authenticate,
  isClient,
  besionController.getAllConsultantsBesionByIdClient
);

router.post(
  "/addBesion",
  authenticate,
  isClient,
  besionController.createbesionClient
);

// router.get(
//   "/integration/:id",
//   authenticate,
//   isClient,
//   integrationController.getIntegrationlist
// );

router.get(
  "/getSlots",
  authenticate,
  isClient,
  slotController.getSlotsByClient
);

router.post(
  "/extract-pdf-data",
  authenticate,
  isClient,
  upload.single("pdfFile"),
  besionController.extractPdfData
);


module.exports = router;
