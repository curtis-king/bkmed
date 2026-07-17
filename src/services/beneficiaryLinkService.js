const BaseService = require('./baseService');
const BeneficiaryLink = require('../models/BeneficiaryLink');
const User = require('../models/User');

class BeneficiaryLinkService extends BaseService {
  constructor() {
    super(BeneficiaryLink);
  }

  async create(data, userId) {
    const { beneficiary_user_id, relationship_type } = data;

    const beneficiary = await User.findByPk(beneficiary_user_id);
    if (!beneficiary) throw new Error('Bénéficiaire introuvable.');

    return BeneficiaryLink.create({
      responsible_user_id: userId,
      beneficiary_user_id,
      relationship_type,
    });
  }

  async getUserBeneficiaries(userId) {
    return BeneficiaryLink.findAll({
      where: { responsible_user_id: userId, active: true },
      include: { model: User, as: 'BeneficiaryUser', attributes: { exclude: ['password'] } },
    });
  }

  async deactivate(id, userId) {
    const link = await BeneficiaryLink.findOne({
      where: { id, responsible_user_id: userId },
    });
    if (!link) throw new Error('Lien introuvable.');

    await link.update({ active: false });
    return link;
  }

  async getAllWithUsers() {
    return BeneficiaryLink.findAll({
      include: [
        { model: User, as: 'ResponsibleUser', attributes: { exclude: ['password'] } },
        { model: User, as: 'BeneficiaryUser', attributes: { exclude: ['password'] } },
      ],
    });
  }
}

module.exports = new BeneficiaryLinkService();
