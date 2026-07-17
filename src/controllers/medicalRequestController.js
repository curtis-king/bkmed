const medicalRequestService = require('../services/medicalRequestService');

exports.create = async (req, res) => {
  try {
    const request = await medicalRequestService.create(req.body, req.user.id);
    res.status(201).json({ message: 'Demande créée.', data: request });
  } catch (err) {
    if (err.message === 'Service invalide ou inactif.') return res.status(400).json({ message: err.message });
    if (err.message?.startsWith('Accès refusé')) return res.status(403).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.mesDemandes = async (req, res) => {
  try {
    const requests = await medicalRequestService.getUserRequests(req.user.id);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.details = async (req, res) => {
  try {
    const request = await medicalRequestService.getByIdWithDetails(req.params.id, req.user.id, req.user.roles);
    res.json(request);
  } catch (err) {
    if (err.message === 'Demande introuvable.') return res.status(404).json({ message: err.message });
    if (err.message === 'Accès refusé.') return res.status(403).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.tous = async (req, res) => {
  try {
    const isAdmin = req.user.roles.includes('ADMIN');
    const isMedecin = req.user.roles.includes('MEDECIN');
    const isLivreur = req.user.roles.includes('LIVREUR');

    let requests;
    if (isAdmin) {
      requests = await medicalRequestService.getAllFiltered(req.query.status);
    } else if (isMedecin) {
      requests = await medicalRequestService.getMedecinRequests(req.user.id);
    } else if (isLivreur) {
      requests = await medicalRequestService.getLivreurRequests(req.user.id);
    }
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.changerStatut = async (req, res) => {
  try {
    const { status, admin_note } = req.body;
    const request = await medicalRequestService.changeStatus(req.params.id, status, admin_note);
    res.json({ message: `Statut mis à jour: ${request.status}`, data: request });
  } catch (err) {
    if (err.message === 'Demande introuvable.') return res.status(404).json({ message: err.message });
    if (err.message?.startsWith('Statut invalide')) return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.assigner = async (req, res) => {
  try {
    const assignment = await medicalRequestService.assign(req.params.id, req.body.agent_id);
    res.json({ message: 'Agent assigné.', data: assignment });
  } catch (err) {
    if (err.message === 'Demande introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.assignerMedecin = async (req, res) => {
  try {
    const request = await medicalRequestService.assignMedecin(req.params.id, req.body.medecin_id);
    res.json({ message: 'Médecin assigné.', data: request });
  } catch (err) {
    if (err.message === 'Demande introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.mesConsultations = async (req, res) => {
  try {
    const requests = await medicalRequestService.getMedecinRequests(req.user.id);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.ajouterMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Contenu requis.' });

    const RequestMessage = require('../models/RequestMessage');
    const message = await RequestMessage.create({
      request_id: req.params.id,
      sender_id: req.user.id,
      content,
    });

    const User = require('../models/User');
    const full = await RequestMessage.findByPk(message.id, {
      include: [{ model: User, as: 'Sender', attributes: { exclude: ['password'] } }],
    });

    const { getIO } = require('../socket');
    const io = getIO();
    io.to(`request:${req.params.id}`).emit('request_message:created', full);

    res.status(201).json({ message: 'Message envoyé.', data: full });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
