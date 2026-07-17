const BaseService = require('./baseService');
const Sinistre = require('../models/Sinistre');
const Vehicle = require('../models/Vehicle');

class SinistreService extends BaseService {
  constructor() {
    super(Sinistre);
  }

  async create(data, userId) {
    const { vehicle_id, incident_type, incident_date, location, description } = data;

    if (vehicle_id) {
      const vehicle = await Vehicle.findOne({ where: { id: vehicle_id, user_id: userId } });
      if (!vehicle) throw new Error('Véhicule introuvable.');
    }

    return Sinistre.create({
      user_id: userId,
      vehicle_id: vehicle_id || null,
      incident_type,
      incident_date,
      location,
      description,
      status: 'SUBMITTED',
    });
  }

  async getMySinistres(userId) {
    return Sinistre.findAll({
      where: { user_id: userId },
      include: [Vehicle],
      order: [['created_at', 'DESC']],
    });
  }

  async getMySinistre(id, userId) {
    const sinistre = await Sinistre.findOne({
      where: { id, user_id: userId },
      include: [Vehicle],
    });
    if (!sinistre) throw new Error('Sinistre introuvable.');
    return sinistre;
  }

  async updateStatus(id, status, userId, isAdmin = false) {
    const where = isAdmin ? { id } : { id, user_id: userId };
    const sinistre = await Sinistre.findOne({ where });
    if (!sinistre) throw new Error('Sinistre introuvable.');
    await sinistre.update({ status });
    return sinistre;
  }

  async cancel(id, userId) {
    const sinistre = await Sinistre.findOne({ where: { id, user_id: userId } });
    if (!sinistre) throw new Error('Sinistre introuvable.');
    if (sinistre.status !== 'SUBMITTED') throw new Error('Seuls les sinistres soumis peuvent être annulés.');
    await sinistre.update({ status: 'CANCELLED' });
    return sinistre;
  }

  async getAll() {
    return Sinistre.findAll({
      include: [Vehicle],
      order: [['created_at', 'DESC']],
    });
  }
}

module.exports = new SinistreService();
