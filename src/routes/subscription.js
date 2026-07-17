const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subscriptionController');
const { auth, estAdmin, estActif } = require('../middleware/auth');

router.post('/', auth, estActif, ctrl.souscrire);
router.post('/calculer-prix', auth, ctrl.calculerPrix);
router.get('/me', auth, ctrl.monAbonnement);
router.get('/check-access', auth, ctrl.checkAccess);
router.post('/resilier', auth, estActif, ctrl.resilier);
router.get('/', auth, estAdmin, ctrl.tous);

module.exports = router;
