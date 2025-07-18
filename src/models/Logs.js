const mongoose = require("mongoose");
const sanitize = require('mongoose-sanitize');

const logsSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      required: true,
      enum: [
        "CONNEXION",
        "DÉCONNEXION",
        "CRÉATION_CRENEAU",
        "LECTURE_CRENEAU",
        "MISE_A_JOUR_CRENEAU",
        "SUPPRESSION_CRENEAU",
        "CRÉATION_CONSULTANT",
        "SUPPRESSION_BESOIN",
        "MISE_A_JOUR_CONSULTANT",
        "CRÉATION_BESOIN",
        "MISE_A_JOUR_BESOIN",
        "LECTURE_BESOIN",
        "CONSULTANT_ENREGISTRÉ",
        "CRÉATION_UTILISATEUR",
        "MISE_A_JOUR_UTILISATEUR",
        "AJOUT_INTÉGRATION",
        "LECTURE_CONSULTANT",
        "MISE_A_JOUR_STATUT_CONSULTANT",
        "TÉLÉCHARGEMENT_CV",
        "LECTURE_ADMIN_CONSULTANTS",
        "LECTURE_REQUETE_ECHANGE",
        "ACTION_INCONNUE",
        "MISE_A_JOUR_DETAILS_CONSULTANT",
        "SUPPRESSION_CONSULTANT",
        "LECTURE_SUPER",
        "LECTURE_ADMIN",
        "CRÉATION_ADMIN",
        "SUPPRESSION_SLOT",
        "LECTURE_CONSULTANT_ENREGISTRÉ",
        "CRÉATION_CLIENT",
        "LECTURE_TOUS_CONSULTANTS",
        "LECTURE_CONSULTANT_CRENEAU",
        "LECTURE_CONSULTANT_BESOIN",
        "LECTURE_CONSULTANT_CORRESPONDANT",
        "CRÉATION_SCORE",
        "LECTURE_DEMO",
        "LECTURE_UTILISATEUR",
        "LECTURE_CHIFFRES",
        "LECTURE_TOUS_BESOINS",
        "LECTURE_TOUS_CRENEAUX",
        "LECTURE_TOUS_CONSULTANTS_ENREGISTRÉS",
        "LECTURE_TOUS_UTILISATEURS",
        "LECTURE_TOUS_SLOTS",
        "LECTURE_TOUS_CONSULTANTS_CRENEAUX",
        "LECTURE_TOUS_CONSULTANTS_BESOINS",
      ],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      required: false,
      default: "",
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ["Slots", "Consultant", "Besion", "User", "SavedConsultant"],
        required: false,
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
      },
      entityName: {
        type: String,
        required: false, // New field for entity name
      },
    },
    metadata: {
      type: Map,
      of: String,
      required: false,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

logsSchema.plugin(sanitize);

module.exports = mongoose.model("Logs", logsSchema);