const monitorService = require('../services/monitor.service');
const analyticsService = require('../services/analytics.service');
const CheckHistory = require('../models/CheckHistory');

/**
 * Public status page — no auth required
 */
const getPublicStatus = async (req, res, next) => {
  try {
    const monitor = await monitorService.getMonitorBySlug(req.params.slug);

    // Only expose safe fields
    const publicMonitor = {
      name: monitor.name,
      url: monitor.url,
      type: monitor.type,
      status: monitor.status,
      uptimeStats: monitor.uptimeStats,
      responseTimeStats: monitor.responseTimeStats,
      lastCheckedAt: monitor.lastCheckedAt,
      createdAt: monitor.createdAt,
    };

    // Get recent incidents (last 10, resolved only for public)
    const { incidents } = await analyticsService.getIncidents(monitor._id, monitor.userId, {
      limit: 10,
    });

    // Get 24h uptime bars
    const bars = await analyticsService.getUptimeBars(monitor._id, monitor.userId);

    // Get last 24h response time
    const responseHistory = await analyticsService.getResponseTimeHistory(monitor._id, monitor.userId, 24);

    res.json({
      success: true,
      data: {
        monitor: publicMonitor,
        incidents,
        uptimeBars: bars,
        responseHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPublicStatus };
