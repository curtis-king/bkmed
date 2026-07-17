const BaseService = require('./baseService');
const IdentityDocument = require('../models/IdentityDocument');
const User = require('../models/User');
const emailService = require('./emailService');
const { Op } = require('sequelize');

class IdentityService extends BaseService {
  constructor() {
    super(IdentityDocument);
  }

  async create(data, userId) {
    const { document_type, document_number } = data;

    const existant = await IdentityDocument.findOne({ where: { document_number } });
    if (existant) throw new Error('Ce numéro de document existe déjà.');

    return IdentityDocument.create({
      user_id: userId,
      document_type,
      document_number,
    });
  }

  async uploadFiles(id, userId, files) {
    const doc = await IdentityDocument.findOne({
      where: { id, user_id: userId },
    });
    if (!doc) throw new Error('Document introuvable.');

    const updates = {};
    if (files?.front) updates.front_file = `/uploads/documents/${files.front[0].filename}`;
    if (files?.back) updates.back_file = `/uploads/documents/${files.back[0].filename}`;
    if (files?.selfie) updates.selfie_file = `/uploads/documents/${files.selfie[0].filename}`;

    await doc.update(updates);
    return doc;
  }

  async createWithFiles(data, userId, files) {
    const { document_type, document_number } = data;

    const existant = await IdentityDocument.findOne({ where: { document_number } });
    if (existant) throw new Error('Ce numéro de document existe déjà.');

    const docData = {
      user_id: userId,
      document_type,
      document_number,
      forgery_check_status: 'PENDING_FORGERY_CHECK',
    };
    if (files?.front) docData.front_file = `/uploads/documents/${files.front[0].filename}`;
    if (files?.back) docData.back_file = `/uploads/documents/${files.back[0].filename}`;
    if (files?.selfie) docData.selfie_file = `/uploads/documents/${files.selfie[0].filename}`;

    return IdentityDocument.create(docData);
  }

  async getUserDocuments(userId) {
    return IdentityDocument.findAll({ where: { user_id: userId } });
  }

  async getUserDocumentsByUserId(userId) {
    return IdentityDocument.findAll({ where: { user_id: userId } });
  }

  async getAllWithUser() {
    return IdentityDocument.findAll({ include: User });
  }

  async approve(id) {
    const doc = await IdentityDocument.findByPk(id);
    if (!doc) throw new Error('Document introuvable.');

    await doc.update({ status: 'APPROVED', rejection_reason: null });

    await this._checkAndUpdateUserActivation(doc.user_id);

    const user = await User.findByPk(doc.user_id);
    if (user?.email) {
      emailService.sendIdentityApproved(user, doc);
    }

    return doc;
  }

  async reject(id, reason = null) {
    const doc = await IdentityDocument.findByPk(id);
    if (!doc) throw new Error('Document introuvable.');

    await doc.update({ status: 'REJECTED', rejection_reason: reason });

    await User.update(
      { verification_level: 'UNVERIFIED', is_active: false },
      { where: { id: doc.user_id } }
    );

    const user = await User.findByPk(doc.user_id);
    if (user?.email) {
      emailService.sendIdentityRejected(user, doc, reason);
    }

    return doc;
  }

  async approuverForgery(id) {
    const doc = await IdentityDocument.findByPk(id);
    if (!doc) throw new Error('Document introuvable.');

    await doc.update({ forgery_check_status: 'PASSED' });

    return doc;
  }

  async rejeterForgery(id, reason = null) {
    const doc = await IdentityDocument.findByPk(id);
    if (!doc) throw new Error('Document introuvable.');

    await doc.update({
      forgery_check_status: 'FAILED',
      status: 'REJECTED',
      rejection_reason: reason || 'Document suspecté de falsification',
    });

    await User.update(
      { verification_level: 'UNVERIFIED', is_active: false },
      { where: { id: doc.user_id } }
    );

    const user = await User.findByPk(doc.user_id);
    if (user?.email) {
      emailService.sendIdentityRejected(user, doc, reason);
    }

    return doc;
  }

  async getForgeryPending() {
    return IdentityDocument.findAll({
      where: { forgery_check_status: 'PENDING_FORGERY_CHECK' },
      include: User,
    });
  }

  async _checkAndUpdateUserActivation(userId) {
    const docs = await IdentityDocument.findAll({ where: { user_id: userId } });

    const allApproved = docs.length > 0 && docs.every((d) => d.status === 'APPROVED');

    if (allApproved) {
      await User.update(
        { verification_level: 'IDENTITY_VERIFIED', is_active: true },
        { where: { id: userId } }
      );
    } else {
      const anyRejected = docs.some((d) => d.status === 'REJECTED');
      await User.update(
        { verification_level: anyRejected ? 'UNVERIFIED' : 'IDENTITY_VERIFIED' },
        { where: { id: userId } }
      );
    }
  }
}

module.exports = new IdentityService();
