const Dependent = require('../models/Dependent');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
const MedicalRecord = require('../models/MedicalRecord');

class DependentService {
  async generateDossierNumber() {
    const count = await Dependent.count();
    return `DEP-${String(count + 1).padStart(6, '0')}`;
  }

  async create(data, userId) {
    const dossier_number = await this.generateDossierNumber();
    const dep = await Dependent.create({
      user_id: userId,
      dossier_number,
      first_name: data.first_name,
      last_name: data.last_name,
      birth_date: data.birth_date,
      gender: data.gender,
      phone: data.phone,
      relationship_type: data.relationship_type,
    });

    await MedicalRecord.create({
      dependent_id: dep.id,
      blood_group: data.blood_group || null,
      allergies: data.allergies || null,
      medical_history: data.medical_history || null,
      privacy_level: 'SHARED_MEDCONNECT',
    });

    if (data.email && data.password) {
      const existing = await User.findOne({ where: { email: data.email } });
      if (existing) throw new Error('Un compte avec cet email existe déjà.');

      const hashed = await bcrypt.hash(data.password, 10);
      const mr = await MedicalRecord.findOne({ where: { dependent_id: dep.id } });

      const user = await User.create({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: hashed,
        phone: data.phone || null,
        gender: data.gender || null,
        birth_date: data.birth_date || null,
        is_dependent: true,
        dependent_id: dep.id,
      });

      if (mr) {
        mr.user_id = user.id;
        mr.dependent_id = null;
        await mr.save();
      }

      const patientRole = await Role.findOne({ where: { name: 'PATIENT' } });
      if (patientRole) await user.addRole(patientRole);

      dep.linked_user_id = user.id;
      await dep.save();
    }

    return dep;
  }

  async getUserDependents(userId) {
    return Dependent.findAll({
      where: { user_id: userId },
      include: [{ model: MedicalRecord, as: 'medicalRecord' }],
      order: [['created_at', 'DESC']],
    });
  }

  async getById(id, userId) {
    const dep = await Dependent.findOne({
      where: { id, user_id: userId },
      include: [{ model: MedicalRecord, as: 'medicalRecord' }],
    });
    if (!dep) throw new Error('Personne à charge introuvable.');
    return dep;
  }

  async update(id, userId, data) {
    const dep = await Dependent.findOne({ where: { id, user_id: userId } });
    if (!dep) throw new Error('Personne à charge introuvable.');

    const { blood_group, allergies, medical_history, ...depFields } = data;

    await dep.update(depFields);

    if (blood_group || allergies || medical_history) {
      const existing = await MedicalRecord.findOne({ where: { dependent_id: dep.id } });
      if (existing) {
        await existing.update({
          blood_group: blood_group || null,
          allergies: allergies || null,
          medical_history: medical_history || null,
        });
      } else {
        await MedicalRecord.create({
          dependent_id: dep.id,
          blood_group: blood_group || null,
          allergies: allergies || null,
          medical_history: medical_history || null,
          privacy_level: 'SHARED_MEDCONNECT',
        });
      }
    }

    return dep;
  }

  async remove(id, userId) {
    const dep = await Dependent.findOne({ where: { id, user_id: userId } });
    if (!dep) throw new Error('Personne à charge introuvable.');
    await MedicalRecord.destroy({ where: { dependent_id: dep.id } });
    await dep.destroy();
    return dep;
  }

  async getDependentsWithSubscriptions(userId) {
    const dependents = await Dependent.findAll({
      where: { user_id: userId },
      include: [{ model: MedicalRecord, as: 'medicalRecord' }],
      order: [['created_at', 'DESC']],
    });

    const result = [];
    for (const dep of dependents) {
      const sub = await Subscription.findOne({
        where: { dependent_id: dep.id },
        include: Plan,
        order: [['id', 'DESC']],
      });
      result.push({ ...dep.toJSON(), subscription: sub || null });
    }
    return result;
  }
}

module.exports = new DependentService();
