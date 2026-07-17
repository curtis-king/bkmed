const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/qrConfirmationController');
const { auth, estAdmin } = require('../middleware/auth');

router.post('/', auth, ctrl.create);
router.patch('/:requestId/patient', auth, ctrl.confirmerPatient);
router.get('/:requestId', auth, ctrl.parRequete);
router.get('/', auth, estAdmin, ctrl.tous);

module.exports = router;
