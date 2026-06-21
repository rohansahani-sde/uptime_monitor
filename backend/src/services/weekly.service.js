const mongoose = require('mongoose');
const Monitor = require('../models/Monitor');
const CheckHistory = require('../models/CheckHistory');
const Incident = require('../models/Incident');
const WeeklyReport = require('../models/WeeklyReport');
const User = require('../models/User');
const emailService = require('./email.service');
const logger = require('../config/logger');

/**
 * Generate and send weekly reports for all premium users
 * Called every Monday at 8 AM via scheduler
 */
const generateAndSendWeeklyReports = async () => {
  try {
    const now = new Date();
    const weekEnd = new Date(now);
    const weekStart = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // Get all premium users
    const premiumUsers = await User.find({ plan: 'premium', isActive: true });
    logger.info(`[WeeklyReport] Generating reports for ${premiumUsers.length} premium users`);

    for (const user of premiumUsers) {
      const monitors = await Monitor.find({ userId: user._id });

      for (const monitor of monitors) {
        try {
          const stats = await computeWeeklyStats(monitor._id, user._id, weekStart, weekEnd);

          // Save report to DB
          await WeeklyReport.findOneAndUpdate(
            { monitorId: monitor._id, weekStart: weekStart },
            {
              userId: user._id,
              monitorId: monitor._id,
              weekStart,
              weekEnd,
              stats,
            },
            { upsert: true, new: true }
          );

          // Send email
          await emailService.sendWeeklyReport({
            to: user.email,
            userId: user._id,
            monitorId: monitor._id,
            monitorName: monitor.name,
            monitorUrl: monitor.url,
            stats,
            weekStart,
            weekEnd,
          });

          await WeeklyReport.findOneAndUpdate(
            { monitorId: monitor._id, weekStart },
            { emailSent: true, sentAt: new Date() }
          );

          logger.info(`[WeeklyReport] Sent for ${monitor.name} to ${user.email}`);
        } catch (err) {
          logger.error(`[WeeklyReport] Failed for monitor ${monitor._id}: ${err.message}`);
        }
      }
    }
  } catch (error) {
    logger.error(`[WeeklyReport] Generation failed: ${error.message}`);
  }
};

const computeWeeklyStats = async (monitorId, userId, weekStart, weekEnd) => {
  const mId = new mongoose.Types.ObjectId(monitorId);
  const uId = new mongoose.Types.ObjectId(userId);

  const stats = await CheckHistory.aggregate([
    {
      $match: {
        monitorId: mId,
        userId: uId,
        timestamp: { $gte: weekStart, $lte: weekEnd },
      },
    },
    {
      $group: {
        _id: null,
        totalChecks: { $sum: 1 },
        successfulChecks: { $sum: { $cond: ['$success', 1, 0] } },
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

  const incidentCount = await Incident.countDocuments({
    monitorId: mId,
    userId: uId,
    startTime: { $gte: weekStart, $lte: weekEnd },
  });

  const totalDowntime = await Incident.aggregate([
    {
      $match: {
        monitorId: mId,
        userId: uId,
        startTime: { $gte: weekStart, $lte: weekEnd },
        resolved: true,
      },
    },
    { $group: { _id: null, total: { $sum: '$duration' } } },
  ]);

  const data = stats[0] || { totalChecks: 0, successfulChecks: 0 };
  const uptimePercentage =
    data.totalChecks > 0
      ? Math.round((data.successfulChecks / data.totalChecks) * 10000) / 100
      : 0;

  return {
    uptimePercentage,
    totalChecks: data.totalChecks,
    successfulChecks: data.successfulChecks,
    failedChecks: data.totalChecks - data.successfulChecks,
    avgResponseTime: data.avgResponseTime ? Math.round(data.avgResponseTime) : null,
    minResponseTime: data.minResponseTime || null,
    maxResponseTime: data.maxResponseTime || null,
    incidentCount,
    totalDowntimeSeconds: totalDowntime[0]?.total || 0,
  };
};

module.exports = { generateAndSendWeeklyReports, computeWeeklyStats };
