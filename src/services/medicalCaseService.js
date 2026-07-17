const BaseService = require('./baseService');
const MedicalCase = require('../models/MedicalCase');
const MedicalRequest = require('../models/MedicalRequest');

class MedicalCaseService extends BaseService {
  constructor() {
    super(MedicalCase);
  }

  async create(data, doctorId) {
    const { request_id, symptoms, diagnosis, treatment, observations } = data;

    const request = await MedicalRequest.findByPk(request_id);
    if (!request) throw new Error('Demande introuvable.');

    const existant = await MedicalCase.findOne({ where: { request_id } });
    if (existant) throw new Error('Un dossier médical existe déjà pour cette demande.');

    const medCase = await MedicalCase.create({
      request_id,
      doctor_id: doctorId,
      symptoms,
      diagnosis,
      treatment,
      observations,
    });

    await request.update({ status: 'COMPLETED' });

    return medCase;
  }

  async getDoctorCases(doctorId) {
    return MedicalCase.findAll({
      where: { doctor_id: doctorId },
      include: MedicalRequest,
      order: [['id', 'DESC']],
    });
  }

  async getByIdWithDetails(id) {
    const medCase = await MedicalCase.findByPk(id, { include: MedicalRequest });
    if (!medCase) throw new Error('Dossier médical introuvable.');
    return medCase;
  }

  async updateByDoctor(id, doctorId, data) {
    const medCase = await MedicalCase.findOne({
      where: { id, doctor_id: doctorId },
    });
    if (!medCase) throw new Error('Dossier médical introuvable.');
    await medCase.update(data);
    return medCase;
  }

  async getAllWithRequest() {
    return MedicalCase.findAll({ include: MedicalRequest });
  }
}

module.exports = new MedicalCaseService();
