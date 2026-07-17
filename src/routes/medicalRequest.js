const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/medicalRequestController');
const { auth, estAdmin, estPersonnel, aAccesComplet } = require('../middleware/auth');

router.post('/', auth, aAccesComplet, ctrl.create);
router.get('/me', auth, aAccesComplet, ctrl.mesDemandes);
router.get('/medecin/consultations', auth, ctrl.mesConsultations);
router.get('/:id', auth, ctrl.details);
router.get('/', auth, estPersonnel, ctrl.tous);
router.patch('/:id/statut', auth, ctrl.changerStatut);
router.post('/:id/assigner', auth, estAdmin, ctrl.assigner);
router.post('/:id/assigner-medecin', auth, estAdmin, ctrl.assignerMedecin);
router.post('/:id/messages', auth, ctrl.ajouterMessage);

module.exports = router;