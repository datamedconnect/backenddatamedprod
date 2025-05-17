const express = require("express");
const router = express.Router();
const { authenticate, isSuper } = require("../middleware/auth");
const superController = require("../controllers/superController");
const slotController = require("../controllers/slotController");
const consultantController = require("../controllers/consultantController");
const besionController = require("../controllers/besionController");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// Get all logs
router.get("/getSuper", authenticate, isSuper, superController.getAllLogs);

// Get all users
router.get("/users", authenticate, isSuper, superController.getAllUsers);
router.get("/demos", authenticate, isSuper, superController.getAllRequests);


// Create a new user
router.post(
  "/createuseradmin",
  authenticate,
  isSuper,
  superController.createUser
);

// Update a user
router.put("/users/:id", authenticate, isSuper, superController.updateUser);

// Delete a user
router.delete("/users/:id", authenticate, isSuper, superController.deleteUser);

// Get exchange requests
router.get(
  "/exchangerequest",
  authenticate,
  isSuper,
  consultantController.getexchangerequestAdmin
);

router.get(
  "/allconsultants",
  authenticate,
  isSuper,
  consultantController.getAllConsultantsAdmin
);
router.get("/allBesion", authenticate, isSuper, besionController.getAllBesionSuper);

router.get("/numbers", authenticate, isSuper, superController.getAllNumbers);
router.delete(
  "/deleteConsultant/:id",
  authenticate,
  isSuper,
  superController.deleteConsultant
);


router.delete(
  "/deleteBesion/:id",
  authenticate,
  isSuper,
  besionController.deleteBesion
);
// Update slot details
router.put(
  "/slots/:id/details",
  authenticate,
  isSuper,
  slotController.updateSlotDetails
);
router.get(
  "/allconsultants",
  authenticate,
  isSuper,
  consultantController.getAllConsultantsAdmin
);

router.put(
  "/consultants/:id/status",
  authenticate,
  isSuper,
  consultantController.updateConsultantStatus
);

router.post(
  "/consultants",
  authenticate,
  isSuper,
  upload.single("pdffile"),
  consultantController.createConsultantAdmin
);

router.put(
  "/consultants/:id/details",
  authenticate,
  isSuper,
  consultantController.updateConsultantDetails
);
router.put(
  "/consultants/:id/status",
  authenticate,
  isSuper,
  consultantController.updateConsultantStatus
);

module.exports = router;
