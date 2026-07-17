const BaseService = require('./baseService');
const MedicalRecord = require('../models/MedicalRecord');

class MedicalRecordService extends BaseService {
  constructor() {
    super(MedicalRecord);
  }

  async createOrUpdate(userId, data, dependentId) {
    const recordData = {
      blood_group: data.blood_group,
      allergies: data.allergies,
      medical_history: data.medical_history,
      height: data.height,
      weight: data.weight,
      blood_pressure_systolic: data.blood_pressure_systolic,
      blood_pressure_diastolic: data.blood_pressure_diastolic,
      heart_rate: data.heart_rate,
      temperature: data.temperature,
      respiratory_rate: data.respiratory_rate,
      oxygen_saturation: data.oxygen_saturation,
      blood_sugar: data.blood_sugar,
      chronic_diseases: data.chronic_diseases,
      emergency_contact_name: data.emergency_contact_name,
      emergency_contact_phone: data.emergency_contact_phone,
      nationalite: data.nationalite,
      privacy_level: data.privacy_level || 'SHARED_MEDCONNECT',
    };

    if (dependentId) {
      recordData.dependent_id = dependentId;
    } else {
      recordData.user_id = userId;
    }

    const where = dependentId ? { dependent_id: dependentId } : { user_id: userId };
    const existing = await MedicalRecord.findOne({ where });

    if (existing) {
      await existing.update(recordData);
      return { record: existing, created: false };
    }

    const record = await MedicalRecord.create(recordData);
    return { record, created: true };
  }

  async getByUser(userId) {
    const record = await MedicalRecord.findOne({ where: { user_id: userId } });
    if (!record) throw new Error('Aucun dossier médical.');
    return record;
  }

  async getByDependent(dependentId) {
    const record = await MedicalRecord.findOne({ where: { dependent_id: dependentId } });
    return record;
  }

  async getByIdWithPrivacy(id, userId) {
    const record = await MedicalRecord.findByPk(id);
    if (!record) throw new Error('Dossier introuvable.');

    if (record.privacy_level === 'PRIVATE' && record.user_id !== userId) {
      throw new Error('Accès refusé.');
    }

    return record;
  }

  async getByUserWithPrivacy(userId, viewerId) {
    const record = await MedicalRecord.findOne({ where: { user_id: userId } });
    if (!record) throw new Error('Aucun dossier médical.');

    if (record.user_id === viewerId) return record;
    if (record.privacy_level === 'PUBLIC') return record;
    if (record.privacy_level === 'SHARED_MEDCONNECT') return record;

    throw new Error('Accès refusé. Le dossier est privé.');
  }

  async getPublic() {
    return MedicalRecord.findAll({
      where: { privacy_level: ['SHARED_MEDCONNECT', 'PUBLIC'] },
    });
  }
}

module.exports = new MedicalRecordService();
