const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const uploadDocs = require('../middleware/uploadDocs');

router.post('/inscription', authController.inscription);
router.post('/inscription-sans-mot-de-passe', uploadDocs.fields([
  { name: 'front', maxCount: 1 },
  { name: 'back', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
]), authController.inscriptionSansMotDePasse);
router.post('/connexion', authController.connexion);
router.get('/profil', auth, authController.profil);
router.get('/profil-complet', auth, authController.profilComplet);
router.put('/profil', auth, authController.mettreAJourProfil);
router.post('/upload-photo', auth, upload.single('photo'), authController.uploadPhoto);
router.put('/mot-de-passe', auth, authController.changerMotDePasse);

module.exports = router;
