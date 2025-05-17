const mongoose = require("mongoose");
const SavedConsultant = require("../models/SavedConsultant");
const Consultant = require("../models/Consultant");

// Fonction pour obtenir les initiales d'un nom
const getInitials = (name) => {
  if (!name || typeof name !== "string") return "";
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.map((word) => word[0].toUpperCase()).join("") + ".";
};

const getSavedConsultants = async (req, res) => {
  try {
    const clientId = req.user._id;

    // Récupérer les consultants enregistrés pour ce client
    const savedConsultants = await SavedConsultant.find({
      client: clientId,
    }).select("consultant");
    const consultantIds = savedConsultants.map((sc) =>
      sc.consultant.toString()
    );

    res.status(200).json(consultantIds);
  } catch (error) {
    console.error("Erreur lors de la récupération des consultants enregistrés :", error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

const saveConsultant = async (req, res) => {
  try {
    const clientId = req.user.id;
    const consultantId = req.params.id;
    console.log("ID du client :", clientId, "ID du consultant :", consultantId);

    // Vérifier si le consultant existe
    const consultant = await Consultant.findById(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant non trouvé" });
    }

    const savedConsultant = new SavedConsultant({
      client: clientId,
      consultant: consultantId,
    });

    await savedConsultant.save();

    res.status(201).json({ message: "Consultant enregistré avec succès" });
  } catch (error) {
    if (error.name === "MongoServerError" && error.code === 11000) {
      res.status(400).json({ message: "Consultant déjà enregistré" });
    } else {
      console.error("Erreur lors de l'enregistrement du consultant :", error);
      res.status(500).json({ message: "Erreur du serveur" });
    }
  }
};

const unsaveConsultant = async (req, res) => {
  try {
    const clientId = req.user.id;
    const consultantId = req.params.id;

    // Vérifier si le consultant existe
    const consultant = await Consultant.findById(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant non trouvé" });
    }

    const result = await SavedConsultant.deleteOne({
      client: clientId,
      consultant: consultantId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Consultant non enregistré" });
    }

    res.status(200).json({ message: "Consultant supprimé de la liste avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du consultant de la liste :", error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

const getSavedProfileConsultant = async (req, res) => {
  try {
    const clientId = req.user.id;

    // Récupérer les consultants enregistrés pour ce client
    const savedConsultants = await SavedConsultant.find({
      client: clientId,
    });
    const consultantIds = savedConsultants.map((sc) => sc.consultant);

    // Récupérer les détails des consultants avec leurs profils
    const consultants = await Consultant.find({ _id: { $in: consultantIds } })
      .populate("Profile")
      .lean();

    const result = consultants
      .filter((c) => c && c.Profile)
      .map((consultant) => ({
        _id: consultant._id.toString(),
        Name: getInitials(consultant.Profile.Name || ""),
        Poste: consultant.Profile.Poste || [],
        Location: consultant.Profile.Location || "Inconnu",
        AnnéeExperience: consultant.Profile.AnnéeExperience || 0,
        Skills: consultant.Profile.Skills || [],
        TjmOrSalary: consultant.TjmOrSalary || "0",
        Email: consultant.Email || "",
        Phone: consultant.Phone || "",
        MissionType: consultant.MissionType || "",
        available: consultant.available
          ? consultant.available.toISOString()
          : null,
        Age: consultant.Age || 0,
      }));

    if (result.length === 0) {
      return res.status(404).json({ message: "Aucun consultant enregistré trouvé" });
    }

    res.json(result);
  } catch (error) {
    console.error("Erreur dans getSavedProfileConsultant :", error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

module.exports = {
  getSavedConsultants,
  saveConsultant,
  unsaveConsultant,
  getSavedProfileConsultant,
};
