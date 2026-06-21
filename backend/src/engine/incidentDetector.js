const Incident = require('../models/Incident');
const Monitor = require('../models/Monitor');
const logger = require('../config/logger');

/**
 * Detect incidents from check results and create/resolve accordingly
 * Returns { incidentCreated, incidentResolved, incident }
 */
const detectAndHandleIncident = async (monitor, checkResult, isSlowResponse) => {
  const result = { incidentCreated: false, incidentResolved: false, incident: null };

  const isDown = !checkResult.success;
  const isSlow = checkResult.success && isSlowResponse;

  try {
    if (isDown || isSlow) {
      // Check if there's already an active incident
      if (!monitor.activeIncidentId) {
        const incidentType = isSlow ? 'slow' : checkResult.result;
        const rootCause = getRootCause(checkResult, isSlowResponse, monitor);

        const incident = await Incident.create({
          monitorId: monitor._id,
          userId: monitor.userId,
          type: incidentType,
          startTime: new Date(),
          rootCause,
          statusCode: checkResult.statusCode,
          errorMessage: checkResult.errorMessage,
          resolved: false,
        });

        // Link incident to monitor
        await Monitor.findByIdAndUpdate(monitor._id, {
          activeIncidentId: incident._id,
          $inc: { incidentCount: 1 },
        });

        result.incidentCreated = true;
        result.incident = incident;
        logger.warn(`[IncidentDetector] Incident created for ${monitor.name}: ${incidentType}`);
      }
      // else: ongoing incident, no action needed
    } else {
      // Check is successful — resolve any active incident
      if (monitor.activeIncidentId) {
        const now = new Date();
        const incident = await Incident.findById(monitor.activeIncidentId);

        if (incident && !incident.resolved) {
          const durationSeconds = Math.round((now - incident.startTime) / 1000);

          await Incident.findByIdAndUpdate(monitor.activeIncidentId, {
            resolved: true,
            endTime: now,
            duration: durationSeconds,
          });

          // Clear active incident from monitor
          await Monitor.findByIdAndUpdate(monitor._id, {
            activeIncidentId: null,
          });

          result.incidentResolved = true;
          result.incident = { ...incident.toObject(), endTime: now, duration: durationSeconds, resolved: true };
          logger.info(`[IncidentDetector] Incident resolved for ${monitor.name} after ${durationSeconds}s`);
        }
      }
    }
  } catch (error) {
    logger.error(`[IncidentDetector] Error processing incident for ${monitor._id}: ${error.message}`);
  }

  return result;
};

/**
 * Generate a human-readable root cause description
 */
const getRootCause = (checkResult, isSlowResponse, monitor) => {
  if (isSlowResponse) {
    return `Response time ${checkResult.responseTime}ms exceeded threshold of ${monitor.threshold}ms`;
  }

  switch (checkResult.result) {
    case 'timeout':
      return `Request timed out after ${checkResult.responseTime}ms`;
    case 'dns_error':
      return `DNS resolution failed — ${checkResult.errorMessage}`;
    case 'down':
      return checkResult.statusCode
        ? `HTTP ${checkResult.statusCode} server error`
        : `Connection refused by host`;
    case 'error':
      return checkResult.errorMessage || 'Unknown connection error';
    default:
      return checkResult.errorMessage || 'Service unavailable';
  }
};

module.exports = { detectAndHandleIncident };
