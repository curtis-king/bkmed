const BaseService = require('./baseService');
const Vehicle = require('../models/Vehicle');
const ProfessionalProfile = require('../models/ProfessionalProfile');

class VehicleService extends BaseService {
  constructor() {
    super(Vehicle);
  }

  async create(data, userId) {
    const { professional_profile_id, vehicle_type, registration_number, brand, model } = data;

    if (professional_profile_id) {
      const profil = await ProfessionalProfile.findOne({
        where: { id: professional_profile_id, user_id: userId },
      });
      if (!profil) throw new Error('Profil professionnel introuvable.');
    }

    return Vehicle.create({
      professional_profile_id: professional_profile_id || null,
      vehicle_type,
      registration_number,
      brand,
      model,
    });
  }

  async createPatientVehicle(data, userId, identityDocPath, supportingDocPath,
    drivingLicensePath = null, insuranceCertPath = null, registrationCertPath = null) {
    const { vehicle_type, registration_number, brand, model } = data;

    const existing = await Vehicle.findOne({ where: { registration_number } });
    if (existing) throw new Error('Ce numéro de matricule est déjà enregistré.');

    return Vehicle.create({
      user_id: userId,
      vehicle_type,
      registration_number,
      brand,
      model,
      identity_document_path: identityDocPath,
      supporting_document_path: supportingDocPath,
      driving_license_path: drivingLicensePath,
      insurance_cert_path: insuranceCertPath,
      registration_cert_path: registrationCertPath,
    });
  }

  async getUserVehicles(userId) {
    const profVehicles = await ProfessionalProfile.findAll({
      where: { user_id: userId },
      include: Vehicle,
    });

    const patientVehicles = await Vehicle.findAll({
      where: { user_id: userId },
    });

    const all = [];
    for (const pv of profVehicles) {
      if (pv.Vehicles) all.push(...pv.Vehicles);
    }
    all.push(...patientVehicles);
    return all;
  }

  async getMyVehicles(userId) {
    return Vehicle.findAll({
      where: { user_id: userId },
      order: [['id', 'DESC']],
    });
  }

  async getMyVehicle(id, userId) {
    const vehicle = await Vehicle.findOne({ where: { id, user_id: userId } });
    if (!vehicle) throw new Error('Véhicule introuvable.');
    return vehicle;
  }

  async update(id, data, userId) {
    const vehicle = await Vehicle.findOne({
      where: { id, user_id: userId },
    });
    if (!vehicle) throw new Error('Véhicule introuvable.');
    await vehicle.update(data);
    return vehicle;
  }

  async delete(id, userId) {
    const vehicle = await Vehicle.findOne({
      where: { id, user_id: userId },
    });
    if (!vehicle) throw new Error('Véhicule introuvable.');
    await vehicle.destroy();
  }

  async getAllWithProfiles() {
    return Vehicle.findAll({ include: ProfessionalProfile });
  }
}

module.exports = new VehicleService();
