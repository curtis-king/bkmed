const express = require('express');
const router = express.Router();
const db = require('../models');
const { Pays, Departement, Arrondissement } = db;

router.get('/pays', async (req, res) => {
  try {
    const pays = await Pays.findAll({ attributes: ['id', 'name', 'code', 'nationality'] });
    res.json(pays);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

router.get('/departements/all/:paysId', async (req, res) => {
  try {
    const departements = await Departement.findAll({
      where: { pays_id: req.params.paysId },
      attributes: ['id', 'name'],
    });
    res.json(departements);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

router.get('/departements', async (req, res) => {
  try {
    const paysId = req.params.paysId || (await Pays.findOne({ where: { code: 'CG' } }))?.id;
    if (!paysId) return res.status(404).json({ message: 'Aucun pays trouvé.' });
    const departements = await Departement.findAll({
      where: { pays_id: paysId },
      attributes: ['id', 'name'],
    });
    res.json(departements);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

router.get('/arrondissements/:departementId', async (req, res) => {
  try {
    const arrondissements = await Arrondissement.findAll({
      where: { departement_id: req.params.departementId },
      attributes: ['id', 'name'],
    });
    res.json(arrondissements);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
});

module.exports = router;
