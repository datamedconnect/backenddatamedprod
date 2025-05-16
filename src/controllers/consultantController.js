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
    throw new Error("Failed to extract text from PDF: " + error.message);
  }
};

const getConsultantAdmin = async (req, res) => {
  try {
    // Retrieve all consultants and populate the Profile field
    const consultants = await Consultant.find().populate("Profile");
    const users = await User.countDocuments({ role: "client" });
    const exchanges = await Slots.find();

    // Calculate the number of Qualified and Not Qualified consultants
    const qualifiedCount = consultants.filter(
      (consultant) => consultant.status === "Qualifié"
    ).length;
    const notQualifiedCount = consultants.filter(
      (consultant) => consultant.status === "Non Qualifié"
    ).length;
    const exchangesCount = exchanges.filter(
      (slot) => slot.status === "En Attente"
    ).length;

    // Calculate total status counts from the consultants array
    const totalStatusCountMap = {};
    consultants.forEach((consultant) => {
      const status = consultant.status;
      totalStatusCountMap[status] = (totalStatusCountMap[status] || 0) + 1;
    });

    // Define all possible statuses
    const possibleStatuses = ["Qualifié", "Non Qualifié", "En Attente"];

    // Format totalStatusCounts to include all possible statuses, defaulting to 0
    const formattedTotalStatusCounts = possibleStatuses.map((status) => ({
      status,
      count: totalStatusCountMap[status] || 0,
    }));

    // Prepare the list of consultants with required fields, including _id
    const consultantList = consultants.map((consultant) => {
      const profile = consultant.Profile;
      return {
        _id: consultant._id.toString(), // Convert ObjectId to string
        Name: profile ? profile.Name : "N/A",
        Experience: profile ? profile.AnnéeExperience : "N/A",
        Email: consultant.Email,
        ProfilId: profile ? profile._id.toString() : null, // Safely handle null profile
        Phone: consultant.Phone,
        createdAt: consultant.createdAt,
        status: consultant.status,
      };
    });

    // Aggregate daily consultant creation counts
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
        $sort: { _id: 1 }, // Sort by date in ascending order
      },
    ]);

    // Format the aggregation result for the frontend
    const formattedDailyCounts = dailyCounts.map((item) => ({
      date: item._id, // Date in 'YYYY-MM-DD' format
      count: item.count, // Number of consultants created on that date
    }));

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Aggregate today's consultants by status
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

    // Create a map of status counts from the aggregation
    const statusCountMap = {};
    todayStatusCounts.forEach((item) => {
      statusCountMap[item._id] = item.count;
    });

    // Format todayStatusCounts to include all possible statuses, defaulting to 0
    const formattedTodayStatusCounts = possibleStatuses.map((status) => ({
      status,
      count: statusCountMap[status] || 0,
    }));

    // Send the response with all necessary data
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
    console.error("Error in getConsultantAdmin:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const getAllConsultantsAdmin = async (req, res) => {
  try {
    // Extract query parameters
    const search = req.query.search || "";
    const phone = req.query.phone || "";
    const status = req.query.status || "All";
    const experience = req.query.experience || "All";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    // Build match conditions for filtering
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
      matchConditions.push({ Phone: { $regex: phone, $options: "i" } });
    }

    if (status !== "All") {
      if (status === "En Attente") {
        matchConditions.push({
          $or: [{ status: "En Attente" }, { status: { $exists: false } }],
        });
      } else {
        matchConditions.push({ status: status });
      }
    }

    if (experience !== "All") {
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

    // Define aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: "profileconsultants", // Ensure this matches your ProfileConsultant collection name
          localField: "Profile",
          foreignField: "_id",
          as: "profile",
        },
      },
      { $unwind: "$profile" }, // Unwind the profile array to access fields
      // Add filter to exclude profiles with Name: "Not Specified"
      { $match: { "profile.Name": { $ne: "Not Specified" } } },
    ];

    // Apply additional match conditions if any
    if (matchConditions.length > 0) {
      pipeline.push({ $match: { $and: matchConditions } });
    }

    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit }],
      },
    });

    // Execute aggregation
    const result = await Consultant.aggregate(pipeline);
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;
    const consultants = result[0].data;

    // Transform data for the frontend
    const consultantList = consultants.map((consultant) => ({
      _id: consultant.profile._id.toString(), // Profile ID
      id: consultant._id.toString(), // Consultant ID
      Name: consultant.profile.Name,
      Experience: consultant.profile.AnnéeExperience,
      Email: consultant.Email,
      TjmOrSalary: consultant.TjmOrSalary,
      Phone: consultant.Phone,
      createdAt: consultant.createdAt,
      status: consultant.status || "En Attente",
    }));

    res.status(200).json({
      consultants: consultantList,
      total,
    });
  } catch (error) {
    console.error("Error fetching consultants:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getAllConsultantsAdmin }; // Ensure this is exported as needed

// const createConsultantAdmin = async (req, res) => {
//   try {
//     // Log the entry point
//     console.log("Step 1: Entering createConsultantAdmin");

//     // Log all incoming request details
//     console.log(
//       "Step 2: Request Headers:",
//       JSON.stringify(req.headers, null, 2)
//     );
//     console.log(
//       "Step 3: Request Body (raw):",
//       req.body ? JSON.stringify(req.body, null, 2) : "undefined"
//     );
//     console.log(
//       "Step 4: Request File:",
//       req.file
//         ? {
//             fieldname: req.file.fieldname,
//             originalname: req.file.originalname,
//             size: req.file.size,
//             mimetype: req.file.mimetype,
//           }
//         : "No file received"
//     );

//     // Check if Multer processed the file correctly
//     if (!req.file) {
//       console.log(
//         "Step 5: No file detected - potential Multer configuration issue"
//       );
//       return res.status(400).json({ message: "No PDF file uploaded" });
//     }

//     // Verify the field name matches expectation
//     if (req.file.fieldname !== "pdffile") {
//       console.log(
//         `Step 6: Field name mismatch - Expected: "pdffile", Received: "${req.file.fieldname}"`
//       );
//       return res.status(400).json({
//         message: `Unexpected field name: "${req.file.fieldname}". Expected "pdffile".`,
//       });
//     }

//     // Log extracted fields
//     console.log("Step 7: Extracting request body fields");
//     const { email, phone, missionType, tjmOrSalary, location, age } =
//       req.body || {};
//     console.log("Step 8: Extracted Fields:", {
//       email,
//       phone,
//       missionType,
//       tjmOrSalary,
//       location,
//       age,
//     });

//     // Validate required fields
//     if (!email || !phone) {
//       console.log("Step 9: Validation failed - Missing email or phone");
//       return res.status(400).json({ message: "Email and phone are required" });
//     }

//     // Proceed with profile creation
//     console.log("Step 10: Creating default profile");
//     const defaultProfileData = {
//       Name: "Not Specified",
//       Poste: ["Not Specified"],
//       Location: location || "Not Specified",
//       AnnéeExperience: 0,
//       Skills: [],
//       ExperienceProfessionnelle: [],
//       Langue: [],
//       Formation: [],
//       Certifications: [],
//     };
//     const profile = await profileService.createProfile(defaultProfileData);
//     console.log("Step 11: Profile created:", profile._id);

//     // Create consultant
//     console.log("Step 12: Creating consultant");
//     const consultantData = {
//       Email: email,
//       Phone: phone,
//       MissionType: missionType || "Not Specified",
//       Age: age ? parseInt(age, 10) : 0,
//       TjmOrSalary: tjmOrSalary || "Not Specified",
//       Location: location || "Not Specified",
//       Profile: profile._id,
//     };
//     const consultant = await consultantService.createConsultant(consultantData);
//     console.log("Step 13: Consultant created:", consultant._id);

//     // Handle PDF processing
//     console.log("Step 14: Processing PDF file");
//     if (req.file) {
//       if (req.file.size > 50 * 1024 * 1024) {
//         console.log("Step 15: File size exceeds 50MB limit");
//         return res
//           .status(400)
//           .json({ message: "File too large. Maximum size is 50MB." });
//       }

//       const pdfText = await extractTextFromPDF(req.file.buffer);
//       console.log("Step 16: PDF text extracted, length:", pdfText.length);

//       const cvDataString = await grokService.extractCVData(pdfText);
//       console.log("Step 17: CV data extracted from Grok:", cvDataString);

//       if (!cvDataString || typeof cvDataString !== "string") {
//         console.log("Step 18: Invalid CV data from Grok");
//         throw new Error("Invalid CV data returned from Grok service");
//       }
//       const cvData = JSON.parse(cvDataString);
//       console.log("Step 19: CV data parsed:", JSON.stringify(cvData, null, 2));

//       const profileData = { ...cvData, consultantId: consultant._id };
//       await profileService.updateProfile(profile._id, profileData);
//       console.log("Step 20: Profile updated with CV data");

//       return res.status(201).json({
//         consultant,
//         profile,
//         message: "Consultant created and CV processed successfully",
//       });
//     }

//     // Success without PDF
//     console.log("Step 21: Returning response without PDF processing");
//     return res.status(201).json({
//       consultant,
//       profile,
//       message: "Consultant created successfully",
//     });
//   } catch (error) {
//     console.error("Error in createConsultantAdmin:", error.stack);
//     return res
//       .status(500)
//       .json({ message: "Error processing request: " + error.message });
//   }
// };

const createConsultantAdmin = async (req, res) => {
  try {
    // Log the entry point
    console.log("Step 1: Entering createConsultantAdmin");

    // Log all incoming request details
    console.log(
      "Step 2: Request Headers:",
      JSON.stringify(req.headers, null, 2)
    );
    console.log(
      "Step 3: Request Body (raw):",
      req.body ? JSON.stringify(req.body, null, 2) : "undefined"
    );
    console.log(
      "Step 4: Request File:",
      req.file
        ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
          }
        : "No file received"
    );

    // Check if Multer processed the file correctly
    if (!req.file) {
      console.log(
        "Step 5: No file detected - potential Multer configuration issue"
      );
      return res.status(400).json({ message: "No PDF file uploaded" });
    }

    // Verify the field name matches expectation
    if (req.file.fieldname !== "pdffile") {
      console.log(
        `Step 6: Field name mismatch - Expected: "pdffile", Received: "${req.file.fieldname}"`
      );
      return res.status(400).json({
        message: `Unexpected field name: "${req.file.fieldname}". Expected "pdffile".`,
      });
    }

    // Log extracted fields
    console.log("Step 7: Extracting request body fields");
    const { email, phone, missionType, tjmOrSalary, location, age } =
      req.body || {};
    console.log("Step 8: Extracted Fields:", {
      email,
      phone,
      missionType,
      tjmOrSalary,
      location,
      age,
    });

    // Validate required fields
    if (!email || !phone) {
      console.log("Step 9: Validation failed - Missing email or phone");
      return res.status(400).json({ message: "Email and phone are required" });
    }

    // Proceed with profile creation
    console.log("Step 10: Creating default profile");
    const defaultProfileData = {
      Name: "Not Specified",
      Poste: ["Not Specified"],
      Location: location || "Not Specified",
      AnnéeExperience: 0,
      Skills: [],
      ExperienceProfessionnelle: [],
      Langue: [],
      Formation: [],
      Certifications: [],
    };
    const profile = await profileService.createProfile(defaultProfileData);
    console.log("Step 11: Profile created:", profile._id);

    // Create consultant
    console.log("Step 12: Creating consultant");
    const consultantData = {
      Email: email,
      Phone: phone,
      MissionType: missionType || "Not Specified",
      Age: age ? parseInt(age, 10) : 0,
      TjmOrSalary: tjmOrSalary || "Not Specified",
      Location: location || "Not Specified",
      Profile: profile._id,
    };
    const consultant = await consultantService.createConsultant(consultantData);
    console.log("Step 13: Consultant created:", consultant._id);

    // Handle PDF processing
    console.log("Step 14: Processing PDF file");
    if (req.file) {
      if (req.file.size > 50 * 1024 * 1024) {
        console.log("Step 15: File size exceeds 50MB limit");
        return res
          .status(400)
          .json({ message: "File too large. Maximum size is 50MB." });
      }

      const pdfText = await extractTextFromPDF(req.file.buffer);
      console.log("Step 16: PDF text extracted, length:", pdfText.length);

      const cvDataString = await grokService.extractCVData(pdfText);
      console.log("Step 17: CV data extracted from Grok:", cvDataString);

      if (!cvDataString || typeof cvDataString !== "string") {
        console.log("Step 18: Invalid CV data from Grok");
        throw new Error("Invalid CV data returned from Grok service");
      }

      // Clean the cvDataString to extract only the JSON object
      const jsonMatch = cvDataString.match(/```json\n([\s\S]*?)\n```/);
      const cleanedCvDataString = jsonMatch
        ? jsonMatch[1].trim()
        : cvDataString
            .replace(/```json\n?/, "")
            .replace(/\n?```/, "")
            .trim();
      console.log("Step 18.5: Cleaned CV data string:", cleanedCvDataString);

      const cvData = JSON.parse(cleanedCvDataString);
      console.log("Step 19: CV data parsed:", JSON.stringify(cvData, null, 2));

      const profileData = { ...cvData, consultantId: consultant._id };
      await profileService.updateProfile(profile._id, profileData);
      console.log("Step 20: Profile updated with CV data");

      return res.status(201).json({
        consultant,
        profile,
        message: "Consultant created and CV processed successfully",
      });
    }

    // Success without PDF
    console.log("Step 21: Returning response without PDF processing");
    return res.status(201).json({
      consultant,
      profile,
      message: "Consultant created successfully",
    });
  } catch (error) {
    console.error("Error in createConsultantAdmin:", error.stack);
    return res
      .status(500)
      .json({ message: "Error processing request: " + error.message });
  }
};

const uploadCV = async (req, res) => {
  try {
    const { email, phone, missionType, tjmOrSalary, location } = req.body;

    // Validate required fields
    if (!email || !phone) {
      return res.status(400).json({ message: "Email and phone are required" });
    }

    const defaultProfileData = {
      Name: "Not Specified",
      Poste: ["Not Specified"],
      Location: location || "Not Specified",
      AnnéeExperience: 0,
      Skills: [],
      ExperienceProfessionnelle: [],
      Langue: [],
      Formation: [],
      Certifications: [],
    };
    const profile = await profileService.createProfile(defaultProfileData);

    // Create consultant with additional data and profile reference
    const consultantData = {
      Email: email,
      Phone: phone,
      MissionType: missionType || "Not Specified",
      Age: 0,
      TjmOrSalary: tjmOrSalary || "Not Specified",
      Location: location || "Not Specified",
      Profile: profile._id,
    };
    const consultant = await consultantService.createConsultant(consultantData);

    res.status(201).json({ consultant, profile });
  } catch (error) {
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
      .lean();
    console.log(slots);
    // Transform the slots to the desired output format
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
      selectedTimeSlot: slot.selectedTimeSlot,
      __v: slot.__v,
    }));

    res.json(transformedSlots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getConsultant = async (req, res) => {
  try {
    const consultant = await consultantService.getConsultantById(req.params.id);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }
    res.status(200).json(consultant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const updateConsultant = async (req, res) => {
  try {
    const { id } = req.params; // Get consultant ID from URL
    const updateData = req.body; // Get fields to update from request body
    const updatedConsultant = await consultantService.updateConsultant(
      id,
      updateData
    );
    res.status(200).json(updatedConsultant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const updateConsultantStatus = async (req, res) => {
  try {
    const { id } = req.params; // Extract consultant ID from URL parameters
    const { status } = req.body; // Extract new status from request body

    // Check if status is provided
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Update the consultant's status in the database
    const updatedConsultant = await Consultant.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true } // Return updated document and enforce schema validation
    );

    // Check if consultant exists
    if (!updatedConsultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Send the updated consultant as response
    res.status(200).json(updatedConsultant);
  } catch (error) {
    // Handle specific Mongoose errors
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid consultant ID" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error updating consultant status:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const updateConsultantDetails = async (req, res) => {
  try {
    const { id } = req.params; // Consultant ID from URL
    const { TjmOrSalary, available } = req.body; // New values from request body

    // Ensure at least one field is provided
    if (!TjmOrSalary && !available) {
      return res.status(400).json({
        message: "At least one field (TjmOrSalary or available) is required",
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
          .json({ message: "Invalid date format for available" });
      }
      updateData.available = availableDate;
    }

    // Update the consultant in the database
    const updatedConsultant = await Consultant.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Check if the consultant exists
    if (!updatedConsultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Return the updated consultant
    res.status(200).json(updatedConsultant);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid consultant ID" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error updating consultant details:", error);
    res.status(500).json({ message: "Server error" });
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
