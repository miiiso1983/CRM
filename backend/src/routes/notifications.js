const express = require('express');
const router = express.Router();
const { getNotifications, markAllRead, markRead, clearNotifications } = require('../controllers/notificationsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.put('/mark-all-read', markAllRead);
router.put('/:id/read', markRead);
router.delete('/clear', clearNotifications);

module.exports = router;

