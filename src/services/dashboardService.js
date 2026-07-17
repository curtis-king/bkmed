const { Op } = require('sequelize');
const db = require('../models');

const {
  User, Role, MedicalRequest, Payment, IdentityDocument,
  Appointment, Subscription, Assignment, RequestMessage,
} = db;

class DashboardService {
  async getStats() {
    const [roleRows] = await db.sequelize.query(`
      SELECT r.name, COUNT(ur.user_id) AS count
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      GROUP BY r.id, r.name
    `);

    const roleCounts = {};
    roleRows.forEach(r => { roleCounts[r.name] = parseInt(r.count, 10); });

    const [activeRoleRows] = await db.sequelize.query(`
      SELECT r.name, COUNT(DISTINCT ur.user_id) AS count
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      JOIN users u ON u.id = ur.user_id AND u.is_active = 1
      GROUP BY r.id, r.name
    `);

    const activeCounts = {};
    activeRoleRows.forEach(r => { activeCounts[r.name] = parseInt(r.count, 10); });

    const [occupiedRow] = await db.sequelize.query(`
      SELECT COUNT(DISTINCT a.agent_id) AS count
      FROM assignments a
      JOIN medical_requests mr ON mr.id = a.request_id
      WHERE mr.status NOT IN ('COMPLETED', 'CANCELLED')
    `);

    const [
      demandesEnAttente,
      demandesTerminees,
      verificationsEnAttente,
      verificationsApprouvees,
      verificationsRejetees,
      revenusTotal,
      abonnementsActifs,
    ] = await Promise.all([
      MedicalRequest.count({ where: { status: { [Op.in]: ['SUBMITTED', 'APPROVED', 'ASSIGNED', 'SUSPENDED'] } } }),
      MedicalRequest.count({ where: { status: { [Op.in]: ['COMPLETED', 'CANCELLED'] } } }),
      IdentityDocument.count({ where: { status: 'PENDING' } }),
      IdentityDocument.count({ where: { status: 'APPROVED' } }),
      IdentityDocument.count({ where: { status: 'REJECTED' } }),
      Payment.sum('amount', { where: { status: 'CONFIRMED' } }),
      Subscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    const patientsTotal = roleCounts['PATIENT'] || 0;
    const patientsActifs = activeCounts['PATIENT'] || 0;
    const medecinsTotal = roleCounts['MEDECIN'] || 0;
    const medecinsDisponibles = activeCounts['MEDECIN'] || 0;
    const agentsTotal = roleCounts['AGENT_PROXIMITE'] || 0;
    const agentsOccupes = parseInt(occupiedRow[0]?.count, 10) || 0;

    return {
      counts: {
        patients: { total: patientsTotal, actifs: patientsActifs },
        medecins: { total: medecinsTotal, disponibles: medecinsDisponibles },
        agents: { total: agentsTotal, occupes: agentsOccupes },
        demandes: { en_attente: demandesEnAttente, terminees: demandesTerminees },
        verifications: {
          en_attente: verificationsEnAttente,
          approuvees: verificationsApprouvees,
          rejetees: verificationsRejetees,
        },
        revenus: { total: revenusTotal || 0 },
        abonnements_actifs: abonnementsActifs,
      },
    };
  }

  async getPatientsPourAgent(limit = 20) {
    const patients = await User.findAll({
      include: [{
        model: Role,
        through: { attributes: [] },
        where: { name: 'PATIENT' },
        attributes: [],
      }, {
        model: db.IdentityDocument,
        attributes: ['status'],
        required: false,
        limit: 1,
        order: [['created_at', 'DESC']],
        separate: true,
      }],
      attributes: [
        'id', 'dossier_number', 'first_name', 'last_name', 'email', 'phone',
        'is_active', 'verification_level', 'created_at', 'quota_used',
      ],
      order: [['created_at', 'DESC']],
      limit,
    });

    const patientIds = patients.map(p => p.id);

    const [requestCounts] = await db.sequelize.query(`
      SELECT created_by,
        COUNT(*) AS total,
        SUM(CASE WHEN status NOT IN ('COMPLETED','CANCELLED') THEN 1 ELSE 0 END) AS actives
      FROM medical_requests
      WHERE created_by IN (:ids)
      GROUP BY created_by
    `, { replacements: { ids: patientIds } });

    const requestMap = {};
    requestCounts.forEach(r => {
      requestMap[r.created_by] = { total: parseInt(r.total, 10), actives: parseInt(r.actives, 10) };
    });

    return patients.map(p => {
      const doc = p.IdentityDocuments?.[0];
      const reqs = requestMap[p.id] || { total: 0, actives: 0 };
      return {
        id: p.id,
        dossier_number: p.dossier_number,
        nom_complet: `${p.first_name} ${p.last_name}`,
        email: p.email,
        phone: p.phone,
        is_active: p.is_active,
        verification_level: p.verification_level,
        date_inscription: p.created_at,
        quota_utilise: p.quota_used,
        demandes: reqs,
        verification_identite: doc ? { status: doc.status } : { status: 'AUCUN_DOCUMENT' },
      };
    });
  }

  async getAgentsPourGestion() {
    const agents = await User.findAll({
      include: [{
        model: Role,
        through: { attributes: [] },
        where: { name: 'AGENT_PROXIMITE' },
        attributes: [],
      }, {
        model: Assignment,
        as: 'Assignments',
        required: false,
        attributes: ['id', 'request_id', 'assigned_at'],
        include: [{
          model: MedicalRequest,
          attributes: ['id', 'request_number', 'status'],
        }],
        limit: 10,
        order: [['assigned_at', 'DESC']],
        separate: true,
      }],
      attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'is_active', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    return agents.map(a => {
      const assignments = a.Assignments || [];
      const actives = assignments.filter(
        as => as.MedicalRequest && !['COMPLETED', 'CANCELLED'].includes(as.MedicalRequest.status)
      );
      return {
        id: a.id,
        nom_complet: `${a.first_name} ${a.last_name}`,
        email: a.email,
        phone: a.phone,
        is_active: a.is_active,
        date_creation: a.created_at,
        assignments_actives: actives.length,
        assignments_total: assignments.length,
        statut: actives.length >= 3 ? 'occupé' : (a.is_active ? 'disponible' : 'inactif'),
        dernieres_missions: assignments.slice(0, 5).map(as => ({
          request_number: as.MedicalRequest?.request_number,
          statut_mission: as.MedicalRequest?.status,
          assigne_le: as.assigned_at,
        })),
      };
    });
  }

  async getTodaysAppointments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Appointment.findAll({
      where: {
        date: { [Op.gte]: today, [Op.lt]: tomorrow },
        status: { [Op.in]: ['SCHEDULED', 'CONFIRMED'] },
      },
      include: [
        { model: User, as: 'Creator', attributes: ['id', 'first_name', 'last_name'] },
        { model: MedicalRequest,
          attributes: ['id', 'request_number', 'status'],
          include: [
            { model: User, as: 'Medecin', attributes: ['id', 'first_name', 'last_name'] },
            { model: User, as: 'Beneficiary', attributes: ['id', 'first_name', 'last_name'] },
          ],
        },
      ],
      order: [['date', 'ASC']],
    });
  }

  async getRecentActivities(limit = 15) {
    const [demandes, paiements, documents, rendezvous, affectations, inscriptions] = await Promise.all([
      MedicalRequest.findAll({
        include: [
          { model: User, as: 'Creator', attributes: ['id', 'first_name', 'last_name'] },
          { model: User, as: 'Beneficiary', attributes: ['id', 'first_name', 'last_name'] },
        ],
        attributes: ['id', 'request_number', 'status', 'incident_type', 'created_at'],
        order: [['created_at', 'DESC']],
        limit,
      }),
      Payment.findAll({
        include: [
          { model: User, as: 'Payer', attributes: ['id', 'first_name', 'last_name'] },
        ],
        attributes: ['id', 'amount', 'payment_type', 'status', 'created_at'],
        order: [['created_at', 'DESC']],
        limit,
      }),
      IdentityDocument.findAll({
        include: [
          { model: User, attributes: ['id', 'first_name', 'last_name'] },
        ],
        attributes: ['id', 'document_type', 'status', 'created_at'],
        order: [['created_at', 'DESC']],
        limit,
      }),
      Appointment.findAll({
        include: [
          { model: User, as: 'Creator', attributes: ['id', 'first_name', 'last_name'] },
          {
            model: MedicalRequest,
            attributes: ['request_number'],
            include: [
              { model: User, as: 'Beneficiary', attributes: ['id', 'first_name', 'last_name'] },
              { model: User, as: 'Medecin', attributes: ['id', 'first_name', 'last_name'] },
            ],
          },
        ],
        attributes: ['id', 'title', 'status', 'date', 'created_at'],
        order: [['created_at', 'DESC']],
        limit,
      }),
      Assignment.findAll({
        include: [
          { model: User, as: 'Agent', attributes: ['id', 'first_name', 'last_name'] },
          { model: MedicalRequest, attributes: ['request_number', 'status'] },
        ],
        attributes: ['id', 'assigned_at'],
        order: [['assigned_at', 'DESC']],
        limit,
      }),
      User.findAll({
        attributes: ['id', 'first_name', 'last_name', 'created_at'],
        order: [['created_at', 'DESC']],
        limit,
      }),
    ]);

    const activities = [];

    demandes.forEach(d => {
      const name = d.Beneficiary
        ? `${d.Beneficiary.first_name} ${d.Beneficiary.last_name}`
        : d.Creator
          ? `${d.Creator.first_name} ${d.Creator.last_name}`
          : 'Inconnu';
      activities.push({
        id: `demande-${d.id}`,
        type: 'demande',
        content: `Nouvelle demande #${d.request_number} - ${d.incident_type || 'Sinistre'}`,
        user_name: name,
        status: d.status,
        created_at: d.created_at,
      });
    });

    paiements.forEach(p => {
      activities.push({
        id: `paiement-${p.id}`,
        type: 'paiement',
        content: `Paiement ${p.payment_type} de ${parseFloat(p.amount).toLocaleString()} FCFA`,
        user_name: p.Payer ? `${p.Payer.first_name} ${p.Payer.last_name}` : 'Inconnu',
        status: p.status,
        created_at: p.created_at,
      });
    });

    documents.forEach(d => {
      activities.push({
        id: `document-${d.id}`,
        type: 'verification',
        content: `Soumission ${d.document_type?.replace('_', ' ') || 'document'} - #${d.id}`,
        user_name: d.User ? `${d.User.first_name} ${d.User.last_name}` : 'Inconnu',
        status: d.status === 'PENDING' ? 'EN_ATTENTE' : d.status,
        created_at: d.created_at,
      });
    });

    rendezvous.forEach(r => {
      const patient = r.MedicalRequest?.Beneficiary
        ? `${r.MedicalRequest.Beneficiary.first_name} ${r.MedicalRequest.Beneficiary.last_name}`
        : r.Creator
          ? `${r.Creator.first_name} ${r.Creator.last_name}`
          : 'Patient';
      activities.push({
        id: `rdv-${r.id}`,
        type: 'rendezvous',
        content: `${r.title || 'Rendez-vous'} - ${patient}`,
        user_name: r.MedicalRequest?.Medecin
          ? `Dr. ${r.MedicalRequest.Medecin.last_name}`
          : 'Non assigné',
        status: r.status,
        created_at: r.created_at,
      });
    });

    affectations.forEach(a => {
      activities.push({
        id: `affectation-${a.id}`,
        type: 'affectation',
        content: `Affecté à la demande #${a.MedicalRequest?.request_number || '?'}`,
        user_name: a.Agent ? `${a.Agent.first_name} ${a.Agent.last_name}` : 'Inconnu',
        status: a.MedicalRequest?.status || 'ASSIGNED',
        created_at: a.assigned_at,
      });
    });

    inscriptions.forEach(u => {
      activities.push({
        id: `inscription-${u.id}`,
        type: 'inscription',
        content: 'Nouvel utilisateur inscrit',
        user_name: `${u.first_name} ${u.last_name}`,
        status: 'ACTIF',
        created_at: u.created_at,
      });
    });

    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return activities.slice(0, limit);
  }

  async getPendingVerifications() {
    return IdentityDocument.findAll({
      where: { status: 'PENDING' },
      include: [{
        model: User,
        attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'dossier_number'],
      }],
      order: [['created_at', 'ASC']],
    });
  }

  async getNotifCounts(userId, roles) {
    const counts = {};

    if (roles.includes('ADMIN')) {
      counts['/dashboard/verifications-identite'] = await IdentityDocument.count({ where: { status: 'PENDING' } });
      counts['/dashboard/demandes'] = await MedicalRequest.count({ where: { status: { [Op.in]: ['SUBMITTED', 'SUSPENDED'] } } });
    }

    if (roles.includes('MEDECIN')) {
      const assignedCount = await MedicalRequest.count({
        where: { medecin_id: userId, status: { [Op.in]: ['ASSIGNED', 'SUBMITTED'] } },
      });
      counts['/dashboard/medecin/demandes'] = assignedCount;

      const aptCount = await Appointment.count({
        where: { status: 'SCHEDULED', proposed_by: 'PATIENT' },
        include: [{ model: MedicalRequest, where: { medecin_id: userId }, attributes: [] }],
      });
      counts['/dashboard/medecin/rendezvous'] = aptCount;
    }

    if (roles.includes('PATIENT')) {
      counts['/dashboard/patient/demandes'] = await MedicalRequest.count({
        where: { created_by: userId, status: { [Op.in]: ['SUBMITTED', 'APPROVED', 'SUSPENDED'] } },
      });
      counts['/dashboard/patient/rendezvous'] = await Appointment.count({
        where: { status: 'SCHEDULED', proposed_by: 'MEDECIN' },
        include: [{ model: MedicalRequest, where: { created_by: userId }, attributes: [] }],
      });
    }

    if (roles.includes('AGENT_PROXIMITE')) {
      const [row] = await db.sequelize.query(`
        SELECT COUNT(*) AS count FROM assignments a
        JOIN medical_requests mr ON mr.id = a.request_id
        WHERE a.agent_id = ? AND mr.status NOT IN ('COMPLETED','CANCELLED')
      `, { replacements: [userId] });
      counts['/dashboard/agent/affectations'] = parseInt(row[0]?.count, 10) || 0;
    }

    return counts;
  }
}

module.exports = new DashboardService();
