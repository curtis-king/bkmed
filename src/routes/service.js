const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/serviceController');
const { auth, estAdmin } = require('../middleware/auth');

router.post('/', auth, estAdmin, ctrl.create);
router.get('/', ctrl.actifs);
router.get('/tous', auth, estAdmin, ctrl.tous);
router.put('/:id', auth, estAdmin, ctrl.update);
router.patch('/:id/toggle', auth, estAdmin, ctrl.toggleActif);

module.exports = router;
