const qrConfirmationService = require('../services/qrConfirmationService');

exports.create = async (req, res) => {
  try {
    const { confirmation, created } = await qrConfirmationService.create(req.body, req.user.id);
    res.status(created ? 201 : 200).json({ message: 'Confirmation enregistrée.', data: confirmation });
  } catch (err) {
    if (err.message === 'Demande introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.confirmerPatient = async (req, res) => {
  try {
    const confirmation = await qrConfirmationService.confirmByPatient(req.params.requestId);
    res.json({ message: 'Confirmé par le patient.', data: confirmation });
  } catch (err) {
    if (err.message === 'Confirmation introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.parRequete = async (req, res) => {
  try {
    const confirmation = await qrConfirmationService.getByRequest(req.params.requestId);
    if (!confirmation) return res.status(404).json({ message: 'Aucune confirmation trouvée.' });
    res.json(confirmation);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.tous = async (req, res) => {
  try {
    const confirmations = await qrConfirmationService.getAllWithDetails();
    res.json(confirmations);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
