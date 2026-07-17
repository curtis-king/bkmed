const BaseService = require('./baseService');
const ProfessionalVerification = require('../models/ProfessionalVerification');
const ProfessionalProfile = require('../models/ProfessionalProfile');
const User = require('../models/User');

class ProfessionalVerificationService extends BaseService {
  constructor() {
    super(ProfessionalVerification);
  }

  async create(data, userId) {
    const { professional_profile_id, document_file, reference_number } = data;

    const profil = await ProfessionalProfile.findOne({
      where: { id: professional_profile_id, user_id: userId },
    });
    if (!profil) throw new Error('Profil professionnel introuvable.');

    return ProfessionalVerification.create({
      professional_profile_id,
      document_file,
      reference_number,
    });
  }

  async getUserVerifications(userId) {
    return ProfessionalProfile.findAll({
      where: { user_id: userId },
      include: ProfessionalVerification,
    });
  }

  async getAllWithProfiles() {
    return ProfessionalVerification.findAll({ include: ProfessionalProfile });
  }

  async approve(id) {
    const verif = await ProfessionalVerification.findByPk(id, {
      include: ProfessionalProfile,
    });
    if (!verif) throw new Error('Vérification introuvable.');

    await verif.update({ status: 'APPROVED' });

    if (verif.ProfessionalProfile) {
      await verif.ProfessionalProfile.update({ status: 'APPROVED' });
      await User.update(
        { verification_level: 'PROFESSION_VERIFIED' },
        { where: { id: verif.ProfessionalProfile.user_id } },
      );
    }

    return verif;
  }

  async reject(id, rejection_reason) {
    const verif = await ProfessionalVerification.findByPk(id, {
      include: ProfessionalProfile,
    });
    if (!verif) throw new Error('Vérification introuvable.');

    await verif.update({ status: 'REJECTED', rejection_reason });

    if (verif.ProfessionalProfile) {
      await verif.ProfessionalProfile.update({ status: 'REJECTED' });
    }

    return verif;
  }
}

module.exports = new ProfessionalVerificationService();
