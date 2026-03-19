const express = require('express');
const router = express.Router();
const { getMeetings, createMeeting, updateMeeting, getCalendarEvents, deleteMeeting } = require('../controllers/meetingsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/calendar', getCalendarEvents);
router.get('/', getMeetings);
router.post('/', authorize('manager', 'admin'), createMeeting);
router.put('/:id', authorize('manager', 'admin'), updateMeeting);
router.delete('/:id', authorize('manager', 'admin'), deleteMeeting);

module.exports = router;

