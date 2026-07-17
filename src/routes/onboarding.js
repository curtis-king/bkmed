const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/onboardingController');
const { auth } = require('../middleware/auth');

router.get('/status', auth, ctrl.status);

module.exports = router;
