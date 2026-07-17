const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sinistreController');
const { auth, estAdmin } = require('../middleware/auth');

router.post('/', auth, ctrl.create);
router.get('/me', auth, ctrl.mesSinistres);
router.get('/:id', auth, ctrl.detail);
router.patch('/:id/status', auth, ctrl.updateStatus);
router.patch('/:id/cancel', auth, ctrl.cancel);
router.get('/', auth, estAdmin, ctrl.tous);

module.exports = router;
