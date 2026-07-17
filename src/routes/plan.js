const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/planController');
const { auth, estAdmin } = require('../middleware/auth');

router.post('/', auth, estAdmin, ctrl.create);
router.get('/', ctrl.tous);
router.put('/:id', auth, estAdmin, ctrl.update);
router.delete('/:id', auth, estAdmin, ctrl.supprimer);

module.exports = router;
