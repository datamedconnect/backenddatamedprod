const mongoose = require("mongoose");

const logsSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      required: true,
      enum: [
        "CONNEXION", // Connexion de l'utilisateur
        "DÉCONNEXION", // Déconnexion de l'utilisateur
        "CRÉATION_CRENEAU", // Création d'un créneau
        "LECTURE_CRENEAU", // Lecture d'un créneau
        "MISE_A_JOUR_CRENEAU", // Mise à jour du statut ou des détails d'un créneau
        "SUPPRESSION_CRENEAU", // Suppression d'un créneau
        "CRÉATION_CONSULTANT", // Création d'un consultant
        "SUPPRESSION_BESOIN", // Suppression d'un besoin
        "MISE_A_JOUR_CONSULTANT", // Mise à jour du profil ou du statut d'un consultant
        "CRÉATION_BESOIN", // Création d'un besoin
        "MISE_A_JOUR_BESOIN", // Mise à jour du statut ou des détails d'un besoin
        "CONSULTANT_ENREGISTRÉ", // Enregistrement d'un consultant dans la liste d'un client
        "CRÉATION_UTILISATEUR", // Création d'un compte utilisateur
        "MISE_A_JOUR_UTILISATEUR", // Mise à jour du profil utilisateur
        "AJOUT_INTÉGRATION", // Ajout d'une intégration de service (par exemple, Google)
        "LECTURE_CONSULTANT", // Récupération des consultants qualifiés
        "MISE_A_JOUR_STATUT_CONSULTANT", // Mise à jour du statut d'un consultant
        "TÉLÉCHARGEMENT_CV", // Téléchargement d'un CV
        "LECTURE_ADMIN_CONSULTANTS", // Récupération des consultants par un administrateur
        "LECTURE_REQUETE_ECHANGE", // Récupération des requêtes d'échange
        "ACTION_INCONNUE",
        "MISE_A_JOUR_DETAILS_CONSULTANT",
        "SUPPRESSION_CONSULTANT",
        "LECTURE_SUPER", // Corrected: Removed trailing comma
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