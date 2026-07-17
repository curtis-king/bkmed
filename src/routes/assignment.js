const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/assignmentController');
const { auth, estAdmin } = require('../middleware/auth');

router.get('/me', auth, ctrl.mesAssignments);
router.get('/', auth, estAdmin, ctrl.tous);
router.put('/request/:requestId/notes', auth, ctrl.updateNotes);

module.exports = router;
