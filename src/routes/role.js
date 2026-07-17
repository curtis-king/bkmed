const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/roleController');
const { auth, estAdmin } = require('../middleware/auth');

router.get('/', auth, estAdmin, ctrl.tous);
router.post('/', auth, estAdmin, ctrl.creer);
router.delete('/:id', auth, estAdmin, ctrl.supprimer);

module.exports = router;
