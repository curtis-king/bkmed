const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/beneficiaryLinkController');
const { auth, estAdmin, aAccesComplet } = require('../middleware/auth');

router.post('/', auth, aAccesComplet, ctrl.create);
router.get('/me', auth, aAccesComplet, ctrl.mesBeneficiaires);
router.get('/', auth, estAdmin, ctrl.tous);
router.patch('/:id/desactiver', auth, aAccesComplet, ctrl.desactiver);

module.exports = router;