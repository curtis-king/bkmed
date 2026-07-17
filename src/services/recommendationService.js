const BaseService = require('./baseService');
const Recommendation = require('../models/Recommendation');
const MedicalRequest = require('../models/MedicalRequest');
const User = require('../models/User');
const Attachment = require('../models/Attachment');

class RecommendationService extends BaseService {
  constructor() {
    super(Recommendation);
  }

  async create(data, userId) {
    const request = await MedicalRequest.findByPk(data.request_id);
    if (!request) throw new Error('Demande introuvable.');

    const recommendation = await Recommendation.create({
      request_id: data.request_id,
      title: data.title,
      description: data.description,
      created_by: userId,
    });

    if (data.attachment_path) {
      await Attachment.create({
        entity_type: 'RECOMMENDATION',
        entity_id: recommendation.id,
        file_path: data.attachment_path,
      });
    }

    return Recommendation.findByPk(recommendation.id, {
      include: [
        { model: User, as: 'Creator', attributes: { exclude: ['password'] } },
        { model: Attachment, as: 'attachments' },
      ],
    });
  }

  async getByRequest(requestId) {
    return Recommendation.findAll({
      where: { request_id: requestId },
      include: [
        { model: User, as: 'Creator', attributes: { exclude: ['password'] } },
        { model: Attachment, as: 'attachments' },
      ],
      order: [['id', 'DESC']],
    });
  }
}

module.exports = new RecommendationService();
