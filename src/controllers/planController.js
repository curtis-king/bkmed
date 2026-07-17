const planService = require('../services/planService');

exports.create = async (req, res) => {
  try {
    const { name, monthly_price, annual_price, monthly_coverage } = req.body;
    const plan = await planService.create({ name, monthly_price, annual_price, monthly_coverage });
    res.status(201).json({ message: 'Plan créé.', data: plan });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.tous = async (req, res) => {
  try {
    const plans = await planService.getAll();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const plan = await planService.update(req.params.id, req.body);
    res.json({ message: 'Plan mis à jour.', data: plan });
  } catch (err) {
    if (err.message === 'Enregistrement introuvable.') return res.status(404).json({ message: 'Plan introuvable.' });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.supprimer = async (req, res) => {
  try {
    await planService.delete(req.params.id);
    res.json({ message: 'Plan supprimé.' });
  } catch (err) {
    if (err.message === 'Enregistrement introuvable.') return res.status(404).json({ message: 'Plan introuvable.' });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
