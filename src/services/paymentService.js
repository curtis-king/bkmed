const crypto = require('crypto');
const { Op, fn, col, literal } = require('sequelize');
const BaseService = require('./baseService');
const db = require('../models');
const Payment = require('../models/Payment');
const MedicalRequest = require('../models/MedicalRequest');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const { getIO } = require('../socket');

class PaymentService extends BaseService {
  constructor() {
    super(Payment);
  }

  async generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const last = await Payment.findOne({
      where: { id: { [Op.ne]: 0 } },
      order: [['id', 'DESC']],
      attributes: ['id'],
      paranoid: false,
    });
    const nextId = (last?.id || 0) + 1;
    return `FAC-${year}-${String(nextId).padStart(6, '0')}`;
  }

  async adminGetAll({ search, status, type, page = 1, limit = 20 }) {
    const where = {};

    if (status) where.status = status;
    if (type) where.payment_type = type;

    if (search) {
      where[Op.or] = [
        { '$Payer.first_name$': { [Op.like]: `%${search}%` } },
        { '$Payer.last_name$': { [Op.like]: `%${search}%` } },
        { '$Payer.phone$': { [Op.like]: `%${search}%` } },
        { '$Payer.dossier_number$': { [Op.like]: `%${search}%` } },
        { '$Beneficiary.first_name$': { [Op.like]: `%${search}%` } },
        { '$Beneficiary.last_name$': { [Op.like]: `%${search}%` } },
        { '$Beneficiary.phone$': { [Op.like]: `%${search}%` } },
        { '$Beneficiary.dossier_number$': { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: User, as: 'Payer', attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'dossier_number'] },
        { model: User, as: 'Beneficiary', attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'dossier_number'] },
        { model: MedicalRequest, attributes: ['id', 'request_number', 'status', 'incident_type'] },
        { model: Subscription, include: [{ model: Plan, attributes: ['id', 'name', 'monthly_price'] }] },
      ],
      order: [['id', 'DESC']],
      offset,
      limit,
      subQuery: false,
    });

    return { payments: rows, total: count, page, pages: Math.ceil(count / limit) };
  }

  async getFinancialStats() {
    const [totalRevenue] = await db.sequelize.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'CONFIRMED'"
    );
    const [todayRevenue] = await db.sequelize.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'CONFIRMED' AND DATE(created_at) = CURDATE()"
    );
    const [monthRevenue] = await db.sequelize.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'CONFIRMED' AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())"
    );
    const [pendingCount] = await db.sequelize.query(
      "SELECT COUNT(*) AS count FROM payments WHERE status = 'PENDING'"
    );
    const [pendingAmount] = await db.sequelize.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'PENDING'"
    );
    const [typeStats] = await db.sequelize.query(
      "SELECT payment_type, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'CONFIRMED' GROUP BY payment_type"
    );
    const [methodStats] = await db.sequelize.query(
      "SELECT method, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'CONFIRMED' GROUP BY method"
    );

    return {
      total_revenue: Number(totalRevenue[0]?.total || 0),
      today_revenue: Number(todayRevenue[0]?.total || 0),
      month_revenue: Number(monthRevenue[0]?.total || 0),
      pending_count: Number(pendingCount[0]?.count || 0),
      pending_amount: Number(pendingAmount[0]?.total || 0),
      by_type: typeStats.map(r => ({ type: r.payment_type, count: Number(r.count), total: Number(r.total) })),
      by_method: methodStats.map(r => ({ method: r.method, count: Number(r.count), total: Number(r.total) })),
    };
  }

  async getPatientPayments(userId) {
    return Payment.findAll({
      where: {
        [Op.or]: [
          { payer_id: userId },
          { beneficiary_id: userId },
        ],
      },
      include: [
        { model: User, as: 'Payer', attributes: ['id', 'first_name', 'last_name', 'dossier_number'] },
        { model: User, as: 'Beneficiary', attributes: ['id', 'first_name', 'last_name', 'dossier_number'] },
        { model: MedicalRequest, attributes: ['id', 'request_number', 'status'] },
        { model: Subscription, include: [{ model: Plan, attributes: ['id', 'name', 'monthly_price'] }] },
      ],
      order: [['id', 'DESC']],
    });
  }

  async getReceiptData(id) {
    const payment = await Payment.findByPk(id, {
      include: [
        { model: User, as: 'Payer', attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'dossier_number'] },
        { model: User, as: 'Beneficiary', attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'dossier_number'] },
        { model: MedicalRequest, attributes: ['id', 'request_number', 'status', 'incident_type', 'created_at'] },
        { model: Subscription, include: [{ model: Plan, attributes: ['id', 'name', 'monthly_price'] }] },
      ],
    });
    if (!payment) throw new Error('Paiement introuvable.');

    const invoiceNumber = await this.generateInvoiceNumber();

    return {
      invoice_number: invoiceNumber,
      payment: {
        id: payment.id,
        amount: payment.amount,
        payment_type: payment.payment_type,
        method: payment.method,
        status: payment.status,
        created_at: payment.created_at,
        withdrawal_code: payment.withdrawal_code,
      },
      payer: payment.Payer ? {
        name: `${payment.Payer.first_name} ${payment.Payer.last_name}`,
        email: payment.Payer.email,
        phone: payment.Payer.phone,
        dossier_number: payment.Payer.dossier_number,
      } : null,
      beneficiary: payment.Beneficiary ? {
        name: `${payment.Beneficiary.first_name} ${payment.Beneficiary.last_name}`,
        email: payment.Beneficiary.email,
        phone: payment.Beneficiary.phone,
        dossier_number: payment.Beneficiary.dossier_number,
      } : null,
      request: payment.MedicalRequest ? {
        request_number: payment.MedicalRequest.request_number,
        incident_type: payment.MedicalRequest.incident_type,
      } : null,
      subscription: payment.Subscription ? {
        plan_name: payment.Subscription.Plan?.name || 'N/A',
      } : null,
    };
  }

  async create(data, userId) {
    const { beneficiary_id, request_id, subscription_id, dependent_id, payment_type, method, amount, mobile_money_provider, mobile_money_phone } = data;

    const payment = await Payment.create({
      payer_id: userId,
      beneficiary_id: beneficiary_id || userId,
      request_id,
      subscription_id,
      dependent_id,
      payment_type,
      method,
      amount,
      mobile_money_provider,
      mobile_money_phone,
    });

    const io = getIO();
    io.to('admins').emit('payment:created', payment);

    return payment;
  }

  /**
   * Traite un paiement de bout en bout.
   * Aucun enregistrement n'est créé tant que le paiement n'est pas validé.
   *
   * - MOBILE_MONEY : appelle l'API d'abord, crée le payment seulement si succès
   * - CASH : crée le payment en PENDING avec un code de retrait
   * - Simulation : crée le payment directement en CONFIRMED
   */
  async processPaymentFlow({ userId, beneficiaryId, requestId, subscriptionId, dependentId, paymentType, method, amount, mobileMoneyProvider, mobileMoneyPhone }) {
    const config = require('../config/mobileMoney');
    const isMobileMoney = method === 'MOBILE_MONEY' && mobileMoneyProvider && mobileMoneyPhone;

    let mobileMoneyResult = null;

    // 1. Valider le paiement Mobile Money AVANT de créer l'enregistrement
    if (isMobileMoney && !config.simulation) {
      const mobileMoneyService = require('./mobileMoneyService');
      mobileMoneyResult = await mobileMoneyService.processPayment(
        mobileMoneyProvider,
        mobileMoneyPhone,
        Number(amount),
        `${paymentType}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      );

      if (!mobileMoneyResult?.success) {
        throw new Error(`Paiement Mobile Money échoué: ${mobileMoneyResult?.message || 'Erreur inconnue'}`);
      }
    }

    // 2. Créer l'enregistrement seulement si la validation est passée
    const status = config.simulation || mobileMoneyResult?.success ? 'CONFIRMED' : 'PENDING';
    const withdrawalCode = method === 'CASH'
      ? `WTH-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6)}`
      : null;

    const payment = await Payment.create({
      payer_id: userId,
      beneficiary_id: beneficiaryId || userId,
      request_id: requestId,
      subscription_id: subscriptionId,
      dependent_id: dependentId,
      payment_type: paymentType,
      method,
      amount,
      mobile_money_provider: mobileMoneyProvider || null,
      mobile_money_phone: mobileMoneyPhone || null,
      status,
      withdrawal_code: withdrawalCode,
    });

    const io = getIO();
    io.to('admins').emit('payment:created', payment);

    // 3. Activer l'abonnement si CONFIRMED
    if (status === 'CONFIRMED' && paymentType === 'SUBSCRIPTION' && subscriptionId) {
      const subscriptionService = require('./subscriptionService');
      try {
        await subscriptionService.activateAfterPayment(subscriptionId);
      } catch (e) {
        console.warn('Impossible d\'activer l\'abonnement:', e.message);
      }
    }

    if (status === 'CONFIRMED') {
      io.to(`user:${userId}`).emit('payment:confirmed', payment);
      const notifService = require('./notificationService');
      notifService.create(userId, 'payment:confirmed', 'payment', payment.id, `Paiement confirmé: ${Number(amount).toLocaleString()} FCFA`).catch(() => {});
    }

    return {
      payment,
      mobileMoneyResult,
      autoConfirmed: status === 'CONFIRMED',
      withdrawalCode,
    };
  }

  async getUserPayments(userId) {
    return Payment.findAll({
      where: { payer_id: userId },
      order: [['id', 'DESC']],
    });
  }

  async confirm(id) {
    const payment = await Payment.findByPk(id);
    if (!payment) throw new Error('Paiement introuvable.');

    await payment.update({ status: 'CONFIRMED' });

    if (payment.payment_type === 'SUBSCRIPTION' && payment.subscription_id) {
      const subscriptionService = require('./subscriptionService');
      try {
        await subscriptionService.activateAfterPayment(payment.subscription_id);
      } catch (e) {
        console.warn('Impossible d\'activer l\'abonnement:', e.message);
      }
    }

    const io = getIO();
    io.to(`user:${payment.payer_id}`).emit('payment:confirmed', payment);

    const notifService = require('./notificationService');
    notifService.create(payment.payer_id, 'payment:confirmed', 'payment', payment.id, `Paiement confirmé: ${Number(payment.amount).toLocaleString()} FCFA`).catch(() => {});

    return payment;
  }

  async fail(id) {
    const payment = await Payment.findByPk(id);
    if (!payment) throw new Error('Paiement introuvable.');

    await payment.update({ status: 'FAILED' });
    return payment;
  }

  async getAllWithDetails() {
    return Payment.findAll({
      include: [
        { model: User, as: 'Payer', attributes: { exclude: ['password'] } },
        { model: User, as: 'Beneficiary', attributes: { exclude: ['password'] } },
        MedicalRequest,
      ],
      order: [['id', 'DESC']],
    });
  }
}

module.exports = new PaymentService();
