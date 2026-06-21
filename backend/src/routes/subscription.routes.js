const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', subscriptionController.getSubscription);
router.post('/upgrade', subscriptionController.upgradeToPremium);
router.post('/cancel', subscriptionController.cancelSubscription);

module.exports = router;
