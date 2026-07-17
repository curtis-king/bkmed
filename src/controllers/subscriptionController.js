const subscriptionService = require('../services/subscriptionService');
const paymentService = require('../services/paymentService');
const vehicleService = require('../services/vehicleService');

exports.souscrire = async (req, res) => {
  try {
    const { plan_id, duration_months, payment_method, mobile_money_provider, mobile_money_phone, dependent_id, vehicle } = req.body;
    const duration = duration_months || 1;

    const sub = await subscriptionService.subscribe(plan_id, req.user.id, duration, dependent_id);

    let vehicleRecord = null;
    if (vehicle) {
      if (vehicle.id) {
        vehicleRecord = await vehicleService.getMyVehicle(vehicle.id, req.user.id);
      } else {
        vehicleRecord = await vehicleService.createPatientVehicle(
          {
            vehicle_type: vehicle.vehicle_type,
            registration_number: vehicle.registration_number,
            brand: vehicle.brand,
            model: vehicle.model,
          },
          req.user.id,
          vehicle.identity_document_path || null,
          vehicle.supporting_document_path || null
        );
      }
    }

    const plan = await (require('../models/Plan')).findByPk(plan_id);
    const amount = subscriptionService.calculatePrice(plan, duration);

    let result = { payment: null, mobileMoneyResult: null, autoConfirmed: false };

    if (payment_method) {
      result = await paymentService.processPaymentFlow({
        userId: req.user.id,
        beneficiaryId: req.user.id,
        subscriptionId: sub.id,
        dependentId: dependent_id,
        paymentType: 'SUBSCRIPTION',
        method: payment_method,
        amount,
        mobileMoneyProvider: mobile_money_provider,
        mobileMoneyPhone: mobile_money_phone,
      });
    }

    const message = result.autoConfirmed
      ? 'Abonnement activé ! Paiement confirmé.'
      : 'Abonnement créé en attente de paiement.';

    res.status(201).json({
      message,
      data: {
        subscription: sub,
        payment: result.payment,
        vehicle: vehicleRecord,
        mobile_money: result.mobileMoneyResult,
        auto_confirmed: result.autoConfirmed,
      },
    });
  } catch (err) {
    if (err.message === 'Plan introuvable.') return res.status(404).json({ message: err.message });
    if (err.message === 'Vous avez déjà un abonnement actif.') return res.status(400).json({ message: err.message });
    if (err.message === 'Ce numéro de matricule est déjà enregistré.') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.monAbonnement = async (req, res) => {
  try {
    const sub = await subscriptionService.getUserSubscription(req.user.id);
    if (!sub) return res.status(404).json({ message: 'Aucun abonnement.' });
    res.json(sub);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.resilier = async (req, res) => {
  try {
    const sub = await subscriptionService.cancel(req.user.id);
    res.json({ message: 'Abonnement résilié.' });
  } catch (err) {
    if (err.message === 'Aucun abonnement actif.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.tous = async (req, res) => {
  try {
    const subs = await subscriptionService.getAllWithDetails();
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.checkAccess = async (req, res) => {
  try {
    const access = await subscriptionService.checkAccess(req.user.id);
    res.json(access);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.calculerPrix = async (req, res) => {
  try {
    const { plan_id, duration_months } = req.body;
    const plan = await (require('../models/Plan')).findByPk(plan_id);
    if (!plan) return res.status(404).json({ message: 'Plan introuvable.' });

    const total = subscriptionService.calculatePrice(plan, duration_months || 1);
    const monthlyPrice = plan.monthly_price ? Number(plan.monthly_price) : null;
    const annualPrice = plan.annual_price ? Number(plan.annual_price) : null;

    res.json({
      plan_id: plan.id,
      plan_name: plan.name,
      duration_months: duration_months || 1,
      monthly_price: monthlyPrice,
      annual_price: annualPrice,
      total,
      savings: monthlyPrice && duration_months === 12 && annualPrice
        ? (monthlyPrice * 12 - annualPrice)
        : 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
