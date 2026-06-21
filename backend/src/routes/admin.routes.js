const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id', adminController.updateUserPlan);
router.get('/monitors', adminController.getAllMonitors);
router.get('/incidents', adminController.getAllIncidents);
router.get('/analytics', adminController.getPlatformAnalytics);

module.exports = router;
