const assignmentService = require('../services/assignmentService');

exports.mesAssignments = async (req, res) => {
  try {
    const assignments = await assignmentService.getUserAssignments(req.user.id);
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.updateNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    const assignment = await assignmentService.updateNotes(req.params.requestId, req.user.id, notes);
    res.json({ message: 'Notes mises à jour.', assignment });
  } catch (err) {
    if (err.message === 'Assignation introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.tous = async (req, res) => {
  try {
    const assignments = await assignmentService.getAllWithDetails();
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
