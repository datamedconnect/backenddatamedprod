const express = require("express");
const router = express.Router();
const { authenticate, isClient } = require("../middleware/auth");
const slotController = require("../controllers/slotController");

router.post("/create", authenticate, isClient, slotController.createSlotAdmin);
router.get("/allslots", authenticate, isClient, slotController.getAllSlotsAdmin);
router.get("/slot/:id", authenticate, isClient, slotController.getSlotAdmin);

router.delete(
  "/slots/:id",
  authenticate,
  isClient,
  slotController.deleteSlotAdmin
);
router.put(
  "/slots/:id/status",
  authenticate,
  isClient,
  slotController.updateSlotStatus
);

router.get(
  "/getAllConsultantsSlots/:id",
  authenticate,
  isClient,
  slotController.getAllConsultantsSlotsById
);


module.exports = router;
