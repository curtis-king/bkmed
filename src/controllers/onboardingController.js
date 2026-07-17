const onboardingService = require('../services/onboardingService');

exports.status = async (req, res) => {
  try {
    const status = await onboardingService.getStatus(req.user.id);
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
