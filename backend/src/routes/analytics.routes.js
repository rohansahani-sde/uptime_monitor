const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/:monitorId/response-time', analyticsController.getResponseTime);
router.get('/:monitorId/uptime', analyticsController.getUptimeStats);
router.get('/:monitorId/bars', analyticsController.getUptimeBars);
router.get('/:monitorId/incidents', analyticsController.getIncidents);
router.get('/platform/stats', authorize('admin'), analyticsController.getPlatformStats);

module.exports = router;
