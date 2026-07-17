const BaseService = require('./baseService');
const Plan = require('../models/Plan');

class PlanService extends BaseService {
  constructor() {
    super(Plan);
  }
}

module.exports = new PlanService();
