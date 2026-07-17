const BaseService = require('./baseService');
const AgentLocation = require('../models/AgentLocation');
const User = require('../models/User');
const { getIO } = require('../socket');

class AgentLocationService extends BaseService {
  constructor() {
    super(AgentLocation);
  }

  async saveLocation(userId, data) {
    const { latitude, longitude } = data;

    const location = await AgentLocation.create({
      agent_id: userId,
      latitude,
      longitude,
      recorded_at: new Date(),
    });

    const io = getIO();
    io.to('admins').emit('agent:location_updated', location);

    return location;
  }

  async getLatestPosition(userId) {
    const location = await AgentLocation.findOne({
      where: { agent_id: userId },
      order: [['recorded_at', 'DESC']],
    });
    return location;
  }

  async getHistory(agentId) {
    return AgentLocation.findAll({
      where: { agent_id: agentId },
      order: [['recorded_at', 'DESC']],
      limit: 100,
    });
  }

  async getAllAgentsLocations() {
    return AgentLocation.findAll({
      include: { model: User, as: 'Agent', attributes: { exclude: ['password'] } },
      order: [['recorded_at', 'DESC']],
    });
  }
}

module.exports = new AgentLocationService();
