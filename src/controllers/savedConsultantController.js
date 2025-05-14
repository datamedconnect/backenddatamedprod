const mongoose = require("mongoose");
const SavedConsultant = require("../models/SavedConsultant");
const Consultant = require("../models/Consultant");
const Logs = require("../models/Logs"); // Import Logs model

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "";
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.map((word) => word[0].toUpperCase()).join("") + ".";
};

const getSavedConsultants = async (req, res) => {
  try {
    const clientId = req.user._id;
    const savedConsultants = await SavedConsultant.find({
      client: clientId,
    }).select("consultant");
    const consultantIds = savedConsultants.map((sc) =>
      sc.consultant.toString()
    );

    // Log the consultant read action
    await Logs.create({
      actionType: "CONSULTANT_READ",
      user: clientId,
      description: `User fetched ${consultantIds.length} saved consultant IDs`,
      metadata: { consultantCount: consultantIds.length.toString() },
    });

    res.status(200).json(consultantIds);
  } catch (error) {
    console.error("Error fetching saved consultants:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const saveConsultant = async (req, res) => {
  try {
    const clientId = req.user.id;
    const consultantId = req.params.id;
    console.log(clientId, consultantId);

    const savedConsultant = new SavedConsultant({
      client: clientId,
      consultant: consultantId,
    });

    await savedConsultant.save();

    // Log the consultant save action
    await Logs.create({
      actionType: "SAVED_CONSULTANT",
      user: clientId,
      description: `Consultant ${consultantId} saved by client`,
      relatedEntity: { entityType: "Consultant", entityId: consultantId },
      metadata: { consultantId },
    });

    res.status(201).json({ message: "Consultant saved successfully" });
  } catch (error) {
    if (error.name === "MongoServerError" && error.code === 11000) {
      res.status(400).json({ message: "Consultant already saved" });
    } else {
      console.error("Error saving consultant:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
};

const unsaveConsultant = async (req, res) => {
  try {
    const clientId = req.user.id;
    const consultantId = req.params.id;

    const result = await SavedConsultant.deleteOne({
      client: clientId,
      consultant: consultantId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Consultant not saved" });
    }

    // Log the consultant unsave action
    await Logs.create({
      actionType: "SAVED_CONSULTANT",
      user: clientId,
      description: `Consultant ${consultantId} unsaved by client`,
      relatedEntity: { entityType: "Consultant", entityId: consultantId },
      metadata: { consultantId, action: "unsave" },
    });

    res.status(200).json({ message: "Consultant unsaved successfully" });
  } catch (error) {
    console.error("Error unsaving consultant:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getSavedProfileConsultant = async (req, res) => {
  try {
    const savedConsultants = await SavedConsultant.find({
      client: req.user.id,
    });
    const consultantIds = savedConsultants.map((sc) => sc.consultant);

    const consultants = await Consultant.find({ _id: { $in: consultantIds } })
      .populate("Profile")
      .lean();

    const result = consultants
      .filter((c) => c && c.Profile)
      .map((consultant) => ({
        _id: consultant._id.toString(),
        Name: getInitials(consultant.Profile.Name || ""),
        Poste: consultant.Profile.Poste || [],
        Location: consultant.Profile.Location || "Unknown",
        AnnéeExperience: consultant.Profile.AnnéeExperience || 0,
        Skills: consultant.Profile.Skills || [],
        TjmOrSalary: consultant.TjmOrSalary || "0",
        Email: consultant.Email || "",
        Phone: consultant.Phone || "",
        MissionType: consultant.MissionType || "",
        available: consultant.available
          ? consultant.available.toISOString()
          : null,
        Age: consultant.Age || 0,
      }));

    if (result.length === 0) {
      // Log the consultant read action (even if no results)
      await Logs.create({
        actionType: "CONSULTANT_READ",
        user: req.user.id,
        description: `User fetched 0 saved consultant profiles`,
        metadata: { consultantCount: "0" },
      });
      return res.status(404).json({ message: "No saved consultants found" });
    }

    // Log the consultant read action
    await Logs.create({
      actionType: "CONSULTANT_READ",
      user: req.user.id,
      description: `User fetched ${result.length} saved consultant profiles`,
      metadata: { consultantCount: result.length.toString() },
    });

    res.json(result);
  } catch (error) {
    console.error("Error in getSavedProfileConsultant:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getSavedConsultants,
  saveConsultant,
  unsaveConsultant,
  getSavedProfileConsultant,
};