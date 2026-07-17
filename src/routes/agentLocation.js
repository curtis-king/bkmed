const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/agentLocationController');
const { auth, estAgent, estAdmin } = require('../middleware/auth');

router.post('/', auth, estAgent, ctrl.enregistrer);
router.get('/me', auth, estAgent, ctrl.dernierePosition);
router.get('/historique/:agent_id', auth, estAdmin, ctrl.historique);
router.get('/', auth, estAdmin, ctrl.tousAgents);

module.exports = router;
