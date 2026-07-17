const dashboardService = require('../services/dashboardService');

exports.stats = async (req, res) => {
  try {
    const stats = await dashboardService.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.patientsPourAgent = async (req, res) => {
  try {
    const patients = await dashboardService.getPatientsPourAgent();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.agentsPourGestion = async (req, res) => {
  try {
    const agents = await dashboardService.getAgentsPourGestion();
    res.json(agents);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.todaysAppointments = async (req, res) => {
  try {
    const appointments = await dashboardService.getTodaysAppointments();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.recentActivities = async (req, res) => {
  try {
    const activities = await dashboardService.getRecentActivities();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.pendingVerifications = async (req, res) => {
  try {
    const verifications = await dashboardService.getPendingVerifications();
    res.json(verifications);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.notifCounts = async (req, res) => {
  try {
    const notificationService = require('../services/notificationService');
    const apiCounts = await dashboardService.getNotifCounts(req.user.id, req.user.roles || []);
    const notifCounts = await notificationService.getUnreadCounts(req.user.id);
    const merged = { ...apiCounts, ...notifCounts };
    res.json(merged);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
