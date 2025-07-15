const { z } = require("zod");

const LogsSchema = z.object({
  actionType: z.enum([
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
  ]),
  user: z.string(), // ObjectId as string
  description: z.string().optional().default(""),
  relatedEntity: z
    .object({
      entityType: z
        .enum(["Slots", "Consultant", "Besion", "User", "SavedConsultant"])
        .optional(),
      entityId: z.string().optional(), // ObjectId as string
      entityName: z.string().optional(),
    })
    .optional(),
  metadata: z.record(z.string()).optional().default({}),
});

module.exports = LogsSchema;
