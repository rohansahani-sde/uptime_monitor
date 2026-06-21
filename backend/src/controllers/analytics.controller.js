const analyticsService = require('../services/analytics.service');

const getResponseTime = async (req, res, next) => {
  try {
    const hours = parseInt(req.query.hours, 10) || 24;
    const data = await analyticsService.getResponseTimeHistory(
      req.params.monitorId,
      req.user._id,
      hours
    );
    res.json({ success: true, data: { history: data } });
  } catch (error) {
    next(error);
  }
};

const getUptimeStats = async (req, res, next) => {
  try {
    const stats = await analyticsService.getUptimeStats(req.params.monitorId, req.user._id);
    res.json({ success: true, data: { stats } });
  } catch (error) {
    next(error);
  }
};

const getUptimeBars = async (req, res, next) => {
  try {
    const bars = await analyticsService.getUptimeBars(req.params.monitorId, req.user._id);
    res.json({ success: true, data: { bars } });
  } catch (error) {
    next(error);
  }
};

const getIncidents = async (req, res, next) => {
  try {
    const { page, limit, resolved } = req.query;
    const result = await analyticsService.getIncidents(req.params.monitorId, req.user._id, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      resolved: resolved !== undefined ? resolved === 'true' : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getPlatformStats = async (req, res, next) => {
  try {
    const stats = await analyticsService.getPlatformStats();
    res.json({ success: true, data: { stats } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getResponseTime, getUptimeStats, getUptimeBars, getIncidents, getPlatformStats };
