const jwt = require("jsonwebtoken");


const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    console.log("User authenticated:", req.user.id);
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  next();
};
const isSuper = (req, res, next) => {
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Access denied: superadmin only" });
  }
  next();
};

const isClient = (req, res, next) => {
  if (req.user.role !== "client") {
    return res.status(403).json({ message: "Access denied: Clients only" });
  }
  next();
};

module.exports = { authenticate, isAdmin, isClient,isSuper };
