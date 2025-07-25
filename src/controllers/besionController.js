const Besion = require("../models/Besion");
const Consultant = require("../models/Consultant");
const User = require("../models/User");
const axios = require("axios");
const fuzzball = require("fuzzball");
const { isValidObjectId } = require("mongoose");
const mongoose = require("mongoose");
const pdfParse = require("pdf-parse");

const createbesion = async (req, res) => {
  try {
    const {
      createdBy,
      nomClient,
      dateLimite,
      poste,
      experience,
      mission,
      prixAchat,
      consultantsScores = [], // Default to empty array if not provided
    } = req.body;

    // Basic validation for required fields
    if (
      !createdBy ||
      !nomClient ||
      !dateLimite ||
      !poste ||
      !experience ||
      !mission ||
      !prixAchat
    ) {
      console.log("Champs requis manquants");
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    // Validate that experience and prixAchat are numbers
    if (isNaN(Number(experience)) || isNaN(Number(prixAchat))) {
      console.log("Expérience ou prix d'achat invalide");
      return res.status(400).json({
        message: "L'expérience et le prix d'achat doivent être des nombres",
      });
    }

    console.log("Création d'un nouveau Besoin");
    const newBesion = new Besion({
      createdBy,
      nomClient,
      dateLimite,
      poste,
      experience: Number(experience),
      mission,
      prixAchat: Number(prixAchat),
      consultantsScores,
    });

    console.log("Enregistrement du Besoin dans la base de données");
    await newBesion.save();
    console.log("Besoin enregistré avec succès");

    // Trigger matching process asynchronously without awaiting
    console.log(
      "Lancement du processus de matching pour le besoin:",
      newBesion._id,
    );
    triggerMatching({ params: { id: newBesion._id } }, { json: () => {} }); // Mock res object since we don’t need a response here

    console.log("Retour de la réponse de succès");
    res
      .status(201)
      .json({ message: "Besoin créé avec succès", besion: newBesion });
  } catch (error) {
    if (error.name === "ValidationError") {
      console.log("Erreur de validation:", error.message);
      return res.status(400).json({ message: error.message });
    }
    console.error("Erreur lors de la création du Besoin:", error.message);
    res
      .status(500)
      .json({ message: "Erreur du serveur", details: error.message });
  }
};

const createbesionClient = async (req, res) => {
  try {
    console.log("Requête reçue pour créer un Besoin");
    const userId = req.user.id;
    console.log("ID de l'utilisateur:", userId);
    if (!userId) {
      console.log("Non autorisé : Utilisateur non authentifié");
      return res
        .status(401)
        .json({ message: "Non autorisé : Utilisateur non authentifié" });
    }

    console.log("Récupération de l'utilisateur dans la base de données");
    const user = await User.findById(userId);
    if (!user) {
      console.log("Utilisateur non trouvé");
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    console.log("Utilisateur trouvé:", user);
    if (user.role !== "client") {
      console.log("Interdit : Permissions insuffisantes");
      return res
        .status(403)
        .json({ message: "Interdit : Permissions insuffisantes" });
    }

    const companyName = user.companyName || "Client inconnu";
    console.log("Nom de l'entreprise:", companyName);
    const {
      dateLimite,
      poste,
      experience,
      mission,
      prixAchat,
      status = "Ouvert",
    } = req.body;
    console.log("Données du besoin:", {
      dateLimite,
      poste,
      experience,
      mission,
      prixAchat,
      status,
    });

    if (!dateLimite || !poste || !experience || !mission || !prixAchat) {
      console.log("Champs requis manquants");
      return res.status(400).json({ message: "Champs requis manquants" });
    }
    if (isNaN(Number(experience)) || isNaN(Number(prixAchat))) {
      console.log("Expérience ou prix d'achat invalide");
      return res.status(400).json({
        message: "L'expérience et le prix d'achat doivent être des nombres",
      });
    }

    console.log("Création d'un nouveau Besoin");
    const newBesion = new Besion({
      createdBy: userId,
      nomClient: companyName,
      dateLimite,
      poste,
      experience: Number(experience),
      mission,
      prixAchat: Number(prixAchat),
      status,
      consultantsScores: [],
    });

    console.log("Enregistrement du Besoin dans la base de données");
    await newBesion.save();
    console.log("Besoin enregistré avec succès");

    // Trigger matching process asynchronously without awaiting
    console.log(
      "Lancement du processus de matching pour le besoin:",
      newBesion._id,
    );
    triggerMatching({ params: { id: newBesion._id } }, { json: () => {} }); // Mock res object since we don’t need a response here

    console.log("Retour de la réponse de succès");
    res.status(201).json({
      message: "Besoin créé avec succès",
      besion: newBesion,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la création du Besoin:",
      error.message,
      error.stack,
    );
    res
      .status(500)
      .json({ message: "Erreur interne du serveur", details: error.message });
  }
};

const getAllBesion = async (req, res) => {
  try {
    const besions = await Besion.find().sort({ dateLimite: -1 });
    res.status(200).json(besions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

const getAllBesionSuper = async (req, res) => {
  try {
    const besions = await Besion.find()
      .populate({
        path: "createdBy",
        select: "name companyName",
      })
      .sort({ dateLimite: -1 });
    res.status(200).json(besions);
  } catch (error) {
    console.error("Erreur lors de la récupération des besoins:", error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

const getBesionById = async (req, res) => {
  try {
    const besion = await Besion.findById(req.params.id).populate({
      path: "consultantsScores.consultantId",
      select:
        "_id Email Phone MissionType TjmOrSalary Age Location Profile status",
      populate: {
        path: "Profile",
        select: "_id Name Poste Location AnnéeExperience Skills",
      },
    });
    console.log("Besoin trouvé:", besion);
    if (!besion) {
      return res.status(404).json({ message: "Besoin non trouvé" });
    }
    res.status(200).json(besion);
    console.log("Besoin retourné");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

const createScore = async (req, res) => {
  try {
    console.log("Démarrage de la fonction createScore");

    const besionId = req.params.id;
    if (!isValidObjectId(besionId)) {
      console.log("ID de Besoin invalide");
      return res.status(400).json({ message: "ID de Besoin invalide" });
    }
    console.log("ID de Besoin:", besionId);
    const BesionClient = await Besion.findById(besionId);
    if (!BesionClient) {
      console.log("Besoin non trouvé");
      return res.status(404).json({ message: "Besoin non trouvé" });
    }
    console.log("BesionClient:", BesionClient);

    const consultantId = req.body._id;
    if (!isValidObjectId(consultantId)) {
      console.log("ID de Consultant invalide");
      return res.status(400).json({ message: "ID de Consultant invalide" });
    }
    console.log("ID de Consultant:", consultantId);
    const ConsultantProposer =
      await Consultant.findById(consultantId).populate("Profile");
    if (!ConsultantProposer) {
      console.log("Consultant non trouvé");
      return res.status(404).json({ message: "Consultant non trouvé" });
    }
    console.log("ConsultantProposer:", ConsultantProposer);

    const besionDetails = {
      poste: BesionClient.poste || "N/A",
      mission: BesionClient.mission || "N/A",
    };

    const consultantDetails = {
      poste: ConsultantProposer.Profile?.Poste || [],
      skills: ConsultantProposer.Profile?.Skills || [],
      experienceProfessionnelle:
        ConsultantProposer.Profile?.ExperienceProfessionnelle || [],
      formation: ConsultantProposer.Profile?.Formation || [],
      certification: ConsultantProposer.Profile?.Certifications || [],
    };

    const prompt = `
  Pensez comme un recruteur et un gestionnaire d'acquisition technologique.
  Analysez la compatibilité entre le Besoin et le Consultant suivants en fonction de ces critères :

  - Similarité entre le poste du Besoin et le poste du Consultant (rôles exacts ou très similaires).
  - Pertinence des compétences du Consultant par rapport à la mission du Besoin (évaluez dans quelle mesure les compétences sont directement applicables).
  - Pertinence des expériences professionnelles du Consultant par rapport à la mission du Besoin (évaluez l'alignement avec les objectifs de la mission).
  - Occurrence des mots-clés de la mission du Besoin dans le profil du Consultant (compétences, expériences professionnelles, formation et certifications).

  Ne tenez pas compte des années d'expérience requises ou des années d'expérience du Consultant.
  Assurez-vous d'examiner chaque mot-clé et de calculer un score précis.

  Fournissez uniquement le score de compatibilité en pourcentage (0-100), où 100 % représente une correspondance parfaite et 0 % représente aucun alignement.

  **Besoin :**
  - Poste : ${besionDetails.poste}
  - Mission : ${besionDetails.mission}

  **Consultant :**
  - Poste : ${consultantDetails.poste.join(", ")}
  - Compétences : ${consultantDetails.skills.join(", ")}
  - Expérience professionnelle : ${
    consultantDetails.experienceProfessionnelle.length > 0
      ? consultantDetails.experienceProfessionnelle
          .map(
            (exp) =>
              `${exp.TitrePoste || "N/A"} chez ${
                exp.NomEntreprise || "N/A"
              } sur ${exp.Context || "N/A"} et ${
                exp.Réalisation || "N/A"
              } avec ${exp.TechnicalEnv || "N/A"} (${exp.Date || "N/A"})`,
          )
          .join("; ")
      : "N/A"
  }
  - Formation : ${consultantDetails.formation.join(", ") || "N/A"}
  - Certifications : ${consultantDetails.certification.join(", ") || "N/A"}
  `;
    console.log("Prompt pour l'API Grok :", prompt);

    const grokResponse = await callGrokAPI(prompt);
    console.log("Réponse de l'API Grok :", grokResponse);

    const score = grokResponse.score;
    if (typeof score !== "number" || score < 0 || score > 100) {
      console.log("Score invalide reçu :", score);
      return res.status(400).json({ message: "Score invalide reçu de l'API" });
    }
    console.log("Score extrait :", score);

    BesionClient.consultantsScores.push({
      consultantId: ConsultantProposer._id,
      score: score,
    });
    await BesionClient.save();
    console.log("Score enregistré dans le document Besoin");

    const response = {
      consultantId: ConsultantProposer._id,
      score: score,
    };
    console.log("Réponse au client :", response);
    res.status(200).json(response);
  } catch (error) {
    console.error("Erreur dans createScore :", error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

async function callGrokAPI(prompt) {
  console.log("Appel de l'API Grok avec le prompt :", prompt);
  const apiKey = process.env.GROK_API_KEY;
  const response = await axios.post(
    "https://api.x.ai/v1/chat/completions",
    {
      model: "grok-3-mini",
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROK_API_KEY}`,
      },
    },
  );
  console.log("Réponse brute de l'API Grok :", response.data);

  const message = response.data.choices[0].message.content;
  const scoreMatch = message.match(/\d+/);
  const score = scoreMatch ? parseInt(scoreMatch[0]) : 0;
  return { score };
}

const getAllConsultantsBesionById = async (req, res) => {
  try {
    const userId = req.params.id;

    console.log("ID d'utilisateur requis :", userId);
    console.log("ID d'utilisateur authentifié :", req.user.id);

    if (userId !== req.user.id) {
      return res.status(403).json({
        message: "Interdit : Vous ne pouvez accéder qu'à vos propres données",
      });
    }

    const besions = await Besion.find({ createdBy: userId });
    console.log("Besoins récupérés :", besions);

    if (!besions || besions.length === 0) {
      return res
        .status(404)
        .json({ message: "Aucun Besoin trouvé pour cet utilisateur" });
    }

    const consultantIds = new Set();
    const consultantScoresMap = new Map();

    besions.forEach((besion) => {
      besion.consultantsScores.forEach((scoreEntry) => {
        const consultantIdStr = scoreEntry.consultantId.toString();
        consultantIds.add(consultantIdStr);
        consultantScoresMap.set(consultantIdStr, scoreEntry.score);
      });
    });
    console.log("IDs de consultants collectés :", Array.from(consultantIds));

    const consultants = await Consultant.find({
      _id: { $in: Array.from(consultantIds) },
    }).populate("Profile");
    console.log("Consultants récupérés :", consultants);

    const consultantList = consultants
      .map((consultant) => {
        const consultantIdStr = consultant._id.toString();
        return {
          _id: consultant.Profile?._id || consultant._id,
          id: consultant._id,
          Name: consultant.Profile?.Name || "N/A",
          Experience: consultant.Profile?.AnnéeExperience ?? "N/A",
          Poste: consultant.Profile?.Poste || [],
          Email: consultant.Email || "N/A",
          TjmOrSalary: consultant.TjmOrSalary || "N/A",
          Phone: consultant.Phone || "N/A",
          Score: consultantScoresMap.get(consultantIdStr) || "-",
          createdAt: consultant.createdAt,
          status: consultant.status || "N/A",
        };
      })
      .sort((a, b) => {
        const scoreA = a.Score === "-" ? -Infinity : a.Score;
        const scoreB = b.Score === "-" ? -Infinity : b.Score;
        return scoreB - scoreA;
      });

    res.status(200).json({
      consultants: consultantList,
      total: consultantList.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des consultants :", error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

function normalizeText(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "");
}

function isStopWord(word) {
  const stopWords = new Set([
    "et",
    "de",
    "la",
    "le",
    "a",
    "en",
    "des",
    "au",
    "les",
  ]);
  return stopWords.has(word);
}

const getAllBesionById = async (req, res) => {
  try {
    const userId = req.params.id;
    const besions = await Besion.find({ createdBy: userId }).sort({
      dateLimite: -1,
    });
    res.status(200).json(besions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

const getAllConsultantsBesionByIdClient = async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`Récupération du Besoin avec l'ID : ${id}`);
    const besion = await Besion.findById(id).exec();
    if (!besion) {
      console.log("Besoin non trouvé");
      return res.status(404).json({ message: "Besoin non trouvé" });
    }
    console.log(`Besoin trouvé : ${besion._id}`);

    console.log("Récupération de tous les consultants avec profils peuplés");
    const consultants = await Consultant.find().populate("Profile").exec();
    console.log(`Trouvé ${consultants.length} consultants`);

    const compatibilityResults = [];
    const evaluations = consultants.map(async (consultant) => {
      console.log(`Évaluation du consultant : ${consultant._id}`);
      const prompt = `
  Analysez la compatibilité entre le Besoin et le Consultant suivants en fonction de ces critères :

  - Similarité entre le poste du Besoin et le poste du Consultant (rôles exacts ou très similaires).
  - Pertinence des compétences du Consultant par rapport à la mission du Besoin (évaluez dans quelle mesure les compétences sont directement applicables).
  - Pertinence des expériences professionnelles du Consultant par rapport à la mission du Besoin (évaluez l'alignement avec les objectifs de la mission).
  - Occurrence des mots-clés de la mission du Besoin dans le profil du Consultant (compétences, expériences professionnelles, formation et certifications).

  Tenez compte des années d'expérience requises et des années d'expérience du Consultant.

  Fournissez uniquement le score de compatibilité en pourcentage (0-100), où 100 % représente une correspondance parfaite et 0 % représente aucun alignement.

  Détails du Besoin :
  - Poste : ${besion.poste}
  - Mission : ${besion.mission}

  Détails du Consultant :
  - Poste : ${consultant.Profile?.Poste.join(", ") || "N/A"}
  - Compétences : ${consultant.Profile?.Skills.join(", ") || "N/A"}
  - Expérience : ${consultant.Profile?.AnnéeExperience || "N/A"}
  - Expériences professionnelles : ${
    consultant.Profile?.ExperienceProfessionnelle.map(
      (exp) => `${exp.TitrePoste} chez ${exp.NomEntreprise} : ${exp.Context}`,
    ).join("; ") || "N/A"
  }
  - Formation : ${
    consultant.Profile?.Formation.map(
      (form) => `${form.Diplome} de ${form.Ecole}`,
    ).join(", ") || "N/A"
  }
  - Certifications : ${
    consultant.Profile?.Certifications.map(
      (cert) => `${cert.Certif} de ${cert.Organisme}`,
    ).join(", ") || "N/A"
  }
  `;

      try {
        const response = await axios.post(
          "https://api.x.ai/v1/chat/completions",
          {
            model: "grok-2-vision-1212",
            messages: [{ role: "user", content: prompt }],
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.GROK_API_KEY}`,
            },
          },
        );

        console.log(
          `Réponse brute pour le consultant ${consultant._id} :`,
          response.data,
        );
        const scoreText = response.data.choices[0].message.content.trim();

        const scoreMatch = scoreText.match(/(\d+)%/);
        const score = scoreMatch ? parseInt(scoreMatch[1], 10) : NaN;

        if (!isNaN(score) && score > 0 && score <= 100) {
          compatibilityResults.push({
            consultantId: consultant._id,
            score: score,
          });
          console.log(`Score du consultant ${consultant._id} : ${score}`);
        } else {
          console.log(
            `Score ignoré (0 % ou invalide) pour le consultant ${consultant._id} : ${scoreText}`,
          );
        }
      } catch (error) {
        console.error(
          `Erreur lors de l'évaluation du consultant ${consultant._id} :`,
          error,
        );
      }
    });

    await Promise.all(evaluations);
    console.log(
      `Évalué ${compatibilityResults.length} consultants avec des scores supérieurs à 0 %`,
    );

    besion.consultantsScores = compatibilityResults;
    await besion.save();
    console.log("Scores de compatibilité enregistrés dans le Besoin");

    const responseData = compatibilityResults.map((result) => {
      const consultant = consultants.find((c) =>
        c._id.equals(result.consultantId),
      );
      return {
        _id: consultant.Profile?._id || consultant._id,
        id: consultant._id,
        Name: consultant.Profile?.Name || "N/A",
        Experience: consultant.Profile?.AnnéeExperience ?? "N/A",
        Poste: consultant.Profile?.Poste || [],
        Email: consultant.Email || "N/A",
        TjmOrSalary: consultant.TjmOrSalary || "N/A",
        Phone: consultant.Phone || "N/A",
        Score: result.score,
        createdAt: consultant.createdAt,
        status: consultant.status || "N/A",
      };
    });

    console.log("Envoi de la réponse avec les données des consultants");
    res.json(responseData);
  } catch (error) {
    console.error("Erreur dans getAllConsultantsBesionByIdClient :", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteBesion = async (req, res) => {
  try {
    const besionId = req.params.id;
    console.log("Tentative de suppression du Besoin avec l'ID :", besionId);

    if (!isValidObjectId(besionId)) {
      console.log("ID de Besoin invalide");
      return res.status(400).json({ message: "ID de Besoin invalide" });
    }

    const besion = await Besion.findById(besionId);
    if (!besion) {
      console.log("Besoin non trouvé");
      return res.status(404).json({ message: "Besoin non trouvé" });
    }
    console.log("Besoin trouvé :", besion);

    await Besion.deleteOne({ _id: besionId });
    console.log("Besoin supprimé avec succès");

    res.status(200).json({ message: "Besoin supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du Besoin :", error.message);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

const extractPdfData = async (req, res) => {
  try {
    console.log("User uploaded a PDF document for extraction");
    if (!req.file) {
      console.log("No PDF file uploaded");
      return res.status(400).json({ message: "No PDF file uploaded" });
    }

    const pdfBuffer = req.file.buffer;
    const data = await pdfParse(pdfBuffer);
    const text = data.text;
    console.log("Extracted PDF text:", text);

    if (!text.trim()) {
      console.log("No text extracted from PDF");
      return res.status(400).json({ message: "No text extracted from PDF" });
    }

    const prompt = `
  Here is the text extracted from a PDF document. Extract the following fields and return them as a JSON object with the exact keys specified:
  - poste (job position, string)
  - experience (years of experience, number)
  - mission (mission description, string)
  - prixAchat (purchase price, number)
  - dateLimite (deadline date, string in YYYY-MM-DD format)

  If a field is not found, return an empty string or 0 for numbers. Ensure the response is a valid JSON object.

  Example response:
  {
    "poste": "Developer",
    "experience": 5,
    "mission": "Develop web applications",
    "prixAchat": 50000,
    "dateLimite": "2025-12-31"
  }

  Text:
  ${text}
  `;

    const apiKey = process.env.GROK_API_KEY;
    const response = await axios.post(
      "https://api.x.ai/v1/chat/completions",
      {
        model: "grok-3-mini",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    console.log(
      "Raw GrokAPI response:",
      JSON.stringify(response.data, null, 2),
    );
    const messageContent = response.data.choices[0].message.content;
    console.log("GrokAPI message content:", messageContent);

    let extractedData;
    try {
      const cleanedContent = messageContent
        .replace(/^```json\n/, "")
        .replace(/\n```$/, "");
      console.log("Cleaned GrokAPI content:", cleanedContent);

      extractedData = JSON.parse(cleanedContent);
    } catch (jsonError) {
      console.error("Failed to parse response as JSON:", jsonError.message);
      extractedData = {};
      const lines = messageContent.split("\n");
      lines.forEach((line) => {
        const match = line.match(
          /^(poste|experience|mission|prixAchat|dateLimite):\s*(.+)$/i,
        );
        if (match) {
          extractedData[match[1]] = match[2].trim();
        }
      });
    }

    const formattedData = {
      poste: extractedData.poste || "",
      experience: Number(extractedData.experience) || 0,
      mission: extractedData.mission || "",
      prixAchat: Number(extractedData.prixAchat) || 0,
      dateLimite: extractedData.dateLimite || "",
    };

    console.log("Formatted extracted data:", formattedData);
    res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error extracting PDF data:", error.message);
    res
      .status(500)
      .json({ message: "Error extracting PDF data", error: error.message });
  }
};

const triggerMatching = async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`Récupération du Besoin avec l'ID : ${id}`);
    let besion = await Besion.findById(id).exec();
    if (!besion) {
      console.log("Besoin non trouvé");
      return res.status(404).json({ message: "Besoin non trouvé" });
    }
    console.log(`Besoin trouvé : ${besion._id}`);

    console.log("Récupération de tous les consultants avec profils peuplés");
    const consultants = await Consultant.find().populate("Profile").exec();
    console.log(`Trouvé ${consultants.length} consultants`);

    const compatibilityResults = [];
    const evaluations = consultants.map(async (consultant) => {
      console.log(`Évaluation du consultant : ${consultant._id}`);
      const besionDetails = {
        poste: besion.poste || "N/A",
        mission: besion.mission || "N/A",
      };
      const consultantDetails = {
        poste: consultant.Profile?.Poste || [],
        skills: consultant.Profile?.Skills || [],
        experienceProfessionnelle:
          consultant.Profile?.ExperienceProfessionnelle || [],
        formation: consultant.Profile?.Formation || [],
        certification: consultant.Profile?.Certifications || [],
      };

      const prompt = `
  Pensez comme un recruteur et un gestionnaire d'acquisition technologique.
  Analysez la compatibilité entre le Besoin et le Consultant suivants en fonction de ces critères :

  - Similarité entre le poste du Besoin et le poste du Consultant (rôles exacts ou très similaires).
  - Pertinence des compétences du Consultant par rapport à la mission du Besoin (évaluez dans quelle mesure les compétences sont directement applicables).
  - Pertinence des expériences professionnelles du Consultant par rapport à la mission du Besoin (évaluez l'alignement avec les objectifs de la mission).
  - Occurrence des mots-clés de la mission du Besoin dans le profil du Consultant (compétences, expériences professionnelles, formation et certifications).

  Ne tenez pas compte des années d'expérience requises ou des années d'expérience du Consultant.
  Assurez-vous d'examiner chaque mot-clé et de calculer un score précis.

  Fournissez uniquement le score de compatibilité en pourcentage (0-100), où 100 % représente une correspondance parfaite et 0 % représente aucun alignement.

  **Besoin :**
  - Poste : ${besionDetails.poste}
  - Mission : ${besionDetails.mission}

  **Consultant :**
  - Poste : ${consultantDetails.poste.join(", ")}
  - Compétences : ${consultantDetails.skills.join(", ")}
  - Expérience professionnelle : ${
    consultantDetails.experienceProfessionnelle.length > 0
      ? consultantDetails.experienceProfessionnelle
          .map(
            (exp) =>
              `${exp.TitrePoste || "N/A"} chez ${
                exp.NomEntreprise || "N/A"
              } sur ${exp.Context || "N/A"} et ${
                exp.Réalisation || "N/A"
              } avec ${exp.TechnicalEnv || "N/A"} (${exp.Date || "N/A"})`,
          )
          .join("; ")
      : "N/A"
  }
  - Formation : ${consultantDetails.formation.join(", ") || "N/A"}
  - Certifications : ${consultantDetails.certification.join(", ") || "N/A"}
  `;

      try {
        console.log("Prompt pour l'API Grok :", prompt);
        const response = await axios.post(
          "https://api.x.ai/v1/chat/completions",
          {
            model: "grok-2-vision-1212",
            messages: [{ role: "user", content: prompt }],
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.GROK_API_KEY}`,
            },
          },
        );

        console.log(
          `Réponse brute pour le consultant ${consultant._id} :`,
          response.data,
        );
        const scoreText = response.data.choices[0].message.content.trim();

        const scoreMatch = scoreText.match(/(\d+)%/);
        const score = scoreMatch ? parseInt(scoreMatch[1], 10) : NaN;

        if (!isNaN(score) && score >= 0 && score <= 100) {
          compatibilityResults.push({
            consultantId: consultant._id,
            score: score,
          });
          console.log(`Score du consultant ${consultant._id} : ${score}`);
        } else {
          console.log(
            `Score ignoré (invalide) pour le consultant ${consultant._id} : ${scoreText}`,
          );
        }
      } catch (error) {
        console.error(
          `Erreur lors de l'évaluation du consultant ${consultant._id} :`,
          error.message,
        );
      }
    });

    await Promise.all(evaluations);
    console.log(
      `Évalué ${compatibilityResults.length} consultants avec des scores valides`,
    );

    // Re-fetch to avoid version conflicts
    besion = await Besion.findById(id).exec();
    if (!besion) {
      console.log("Besoin non trouvé lors de la sauvegarde");
      return res.status(404).json({ message: "Besoin non trouvé" });
    }

    besion.consultantsScores = compatibilityResults;
    await besion.save();
    console.log("Scores de compatibilité enregistrés dans le Besoin");

    res.json({ message: "Matching completed successfully" });
  } catch (error) {
    console.error("Erreur dans triggerMatching :", error.message);
    res
      .status(500)
      .json({ message: "Erreur du serveur", error: error.message });
  }
};

const getBesionWithMatchingPost = async (req, res) => {
  try {
    const besion = await Besion.findById(req.params.id).populate({
      path: "consultantsScores.consultantId",
      select:
        "_id Email Phone MissionType TjmOrSalary Age Location Profile status",
      populate: {
        path: "Profile",
        select: "_id Name Poste Location AnnéeExperience Skills",
      },
    });
    if (!besion) {
      return res.status(404).json({ message: "Besoin non trouvé" });
    }
    res.status(200).json(besion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

const fetchBesionMatching = async (req, res) => {
  try {
    const besion = await Besion.findById(req.params.id).populate({
      path: "consultantsScores.consultantId",
      select:
        "_id Email Phone MissionType TjmOrSalary Age Location Profile status",
      populate: {
        path: "Profile",
        select: "_id Name Poste Location AnnéeExperience Skills",
      },
    });
    if (!besion) {
      return res.status(404).json({ message: "Besoin non trouvé" });
    }
    res.status(200).json(besion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
};

const compareConsultant = async (req, res) => {
  try {
    console.log("Step 1: Received request with body:", req.body);

    const { besoinId, consultantId } = req.body;

    // Validate input IDs
    console.log("Step 2: Validating IDs", { besoinId, consultantId });
    if (
      !mongoose.Types.ObjectId.isValid(besoinId) ||
      !mongoose.Types.ObjectId.isValid(consultantId)
    ) {
      console.log("Step 2.1: Invalid IDs detected");
      return res.status(400).json({ error: "Invalid besoin or consultant ID" });
    }

    // Fetch besoin
    console.log("Step 3: Fetching besoin with ID:", besoinId);
    const besoin = await Besion.findById(besoinId);
    if (!besoin) {
      console.log("Step 3.1: Besoin not found");
      return res.status(404).json({ error: "Besoin not found" });
    }
    console.log("Step 3.2: Besoin fetched successfully:", besoin);

    // Fetch consultant with populated profile
    console.log("Step 4: Fetching consultant with ID:", consultantId);
    const consultant =
      await Consultant.findById(consultantId).populate("Profile");
    if (!consultant || !consultant.Profile) {
      console.log("Step 4.1: Consultant or profile not found");
      return res.status(404).json({ error: "Consultant or profile not found" });
    }
    console.log("Step 4.2: Consultant fetched successfully:", consultant);

    // Prepare data for Grok API
    console.log("Step 5: Preparing data for Grok API");
    const besoinData = {
      poste: besoin.poste || "N/A",
      experience: besoin.experience || 0,
      mission: besoin.mission || "N/A",
      prixAchat: besoin.prixAchat || 0,
    };
    const consultantData = {
      Poste: consultant.Profile.Poste || [],
      AnnéeExperience: consultant.Profile.AnnéeExperience || 0,
      Skills: consultant.Profile.Skills || [],
      Location: consultant.Location || [],
      ExperienceProfessionnelle:
        consultant.Profile.ExperienceProfessionnelle || [],
      Langue: consultant.Profile.Langue || [],
      Formation: consultant.Profile.Formation || [],
      Certifications: consultant.Profile.Certifications || [],
      TjmOrSalary: consultant.TjmOrSalary || "",
    };
    console.log("Step 5.1: Prepared besoinData:", besoinData);
    console.log("Step 5.2: Prepared consultantData:", consultantData);

    // Grok API prompt
    console.log("Step 6: Constructing Grok API prompt");
    const prompt = `Compare the following besoin and consultant profiles and return a compatibility score (0-100) and a commercial argumentative paragraph to propose this consultant profile. in frenshh rediger une paraghraphe courte argumentaire commercial pour proposer le profile commancant par bonjour terminant par cordialement ne mentoinner pas l'année

Besoin:
${JSON.stringify(besoinData, null, 2)}

Consultant:
${JSON.stringify(consultantData, null, 2)}

Return the response in the following JSON format:
{
  "score": number,
  "paragraphe": string
}`;
    console.log("Step 6.1: Grok API prompt constructed:", prompt);

    // Call Grok API
    console.log(
      "Step 7: Calling Grok API with key:",
      process.env.GROK_API_KEY ? "Key present" : "Key missing",
    );
    let grokResponse;
    try {
      grokResponse = await axios.post(
        "https://api.x.ai/v1/chat/completions",
        {
          model: "grok-3-mini",
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROK_API_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );
      console.log(
        "Step 7.1: Grok API response received:",
        JSON.stringify(grokResponse.data, null, 2),
      );
    } catch (apiError) {
      console.error("Step 7.2: Grok API call failed:", {
        message: apiError.message,
        response: apiError.response
          ? JSON.stringify(apiError.response.data, null, 2)
          : "No response data",
      });
      return res
        .status(500)
        .json({ error: "Grok API request failed", details: apiError.message });
    }

    // Parse Grok API response
    console.log("Step 8: Parsing Grok API response");
    let responseData;
    try {
      const messageContent = grokResponse.data.choices[0].message.content;
      console.log("Step 8.1: Raw message content:", messageContent);
      // Remove markdown code block markers if present
      const cleanedContent = messageContent
        .replace(/^```json\n/, "")
        .replace(/\n```$/, "");
      console.log("Step 8.2: Cleaned message content:", cleanedContent);
      responseData = JSON.parse(cleanedContent);
      console.log("Step 8.3: Parsed responseData:", responseData);
    } catch (parseError) {
      console.error(
        "Step 8.4: Failed to parse Grok API response:",
        parseError.message,
      );
      return res.status(500).json({
        error: "Failed to parse Grok API response",
        details: parseError.message,
      });
    }

    const { score, paragraphe } = responseData;
    console.log("Step 8.5: Extracted score:", score, "paragraphe:", paragraphe);

    // Validate response
    console.log("Step 9: Validating Grok API response");
    if (
      typeof score !== "number" ||
      score < 0 ||
      score > 100 ||
      typeof paragraphe !== "string"
    ) {
      console.log("Step 9.1: Invalid Grok API response detected", {
        score,
        paragraphe,
      });
      return res.status(500).json({ error: "Invalid response from Grok API" });
    }
    console.log("Step 9.2: Grok API response validated successfully");

    // Store score in besoins.consultantsScores
    console.log("Step 10: Updating Besion with consultant score");
    const updatedBesion = await Besion.findByIdAndUpdate(
      besoinId,
      {
        $push: {
          consultantsScores: {
            consultantId,
            score,
          },
        },
      },
      { new: true },
    );
    console.log("Step 10.1: Besion updated successfully:", updatedBesion);

    // Return response
    console.log("Step 11: Sending response to client");
    return res.status(200).json({
      score,
      paragraphe,
    });
  } catch (error) {
    console.error("Error in compareConsultant:", {
      message: error.message,
      stack: error.stack,
    });
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

module.exports = {
  createbesion,
  getAllBesion,
  getBesionById,
  createScore,
  getAllConsultantsBesionById,
  getAllBesionById,
  getAllConsultantsBesionByIdClient,
  createbesionClient,
  deleteBesion,
  getAllBesionSuper,
  extractPdfData,
  triggerMatching,
  getBesionWithMatchingPost,
  fetchBesionMatching,
  compareConsultant,
};
