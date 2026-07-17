const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/vehicleController');
const { auth, estAdmin } = require('../middleware/auth');
const uploadVehicleDocs = require('../middleware/uploadVehicleDocs');

router.post('/', auth, ctrl.create);
router.post('/patient', auth, uploadVehicleDocs.fields([
  { name: 'identity_document', maxCount: 1 },
  { name: 'supporting_document', maxCount: 1 },
  { name: 'driving_license', maxCount: 1 },
  { name: 'insurance_cert', maxCount: 1 },
  { name: 'registration_cert', maxCount: 1 },
]), ctrl.createPatientVehicle);
router.get('/me', auth, ctrl.mesVehicules);
router.get('/me/patient', auth, ctrl.mesVehiculesPatients);
router.get('/', auth, estAdmin, ctrl.tous);
router.put('/:id', auth, ctrl.update);
router.delete('/:id', auth, ctrl.supprimer);

module.exports = router;
