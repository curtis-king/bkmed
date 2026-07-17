const sinistreService = require('../services/sinistreService');

exports.create = async (req, res) => {
  try {
    const sinistre = await sinistreService.create(req.body, req.user.id);
    res.status(201).json({ message: 'Sinistre déclaré avec succès.', data: sinistre });
  } catch (err) {
    if (err.message === 'Véhicule introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.mesSinistres = async (req, res) => {
  try {
    const sinistres = await sinistreService.getMySinistres(req.user.id);
    res.json(sinistres);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.detail = async (req, res) => {
  try {
    const sinistre = await sinistreService.getMySinistre(req.params.id, req.user.id);
    res.json(sinistre);
  } catch (err) {
    if (err.message === 'Sinistre introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    const sinistre = await sinistreService.updateStatus(req.params.id, req.body.status, req.user.id, isAdmin);
    res.json({ message: 'Statut mis à jour.', data: sinistre });
  } catch (err) {
    if (err.message === 'Sinistre introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.cancel = async (req, res) => {
  try {
    const sinistre = await sinistreService.cancel(req.params.id, req.user.id);
    res.json({ message: 'Sinistre annulé avec succès.', data: sinistre });
  } catch (err) {
    if (err.message === 'Sinistre introuvable.') return res.status(404).json({ message: err.message });
    if (err.message === 'Seuls les sinistres soumis peuvent être annulés.') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.tous = async (req, res) => {
  try {
    const sinistres = await sinistreService.getAll();
    res.json(sinistres);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
