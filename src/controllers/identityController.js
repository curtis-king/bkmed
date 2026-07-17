const identityService = require('../services/identityService');

exports.create = async (req, res) => {
  try {
    const doc = await identityService.create(req.body, req.user.id);
    res.status(201).json({ message: 'Document créé.', data: doc });
  } catch (err) {
    if (err.message === 'Ce numéro de document existe déjà.') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.uploadFiles = async (req, res) => {
  try {
    const doc = await identityService.uploadFiles(req.params.id, req.user.id, req.files);
    res.json({ message: 'Fichiers uploadés.', data: doc });
  } catch (err) {
    if (err.message === 'Document introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.mesDocuments = async (req, res) => {
  try {
    const docs = await identityService.getUserDocuments(req.user.id);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.documentsByUser = async (req, res) => {
  try {
    const docs = await identityService.getUserDocumentsByUserId(req.params.userId);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.tous = async (req, res) => {
  try {
    const docs = await identityService.getAllWithUser();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.approuver = async (req, res) => {
  try {
    const doc = await identityService.approve(req.params.id);
    res.json({ message: 'Document approuvé.', data: doc });
  } catch (err) {
    if (err.message === 'Document introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.rejeter = async (req, res) => {
  try {
    const doc = await identityService.reject(req.params.id, req.body.reason || null);
    res.json({ message: 'Document rejeté.', data: doc });
  } catch (err) {
    if (err.message === 'Document introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.approuverForgery = async (req, res) => {
  try {
    const doc = await identityService.approuverForgery(req.params.id);
    res.json({ message: 'Document passé au contrôle anti-falsification.', data: doc });
  } catch (err) {
    if (err.message === 'Document introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.rejeterForgery = async (req, res) => {
  try {
    const doc = await identityService.rejeterForgery(req.params.id, req.body.reason || null);
    res.json({ message: 'Document rejeté pour falsification suspectée.', data: doc });
  } catch (err) {
    if (err.message === 'Document introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.enAttenteForgery = async (req, res) => {
  try {
    const docs = await identityService.getForgeryPending();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
