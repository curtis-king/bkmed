const notificationService = require('../services/notificationService');

exports.list = async (req, res) => {
  try {
    const notifs = await notificationService.list(req.user.id);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.unreadByResource = async (req, res) => {
  try {
    const ids = await notificationService.getUnreadByResource(req.user.id, req.params.resourceType);
    res.json(ids);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user.id);
    res.json({ message: 'Notification marquée comme lue.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.markReadByResource = async (req, res) => {
  try {
    const { resource_type, resource_id } = req.body;
    await notificationService.markAsReadByResource(req.user.id, resource_type, resource_id);
    res.json({ message: 'Notifications marquées comme lues.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ message: 'Toutes les notifications sont marquées comme lues.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.clearAll = async (req, res) => {
  try {
    await notificationService.clearAll(req.user.id);
    res.json({ message: 'Notifications effacées.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
