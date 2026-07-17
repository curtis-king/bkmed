const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const BeneficiaryLink = require('../models/BeneficiaryLink');
const Payment = require('../models/Payment');
const Dependent = require('../models/Dependent');
const MedicalRecord = require('../models/MedicalRecord');
const Vehicle = require('../models/Vehicle');
const identityService = require('./identityService');
const medicalRecordService = require('./medicalRecordService');

const genererToken = (user, roles) => {
  return jwt.sign(
    {
      id: user.id,
      dossier_number: user.dossier_number,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      email: user.email,
      photo_profile: user.photo_profile,
      birth_date: user.birth_date,
      gender: user.gender,
      is_active: user.is_active,
      verification_level: user.verification_level,
      roles: roles.map((r) => r.name),
      pays: user.pays,
      departement_id: user.departement_id,
      arrondissement_id: user.arrondissement_id,
      adresse: user.adresse,
      latitude: user.latitude,
      longitude: user.longitude,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

class AuthService {
  async register(data) {
    const { first_name, last_name, email, password, phone, birth_date, gender, pays, departement_id, arrondissement_id, adresse, latitude, longitude } = data;

    const existant = await User.findOne({ where: { email } });
    if (existant) throw new Error('Cet email est déjà utilisé.');

    if (phone) {
      const phoneExists = await User.findOne({ where: { phone } });
      if (phoneExists) throw new Error('Ce numéro de téléphone est déjà utilisé.');
    }

    const user = await User.create({
      first_name,
      last_name,
      email,
      password,
      phone,
      birth_date,
      gender,
      pays,
      departement_id,
      arrondissement_id,
      adresse,
      latitude,
      longitude,
      is_active: true,
      dossier_number: `DOS-${(first_name?.[0] || '').toUpperCase()}${(last_name?.[0] || '').toUpperCase()}-${Date.now()}`,
    });

    const rolePatient = await Role.findOne({ where: { name: 'PATIENT' } });
    await user.addRole(rolePatient);

    const roles = await user.getRoles();
    const token = genererToken(user, roles);

    const { password: _, ...userData } = user.toJSON();
    return {
      token,
      user: { ...userData, roles: roles.map((r) => r.name) },
    };
  }

  async login(email, password) {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error('Email ou mot de passe incorrect.');

    const valide = await user.verifierMotDePasse(password);
    if (!valide) throw new Error('Email ou mot de passe incorrect.');

    const roles = await user.getRoles();
    const token = genererToken(user, roles);

    const { password: _, ...userData } = user.toJSON();
    return {
      token,
      user: { ...userData, roles: roles.map((r) => r.name) },
    };
  }

  async uploadPhoto(userId, filename) {
    const photoUrl = `/uploads/profils/${filename}`;
    await User.update({ photo_profile: photoUrl }, { where: { id: userId } });

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: Role,
    });
    const roles = await user.getRoles();
    const token = genererToken(user, roles);

    return { token, user };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('Utilisateur introuvable.');

    const valid = await user.verifierMotDePasse(currentPassword);
    if (!valid) throw new Error('Mot de passe actuel incorrect.');

    user.password = newPassword;
    await user.save();

    return { message: 'Mot de passe modifié avec succès.' };
  }

  async updateProfile(userId, data) {
    const allowedFields = ['first_name', 'last_name', 'phone', 'birth_date', 'gender', 'pays', 'departement_id', 'arrondissement_id', 'adresse', 'latitude', 'longitude'];
    const updates = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) updates[field] = data[field];
    }
    await User.update(updates, { where: { id: userId } });
    return this.getProfile(userId);
  }

  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: Role,
    });
    return user;
  }

  async getProfilComplet(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: Role,
    });

    const subscription = await Subscription.findOne({
      where: { user_id: userId, dependent_id: null },
      include: Plan,
      order: [['id', 'DESC']],
    });

    const plan = subscription ? await Plan.findByPk(subscription.plan_id) : null;

    const beneficiaries = await BeneficiaryLink.findAll({
      where: { responsible_user_id: userId, active: true },
      include: { model: User, as: 'BeneficiaryUser', attributes: { exclude: ['password'] } },
    });

    const payments = await Payment.findAll({
      where: { payer_id: userId },
      order: [['id', 'DESC']],
    });

    const dependents = await Dependent.findAll({
      where: { user_id: userId },
      include: [
        { model: User, as: 'linkedUser', attributes: ['id', 'email', 'first_name', 'last_name', 'dossier_number'] },
        { model: MedicalRecord, as: 'medicalRecord' },
      ],
      order: [['created_at', 'DESC']],
    });

    const dependentsWithSubs = [];
    let totalMonthlyBilling = 0;

    for (const dep of dependents) {
      const depSub = await Subscription.findOne({
        where: { dependent_id: dep.id },
        include: Plan,
        order: [['id', 'DESC']],
      });
      let depPayment = null;
      if (depSub) {
        depPayment = await Payment.findOne({
          where: { dependent_id: dep.id, subscription_id: depSub.id },
          order: [['id', 'DESC']],
        });
      }
      if (depSub?.status === 'ACTIVE' && depSub.Plan?.monthly_price) {
        totalMonthlyBilling += Number(depSub.Plan.monthly_price);
      }
      let depRemainingDays = null;
      if (depSub && depSub.end_date) {
        const now = new Date();
        const end = new Date(depSub.end_date);
        depRemainingDays = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
      }
      dependentsWithSubs.push({
        ...dep.toJSON(),
        subscription: depSub ? { ...depSub.toJSON(), remaining_days: depRemainingDays } : null,
        payment: depPayment,
      });
    }

    let remainingDays = null;
    if (subscription && subscription.end_date) {
      const now = new Date();
      const end = new Date(subscription.end_date);
      remainingDays = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    }

    if (subscription?.status === 'ACTIVE' && plan?.monthly_price) {
      totalMonthlyBilling += Number(plan.monthly_price);
    }

    const userData = user ? user.toJSON() : {};
    const quotaMax = plan?.monthly_coverage || 0;
    const quotaUsed = userData.quota_used || 0;
    const quotaRemaining = Math.max(0, quotaMax - quotaUsed);

    const vehicles = await Vehicle.findAll({
      where: { user_id: userId },
      order: [['id', 'DESC']],
    });

    return {
      user,
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.Plan,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        status: subscription.status,
        remaining_days: remainingDays,
      } : null,
      quota: {
        max: quotaMax,
        used: quotaUsed,
        remaining: quotaRemaining,
      },
      beneficiaries,
      payments,
      dependents: dependentsWithSubs,
      vehicles,
      total_monthly_billing: totalMonthlyBilling,
    };
  }
  async registerWithoutPassword(data, files) {
    const { first_name, last_name, email, phone, birth_date, gender, document_type, document_number, medicalData } = data;

    const existant = await User.findOne({ where: { email } });
    if (existant) throw new Error('Cet email est déjà utilisé.');

    if (phone) {
      const phoneExists = await User.findOne({ where: { phone } });
      if (phoneExists) throw new Error('Ce numéro de téléphone est déjà utilisé.');
    }

    const user = await User.create({
      first_name,
      last_name,
      email,
      phone,
      birth_date,
      gender,
      is_active: false,
      verification_level: 'UNVERIFIED',
      dossier_number: `PENDING-${(first_name?.[0] || '').toUpperCase()}${(last_name?.[0] || '').toUpperCase()}-${Date.now()}`,
    });

    const rolePatient = await Role.findOne({ where: { name: 'PATIENT' } });
    await user.addRole(rolePatient);

    if (medicalData && Object.keys(medicalData).length > 0) {
      await medicalRecordService.createOrUpdate(user.id, medicalData);
    }

    if (document_type && document_number) {
      await identityService.createWithFiles(
        { document_type, document_number },
        user.id,
        files || {}
      );
    }

    const { password: _, ...userData } = user.toJSON();
    return { user: { ...userData, roles: ['PATIENT'] } };
  }
}

module.exports = new AuthService();
