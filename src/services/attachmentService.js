const BaseService = require('./baseService');
const Attachment = require('../models/Attachment');

class AttachmentService extends BaseService {
  constructor() {
    super(Attachment);
  }

  async upload(data, file) {
    if (!file) throw new Error('Aucun fichier fourni.');

    const { entity_type, entity_id } = data;

    return Attachment.create({
      entity_type,
      entity_id,
      file_path: `/uploads/documents/${file.filename}`,
    });
  }

  async getByEntity(entity_type, entity_id) {
    return Attachment.findAll({
      where: { entity_type, entity_id },
    });
  }

  async delete(id) {
    const attachment = await Attachment.findByPk(id);
    if (!attachment) throw new Error('Fichier introuvable.');
    await attachment.destroy();
  }
}

module.exports = new AttachmentService();
