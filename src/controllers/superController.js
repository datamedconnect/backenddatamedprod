const Logs = require("../models/Logs"); // Adjust the path to your Logs model
const User = require("../models/User"); // Adjust the path to your User model

const getAllLogs = async (req, res) => {
  try {
    const logs = await Logs.find()
      .populate("user", "email") // Populate the user's email
      .sort({ createdAt: -1 }); // Sort by timestamp, newest first
    res.json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ message: "Error fetching logs" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select(
      "email role name companyName phoneNumber createdAt"
    );
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

const createUser = async (req, res) => {
  const { email, password, role, name, companyName, phoneNumber } = req.body;

  // Basic input validation
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

    // Return user data without password
    const userData = {
      _id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      companyName: user.companyName,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
    };
    res.status(201).json(userData);
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: "Validation error", errors: messages });
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
  const { email, role, name, companyName, phoneNumber } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { email, role, name, companyName, phoneNumber },
      { new: true, runValidators: true } // Return updated document and validate
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      companyName: user.companyName,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: "Validation error", errors: messages });
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

module.exports = { getAllLogs, getAllUsers, createUser, updateUser, deleteUser };