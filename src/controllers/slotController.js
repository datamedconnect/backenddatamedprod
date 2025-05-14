const Slots = require("../models/Slots");
const Logs = require("../models/Logs"); // Import Logs model

// Utility function to compute initials from a name
const getInitials = (name) => {
  if (!name) return "";
  const parts = name.split(" ");
  const initials = parts.map((part) => part[0].toUpperCase()).join("");
  return initials;
};

const createSlotAdmin = async (req, res) => {
  try {
    const slotData = {
      createdBy: req.user.id,
      client: req.user.id,
      consultants: req.body.consultants,
      status: req.body.status || "En Attente",
      timeSlots: req.body.timeSlots,
      selectedTimeSlot: req.body.selectedTimeSlot,
    };
    const newSlot = new Slots(slotData);
    await newSlot.save();

    // Log slot creation
    await Logs.create({
      actionType: "SLOT_CREATION",
      user: req.user.id,
      description: `Slot ${newSlot.exchangeNumber} created`,
      relatedEntity: { entityType: "Slots", entityId: newSlot._id },
      metadata: { exchangeNumber: newSlot.exchangeNumber, status: newSlot.status },
    });

    res.status(201).json(newSlot);
  } catch (error) {
    console.error("Error creating slot:", error);
    res.status(400).json({ message: error.message });
  }
};

const getAllSlotsAdmin = async (req, res) => {
  try {
    const slots = await Slots.find({ client: req.user.id })
      .populate({
        path: "consultants",
        populate: {
          path: "Profile",
          select: "Name Poste",
        },
      })
      .lean();

    const transformedSlots = slots.map((slot) => ({
      _id: slot._id,
      exchangeNumber: slot.exchangeNumber,
      status: slot.status,
      timeSlots: slot.timeSlots,
      consultants: slot.consultants
        ? {
            _id: slot.consultants._id,
            TjmOrSalary: slot.consultants.TjmOrSalary,
            Age: slot.consultants.Age,
            Location: slot.consultants.Location,
            Email: slot.consultants.Email,
            Profile: slot.consultants.Profile
              ? {
                  Name: slot.consultants.Profile.Name,
                  Poste: slot.consultants.Profile.Poste,
                  Initials: getInitials(slot.consultants.Profile.Name),
                }
              : null,
          }
        : null,
      selectedTimeSlot: slot.selectedTimeSlot,
      __v: slot.__v,
    }));

    // Log slot read action
    await Logs.create({
      actionType: "SLOT_READ",
      user: req.user.id,
      description: `User fetched ${slots.length} slots`,
      metadata: { slotCount: slots.length.toString() },
    });

    res.json(transformedSlots);
  } catch (error) {
    console.error("Error fetching all slots:", error);
    res.status(500).json({ message: error.message });
  }
};

const getSlotsByClient = async (req, res) => {
  try {
    const clientId = req.user.id;
    const slots = await Slots.find({ client: clientId })
      .populate("createdBy", "name email")
      .populate("client", "name email")
      .populate("consultants", "name");

    // Check if slots exist
    if (!slots || slots.length === 0) {
      // Log slot read action (no slots found)
      await Logs.create({
        actionType: "SLOT_READ",
        user: clientId,
        description: `User fetched 0 slots`,
        metadata: { slotCount: "0" },
      });
      return res
        .status(404)
        .json({ message: "No slots found for this client" });
    }

    // Log slot read action
    await Logs.create({
      actionType: "SLOT_READ",
      user: clientId,
      description: `User fetched ${slots.length} slots`,
      metadata: { slotCount: slots.length.toString() },
    });

    // Return the slots
    res.status(200).json(slots);
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getSlotAdmin = async (req, res) => {
  try {
    const slot = await Slots.findById(req.params.id)
      .populate("client")
      .populate("consultants");
    if (!slot) {
      // Log slot read action (not found)
      await Logs.create({
        actionType: "SLOT_READ",
        user: req.user.id,
        description: `User attempted to fetch slot ${req.params.id} but it was not found`,
        metadata: { slotId: req.params.id },
      });
      return res.status(404).json({ message: "Slot not found" });
    }

    // Log slot read action
    await Logs.create({
      actionType: "SLOT_READ",
      user: req.user.id,
      description: `User fetched slot ${slot.exchangeNumber}`,
      relatedEntity: { entityType: "Slots", entityId: slot._id },
      metadata: { exchangeNumber: slot.exchangeNumber },
    });

    res.json(slot);
  } catch (error) {
    console.error("Error fetching slot:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateSlotDetails = async (req, res) => {
  try {
    const { selectedTimeSlot } = req.body;
    const updateData = {
      selectedTimeSlot,
      status: "Confirmé",
    };

    const slot = await Slots.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    // Log slot update action
    await Logs.create({
      actionType: "SLOT_UPDATE",
      user: req.user.id,
      description: `Slot ${slot.exchangeNumber} updated with selected time slot and status Confirmé`,
      relatedEntity: { entityType: "Slots", entityId: slot._id },
      metadata: { exchangeNumber: slot.exchangeNumber, status: "Confirmé" },
    });

    res.json(slot);
  } catch (error) {
    console.error("Error updating slot details:", error);
    res.status(400).json({ message: error.message });
  }
};

const deleteSlotAdmin = async (req, res) => {
  try {
    const slot = await Slots.findByIdAndDelete(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    // Log slot deletion action
    await Logs.create({
      actionType: "SLOT_DELETION",
      user: req.user.id,
      description: `Slot ${slot.exchangeNumber} deleted`,
      relatedEntity: { entityType: "Slots", entityId: slot._id },
      metadata: { exchangeNumber: slot.exchangeNumber },
    });

    res.json({ message: "Slot deleted" });
  } catch (error) {
    console.error("Error deleting slot:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateSlotStatus = async (req, res) => {
  try {
    const slot = await Slots.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }
    const oldStatus = slot.status;
    slot.status = req.body.status;
    await slot.save();

    // Log slot status update action
    await Logs.create({
      actionType: "SLOT_UPDATE",
      user: req.user.id,
      description: `Slot ${slot.exchangeNumber} status updated from ${oldStatus} to ${slot.status}`,
      relatedEntity: { entityType: "Slots", entityId: slot._id },
      metadata: { exchangeNumber: slot.exchangeNumber, oldStatus, newStatus: slot.status },
    });

    res.json(slot);
  } catch (error) {
    console.error("Error updating slot status:", error);
    res.status(400).json({ message: error.message });
  }
};

const getAllConsultantsSlotsById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Ensure the requested user ID matches the authenticated client
    if (userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only access your own data" });
    }

    // Fetch all slots created by this user
    const slots = await Slots.find({ createdBy: userId })
      .populate({
        path: "consultants",
        populate: {
          path: "Profile",
          select: "Name Poste",
        },
      })
      .lean();

    if (!slots || slots.length === 0) {
      // Log slot read action (no slots found)
      await Logs.create({
        actionType: "SLOT_READ",
        user: userId,
        description: `User fetched 0 slots`,
        metadata: { slotCount: "0" },
      });
      return res.status(404).json({ message: "No slots found for this user" });
    }

    // Transform the slots to include necessary fields
    const transformedSlots = slots.map((slot) => ({
      _id: slot._id,
      exchangeNumber: slot.exchangeNumber,
      status: slot.status,
      timeSlots: slot.timeSlots,
      consultants: slot.consultants
        ? {
            _id: slot.consultants._id,
            TjmOrSalary: slot.consultants.TjmOrSalary,
            Age: slot.consultants.Age,
            Location: slot.consultants.Location,
            Email: slot.consultants.Email,
            Profile: slot.consultants.Profile
              ? {
                  Name: slot.consultants.Profile.Name,
                  Poste: slot.consultants.Profile.Poste,
                  Initials: getInitials(slot.consultants.Profile.Name),
                }
              : null,
          }
        : null,
      selectedTimeSlot: slot.selectedTimeSlot,
      __v: slot.__v,
    }));

    // Log slot read action
    await Logs.create({
      actionType: "SLOT_READ",
      user: userId,
      description: `User fetched ${slots.length} slots`,
      metadata: { slotCount: slots.length.toString() },
    });

    res.status(200).json(transformedSlots);
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createSlotAdmin,
  getAllSlotsAdmin,
  getSlotAdmin,
  updateSlotDetails,
  deleteSlotAdmin,
  updateSlotStatus,
  getAllConsultantsSlotsById,
  getSlotsByClient,
};