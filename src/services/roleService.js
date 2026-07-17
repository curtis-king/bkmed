const BaseService = require('./baseService');
const { Role } = require('../models');

class RoleService extends BaseService {
  constructor() {
    super(Role);
  }

  async createIfNotExists(name) {
    const [role] = await this.findOrCreate({ name });
    return role;
  }
}

module.exports = new RoleService();
