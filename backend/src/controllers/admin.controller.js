const User = require('../models/User');
const Monitor = require('../models/Monitor');
const Incident = require('../models/Incident');
const Subscription = require('../models/Subscription');
const CheckHistory = require('../models/CheckHistory');
const Notification = require('../models/Notification');
const analyticsService = require('../services/analytics.service');
const { AppError } = require('../middleware/errorHandler');

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, plan } = req.query;
    const filter = {};
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    if (plan) filter.plan = plan;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-refreshTokens -passwordResetToken -passwordResetExpires').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, data: { users, pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / +limit) } } });
  } catch (error) { next(error); }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'admin') throw new AppError('Cannot delete admin users', 403);

    // Cascade delete monitors, incidents, check histories, notifications, and subscription
    const monitors = await Monitor.find({ userId: user._id });
    await Promise.all([
      Monitor.deleteMany({ userId: user._id }),
      Incident.deleteMany({ userId: user._id }),
      CheckHistory.deleteMany({ userId: user._id }),
      Notification.deleteMany({ userId: user._id }),
      Subscription.deleteOne({ userId: user._id }),
    ]);
    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'User and all associated data deleted' });
  } catch (error) { next(error); }
};

const updateUserPlan = async (req, res, next) => {
  try {
    const { plan, role } = req.body;
    const updates = {};
    if (plan) updates.plan = plan;
    if (role) updates.role = role;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) throw new AppError('User not found', 404);

    if (plan) {
      await Subscription.findOneAndUpdate({ userId: user._id }, { plan }, { upsert: true });
    }

    res.json({ success: true, data: { user } });
  } catch (error) { next(error); }
};

const getAllMonitors = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [monitors, total] = await Promise.all([
      Monitor.find().populate('userId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Monitor.countDocuments(),
    ]);
    res.json({ success: true, data: { monitors, pagination: { page: +page, limit: +limit, total } } });
  } catch (error) { next(error); }
};

const getAllIncidents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, resolved } = req.query;
    const filter = {};
    if (resolved !== undefined) filter.resolved = resolved === 'true';
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [incidents, total] = await Promise.all([
      Incident.find(filter).populate('monitorId', 'name url').populate('userId', 'email').sort({ startTime: -1 }).skip(skip).limit(parseInt(limit)),
      Incident.countDocuments(filter),
    ]);
    res.json({ success: true, data: { incidents, pagination: { page: +page, limit: +limit, total } } });
  } catch (error) { next(error); }
};

const getPlatformAnalytics = async (req, res, next) => {
  try {
    const stats = await analyticsService.getPlatformStats();
    res.json({ success: true, data: { stats } });
  } catch (error) { next(error); }
};

module.exports = { getAllUsers, deleteUser, updateUserPlan, getAllMonitors, getAllIncidents, getPlatformAnalytics };
