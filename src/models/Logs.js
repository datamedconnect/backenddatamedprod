const mongoose = require("mongoose");

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
  }
);

module.exports = mongoose.model("Logs", logsSchema);