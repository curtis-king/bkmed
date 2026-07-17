const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const { auth, estAdmin } = require('../middleware/auth');

router.get('/stats', auth, estAdmin, ctrl.stats);
router.get('/patients', auth, estAdmin, ctrl.patientsPourAgent);
router.get('/agents', auth, estAdmin, ctrl.agentsPourGestion);
router.get('/appointments/today', auth, estAdmin, ctrl.todaysAppointments);
router.get('/activities', auth, estAdmin, ctrl.recentActivities);
router.get('/verifications', auth, estAdmin, ctrl.pendingVerifications);
router.get('/notif-counts', auth, ctrl.notifCounts);

module.exports = router;
