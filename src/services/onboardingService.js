const MedicalRecord = require('../models/MedicalRecord');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Role = require('../models/Role');
const IdentityDocument = require('../models/IdentityDocument');

const PROFESSIONAL_ROLES = ['MEDECIN', 'AGENT_PROXIMITE', 'LIVREUR'];

class OnboardingService {
  async getStatus(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'is_active', 'verification_level'],
      include: [{ model: Role, attributes: ['name'], through: { attributes: [] } }],
    });

    const roles = (user?.Roles || []).map((r) => r.name);
    const isProfessional = roles.some((r) => PROFESSIONAL_ROLES.includes(r));

    if (isProfessional) {
      return {
        allDone: true,
        blocked: false,
        isProfessional: true,
        steps: {
          medical_record: { done: true, label: 'Dossier médical', route: '/dashboard/patient/dossier-medical', order: 1 },
          identity_verification: { done: true, label: 'Vérification d\'identité', route: '/dashboard/patient/documents', order: 2 },
          registration_payment: { done: true, label: 'Frais d\'inscription', route: '/dashboard/patient/paiements', order: 3 },
        },
        is_active: true,
        verification_level: user?.verification_level,
        medicalRecord: { exists: true },
      };
    }

    const medicalRecord = await MedicalRecord.findOne({ where: { user_id: userId } });
    const hasMedicalRecord = !!medicalRecord;
    const dossierComplete = hasMedicalRecord && !!(
      medicalRecord.blood_group &&
      medicalRecord.height &&
      medicalRecord.weight
    );

    const registrationPayment = await Payment.findOne({
      where: { payer_id: userId, payment_type: 'REGISTRATION', status: 'CONFIRMED' },
    });
    const registrationPaid = !!registrationPayment;

    const pendingRegistrationPayment = await Payment.findOne({
      where: { payer_id: userId, payment_type: 'REGISTRATION', status: 'PENDING' },
    });
    const hasPendingRegistrationPayment = !!pendingRegistrationPayment;

    const identityDocs = await IdentityDocument.findAll({ where: { user_id: userId } });
    const hasIdentityDocs = identityDocs.length > 0;
    const identityDocStatus = hasIdentityDocs ? identityDocs[0].status : null;

    const steps = {
      medical_record: {
        done: dossierComplete,
        label: 'Compléter votre dossier médical',
        route: '/dashboard/patient/dossier-medical',
        order: 1,
      },
      identity_verification: {
        done: user?.is_active === true,
        label: 'Fournir vos pièces d\'identité et attendre la validation',
        route: '/dashboard/patient/documents',
        order: 2,
        blocked: !dossierComplete,
        hasDocs: hasIdentityDocs,
        status: identityDocStatus,
      },
      registration_payment: {
        done: registrationPaid,
        label: 'Payer les frais d\'inscription (5 000 FCFA)',
        route: '/dashboard/patient/paiements',
        order: 3,
        hasPending: hasPendingRegistrationPayment,
        blocked: !dossierComplete || user?.is_active !== true,
      },
    };

    const allDone = registrationPaid && user?.is_active === true && dossierComplete;
    const blocked = !allDone;

    return {
      allDone,
      blocked,
      isProfessional: false,
      steps,
      is_active: user?.is_active === true,
      verification_level: user?.verification_level,
      medicalRecord: medicalRecord
        ? { ...medicalRecord.toJSON(), exists: true }
        : { exists: false },
    };
  }

  async checkAccess(userId) {
    const status = await this.getStatus(userId);
    if (status.isProfessional) return { allowed: true };
    if (!status.steps.medical_record.done) {
      return { allowed: false, reason: 'Vous devez d\'abord compléter votre dossier médical.', step: 'medical_record' };
    }
    if (!status.steps.identity_verification.done) {
      return { allowed: false, reason: 'Vous devez d\'abord fournir vos pièces d\'identité et attendre la validation.', step: 'identity_verification' };
    }
    if (!status.steps.registration_payment.done) {
      return { allowed: false, reason: 'Vous devez d\'abord payer les frais d\'inscription.', step: 'registration_payment' };
    }
    return { allowed: true };
  }
}

module.exports = new OnboardingService();