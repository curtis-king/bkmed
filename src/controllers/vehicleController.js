const vehicleService = require('../services/vehicleService');

exports.create = async (req, res) => {
  try {
    const vehicle = await vehicleService.create(req.body, req.user.id);
    res.status(201).json({ message: 'Véhicule ajouté.', data: vehicle });
  } catch (err) {
    if (err.message === 'Profil professionnel introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.createPatientVehicle = async (req, res) => {
  try {
    const getPath = (field) =>
      req.files?.[field] ? `/uploads/vehicules/${req.files[field][0].filename}` : null;

    const identityDocPath = getPath('identity_document');
    const supportingDocPath = getPath('supporting_document');
    const drivingLicensePath = getPath('driving_license');
    const insuranceCertPath = getPath('insurance_cert');
    const registrationCertPath = getPath('registration_cert');

    if (!identityDocPath) return res.status(400).json({ message: 'Pièce d\'identité requise.' });
    if (!supportingDocPath) return res.status(400).json({ message: 'Pièce justificative requise.' });

    const vehicle = await vehicleService.createPatientVehicle(
      req.body, req.user.id, identityDocPath, supportingDocPath,
      drivingLicensePath, insuranceCertPath, registrationCertPath
    );
    res.status(201).json({ message: 'Véhicule enregistré.', data: vehicle });
  } catch (err) {
    if (err.message === 'Ce numéro de matricule est déjà enregistré.') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.mesVehicules = async (req, res) => {
  try {
    const profils = await vehicleService.getUserVehicles(req.user.id);
    res.json(profils);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.mesVehiculesPatients = async (req, res) => {
  try {
    const vehicles = await vehicleService.getMyVehicles(req.user.id);
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const vehicle = await vehicleService.update(req.params.id, req.body, req.user.id);
    res.json({ message: 'Véhicule mis à jour.', data: vehicle });
  } catch (err) {
    if (err.message === 'Véhicule introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.supprimer = async (req, res) => {
  try {
    await vehicleService.delete(req.params.id, req.user.id);
    res.json({ message: 'Véhicule supprimé.' });
  } catch (err) {
    if (err.message === 'Véhicule introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.tous = async (req, res) => {
  try {
    const vehicles = await vehicleService.getAllWithProfiles();
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
