const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/attachmentController');
const { auth } = require('../middleware/auth');
const uploadGeneric = require('../middleware/uploadGeneric');

router.post('/', auth, uploadGeneric.single('file'), ctrl.upload);
router.get('/:entity_type/:entity_id', auth, ctrl.parEntite);
router.delete('/:id', auth, ctrl.supprimer);

module.exports = router;
