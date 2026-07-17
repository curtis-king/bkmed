const authService = require('../services/authService');

exports.inscription = async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone, birth_date, gender, pays, departement_id, arrondissement_id, adresse, latitude, longitude } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }

    const result = await authService.register({ first_name, last_name, email, password, phone, birth_date, gender, pays, departement_id, arrondissement_id, adresse, latitude, longitude });
    res.status(201).json({ message: 'Inscription réussie.', ...result });
  } catch (err) {
    if (err.message === 'Cet email est déjà utilisé.') return res.status(400).json({ message: err.message });
    if (err.message === 'Ce numéro de téléphone est déjà utilisé.') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message, details: err.errors });
  }
};

exports.connexion = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }

    const result = await authService.login(email, password);
    res.json({ message: 'Connexion réussie.', ...result });
  } catch (err) {
    if (err.message === 'Email ou mot de passe incorrect.') return res.status(401).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni.' });
    }

    const result = await authService.uploadPhoto(req.user.id, req.file.filename);
    res.json({ message: 'Photo de profil mise à jour.', ...result });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.changerMotDePasse = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Mot de passe actuel et nouveau mot de passe requis.' });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
    }
    const result = await authService.changePassword(req.user.id, current_password, new_password);
    res.json(result);
  } catch (err) {
    if (err.message === 'Mot de passe actuel incorrect.') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.mettreAJourProfil = async (req, res) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    res.json({ message: 'Profil mis à jour.', user });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.profil = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.profilComplet = async (req, res) => {
  try {
    const data = await authService.getProfilComplet(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.inscriptionSansMotDePasse = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, birth_date, gender, document_type, document_number, ...medicalData } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requis.' });
    }

    const result = await authService.registerWithoutPassword({
      first_name, last_name, email, phone, birth_date, gender,
      document_type, document_number,
      medicalData,
    }, req.files);

    res.status(201).json({ message: 'Inscription réussie. Vos pièces d\'identité seront vérifiées.', ...result });
  } catch (err) {
    if (err.message === 'Cet email est déjà utilisé.') return res.status(400).json({ message: err.message });
    if (err.message === 'Ce numéro de téléphone est déjà utilisé.') return res.status(400).json({ message: err.message });
    if (err.message === 'Ce numéro de document existe déjà.') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message, details: err.errors });
  }
};
