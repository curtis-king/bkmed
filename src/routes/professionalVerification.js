const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/professionalVerificationController');
const { auth, estAdmin } = require('../middleware/auth');

router.post('/', auth, ctrl.create);
router.get('/me', auth, ctrl.mesVerifications);
router.get('/', auth, estAdmin, ctrl.tous);
router.patch('/:id/approuver', auth, estAdmin, ctrl.approuver);
router.patch('/:id/rejeter', auth, estAdmin, ctrl.rejeter);

module.exports = router;
