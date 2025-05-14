const Consultant = require("../models/Consultant");
const SavedConsultant = require("../models/SavedConsultant");
const Logs = require("../models/Logs"); // Import Logs model

// Helper function to abbreviate the name
const abbreviateName = (fullName) => {
  if (!fullName || typeof fullName !== "string") return null;
  const trimmed = fullName.trim();
  if (trimmed === "") return null;
  const words = trimmed.split(/\s+/);
  const initials = words.map((word) => word[0].toUpperCase());
  return initials.join("") + ".";
};

const getConsultantClient = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch saved consultants for this user
    const savedConsultants = await SavedConsultant.find({ client: userId }).select('consultant');
    const savedConsultantSet = new Set(savedConsultants.map(sc => sc.consultant.toString()));

    // Fetch consultants with status "Qualifié" and populate Profile
    const consultants = await Consultant.find({ status: "Qualifié" }).populate("Profile");

    // Filter out consultants with name "Not Specified"
    const filteredConsultants = consultants.filter(consultant => {
      const name = consultant.Profile?.Name;
      return name && name !== "Not Specified";
    });

    // Map the data to the desired output format
    const result = filteredConsultants.map(consultant => ({
      _id: consultant._id,  // Use consultant._id
      profileid: consultant.Profile._id,
      Name: consultant.Profile ? abbreviateName(consultant.Profile.Name) : null,
      Age: consultant.Age,
      Poste: consultant.Profile ? consultant.Profile.Poste : [],
      Available: consultant.available,
      Location: consultant.Location,
      AnnéeExperience: consultant.Profile ? consultant.Profile.AnnéeExperience : null,
      Skills: consultant.Profile ? consultant.Profile.Skills : [],
      TjmOrSalary: consultant.TjmOrSalary,
      isSaved: savedConsultantSet.has(consultant._id.toString())  // Check against consultant._id
    }));

    // Log the consultant read action
    await Logs.create({
      actionType: "CONSULTANT_READ",
      user: userId,
      description: `User fetched ${result.length} qualified consultants`,
      metadata: { consultantCount: result.length.toString() },
    });

    res.json(result);
  } catch (error) {
    console.error("Error in getConsultantClient:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getConsultantClient,
};