const mongoose = require('mongoose');
const CheckHistory = require('../models/CheckHistory');
const Incident = require('../models/Incident');
const Monitor = require('../models/Monitor');

/**
 * Get response time history for a monitor
 */
const getResponseTimeHistory = async (monitorId, userId, hours = 24) => {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const history = await CheckHistory.find({
    monitorId,
    userId,
    timestamp: { $gte: since },
    responseTime: { $ne: null },
  })
    .select('timestamp responseTime success result statusCode')
    .sort({ timestamp: 1 })
    .lean();

  return history;
};

/**
 * Get uptime percentage for different periods
 */
const getUptimeStats = async (monitorId, userId) => {
  const now = new Date();
  const mId = new mongoose.Types.ObjectId(monitorId);
  const uId = new mongoose.Types.ObjectId(userId);

  const periods = {
    last1Hour: new Date(now - 60 * 60 * 1000),
    last24Hours: new Date(now - 24 * 60 * 60 * 1000),
    last7Days: new Date(now - 7 * 24 * 60 * 60 * 1000),
    last30Days: new Date(now - 30 * 24 * 60 * 60 * 1000),
  };

  const results = {};

  for (const [period, since] of Object.entries(periods)) {
    const stats = await CheckHistory.aggregate([
      { $match: { monitorId: mId, userId: uId, timestamp: { $gte: since } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          successful: { $sum: { $cond: ['$success', 1, 0] } },
          avgResponseTime: {
            $avg: { $cond: [{ $and: ['$success', { $gt: ['$responseTime', 0] }] }, '$responseTime', null] }
          },
          minResponseTime: {
            $min: { $cond: [{ $and: ['$success', { $gt: ['$responseTime', 0] }] }, '$responseTime', null] }
          },
          maxResponseTime: {
            $max: { $cond: [{ $and: ['$success', { $gt: ['$responseTime', 0] }] }, '$responseTime', null] }
          },
        },
      },
    ]);

    if (stats.length > 0 && stats[0].total > 0) {
      results[period] = {
        uptimePercentage: Math.round((stats[0].successful / stats[0].total) * 10000) / 100,
        totalChecks: stats[0].total,
        successfulChecks: stats[0].successful,
        failedChecks: stats[0].total - stats[0].successful,
        avgResponseTime: stats[0].avgResponseTime ? Math.round(stats[0].avgResponseTime) : null,
        minResponseTime: stats[0].minResponseTime,
        maxResponseTime: stats[0].maxResponseTime,
      };
    } else {
      results[period] = {
        uptimePercentage: null,
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        avgResponseTime: null,
        minResponseTime: null,
        maxResponseTime: null,
      };
    }
  }

  return results;
};

/**
 * Get 24-hour uptime bars (each bar = 30 min window)
 */
const getUptimeBars = async (monitorId, userId) => {
  const now = new Date();
  const since = new Date(now - 24 * 60 * 60 * 1000);
  const WINDOW_MINUTES = 30;
  const NUM_BARS = 48; // 24h / 30min

  const bars = [];

  for (let i = 0; i < NUM_BARS; i++) {
    const windowEnd = new Date(since.getTime() + (i + 1) * WINDOW_MINUTES * 60 * 1000);
    const windowStart = new Date(since.getTime() + i * WINDOW_MINUTES * 60 * 1000);

    const checks = await CheckHistory.find({
      monitorId,
      timestamp: { $gte: windowStart, $lt: windowEnd },
    })
      .select('success result')
      .lean();

    if (checks.length === 0) {
      bars.push({ windowStart, windowEnd, status: 'no_data', uptimePercent: null });
    } else {
      const successful = checks.filter((c) => c.success).length;
      const uptimePercent = Math.round((successful / checks.length) * 100);
      let status = 'up';
      if (uptimePercent < 50) status = 'down';
      else if (uptimePercent < 100) status = 'degraded';

      bars.push({ windowStart, windowEnd, status, uptimePercent });
    }
  }

  return bars;
};

/**
 * Get incidents for a monitor with pagination
 */
const getIncidents = async (monitorId, userId, { page = 1, limit = 10, resolved } = {}) => {
  const filter = { monitorId, userId };
  if (typeof resolved === 'boolean') filter.resolved = resolved;

  const skip = (page - 1) * limit;

  const [incidents, total] = await Promise.all([
    Incident.find(filter).sort({ startTime: -1 }).skip(skip).limit(limit).lean(),
    Incident.countDocuments(filter),
  ]);

  return {
    incidents,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get platform-wide stats for admin dashboard
 */
const getPlatformStats = async () => {
  const [
    totalUsers,
    totalMonitors,
    activeMonitors,
    totalIncidents,
    openIncidents,
    totalChecks,
  ] = await Promise.all([
    require('../models/User').countDocuments(),
    Monitor.countDocuments(),
    Monitor.countDocuments({ isPaused: false, status: { $ne: 'unknown' } }),
    Incident.countDocuments(),
    Incident.countDocuments({ resolved: false }),
    CheckHistory.countDocuments(),
  ]);

  const last24hChecks = await CheckHistory.countDocuments({
    timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });

  return {
    totalUsers,
    totalMonitors,
    activeMonitors,
    totalIncidents,
    openIncidents,
    totalChecks,
    last24hChecks,
  };
};

module.exports = {
  getResponseTimeHistory,
  getUptimeStats,
  getUptimeBars,
  getIncidents,
  getPlatformStats,
};
