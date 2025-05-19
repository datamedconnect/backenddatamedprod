const profileService = require("../services/profileService");
const grokService = require("../services/grokService");
const consultantService = require("../services/consultantService");
const pdfParse = require("pdf-parse");
const path = require("path");
const fs = require("fs");

const extractTextFromPDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error("Failed to extract text from PDF: " + error.message);
  }
};

const processPDF = async (req, res) => {
  try {
    const pdfFile = req.file;
    const { consultantId } = req.body;

    if (!pdfFile) {
      return res.status(400).json({ message: "PDF file is required" });
    }
    if (!consultantId) {
      return res.status(400).json({ message: "consultantId is required" });
    }

    if (pdfFile.size > 50 * 1024 * 1024) {
      return res
        .status(400)
        .json({ message: "File too large. Maximum size is 50MB." });
    }

    const pdfText = await extractTextFromPDF(pdfFile.buffer);

    const cvDataString = await grokService.extractCVData(pdfText);
    if (!cvDataString || typeof cvDataString !== "string") {
      throw new Error("Invalid CV data returned from Grok service");
    }
    const cvData = JSON.parse(cvDataString);

    const profileData = {
      ...cvData,
      consultantId,
    };
    const existingProfile = await profileService.getProfileByConsultantId(
      consultantId
    );
    let profile;
    if (existingProfile) {
      profile = await profileService.updateProfile(
        existingProfile._id,
        profileData
      );
    } else {
      profile = await profileService.createProfile(profileData);
    }

    await consultantService.updateConsultant(consultantId, {
      Profile: profile._id,
    });

    res
      .status(200)
      .json({ _id: profile._id, message: "PDF processed successfully" });
  } catch (error) {
    console.error("Error in processPDF:", error.stack);
    res.status(500).json({ message: "Error processing PDF: " + error.message });
  }
};

const getProfile = async (req, res) => {
  try {

    console.log("Received request to get profile with ID:", req.params.id);
    const profile = await profileService.getProfileById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const consultant = await consultantService.getConsultantByProfileId(
      req.params.id
    );
    if (!consultant) {
      return res
        .status(404)
        .json({ message: "Consultant not found for this profile" });
    }

    res.status(200).json({ profile, consultant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const profileId = req.params.id;
    const { profile, consultant } = req.body;

    if (!profile || !consultant) {
      return res
        .status(400)
        .json({ message: "Both profile and consultant data are required" });
    }

    if (profile._id !== profileId) {
      return res
        .status(400)
        .json({ message: "Profile ID in URL does not match the profile data" });
    }

    const updatedProfile = await profileService.updateProfile(
      profileId,
      profile
    );
    const updatedConsultant = await consultantService.updateConsultant(
      consultant._id,
      consultant
    );

    res
      .status(200)
      .json({ profile: updatedProfile, consultant: updatedConsultant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    const profileId = req.params.id;
    console.log("Received upload request for profile ID:", profileId);

    const file = req.file;
    if (!file) {
      console.log("No file uploaded.");
      return res.status(400).json({ message: "No file uploaded" });
    }
    console.log("File received:", file.originalname, "Size:", file.size);

    const fileName = `${profileId}-${Date.now()}.jpg`;
    const filePath = path.join(__dirname, "..", "uploads", fileName);
    console.log("Saving file to:", filePath);

    fs.writeFileSync(filePath, file.buffer);
    console.log("File saved successfully.");

    const profilePictureUrl = `/uploads/${fileName}`;
    console.log("Profile picture URL:", profilePictureUrl);

    const profile = await profileService.updateProfile(profileId, {
      ProfilePicture: profilePictureUrl,
    });
    console.log("Profile updated with new picture URL.");

    res.status(200).json({ profilePictureUrl });
  } catch (error) {
    console.error("Error in uploadProfilePicture:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, processPDF, updateProfile, uploadProfilePicture };