const express = require('express');
const router = express.Router();
const statusController = require('../controllers/status.controller');

// Public — no auth required
router.get('/:slug', statusController.getPublicStatus);

module.exports = router;
