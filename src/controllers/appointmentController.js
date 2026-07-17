const appointmentService = require('../services/appointmentService');

exports.create = async (req, res) => {
  try {
    const appointment = await appointmentService.create(req.body, req.user.id, req.user.roles || []);
    res.status(201).json({ message: 'Rendez-vous créé.', data: appointment });
  } catch (err) {
    if (err.message === 'Demande introuvable.') return res.status(404).json({ message: err.message });
    if (err.message === 'Vous avez déjà une demande de rendez-vous en attente pour cette demande.') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.parDemande = async (req, res) => {
  try {
    const appointments = await appointmentService.getByRequest(req.params.requestId);
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.changerStatut = async (req, res) => {
  try {
    const appointment = await appointmentService.updateStatus(req.params.id, req.body.status, req.user.id, req.user.roles || []);
    res.json({ message: 'Statut mis à jour.', data: appointment });
  } catch (err) {
    if (err.message === 'Rendez-vous introuvable.') return res.status(404).json({ message: err.message });
    res.status(400).json({ message: err.message });
  }
};

exports.proposerDate = async (req, res) => {
  try {
    const appointment = await appointmentService.proposeNewDate(req.params.id, req.body.date, req.user.id, req.user.roles || []);
    res.json({ message: 'Nouvelle date proposée.', data: appointment });
  } catch (err) {
    if (err.message === 'Rendez-vous introuvable.') return res.status(404).json({ message: err.message });
    res.status(400).json({ message: err.message });
  }
};

exports.mesRendezVous = async (req, res) => {
  try {
    const appointments = await appointmentService.getMyAppointments(req.user.id, req.user.roles || []);
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
