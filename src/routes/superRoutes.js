const express = require("express");
const router = express.Router();
const { authenticate, isSuper } = require("../middleware/auth");
const superController = require("../controllers/superController");
const slotController = require("../controllers/slotController");
const consultantController = require("../controllers/consultantController");

// Get all logs
router.get("/getSuper", authenticate, isSuper, superController.getAllLogs);

// Get all users
router.get("/users", authenticate, isSuper, superController.getAllUsers);

// Create a new user
router.post("/createuseradmin", authenticate, isSuper, superController.createUser);

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
module.exports = router;