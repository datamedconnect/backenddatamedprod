const consultantService = require("../services/consultantService");
const profileService = require("../services/profileService");
const Consultant = require("../models/Consultant");
const User = require("../models/User");
const ProfileConsultant = require("../models/ProfileConsultant");
const Slots = require("../models/Slots");
const grokService = require("../services/grokService");
const pdfParse = require("pdf-parse");
const path = require("path");
const fs = require("fs");

const extractTextFromPDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error("Échec de l'extraction du texte du PDF : " + error.message);
  }
};

const getConsultantAdmin = async (req, res) => {
  try {
    // Récupérer tous les consultants et peupler le champ Profil
    const consultants = await Consultant.find().populate("Profile");
    const users = await User.countDocuments({ role: "client" });
    const exchanges = await Slots.find();

    // Calculer le nombre de consultants Qualifiés et Non Qualifiés
    const qualifiedCount = consultants.filter(
      (consultant) => consultant.status === "Qualifié"
    ).length;
    const notQualifiedCount = consultants.filter(
      (consultant) => consultant.status === "Non Qualifié"
    ).length;
    const exchangesCount = exchanges.filter(
      (slot) => slot.status === "En Attente"
    ).length;

    // Calculer le total des statuts à partir du tableau des consultants
    const totalStatusCountMap = {};
    consultants.forEach((consultant) => {
      const status = consultant.status;
      totalStatusCountMap[status] = (totalStatusCountMap[status] || 0) + 1;
    });

    // Définir tous les statuts possibles
    const possibleStatuses = ["Qualifié", "Non Qualifié", "En Attente"];

    // Formatter totalStatusCounts pour inclure tous les statuts possibles, avec 0 par défaut
    const formattedTotalStatusCounts = possibleStatuses.map((status) => ({
      status,
      count: totalStatusCountMap[status] || 0,
    }));

    // Préparer la liste des consultants avec les champs requis, y compris _id
    const consultantList = consultants.map((consultant) => {
      const profile = consultant.Profile;
      return {
        _id: consultant._id.toString(), // Convertir ObjectId en chaîne
        Name: profile ? profile.Name : "N/A",
        Experience: profile ? profile.AnnéeExperience : "N/A",
        Email: consultant.Email,
        ProfilId: profile ? profile._id.toString() : null, // Gérer les profils nuls en toute sécurité
        Phone: consultant.Phone,
        createdAt: consultant.createdAt,
        status: consultant.status,
      };
    });

    // Agréger les comptes de création de consultants par jour
    const dailyCounts = await Consultant.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 }, // Trier par date en ordre croissant
      },
    ]);

    // Formatter le résultat de l'agrégation pour le frontend
    const formattedDailyCounts = dailyCounts.map((item) => ({
      date: item._id, // Date au format 'YYYY-MM-DD'
      count: item.count, // Nombre de consultants créés à cette date
    }));

    // Obtenir la plage de dates d'aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Agréger les consultants d'aujourd'hui par statut
    const todayStatusCounts = await Consultant.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Créer une carte des comptes de statut à partir de l'agrégation
    const statusCountMap = {};
    todayStatusCounts.forEach((item) => {
      statusCountMap[item._id] = item.count;
    });

    // Formatter todayStatusCounts pour inclure tous les statuts possibles, avec 0 par défaut
    const formattedTodayStatusCounts = possibleStatuses.map((status) => ({
      status,
      count: statusCountMap[status] || 0,
    }));

    // Envoyer la réponse avec toutes les données nécessaires
    res.status(200).json({
      qualifiedCount,
      notQualifiedCount,
      totalStatusCounts: formattedTotalStatusCounts,
      users,
      exchangesCount,
      consultants: consultantList,
      dailyCounts: formattedDailyCounts,
      todayStatusCounts: formattedTodayStatusCounts,
    });
  } catch (error) {
    console.error("Erreur dans getConsultantAdmin :", error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

// const getAllConsultantsAdmin = async (req, res) => {
//   try {
//     const userId = req.user.id; // ID de l'utilisateur authentifié
//     console.log(userId)
//     // Extraire les paramètres de requête
//     const search = req.query.search || "";
//     const phone = req.query.phone || "";
//     const status = req.query.status || "Tous";
//     const experience = req.query.experience || "Tous";
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 15;
//     const skip = (page - 1) * limit;

//     // Construire les conditions de correspondance pour le filtrage
//     const matchConditions = [];

//     if (search) {
//       matchConditions.push({
//         $or: [
//           { Email: { $regex: search, $options: "i" } },
//           { "profile.Name": { $regex: search, $options: "i" } },
//         ],
//       });
//     }

//     if (phone) {
//       matchConditions.push({ Phone: { $regex: phone, $options: "i" } });
//     }

//     if (status !== "Tous") {
//       if (status === "En Attente") {
//         matchConditions.push({
//           $or: [{ status: "En Attente" }, { status: { $exists: false } }],
//         });
//       } else {
//         matchConditions.push({ status: status });
//       }
//     }

//     if (experience !== "Tous") {
//       let expCondition;
//       if (experience.endsWith("+")) {
//         const minExp = parseInt(experience.slice(0, -1), 10);
//         expCondition = { "profile.AnnéeExperience": { $gte: minExp } };
//       } else {
//         const [minExp, maxExp] = experience.split("-").map(Number);
//         expCondition = {
//           "profile.AnnéeExperience": { $gte: minExp, $lte: maxExp },
//         };
//       }
//       matchConditions.push(expCondition);
//     }

//     // Définir le pipeline d'agrégation
//     const pipeline = [
//       {
//         $lookup: {
//           from: "profileconsultants", // Assurez-vous que cela correspond au nom de votre collection ProfileConsultant
//           localField: "Profile",
//           foreignField: "_id",
//           as: "profile",
//         },
//       },
//       { $unwind: "$profile" }, // Dérouler le tableau profile pour accéder aux champs
//       // Ajouter un filtre pour exclure les profils avec Name: "Non spécifié"
//       { $match: { "profile.Name": { $ne: "Non spécifié" } } },
//     ];

//     // Appliquer des conditions de correspondance supplémentaires si elles existent
//     if (matchConditions.length > 0) {
//       pipeline.push({ $match: { $and: matchConditions } });
//     }

//     pipeline.push({
//       $facet: {
//         metadata: [{ $count: "total" }],
//         data: [{ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit }],
//       },
//     });

//     // Exécuter l'agrégation
//     const result = await Consultant.aggregate(pipeline);

//     const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;
//     const consultants = result[0].data;

//     // Transformer les données pour le frontend
//     const consultantList = consultants.map((consultant) => ({
//       _id: consultant.profile._id.toString(), // ID du profil
//       id: consultant._id.toString(), // ID du consultant
//       Name: consultant.profile.Name,
//       Experience: consultant.profile.AnnéeExperience,
//       Email: consultant.Email,
//       TjmOrSalary: consultant.TjmOrSalary,
//       Phone: consultant.Phone,
//       createdAt: consultant.createdAt,
//       status: consultant.status || "En Attente",
//     }));

//     res.status(200).json({
//       consultants: consultantList,
//       total,
//     });
//   } catch (error) {
//     console.error("Erreur lors de la récupération des consultants :", error);
//     res.status(500).json({ message: "Erreur du serveur" });
//   }
// };

const escapeRegex = (string) =>
  string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

const getAllConsultantsAdmin = async (req, res) => {
  try {
    const search = req.query.search || "";
    const phone = req.query.phone || "";
    const status = req.query.status || "Tous";
    const experience = req.query.experience || "Tous";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    console.log("Step 2: Query parameters:", {
      search,
      phone,
      status,
      experience,
      page,
      limit,
      skip,
    });

    const matchConditions = [];
    if (search) {
      matchConditions.push({
        $or: [
          { Email: { $regex: search, $options: "i" } },
          { "profile.Name": { $regex: search, $options: "i" } },
        ],
      });
    }
    if (phone) {
      const escapedPhone = escapeRegex(phone);
      matchConditions.push({ Phone: { $regex: escapedPhone, $options: "i" } });
    }
    if (status !== "Tous") {
      if (status === "En Attente") {
        matchConditions.push({
          $or: [{ status: "En Attente" }, { status: { $exists: false } }],
        });
      } else {
        matchConditions.push({ status: status });
      }
    }
    if (experience !== "Tous") {
      let expCondition;
      if (experience.endsWith("+")) {
        const minExp = parseInt(experience.slice(0, -1), 10);
        expCondition = { "profile.AnnéeExperience": { $gte: minExp } };
      } else {
        const [minExp, maxExp] = experience.split("-").map(Number);
        expCondition = {
          "profile.AnnéeExperience": { $gte: minExp, $lte: maxExp },
        };
      }
      matchConditions.push(expCondition);
    }

    const pipeline = [
      {
        $lookup: {
          from: "profileconsultants",
          localField: "Profile",
          foreignField: "_id",
          as: "profile",
        },
      },
      { $unwind: "$profile" },
      { $match: { "profile.Name": { $ne: "Non spécifié" } } },
    ];
    if (matchConditions.length > 0) {
      pipeline.push({ $match: { $and: matchConditions } });
    }
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "users",
              localField: "qualifiedBy",
              foreignField: "_id",
              as: "qualifiedByUser",
            },
          },
          {
            $unwind: {
              path: "$qualifiedByUser",
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
      },
    });
    console.log(
      "Step 4: Aggregation pipeline:",
      JSON.stringify(pipeline, null, 2)
    );

    const result = await Consultant.aggregate(pipeline);

    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;
    const consultants = result[0].data;

    const consultantList = consultants.map((consultant) => ({
      _id: consultant.profile._id.toString(),
      id: consultant._id.toString(),
      Name: consultant.profile.Name,
      Experience: consultant.profile.AnnéeExperience,
      Email: consultant.Email,
      TjmOrSalary: consultant.TjmOrSalary,
      Phone: consultant.Phone,
      createdAt: consultant.createdAt,
      status: consultant.status || "En Attente",
      qualifiedByName: consultant.qualifiedByUser?.name || "Non spécifié",
    }));

    res.status(200).json({
      consultants: consultantList,
      total,
    });
  } catch (error) {
    console.error("Error in getAllConsultantsAdmin:", error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};
const createConsultantAdmin = async (req, res) => {
  try {
    // Journaliser le point d'entrée
    console.log("Étape 1 : Entrée dans createConsultantAdmin");

    // Journaliser tous les détails de la requête entrante
    console.log(
      "Étape 2 : En-têtes de la requête :",
      JSON.stringify(req.headers, null, 2)
    );
    console.log(
      "Étape 3 : Corps de la requête (brut) :",
      req.body ? JSON.stringify(req.body, null, 2) : "indéfini"
    );
    console.log(
      "Étape 4 : Fichier de la requête :",
      req.file
        ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
          }
        : "Aucun fichier reçu"
    );

    // Vérifier si Multer a correctement traité le fichier
    if (!req.file) {
      console.log(
        "Étape 5 : Aucun fichier détecté - problème potentiel de configuration Multer"
      );
      return res.status(400).json({ message: "Aucun fichier PDF téléchargé" });
    }

    // Vérifier que le nom du champ correspond à l'attente
    if (req.file.fieldname !== "pdffile") {
      console.log(
        `Étape 6 : Incohérence de nom de champ - Attendu : "pdffile", Reçu : "${req.file.fieldname}"`
      );
      return res.status(400).json({
        message: `Nom de champ inattendu : "${req.file.fieldname}". Attendu "pdffile".`,
      });
    }

    // Journaliser les champs extraits
    console.log("Étape 7 : Extraction des champs du corps de la requête");
    const { email, phone, missionType, tjmOrSalary, location, age } =
      req.body || {};
    console.log("Étape 8 : Champs extraits :", {
      email,
      phone,
      missionType,
      tjmOrSalary,
      location,
      age,
    });

    // Valider les champs requis
    if (!email || !phone) {
      console.log(
        "Étape 9 : Échec de la validation - Email ou téléphone manquant"
      );
      return res
        .status(400)
        .json({ message: "L'email et le téléphone sont requis" });
    }

    // Poursuivre avec la création du profil
    console.log("Étape 10 : Création du profil par défaut");
    const defaultProfileData = {
      Name: "Non spécifié",
      Poste: ["Non spécifié"],
      Location: location || "Non spécifié",
      AnnéeExperience: 0,
      Skills: [],
      ExperienceProfessionnelle: [],
      Langue: [],
      Formation: [],
      Certifications: [],
    };
    const profile = await profileService.createProfile(defaultProfileData);
    console.log("Étape 11 : Profil créé :", profile._id);

    // Créer le consultant
    console.log("Étape 12 : Création du consultant");
    const consultantData = {
      Email: email,
      Phone: phone,
      MissionType: missionType || "Non spécifié",
      Age: age ? parseInt(age, 10) : 0,
      TjmOrSalary: tjmOrSalary || "Non spécifié",
      Location: location || "Non spécifié",
      Profile: profile._id,
    };
    const consultant = await consultantService.createConsultant(consultantData);
    console.log("Étape 13 : Consultant créé :", consultant._id);

    // Gérer le traitement du PDF
    console.log("Étape 14 : Traitement du fichier PDF");
    if (req.file) {
      if (req.file.size > 50 * 1024 * 1024) {
        console.log(
          "Étape 15 : La taille du fichier dépasse la limite de 50 Mo"
        );
        return res.status(400).json({
          message: "Fichier trop volumineux. La taille maximale est de 50 Mo.",
        });
      }

      const pdfText = await extractTextFromPDF(req.file.buffer);
      console.log(
        "Étape 16 : Texte du PDF extrait, longueur :",
        pdfText.length
      );

      const cvDataString = await grokService.extractCVData(pdfText);
      console.log(
        "Étape 17 : Données du CV extraites par Grok :",
        cvDataString
      );

      if (!cvDataString || typeof cvDataString !== "string") {
        console.log("Étape 18 : Données du CV invalides de Grok");
        throw new Error(
          "Données du CV invalides retournées par le service Grok"
        );
      }

      // Nettoyer la chaîne cvDataString pour extraire uniquement l'objet JSON
      const jsonMatch = cvDataString.match(/```json\n([\s\S]*?)\n```/);
      const cleanedCvDataString = jsonMatch
        ? jsonMatch[1].trim()
        : cvDataString
            .replace(/```json\n?/, "")
            .replace(/\n?```/, "")
            .trim();
      console.log(
        "Étape 18.5 : Chaîne de données du CV nettoyée :",
        cleanedCvDataString
      );

      const cvData = JSON.parse(cleanedCvDataString);
      console.log(
        "Étape 19 : Données du CV analysées :",
        JSON.stringify(cvData, null, 2)
      );

      const profileData = { ...cvData, consultantId: consultant._id };
      await profileService.updateProfile(profile._id, profileData);
      console.log("Étape 20 : Profil mis à jour avec les données du CV");

      return res.status(201).json({
        consultant,
        profile,
        message: "Consultant créé et CV traité avec succès",
      });
    }

    // Succès sans PDF
    console.log("Étape 21 : Retour de la réponse sans traitement du PDF");
    return res.status(201).json({
      consultant,
      profile,
      message: "Consultant créé avec succès",
    });
  } catch (error) {
    console.error("Erreur dans createConsultantAdmin :", error.stack);
    return res.status(500).json({
      message: "Erreur lors du traitement de la requête : " + error.message,
    });
  }
};

const uploadCV = async (req, res) => {
  try {
    const { email, phone, missionType, tjmOrSalary, location } = req.body;

    // Valider les champs requis
    if (!email || !phone) {
      return res
        .status(400)
        .json({ message: "L'email et le téléphone sont requis" });
    }

    const defaultProfileData = {
      Name: "Non spécifié",
      Poste: ["Non spécifié"],
      Location: location || "Non spécifié",
      AnnéeExperience: 0,
      Skills: [],
      ExperienceProfessionnelle: [],
      Langue: [],
      Formation: [],
      Certifications: [],
    };
    const profile = await profileService.createProfile(defaultProfileData);

    // Créer un consultant avec des données supplémentaires et une référence au profil
    const consultantData = {
      Email: email,
      Phone: phone,
      MissionType: missionType || "Non spécifié",
      Age: 0,
      TjmOrSalary: tjmOrSalary || "Non spécifié",
      Location: location || "Non spécifié",
      Profile: profile._id,
    };
    const consultant = await consultantService.createConsultant(consultantData);

    res.status(201).json({ consultant, profile });
  } catch (error) {
    console.error("Erreur dans uploadCV :", error);
    res.status(500).json({ message: error.message });
  }
};

const getInitials = (name) => {
  if (!name) return "";
  const parts = name.split(" ");
  const initials = parts.map((part) => part[0].toUpperCase()).join("");
  return initials;
};

const getexchangerequestAdmin = async (req, res) => {
  try {
    // Fetch slots and populate related fields, including confirmedBy in selectedTimeSlot
    const slots = await Slots.find({})
      .populate({
        path: "consultants",
        populate: {
          path: "Profile",
          select: "Name Poste",
        },
      })
      .populate({
        path: "client",
        select: "email role companyName name",
      })
      .populate({
        path: "createdBy",
        select: "name",
      })
      .populate({
        path: "selectedTimeSlot.confirmedBy", // Populate confirmedBy field
        select: "name",
      })
      .lean();


    // Transform the slots to include the creator's name and confirmedBy name
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
      client: slot.client
        ? {
            email: slot.client.email,
            companyName: slot.client.companyName,
            role: slot.client.role,
          }
        : null,
      createdByName: slot.createdBy?.name || "Unknown",
      selectedTimeSlot: slot.selectedTimeSlot
        ? {
            date: slot.selectedTimeSlot.date,
            day: slot.selectedTimeSlot.day,
            startTime: slot.selectedTimeSlot.startTime,
            finishTime: slot.selectedTimeSlot.finishTime,
            confirmedByName:
              slot.selectedTimeSlot.confirmedBy?.name || "Unknown", // Include the name instead of ID
          }
        : null,
      __v: slot.__v,
    }));

    // Send the transformed slots as the response
    res.json(transformedSlots);
  } catch (error) {
    console.error("Erreur dans getexchangerequestAdmin :", error);
    res.status(500).json({ message: error.message });
  }
};

const getConsultant = async (req, res) => {
  try {
    const consultant = await consultantService.getConsultantById(req.params.id);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant non trouvé" });
    }

    res.status(200).json(consultant);
  } catch (error) {
    console.error("Erreur dans getConsultant :", error);
    res.status(500).json({ message: error.message });
  }
};

const updateConsultant = async (req, res) => {
  try {
    const { id } = req.params; // Get consultant ID from URL
    const updateData = req.body; // Get fields to update from request body

    // Log incoming request
    console.log("Step: Received update request:", {
      consultantId: id,
      updateData,
    });

    // Map mobility to Location if present
    if (updateData.mobility) {
      updateData.Location = Array.isArray(updateData.mobility)
        ? updateData.mobility
        : [updateData.mobility];
      delete updateData.mobility;
      console.log("Step: Mapped mobility to Location:", updateData.Location);
    }

    // Fetch document before update for debugging
    const preUpdateDoc = await consultantService.getConsultantById(id);
    console.log("Step: Document before update:", {
      _id: preUpdateDoc._id,
      Location: preUpdateDoc.Location,
    });

    const updatedConsultant = await consultantService.updateConsultant(
      id,
      updateData
    );

    // Log updated document
    console.log("Step: Updated consultant:", {
      _id: updatedConsultant._id,
      Location: updatedConsultant.Location,
      updatedAt: updatedConsultant.updatedAt,
    });

    res.status(200).json(updatedConsultant);
  } catch (error) {
    console.error("Erreur dans updateConsultant:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateConsultantStatus = async (req, res) => {
  try {
    console.log("Étape 1 : Entrée dans updateConsultantStatus");
    const { id } = req.params;
    console.log("Étape 2 : ID du consultant :", id);
    const { status, qualifiedBy } = req.body; // Extract both fields
    console.log(
      "Étape 3 : Nouveau statut :",
      status,
      "qualifiedBy:",
      qualifiedBy
    );

    // Validate both fields
    if (!status || !qualifiedBy) {
      return res
        .status(400)
        .json({ message: "Le statut et qualifiedBy sont requis" });
    }

    // Update both fields in the database
    const updatedConsultant = await Consultant.findByIdAndUpdate(
      id,
      { status, qualifiedBy },
      { new: true, runValidators: true }
    );

    if (!updatedConsultant) {
      return res.status(404).json({ message: "Consultant non trouvé" });
    }

    res.status(200).json(updatedConsultant);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID de consultant invalide" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error(
      "Erreur lors de la mise à jour du statut du consultant :",
      error
    );
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

const updateConsultantDetails = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("ID du consultant :", id);
    const { TjmOrSalary, available, datamedFamily, qualifiedBy } = req.body;
    console.log("Received payload:", {
      TjmOrSalary,
      available,
      datamedFamily,
      qualifiedBy,
    });

    // Check if at least one field is provided
    if (
      !TjmOrSalary &&
      !available &&
      datamedFamily === undefined &&
      !qualifiedBy
    ) {
      return res.status(400).json({
        message:
          "Au moins un champ (TjmOrSalary, disponible, datamedFamily ou qualifiedBy) est requis",
      });
    }

    // Build the update object
    const updateData = {};
    if (TjmOrSalary) updateData.TjmOrSalary = TjmOrSalary;
    if (available) {
      const availableDate = new Date(available);
      if (isNaN(availableDate.getTime())) {
        return res
          .status(400)
          .json({ message: "Format de date invalide pour disponible" });
      }
      updateData.available = availableDate;
    }
    if (datamedFamily !== undefined) updateData.datamedFamily = datamedFamily;
    if (qualifiedBy) updateData.qualifiedBy = qualifiedBy; // Add qualifiedBy if provided

    // Update the consultant in the database
    const updatedConsultant = await Consultant.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Check if the consultant exists
    if (!updatedConsultant) {
      return res.status(404).json({ message: "Consultant non trouvé" });
    }

    console.log("Updated consultant document:", {
      _id: updatedConsultant._id,
      qualifiedBy: updatedConsultant.qualifiedBy,
      TjmOrSalary: updatedConsultant.TjmOrSalary,
      available: updatedConsultant.available,
      datamedFamily: updatedConsultant.datamedFamily,
    });

    // Return the updated consultant
    res.status(200).json(updatedConsultant);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID de consultant invalide" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error(
      "Erreur lors de la mise à jour des détails du consultant :",
      error
    );
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

module.exports = {
  uploadCV,
  getConsultant,
  updateConsultant,
  createConsultantAdmin,
  getConsultantAdmin,
  getAllConsultantsAdmin,
  updateConsultantStatus,
  updateConsultantDetails,
  getexchangerequestAdmin,
};
