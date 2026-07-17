const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/identityController');
const { auth, estAdmin } = require('../middleware/auth');
const uploadDocs = require('../middleware/uploadDocs');

router.post('/', auth, ctrl.create);
router.post('/:id/upload', auth, uploadDocs.fields([
  { name: 'front', maxCount: 1 },
  { name: 'back', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
]), ctrl.uploadFiles);
router.get('/me', auth, ctrl.mesDocuments);
router.get('/user/:userId', auth, ctrl.documentsByUser);
router.get('/', auth, estAdmin, ctrl.tous);
router.get('/en-attente-forgery', auth, estAdmin, ctrl.enAttenteForgery);
router.patch('/:id/approuver', auth, estAdmin, ctrl.approuver);
router.patch('/:id/rejeter', auth, estAdmin, ctrl.rejeter);
router.patch('/:id/approuver-forgery', auth, estAdmin, ctrl.approuverForgery);
router.patch('/:id/rejeter-forgery', auth, estAdmin, ctrl.rejeterForgery);

module.exports = router;
