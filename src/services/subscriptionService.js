const BaseService = require('./baseService');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const User = require('../models/User');
const Dependent = require('../models/Dependent');
const onboardingService = require('./onboardingService');

class SubscriptionService extends BaseService {
  constructor() {
    super(Subscription);
  }

  async subscribe(planId, userId, durationMonths = 1, dependentId = null) {
    const plan = await Plan.findByPk(planId);
    if (!plan) throw new Error('Plan introuvable.');

    if (dependentId) {
      const activeDep = await Subscription.findOne({
        where: { dependent_id: dependentId, status: 'ACTIVE' },
      });
      if (activeDep) throw new Error('Cette personne a déjà un abonnement actif.');
    } else {
      const active = await Subscription.findOne({
        where: { user_id: userId, status: 'ACTIVE' },
      });
      if (active) throw new Error('Vous avez déjà un abonnement actif.');
    }

    const sub = await Subscription.create({
      user_id: userId,
      plan_id: planId,
      dependent_id: dependentId,
      duration_months: durationMonths,
      status: 'PENDING',
    });

    return sub;
  }

  async activateAfterPayment(subscriptionId) {
    const sub = await Subscription.findByPk(subscriptionId, { include: Plan });
    if (!sub) throw new Error('Abonnement introuvable.');
    if (sub.status !== 'PENDING') throw new Error('Abonnement déjà activé ou annulé.');

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + sub.duration_months);

    await sub.update({
      status: 'ACTIVE',
      start_date: startDate,
      end_date: endDate,
    });

    await User.update({ quota_used: 0 }, { where: { id: sub.user_id } });

    return sub.reload();
  }

  async getUserSubscription(userId) {
    const sub = await Subscription.findOne({
      where: { user_id: userId },
      include: Plan,
      order: [['id', 'DESC']],
    });
    return sub;
  }

  async cancel(userId) {
    const sub = await Subscription.findOne({
      where: { user_id: userId, status: 'ACTIVE' },
    });
    if (!sub) throw new Error('Aucun abonnement actif.');

    await sub.update({ status: 'SUSPENDED', end_date: new Date() });
    return sub;
  }

  async getAllWithDetails() {
    return Subscription.findAll({
      include: [
        Plan,
        { model: User, attributes: { exclude: ['password'] } },
        { model: Dependent, as: 'Dependent' },
      ],
      order: [['id', 'DESC']],
    });
  }

  async checkAccess(userId) {
    const onboarding = await onboardingService.checkAccess(userId);
    if (!onboarding.allowed) {
      return { allowed: false, reason: onboarding.reason };
    }

    const sub = await this.getUserSubscription(userId);
    if (!sub || sub.status !== 'ACTIVE') {
      return { allowed: false, reason: 'Aucun abonnement actif.' };
    }

    const plan = await Plan.findByPk(sub.plan_id);
    const user = await User.findByPk(userId);

    const maxCoverage = plan?.monthly_coverage || 0;
    const used = user?.quota_used || 0;
    const remaining = Math.max(0, maxCoverage - used);

    return {
      allowed: true,
      subscription: sub,
      plan,
      quota: { max: maxCoverage, used, remaining },
      isOutOfQuota: used >= maxCoverage,
    };
  }

  async incrementQuota(userId, amount = 0) {
    await User.increment('quota_used', { by: amount, where: { id: userId } });
  }

  calculatePrice(plan, durationMonths) {
    if (durationMonths === 12 && plan.annual_price) {
      return Number(plan.annual_price);
    }
    if (plan.monthly_price) {
      return Number(plan.monthly_price) * durationMonths;
    }
    return 0;
  }
}

module.exports = new SubscriptionService();
