const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/prescriptionController');
const { auth, estMedecin, estAdmin } = require('../middleware/auth');

router.post('/', auth, estMedecin, ctrl.create);
router.get('/:id', auth, ctrl.details);
router.post('/:id/items', auth, estMedecin, ctrl.ajouterItem);
router.delete('/:id/items/:itemId', auth, estMedecin, ctrl.supprimerItem);
router.get('/', auth, estAdmin, ctrl.tous);

module.exports = router;
