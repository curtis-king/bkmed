const BaseService = require('./baseService');
const ProfessionalProfile = require('../models/ProfessionalProfile');
const User = require('../models/User');

class ProfessionalService extends BaseService {
  constructor() {
    super(ProfessionalProfile);
  }

  async create(data, userId) {
    const { profession_type, organization_name } = data;

    return ProfessionalProfile.create({
      user_id: userId,
      profession_type,
      organization_name,
    });
  }

  async getUserProfile(userId) {
    return ProfessionalProfile.findOne({ where: { user_id: userId } });
  }

  async getAllWithUser() {
    return ProfessionalProfile.findAll({ include: User });
  }

  async approve(id) {
    const profil = await ProfessionalProfile.findByPk(id);
    if (!profil) throw new Error('Profil introuvable.');

    await profil.update({ status: 'APPROVED' });
    await User.update(
      { verification_level: 'PROFESSION_VERIFIED' },
      { where: { id: profil.user_id } }
    );

    return profil;
  }

  async reject(id) {
    const profil = await ProfessionalProfile.findByPk(id);
    if (!profil) throw new Error('Profil introuvable.');

    await profil.update({ status: 'REJECTED' });
    return profil;
  }
}

module.exports = new ProfessionalService();
