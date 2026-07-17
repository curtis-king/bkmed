const userService = require('../services/userService');

exports.tous = async (req, res) => {
  try {
    const result = await userService.getAllPaginated(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.creer = async (req, res) => {
  try {
    const user = await userService.createWithRoles(req.body);
    res.status(201).json({ message: 'Utilisateur créé.', user });
  } catch (err) {
    if (err.message === 'Cet email est déjà utilisé.') return res.status(400).json({ message: err.message });
    if (err.message === 'Ce numéro de téléphone est déjà utilisé.') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.unSeul = async (req, res) => {
  try {
    const user = await userService.getByIdWithRoles(req.params.id);
    res.json(user);
  } catch (err) {
    if (err.message === 'Utilisateur introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.mettreAJour = async (req, res) => {
  try {
    const data = await userService.updateWithRoles(req.params.id, req.body);
    res.json({ message: 'Utilisateur mis à jour.', data });
  } catch (err) {
    if (err.message === 'Utilisateur introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.supprimer = async (req, res) => {
  try {
    await userService.delete(req.params.id);
    res.json({ message: 'Utilisateur supprimé.' });
  } catch (err) {
    if (err.message === 'Utilisateur introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.ajouterRole = async (req, res) => {
  try {
    await userService.addRole(req.params.id, req.params.roleId);
    res.json({ message: 'Rôle ajouté.' });
  } catch (err) {
    if (err.message === 'Utilisateur introuvable.' || err.message === 'Rôle introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.retirerRole = async (req, res) => {
  try {
    await userService.removeRole(req.params.id, req.params.roleId);
    res.json({ message: 'Rôle retiré.' });
  } catch (err) {
    if (err.message === 'Utilisateur introuvable.' || err.message === 'Rôle introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.setAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    if (!['AVAILABLE', 'BUSY', 'UNAVAILABLE'].includes(availability)) {
      return res.status(400).json({ message: 'Statut invalide. Utilisez AVAILABLE, BUSY ou UNAVAILABLE.' });
    }
    await userService.update(req.user.id, { availability });
    res.json({ message: 'Statut mis à jour.', availability });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.listAvailability = async (req, res) => {
  try {
    const { role } = req.query;
    const where = {};
    if (role) where.role = role;
    const users = await userService.getByRoleWithAvailability(role);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
