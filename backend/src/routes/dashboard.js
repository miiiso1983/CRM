const express = require('express');
const router = express.Router();
const { getDashboard, exportLeads } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getDashboard);
router.get('/export', exportLeads);

module.exports = router;

