const jwt = require("jsonwebtoken");
const User = require("../models/User"); 
const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id }; // Only id is set from token
    console.log("User authenticated:", req.user.id);
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

const isAdmin = (req, res, next) => {
  // Fetch role from DB if needed (optional)
  User.findById(req.user.id).select("role").then(user => {
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }
    next();
  }).catch(() => res.status(500).json({ message: "Server error" }));
};

const isClient = (req, res, next) => {
  // Fetch role from DB if needed (optional)
  User.findById(req.user.id).select("role").then(user => {
    if (!user || user.role !== "client") {
      return res.status(403).json({ message: "Access denied: Clients only" });
    }
    next();
  }).catch(() => res.status(500).json({ message: "Server error" }));
};

const isSuper = (req, res, next) => {
  // Fetch role from DB if needed (optional)
  User.findById(req.user.id).select("role").then(user => {
    if (!user || user.role !== "superadmin") {
      return res.status(403).json({ message: "Access denied: Superadmins only" });
    }
    next();
  }).catch(() => res.status(500).json({ message: "Server error" }));
};

module.exports = { authenticate, isAdmin, isClient, isSuper };