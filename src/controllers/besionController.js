const Besion = require("../models/Besion");
const Consultant = require("../models/Consultant");
const User = require("../models/User");
const Logs = require("../models/Logs"); // Import Logs model
const axios = require("axios");
const fuzzball = require("fuzzball");
const { isValidObjectId } = require("mongoose");
const mongoose = require("mongoose");

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

    // Log Besion creation
    await Logs.create({
      actionType: "BESION_CREATION",
      user: createdBy,
      description: `Besion created for client ${nomClient || "N/A"}`,
      relatedEntity: { entityType: "Besion", entityId: newBesion._id },
      metadata: { nomClient, poste, prixAchat: prixAchat.toString() },
    });

    res
      .status(201)
      .json({ message: "Besion created successfully", besion: newBesion });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const createbesionClient = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated" });
    }

    // Fetch user details and verify role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role !== "client") {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }

    // Get companyName from user to set as nomClient
    const companyName = user.companyName;
    console.log("User companyName:", companyName);
    if (!companyName) {
      return res
        .status(400)
        .json({ message: "User does not have a company name" });
    }

    // Extract and validate other fields from request body
    const {
      dateLimite,
      poste,
      experience,
      mission,
      prixAchat,
      status = "Ouvert",
    } = req.body;
    if (!dateLimite || !poste || !experience || !mission || !prixAchat) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create new Besion document
    const newBesion = new Besion({
      createdBy: userId,
      nomClient: companyName,
      dateLimite,
      poste,
      experience,
      mission,
      prixAchat,
      status,
      consultantsScores: [],
    });
    console.log("Before save - newBesion:", newBesion);

    // Save to database
    await newBesion.save();
    console.log("After save - newBesion:", newBesion);

    // Log Besion creation
    await Logs.create({
      actionType: "BESION_CREATION",
      user: userId,
      description: `Besion created for client ${companyName}`,
      relatedEntity: { entityType: "Besion", entityId: newBesion._id },
      metadata: { nomClient: companyName, poste, prixAchat: prixAchat.toString() },
    });

    // Return success response
    res.status(201).json({
      message: "Besion created successfully",
      besion: newBesion,
    });
  } catch (error) {
    console.error("Error creating Besion:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllBesion = async (req, res) => {
  try {
    const besions = await Besion.find().sort({ dateLimite: -1 });
    res.status(200).json(besions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getBesionById = async (req, res) => {
  try {
    const besion = await Besion.findById(req.params.id).populate({
      path: "consultantsScores.consultantId",
      select: "_id Phone MissionType TjmOrSalary Age Location Profile status",
      populate: {
        path: "Profile",
        select: "_id Name Poste Location AnnéeExperience Skills",
      },
    });
    console.log("Besion found:", besion);
    if (!besion) {
      return res.status(404).json({ message: "Besion not found" });
    }
    res.status(200).json(besion);
    console.log("Besion returned");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const createScore = async (req, res) => {
  try {
    console.log("Starting createScore function");

    const besionId = req.params.id;
    if (!isValidObjectId(besionId)) {
      console.log("Invalid Besion ID");
      return res.status(400).json({ message: "Invalid Besion ID" });
    }
    console.log("Besion ID:", besionId);
    const BesionClient = await Besion.findById(besionId);
    if (!BesionClient) {
      console.log("Besion not found");
      return res.status(404).json({ message: "Besion not found" });
    }
    console.log("BesionClient:", BesionClient);

    const consultantId = req.body._id;
    if (!isValidObjectId(consultantId)) {
      console.log("Invalid Consultant ID");
      return res.status(400).json({ message: "Invalid Consultant ID" });
    }
    console.log("Consultant ID:", consultantId);
    const ConsultantProposer = await Consultant.findById(consultantId).populate(
      "Profile"
    );
    if (!ConsultantProposer) {
      console.log("Consultant not found");
      return res.status(404).json({ message: "Consultant not found" });
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
    Think like a recruiter and a Tech Aquisition Manager.
Analyze the compatibility between the following Besion and Consultant based on these criteria:

- Similarity between the Besion's poste and the Consultant's poste (exact or highly similar roles).
- Relevance of the Consultant's skills to the Besion's mission (assess how directly applicable the skills are).
- Relevance of the Consultant's professional experiences to the Besion's mission (evaluate alignment with mission goals).
- Occurrence of keywords from the Besion's mission in the Consultant's profile (skills, professional experiences, formation, and certifications).

Do not consider the years of experience required or the consultant's years of experience.
make sure you see each key words andcalculrate an  accurate   score.

Provide only the compatibility score as a percentage (0-100), where 100% represents a perfect match and 0% represents no alignment.

**Besion:**
- Poste: ${besionDetails.poste}
- Mission: ${besionDetails.mission}

**Consultant:**
- Poste: ${consultantDetails.poste.join(", ")}
- Skills: ${consultantDetails.skills.join(", ")}
- Professional Experience: ${
      consultantDetails.experienceProfessionnelle.length > 0
        ? consultantDetails.experienceProfessionnelle
            .map(
              (exp) =>
                `${exp.TitrePoste || "N/A"} at ${
                  exp.NomEntreprise || "N/A"
                } on ${exp.Context || "N/A"} and ${
                  exp.Réalisation || "N/A"
                } with   ${exp.TechnicalEnv || "N/A"}  (${exp.Date || "N/A"})`
            )
            .join("; ")
        : "N/A"
    }
- Formation: ${consultantDetails.formation.join(", ") || "N/A"}
- Certifications: ${consultantDetails.certification.join(", ") || "N/A"}
`;
    console.log("Prompt for Grok API:", prompt);

    const grokResponse = await callGrokAPI(prompt);
    console.log("Grok API response:", grokResponse);

    const score = grokResponse.score;
    if (typeof score !== "number" || score < 0 || score > 100) {
      console.log("Invalid score received:", score);
      return res
        .status(400)
        .json({ message: "Invalid score received from API" });
    }
    console.log("Extracted score:", score);

    BesionClient.consultantsScores.push({
      consultantId: ConsultantProposer._id,
      score: score,
    });
    await BesionClient.save();
    console.log("Score saved in Besion document");

    // Log score addition
    await Logs.create({
      actionType: "BESION_UPDATE",
      user: req.user.id,
      description: `Score ${score}% added for consultant ${consultantId} in Besion ${besionId}`,
      relatedEntity: { entityType: "Besion", entityId: besionId },
      metadata: { consultantId, score: score.toString() },
    });

    const response = {
      consultantId: ConsultantProposer._id,
      score: score,
    };
    console.log("Response to client:", response);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error in createScore:", error);
    res.status(500).json({ message: "Server error" });
  }
};

async function callGrokAPI(prompt) {
  console.log("Calling Grok API with prompt:", prompt);
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
  console.log("Grok API raw response:", response.data);

  const message = response.data.choices[0].message.content;
  const scoreMatch = message.match(/\d+/);
  const score = scoreMatch ? parseInt(scoreMatch[0]) : 0;
  return { score };
}

const getAllConsultantsBesionById = async (req, res) => {
  try {
    const userId = req.params.id;

    console.log("Requested userId:", userId);
    console.log("Authenticated userId:", req.user.id);

    if (userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only access your own data" });
    }

    const besions = await Besion.find({ createdBy: userId });
    console.log("Fetched Besions:", besions);

    if (!besions || besions.length === 0) {
      return res
        .status(404)
        .json({ message: "No Besions found for this user" });
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
    console.log("Collected consultantIds:", Array.from(consultantIds));

    const consultants = await Consultant.find({
      _id: { $in: Array.from(consultantIds) },
    }).populate("Profile");
    console.log("Fetched consultants:", consultants);

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
    console.error("Error fetching consultants:", error);
    res.status(500).json({ message: "Server error" });
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
    res.status(500).json({ message: "Server error" });
  }
};

const getAllConsultantsBesionByIdClient = async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`Fetching Besion with ID: ${id}`);
    const besion = await Besion.findById(id).exec();
    if (!besion) {
      console.log("Besion not found");
      return res.status(404).json({ message: "Besion not found" });
    }
    console.log(`Besion found: ${besion._id}`);

    console.log("Fetching all consultants with populated profiles");
    const consultants = await Consultant.find().populate("Profile").exec();
    console.log(`Found ${consultants.length} consultants`);

    const compatibilityResults = [];
    const evaluations = consultants.map(async (consultant) => {
      console.log(`Evaluating consultant: ${consultant._id}`);
      const prompt = `
Analyze the compatibility between the following Besion and Consultant based on these criteria:

- Similarity between the Besion's poste and the Consultant's poste (exact or highly similar roles).
- Relevance of the Consultant's skills to the Besion's mission (assess how directly applicable the skills are).
- Relevance of the Consultant's professional experiences to the Besion's mission (evaluate alignment with mission goals).
- Occurrence of keywords from the Besion's mission in the Consultant's profile (skills, professional experiences, formation, and certifications).

take into Consideration the years of experience required and the consultant's years of experience. 

Provide only the compatibility score as a percentage (0-100), where 100% represents a perfect match and 0% represents no alignment.

Besion Details:
- Poste: ${besion.poste}
- Mission: ${besion.mission}

Consultant Details:
- Poste: ${consultant.Profile?.Poste.join(", ") || "N/A"}
- Skills: ${consultant.Profile?.Skills.join(", ") || "N/A"}
-Experience ${consultant.Profile?.AnnéeExperience || "N/A"}
- Professional Experiences: ${
        consultant.Profile?.ExperienceProfessionnelle.map(
          (exp) => `${exp.TitrePoste} at ${exp.NomEntreprise}: ${exp.Context}`
        ).join("; ") || "N/A"
      }
- Formation: ${
        consultant.Profile?.Formation.map(
          (form) => `${form.Diplome} from ${form.Ecole}`
        ).join(", ") || "N/A"
      }
- Certifications: ${
        consultant.Profile?.Certifications.map(
          (cert) => `${cert.Certif} from ${cert.Organisme}`
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
          `Raw response for consultant ${consultant._id}:`,
          response.data
        );
        const scoreText = response.data.choices[0].message.content.trim();

        // Extract numeric percentage from the response (e.g., "90%" -> 90)
        const scoreMatch = scoreText.match(/(\d+)%/);
        const score = scoreMatch ? parseInt(scoreMatch[1], 10) : NaN;

        // Only include scores greater than 0%
        if (!isNaN(score) && score > 0 && score <= 100) {
          compatibilityResults.push({
            consultantId: consultant._id,
            score: score,
          });
          console.log(`Consultant ${consultant._id} score: ${score}`);
        } else {
          console.log(
            `Score ignored (0% or invalid) for consultant ${consultant._id}: ${scoreText}`
          );
        }
      } catch (error) {
        console.error(`Error evaluating consultant ${consultant._id}:`, error);
      }
    });

    await Promise.all(evaluations);
    console.log(
      `Evaluated ${compatibilityResults.length} consultants with scores greater than 0%`
    );

    // Save only consultants with scores > 0% to Besion
    besion.consultantsScores = compatibilityResults;
    await besion.save();
    console.log("Saved compatibility scores to Besion");

    // Log Besion update with scores
    await Logs.create({
      actionType: "BESION_UPDATE",
      user: req.user.id,
      description: `Compatibility scores updated for Besion ${id} with ${compatibilityResults.length} consultants`,
      relatedEntity: { entityType: "Besion", entityId: id },
      metadata: { consultantCount: compatibilityResults.length.toString() },
    });

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

    console.log("Sending response with consultant data");
    res.json(responseData);
  } catch (error) {
    console.error("Error in getAllConsultantsBesionByIdClient:", error);
    res.status(500).json({ message: error.message });
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
};