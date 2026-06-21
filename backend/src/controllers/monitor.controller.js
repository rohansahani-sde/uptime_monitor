const monitorService = require('../services/monitor.service');
const { triggerImmediateCheck } = require('../engine/scheduler');

const getMonitors = async (req, res, next) => {
  try {
    const monitors = await monitorService.getMonitorsByUser(req.user._id, req.query);
    res.json({ success: true, data: { monitors } });
  } catch (error) {
    next(error);
  }
};

const getMonitor = async (req, res, next) => {
  try {
    const monitor = await monitorService.getMonitorById(req.params.id, req.user._id);
    res.json({ success: true, data: { monitor } });
  } catch (error) {
    next(error);
  }
};

const createMonitor = async (req, res, next) => {
  try {
    const monitor = await monitorService.createMonitor(req.user._id, req.body, req.user.plan);
    res.status(201).json({ success: true, message: 'Monitor created successfully', data: { monitor } });
  } catch (error) {
    next(error);
  }
};

const updateMonitor = async (req, res, next) => {
  try {
    const monitor = await monitorService.updateMonitor(req.params.id, req.user._id, req.body, req.user.plan);
    res.json({ success: true, message: 'Monitor updated successfully', data: { monitor } });
  } catch (error) {
    next(error);
  }
};

const deleteMonitor = async (req, res, next) => {
  try {
    await monitorService.deleteMonitor(req.params.id, req.user._id);
    res.json({ success: true, message: 'Monitor deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const pauseMonitor = async (req, res, next) => {
  try {
    const monitor = await monitorService.pauseMonitor(req.params.id, req.user._id);
    res.json({ success: true, message: 'Monitor paused', data: { monitor } });
  } catch (error) {
    next(error);
  }
};

const resumeMonitor = async (req, res, next) => {
  try {
    const monitor = await monitorService.resumeMonitor(req.params.id, req.user._id);
    res.json({ success: true, message: 'Monitor resumed', data: { monitor } });
  } catch (error) {
    next(error);
  }
};

const testNotification = async (req, res, next) => {
  try {
    const monitor = await monitorService.getMonitorById(req.params.id, req.user._id);
    await triggerImmediateCheck(monitor);
    res.json({ success: true, message: 'Test check triggered successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMonitors, getMonitor, createMonitor, updateMonitor,
  deleteMonitor, pauseMonitor, resumeMonitor, testNotification,
};
