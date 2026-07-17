const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');

router.get('/', auth, ctrl.list);
router.get('/unread-by-resource/:resourceType', auth, ctrl.unreadByResource);
router.patch('/:id/read', auth, ctrl.markRead);
router.patch('/read-all', auth, ctrl.markAllRead);
router.patch('/read-by-resource', auth, ctrl.markReadByResource);
router.delete('/clear', auth, ctrl.clearAll);

module.exports = router;
