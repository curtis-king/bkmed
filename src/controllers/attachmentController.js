const attachmentService = require('../services/attachmentService');

exports.upload = async (req, res) => {
  try {
    const attachment = await attachmentService.upload(req.body, req.file);
    res.status(201).json({ message: 'Fichier attaché.', data: attachment });
  } catch (err) {
    if (err.message === 'Aucun fichier fourni.') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.parEntite = async (req, res) => {
  try {
    const attachments = await attachmentService.getByEntity(req.params.entity_type, req.params.entity_id);
    res.json(attachments);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.supprimer = async (req, res) => {
  try {
    await attachmentService.delete(req.params.id);
    res.json({ message: 'Fichier supprimé.' });
  } catch (err) {
    if (err.message === 'Fichier introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
