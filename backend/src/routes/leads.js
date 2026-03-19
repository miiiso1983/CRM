const express = require('express');
const router = express.Router();
const {
  getLeads, searchByPhone, createLead, updateLead,
  transferLead, addActivity, getLead,
} = require('../controllers/leadsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/search', searchByPhone);
router.get('/', getLeads);
router.post('/', authorize('sales', 'admin'), createLead);
router.get('/:id', getLead);
router.put('/:id', updateLead);
router.post('/:id/transfer', authorize('sales', 'admin'), transferLead);
router.post('/:id/activities', addActivity);

module.exports = router;

