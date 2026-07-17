const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/medicalRecordController');
const { auth, estMedecin } = require('../middleware/auth');

router.post('/', auth, ctrl.createOrUpdate);
router.get('/', auth, estMedecin, ctrl.tous);
router.get('/me', auth, ctrl.monDossier);
router.get('/by-user/:userId', auth, ctrl.consulterParUser);
router.get('/:id', auth, ctrl.consulter);

module.exports = router;
