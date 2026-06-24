const { config } = require('../config/env');
const { AppError } = require('./errorHandler');
const Monitor = require('../models/Monitor');
const Subscription = require('../models/Subscription');

/**
 * Ensure user's plan allows creating more monitors
 */
const checkMonitorLimit = async (req, res, next) => {
  try {
    const user = req.user;
    const planConfig = user.role === 'admin' ? config.plans.admin : (config.plans[user.plan] || config.plans.free);

    const existingCount = await Monitor.countDocuments({ userId: user._id, isPaused: false });
    // Count all monitors (paused or active) for limit enforcement
    const totalCount = await Monitor.countDocuments({ userId: user._id });

    if (totalCount >= planConfig.maxMonitors) {
      return next(
        new AppError(
          `Your ${user.plan} plan allows a maximum of ${planConfig.maxMonitors} monitors. Please upgrade to add more.`,
          403
        )
      );
    }

    req.planConfig = planConfig;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate monitor interval is allowed for user's plan
 */
const checkIntervalAllowed = async (req, res, next) => {
  try {
    const user = req.user;
    const planConfig = user.role === 'admin' ? config.plans.admin : (config.plans[user.plan] || config.plans.free);
    const requestedInterval = parseInt(req.body.interval, 10);

    if (requestedInterval && !planConfig.allowedIntervals.includes(requestedInterval)) {
      const freeOnly = user.plan === 'free';
      return next(
        new AppError(
          freeOnly
            ? `Free plan only supports 5 and 10-minute check intervals. Upgrade to Premium for 1, 2, or 3-minute intervals.`
            : `Invalid interval. Allowed intervals: ${planConfig.allowedIntervals.join(', ')} minutes.`,
          403
        )
      );
    }

    req.planConfig = req.planConfig || planConfig;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require premium plan for specific features
 */
const requirePremium = (featureName) => (req, res, next) => {
  const user = req.user;
  if (user.plan === 'free' && user.role !== 'admin') {
    return next(
      new AppError(
        `${featureName || 'This feature'} is available on the Premium plan. Please upgrade your subscription.`,
        403
      )
    );
  }
  next();
};

/**
 * Require admin role
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('Admin access required.', 403));
  }
  next();
};

module.exports = { checkMonitorLimit, checkIntervalAllowed, requirePremium, requireAdmin };
