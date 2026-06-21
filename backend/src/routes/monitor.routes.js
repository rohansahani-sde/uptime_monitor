const express = require('express');
const router = express.Router();
const monitorController = require('../controllers/monitor.controller');
const { authenticate } = require('../middleware/auth');
const { checkMonitorLimit, checkIntervalAllowed } = require('../middleware/subscriptionGate');
const { validate, createMonitorValidator, updateMonitorValidator, mongoIdValidator } = require('../middleware/validate');

router.use(authenticate);

router.get('/', monitorController.getMonitors);
router.post('/', checkMonitorLimit, checkIntervalAllowed, createMonitorValidator, validate, monitorController.createMonitor);

router.get('/:id', mongoIdValidator('id'), validate, monitorController.getMonitor);
router.put('/:id', mongoIdValidator('id'), validate, checkIntervalAllowed, updateMonitorValidator, validate, monitorController.updateMonitor);
router.delete('/:id', mongoIdValidator('id'), validate, monitorController.deleteMonitor);

router.post('/:id/pause', mongoIdValidator('id'), validate, monitorController.pauseMonitor);
router.post('/:id/resume', mongoIdValidator('id'), validate, monitorController.resumeMonitor);
router.post('/:id/test', mongoIdValidator('id'), validate, monitorController.testNotification);

module.exports = router;
