const roleService = require('../services/roleService');

exports.tous = async (req, res) => {
  try {
    const roles = await roleService.getAll();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.creer = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Nom du rôle requis.' });

    const existant = await roleService.findOne({ name });
    if (existant) return res.status(400).json({ message: 'Ce rôle existe déjà.' });

    const role = await roleService.create({ name });
    res.status(201).json({ message: 'Rôle créé.', data: role });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.supprimer = async (req, res) => {
  try {
    await roleService.delete(req.params.id);
    res.json({ message: 'Rôle supprimé.' });
  } catch (err) {
    if (err.message === 'Enregistrement introuvable.') return res.status(404).json({ message: 'Rôle introuvable.' });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
