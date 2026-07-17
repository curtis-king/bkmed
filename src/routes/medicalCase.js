const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/medicalCaseController');
const { auth, estAdmin, estMedecin } = require('../middleware/auth');

router.post('/', auth, estMedecin, ctrl.create);
router.get('/me', auth, estMedecin, ctrl.mesCas);
router.get('/:id', auth, ctrl.details);
router.put('/:id', auth, estMedecin, ctrl.update);
router.get('/', auth, estAdmin, ctrl.tous);

module.exports = router;
