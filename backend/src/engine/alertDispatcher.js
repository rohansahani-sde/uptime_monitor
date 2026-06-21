const User = require('../models/User');
const emailService = require('../services/email.service');
const Incident = require('../models/Incident');
const logger = require('../config/logger');

/**
 * Dispatch alert emails for incident events
 * Only for premium users with email alerts enabled
 */
const dispatchAlerts = async (monitor, incidentResult, checkResult) => {
  try {
    const user = await User.findById(monitor.userId);

    if (!user) {
      logger.warn(`[AlertDispatcher] User not found for monitor ${monitor._id}`);
      return;
    }

    // Only premium users and admins get email alerts
    if (user.plan === 'free' && user.role !== 'admin') {
      return;
    }

    if (!monitor.notifyOnDown && !monitor.notifyOnRecover) {
      return;
    }

    if (incidentResult.incidentCreated && monitor.notifyOnDown) {
      // Don't send alert for slow responses unless explicitly enabled
      if (incidentResult.incident?.type === 'slow' && !monitor.notifyOnSlow) {
        return;
      }

      await emailService.sendDownAlert({
        to: user.email,
        monitorName: monitor.name,
        monitorUrl: monitor.url,
        errorMessage: checkResult.errorMessage || `HTTP ${checkResult.statusCode}`,
        incidentTime: incidentResult.incident.startTime,
        statusCode: checkResult.statusCode,
        incidentId: incidentResult.incident._id,
      });

      // Mark alert as sent
      if (incidentResult.incident._id) {
        await Incident.findByIdAndUpdate(incidentResult.incident._id, { alertSent: true });
      }

      logger.info(`[AlertDispatcher] Down alert sent for ${monitor.name} to ${user.email}`);
    }

    if (incidentResult.incidentResolved && monitor.notifyOnRecover) {
      await emailService.sendRecoveryAlert({
        to: user.email,
        monitorName: monitor.name,
        monitorUrl: monitor.url,
        downtimeDuration: incidentResult.incident.duration,
        recoveryTime: incidentResult.incident.endTime,
      });

      if (incidentResult.incident._id) {
        await Incident.findByIdAndUpdate(incidentResult.incident._id, { recoveryAlertSent: true });
      }

      logger.info(`[AlertDispatcher] Recovery alert sent for ${monitor.name} to ${user.email}`);
    }
  } catch (error) {
    logger.error(`[AlertDispatcher] Failed to dispatch alert for monitor ${monitor._id}: ${error.message}`);
  }
};

module.exports = { dispatchAlerts };
