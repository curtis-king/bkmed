const jwt = require('jsonwebtoken');
const User = require('../models/User');
const subscriptionService = require('../services/subscriptionService');

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  console.log('--- AUTH MIDDLEWARE ---');
  console.log('URL:', req.method, req.originalUrl);
  console.log('JWT_SECRET présent:', !!process.env.JWT_SECRET);

  if (!header || !header.startsWith('Bearer ')) {
    console.log('Token manquant dans le header');
    return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
  }

  const token = header.split(' ')[1];
  console.log('Token reçu (premiers 30 car.):', token.substring(0, 30) + '...');
  console.log('Longueur token:', token.length);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token vérifié - user id:', decoded.id);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('ERREUR verify:', err.name, '-', err.message);
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
};

const aUnRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user.roles || !roles.some((r) => req.user.roles.includes(r))) {
      return res.status(403).json({ message: `Accès réservé aux: ${roles.join(', ')}` });
    }
    next();
  };
};

const estAdmin = aUnRole('ADMIN');
const estMedecin = aUnRole('MEDECIN');
const estAgent = aUnRole('AGENT_PROXIMITE');
const estLivreur = aUnRole('LIVREUR');
const estPersonnel = aUnRole('ADMIN', 'MEDECIN', 'LIVREUR');

const estActif = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'is_active'],
    });
    if (!user || !user.is_active) {
      return res.status(403).json({
        message: 'Compte inactif. Veuillez fournir vos pièces d\'identité et attendre la validation de l\'administration.',
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

const aAccesComplet = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'is_active'],
    });
    if (!user || !user.is_active) {
      return res.status(403).json({
        message: 'Compte inactif. Veuillez fournir vos pièces d\'identité et attendre la validation de l\'administration.',
      });
    }

    const access = await subscriptionService.checkAccess(req.user.id);
    if (!access.allowed) {
      return res.status(403).json({
        message: 'Accès refusé : ' + access.reason,
        step: access.step || null,
      });
    }

    req.access = access;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

module.exports = { auth, aUnRole, estAdmin, estMedecin, estAgent, estLivreur, estPersonnel, estActif, aAccesComplet };