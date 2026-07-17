const recommendationService = require('../services/recommendationService');

exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.attachment_path = `/uploads/documents/${req.file.filename}`;
    }
    const recommendation = await recommendationService.create(data, req.user.id);
    res.status(201).json({ message: 'Recommandation créée.', data: recommendation });
  } catch (err) {
    if (err.message === 'Demande introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.parDemande = async (req, res) => {
  try {
    const recommendations = await recommendationService.getByRequest(req.params.requestId);
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
