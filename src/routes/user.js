const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { auth, estAdmin } = require('../middleware/auth');

router.get('/', auth, ctrl.tous);
router.get('/availability', auth, ctrl.listAvailability);
router.post('/', auth, estAdmin, ctrl.creer);
router.get('/:id', auth, estAdmin, ctrl.unSeul);
router.put('/:id', auth, estAdmin, ctrl.mettreAJour);
router.delete('/:id', auth, estAdmin, ctrl.supprimer);
router.post('/:id/roles/:roleId', auth, estAdmin, ctrl.ajouterRole);
router.delete('/:id/roles/:roleId', auth, estAdmin, ctrl.retirerRole);
router.patch('/me/availability', auth, ctrl.setAvailability);

module.exports = router;
