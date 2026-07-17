const dependentService = require('../services/dependentService');
const paymentService = require('../services/paymentService');
const subscriptionService = require('../services/subscriptionService');
const Plan = require('../models/Plan');

exports.create = async (req, res) => {
  try {
    const {
      payment_method, mobile_money_provider, mobile_money_phone,
      plan_id, duration_months,
      ...depData
    } = req.body;

    const dep = await dependentService.create(depData, req.user.id);

    let subscription = null;
    let regResult = null;
    let planResult = null;

    if (plan_id) {
      const plan = await Plan.findByPk(plan_id);
      if (!plan) return res.status(404).json({ message: 'Plan introuvable.' });
      subscription = await subscriptionService.subscribe(plan_id, req.user.id, duration_months || 1, dep.id);
    }

    const config = require('../config/mobileMoney');

    if (payment_method) {
      regResult = await paymentService.processPaymentFlow({
        userId: req.user.id,
        beneficiaryId: req.user.id,
        dependentId: dep.id,
        paymentType: 'REGISTRATION',
        method: payment_method,
        amount: config.registrationFee,
        mobileMoneyProvider: mobile_money_provider,
        mobileMoneyPhone: mobile_money_phone,
      });

      if (subscription) {
        const plan = await Plan.findByPk(plan_id);
        const planAmount = subscriptionService.calculatePrice(plan, duration_months || 1);
        planResult = await paymentService.processPaymentFlow({
          userId: req.user.id,
          beneficiaryId: req.user.id,
          subscriptionId: subscription.id,
          dependentId: dep.id,
          paymentType: 'SUBSCRIPTION',
          method: payment_method,
          amount: planAmount,
          mobileMoneyProvider: mobile_money_provider,
          mobileMoneyPhone: mobile_money_phone,
        });
      }
    } else {
      regResult = await paymentService.processPaymentFlow({
        userId: req.user.id,
        beneficiaryId: req.user.id,
        dependentId: dep.id,
        paymentType: 'REGISTRATION',
        method: 'CASH',
        amount: config.registrationFee,
      });
    }

    const allConfirmed = (regResult?.autoConfirmed && (!planResult || planResult?.autoConfirmed));

    res.status(201).json({
      message: allConfirmed
        ? 'Personne à charge ajoutée. Paiement confirmé.'
        : 'Personne à charge ajoutée. Paiement en attente.',
      data: dep,
      payment: regResult?.payment || null,
      plan_payment: planResult?.payment || null,
      subscription,
      mobile_money: regResult?.mobileMoneyResult || null,
      auto_confirmed: allConfirmed,
    });
  } catch (err) {
    if (err.message === 'Un compte avec cet email existe déjà.') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.mesDependants = async (req, res) => {
  try {
    const deps = await dependentService.getUserDependents(req.user.id);
    res.json(deps);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.mesDependantsAvecAbonnements = async (req, res) => {
  try {
    const deps = await dependentService.getDependentsWithSubscriptions(req.user.id);
    res.json(deps);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const dep = await dependentService.getById(req.params.id, req.user.id);
    res.json(dep);
  } catch (err) {
    if (err.message === 'Personne à charge introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const dep = await dependentService.update(req.params.id, req.user.id, req.body);
    res.json({ message: 'Personne à charge mise à jour.', data: dep });
  } catch (err) {
    if (err.message === 'Personne à charge introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await dependentService.remove(req.params.id, req.user.id);
    res.json({ message: 'Personne à charge supprimée.' });
  } catch (err) {
    if (err.message === 'Personne à charge introuvable.') return res.status(404).json({ message: err.message });
    res.status(500).json({ message: 'Erreur serveur.', error: err.message });
  }
};
