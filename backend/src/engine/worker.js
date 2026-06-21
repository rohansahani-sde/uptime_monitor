const { performHttpCheck } = require('./httpChecker');
const { detectAndHandleIncident } = require('./incidentDetector');
const { dispatchAlerts } = require('./alertDispatcher');
const CheckHistory = require('../models/CheckHistory');
const Monitor = require('../models/Monitor');
const logger = require('../config/logger');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds between retries

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Perform a single check with retry logic
 * 3 retries before marking as down
 */
const performCheckWithRetry = async (monitor) => {
  let lastResult = null;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;
    const result = await performHttpCheck(monitor);

    if (result.success) {
      return { ...result, attempts: attempt };
    }

    lastResult = result;
    logger.debug(`Check attempt ${attempt}/${MAX_RETRIES} failed for ${monitor.url}: ${result.errorMessage}`);

    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS);
    }
  }

  return { ...lastResult, attempts: MAX_RETRIES };
};

/**
 * Process a single monitor check
 */
const processMonitorCheck = async (monitor) => {
  try {
    logger.debug(`Checking monitor: ${monitor.name} (${monitor.url})`);

    const checkResult = await performCheckWithRetry(monitor);

    // Determine if this is a slow response
    const isSlowResponse =
      checkResult.success &&
      checkResult.responseTime !== null &&
      monitor.threshold &&
      checkResult.responseTime > monitor.threshold;

    // Save check history
    const historyEntry = await CheckHistory.create({
      monitorId: monitor._id,
      userId: monitor.userId,
      timestamp: new Date(),
      responseTime: checkResult.responseTime,
      statusCode: checkResult.statusCode,
      success: checkResult.success && !isSlowResponse,
      result: isSlowResponse ? 'slow' : checkResult.result,
      errorMessage: checkResult.errorMessage,
      isSlowResponse,
    });

    // Update monitor aggregated stats
    await updateMonitorStats(monitor, checkResult, isSlowResponse);

    // Handle incident detection and resolution
    const incidentResult = await detectAndHandleIncident(monitor, checkResult, isSlowResponse);

    // Dispatch alerts if needed (premium users only)
    if (incidentResult.incidentCreated || incidentResult.incidentResolved) {
      await dispatchAlerts(monitor, incidentResult, checkResult);
    }

    logger.debug(
      `Monitor ${monitor.name}: ${checkResult.result.toUpperCase()} | ${checkResult.responseTime}ms | Status: ${checkResult.statusCode}`
    );

    return { success: true, checkResult, historyEntry };
  } catch (error) {
    logger.error(`Worker error processing monitor ${monitor._id}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Update monitor's aggregated statistics after each check
 */
const updateMonitorStats = async (monitor, checkResult, isSlowResponse) => {
  try {
    const newStatus = !checkResult.success
      ? 'down'
      : isSlowResponse
      ? 'slow'
      : 'up';

    const updatePayload = {
      status: newStatus,
      lastCheckedAt: new Date(),
      $inc: { totalChecks: 1 },
    };

    // Update response time stats only on successful, non-zero checks
    if (checkResult.success && checkResult.responseTime !== null && checkResult.responseTime > 0) {
      updatePayload['responseTimeStats.last'] = checkResult.responseTime;

      const current = monitor.responseTimeStats || {};
      const currentMin = current.min;
      const currentMax = current.max;
      const currentAvg = current.avg;
      const totalChecks = (monitor.totalChecks || 0) + 1;

      if (currentMin === null || currentMin === 0 || checkResult.responseTime < currentMin) {
        updatePayload['responseTimeStats.min'] = checkResult.responseTime;
      }
      if (currentMax === null || currentMax === 0 || checkResult.responseTime > currentMax) {
        updatePayload['responseTimeStats.max'] = checkResult.responseTime;
      }

      // Rolling average
      if (currentAvg === null || currentAvg === 0) {
        updatePayload['responseTimeStats.avg'] = checkResult.responseTime;
      } else {
        updatePayload['responseTimeStats.avg'] = Math.round(
          (currentAvg * (totalChecks - 1) + checkResult.responseTime) / totalChecks
        );
      }
    }

    if (!checkResult.success) {
      updatePayload.lastDownAt = new Date();
    }

    await Monitor.findByIdAndUpdate(monitor._id, updatePayload);

    // Recalculate uptime percentages (lightweight version using recent history)
    await recalculateUptimeStats(monitor._id);
  } catch (error) {
    logger.error(`Failed to update monitor stats for ${monitor._id}: ${error.message}`);
  }
};

/**
 * Recalculate uptime percentages from CheckHistory
 */
const recalculateUptimeStats = async (monitorId) => {
  try {
    const now = new Date();

    const periods = {
      last24Hours: new Date(now - 24 * 60 * 60 * 1000),
      last7Days: new Date(now - 7 * 24 * 60 * 60 * 1000),
      last30Days: new Date(now - 30 * 24 * 60 * 60 * 1000),
    };

    const uptimeUpdate = {};

    for (const [key, since] of Object.entries(periods)) {
      const CheckHistory = require('../models/CheckHistory');
      const stats = await CheckHistory.aggregate([
        { $match: { monitorId, timestamp: { $gte: since } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            successful: { $sum: { $cond: ['$success', 1, 0] } },
          },
        },
      ]);

      if (stats.length > 0 && stats[0].total > 0) {
        uptimeUpdate[`uptimeStats.${key}`] = Math.round((stats[0].successful / stats[0].total) * 10000) / 100;
      }
    }

    if (Object.keys(uptimeUpdate).length > 0) {
      await Monitor.findByIdAndUpdate(monitorId, uptimeUpdate);
    }
  } catch (error) {
    logger.error(`Failed to recalculate uptime for ${monitorId}: ${error.message}`);
  }
};

module.exports = { processMonitorCheck };
