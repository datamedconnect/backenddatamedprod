const Slots = require("../models/Slots");

// Fonction utilitaire pour calculer les initiales à partir d'un nom
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

    res.status(201).json(newSlot);
  } catch (error) {
    console.error("Erreur lors de la création du créneau :", error);
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

    res.json(transformedSlots);
  } catch (error) {
    console.error("Erreur lors de la récupération de tous les créneaux :", error);
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

    // Vérifier si des créneaux existent
    if (!slots || slots.length === 0) {
      return res
        .status(404)
        .json({ message: "Aucun créneau trouvé pour ce client" });
    }

    // Retourner les créneaux
    res.status(200).json(slots);
  } catch (error) {
    console.error("Erreur lors de la récupération des créneaux :", error);
    res.status(500).json({ message: "Erreur du serveur", error: error.message });
  }
};

const getSlotAdmin = async (req, res) => {
  try {
    const slot = await Slots.findById(req.params.id)
      .populate("client")
      .populate("consultants");
    if (!slot) {
      return res.status(404).json({ message: "Créneau non trouvé" });
    }

    res.json(slot);
  } catch (error) {
    console.error("Erreur lors de la récupération du créneau :", error);
    res.status(500).json({ message: error.message });
  }
};

const updateSlotDetails = async (req, res) => {
  try {
    const { selectedTimeSlot } = req.body;
    console.log("Received request to update slot with ID:", req.params.id);
    console.log("Selected time slot received:", selectedTimeSlot);

    // Check if selectedTimeSlot and its confirmedBy property exist
    if (!selectedTimeSlot || !selectedTimeSlot.confirmedBy) {
      console.log("Missing required fields in request");
      return res.status(400).json({ message: "Selected time slot and confirmedBy are required" });
    }

    // Prepare the data for the database update
    const updateData = {
      selectedTimeSlot: {
        ...selectedTimeSlot,
      },
      status: "Confirmé",
    };
    console.log("Data to update in database:", updateData);

    // Update the slot in the database
    const slot = await Slots.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!slot) {
      console.log("Slot not found for ID:", req.params.id);
      return res.status(404).json({ message: "Créneau non trouvé" });
    }

    console.log("Slot updated successfully:", slot);
    res.json(slot);
  } catch (error) {
    console.error("Error during slot update:", error);
    res.status(400).json({ message: error.message });
  }
};
const deleteSlotAdmin = async (req, res) => {
  try {
    const slot = await Slots.findByIdAndDelete(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: "Créneau non trouvé" });
    }

    res.json({ message: "Créneau supprimé" });
  } catch (error) {
    console.error("Erreur lors de la suppression du créneau :", error);
    res.status(500).json({ message: error.message });
  }
};

const updateSlotStatus = async (req, res) => {
  try {
    const slot = await Slots.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: "Créneau non trouvé" });
    }
    const oldStatus = slot.status;
    slot.status = req.body.status;
    await slot.save();

    res.json(slot);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut du créneau :", error);
    res.status(400).json({ message: error.message });
  }
};

const getAllConsultantsSlotsById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Vérifier que l'ID de l'utilisateur requis correspond au client authentifié
    if (userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Interdit : Vous ne pouvez accéder qu'à vos propres données" });
    }

    // Récupérer tous les créneaux créés par cet utilisateur
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
      return res.status(404).json({ message: "Aucun créneau trouvé pour cet utilisateur" });
    }

    // Transformer les créneaux pour inclure les champs nécessaires
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
      createdAt: slot.createdAt, // Ajouter la date de création
      __v: slot.__v,
    }));

    res.status(200).json(transformedSlots);
  } catch (error) {
    console.error("Erreur lors de la récupération des créneaux :", error);
    res.status(500).json({ message: "Erreur du serveur" });
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
