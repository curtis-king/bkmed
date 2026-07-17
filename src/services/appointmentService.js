const BaseService = require('./baseService');
const Appointment = require('../models/Appointment');
const MedicalRequest = require('../models/MedicalRequest');
const User = require('../models/User');

class AppointmentService extends BaseService {
  constructor() {
    super(Appointment);
  }

  async create(data, userId, roles) {
    const request = await MedicalRequest.findByPk(data.request_id);
    if (!request) throw new Error('Demande introuvable.');

    const isMedecin = roles.includes('MEDECIN');
    const isPatient = roles.includes('PATIENT');

    if (!isMedecin && !isPatient) throw new Error('Seuls les médecins et patients peuvent créer des rendez-vous.');

    if (isPatient) {
      const existing = await Appointment.findOne({
        where: {
          request_id: data.request_id,
          proposed_by: 'PATIENT',
          status: 'SCHEDULED',
        },
      });
      if (existing) throw new Error('Vous avez déjà une demande de rendez-vous en attente pour cette demande.');
    }

    const appointment = await Appointment.create({
      request_id: data.request_id,
      title: data.title || (isMedecin ? 'Consultation médicale' : 'Demande de rendez-vous'),
      date: data.date || null,
      location: data.location,
      notes: data.notes,
      created_by: userId,
      proposed_by: isMedecin ? 'MEDECIN' : 'PATIENT',
    });

    const full = await Appointment.findByPk(appointment.id, {
      include: [
        { model: User, as: 'Creator', attributes: { exclude: ['password'] } },
        { model: MedicalRequest, include: [{ model: User, as: 'Creator', attributes: { exclude: ['password'] } }] },
      ],
    });

    const { getIO } = require('../socket');
    const io = getIO();
    io.to(`request:${data.request_id}`).emit('appointment:created', full);
    io.to(`user:${request.created_by}`).emit('appointment:created', full);
    if (request.medecin_id) {
      io.to(`user:${request.medecin_id}`).emit('appointment:created', full);
    }

    const notifService = require('./notificationService');
    const targets = [request.created_by];
    if (request.medecin_id) targets.push(request.medecin_id);
    notifService.create(targets, 'appointment:created', 'appointment', appointment.id, `Nouveau rendez-vous: ${appointment.title || 'Rendez-vous'}`).catch(() => {});

    return full;
  }

  async getByRequest(requestId) {
    return Appointment.findAll({
      where: { request_id: requestId },
      include: [
        { model: User, as: 'Creator', attributes: { exclude: ['password'] } },
      ],
      order: [['date', 'DESC']],
    });
  }

  async updateStatus(id, status, userId, roles) {
    const appointment = await Appointment.findByPk(id);
    if (!appointment) throw new Error('Rendez-vous introuvable.');

    const isMedecin = roles.includes('MEDECIN');
    const isPatient = roles.includes('PATIENT');
    const isCreator = appointment.created_by === userId;

    const allowedTransitions = {
      SCHEDULED: [],
      CONFIRMED: ['COMPLETED', 'CANCELLED'],
      CANCELLED: [],
      COMPLETED: [],
    };

    if (appointment.status === 'SCHEDULED') {
      if (status === 'CONFIRMED' && (isPatient || isMedecin)) {
      } else if (status === 'CANCELLED' && (isCreator || isMedecin)) {
      } else {
        throw new Error('Action non autorisée pour ce rendez-vous.');
      }
    } else if (status === 'COMPLETED' && appointment.status === 'CONFIRMED' && isMedecin) {
    } else if (status === 'CANCELLED' && (appointment.status === 'CONFIRMED' || appointment.status === 'SCHEDULED') && (isCreator || isMedecin)) {
    } else {
      if (!allowedTransitions[appointment.status]?.includes(status)) {
        throw new Error(`Transition de ${appointment.status} vers ${status} non autorisée.`);
      }
      if (status === 'COMPLETED' && !isMedecin) throw new Error('Seul le médecin peut terminer un rendez-vous.');
      if (status === 'CANCELLED' && !isCreator && !isMedecin) throw new Error('Seul le créateur ou un médecin peut annuler.');
    }

    await appointment.update({ status });

    const full = await Appointment.findByPk(appointment.id, {
      include: [
        { model: User, as: 'Creator', attributes: { exclude: ['password'] } },
        { model: MedicalRequest, include: [{ model: User, as: 'Creator', attributes: { exclude: ['password'] } }] },
      ],
    });

    const request = await MedicalRequest.findByPk(appointment.request_id);
    if (request) {
      const { getIO } = require('../socket');
      const io = getIO();
      io.to(`request:${appointment.request_id}`).emit('appointment:status_changed', full);
      io.to(`user:${request.created_by}`).emit('appointment:status_changed', full);
      if (request.medecin_id) {
        io.to(`user:${request.medecin_id}`).emit('appointment:status_changed', full);
      }

      const notifService = require('./notificationService');
      const targets = [request.created_by];
      if (request.medecin_id) targets.push(request.medecin_id);
      notifService.create(targets, 'appointment:status_changed', 'appointment', appointment.id, `Rendez-vous "${appointment.title || ''}" : ${status}`).catch(() => {});
    }

    return full;
  }

  async proposeNewDate(id, newDate, userId, roles) {
    const appointment = await Appointment.findByPk(id);
    if (!appointment) throw new Error('Rendez-vous introuvable.');

    if (appointment.status !== 'SCHEDULED') {
      throw new Error('Seuls les rendez-vous planifiés peuvent être négociés.');
    }

    const isMedecin = roles.includes('MEDECIN');
    const isPatient = roles.includes('PATIENT');

    if (appointment.proposed_by === 'MEDECIN' && !isPatient) {
      throw new Error('Seul le patient peut répondre à cette proposition.');
    }
    if (appointment.proposed_by === 'PATIENT' && !isMedecin) {
      throw new Error('Seul le médecin peut répondre à cette proposition.');
    }

    await appointment.update({
      date: newDate,
      proposed_by: isMedecin ? 'MEDECIN' : 'PATIENT',
    });

    const full = await Appointment.findByPk(appointment.id, {
      include: [
        { model: User, as: 'Creator', attributes: { exclude: ['password'] } },
        { model: MedicalRequest, include: [{ model: User, as: 'Creator', attributes: { exclude: ['password'] } }] },
      ],
    });

    const request = await MedicalRequest.findByPk(appointment.request_id);
    if (request) {
      const { getIO } = require('../socket');
      const io = getIO();
      io.to(`request:${appointment.request_id}`).emit('appointment:date_proposed', full);
      io.to(`user:${request.created_by}`).emit('appointment:date_proposed', full);
      if (request.medecin_id) {
        io.to(`user:${request.medecin_id}`).emit('appointment:date_proposed', full);
      }
    }

    return full;
  }

  async getMyAppointments(userId, roles) {
    const Service = require('../models/Service');

    const where = roles.includes('MEDECIN')
      ? { '$MedicalRequest.medecin_id$': userId }
      : { '$MedicalRequest.created_by$': userId };

    return Appointment.findAll({
      where,
      include: [
        { model: User, as: 'Creator', attributes: { exclude: ['password'] } },
        { model: MedicalRequest, include: [
          { model: Service },
          { model: User, as: 'Creator', attributes: { exclude: ['password'] } },
        ] },
      ],
      order: [['date', 'DESC']],
    });
  }
}

module.exports = new AppointmentService();
