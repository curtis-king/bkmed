const paymentService = require('../services/paymentService');

exports.reglerAbonnement = async (req, res) => {
  try {
    const { subscription_id, payment_method, mobile_money_provider, mobile_money_phone } = req.body;
    if (!subscription_id || !payment_method) {
      return res.status(400).json({ message: 'subscription_id et payment_method requis.' });
    }

    const Subscription = require('../models/Subscription');
    const Plan = require('../models/Plan');
    const sub = await Subscription.findByPk(subscription_id, { include: Plan });
    if (!sub) return res.status(404).json({ message: 'Abonnement introuvable.' });
    if (sub.user_id !== req.user.id && !req.user.isAdmin) {
      const Dependent = require('../models/Dependent');
      const dep = await Dependent.findOne({ where: { id: sub.dependent_id, user_id: req.user.id } });
      if (!dep) return res.status(403).json({ message: 'Accès refusé.' });
    }
    if (sub.status !== 'PENDING') return res.status(400).json({ message: 'Cet abonnement n\'est pas en attente de paiement.' });

    const subscriptionService = require('../services/subscriptionService');
    const amount = subscriptionService.calculatePrice(sub.Plan, sub.duration_months);

    const result = await paymentService.processPaymentFlow({
      userId: req.user.id,
      beneficiaryId: sub.user_id,
      subscriptionId: sub.id,
      dependentId: sub.dependent_id,
      paymentType: 'SUBSCRIPTION',
      method: payment_method,
      amount,
      mobileMoneyProvider: mobile_money_provider,
      mobileMoneyPhone: mobile_money_phone,
    });

    const message = result.autoConfirmed
      ? 'Paiement confirmé ! Abonnement activé.'
      : 'Paiement enregistré, en attente de confirmation.';

    res.json({ message, data: { payment: result.payment, mobile_money: result.mobileMoneyResult, auto_confirmed: result.autoConfirmed } });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { payment_type, method, amount, mobile_money_provider, mobile_money_phone,
            beneficiary_id, request_id, subscription_id, dependent_id } = req.body;

    if (!method || !amount) {
      return res.status(400).json({ message: 'method et amount requis.' });
    }

    const result = await paymentService.processPaymentFlow({
      userId: req.user.id,
      beneficiaryId: beneficiary_id || req.user.id,
      requestId: request_id,
      subscriptionId: subscription_id,
      dependentId: dependent_id,
      paymentType: payment_type || 'SERVICE',
      method,
      amount: Number(amount),
      mobileMoneyProvider: mobile_money_provider,
      mobileMoneyPhone: mobile_money_phone,
    });

    res.status(201).json({
      message: result.autoConfirmed ? 'Paiement confirmé.' : 'Paiement enregistré.',
      data: { payment: result.payment, mobile_money: result.mobileMoneyResult },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.mesPaiements = async (req, res) => {
  try {
    const payments = await paymentService.getUserPayments(req.user.id);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.confirmer = async (req, res) => {
  try {
    const payment = await paymentService.confirm(req.params.id);
    res.json({ message: 'Paiement confirmé.', data: payment });
  } catch (err) {
    if (err.message === 'Paiement introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.echouer = async (req, res) => {
  try {
    const payment = await paymentService.fail(req.params.id);
    res.json({ message: 'Paiement marqué comme échoué.', data: payment });
  } catch (err) {
    if (err.message === 'Paiement introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.reglerRequest = async (req, res) => {
  try {
    const MedicalRequest = require('../models/MedicalRequest');
    const { payment_method, mobile_money_provider, mobile_money_phone } = req.body;

    const request = await MedicalRequest.findByPk(req.params.id, {
      include: [{ model: require('../models/Service'), as: 'Service' }],
    });
    if (!request) return res.status(404).json({ message: 'Demande introuvable.' });
    if (request.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const amount = request.Service?.price || 0;
    const effectiveMethod = payment_method || 'CASH';

    const result = await paymentService.processPaymentFlow({
      userId: req.user.id,
      beneficiaryId: request.beneficiary_id || req.user.id,
      requestId: request.id,
      paymentType: 'SERVICE',
      method: effectiveMethod,
      amount,
      mobileMoneyProvider: mobile_money_provider,
      mobileMoneyPhone: mobile_money_phone,
    });

    let qrCode = null;
    if (effectiveMethod === 'CASH' && result.withdrawalCode) {
      const Vehicle = require('../models/Vehicle');
      const userVehicle = await Vehicle.findOne({
        where: { user_id: req.user.id },
        order: [['id', 'DESC']],
      });

      qrCode = {
        withdrawal_code: result.withdrawalCode,
        qr_data: JSON.stringify({
          type: 'PAYMENT_WITHDRAWAL',
          request_id: request.id,
          request_number: request.request_number,
          amount: Number(amount),
          code: result.withdrawalCode,
          ...(userVehicle && {
            vehicle: {
              registration_number: userVehicle.registration_number,
              brand: userVehicle.brand,
              model: userVehicle.model,
              vehicle_type: userVehicle.vehicle_type,
            },
          }),
        }),
      };
    }

    res.json({
      message: result.autoConfirmed ? 'Paiement confirmé !' : 'Paiement enregistré, en attente de confirmation.',
      data: {
        payment: result.payment,
        mobile_money: result.mobileMoneyResult,
        qr_code: qrCode,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.reglerPayment = async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const { payment_method, mobile_money_provider, mobile_money_phone } = req.body;

    if (!payment_method) {
      return res.status(400).json({ message: 'payment_method requis.' });
    }

    const existing = await Payment.findByPk(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Paiement introuvable.' });
    if (existing.payer_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    if (existing.status !== 'PENDING') {
      return res.status(400).json({ message: 'Ce paiement n\'est pas en attente.' });
    }

    const result = await paymentService.processPaymentFlow({
      userId: req.user.id,
      beneficiaryId: existing.beneficiary_id,
      requestId: existing.request_id,
      subscriptionId: existing.subscription_id,
      dependentId: existing.dependent_id,
      paymentType: existing.payment_type,
      method: payment_method,
      amount: Number(existing.amount),
      mobileMoneyProvider: mobile_money_provider,
      mobileMoneyPhone: mobile_money_phone,
    });

    if (result.autoConfirmed && existing.id !== result.payment.id) {
      await paymentService.fail(existing.id);
    }

    res.json({
      message: result.autoConfirmed ? 'Paiement confirmé !' : 'Paiement enregistré, en attente de confirmation.',
      data: { payment: result.payment, mobile_money: result.mobileMoneyResult, auto_confirmed: result.autoConfirmed },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Paiement introuvable.' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.confirmerAgent = async (req, res) => {
  try {
    const paymentService = require('../services/paymentService');
    const Payment = require('../models/Payment');

    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Paiement introuvable.' });
    if (payment.status !== 'PENDING') return res.status(400).json({ message: 'Ce paiement n\'est pas en attente.' });
    if (payment.method !== 'CASH') return res.status(400).json({ message: 'Seuls les paiements en espèces peuvent être confirmés par un agent.' });

    const hasRole = req.user.roles && (req.user.roles.includes('AGENT_PROXIMITE') || req.user.roles.includes('ADMIN'));
    if (!hasRole) return res.status(403).json({ message: 'Seuls les agents et admins peuvent confirmer un paiement en espèces.' });

    await paymentService.confirm(payment.id);
    await payment.reload();

    res.json({
      message: 'Paiement en espèces confirmé.',
      data: { payment, agent_id: req.user.id, confirmed_at: new Date() },
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.tous = async (req, res) => {
  try {
    const payments = await paymentService.getAllWithDetails();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.adminList = async (req, res) => {
  try {
    const { search, status, type, page, limit } = req.query;
    const result = await paymentService.adminGetAll({ search, status, type, page: parseInt(page) || 1, limit: parseInt(limit) || 20 });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.adminStats = async (req, res) => {
  try {
    const stats = await paymentService.getFinancialStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.adminPatientPayments = async (req, res) => {
  try {
    const { userId } = req.params;
    const payments = await paymentService.getPatientPayments(userId);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.adminReceipt = async (req, res) => {
  try {
    const data = await paymentService.getReceiptData(req.params.id);
    res.json(data);
  } catch (err) {
    if (err.message === 'Paiement introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
