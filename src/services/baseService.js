class BaseService {
  constructor(model) {
    this.model = model;
  }

  async getAll(where = {}, options = {}) {
    return this.model.findAll({ where, ...options });
  }

  async getById(id, options = {}) {
    const record = await this.model.findByPk(id, options);
    if (!record) throw new Error('Enregistrement introuvable.');
    return record;
  }

  async create(data) {
    return this.model.create(data);
  }

  async update(id, data, options = {}) {
    const record = await this.getById(id);
    await record.update(data);
    return record;
  }

  async delete(id) {
    const record = await this.getById(id);
    await record.destroy();
    return record;
  }

  async findOne(where, options = {}) {
    return this.model.findOne({ where, ...options });
  }

  async findOrCreate(where, defaults = {}) {
    return this.model.findOrCreate({ where, defaults });
  }

  async upsert(data) {
    return this.model.upsert(data);
  }
}

module.exports = BaseService;
