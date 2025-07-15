const mongoose = require("mongoose");

const profileConsultantSchema = new mongoose.Schema(
  {
    Name: String,
    Poste: [String],
    Location: String,
    AnnéeExperience: Number,
    Skills: [String],
    ExperienceProfessionnelle: [
      {
        TitrePoste: String,
        NomEntreprise: String,
        Date: String,
        Localisation: String,
        Context: String,
        Réalisation: [String],
        TechnicalEnv: [String],
      },
    ],
    Langue: [
      {
        Intitulé: String,
        Niveau: String,
      },
    ],
    Formation: [
      {
        Diplome: String,
        Ecole: String,
        Année: Number,
      },
    ],
    Certifications: [
      {
        Certif: String,
        Organisme: String,
        AnnéeCertif: Number,
      },
    ],
    ProfilePicture: { type: String, default: null },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("ProfileConsultant", profileConsultantSchema);
