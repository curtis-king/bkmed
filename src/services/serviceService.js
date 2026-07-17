const BaseService = require('./baseService');
const Service = require('../models/Service');

class ServiceService extends BaseService {
  constructor() {
    super(Service);
  }

  async getAllActive() {
    return this.getAll({ active: true });
  }

  async toggleActive(id) {
    const service = await this.getById(id);
    await service.update({ active: !service.active });
    return service;
  }
}

module.exports = new ServiceService();
