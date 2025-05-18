const Logs = require("../models/Logs");
const User = require("../models/User");
const Consultant = require("../models/Consultant");
const Besion = require("../models/Besion");
const Slot = require("../models/Slots");
const Requests = require("../models/Requests");
const mongoose = require("mongoose");

const getAllLogs = async (req, res) => {
  try {
    const { date } = req.query;
    let logs;
    if (date) {
      const [year, month, day] = date.split('-').map(Number); // Convert strings to numbers
      const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
      console.log(`Fetching logs from ${start.toISOString()} to ${end.toISOString()}`);
      logs = await Logs.find({
        createdAt: { $gte: start, $lte: end },
      })
        .populate("user", "email")
        .sort({ createdAt: -1 });
      console.log(`Found ${logs.length} logs for ${date}`);
    } else {
      logs = await Logs.find()
        .populate("user", "email")
        .sort({ createdAt: -1 });
      console.log(`Found ${logs.length} logs (no date filter)`);
    }
    res.json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ message: "Error fetching logs" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select(
      "email role name companyName createdAt status"
    );
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

const createUser = async (req, res) => {
  const { email, password, role, name, companyName, phoneNumber } = req.body;

  if (!email || !password || !role) {
    return res
      .status(400)
      .json({ message: "Email, password, and role are required" });
  }

  try {
    const user = new User({
      email,
      password,
      role,
      name,
      companyName,
      phoneNumber,
    });
    await user.save();

    const userData = {
      _id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      companyName: user.companyName,
      status: user.status,
    };
    res.json(userData);
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ message: "Validation error", errors: messages });
    } else if (error.code === 11000) {
      return res.status(400).json({ message: "Email already in use" });
    } else {
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Error creating user" });
    }
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    const user = await User.findByIdAndUpdate(id, updateData, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      companyName: user.companyName,
      status: user.status,
      createdAt: user.createdAt,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      console.log("Validation error details:", messages);
      return res
        .status(400)
        .json({ message: "Validation error", errors: messages });
    } else if (error.code === 11000) {
      return res.status(400).json({ message: "Email already in use" });
    } else {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Error updating user" });
    }
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
};

const getAllNumbers = async (req, res) => {
  try {
    const clientCount = await User.countDocuments({ role: "client" });
    const adminCount = await User.countDocuments({ role: "admin" });
    const consultantCount = await Consultant.countDocuments();
    const besionCount = await Besion.countDocuments();
    const slotAttenteCount = await Slot.countDocuments({
      status: "En Attente",
    });
    const slotConfirmeCount = await Slot.countDocuments({ status: "Confirmé" });
    const slotReporteCount = await Slot.countDocuments({ status: "Reporté" });

    const totalStatusCounts = await Consultant.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const possibleStatuses = ["Qualifié", "Non Qualifié", "En Attente"];
    const formattedTotalStatusCounts = possibleStatuses.map((status) => ({
      status,
      count: totalStatusCounts.find((item) => item._id === status)?.count || 0,
    }));

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
        $sort: { _id: 1 },
      },
    ]);

    const formattedDailyCounts = dailyCounts.map((item) => ({
      date: item._id,
      count: item.count,
    }));

    res.json({
      clients: clientCount,
      admins: adminCount,
      consultants: consultantCount,
      besions: besionCount,
      slotsAttente: slotAttenteCount,
      slotsConfirme: slotConfirmeCount,
      slotsReporte: slotReporteCount,
      totalStatusCounts: formattedTotalStatusCounts,
      dailyCounts: formattedDailyCounts,
    });
  } catch (error) {
    console.error("Error fetching numbers:", error);
    res.status(500).json({ message: "Error fetching numbers" });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const requests = await Requests.find().sort({ createdAt: -1 });
    return res.status(200).json({
      message: "Requests retrieved successfully",
      data: requests,
    });
  } catch (error) {
    console.error("Error retrieving requests:", error);
    return res.status(500).json({
      message: "Failed to retrieve requests",
      error: error.message,
    });
  }
};

const deleteConsultant = async (req, res) => {
  try {
    const userId = req.user.id; // Authenticated superadmin's ID
    const consultantId = req.params.id; // Consultant ID from route parameters

    // Validate the consultant ID
    if (!mongoose.Types.ObjectId.isValid(consultantId)) {
      return res.status(400).json({ message: "Invalid consultant ID" });
    }

    // Find and delete the consultant
    const consultant = await Consultant.findByIdAndDelete(consultantId);
    if (!consultant) {
      return res.status(404).json({ message: "Consultant not found" });
    }

    // Log the deletion action
    await Logs.create({
      actionType: "SUPPRESSION_CONSULTANT",
      user: userId,
      description: `Consultant with ID ${consultantId} deleted`,
      relatedEntity: { entityType: "Consultant", entityId: consultantId },
      metadata: { consultantId },
    });

    res.json({ message: "Consultant deleted successfully" });
  } catch (error) {
    console.error("Error deleting consultant:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllLogs,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllNumbers,
  getAllRequests,
  deleteConsultant,
};