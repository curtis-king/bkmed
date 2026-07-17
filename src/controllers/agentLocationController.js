const agentLocationService = require('../services/agentLocationService');

exports.enregistrer = async (req, res) => {
  try {
    const location = await agentLocationService.saveLocation(req.user.id, req.body);
    res.status(201).json({ message: 'Position enregistrée.', data: location });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.dernierePosition = async (req, res) => {
  try {
    const location = await agentLocationService.getLatestPosition(req.user.id);
    if (!location) return res.status(404).json({ message: 'Aucune position.' });
    res.json(location);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.historique = async (req, res) => {
  try {
    const locations = await agentLocationService.getHistory(req.params.agent_id || req.user.id);
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.tousAgents = async (req, res) => {
  try {
    const locations = await agentLocationService.getAllAgentsLocations();
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
