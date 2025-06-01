const Logs = require("../models/Logs");
const onFinished = require("on-finished");

// Keywords for inferring entity types from paths
const entityKeywords = {
  consultants: "Consultant",
  slots: "Slots",
  besions: "Besion",
  users: "User",
  "saved-consultants": "SavedConsultant",
  profile: "Profile",
  otp: "OTP",
  email: "Email",
  client: "Client",
  super: "Super",
  admin: "Admin",
};

// Function to determine entityType based on path segments
function getEntityType(path) {
  const segments = path.split("/").filter(Boolean);
  for (const segment of segments) {
    if (entityKeywords[segment]) {
      return entityKeywords[segment];
    }
  }
  return "Inconnu"; // Unknown entity as fallback
}

// Mapping of HTTP methods and routes to action types and entities
const actionMappings = {
  // Slot Routes
  "POST:/api/slots/create": {
    actionType: "CRÉATION_CRENEAU",
    entityType: "Slots",
  },
  "GET:/api/slots/allslots": {
    actionType: "LECTURE_CRENEAU",
    entityType: "Slots",
  },
  "GET:/api/slots/slot/:id": {
    actionType: "LECTURE_CRENEAU",
    entityType: "Slots",
  },
  "DELETE:/api/slots/slots/:id": {
    actionType: "SUPPRESSION_CRENEAU",
    entityType: "Slots",
  },
  "PUT:/api/slots/slots/:id/status": {
    actionType: "MISE_A_JOUR_CRENEAU",
    entityType: "Slots",
  },
  "GET:/api/slots/getAllConsultantsSlots/:id": {
    actionType: "LECTURE_CONSULTANT_CRENEAU",
    entityType: "Slots",
  },

  // Consultant Routes
  "POST:/api/consultants": {
    actionType: "CRÉATION_CONSULTANT",
    entityType: "Consultant",
  },
  "GET:/api/consultants/:id": {
    actionType: "LECTURE_CONSULTANT",
    entityType: "Consultant",
  },
  "PUT:/api/consultants/:id": {
    actionType: "MISE_A_JOUR_CONSULTANT",
    entityType: "Consultant",
  },
  "POST:/api/consultants": {
    actionType: "TÉLÉCHARGEMENT_CV",
    entityType: "Consultant",
  },

  // Admin Routes
  "POST:/api/admin/consultants": {
    actionType: "CRÉATION_CONSULTANT",
    entityType: "Consultant",
  },
  "GET:/api/admin/acceuil": {
    actionType: "LECTURE_ADMIN_CONSULTANTS",
    entityType: "Consultant",
  },
  "GET:/api/admin/allconsultants": {
    actionType: "LECTURE_ADMIN_CONSULTANTS",
    entityType: "Consultant",
  },
  "GET:/api/admin/exchangerequest": {
    actionType: "LECTURE_REQUETE_ECHANGE",
    entityType: "Slots",
  },
  "PUT:/api/admin/consultants/:id/status": {
    actionType: "MISE_A_JOUR_STATUT_CONSULTANT",
    entityType: "Consultant",
  },
  "PUT:/api/admin/consultants/:id/details": {
    actionType: "MISE_A_JOUR_DETAILS_CONSULTANT",
    entityType: "Consultant",
  },
  "PUT:/api/admin/slots/:id/details": {
    actionType: "MISE_A_JOUR_CRENEAU",
    entityType: "Slots",
  },
  "PUT:/api/admin/slots/:id/status": {
    actionType: "MISE_A_JOUR_CRENEAU",
    entityType: "Slots",
  },
  "POST:/api/admin/addBesion": {
    actionType: "CRÉATION_BESOIN",
    entityType: "Besion",
  },
  "GET:/api/admin/allBesion": {
    actionType: "LECTURE_BESOIN",
    entityType: "Besion",
  },
  "GET:/api/admin/getBesion/:id": {
    actionType: "LECTURE_BESOIN",
    entityType: "Besion",
  },
  "POST:/api/admin/compare/:id": {
    actionType: "CRÉATION_SCORE",
    entityType: "Besion",
  },
  "GET:/api/admin/getAllConsultantsBesion/:id": {
    actionType: "LECTURE_CONSULTANT_BESOIN",
    entityType: "Consultant",
  },

  // Auth Routes
  "POST:/api/auth/signup": {
    actionType: "CRÉATION_UTILISATEUR",
    entityType: "User",
  },
  "POST:/api/auth/login": { actionType: "CONNEXION", entityType: "User" },

  // Client Routes
  "GET:/api/client/rechercher": {
    actionType: "LECTURE_CONSULTANT",
    entityType: "Consultant",
  },
  "GET:/api/client/savedprofileConsultants": {
    actionType: "LECTURE_CONSULTANT_ENREGISTRÉ",
    entityType: "Consultant",
  },
  "POST:/api/client/consultantsauvegrader/:id": {
    actionType: "CONSULTANT_ENREGISTRÉ",
    entityType: "SavedConsultant",
  },
  "DELETE:/api/client/consultantsauvegrader/:id": {
    actionType: "SUPPRESSION_CONSULTANT_ENREGISTRÉ",
    entityType: "SavedConsultant",
  },
  "GET:/api/client/getallBesionbyId/:id": {
    actionType: "LECTURE_BESOIN",
    entityType: "Besion",
  },
  "GET:/api/client/getBesion/:id": {
    actionType: "LECTURE_BESOIN",
    entityType: "Besion",
  },
  "POST:/api/client/compareclient/:id": {
    actionType: "CRÉATION_SCORE",
    entityType: "Besion",
  },
  "GET:/api/client/getAllMatchedConsultant/:id": {
    actionType: "LECTURE_CONSULTANT_CORRESPONDANT",
    entityType: "Consultant",
  },
  "POST:/api/client/addBesion": {
    actionType: "CRÉATION_BESOIN",
    entityType: "Besion",
  },
  "GET:/api/client/getSlots": {
    actionType: "LECTURE_CRENEAU",
    entityType: "Slots",
  },

  // Email Routes
  "POST:/api/email/contact": {
    actionType: "ENVOI_EMAIL_CONTACT",
    entityType: "Email",
  },
  "POST:/api/email/demo": {
    actionType: "ENVOI_EMAIL_DEMO",
    entityType: "Email",
  },

  // OTP Routes
  "POST:/api/otp/send": { actionType: "ENVOI_OTP", entityType: "OTP" },
  "POST:/api/otp/verify": { actionType: "VERIFICATION_OTP", entityType: "OTP" },

  // Profile Routes
  "GET:/api/profile/:id": {
    actionType: "LECTURE_PROFIL",
    entityType: "Profile",
  },
  "POST:/api/profile": { actionType: "CRÉATION_PROFIL", entityType: "Profile" },
  "PUT:/api/profile/:id": {
    actionType: "MISE_A_JOUR_PROFIL",
    entityType: "Profile",
  },
  "POST:/api/profile/upload-picture/:id": {
    actionType: "TÉLÉCHARGEMENT_PHOTO_PROFIL",
    entityType: "Profile",
  },

  // Super Routes
  "GET:/api/super/getSuper": {
    actionType: "LECTURE_SUPER",
    entityType: "Super",
  },
  "GET:/api/super/users": {
    actionType: "LECTURE_UTILISATEUR",
    entityType: "User",
  },
  "GET:/api/super/demos": { actionType: "LECTURE_DEMO", entityType: "Super" },
  "POST:/api/super/createuseradmin": {
    actionType: "CRÉATION_UTILISATEUR_ADMIN",
    entityType: "User",
  },
  "PUT:/api/super/users/:id": {
    actionType: "MISE_A_JOUR_UTILISATEUR",
    entityType: "User",
  },
  "DELETE:/api/super/users/:id": {
    actionType: "SUPPRESSION_UTILISATEUR",
    entityType: "User",
  },
  "GET:/api/super/exchangerequest": {
    actionType: "LECTURE_REQUETE_ECHANGE",
    entityType: "Slots",
  },
  "GET:/api/super/allconsultants": {
    actionType: "LECTURE_TOUS_CONSULTANTS",
    entityType: "Consultant",
  },
  "GET:/api/super/allBesion": {
    actionType: "LECTURE_TOUS_BESOINS",
    entityType: "Besion",
  },
  "GET:/api/super/numbers": {
    actionType: "LECTURE_CHIFFRES",
    entityType: "Super",
  },
  "DELETE:/api/super/deleteBesion/:id": {
    actionType: "SUPPRESSION_BESOIN",
    entityType: "Besion",
  },
  "PUT:/api/super/slots/:id/details": {
    actionType: "MISE_A_JOUR_CRENEAU",
    entityType: "Slots",
  },
  "PUT:/api/super/consultants/:id/status": {
    actionType: "MISE_A_JOUR_STATUT_CONSULTANT",
    entityType: "Consultant",
  },
  "POST:/api/super/consultants": {
    actionType: "CRÉATION_CONSULTANT",
    entityType: "Consultant",
  },
  "PUT:/api/super/consultants/:id/details": {
    actionType: "MISE_A_JOUR_DETAILS_CONSULTANT",
    entityType: "Consultant",
  },
  "DELETE:/api/super/delete/:id": {
    actionType: "SUPPRESSION_CRENEAU",
    entityType: "Slots",
  },
};

// Default action types for HTTP methods when no specific mapping exists
const defaultActionTypes = {
  POST: "CRÉATION",
  GET: "LECTURE",
  PUT: "MISE_A_JOUR",
  PATCH: "MISE_A_JOUR",
  DELETE: "SUPPRESSION",
};

const loggingMiddleware = (req, res, next) => {
const method = req.method;
  const path = req.path;

  const normalizedPath = path
    .replace(/\/[0-9a-fA-F]{24}/, "/:id")
    .replace(/\/$/, "");
  const key = `${method}:${normalizedPath}`;

  let actionInfo = actionMappings[key];
  if (!actionInfo) {
    const entityType = getEntityType(normalizedPath);
    actionInfo = { actionType: "ACTION_INCONNUE", entityType };
  }

  const { actionType, entityType } = actionInfo;

  // Store original res.json to capture response data
  const originalJson = res.json;
  let responseData = null;
  res.json = function (data) {
    responseData = data;
    return originalJson.apply(res, arguments);
  };

  onFinished(res, async (err) => {
    if (!req.user || !req.user.id) {
      console.log("No user or user ID, not logging");
      return;
    }
    console.log(`Logging action: ${actionType} for user ${req.user.id}`);
    const userId = req.user.id;
    try {
      const metadata = {};
      let description = "";
      let relatedEntity = null;

      if (responseData) {
        if (responseData._id) {
          relatedEntity = { entityType, entityId: responseData._id };
          metadata.entityId = responseData._id.toString();
        }
        if (responseData.exchangeNumber) {
          metadata.exchangeNumber = responseData.exchangeNumber;
        }
        if (responseData.status) {
          metadata.status = responseData.status;
        }
        if (
          Array.isArray(responseData) ||
          responseData.consultants ||
          responseData.slots
        ) {
          const count = Array.isArray(responseData)
            ? responseData.length
            : responseData.consultants?.length ||
              responseData.slots?.length ||
              0;
          metadata.count = count.toString();
        }
        if (responseData.message && res.statusCode >= 400) {
          metadata.error = responseData.message;
        }
      }

      // For deletions, set relatedEntity using req.params.id if available
      if (method === "DELETE" && req.params.id && entityType) {
        relatedEntity = { entityType, entityId: req.params.id };
        metadata.entityId = req.params.id;
      }

      switch (actionType) {
        case "CRÉATION_CRENEAU":
          description = `Créneau ${metadata.exchangeNumber || "nouveau"} créé`;
          break;
        case "LECTURE_CRENEAU":
          description = metadata.count
            ? `L'utilisateur a récupéré ${metadata.count} créneaux`
            : `L'utilisateur a récupéré le créneau ${
                metadata.exchangeNumber || req.params.id || "inconnu"
              }`;
          if (res.statusCode === 404) {
            description = `L'utilisateur a tenté de récupérer le créneau ${req.params.id} mais il n'a pas été trouvé`;
          }
          break;
        case "MISE_A_JOUR_CRENEAU":
          description = `Créneau ${
            metadata.exchangeNumber || req.params.id
          } mis à jour`;
          if (req.body.status) {
            metadata.oldStatus = responseData?.oldStatus || "inconnu";
            metadata.newStatus = req.body.status;
            description = `Statut du créneau ${
              metadata.exchangeNumber || req.params.id
            } mis à jour de ${metadata.oldStatus} à ${metadata.newStatus}`;
          }
          break;
        case "SUPPRESSION_CRENEAU":
          description = `Créneau ${req.params.id} supprimé`;
          break;
        case "CRÉATION_CONSULTANT":
          description = `Consultant créé avec l'email ${
            req.body.email || "inconnu"
          }`;
          metadata.email = req.body.email;
          break;
        case "LECTURE_CONSULTANT":
        case "LECTURE_ADMIN_CONSULTANTS":
        case "LECTURE_TOUS_CONSULTANTS":
          description = metadata.count
            ? `L'utilisateur a récupéré ${metadata.count} consultants`
            : `L'utilisateur a récupéré le consultant ${
                req.params.id || "inconnu"
              }`;
          if (res.statusCode === 404) {
            description = `L'utilisateur a tenté de récupérer le consultant ${req.params.id} mais il n'a pas été trouvé`;
          }
          break;
        case "MISE_A_JOUR_CONSULTANT":
          description = `Consultant ${req.params.id} mis à jour`;
          metadata.updatedFields = Object.keys(req.body).join(", ");
          break;
        case "MISE_A_JOUR_STATUT_CONSULTANT":
          description = `Statut du consultant ${req.params.id} mis à jour à ${
            req.body.status || "inconnu"
          }`;
          metadata.newStatus = req.body.status;
          break;
        case "MISE_A_JOUR_DETAILS_CONSULTANT":
          description = `Détails du consultant ${req.params.id} mis à jour`;
          metadata.updatedFields = Object.keys(req.body).join(", ");
          break;
        case "CRÉATION_BESOIN":
          description = `Besoin créé pour le client ${
            req.body.nomClient || "N/A"
          }`;
          metadata.nomClient = req.body.nomClient;
          break;
        case "LECTURE_BESOIN":
        case "LECTURE_TOUS_BESOINS":
          description = metadata.count
            ? `L'utilisateur a récupéré ${metadata.count} besoins`
            : `L'utilisateur a récupéré le besoin ${
                req.params.id || "inconnu"
              }`;
          if (res.statusCode === 404) {
            description = `L'utilisateur a tenté de récupérer le besoin ${req.params.id} mais il n'a pas été trouvé`;
          }
          break;
        case "SUPPRESSION_BESOIN":
          description = `Besoin ${req.params.id} supprimé`;
          break;
        case "CRÉATION_SCORE":
          description = `Score créé pour l'entité ${req.params.id}`;
          break;
        case "LECTURE_CONSULTANT_BESOIN":
        case "LECTURE_CONSULTANT_CORRESPONDANT":
          description = `Consultants récupérés pour le besoin ${req.params.id}`;
          break;
        case "LECTURE_CONSULTANT_CRENEAU":
          description = `Créneaux récupérés pour le consultant ${req.params.id}`;
          break;
        case "CONSULTANT_ENREGISTRÉ":
          description = `Consultant ${
            req.params.id || req.body.consultantId
          } enregistré par le client`;
          metadata.consultantId = req.params.id || req.body.consultantId;
          break;
        case "SUPPRESSION_CONSULTANT_ENREGISTRÉ":
          description = `Consultant ${req.params.id} supprimé de la liste du client`;
          metadata.consultantId = req.params.id;
          break;
        case "LECTURE_CONSULTANT_ENREGISTRÉ":
          description = `Consultants enregistrés récupérés`;
          break;
        case "CRÉATION_UTILISATEUR":
        case "CRÉATION_UTILISATEUR_ADMIN":
          description = `Utilisateur créé avec l'email ${
            req.body.email || "inconnu"
          }`;
          metadata.email = req.body.email;
          break;
        case "LECTURE_UTILISATEUR":
          description = `Utilisateurs récupérés`;
          break;
        case "MISE_A_JOUR_UTILISATEUR":
          description = `Utilisateur ${req.params.id} mis à jour`;
          break;
        case "SUPPRESSION_UTILISATEUR":
          description = `Utilisateur ${req.params.id} supprimé`;
          break;
        case "CONNEXION":
          description = `Utilisateur avec l'email ${
            req.body.email || "inconnu"
          } s'est connecté`;
          metadata.email = req.body.email;
          break;
        case "TÉLÉCHARGEMENT_CV":
          description = `CV téléchargé pour le consultant avec l'email ${
            req.body.email || "inconnu"
          }`;
          metadata.email = req.body.email;
          metadata.fileName = req.file?.originalname;
          metadata.fileSize = req.file?.size?.toString();
          break;
        case "LECTURE_REQUETE_ECHANGE":
          description = `L'utilisateur a récupéré ${
            metadata.count || "plusieurs"
          } requêtes d'échange`;
          break;
        case "ENVOI_EMAIL_CONTACT":
          description = `Email de contact envoyé`;
          break;
        case "ENVOI_EMAIL_DEMO":
          description = `Email de démonstration envoyé`;
          break;
        case "ENVOI_OTP":
          description = `OTP envoyé`;
          break;
        case "VERIFICATION_OTP":
          description = `OTP vérifié`;
          break;
        case "LECTURE_PROFIL":
          description = `Profil ${req.params.id} récupéré`;
          break;
        case "CRÉATION_PROFIL":
          description = `Profil créé`;
          break;
        case "MISE_A_JOUR_PROFIL":
          description = `Profil ${req.params.id} mis à jour`;
          break;
        case "TÉLÉCHARGEMENT_PHOTO_PROFIL":
          description = `Photo de profil téléchargée pour le profil ${req.params.id}`;
          break;
        case "LECTURE_SUPER":
          description = `Données super récupérées`;
          break;
        case "LECTURE_DEMO":
          description = `Requêtes de démonstration récupérées`;
          break;
        case "LECTURE_CHIFFRES":
          description = `Chiffres récupérés`;
          break;
        default:
          description = `Action ${actionType} effectuée sur ${entityType}`;
          metadata.method = method;
          metadata.path = path;
      }

      if (err || res.statusCode >= 400) {
        description = `[Erreur] ${description}: ${
          metadata.error || err?.message || "Erreur inconnue"
        }`;
        metadata.statusCode = res.statusCode.toString();
      }

      await Logs.create({
        actionType,
        user: userId,
        description,
        relatedEntity,
        metadata,
      });
    } catch (logError) {
      console.error("Erreur lors de la création du journal :", logError);
    }
  });

  next();
};

module.exports = loggingMiddleware;
