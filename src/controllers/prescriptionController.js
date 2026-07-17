const prescriptionService = require('../services/prescriptionService');

exports.create = async (req, res) => {
  try {
    const result = await prescriptionService.createWithItems(req.body);
    res.status(201).json({ message: 'Prescription créée.', data: result });
  } catch (err) {
    if (err.message === 'Dossier médical introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.details = async (req, res) => {
  try {
    const prescription = await prescriptionService.getByIdWithDetails(req.params.id);
    res.json(prescription);
  } catch (err) {
    if (err.message === 'Prescription introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.ajouterItem = async (req, res) => {
  try {
    const { medication_name, dosage, duration } = req.body;
    const item = await prescriptionService.addItem(req.params.id, { medication_name, dosage, duration });
    res.status(201).json({ message: 'Médicament ajouté.', data: item });
  } catch (err) {
    if (err.message === 'Prescription introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.supprimerItem = async (req, res) => {
  try {
    await prescriptionService.deleteItem(req.params.itemId);
    res.json({ message: 'Élément supprimé.' });
  } catch (err) {
    if (err.message === 'Élément introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.tous = async (req, res) => {
  try {
    const prescriptions = await prescriptionService.getAllWithDetails();
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
