const professionalService = require('../services/professionalService');

exports.create = async (req, res) => {
  try {
    const profil = await professionalService.create(req.body, req.user.id);
    res.status(201).json({ message: 'Profil professionnel créé.', data: profil });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.monProfil = async (req, res) => {
  try {
    const profil = await professionalService.getUserProfile(req.user.id);
    res.json(profil);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.tous = async (req, res) => {
  try {
    const profils = await professionalService.getAllWithUser();
    res.json(profils);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.approuver = async (req, res) => {
  try {
    const profil = await professionalService.approve(req.params.id);
    res.json({ message: 'Profil professionnel approuvé.', data: profil });
  } catch (err) {
    if (err.message === 'Profil introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.rejeter = async (req, res) => {
  try {
    const profil = await professionalService.reject(req.params.id);
    res.json({ message: 'Profil professionnel rejeté.', data: profil });
  } catch (err) {
    if (err.message === 'Profil introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
