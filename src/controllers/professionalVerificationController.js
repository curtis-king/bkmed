const professionalVerificationService = require('../services/professionalVerificationService');

exports.create = async (req, res) => {
  try {
    const verif = await professionalVerificationService.create(req.body, req.user.id);
    res.status(201).json({ message: 'Vérification créée.', data: verif });
  } catch (err) {
    if (err.message === 'Profil professionnel introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.mesVerifications = async (req, res) => {
  try {
    const profils = await professionalVerificationService.getUserVerifications(req.user.id);
    res.json(profils);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.tous = async (req, res) => {
  try {
    const verifs = await professionalVerificationService.getAllWithProfiles();
    res.json(verifs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.approuver = async (req, res) => {
  try {
    const verif = await professionalVerificationService.approve(req.params.id);
    res.json({ message: 'Vérification approuvée.', data: verif });
  } catch (err) {
    if (err.message === 'Vérification introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.rejeter = async (req, res) => {
  try {
    const { rejection_reason } = req.body;
    const verif = await professionalVerificationService.reject(req.params.id, rejection_reason);
    res.json({ message: 'Vérification rejetée.', data: verif });
  } catch (err) {
    if (err.message === 'Vérification introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
