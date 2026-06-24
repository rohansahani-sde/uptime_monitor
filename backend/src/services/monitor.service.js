const Monitor = require('../models/Monitor');
const Incident = require('../models/Incident');
const CheckHistory = require('../models/CheckHistory');
const Notification = require('../models/Notification');
const { config } = require('../config/env');
const { AppError } = require('../middleware/errorHandler');

const getMonitorsByUser = async (userId, query = {}) => {
  const filter = { userId };
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;

  const monitors = await Monitor.find(filter).sort({ createdAt: -1 }).lean();
  return monitors;
};

const getMonitorById = async (monitorId, userId) => {
  const monitor = await Monitor.findOne({ _id: monitorId, userId });
  if (!monitor) throw new AppError('Monitor not found.', 404);
  return monitor;
};

const getMonitorBySlug = async (slug) => {
  const monitor = await Monitor.findOne({ slug }).lean();
  if (!monitor) throw new AppError('Status page not found.', 404);
  return monitor;
};

const createMonitor = async (userId, data, plan) => {
  const planConfig = config.plans[plan] || config.plans.free;

  // Enforce interval restrictions for free plan
  const interval = parseInt(data.interval, 10);
  if (!planConfig.allowedIntervals.includes(interval)) {
    throw new AppError(
      `Your plan only allows intervals of ${planConfig.allowedIntervals.join(', ')} minutes.`,
      403
    );
  }

  const monitor = await Monitor.create({
    ...data,
    userId,
    interval,
    status: 'unknown',
  });

  return monitor;
};

const updateMonitor = async (monitorId, userId, data, plan) => {
  const monitor = await Monitor.findOne({ _id: monitorId, userId });
  if (!monitor) throw new AppError('Monitor not found.', 404);

  if (data.interval) {
    const planConfig = config.plans[plan] || config.plans.free;
    const interval = parseInt(data.interval, 10);
    if (!planConfig.allowedIntervals.includes(interval)) {
      throw new AppError(
        `Your plan only allows intervals of ${planConfig.allowedIntervals.join(', ')} minutes.`,
        403
      );
    }
    data.interval = interval;
  }

  const updated = await Monitor.findByIdAndUpdate(monitorId, data, { new: true, runValidators: true });
  return updated;
};

const deleteMonitor = async (monitorId, userId) => {
  const monitor = await Monitor.findOne({ _id: monitorId, userId });
  if (!monitor) throw new AppError('Monitor not found.', 404);

  await Promise.all([
    Monitor.findByIdAndDelete(monitorId),
    Incident.deleteMany({ monitorId }),
    CheckHistory.deleteMany({ monitorId }),
    Notification.deleteMany({ monitorId }),
  ]);
};

const pauseMonitor = async (monitorId, userId) => {
  const monitor = await Monitor.findOne({ _id: monitorId, userId });
  if (!monitor) throw new AppError('Monitor not found.', 404);
  if (monitor.isPaused) throw new AppError('Monitor is already paused.', 400);

  return Monitor.findByIdAndUpdate(monitorId, { isPaused: true, status: 'paused' }, { new: true });
};

const resumeMonitor = async (monitorId, userId) => {
  const monitor = await Monitor.findOne({ _id: monitorId, userId });
  if (!monitor) throw new AppError('Monitor not found.', 404);
  if (!monitor.isPaused) throw new AppError('Monitor is not paused.', 400);

  return Monitor.findByIdAndUpdate(monitorId, { isPaused: false, status: 'unknown' }, { new: true });
};

module.exports = {
  getMonitorsByUser,
  getMonitorById,
  getMonitorBySlug,
  createMonitor,
  updateMonitor,
  deleteMonitor,
  pauseMonitor,
  resumeMonitor,
};
