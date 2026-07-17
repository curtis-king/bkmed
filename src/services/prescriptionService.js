const BaseService = require('./baseService');
const Prescription = require('../models/Prescription');
const PrescriptionItem = require('../models/PrescriptionItem');
const MedicalCase = require('../models/MedicalCase');

class PrescriptionService extends BaseService {
  constructor() {
    super(Prescription);
  }

  async createWithItems(data) {
    const { medical_case_id, items } = data;

    const medCase = await MedicalCase.findByPk(medical_case_id);
    if (!medCase) throw new Error('Dossier médical introuvable.');

    const prescription = await Prescription.create({ medical_case_id });

    if (items && items.length) {
      const prescriptionItems = items.map(item => ({
        ...item,
        prescription_id: prescription.id,
      }));
      await PrescriptionItem.bulkCreate(prescriptionItems);
    }

    return Prescription.findByPk(prescription.id, { include: PrescriptionItem });
  }

  async getByIdWithDetails(id) {
    const prescription = await Prescription.findByPk(id, {
      include: [PrescriptionItem, MedicalCase],
    });
    if (!prescription) throw new Error('Prescription introuvable.');
    return prescription;
  }

  async addItem(prescriptionId, itemData) {
    const prescription = await Prescription.findByPk(prescriptionId);
    if (!prescription) throw new Error('Prescription introuvable.');

    return PrescriptionItem.create({
      prescription_id: prescription.id,
      ...itemData,
    });
  }

  async deleteItem(itemId) {
    const item = await PrescriptionItem.findOne({
      where: { id: itemId },
      include: Prescription,
    });
    if (!item) throw new Error('Élément introuvable.');
    await item.destroy();
  }

  async getAllWithDetails() {
    return Prescription.findAll({
      include: [PrescriptionItem, MedicalCase],
    });
  }
}

module.exports = new PrescriptionService();
