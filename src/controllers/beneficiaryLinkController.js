const beneficiaryLinkService = require('../services/beneficiaryLinkService');

exports.create = async (req, res) => {
  try {
    const link = await beneficiaryLinkService.create(req.body, req.user.id);
    res.status(201).json({ message: 'Lien bénéficiaire créé.', data: link });
  } catch (err) {
    if (err.message === 'Bénéficiaire introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.mesBeneficiaires = async (req, res) => {
  try {
    const links = await beneficiaryLinkService.getUserBeneficiaries(req.user.id);
    res.json(links);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.desactiver = async (req, res) => {
  try {
    const link = await beneficiaryLinkService.deactivate(req.params.id, req.user.id);
    res.json({ message: 'Lien désactivé.' });
  } catch (err) {
    if (err.message === 'Lien introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.tous = async (req, res) => {
  try {
    const links = await beneficiaryLinkService.getAllWithUsers();
    res.json(links);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
