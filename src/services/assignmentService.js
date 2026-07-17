const BaseService = require('./baseService');
const Assignment = require('../models/Assignment');
const MedicalRequest = require('../models/MedicalRequest');
const User = require('../models/User');

class AssignmentService extends BaseService {
  constructor() {
    super(Assignment);
  }

  async getUserAssignments(userId) {
    return Assignment.findAll({
      where: { agent_id: userId },
      include: {
        model: MedicalRequest,
        include: [
          { model: require('../models/Service'), as: 'Service' },
          { model: User, as: 'Creator', attributes: { exclude: ['password'] } },
          { model: User, as: 'Beneficiary', attributes: { exclude: ['password'] } },
          { model: require('../models/Payment'), required: false },
          {
            model: require('../models/RequestMessage'),
            include: [{ model: User, as: 'Sender', attributes: { exclude: ['password'] } }],
            order: [['id', 'DESC']],
            limit: 1,
          },
        ],
      },
      order: [['assigned_at', 'DESC']],
    });
  }

  async updateNotes(requestId, agentId, notes) {
    const assignment = await Assignment.findOne({ where: { request_id: requestId, agent_id: agentId } });
    if (!assignment) throw new Error('Assignation introuvable.');
    await assignment.update({ notes });
    return assignment;
  }

  async getByRequestId(requestId) {
    return Assignment.findOne({ where: { request_id: requestId } });
  }

  async getAllWithDetails() {
    return Assignment.findAll({
      include: [
        MedicalRequest,
        { model: User, as: 'Agent', attributes: { exclude: ['password'] } },
      ],
    });
  }
}

module.exports = new AssignmentService();
