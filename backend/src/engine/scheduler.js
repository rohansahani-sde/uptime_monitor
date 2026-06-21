const cron = require('node-cron');
const Monitor = require('../models/Monitor');
const { processMonitorCheck } = require('./worker');
const logger = require('../config/logger');

// Map of intervalMinutes -> cron job
const cronJobs = new Map();
// Set of monitorIds currently being checked (prevent overlapping)
const activeChecks = new Set();

/**
 * Cron expression for a given interval in minutes
 */
const toCronExpression = (intervalMinutes) => {
  return `*/${intervalMinutes} * * * *`;
};

/**
 * Run checks for all active monitors at a given interval
 */
const runChecksForInterval = async (intervalMinutes) => {
  try {
    const monitors = await Monitor.find({
      interval: intervalMinutes,
      isPaused: false,
    }).lean();

    if (monitors.length === 0) return;

    logger.info(`[Scheduler] Running ${monitors.length} checks for ${intervalMinutes}-min interval`);

    // Process checks concurrently but limit concurrency
    const CONCURRENCY = 10;
    for (let i = 0; i < monitors.length; i += CONCURRENCY) {
      const batch = monitors.slice(i, i + CONCURRENCY);
      await Promise.allSettled(
        batch.map(async (monitor) => {
          if (activeChecks.has(monitor._id.toString())) {
            logger.debug(`Skipping ${monitor.name} — check already in progress`);
            return;
          }

          activeChecks.add(monitor._id.toString());
          try {
            await processMonitorCheck(monitor);
          } finally {
            activeChecks.delete(monitor._id.toString());
          }
        })
      );
    }
  } catch (error) {
    logger.error(`[Scheduler] Error running interval ${intervalMinutes}: ${error.message}`);
  }
};

/**
 * Start the monitoring scheduler
 * Creates separate cron jobs for each supported interval
 */
const startScheduler = () => {
  const intervals = [1, 2, 3, 5, 10];

  intervals.forEach((intervalMinutes) => {
    if (cronJobs.has(intervalMinutes)) return;

    const expression = toCronExpression(intervalMinutes);

    const job = cron.schedule(expression, () => {
      runChecksForInterval(intervalMinutes);
    });

    cronJobs.set(intervalMinutes, job);
    logger.info(`[Scheduler] Started cron for ${intervalMinutes}-min interval: ${expression}`);
  });

  // Weekly report cron — every Monday at 8:00 AM
  const weeklyReportJob = cron.schedule('0 8 * * 1', async () => {
    const { generateAndSendWeeklyReports } = require('../services/weekly.service');
    logger.info('[Scheduler] Running weekly report generation');
    await generateAndSendWeeklyReports();
  });
  cronJobs.set('weekly', weeklyReportJob);

  logger.info('[Scheduler] Monitoring engine started successfully');
};

/**
 * Stop all cron jobs
 */
const stopScheduler = () => {
  for (const [key, job] of cronJobs) {
    job.stop();
    logger.info(`[Scheduler] Stopped cron job: ${key}`);
  }
  cronJobs.clear();
};

/**
 * Trigger an immediate check for a single monitor (for testing)
 */
const triggerImmediateCheck = async (monitor) => {
  return processMonitorCheck(monitor);
};

module.exports = { startScheduler, stopScheduler, triggerImmediateCheck };
