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
      consultantsScores,
    } = req.body;

    const newBesion = new Besion({
      createdBy,
      nomClient,
      dateLimite,
      poste,
      experience,
      mission,
      prixAchat,
      consultantsScores,
    });

    await newBesion.save();

    res
      .status(201)
      .json({ message: "Besoin créé avec succès", besion: newBesion });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: "Erreur du serveur" });
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

    console.log("Retour de la réponse de succès");
    res.status(201).json({
      message: "Besoin créé avec succès",
      besion: newBesion,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la création du Besoin:",
      error.message,
      error.stack
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
    const ConsultantProposer = await Consultant.findById(consultantId).populate(
      "Profile"
    );
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
                } avec ${exp.TechnicalEnv || "N/A"} (${exp.Date || "N/A"})`
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
      model: "grok-2-latest",
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROK_API_KEY}`,
      },
    }
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
          (exp) =>
            `${exp.TitrePoste} chez ${exp.NomEntreprise} : ${exp.Context}`
        ).join("; ") || "N/A"
      }
- Formation : ${
        consultant.Profile?.Formation.map(
          (form) => `${form.Diplome} de ${form.Ecole}`
        ).join(", ") || "N/A"
      }
- Certifications : ${
        consultant.Profile?.Certifications.map(
          (cert) => `${cert.Certif} de ${cert.Organisme}`
        ).join(", ") || "N/A"
      }
`;

      try {
        const response = await axios.post(
          "https://api.x.ai/v1/chat/completions",
          {
            model: "grok-2-latest",
            messages: [{ role: "user", content: prompt }],
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.GROK_API_KEY}`,
            },
          }
        );

        console.log(
          `Réponse brute pour le consultant ${consultant._id} :`,
          response.data
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
            `Score ignoré (0 % ou invalide) pour le consultant ${consultant._id} : ${scoreText}`
          );
        }
      } catch (error) {
        console.error(
          `Erreur lors de l'évaluation du consultant ${consultant._id} :`,
          error
        );
      }
    });

    await Promise.all(evaluations);
    console.log(
      `Évalué ${compatibilityResults.length} consultants avec des scores supérieurs à 0 %`
    );

    besion.consultantsScores = compatibilityResults;
    await besion.save();
    console.log("Scores de compatibilité enregistrés dans le Besoin");

    const responseData = compatibilityResults.map((result) => {
      const consultant = consultants.find((c) =>
        c._id.equals(result.consultantId)
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
        model: "grok-2-latest",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    // Log the full response and message content for debugging
    console.log("Raw GrokAPI response:", JSON.stringify(response.data, null, 2));
    const messageContent = response.data.choices[0].message.content;
    console.log("GrokAPI message content:", messageContent);

    let extractedData;
    try {
      // Remove Markdown code block markers
      const cleanedContent = messageContent
        .replace(/^```json\n/, '') // Remove starting ```json
        .replace(/\n```$/, '');    // Remove ending ```
      console.log("Cleaned GrokAPI content:", cleanedContent);

      // Parse the cleaned content as JSON
      extractedData = JSON.parse(cleanedContent);
    } catch (jsonError) {
      console.error("Failed to parse response as JSON:", jsonError.message);
      // Fallback: Try to extract key-value pairs from text
      extractedData = {};
      const lines = messageContent.split("\n");
      lines.forEach((line) => {
        const match = line.match(/^(poste|experience|mission|prixAchat|dateLimite):\s*(.+)$/i);
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
    res.status(500).json({ message: "Error extracting PDF data", error: error.message });
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
};
