const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentController');
const { auth, estAdmin } = require('../middleware/auth');

router.post('/', auth, ctrl.create);
router.post('/regler-abonnement', auth, ctrl.reglerAbonnement);
router.post('/regler-request/:id', auth, ctrl.reglerRequest);
router.get('/me', auth, ctrl.mesPaiements);
router.get('/admin/list', auth, estAdmin, ctrl.adminList);
router.get('/admin/stats', auth, estAdmin, ctrl.adminStats);
router.get('/admin/patient/:userId', auth, estAdmin, ctrl.adminPatientPayments);
router.get('/admin/receipt/:id', auth, estAdmin, ctrl.adminReceipt);
router.post('/:id/regler', auth, ctrl.reglerPayment);
router.get('/:id', auth, ctrl.getById);
router.patch('/:id/confirmer-agent', auth, ctrl.confirmerAgent);
router.patch('/:id/confirmer', auth, estAdmin, ctrl.confirmer);
router.patch('/:id/echouer', auth, estAdmin, ctrl.echouer);
router.get('/', auth, estAdmin, ctrl.tous);

module.exports = router;
