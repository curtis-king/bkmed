const serviceService = require('../services/serviceService');

exports.create = async (req, res) => {
  try {
    const { code, name, description, price } = req.body;

    const existant = await serviceService.findOne({ code });
    if (existant) return res.status(400).json({ message: 'Ce code service existe déjà.' });

    const service = await serviceService.create({ code, name, description, price });
    res.status(201).json({ message: 'Service créé.', data: service });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.tous = async (req, res) => {
  try {
    const services = await serviceService.getAll();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.actifs = async (req, res) => {
  try {
    const services = await serviceService.getAllActive();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const service = await serviceService.update(req.params.id, req.body);
    res.json({ message: 'Service mis à jour.', data: service });
  } catch (err) {
    if (err.message === 'Enregistrement introuvable.') return res.status(404).json({ message: 'Service introuvable.' });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.toggleActif = async (req, res) => {
  try {
    const service = await serviceService.toggleActive(req.params.id);
    res.json({ message: `Service ${service.active ? 'activé' : 'désactivé'}.`, data: service });
  } catch (err) {
    if (err.message === 'Enregistrement introuvable.') return res.status(404).json({ message: 'Service introuvable.' });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
