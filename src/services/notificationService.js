const Notification = require('../models/Notification');
const { Op } = require('sequelize');

const ROUTE_MAP = {
  'medical_request:created': '/dashboard/demandes',
  'medical_request:status_changed': '/dashboard/demandes',
  'assignment:created': '/dashboard/agent/affectations',
  'appointment:created': '/dashboard/medecin/rendezvous',
  'appointment:status_changed': '/dashboard/medecin/rendezvous',
  'payment:confirmed': '/dashboard/patient/paiements',
};

class NotificationService {
  async getAdminIds() {
    const { Role } = require('../models');
    const role = await Role.findOne({ where: { name: 'ADMIN' } });
    if (!role) return [];
    const admins = await role.getUsers({ attributes: ['id'] });
    return admins.map((u) => u.id);
  }

  async create(userIds, type, resourceType, resourceId, message) {
    if (!Array.isArray(userIds)) userIds = [userIds];
    if (userIds.length === 0) return [];

    const rows = userIds.map((userId) => ({
      user_id: userId,
      type,
      resource_type: resourceType,
      resource_id: resourceId,
      message,
    }));

    return Notification.bulkCreate(rows);
  }

  async list(userId) {
    return Notification.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
  }

  async getUnreadCounts(userId) {
    const notifs = await Notification.findAll({
      where: { user_id: userId, is_read: false },
      attributes: ['type'],
      group: ['type'],
      raw: true,
    });

    const counts = {};
    for (const n of notifs) {
      const route = ROUTE_MAP[n.type];
      if (route) counts[route] = (counts[route] || 0) + 1;
    }
    return counts;
  }

  async getUnreadByResource(userId, resourceType) {
    const notifs = await Notification.findAll({
      where: { user_id: userId, resource_type: resourceType, is_read: false },
      attributes: ['resource_id'],
      group: ['resource_id'],
      raw: true,
    });
    return notifs.map((n) => Number(n.resource_id)).filter(Boolean);
  }

  async markAsRead(notifId, userId) {
    return Notification.update({ is_read: true }, {
      where: { id: notifId, user_id: userId },
    });
  }

  async markAsReadByResource(userId, resourceType, resourceId) {
    return Notification.update({ is_read: true }, {
      where: { user_id: userId, resource_type: resourceType, resource_id: resourceId },
    });
  }

  async markAllAsRead(userId) {
    return Notification.update({ is_read: true }, {
      where: { user_id: userId },
    });
  }

  async clearAll(userId) {
    return Notification.destroy({ where: { user_id: userId } });
  }
}

module.exports = new NotificationService();
