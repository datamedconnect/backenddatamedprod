const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => { // Make async for DB fetch
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Aucun token fourni" }); // French message
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('email role'); // Fetch email/role
    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }
    req.user = { id: user._id, email: user.email, role: user.role };

    // Set Sentry user context
    Sentry.setUser({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role, // Custom prop
    });
    Sentry.addBreadcrumb({
      message: `Utilisateur authentifié: ${req.user.email}`,
      level: 'info',
    });

    console.log("Utilisateur authentifié:", req.user.id);
    next();
  } catch (error) {
    console.error("Échec de vérification du token:", error);
    // Capture to Sentry with French tag
    Sentry.captureException(error, { tags: { type_erreur: 'Authentification' } });
    res.status(401).json({ message: "Token invalide" });
  }
};

const isAdmin = (req, res, next) => {
  // Fetch role from DB if needed (optional)
  User.findById(req.user.id)
    .select("role")
    .then((user) => {
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Admins only" });
      }
      next();
    })
    .catch(() => res.status(500).json({ message: "Server error" }));
};

const isClient = (req, res, next) => {
  // Fetch role from DB if needed (optional)
  User.findById(req.user.id)
    .select("role")
    .then((user) => {
      if (!user || user.role !== "client") {
        return res.status(403).json({ message: "Access denied: Clients only" });
      }
      next();
    })
    .catch(() => res.status(500).json({ message: "Server error" }));
};

const isSuper = (req, res, next) => {
  // Fetch role from DB if needed (optional)
  User.findById(req.user.id)
    .select("role")
    .then((user) => {
      if (!user || user.role !== "superadmin") {
        return res
          .status(403)
          .json({ message: "Access denied: Superadmins only" });
      }
      next();
    })
    .catch(() => res.status(500).json({ message: "Server error" }));
};

module.exports = { authenticate, isAdmin, isClient, isSuper };
