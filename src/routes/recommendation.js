const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/recommendationController');
const { auth, aUnRole } = require('../middleware/auth');
const upload = require('../middleware/uploadGeneric');

router.post('/', auth, aUnRole('MEDECIN'), upload.single('file'), ctrl.create);
router.get('/demande/:requestId', auth, ctrl.parDemande);

module.exports = router;
