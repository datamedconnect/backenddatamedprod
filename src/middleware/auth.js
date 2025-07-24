const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Aucun token fourni' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('email role');
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }
    req.user = { id: user._id, email: user.email, role: user.role };
    console.log('Utilisateur authentifié:', req.user.id);
    next();
  } catch (error) {
    console.error('Échec de vérification du token:', error);
    res.status(401).json({ message: 'Token invalide' });
  }
};

const isAdmin = (req, res, next) => {
  User.findById(req.user.id)
    .select('role')
    .then((user) => {
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Admins only' });
      }
      next();
    })
    .catch(() => res.status(500).json({ message: 'Server error' }));
};

const isClient = (req, res, next) => {
  User.findById(req.user.id)
    .select('role')
    .then((user) => {
      if (!user || user.role !== 'client') {
        return res.status(403).json({ message: 'Access denied: Clients only' });
      }
      next();
    })
    .catch(() => res.status(500).json({ message: 'Server error' }));
};

const isSuper = (req, res, next) => {
  User.findById(req.user.id)
    .select('role')
    .then((user) => {
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Access denied: Superadmins only' });
      }
      next();
    })
    .catch(() => res.status(500).json({ message: 'Server error' }));
};

module.exports = { authenticate, isAdmin, isClient, isSuper };