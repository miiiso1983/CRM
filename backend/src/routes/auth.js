const express = require('express');
const router = express.Router();
const { login, getMe, updateFCMToken, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/fcm-token', protect, updateFCMToken);
router.put('/change-password', protect, changePassword);

module.exports = router;

