const Consultant = require("../models/Consultant");
const SavedConsultant = require("../models/SavedConsultant");

// Fonction utilitaire pour abréger le nom
const abbreviateName = (fullName) => {
  if (!fullName || typeof fullName !== "string") return null;
  const trimmed = fullName.trim();
  if (trimmed === "") return null;
  const words = trimmed.split(/\s+/);
  const initials = words.map((word) => word[0].toUpperCase());
  return initials.join("") + ".";
};

const getConsultantClient = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer les consultants enregistrés pour cet utilisateur
    const savedConsultants = await SavedConsultant.find({ client: userId }).select('consultant');
    const savedConsultantSet = new Set(savedConsultants.map(sc => sc.consultant.toString()));

    // Récupérer les consultants avec le statut "Qualifié" et peupler le Profil
    const consultants = await Consultant.find({ status: "Qualifié" }).populate("Profile");

    // Filtrer les consultants avec le nom "Non spécifié"
    const filteredConsultants = consultants.filter(consultant => {
      const name = consultant.Profile?.Name;
      return name && name !== "Non spécifié";
    });

    // Mapper les données au format de sortie souhaité
    const result = filteredConsultants.map(consultant => ({
      _id: consultant._id,  // Utiliser consultant._id
      profileid: consultant.Profile._id,
      Name: consultant.Profile ? abbreviateName(consultant.Profile.Name) : null,
      Age: consultant.Age,
      Poste: consultant.Profile ? consultant.Profile.Poste : [],
      Available: consultant.available,
      Location: consultant.Location,
      AnnéeExperience: consultant.Profile ? consultant.Profile.AnnéeExperience : null,
      Skills: consultant.Profile ? consultant.Profile.Skills : [],
      TjmOrSalary: consultant.TjmOrSalary,
      isSaved: savedConsultantSet.has(consultant._id.toString())  // Vérifier avec consultant._id
    }));

    res.json(result);
  } catch (error) {
    console.error("Erreur dans getConsultantClient :", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getConsultantClient,
};
