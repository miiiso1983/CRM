const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getLeads, searchByPhone, createLead, updateLead,
  transferLead, addActivity, getLead, bulkCreateLeads,
} = require('../controllers/leadsController');
const { protect, authorize } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم. يرجى رفع ملف CSV أو Excel'));
    }
  },
});

router.use(protect);

router.get('/search', searchByPhone);
router.get('/', getLeads);
router.post('/', authorize('sales', 'admin'), createLead);
router.post('/bulk-upload', authorize('sales', 'admin'), upload.single('file'), bulkCreateLeads);
router.get('/:id', getLead);
router.put('/:id', updateLead);
router.post('/:id/transfer', authorize('sales', 'admin'), transferLead);
router.post('/:id/activities', addActivity);

module.exports = router;

