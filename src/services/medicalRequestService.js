const BaseService = require('./baseService');
const MedicalRequest = require('../models/MedicalRequest');
const Service = require('../models/Service');
const Assignment = require('../models/Assignment');
const MedicalCase = require('../models/MedicalCase');
const User = require('../models/User');
const Role = require('../models/Role');
const Dependent = require('../models/Dependent');
const Payment = require('../models/Payment');
const RequestMessage = require('../models/RequestMessage');
const subscriptionService = require('./subscriptionService');
const { getIO } = require('../socket');

class MedicalRequestService extends BaseService {
  constructor() {
    super(MedicalRequest);
  }

  async create(data, userId) {
    const { beneficiary_id, service_id, dependent_id, incident_type, reason, description, address, latitude, longitude } = data;

    const service = await Service.findOne({ where: { id: service_id, active: true } });
    if (!service) throw new Error('Service invalide ou inactif.');

    const access = await subscriptionService.checkAccess(userId);
    if (!access.allowed) {
      throw new Error('Accès refusé : ' + access.reason);
    }

    const request = await MedicalRequest.create({
      request_number: `REQ-${Date.now()}`,
      created_by: userId,
      beneficiary_id: dependent_id ? null : (beneficiary_id || userId),
      dependent_id: dependent_id || null,
      service_id,
      incident_type,
      reason,
      description,
      address,
      latitude,
      longitude,
    });

    if (!access.isOutOfQuota) {
      await subscriptionService.incrementQuota(userId);
    }

    const io = getIO();
    io.to(`user:${request.created_by}`).emit('medical_request:created', request);
    io.to('admins').emit('medical_request:created', request);

    const notifService = require('./notificationService');
    notifService.getAdminIds().then((ids) => {
      if (ids.length) notifService.create(ids, 'medical_request:created', 'medical_request', request.id, `Nouvelle demande: ${service.name || 'Service'}`);
    }).catch(() => {});

    return request;
  }

  async getUserRequests(userId) {
    return MedicalRequest.findAll({
      where: { created_by: userId },
      include: [
        Service,
        { model: Assignment, include: [{ model: User, as: 'Agent', attributes: { exclude: ['password'] } }] },
        { model: Payment, required: false },
        { model: Dependent, as: 'BeneficiaryDependent', required: false },
      ],
      order: [['id', 'DESC']],
    });
  }

  async getByIdWithDetails(id, userId, userRoles) {
    const request = await MedicalRequest.findByPk(id, {
      include: [
        Service,
        { model: Assignment, include: [{ model: User, as: 'Agent', attributes: { exclude: ['password'] } }] },
        { model: MedicalCase, include: [{ model: require('../models/Prescription'), include: [require('../models/PrescriptionItem')] }] },
        { model: Payment, required: false },
        { model: RequestMessage, include: [{ model: User, as: 'Sender', attributes: { exclude: ['password'] } }], order: [['id', 'ASC']] },
        { model: require('../models/Appointment'), include: [{ model: require('../models/User'), as: 'Creator', attributes: { exclude: ['password'] } }] },
        { model: require('../models/Recommendation'), include: [
          { model: require('../models/User'), as: 'Creator', attributes: { exclude: ['password'] } },
          { model: require('../models/Attachment'), as: 'attachments' },
        ]},
        { model: Dependent, as: 'BeneficiaryDependent', required: false },
        { model: User, as: 'Creator', attributes: { exclude: ['password'] }, required: false },
        { model: User, as: 'Beneficiary', attributes: { exclude: ['password'] }, required: false },
        { model: User, as: 'Medecin', attributes: { exclude: ['password'] }, required: false },
      ],
    });
    if (!request) throw new Error('Demande introuvable.');

    const isCreator = request.created_by === userId;
    const isAdmin = userRoles.includes('ADMIN');
    const isAgent = userRoles.includes('AGENT_PROXIMITE');
    const assignments = request.Assignments || [];
    const isAssignedAgent = assignments.some(a => a.agent_id === userId);
    const isAssignedDoctor = userRoles.includes('MEDECIN') && (isAssignedAgent || request.medecin_id === userId);

    if (!isCreator && !isAdmin && !isAgent && !isAssignedDoctor && !isAssignedAgent) {
      throw new Error('Accès refusé.');
    }

    return request;
  }

  async getAllFiltered(status) {
    const where = status ? { status } : {};
    return MedicalRequest.findAll({
      where,
      include: [
        Service,
        { model: User, as: 'Creator', attributes: { exclude: ['password'] } },
        { model: User, as: 'Beneficiary', attributes: { exclude: ['password'] } },
        { model: Assignment, include: [{ model: User, as: 'Agent', attributes: { exclude: ['password'] } }] },
        { model: Payment, required: false },
        { model: Dependent, as: 'BeneficiaryDependent', required: false },
        { model: User, as: 'Medecin', attributes: { exclude: ['password'] }, required: false },
      ],
      order: [['id', 'DESC']],
    });
  }

  async changeStatus(id, status, adminNote = null) {
    const valides = ['SUBMITTED', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ASSIGNED', 'ON_ROUTE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!valides.includes(status)) {
      throw new Error(`Statut invalide. Valides: ${valides.join(', ')}`);
    }

    const request = await MedicalRequest.findByPk(id, { include: Service });
    if (!request) throw new Error('Demande introuvable.');

    const updateData = { status };
    if (adminNote !== null) updateData.admin_note = adminNote;

    await request.update(updateData);

    if (status === 'APPROVED' && request.Service?.price > 0) {
      const existingPayment = await Payment.findOne({ where: { request_id: request.id } });
      if (!existingPayment) {
        await Payment.create({
          payer_id: request.created_by,
          beneficiary_id: request.created_by,
          request_id: request.id,
          payment_type: 'SERVICE',
          method: 'CASH',
          amount: request.Service.price,
        });
      }
    }

    const io = getIO();
    io.to(`request:${request.id}`).emit('medical_request:status_changed', request);
    io.to(`user:${request.created_by}`).emit('medical_request:status_changed', request);

    const notifService = require('./notificationService');
    notifService.create(request.created_by, 'medical_request:status_changed', 'medical_request', request.id, `Demande #${request.request_number}: ${status}`).catch(() => {});

    return MedicalRequest.findByPk(request.id, {
      include: [
        Service,
        { model: Payment, required: false },
      ],
    });
  }

  async assign(id, agentId) {
    const request = await MedicalRequest.findByPk(id, { include: [Service] });
    if (!request) throw new Error('Demande introuvable.');

    const isDeliveryRequest = ['LIVRAISON', 'DELIVERY'].includes((request.Service?.code || '').toUpperCase())
      || (request.Service?.name || '').toLowerCase().includes('livraison')
      || (request.Service?.name || '').toLowerCase().includes('delivery');

    if (isDeliveryRequest) {
      const user = await User.findByPk(agentId, { include: [Role] });
      const hasLivreurRole = user?.Roles?.some((role) => role.name === 'LIVREUR');
      if (!hasLivreurRole) throw new Error('Cette demande de livraison ne peut être assignée qu’à un livreur.');
    }

    const existing = await Assignment.findOne({ where: { request_id: request.id } });
    if (existing) {
      await existing.update({ agent_id: agentId, assigned_at: new Date() });
    } else {
      await Assignment.create({ request_id: request.id, agent_id: agentId, assigned_at: new Date() });
    }
    await request.update({ status: 'ASSIGNED' });

    const io = getIO();
    io.to(`user:${agentId}`).emit('assignment:created', { request_id: request.id, agent_id: agentId });
    io.to(`user:${request.created_by}`).emit('medical_request:status_changed', request);

    const notifService = require('./notificationService');
    notifService.create(agentId, 'assignment:created', 'medical_request', request.id, `Nouvelle affectation - Demande #${request.request_number}`).catch(() => {});

    return Assignment.findOne({
      where: { request_id: request.id, agent_id: agentId },
      include: [{ model: User, as: 'Agent', attributes: { exclude: ['password'] } }],
    });
  }

  async assignMedecin(id, medecinId) {
    const request = await MedicalRequest.findByPk(id);
    if (!request) throw new Error('Demande introuvable.');

    await request.update({ medecin_id: medecinId });

    const io = getIO();
    io.to(`user:${medecinId}`).emit('medical_request:assigned_medecin', { request_id: request.id, medecin_id: medecinId });
    io.to(`user:${request.created_by}`).emit('medical_request:status_changed', request);

    const notifService = require('./notificationService');
    notifService.create(medecinId, 'medical_request:assigned_medecin', 'medical_request', request.id, `Consultation assignée - Demande #${request.request_number}`).catch(() => {});
    notifService.create(request.created_by, 'medical_request:status_changed', 'medical_request', request.id, `Un médecin a été assigné à votre demande #${request.request_number}`).catch(() => {});

    return MedicalRequest.findByPk(request.id, {
      include: [
        { model: User, as: 'Medecin', attributes: { exclude: ['password'] } },
        { model: Service },
      ],
    });
  }

  async getMedecinRequests(medecinId) {
    return MedicalRequest.findAll({
      where: { medecin_id: medecinId },
      include: [
        Service,
        { model: User, as: 'Creator', attributes: { exclude: ['password'] } },
        { model: User, as: 'Beneficiary', attributes: { exclude: ['password'] } },
        { model: Assignment, include: [{ model: User, as: 'Agent', attributes: { exclude: ['password'] } }] },
        { model: Payment, required: false },
        { model: Dependent, as: 'BeneficiaryDependent', required: false },
      ],
      order: [['id', 'DESC']],
    });
  }

  async getLivreurRequests(livreurId) {
    return MedicalRequest.findAll({
      include: [
        Service,
        { model: User, as: 'Creator', attributes: { exclude: ['password'] } },
        { model: User, as: 'Beneficiary', attributes: { exclude: ['password'] } },
        { model: Assignment, required: true, where: { agent_id: livreurId }, include: [{ model: User, as: 'Agent', attributes: { exclude: ['password'] } }] },
        { model: Payment, required: false },
        { model: Dependent, as: 'BeneficiaryDependent', required: false },
      ],
      order: [['id', 'DESC']],
    });
  }
}

module.exports = new MedicalRequestService();
