const express = require('express');
const router = express.Router();
const { getSystemStatus } = require('../controllers/statusController');

// GET /status - Get system status
router.get('/', getSystemStatus);

module.exports = router;