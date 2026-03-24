const express = require('express');
const router = express.Router();
const { getUsers, createUser, getUser, updateUser, deleteUser, getManagers, getRoles } = require('../controllers/usersController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/managers', getManagers);
router.get('/roles', getRoles);
router.get('/', authorize('admin', 'manager'), getUsers);
router.post('/', authorize('admin'), createUser);
router.get('/:id', authorize('admin', 'manager'), getUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;

