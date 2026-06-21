const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

const getSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user._id });
    res.json({ success: true, data: { subscription } });
  } catch (error) { next(error); }
};

/**
 * Mock upgrade — in production, this would verify Razorpay payment
 */
const upgradeToPremium = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId } = req.body;

    // TODO: Verify payment with Razorpay SDK in production
    // For now, mock the upgrade
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await Promise.all([
      User.findByIdAndUpdate(req.user._id, { plan: 'premium' }),
      Subscription.findOneAndUpdate(
        { userId: req.user._id },
        {
          plan: 'premium',
          status: 'active',
          razorpayOrderId: razorpayOrderId || 'mock_order',
          razorpayPaymentId: razorpayPaymentId || 'mock_payment',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          amount: 99900, // ₹999 in paise
        },
        { upsert: true, new: true }
      ),
    ]);

    res.json({ success: true, message: 'Upgraded to Premium successfully', data: { plan: 'premium' } });
  } catch (error) { next(error); }
};

const cancelSubscription = async (req, res, next) => {
  try {
    await Promise.all([
      User.findByIdAndUpdate(req.user._id, { plan: 'free' }),
      Subscription.findOneAndUpdate(
        { userId: req.user._id },
        { plan: 'free', status: 'cancelled', cancelledAt: new Date() }
      ),
    ]);
    res.json({ success: true, message: 'Subscription cancelled. Plan reverted to Free.' });
  } catch (error) { next(error); }
};

module.exports = { getSubscription, upgradeToPremium, cancelSubscription };
