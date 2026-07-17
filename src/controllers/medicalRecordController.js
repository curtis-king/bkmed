const medicalRecordService = require('../services/medicalRecordService');

exports.createOrUpdate = async (req, res) => {
  try {
    const { record, created } = await medicalRecordService.createOrUpdate(req.user.id, req.body);
    res.status(created ? 201 : 200).json({
      message: created ? 'Dossier médical créé.' : 'Dossier médical mis à jour.',
      data: record,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.monDossier = async (req, res) => {
  try {
    const record = await medicalRecordService.getByUser(req.user.id);
    res.json(record);
  } catch (err) {
    if (err.message === 'Aucun dossier médical.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.consulter = async (req, res) => {
  try {
    const record = await medicalRecordService.getByIdWithPrivacy(req.params.id, req.user.id);
    res.json(record);
  } catch (err) {
    if (err.message === 'Dossier introuvable.') return res.status(404).json({ message: err.message });
    if (err.message === 'Accès refusé.') return res.status(403).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.consulterParUser = async (req, res) => {
  try {
    const record = await medicalRecordService.getByUserWithPrivacy(req.params.userId, req.user.id);
    res.json(record);
  } catch (err) {
    if (err.message === 'Aucun dossier médical.') return res.status(404).json({ message: err.message });
    if (err.message === 'Accès refusé. Le dossier est privé.') return res.status(403).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.tous = async (req, res) => {
  try {
    const records = await medicalRecordService.getPublic();
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
