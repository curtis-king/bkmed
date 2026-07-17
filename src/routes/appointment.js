const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/appointmentController');
const { auth, estActif, aAccesComplet } = require('../middleware/auth');

router.post('/', auth, aAccesComplet, ctrl.create);
router.get('/me', auth, estActif, ctrl.mesRendezVous);
router.get('/demande/:requestId', auth, aAccesComplet, ctrl.parDemande);
router.patch('/:id/statut', auth, ctrl.changerStatut);
router.patch('/:id/proposer-date', auth, ctrl.proposerDate);

module.exports = router;
