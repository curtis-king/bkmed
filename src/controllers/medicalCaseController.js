const medicalCaseService = require('../services/medicalCaseService');

exports.create = async (req, res) => {
  try {
    const medCase = await medicalCaseService.create(req.body, req.user.id);
    res.status(201).json({ message: 'Dossier médical créé.', data: medCase });
  } catch (err) {
    if (err.message === 'Demande introuvable.') return res.status(404).json({ message: err.message });
    if (err.message === 'Un dossier médical existe déjà pour cette demande.') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.mesCas = async (req, res) => {
  try {
    const cases = await medicalCaseService.getDoctorCases(req.user.id);
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.details = async (req, res) => {
  try {
    const medCase = await medicalCaseService.getByIdWithDetails(req.params.id);
    res.json(medCase);
  } catch (err) {
    if (err.message === 'Dossier médical introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const medCase = await medicalCaseService.updateByDoctor(req.params.id, req.user.id, req.body);
    res.json({ message: 'Dossier médical mis à jour.', data: medCase });
  } catch (err) {
    if (err.message === 'Dossier médical introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.tous = async (req, res) => {
  try {
    const cases = await medicalCaseService.getAllWithRequest();
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
