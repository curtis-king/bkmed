const BaseService = require('./baseService');
const QrConfirmation = require('../models/QrConfirmation');
const MedicalRequest = require('../models/MedicalRequest');
const User = require('../models/User');
const { getIO } = require('../socket');

class QrConfirmationService extends BaseService {
  constructor() {
    super(QrConfirmation);
  }

  async create(data, agentId) {
    const { request_id, confirmation_type } = data;

    const request = await MedicalRequest.findByPk(request_id);
    if (!request) throw new Error('Demande introuvable.');

    const [confirmation, created] = await QrConfirmation.findOrCreate({
      where: { request_id },
      defaults: {
        request_id,
        patient_id: request.beneficiary_id,
        agent_id: agentId,
        confirmation_type,
        confirmed_by_agent: true,
        confirmed_at: new Date(),
      },
    });

    if (!created) {
      await confirmation.update({
        confirmed_by_agent: true,
        confirmed_at: new Date(),
      });
    }

    const io = getIO();
    io.to(`request:${request_id}`).emit('qr:confirmed', confirmation);

    return { confirmation, created };
  }

  async confirmByPatient(requestId) {
    const confirmation = await QrConfirmation.findOne({
      where: { request_id: requestId },
    });
    if (!confirmation) throw new Error('Confirmation introuvable.');

    await confirmation.update({
      confirmed_by_patient: true,
      confirmed_at: new Date(),
    });

    const io = getIO();
    io.to(`request:${requestId}`).emit('qr:confirmed', confirmation);

    return confirmation;
  }

  async getByRequest(requestId) {
    const confirmation = await QrConfirmation.findOne({
      where: { request_id: requestId },
      include: [
        { model: User, as: 'Patient', attributes: { exclude: ['password'] } },
        { model: User, as: 'Agent', attributes: { exclude: ['password'] } },
      ],
    });
    return confirmation;
  }

  async getAllWithDetails() {
    return QrConfirmation.findAll({
      include: [
        MedicalRequest,
        { model: User, as: 'Patient', attributes: { exclude: ['password'] } },
        { model: User, as: 'Agent', attributes: { exclude: ['password'] } },
      ],
    });
  }
}

module.exports = new QrConfirmationService();
