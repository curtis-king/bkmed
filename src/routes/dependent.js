const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dependentController');
const { auth, aAccesComplet } = require('../middleware/auth');

router.post('/', auth, aAccesComplet, ctrl.create);
router.get('/me', auth, aAccesComplet, ctrl.mesDependants);
router.get('/me/avec-abonnements', auth, aAccesComplet, ctrl.mesDependantsAvecAbonnements);
router.get('/:id', auth, ctrl.getById);
router.put('/:id', auth, ctrl.update);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;